import { useState, useEffect, useCallback } from 'react';
import { Wish, WishFormData } from '../features/wishes/types.ts';
import { useAuth } from '../features/auth/AuthContext.tsx';
import { WishesStorageService } from '../services/wishes/wishesStorage.ts';
import { deleteWishRow, insertWish, listWishes, updateWishRow } from '../services/wishes/wishesRemote.ts';

function createId() {
	return `wish-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Vœux du compte connecté en base, sinon dans le navigateur.
 */
export const useWishes = () => {
	const { session, loading: authLoading } = useAuth();
	const userId = session?.user.id ?? null;
	const [wishes, setWishes] = useState<Wish[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		if (authLoading) return;
		let cancelled = false;

		const loadWishes = async () => {
			setIsLoading(true);
			try {
				const loadedWishes = userId
					? await listWishes(userId)
					: WishesStorageService.getAll();
				if (!cancelled) setWishes(loadedWishes);
			} catch (error) {
				console.error('Erreur lors du chargement des vœux:', error);
				if (!cancelled) setWishes([]);
			} finally {
				if (!cancelled) setIsLoading(false);
			}
		};

		void loadWishes();
		return () => {
			cancelled = true;
		};
	}, [authLoading, userId]);

	const addWish = useCallback(async (wishData: WishFormData) => {
		const newWish: Wish = { ...wishData, id: createId() };
		try {
			if (userId) await insertWish(userId, newWish);
			else WishesStorageService.add(newWish);
			setWishes((prev) => [...prev, newWish]);
		} catch (error) {
			console.error('Erreur lors de l\'ajout du vœu:', error);
			throw error;
		}
	}, [userId]);

	const updateWish = useCallback(async (id: string, wishData: WishFormData) => {
		const next: Wish = { ...wishData, id };
		try {
			if (userId) await updateWishRow(userId, next);
			else WishesStorageService.update(id, wishData);
			setWishes((prev) => prev.map((wish) => (wish.id === id ? next : wish)));
		} catch (error) {
			console.error('Erreur lors de la mise à jour du vœu:', error);
			throw error;
		}
	}, [userId]);

	const deleteWish = useCallback(async (id: string) => {
		try {
			if (userId) await deleteWishRow(userId, id);
			else WishesStorageService.delete(id);
			setWishes((prev) => prev.filter((wish) => wish.id !== id));
		} catch (error) {
			console.error('Erreur lors de la suppression du vœu:', error);
			throw error;
		}
	}, [userId]);

	return {
		wishes,
		isLoading,
		addWish,
		updateWish,
		deleteWish,
	};
};
