import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '../features/auth/AuthContext.tsx';
import { listAdvancement, saveAdvancement } from '../services/advancement/advancementRemote.ts';
import { AdvancementStorageService } from '../services/advancement/advancementStorage.ts';

/**
 * Cases cochées de la progression : compte connecté en base, sinon dans le navigateur.
 */
export const useAdvancement = () => {
	const { session, loading: authLoading } = useAuth();
	const userId = session?.user.id ?? null;
	const [checked, setChecked] = useState<Set<string>>(new Set());
	const [isLoading, setIsLoading] = useState(true);
	const [loadError, setLoadError] = useState<string | null>(null);

	useEffect(() => {
		if (authLoading) return;
		let cancelled = false;

		const load = async () => {
			setIsLoading(true);
			try {
				const loaded = userId
					? await listAdvancement(userId)
					: AdvancementStorageService.getAll();
				if (!cancelled) {
					setChecked(new Set(loaded));
					setLoadError(null);
				}
			} catch (error) {
				console.error('Erreur lors du chargement de la progression:', error);
				if (!cancelled) {
					setChecked(new Set());
					setLoadError(error instanceof Error ? error.message : null);
				}
			} finally {
				if (!cancelled) setIsLoading(false);
			}
		};

		void load();
		return () => {
			cancelled = true;
		};
	}, [authLoading, userId]);

	const toggle = useCallback(async (id: string) => {
		const next = new Set(checked);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		const ids = [...next];
		if (userId) await saveAdvancement(userId, ids);
		else AdvancementStorageService.saveAll(ids);
		setChecked(next);
	}, [checked, userId]);

	return { checked, isLoading, loadError, toggle };
};
