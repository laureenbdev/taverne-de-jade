import { MaterialKind, StoneTier } from '../../features/planner/materials.ts';
import { GENSHIN_API_ROOT } from './apiRoot.ts';

export type FarmSource = 'domain' | 'boss' | 'weekly' | 'leyline' | 'overworld';

export interface CatalogItem {
	id: string;
	name: string;
	nameFr?: string;
	family: string;
	familyFr?: string;
	rarity: number;
	tier: StoneTier | null;
	kind: MaterialKind;
	source: FarmSource;
	sourceName: string;
	sourceNameFr?: string;
	days: string[];
	resin: number;
	dropMax: number;
	image: string;
}

export interface MaterialCatalog {
	resinImage?: string;
	condensedResinImage?: string;
	weaponOreImage?: string;
	fortunaImage?: string;
	resinPerDay: number;
	craftRatio: number;
	experience: { from: number; to: number; exp: number }[];
	items: CatalogItem[];
}

const API_URL = `${GENSHIN_API_ROOT}/materials.json`;

export class MaterialsApiService {
	private static cache: MaterialCatalog | null = null;
	private static loadingPromise: Promise<MaterialCatalog> | null = null;

	static async get(): Promise<MaterialCatalog> {
		if (this.cache) return this.cache;
		if (this.loadingPromise) return this.loadingPromise;

		this.loadingPromise = fetch(API_URL, { cache: 'no-cache' })
			.then((response) => {
				if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
				return response.json();
			})
			.then((data: MaterialCatalog) => {
				if (!Array.isArray(data?.items)) throw new Error('Catalogue de matériaux introuvable');
				this.cache = data;
				this.loadingPromise = null;
				return data;
			})
			.catch((error) => {
				this.loadingPromise = null;
				console.error('Erreur lors de la récupération des matériaux:', error);
				throw error;
			});

		return this.loadingPromise;
	}
}
