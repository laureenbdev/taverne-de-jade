import { useState, useEffect, useCallback } from 'react';
import { WishlistItem, WishlistItemFormData } from '../features/wishlist/types.ts';
import { useAuth } from '../features/auth/AuthContext.tsx';
import { WishlistStorageService } from '../services/wishlist/wishlistStorage.ts';
import {
	deleteWishlistItem,
	insertWishlistItem,
	listWishlist,
	updateWishlistItem,
} from '../services/wishlist/wishlistRemote.ts';

function createId() {
	return `wishlist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Liste de souhaits du compte connecté en base, sinon dans le navigateur.
 */
export const useWishlist = () => {
	const { session, loading: authLoading } = useAuth();
	const userId = session?.user.id ?? null;
	const [items, setItems] = useState<WishlistItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		if (authLoading) return;
		let cancelled = false;

		const loadItems = async () => {
			setIsLoading(true);
			try {
				const loadedItems = userId
					? await listWishlist(userId)
					: WishlistStorageService.getAll();
				if (!cancelled) setItems(loadedItems);
			} catch (error) {
				console.error('Error loading wishlist:', error);
				if (!cancelled) setItems([]);
			} finally {
				if (!cancelled) setIsLoading(false);
			}
		};

		void loadItems();
		return () => {
			cancelled = true;
		};
	}, [authLoading, userId]);

	const addItem = useCallback(async (itemData: WishlistItemFormData) => {
		const newItem: WishlistItem = {
			...itemData,
			id: createId(),
			isCompleted: false,
		};

		try {
			if (userId) await insertWishlistItem(userId, newItem);
			else WishlistStorageService.add(newItem);
			setItems((prev) => [...prev, newItem]);
		} catch (error) {
			console.error('Error adding wishlist item:', error);
			throw error;
		}
	}, [userId]);

	const updateItem = useCallback(async (id: string, itemData: WishlistItemFormData) => {
		const currentItem = items.find((item) => item.id === id);
		if (!currentItem) throw new Error('Item not found');

		const next: WishlistItem = {
			...itemData,
			id,
			isCompleted: currentItem.isCompleted,
		};

		try {
			if (userId) await updateWishlistItem(userId, next);
			else WishlistStorageService.update(id, next);
			setItems((prev) => prev.map((item) => (item.id === id ? next : item)));
		} catch (error) {
			console.error('Error updating wishlist item:', error);
			throw error;
		}
	}, [items, userId]);

	const toggleCompleted = useCallback(async (id: string) => {
		const currentItem = items.find((item) => item.id === id);
		if (!currentItem) return;

		const next: WishlistItem = { ...currentItem, isCompleted: !currentItem.isCompleted };
		try {
			if (userId) await updateWishlistItem(userId, next);
			else WishlistStorageService.update(id, next);
			setItems((prev) => prev.map((item) => (item.id === id ? next : item)));
		} catch (error) {
			console.error('Error toggling wishlist item:', error);
			throw error;
		}
	}, [items, userId]);

	const deleteItem = useCallback(async (id: string) => {
		try {
			if (userId) await deleteWishlistItem(userId, id);
			else WishlistStorageService.delete(id);
			setItems((prev) => prev.filter((item) => item.id !== id));
		} catch (error) {
			console.error('Error deleting wishlist item:', error);
			throw error;
		}
	}, [userId]);

	return {
		items,
		isLoading,
		addItem,
		updateItem,
		toggleCompleted,
		deleteItem,
	};
};
