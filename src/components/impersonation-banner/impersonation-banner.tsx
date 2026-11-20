import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { readImpersonation, stopImpersonation } from '../../features/admin/impersonation.ts';
import type { ImpersonationState } from '../../features/admin/types.ts';
import './impersonation-banner.scss';

const ImpersonationBanner: React.FC = () => {
	const { t } = useTranslation();
	const [state, setState] = useState<ImpersonationState | null>(() => readImpersonation());
	const [busy, setBusy] = useState(false);

	useEffect(() => {
		const sync = () => setState(readImpersonation());
		window.addEventListener('storage', sync);
		const timer = window.setInterval(sync, 1500);
		return () => {
			window.removeEventListener('storage', sync);
			window.clearInterval(timer);
		};
	}, []);

	if (!state) return null;

	const handleStop = async () => {
		setBusy(true);
		await stopImpersonation();
		setBusy(false);
		setState(null);
	};

	const label = state.targetDisplayName || state.targetEmail;

	return (
		<div className="impersonation-banner" role="status">
			<p>
				{t('admin.impersonation.active', { name: label })}
			</p>
			<button type="button" disabled={busy} onClick={() => void handleStop()}>
				{t('admin.impersonation.stop')}
			</button>
		</div>
	);
};

export default ImpersonationBanner;
