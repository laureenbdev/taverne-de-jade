import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '../features/auth/AuthContext.tsx';
import { PlannedCharacter, withRaisedTargets } from '../features/planner/materials.ts';
import { deletePlanner, insertPlanner, listPlanner, updatePlanner } from '../services/planner/plannerRemote.ts';
import { PlannerStorageService } from '../services/planner/plannerStorage.ts';

/**
 * Personnages du planificateur : compte connecté en base, sinon dans le navigateur.
 */
export const usePlanner = () => {
	const { session, loading: authLoading } = useAuth();
	const userId = session?.user.id ?? null;
	const [plans, setPlans] = useState<PlannedCharacter[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [loadError, setLoadError] = useState<string | null>(null);

	useEffect(() => {
		if (authLoading) return;
		let cancelled = false;

		const load = async () => {
			setIsLoading(true);
			try {
				const loaded = userId
					? await listPlanner(userId)
					: PlannerStorageService.getAll();
				if (!cancelled) {
					setPlans(loaded);
					setLoadError(null);
				}
			} catch (error) {
				console.error('Erreur lors du chargement du planificateur:', error);
				if (!cancelled) {
					setPlans([]);
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

	const addCharacter = useCallback(async (plan: PlannedCharacter) => {
		const next = withRaisedTargets(plan);
		try {
			if (userId) await insertPlanner(userId, next);
			else {
				const stored = PlannerStorageService.getAll().filter((item) => item.characterId !== next.characterId);
				stored.push(next);
				PlannerStorageService.saveAll(stored);
			}
			setPlans((prev) => [...prev.filter((item) => item.characterId !== next.characterId), next]);
		} catch (error) {
			console.error('Erreur lors de l\'ajout du personnage:', error);
			throw error;
		}
	}, [userId]);

	const updateLevels = useCallback(async (plan: PlannedCharacter) => {
		const next = withRaisedTargets(plan);
		try {
			if (userId) await updatePlanner(userId, next);
			else {
				const stored = PlannerStorageService.getAll().map((item) => (
					item.characterId === next.characterId ? next : item
				));
				PlannerStorageService.saveAll(stored);
			}
			setPlans((prev) => prev.map((item) => (item.characterId === next.characterId ? next : item)));
		} catch (error) {
			console.error('Erreur lors de la mise à jour du personnage:', error);
			throw error;
		}
	}, [userId]);

	const removeCharacter = useCallback(async (characterId: string) => {
		try {
			if (userId) await deletePlanner(userId, characterId);
			else PlannerStorageService.saveAll(PlannerStorageService.getAll().filter((item) => item.characterId !== characterId));
			setPlans((prev) => prev.filter((item) => item.characterId !== characterId));
		} catch (error) {
			console.error('Erreur lors du retrait du personnage:', error);
			throw error;
		}
	}, [userId]);

	return { plans, isLoading, loadError, addCharacter, updateLevels, removeCharacter };
};
