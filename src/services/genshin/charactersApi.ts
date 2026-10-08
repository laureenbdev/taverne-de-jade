export interface Character {
	id: string;
	name: string;
	rarity: number;
	element: string;
	weapon: string;
	region: string;
	ascension_materials: {
		boss_drops: string;
		local_speciality: string;
		common_enemy_drops: string;
		talent_books: string;
		weekly_boss_drops: string;
	};
}

const API_URL = 'https://raw.githubusercontent.com/laureenbdev/genshin-api/main/characters.json';

/**
 * Service pour récupérer les personnages depuis l'API GitHub
 */
export class CharactersApiService {
	private static cache: Character[] | null = null;
	private static loadingPromise: Promise<Character[]> | null = null;

	/**
	 * Récupère tous les personnages depuis l'API
	 * Utilise un cache pour éviter les appels multiples
	 */
	static async getAll(): Promise<Character[]> {
		// Si déjà en cache, retourner le cache
		if (this.cache) {
			return this.cache;
		}

		// Si un chargement est déjà en cours, retourner la même promesse
		if (this.loadingPromise) {
			return this.loadingPromise;
		}

		// Lancer le chargement
		this.loadingPromise = fetch(API_URL)
			.then((response) => {
				if (!response.ok) {
					throw new Error(`Erreur HTTP: ${response.status}`);
				}
				return response.json();
			})
			.then((data: Character[]) => {
				this.cache = data;
				this.loadingPromise = null;
				return data;
			})
			.catch((error) => {
				this.loadingPromise = null;
				console.error('Erreur lors de la récupération des personnages:', error);
				throw error;
			});

		return this.loadingPromise;
	}

	/**
	 * Récupère uniquement les personnages 5☆
	 */
	static async get5StarCharacters(): Promise<Character[]> {
		const allCharacters = await this.getAll();
		return allCharacters.filter((char) => char.rarity === 5);
	}

	/**
	 * Vide le cache (utile pour forcer un rechargement)
	 */
	static clearCache(): void {
		this.cache = null;
		this.loadingPromise = null;
	}
}
