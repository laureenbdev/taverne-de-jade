const STORAGE_KEY = 'advancement_checked';

function normalize(raw: unknown): string[] {
	if (!Array.isArray(raw)) return [];
	const ids = raw.filter((id): id is string => typeof id === 'string' && id.trim() !== '');
	return [...new Set(ids)];
}

export class AdvancementStorageService {
	static getAll(): string[] {
		try {
			const data = localStorage.getItem(STORAGE_KEY);
			if (!data) return [];
			return normalize(JSON.parse(data));
		} catch (error) {
			console.error('Erreur lors de la lecture de la progression:', error);
			return [];
		}
	}

	static saveAll(ids: string[]): void {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(normalize(ids)));
	}
}
