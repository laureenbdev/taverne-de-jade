import React from 'react';
import { useTranslation } from 'react-i18next';

import AuthModal from '../../components/auth-modal/auth-modal.tsx';
import { useAuth } from './AuthContext.tsx';
import './prelaunch-auth-gate.scss';

/**
 * TODO(prelaunch): supprimer ce fichier et son import dans App.tsx
 * avant la mise en ligne publique (accès libre aux non-connectés).
 */
const PrelaunchAuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const { t } = useTranslation();
	const { session, loading, configured } = useAuth();

	// TODO(prelaunch): supprimer tout ce bloc de garde — ne garder que `return <>{children}</>`
	if (loading) {
		return (
			<div className="prelaunch-auth-gate" aria-busy="true">
				<p className="prelaunch-auth-gate__status">{t('auth.gate.loading')}</p>
			</div>
		);
	}

	if (!session) {
		return (
			<div className="prelaunch-auth-gate">
				<div className="prelaunch-auth-gate__panel">
					<span className="prelaunch-auth-gate__logo" aria-hidden="true" />
					<h1>La Taverne de Jade</h1>
					<p className="prelaunch-auth-gate__lede">{t('auth.gate.lede')}</p>
					{!configured && (
						<p className="prelaunch-auth-gate__error">{t('auth.errors.notConfigured')}</p>
					)}
				</div>
				{/* TODO(prelaunch): supprimer AuthModal forcé (locked) avec ce gate */}
				{configured && (
					<AuthModal mode="signIn" locked onClose={() => undefined} />
				)}
			</div>
		);
	}

	return <>{children}</>;
};

export default PrelaunchAuthGate;
