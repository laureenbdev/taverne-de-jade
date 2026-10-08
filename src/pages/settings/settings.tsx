import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { SignIn, UserPlus } from 'phosphor-react';

import AuthModal, { AuthMode } from '../../components/auth-modal/auth-modal.tsx';
import { useAuth } from '../../features/auth/AuthContext.tsx';
import { PLAYER_SERVERS, PlayerServer } from '../../features/profile/types.ts';
import './settings.scss';

const Settings: React.FC = () => {
	const { t, i18n } = useTranslation();
	const { session, loading, profile, signOut, saveProfile, setLanguage } = useAuth();
	const [authMode, setAuthMode] = useState<AuthMode | null>(null);
	const [signOutOpen, setSignOutOpen] = useState(false);
	const [displayName, setDisplayName] = useState(profile.displayName);
	const [uid, setUid] = useState(profile.uid);
	const [server, setServer] = useState<PlayerServer | ''>(profile.server);
	const [saving, setSaving] = useState(false);
	const [status, setStatus] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
	const dirty = useRef(false);
	const activeLanguage = i18n.resolvedLanguage?.startsWith('fr') ? 'fr' : 'en';
	const [language, setLanguageDraft] = useState<'en' | 'fr'>(activeLanguage);

	useEffect(() => {
		if (dirty.current) return;
		setDisplayName(profile.displayName);
		setUid(profile.uid);
		setServer(profile.server);
	}, [profile]);

	useEffect(() => {
		setLanguageDraft(activeLanguage);
	}, [activeLanguage]);

	const handleSave = async (event: React.FormEvent) => {
		event.preventDefault();
		setStatus(null);

		if (!session) {
			setSaving(true);
			const error = await setLanguage(language);
			setSaving(false);
			setStatus(error
				? { type: 'error', text: error }
				: { type: 'ok', text: i18n.t('settings.savedLocal', { lng: language }) });
			return;
		}

		const trimmedName = displayName.trim();
		if (trimmedName && (trimmedName.length < 2 || trimmedName.length > 24)) {
			setStatus({ type: 'error', text: t('auth.pseudoInvalid') });
			return;
		}

		const trimmedUid = uid.trim();
		if (!/^\d{9}$/.test(trimmedUid)) {
			setStatus({ type: 'error', text: t('settings.uidInvalid') });
			return;
		}
		if (!server) {
			setStatus({ type: 'error', text: t('settings.serverRequired') });
			return;
		}

		setSaving(true);
		const error = await saveProfile({ displayName: trimmedName, uid: trimmedUid, server });
		setSaving(false);
		if (!error) dirty.current = false;
		setStatus(error
			? { type: 'error', text: error }
			: { type: 'ok', text: t('settings.saved') });
	};

	useEffect(() => {
		if (!signOutOpen) return;
		const onKey = (event: KeyboardEvent) => {
			if (event.key === 'Escape') setSignOutOpen(false);
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [signOutOpen]);

	const handleSignOut = async () => {
		setSignOutOpen(false);
		setStatus(null);
		const error = await signOut();
		if (error) setStatus({ type: 'error', text: error });
	};

	return (
		<div id="settings-page" className="page">
			<section className="left">
				<div className="section-container settings-account-card">
					<h2>{t('settings.accountTitle')}</h2>
					<div className="settings-account">
						<p>{session?.user.email || t('settings.signedOut')}</p>
						{session ? (
							<button type="button" className="btn-ghost" onClick={() => setSignOutOpen(true)}>
								{t('settings.signOut')}
							</button>
						) : (
							<div className="settings-account-actions">
								<button type="button" className="btn-primary" onClick={() => setAuthMode('signIn')}>
									<SignIn size={18} />
									{t('auth.signIn')}
								</button>
								<button type="button" className="btn-ghost" onClick={() => setAuthMode('signUp')}>
									<UserPlus size={18} />
									{t('auth.signUp')}
								</button>
							</div>
						)}
					</div>
					{!session && <p className="settings-local-note">{t('settings.localNote')}</p>}
				</div>

				<div className="section-container">
					<h2>{t('settings.title')}</h2>
					<form className="settings-list" onSubmit={(event) => void handleSave(event)}>
						{session && (
						<div className="setting-row">
							<label htmlFor="player-pseudo">{t('settings.pseudo')}</label>
							<input
								id="player-pseudo"
								type="text"
								autoComplete="nickname"
								maxLength={24}
								value={displayName}
								onChange={(event) => {
									dirty.current = true;
									setDisplayName(event.target.value);
									setStatus(null);
								}}
							/>
						</div>
						)}

						{!session && (
						<div className="setting-row">
							<label htmlFor="player-language">{t('settings.language')}</label>
							<select
								id="player-language"
								value={language}
								onChange={(event) => {
									setLanguageDraft(event.target.value as 'en' | 'fr');
									setStatus(null);
								}}
							>
								<option value="en">English</option>
								<option value="fr">Français</option>
							</select>
						</div>
						)}

						{session && (
						<>
						<div className="setting-row">
							<label htmlFor="player-uid">{t('settings.uid')}</label>
							<input
								id="player-uid"
								type="text"
								inputMode="numeric"
								autoComplete="off"
								maxLength={9}
								value={uid}
								placeholder="600000000"
								onChange={(event) => {
									dirty.current = true;
									setUid(event.target.value.replace(/\D/g, '').slice(0, 9));
									setStatus(null);
								}}
							/>
						</div>

						<div className="setting-row">
							<label htmlFor="player-server">{t('settings.server')}</label>
							<select
								id="player-server"
								value={server}
								onChange={(event) => {
									dirty.current = true;
									setServer(event.target.value as PlayerServer | '');
									setStatus(null);
								}}
							>
								<option value="">{t('settings.serverPlaceholder')}</option>
								{PLAYER_SERVERS.map((value) => (
									<option key={value} value={value}>
										{t(`settings.servers.${value}`)}
									</option>
								))}
							</select>
						</div>
						</>
						)}

						<div className="settings-actions">
							<button type="submit" className="btn-primary" disabled={saving || loading}>
								{t('common.save')}
							</button>
							{status && <p className={`settings-status ${status.type}`}>{status.text}</p>}
						</div>
					</form>
				</div>
			</section>

			<AuthModal mode={authMode} onClose={() => setAuthMode(null)} />
			{signOutOpen && createPortal(
				<div className="settings-confirm-overlay" onClick={() => setSignOutOpen(false)}>
					<div
						className="settings-confirm"
						role="dialog"
						aria-modal="true"
						aria-labelledby="sign-out-title"
						onClick={(event) => event.stopPropagation()}
					>
						<h2 id="sign-out-title">{t('settings.signOut')}</h2>
						<p>{t('settings.signOutConfirm')}</p>
						<div className="settings-confirm-actions">
							<button type="button" className="btn-ghost" onClick={() => setSignOutOpen(false)}>
								{t('common.cancel')}
							</button>
							<button type="button" className="btn-primary" onClick={() => void handleSignOut()}>
								{t('settings.signOut')}
							</button>
						</div>
					</div>
				</div>,
				document.body,
			)}
		</div>
	);
};

export default Settings;
