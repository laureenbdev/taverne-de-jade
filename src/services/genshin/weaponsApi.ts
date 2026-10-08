export interface Weapon {
	id: string;
	name: string;
	type: string; // sword, bow, catalyst, claymore, polearm
	rarity: number;
	base_atk_lv90?: number;
	base_atk_lv1?: number;
	second_stat_lv90?: string;
	second_stat_lv1?: string;
	passive?: {
		name: string;
		description: string;
	};
	ascension_materials?: {
		weapon_materials: string;
		common_enemy_drops: string;
		elite_enemy_drops: string;
	};
}

const API_URL = 'https://raw.githubusercontent.com/meihwg/genshin-api/main/weapons.json';

/**
 * Service pour récupérer les armes depuis l'API GitHub
 */
export class WeaponsApiService {
	private static cache: Weapon[] | null = null;
	private static loadingPromise: Promise<Weapon[]> | null = null;

	/**
	 * Récupère toutes les armes depuis l'API
	 * Utilise un cache pour éviter les appels multiples
	 */
	static async getAll(): Promise<Weapon[]> {
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
					throw new Error(`HTTP Error: ${response.status}`);
				}
				return response.json();
			})
			.then((data: Weapon[]) => {
				this.cache = data;
				this.loadingPromise = null;
				return data;
			})
			.catch((error) => {
				this.loadingPromise = null;
				console.error('Error fetching weapons:', error);
				throw error;
			});

		return this.loadingPromise;
	}

	/**
	 * Récupère uniquement les armes 5 étoiles
	 */
	static async get5StarWeapons(): Promise<Weapon[]> {
		const allWeapons = await this.getAll();
		return allWeapons.filter((weapon) => weapon.rarity === 5);
	}

	/**
	 * Vide le cache (utile pour forcer un rechargement)
	 */
	static clearCache(): void {
		this.cache = null;
		this.loadingPromise = null;
	}
}
