import { WishlistItem } from '../../features/wishlist/types.ts';

const STORAGE_KEY = 'wishlist_items';

/**
 * Service pour gérer la persistance de la wishlist dans le localStorage
 */
export class WishlistStorageService {
	/**
	 * Récupère tous les éléments de la wishlist depuis le localStorage
	 */
	static getAll(): WishlistItem[] {
		try {
			const data = localStorage.getItem(STORAGE_KEY);
			if (!data) return [];
			const parsed = JSON.parse(data) as Array<Partial<WishlistItem> & { rarity?: number }>;
			const items = parsed.flatMap((raw) => {
				if ((raw.type !== 'character' && raw.type !== 'weapon') || typeof raw.id !== 'string' || typeof raw.name !== 'string') {
					return [];
				}
				return [{
					id: raw.id,
					type: raw.type,
					name: raw.name,
					targetCount: typeof raw.targetCount === 'number' ? raw.targetCount : 1,
					estimatedReleaseDate: raw.estimatedReleaseDate,
					isCompleted: Boolean(raw.isCompleted),
				}];
			});
			if (parsed.some((raw) => 'rarity' in raw)) this.saveAll(items);
			return items;
		} catch (error) {
			console.error('Error reading wishlist from localStorage:', error);
			return [];
		}
	}

	/**
	 * Sauvegarde tous les éléments dans le localStorage
	 */
	static saveAll(items: WishlistItem[]): void {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
		} catch (error) {
			console.error('Error saving wishlist to localStorage:', error);
			throw new Error('Unable to save wishlist');
		}
	}

	/**
	 * Ajoute un nouvel élément
	 */
	static add(item: WishlistItem): void {
		const items = this.getAll();
		items.push(item);
		this.saveAll(items);
	}

	/**
	 * Met à jour un élément existant
	 */
	static update(id: string, updatedItem: Omit<WishlistItem, 'id'>): void {
		const items = this.getAll();
		const index = items.findIndex((item) => item.id === id);
		if (index === -1) {
			throw new Error(`Wishlist item with id ${id} not found`);
		}
		items[index] = { ...updatedItem, id };
		this.saveAll(items);
	}

	/**
	 * Supprime un élément par son id
	 */
	static delete(id: string): void {
		const items = this.getAll();
		const filteredItems = items.filter((item) => item.id !== id);
		this.saveAll(filteredItems);
	}

	/**
	 * Vide tout le stockage
	 */
	static clear(): void {
		localStorage.removeItem(STORAGE_KEY);
	}
}
