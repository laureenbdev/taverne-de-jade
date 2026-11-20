import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { X } from 'phosphor-react';

import { useAuth } from '../../features/auth/AuthContext.tsx';
import { useModalPayload, useModalPresence } from '../../hooks/useModalPresence.ts';
import PasswordField from '../password-field/password-field.tsx';
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll.ts';
import './auth-modal.scss';

type AuthMode = 'signIn' | 'signUp';

interface AuthModalProps {
	mode: AuthMode | null;
	onClose: () => void;
	/** TODO(prelaunch): retirer `locked` avec le gate d'accès */
	locked?: boolean;
}

const AuthModal: React.FC<AuthModalProps> = ({ mode, onClose, locked = false }) => {
	const { t } = useTranslation();
	const { configured, signIn, signUp, requestPasswordReset } = useAuth();
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [pseudo, setPseudo] = useState('');
	const [message, setMessage] = useState('');
	const [messageIsError, setMessageIsError] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [resetBusy, setResetBusy] = useState(false);
	const open = Boolean(mode);
	const { present, shown } = useModalPresence(open);
	const activeMode = useModalPayload(mode, present);
	const isSignUp = activeMode === 'signUp';

	useEffect(() => {
		if (!mode) return;

		setEmail('');
		setPassword('');
		setPseudo('');
		setMessage('');

		if (locked) return undefined;

		const onKey = (event: KeyboardEvent) => {
			if (event.key === 'Escape') onClose();
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [mode, onClose, locked]);

	useLockBodyScroll(present && !locked);
	if (!present || !activeMode) return null;

	const handleSignIn = async () => {
		setSubmitting(true);
		setMessage('');
		const error = await signIn(email, password);
		setSubmitting(false);
		if (error) {
			setMessageIsError(true);
			setMessage(error);
		} else if (!locked) onClose();
	};

	const handleSignUp = async () => {
		const trimmedPseudo = pseudo.trim();
		if (trimmedPseudo.length < 2 || trimmedPseudo.length > 24) {
			setMessageIsError(true);
			setMessage(t('auth.pseudoInvalid'));
			return;
		}

		setSubmitting(true);
		setMessage('');
		const result = await signUp(email, password, trimmedPseudo);
		setSubmitting(false);
		if (result.error) {
			setMessageIsError(true);
			setMessage(result.error);
		} else if (result.needsConfirmation) {
			setMessageIsError(false);
			setMessage(t('auth.accountCreated'));
		} else if (!locked) onClose();
	};

	const handleReset = async () => {
		setMessage('');
		setResetBusy(true);
		const error = await requestPasswordReset(email);
		setResetBusy(false);
		if (error) {
			setMessageIsError(true);
			setMessage(error);
			return;
		}
		setMessageIsError(false);
		setMessage(t('auth.resetSent'));
	};

	const dialog = (
		<div
			className={[
				'auth-modal-overlay',
				'modal-layer',
				shown ? 'is-open' : '',
				locked ? 'auth-modal-overlay--locked' : '',
			].filter(Boolean).join(' ')}
			onClick={locked ? undefined : onClose}
		>
			<div
				className="auth-modal-content"
				role="dialog"
				aria-modal="true"
				aria-labelledby="auth-modal-title"
				onClick={(event) => event.stopPropagation()}
			>
				<div className="auth-modal-header">
					<h2 id="auth-modal-title">{isSignUp ? t('auth.signUp') : t('auth.title')}</h2>
					{!locked && (
						<button type="button" className="auth-modal-close" onClick={onClose} aria-label={t('common.close')}>
							<X size={24} />
						</button>
					)}
				</div>

				{!configured && <p className="auth-modal-message error">{t('auth.errors.notConfigured')}</p>}

				{configured && (
					<form
						className="auth-modal-form"
						onSubmit={(event) => {
							event.preventDefault();
							void (isSignUp ? handleSignUp() : handleSignIn());
						}}
					>
						<label>
							{t('auth.email')}
							<input
								type="email"
								value={email}
								autoComplete="email"
								required
								onChange={(event) => setEmail(event.target.value)}
							/>
						</label>
						{isSignUp && (
							<label>
								{t('auth.pseudo')}
								<input
									type="text"
									value={pseudo}
									autoComplete="nickname"
									maxLength={24}
									required
									onChange={(event) => setPseudo(event.target.value)}
								/>
								<span className="auth-modal-hint">{t('auth.pseudoHint')}</span>
							</label>
						)}
						<label>
							{t('auth.password')}
							<PasswordField
								value={password}
								autoComplete={isSignUp ? 'new-password' : 'current-password'}
								required
								minLength={6}
								onChange={(event) => setPassword(event.target.value)}
							/>
						</label>
						{!isSignUp && (
							<button
								type="button"
								className="auth-modal-reset"
								disabled={resetBusy || !email.trim()}
								onClick={() => void handleReset()}
							>
								{t('auth.forgotPassword')}
							</button>
						)}
						<div className="auth-modal-actions">
							<button type="submit" className="btn-submit" disabled={submitting}>
								{isSignUp ? t('auth.signUp') : t('auth.signIn')}
							</button>
						</div>
						{message && (
							<p className={`auth-modal-message${messageIsError ? ' error' : ''}`}>{message}</p>
						)}
					</form>
				)}
			</div>
		</div>
	);

	// TODO(prelaunch): le rendu inline `locked` peut repartir en portal-only une fois le gate retiré
	if (locked) return dialog;
	return createPortal(dialog, document.body);
};

export default AuthModal;
export type { AuthMode };
