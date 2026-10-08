import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { X } from 'phosphor-react';

import { useAuth } from '../../features/auth/AuthContext.tsx';
import './auth-modal.scss';

type AuthMode = 'signIn' | 'signUp';

interface AuthModalProps {
	mode: AuthMode | null;
	onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ mode, onClose }) => {
	const { t } = useTranslation();
	const { configured, signIn, signUp } = useAuth();
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [pseudo, setPseudo] = useState('');
	const [message, setMessage] = useState('');
	const [messageIsError, setMessageIsError] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const isSignUp = mode === 'signUp';

	useEffect(() => {
		if (!mode) return;

		setEmail('');
		setPassword('');
		setPseudo('');
		setMessage('');

		const onKey = (event: KeyboardEvent) => {
			if (event.key === 'Escape') onClose();
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [mode, onClose]);

	if (!mode) return null;

	const handleSignIn = async () => {
		setSubmitting(true);
		setMessage('');
		const error = await signIn(email, password);
		setSubmitting(false);
		if (error) {
			setMessageIsError(true);
			setMessage(error);
		} else onClose();
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
		} else onClose();
	};

	return createPortal(
		<div className="auth-modal-overlay" onClick={onClose}>
			<div
				className="auth-modal-content"
				role="dialog"
				aria-modal="true"
				aria-labelledby="auth-modal-title"
				onClick={(event) => event.stopPropagation()}
			>
				<div className="auth-modal-header">
					<h2 id="auth-modal-title">{isSignUp ? t('auth.signUp') : t('auth.title')}</h2>
					<button type="button" className="auth-modal-close" onClick={onClose} aria-label={t('common.close')}>
						<X size={24} />
					</button>
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
							<input
								type="password"
								value={password}
								autoComplete={isSignUp ? 'new-password' : 'current-password'}
								required
								minLength={6}
								onChange={(event) => setPassword(event.target.value)}
							/>
						</label>
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
		</div>,
		document.body,
	);
};

export default AuthModal;
export type { AuthMode };
