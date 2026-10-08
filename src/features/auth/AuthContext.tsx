import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';

import i18n from '../../i18n.js';
import { supabase } from '../../lib/supabase.js';
import { isPlayerServer, PlayerProfile } from '../profile/types.ts';

type Language = 'en' | 'fr';

interface AuthContextValue {
	session: Session | null;
	loading: boolean;
	configured: boolean;
	profile: PlayerProfile;
	signIn: (email: string, password: string) => Promise<string | null>;
	signUp: (email: string, password: string, displayName: string) => Promise<{ error: string | null; needsConfirmation: boolean }>;
	signOut: () => Promise<string | null>;
	saveProfile: (profile: PlayerProfile) => Promise<string | null>;
	setLanguage: (language: Language) => Promise<string | null>;
}

const SETTINGS_KEY = 'taverne-settings';

const emptyProfile: PlayerProfile = { displayName: '', uid: '', server: '' };

function readLocalProfile(): PlayerProfile {
	try {
		const raw = localStorage.getItem(SETTINGS_KEY);
		if (!raw) return emptyProfile;
		const parsed = JSON.parse(raw) as Partial<PlayerProfile>;
		return {
			displayName: typeof parsed.displayName === 'string' ? parsed.displayName : '',
			uid: typeof parsed.uid === 'string' ? parsed.uid : '',
			server: isPlayerServer(parsed.server) ? parsed.server : '',
		};
	} catch {
		return emptyProfile;
	}
}

function writeLocalProfile(next: PlayerProfile) {
	localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
}

function readMetaString(meta: Record<string, unknown>, key: string) {
	const value = meta[key];
	return typeof value === 'string' ? value.trim() : '';
}

function readDisplayName(user: { user_metadata?: Record<string, unknown> } | null | undefined) {
	const meta = user?.user_metadata ?? {};
	return readMetaString(meta, 'display_name')
		|| readMetaString(meta, 'name')
		|| readMetaString(meta, 'displayName')
		|| readMetaString(meta, 'pseudo');
}

const AuthContext = createContext<AuthContextValue | null>(null);

function translateAuthError(message: string) {
	const normalized = message.toLowerCase();
	if (normalized.includes('invalid login')) return i18n.t('auth.errors.invalidCredentials');
	if (normalized.includes('already registered') || normalized.includes('already been registered')) {
		return i18n.t('auth.errors.alreadyRegistered');
	}
	if (normalized.includes('email not confirmed')) return i18n.t('auth.errors.emailNotConfirmed');
	return message;
}

function readProfileRow(
	row: { uid?: string | null; server?: string | null } | null,
	displayName: string,
): PlayerProfile {
	if (!row) return { ...emptyProfile, displayName };
	return {
		displayName,
		uid: typeof row.uid === 'string' ? row.uid : '',
		server: isPlayerServer(row.server) ? row.server : '',
	};
}

function readLanguage(value: unknown): Language | null {
	if (value === 'en' || value === 'fr') return value;
	return null;
}

type ProfileRow = {
	uid?: string | null;
	server?: string | null;
	language?: string | null;
	display_name?: string | null;
};

function profileError(message: string) {
	if (message.includes('profiles') && /does not exist|schema cache/i.test(message)) {
		return i18n.t('settings.tableMissing');
	}
	return message;
}

function isMissingColumn(message: string, column: string) {
	return message.includes(column) && /schema cache|does not exist|could not find/i.test(message);
}

function currentLanguage(): Language {
	return (i18n.resolvedLanguage || 'en').startsWith('fr') ? 'fr' : 'en';
}

function applyLanguage(language: Language) {
	if (currentLanguage() !== language) {
		void i18n.changeLanguage(language);
	}
	localStorage.setItem('taverne-lang', language);
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [session, setSession] = useState<Session | null>(null);
	const [profile, setProfile] = useState<PlayerProfile>(readLocalProfile);
	const [loading, setLoading] = useState(Boolean(supabase));
	const profileRequest = useRef(0);
	const profileRevision = useRef(0);

	const applySession = useCallback(async (next: Session | null) => {
		const requestId = ++profileRequest.current;
		const revisionAtStart = profileRevision.current;
		setSession(next);
		if (!supabase || !next) {
			if (requestId !== profileRequest.current || revisionAtStart !== profileRevision.current) return;
			setProfile(readLocalProfile());
			return;
		}

		const metaName = readDisplayName(next.user);
		const withName = await supabase
			.from('profiles')
			.select('uid, server, language, display_name')
			.eq('id', next.user.id)
			.maybeSingle();

		let row = withName.data as ProfileRow | null;
		let rowError = withName.error;
		if (rowError && isMissingColumn(rowError.message, 'display_name')) {
			const fallback = await supabase
				.from('profiles')
				.select('uid, server, language')
				.eq('id', next.user.id)
				.maybeSingle();
			row = fallback.data;
			rowError = fallback.error;
		}

		if (requestId !== profileRequest.current || revisionAtStart !== profileRevision.current) return;

		const local = readLocalProfile();
		const rowName = typeof row?.display_name === 'string' ? row.display_name.trim() : '';
		const displayName = rowName || metaName || local.displayName;

		if (rowError || !row) {
			setProfile({ ...local, displayName });
			return;
		}

		const remote = readProfileRow(row, displayName);
		setProfile(remote);
		writeLocalProfile(remote);
		const language = readLanguage(row.language);
		if (language) applyLanguage(language);
	}, []);

	useEffect(() => {
		if (!supabase) return;

		let active = true;

		supabase.auth.getSession().then(({ data }) => {
			if (!active) return;
			applySession(data.session);
			setLoading(false);
		});

		const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
			setTimeout(() => {
				if (!active) return;
				void applySession(nextSession);
			}, 0);
			setLoading(false);
		});

		return () => {
			active = false;
			data.subscription.unsubscribe();
		};
	}, [applySession]);

	const signIn = useCallback(async (email: string, password: string) => {
		if (!supabase) return i18n.t('auth.errors.notConfigured');
		const { error } = await supabase.auth.signInWithPassword({ email, password });
		return error ? translateAuthError(error.message) : null;
	}, []);

	const signUp = useCallback(async (email: string, password: string, displayName: string) => {
		if (!supabase) return { error: i18n.t('auth.errors.notConfigured'), needsConfirmation: false };
		const { data, error } = await supabase.auth.signUp({
			email,
			password,
			options: { data: { display_name: displayName, name: displayName } },
		});
		if (error) return { error: translateAuthError(error.message), needsConfirmation: false };

		if (data.session) {
			const { error: writeError } = await supabase.from('profiles').upsert({
				id: data.session.user.id,
				language: currentLanguage(),
				display_name: displayName,
			}, { onConflict: 'id' });
			if (writeError && !isMissingColumn(writeError.message, 'display_name')) {
				return { error: profileError(writeError.message), needsConfirmation: false };
			}
		}

		return { error: null, needsConfirmation: !data.session };
	}, []);

	const signOut = useCallback(async () => {
		if (!supabase) return i18n.t('auth.errors.notConfigured');
		const { error } = await supabase.auth.signOut();
		return error ? error.message : null;
	}, []);

	const writeProfile = useCallback(async (
		next: PlayerProfile,
		language: Language,
		includePlayer: boolean,
	) => {
		if (!supabase || !session) return i18n.t('auth.errors.notConfigured');

		const row: Record<string, unknown> = {
			id: session.user.id,
			language,
		};
		if (includePlayer) {
			row.uid = next.uid || null;
			row.server = next.server || null;
			row.display_name = next.displayName || null;
		}

		const { error } = await supabase.from('profiles').upsert(row, { onConflict: 'id' });
		if (error && includePlayer && isMissingColumn(error.message, 'display_name')) {
			delete row.display_name;
			const { error: fallbackError } = await supabase.from('profiles').upsert(row, { onConflict: 'id' });
			if (fallbackError) return profileError(fallbackError.message);
		} else if (error) {
			return profileError(error.message);
		}

		if (!includePlayer) return null;

		const { error: nameError } = await supabase.auth.updateUser({
			data: {
				display_name: next.displayName,
				name: next.displayName,
			},
		});
		return nameError ? nameError.message : null;
	}, [session]);

	const saveProfile = useCallback(async (next: PlayerProfile) => {
		profileRevision.current += 1;
		writeLocalProfile(next);
		try {
			if (!session) {
				setProfile(next);
				return null;
			}
			const error = await writeProfile(next, currentLanguage(), true);
			if (!error) {
				setProfile(next);
				writeLocalProfile(next);
			}
			return error;
		} finally {
			profileRevision.current += 1;
		}
	}, [session, writeProfile]);

	const setLanguage = useCallback(async (language: Language) => {
		applyLanguage(language);
		if (!session) return null;
		return writeProfile(profile, language, false);
	}, [profile, session, writeProfile]);

	const value = useMemo<AuthContextValue>(() => ({
		session,
		loading,
		configured: Boolean(supabase),
		profile,
		signIn,
		signUp,
		signOut,
		saveProfile,
		setLanguage,
	}), [session, loading, profile, signIn, signUp, signOut, saveProfile, setLanguage]);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
	const context = useContext(AuthContext);
	if (!context) throw new Error('useAuth must be used within AuthProvider');
	return context;
}

export type { Language };
