import { supabase } from '../../lib/supabase.js';
import { impersonateUser } from '../../services/admin/adminRemote.ts';
import type { ImpersonationState } from './types.ts';

const STORAGE_KEY = 'taverne-impersonation';

export function readImpersonation(): ImpersonationState | null {
	try {
		const raw = sessionStorage.getItem(STORAGE_KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw) as Partial<ImpersonationState>;
		if (
			typeof parsed.adminAccessToken !== 'string'
			|| typeof parsed.adminRefreshToken !== 'string'
			|| typeof parsed.adminEmail !== 'string'
			|| typeof parsed.targetEmail !== 'string'
		) {
			return null;
		}
		return {
			adminAccessToken: parsed.adminAccessToken,
			adminRefreshToken: parsed.adminRefreshToken,
			adminEmail: parsed.adminEmail,
			targetEmail: parsed.targetEmail,
			targetDisplayName: typeof parsed.targetDisplayName === 'string' ? parsed.targetDisplayName : '',
		};
	} catch {
		return null;
	}
}

export function clearImpersonation() {
	sessionStorage.removeItem(STORAGE_KEY);
}

export function isImpersonating() {
	return Boolean(readImpersonation());
}

export async function startImpersonation(params: {
	userId: string;
	targetEmail: string;
	targetDisplayName: string;
}): Promise<string | null> {
	if (!supabase) return 'not_configured';

	const { data: sessionData } = await supabase.auth.getSession();
	const session = sessionData.session;
	if (!session?.access_token || !session.refresh_token) {
		return 'no_session';
	}

	const result = await impersonateUser(params.userId);
	if (result.error || !result.accessToken || !result.refreshToken) {
		return result.error || 'impersonate_failed';
	}

	const state: ImpersonationState = {
		adminAccessToken: session.access_token,
		adminRefreshToken: session.refresh_token,
		adminEmail: session.user.email || '',
		targetEmail: params.targetEmail,
		targetDisplayName: params.targetDisplayName,
	};
	sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));

	const { error: setError } = await supabase.auth.setSession({
		access_token: result.accessToken,
		refresh_token: result.refreshToken,
	});
	if (setError) {
		clearImpersonation();
		return setError.message;
	}
	return null;
}

export async function stopImpersonation(): Promise<string | null> {
	if (!supabase) return 'not_configured';
	const saved = readImpersonation();
	if (!saved) return null;

	const { error } = await supabase.auth.setSession({
		access_token: saved.adminAccessToken,
		refresh_token: saved.adminRefreshToken,
	});
	clearImpersonation();
	return error ? error.message : null;
}
