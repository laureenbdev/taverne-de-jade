import { useState, useEffect, useCallback } from 'react';
import { WishlistItem, WishlistItemFormData } from '../features/wishlist/types.ts';
import { WishlistStorageService } from '../services/wishlist/wishlistStorage.ts';

/**
 * Hook personnalisé pour gérer la logique métier de la wishlist
 */
export const useWishlist = () => {
	const [items, setItems] = useState<WishlistItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	// Chargement initial depuis le localStorage
	useEffect(() => {
		const loadItems = () => {
			try {
				const loadedItems = WishlistStorageService.getAll();
				setItems(loadedItems);
			} catch (error) {
				console.error('Error loading wishlist:', error);
			} finally {
				setIsLoading(false);
			}
		};

		loadItems();
	}, []);

	/**
	 * Ajoute un nouvel élément
	 */
	const addItem = useCallback((itemData: WishlistItemFormData) => {
		const newItem: WishlistItem = {
			...itemData,
			id: `wishlist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
			isCompleted: false,
		};

		try {
			WishlistStorageService.add(newItem);
			setItems((prev) => [...prev, newItem]);
		} catch (error) {
			console.error('Error adding wishlist item:', error);
			throw error;
		}
	}, []);

	/**
	 * Met à jour un élément existant
	 */
	const updateItem = useCallback((id: string, itemData: WishlistItemFormData) => {
		try {
			const currentItem = items.find(item => item.id === id);
			if (!currentItem) {
				throw new Error('Item not found');
			}
			
			WishlistStorageService.update(id, {
				...itemData,
				isCompleted: currentItem.isCompleted,
			});
			setItems((prev) =>
				prev.map((item) => (item.id === id ? { ...itemData, id, isCompleted: item.isCompleted } : item))
			);
		} catch (error) {
			console.error('Error updating wishlist item:', error);
			throw error;
		}
	}, [items]);

	/**
	 * Marque un élément comme complété ou non
	 */
	const toggleCompleted = useCallback((id: string) => {
		try {
			setItems((prev) => {
				const item = prev.find(i => i.id === id);
				if (!item) {
					console.error('Item not found:', id);
					return prev;
				}
				
				const updatedItem = { ...item, isCompleted: !item.isCompleted };
				WishlistStorageService.update(id, {
					type: updatedItem.type,
					name: updatedItem.name,
					rarity: updatedItem.rarity,
					targetCount: updatedItem.targetCount,
					estimatedReleaseDate: updatedItem.estimatedReleaseDate,
					isCompleted: updatedItem.isCompleted,
				});
				
				return prev.map((item) => (item.id === id ? updatedItem : item));
			});
		} catch (error) {
			console.error('Error toggling wishlist item:', error);
			throw error;
		}
	}, []);

	/**
	 * Supprime un élément
	 */
	const deleteItem = useCallback((id: string) => {
		try {
			WishlistStorageService.delete(id);
			setItems((prev) => prev.filter((item) => item.id !== id));
		} catch (error) {
			console.error('Error deleting wishlist item:', error);
			throw error;
		}
	}, []);

	return {
		items,
		isLoading,
		addItem,
		updateItem,
		toggleCompleted,
		deleteItem,
	};
};
