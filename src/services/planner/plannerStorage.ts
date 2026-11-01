import { planFromLegacy, PlannedCharacter } from '../../features/planner/materials.ts';

const STORAGE_KEY = 'planner_characters';

export class PlannerStorageService {
	static getAll(): PlannedCharacter[] {
		try {
			const data = localStorage.getItem(STORAGE_KEY);
			if (!data) return [];
			const parsed = JSON.parse(data) as Partial<PlannedCharacter>[];
			if (!Array.isArray(parsed)) return [];
			return parsed.flatMap((raw) => {
				const plan = planFromLegacy(raw);
				return plan ? [plan] : [];
			});
		} catch (error) {
			console.error('Erreur lors de la lecture du planificateur:', error);
			return [];
		}
	}

	static saveAll(plans: PlannedCharacter[]): void {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
	}
}
