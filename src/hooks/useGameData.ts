import { useEffect, useState } from 'react';

import { GameData, GameDataApiService } from '../services/genshin/gameDataApi.ts';

export const useGameData = () => {
	const [gameData, setGameData] = useState<GameData | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		let cancelled = false;
		GameDataApiService.get()
			.then((data) => {
				if (!cancelled) setGameData(data);
			})
			.catch(() => {
				if (!cancelled) setGameData(null);
			})
			.finally(() => {
				if (!cancelled) setIsLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, []);

	return { gameData, isLoading };
};
