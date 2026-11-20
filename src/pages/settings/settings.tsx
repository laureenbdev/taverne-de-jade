import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { SignIn, UserPlus } from 'phosphor-react';

import AuthModal, { AuthMode } from '../../components/auth-modal/auth-modal.tsx';
import PasswordField from '../../components/password-field/password-field.tsx';
import SelectField from '../../components/select-field/select-field.tsx';
import { useAuth } from '../../features/auth/AuthContext.tsx';
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll.ts';
import { useModalPresence } from '../../hooks/useModalPresence.ts';
import { PLAYER_SERVERS, PlayerServer } from '../../features/profile/types.ts';
import './settings.scss';

const Settings: React.FC = () => {
	const { t, i18n } = useTranslation();
	const {
		session,
		loading,
		profile,
		signOut,
		saveProfile,
		updateEmail,
		updatePassword,
	} = useAuth();
	const [authMode, setAuthMode] = useState<AuthMode | null>(null);
	const [signOutOpen, setSignOutOpen] = useState(false);
	const signOutPresence = useModalPresence(signOutOpen);
	useLockBodyScroll(signOutPresence.present);
	const [displayName, setDisplayName] = useState(profile.displayName);
	const [uid, setUid] = useState(profile.uid);
	const [server, setServer] = useState<PlayerServer | ''>(profile.server);
	const [saving, setSaving] = useState(false);
	const [status, setStatus] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
	const dirty = useRef(false);

	const [emailDraft, setEmailDraft] = useState(session?.user.email || '');
	const [emailBusy, setEmailBusy] = useState(false);
	const [emailStatus, setEmailStatus] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

	const [currentPassword, setCurrentPassword] = useState('');
	const [nextPassword, setNextPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [passwordBusy, setPasswordBusy] = useState(false);
	const [passwordStatus, setPasswordStatus] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

	useEffect(() => {
		if (dirty.current) return;
		setDisplayName(profile.displayName);
		setUid(profile.uid);
		setServer(profile.server);
	}, [profile]);

	useEffect(() => {
		setEmailDraft(session?.user.email || '');
	}, [session?.user.email]);

	const handleSave = async (event: React.FormEvent) => {
		event.preventDefault();
		setStatus(null);

		if (!session) return;

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
			: { type: 'ok', text: i18n.t('settings.saved') });
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

	const handleEmailSave = async (event: React.FormEvent) => {
		event.preventDefault();
		setEmailStatus(null);
		setEmailBusy(true);
		const error = await updateEmail(emailDraft);
		setEmailBusy(false);
		setEmailStatus(error
			? { type: 'error', text: error }
			: { type: 'ok', text: t('settings.security.emailSent') });
	};

	const handlePasswordSave = async (event: React.FormEvent) => {
		event.preventDefault();
		setPasswordStatus(null);

		if (nextPassword !== confirmPassword) {
			setPasswordStatus({ type: 'error', text: t('settings.security.passwordMismatch') });
			return;
		}

		setPasswordBusy(true);
		const error = await updatePassword(currentPassword, nextPassword);
		setPasswordBusy(false);
		if (error) {
			setPasswordStatus({ type: 'error', text: error });
			return;
		}
		setCurrentPassword('');
		setNextPassword('');
		setConfirmPassword('');
		setPasswordStatus({ type: 'ok', text: t('settings.security.passwordUpdated') });
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

				{session && (
				<div className="section-container">
					<h2>{t('settings.title')}</h2>
					<form className="settings-list" onSubmit={(event) => void handleSave(event)}>
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
							<SelectField
								id="player-server"
								value={server}
								onChange={(next) => {
									dirty.current = true;
									setServer(next as PlayerServer | '');
									setStatus(null);
								}}
								options={[
									{ value: '', label: t('settings.serverPlaceholder') },
									...PLAYER_SERVERS.map((value) => ({
										value,
										label: t(`settings.servers.${value}`),
									})),
								]}
							/>
						</div>

						<div className="settings-actions">
							<button type="submit" className="btn-primary" disabled={saving || loading}>
								{t('common.save')}
							</button>
							{status && <p className={`settings-status ${status.type}`}>{status.text}</p>}
						</div>
					</form>
				</div>
				)}

				{session && (
					<div className="section-container settings-security">
						<h2>{t('settings.security.title')}</h2>
						<p className="settings-security-lede">{t('settings.security.lede')}</p>

						<form className="settings-list" onSubmit={(event) => void handleEmailSave(event)}>
							<div className="setting-row">
								<label htmlFor="account-email">{t('settings.security.email')}</label>
								<input
									id="account-email"
									type="email"
									autoComplete="email"
									value={emailDraft}
									onChange={(event) => {
										setEmailDraft(event.target.value);
										setEmailStatus(null);
									}}
								/>
							</div>
							<div className="settings-actions">
								<button type="submit" className="btn-primary" disabled={emailBusy}>
									{t('settings.security.updateEmail')}
								</button>
								{emailStatus && (
									<p className={`settings-status ${emailStatus.type}`}>{emailStatus.text}</p>
								)}
							</div>
						</form>

						<form className="settings-list" onSubmit={(event) => void handlePasswordSave(event)}>
							<div className="setting-row">
								<label htmlFor="current-password">{t('settings.security.currentPassword')}</label>
								<PasswordField
									id="current-password"
									autoComplete="current-password"
									value={currentPassword}
									onChange={(event) => {
										setCurrentPassword(event.target.value);
										setPasswordStatus(null);
									}}
								/>
							</div>
							<div className="setting-row">
								<label htmlFor="new-password">{t('settings.security.newPassword')}</label>
								<PasswordField
									id="new-password"
									autoComplete="new-password"
									minLength={8}
									value={nextPassword}
									onChange={(event) => {
										setNextPassword(event.target.value);
										setPasswordStatus(null);
									}}
								/>
							</div>
							<div className="setting-row">
								<label htmlFor="confirm-password">{t('settings.security.confirmPassword')}</label>
								<PasswordField
									id="confirm-password"
									autoComplete="new-password"
									minLength={8}
									value={confirmPassword}
									onChange={(event) => {
										setConfirmPassword(event.target.value);
										setPasswordStatus(null);
									}}
								/>
							</div>
							<div className="settings-actions">
								<button type="submit" className="btn-primary" disabled={passwordBusy}>
									{t('settings.security.updatePassword')}
								</button>
								{passwordStatus && (
									<p className={`settings-status ${passwordStatus.type}`}>{passwordStatus.text}</p>
								)}
							</div>
						</form>
					</div>
				)}
			</section>

			<AuthModal mode={authMode} onClose={() => setAuthMode(null)} />
			{signOutPresence.present && createPortal(
				<div
					className={`settings-confirm-overlay modal-layer${signOutPresence.shown ? ' is-open' : ''}`}
					onClick={() => setSignOutOpen(false)}
				>
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
