import { useState, useEffect } from 'react';
import { Weapon, WeaponsApiService } from '../services/genshin/weaponsApi.ts';

/**
 * Hook pour gérer les armes depuis l'API
 */
export const useWeapons = () => {
	const [weapons, setWeapons] = useState<Weapon[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const loadWeapons = async () => {
			try {
				setIsLoading(true);
				setError(null);
				const allWeapons = await WeaponsApiService.getAll();
				const filteredWeapons = allWeapons.filter((weapon) => weapon.rarity >= 3);
				setWeapons(filteredWeapons);
			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : 'Unknown error';
				setError(errorMessage);
				console.error('Error loading weapons:', err);
			} finally {
				setIsLoading(false);
			}
		};

		loadWeapons();
	}, []);

	return {
		weapons,
		isLoading,
		error,
	};
};
