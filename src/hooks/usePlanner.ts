import { useCallback, useEffect, useRef, useState } from 'react';

import { useAuth } from '../features/auth/AuthContext.tsx';
import { farmingSignature, mergeSavedPlan, PlannedCharacter, withRaisedTargets } from '../features/planner/materials.ts';
import { deletePlanner, insertPlanner, listPlanner, updatePlanner } from '../services/planner/plannerRemote.ts';
import { PlannerStorageService } from '../services/planner/plannerStorage.ts';

function normalizePlan(plan: PlannedCharacter): PlannedCharacter {
	const raised = withRaisedTargets(plan);
	const signature = farmingSignature(raised);
	const stale = raised.taskSignature !== '' && raised.taskSignature !== signature;
	return {
		...raised,
		taskSignature: signature,
		checkedTasks: stale ? [] : raised.checkedTasks,
		done: stale ? false : raised.done,
	};
}

/**
 * Personnages du planificateur : compte connecté en base, sinon dans le navigateur.
 */
export const usePlanner = () => {
	const { session, loading: authLoading } = useAuth();
	const userId = session?.user.id ?? null;
	const [plans, setPlans] = useState<PlannedCharacter[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [loadError, setLoadError] = useState<string | null>(null);
	const plansRef = useRef<PlannedCharacter[]>([]);
	const chain = useRef(Promise.resolve());
	plansRef.current = plans;

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
					setPlans(loaded.map(normalizePlan));
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

	const savePlan = useCallback((plan: PlannedCharacter) => {
		const run = chain.current.then(async () => {
			const previous = plansRef.current.find((item) => item.characterId === plan.characterId);
			const next = mergeSavedPlan(previous, plan);
			if (userId) {
				if (previous) await updatePlanner(userId, next);
				else await insertPlanner(userId, next);
			} else {
				const stored = PlannerStorageService.getAll().filter((item) => item.characterId !== next.characterId);
				stored.push(next);
				PlannerStorageService.saveAll(stored);
			}
			const replaced = plansRef.current.some((item) => item.characterId === next.characterId)
				? plansRef.current.map((item) => (item.characterId === next.characterId ? next : item))
				: [...plansRef.current, next];
			plansRef.current = replaced;
			setPlans(replaced);
		});
		chain.current = run.then(() => undefined, () => undefined);
		return run;
	}, [userId]);

	const removeCharacter = useCallback(async (characterId: string) => {
		try {
			if (userId) await deletePlanner(userId, characterId);
			else PlannerStorageService.saveAll(PlannerStorageService.getAll().filter((item) => item.characterId !== characterId));
			const next = plansRef.current.filter((item) => item.characterId !== characterId);
			plansRef.current = next;
			setPlans(next);
		} catch (error) {
			console.error('Erreur lors du retrait du personnage:', error);
			throw error;
		}
	}, [userId]);

	return { plans, isLoading, loadError, savePlan, removeCharacter };
};
