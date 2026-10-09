import { normalizeWish, Wish } from '../../features/wishes/types.ts';

const STORAGE_KEY = 'wishes_history';

/**
 * Service pour gérer la persistance des vœux dans le localStorage
 * Aucune logique métier, uniquement des opérations CRUD sur le storage
 */
export class WishesStorageService {
	/**
	 * Récupère tous les vœux depuis le localStorage
	 */
	static getAll(): Wish[] {
		try {
			const data = localStorage.getItem(STORAGE_KEY);
			if (!data) return [];
			const parsed = JSON.parse(data) as Partial<Wish>[];
			const wishes = parsed.flatMap((raw) => {
				const wish = normalizeWish(raw);
				return wish ? [wish] : [];
			});
			if (JSON.stringify(parsed) !== JSON.stringify(wishes)) this.saveAll(wishes);
			return wishes;
		} catch (error) {
			console.error('Erreur lors de la lecture du localStorage:', error);
			return [];
		}
	}

	/**
	 * Sauvegarde tous les vœux dans le localStorage
	 */
	static saveAll(wishes: Wish[]): void {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(wishes));
		} catch (error) {
			console.error('Erreur lors de la sauvegarde dans le localStorage:', error);
			throw new Error('Impossible de sauvegarder les vœux');
		}
	}

	/**
	 * Ajoute un nouveau vœu
	 */
	static add(wish: Wish): void {
		const wishes = this.getAll();
		wishes.push(wish);
		this.saveAll(wishes);
	}

	/**
	 * Met à jour un vœu existant
	 */
	static update(id: string, updatedWish: Omit<Wish, 'id'>): void {
		const wishes = this.getAll();
		const index = wishes.findIndex((w) => w.id === id);
		if (index === -1) {
			throw new Error(`Vœu avec l'id ${id} introuvable`);
		}
		wishes[index] = { ...updatedWish, id };
		this.saveAll(wishes);
	}

	/**
	 * Supprime un vœu par son id
	 */
	static delete(id: string): void {
		const wishes = this.getAll();
		const filteredWishes = wishes.filter((w) => w.id !== id);
		this.saveAll(filteredWishes);
	}

	/**
	 * Vide tout le stockage (utile pour les tests ou reset)
	 */
	static clear(): void {
		localStorage.removeItem(STORAGE_KEY);
	}
}
