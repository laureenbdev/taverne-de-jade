import { useEffect, useState } from 'react';

import { ArtifactSetInfo, ArtifactsApiService } from '../services/genshin/artifactsApi.ts';
import { MaterialCatalog, MaterialsApiService } from '../services/genshin/materialsApi.ts';

export const useFarmCatalog = () => {
	const [catalog, setCatalog] = useState<MaterialCatalog | null>(null);
	const [artifacts, setArtifacts] = useState<ArtifactSetInfo[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		let cancelled = false;
		Promise.all([
			MaterialsApiService.get().catch(() => null),
			ArtifactsApiService.getAll().catch(() => []),
		]).then(([materials, sets]) => {
			if (cancelled) return;
			setCatalog(materials);
			setArtifacts(sets);
		}).finally(() => {
			if (!cancelled) setIsLoading(false);
		});
		return () => {
			cancelled = true;
		};
	}, []);

	return { catalog, artifacts, isLoading };
};
