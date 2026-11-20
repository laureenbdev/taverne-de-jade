import React from 'react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { useAuth } from '../auth/AuthContext.tsx';

const AdminGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const { t } = useTranslation();
	const { session, loading, isAdmin } = useAuth();

	if (loading) {
		return (
			<div className="page" aria-busy="true">
				<p>{t('common.loading')}</p>
			</div>
		);
	}

	if (!session || !isAdmin) {
		return <Navigate to="/" replace />;
	}

	return <>{children}</>;
};

export default AdminGate;
