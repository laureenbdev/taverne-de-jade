import { GENSHIN_API_ROOT } from './apiRoot.ts';

export interface ArtifactSetInfo {
	id: string;
	name: string;
	nameFr?: string;
	rarities: number[];
	image: string;
	source: 'domain' | 'boss' | string;
	domain?: string | null;
	domainFr?: string;
}

const API_URL = `${GENSHIN_API_ROOT}/artifacts.json`;

export class ArtifactsApiService {
	private static cache: ArtifactSetInfo[] | null = null;
	private static loadingPromise: Promise<ArtifactSetInfo[]> | null = null;

	static async getAll(): Promise<ArtifactSetInfo[]> {
		if (this.cache) return this.cache;
		if (this.loadingPromise) return this.loadingPromise;

		this.loadingPromise = fetch(API_URL, { cache: 'no-cache' })
			.then((response) => {
				if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
				return response.json();
			})
			.then((data: ArtifactSetInfo[]) => {
				if (!Array.isArray(data)) throw new Error('Catalogue d\'artéfacts introuvable');
				this.cache = data;
				this.loadingPromise = null;
				return data;
			})
			.catch((error) => {
				this.loadingPromise = null;
				console.error('Erreur lors de la récupération des artéfacts:', error);
				throw error;
			});

		return this.loadingPromise;
	}
}
