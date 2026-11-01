export interface MaterialBag {
	[rarity: string]: number;
}

export interface AscensionPhase {
	moras: number;
	boss_drops: number;
	elemental_stones: MaterialBag;
	local_speciality: number;
	common_enemy_drops: MaterialBag;
}

export interface TalentCost {
	moras: number;
	talent_books?: MaterialBag;
	common_enemy_drops?: MaterialBag;
	weekly_boss_drops?: number;
}

export interface WeaponCost {
	moras: number;
	weapon_materials?: MaterialBag;
	elite_enemy_drops?: MaterialBag;
	common_enemy_drops?: MaterialBag;
}

export interface GameData {
	ascension_values: {
		character_level: Record<string, AscensionPhase>;
		talents: Record<string, TalentCost>;
		weapons: Record<string, WeaponCost>;
	};
}

const API_URL = 'https://raw.githubusercontent.com/laureenbdev/genshin-api/main/game-data.json';

/**
 * Coûts d'ascension (personnage, talents, armes) depuis l'API GitHub.
 */
export class GameDataApiService {
	private static cache: GameData | null = null;
	private static loadingPromise: Promise<GameData> | null = null;

	static async get(): Promise<GameData> {
		if (this.cache) return this.cache;
		if (this.loadingPromise) return this.loadingPromise;

		this.loadingPromise = fetch(API_URL)
			.then((response) => {
				if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
				return response.json();
			})
			.then((data: GameData[]) => {
				const gameData = data[0];
				if (!gameData?.ascension_values?.character_level) {
					throw new Error('Données d\'ascension introuvables');
				}
				this.cache = gameData;
				this.loadingPromise = null;
				return gameData;
			})
			.catch((error) => {
				this.loadingPromise = null;
				console.error('Erreur lors de la récupération des données de jeu:', error);
				throw error;
			});

		return this.loadingPromise;
	}
}
