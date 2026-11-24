import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

import { useAuth } from '../../features/auth/AuthContext.tsx';
import { ARTIFACT_SETS } from '../../features/planner/artifactSets.ts';
import { buildArtifactFarm, ArtifactFarmSet } from '../../features/planner/artifactFarm.ts';
import { buildFarm } from '../../features/planner/farm.ts';
import { PlannerTab } from '../../features/planner/materials.ts';
import { useCharacters } from '../../hooks/useCharacters.ts';
import { useFarmCatalog } from '../../hooks/useFarmCatalog.ts';
import { useGameData } from '../../hooks/useGameData.ts';
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll.ts';
import { useModalPayload, useModalPresence } from '../../hooks/useModalPresence.ts';
import { usePlanner } from '../../hooks/usePlanner.ts';
import { useWeapons } from '../../hooks/useWeapons.ts';
import { catalogIconUrl } from '../../services/genshin/images.ts';
import ArtifactSetModal from './artifact-set-modal.tsx';
import PlannerArtifacts from './planner-artifacts.tsx';
import PlannerMaterials from './planner-materials.tsx';
import PlannerModal from './planner-modal.tsx';
import PlannerRoster from './planner-roster.tsx';
import './planner.scss';

type PlannerModalState = { mode: 'add' } | { mode: 'edit'; characterId: string; tab: PlannerTab };

const Planner: React.FC = () => {
	const { t, i18n } = useTranslation();
	const { session } = useAuth();
	const userId = session?.user.id ?? null;
	const { characters, isLoading: charactersLoading } = useCharacters();
	const { weapons, isLoading: weaponsLoading } = useWeapons();
	const { gameData, isLoading: gameDataLoading } = useGameData();
	const { catalog, artifacts, isLoading: catalogLoading } = useFarmCatalog();
	const { plans, isLoading: plansLoading, loadError, savePlan, removeCharacter } = usePlanner();
	const [modal, setModal] = useState<PlannerModalState | null>(null);
	const [openSetKey, setOpenSetKey] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);
	const [saveError, setSaveError] = useState<string | null>(null);
	const modalPresence = useModalPresence(Boolean(modal));
	const activeModal = useModalPayload(modal, modalPresence.present);

	useEffect(() => {
		if (!modal && !openSetKey) return;
		const onKey = (event: KeyboardEvent) => {
			if (event.key !== 'Escape' || event.defaultPrevented) return;
			if (openSetKey) setOpenSetKey(null);
			else if (!saving) setModal(null);
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [modal, openSetKey, saving]);

	const byId = useMemo(() => new Map(characters.map((character) => [character.id, character])), [characters]);
	const available = characters.filter((character) => !plans.some((plan) => plan.characterId === character.id));
	const french = i18n.language.toLowerCase().startsWith('fr');

	const namesFr = useMemo(() => {
		const map = new Map<string, string>();
		const add = (name: string | null | undefined, translated: string | null | undefined) => {
			if (name && translated) map.set(name, translated);
		};
		catalog?.items.forEach((item) => {
			add(item.name, item.nameFr);
			add(item.family, item.familyFr);
			add(item.sourceName, item.sourceNameFr);
		});
		artifacts.forEach((set) => {
			add(set.name, set.nameFr);
			add(set.domain, set.domainFr);
		});
		weapons.forEach((weapon) => add(weapon.name, weapon.nameFr));
		return map;
	}, [catalog, artifacts, weapons]);

	const localize = (name: string) => (french ? namesFr.get(name) ?? name : name);

	const artifactChoices = artifacts.length
		? artifacts.map((set) => ({
			id: set.id,
			name: set.name,
			nameFr: set.nameFr,
			rarity: Math.max(...set.rarities, 1),
			image: catalogIconUrl(set.image),
		}))
		: ARTIFACT_SETS.map((name) => ({ id: name, name, rarity: 5 }));

	const setsByName = useMemo(() => new Map(artifacts.map((set) => [set.name.toLowerCase(), set])), [artifacts]);

	const farm = useMemo(() => {
		if (!gameData) return null;
		return buildFarm({ plans, characters, weapons, gameData, catalog });
	}, [plans, characters, weapons, gameData, catalog]);

	const roster = useMemo(() => [...plans].sort((a, b) => {
		if (a.favorite !== b.favorite) return a.favorite ? -1 : 1;
		const left = byId.get(a.characterId)?.name ?? a.characterId;
		const right = byId.get(b.characterId)?.name ?? b.characterId;
		return left.localeCompare(right, i18n.language);
	}), [plans, byId, i18n.language]);

	const artifactFarm = useMemo(() => buildArtifactFarm({
		plans: roster,
		setsByName,
		nameOf: (characterId) => byId.get(characterId)?.name ?? characterId,
		labels: {
			boss: t('planner.artifactBoss'),
			other: t('planner.artifactOther'),
		},
		locale: i18n.language,
	}), [roster, setsByName, byId, t, i18n.language]);

	const activeSet = useMemo(() => {
		if (!openSetKey) return null;
		for (const cluster of artifactFarm) {
			const found = cluster.sets.find((set) => set.name.toLowerCase() === openSetKey);
			if (found) return found;
		}
		return null;
	}, [openSetKey, artifactFarm]);
	const setStatsPresence = useModalPresence(Boolean(activeSet));
	const activeSetPayload = useModalPayload(activeSet, setStatsPresence.present);
	const editing = activeModal?.mode === 'edit'
		? plans.find((plan) => plan.characterId === activeModal.characterId) ?? null
		: null;
	useLockBodyScroll(modalPresence.present || setStatsPresence.present);

	const run = async (action: () => Promise<void>) => {
		setSaveError(null);
		try {
			await action();
			return true;
		} catch (error) {
			setSaveError(error instanceof Error ? error.message : t('planner.saveError'));
			return false;
		}
	};

	const dataLoading = gameDataLoading || charactersLoading || plansLoading || catalogLoading || weaponsLoading;

	const editCharacter = (characterId: string, tab: PlannerTab = 'level') => {
		setSaveError(null);
		setModal({ mode: 'edit', characterId, tab });
	};

	const toggleArtifactDone = (characterId: string) => {
		const plan = plans.find((item) => item.characterId === characterId);
		const build = plan?.artifactBuild;
		if (!plan || !build) return;
		void run(() => savePlan({ ...plan, artifactBuild: { ...build, done: !build.done } }));
	};

	const openSet = (set: ArtifactFarmSet) => {
		setOpenSetKey(set.name.toLowerCase());
	};

	return (
		<div id="planner" className="page">
			<section>
				<PlannerRoster
					roster={roster}
					byId={byId}
					loadError={loadError}
					saveError={saveError}
					plansLoading={plansLoading}
					onEdit={editCharacter}
					onAdd={() => { setSaveError(null); setModal({ mode: 'add' }); }}
					onToggleFavorite={(plan) => void run(() => savePlan({ ...plan, favorite: !plan.favorite }))}
				/>

				<PlannerMaterials
					farm={farm}
					plans={plans}
					weapons={weapons}
					byId={byId}
					userId={userId}
					loading={dataLoading}
					localize={localize}
					onEdit={editCharacter}
					onSavePlan={(plan) => run(() => savePlan(plan)).then(() => undefined)}
				/>

				<PlannerArtifacts
					clusters={artifactFarm}
					plans={plans}
					loading={dataLoading}
					localize={localize}
					onEdit={(characterId) => editCharacter(characterId, 'artifacts')}
					onToggleDone={toggleArtifactDone}
					onOpenSet={openSet}
				/>
			</section>

			{modalPresence.present && activeModal && createPortal(
				<div
					className={`planner-modal-overlay modal-layer${modalPresence.shown ? ' is-open' : ''}`}
					onClick={() => { if (!saving) setModal(null); }}
				>
					<PlannerModal
						key={activeModal.mode === 'add' ? 'add' : `${activeModal.characterId}:${activeModal.tab}`}
						initialTab={activeModal.mode === 'edit' ? activeModal.tab : 'level'}
						mode={activeModal.mode}
						characters={activeModal.mode === 'add' ? available : characters}
						weapons={weapons}
						artifactChoices={artifactChoices}
						charactersLoading={charactersLoading}
						weaponsLoading={weaponsLoading}
						initial={editing ?? null}
						saving={saving}
						saveError={saveError}
						gameData={gameData}
						catalog={catalog}
						localize={localize}
						onClose={() => { if (!saving) setModal(null); }}
						onSubmit={(plan) => {
							void run(() => savePlan(plan)).then((ok) => {
								if (!ok || activeModal.mode !== 'add') return;
								setModal({ mode: 'edit', characterId: plan.characterId, tab: 'level' });
							});
						}}
						onRemove={() => {
							if (activeModal.mode !== 'edit') return;
							setSaving(true);
							void run(() => removeCharacter(activeModal.characterId)).then((ok) => {
								setSaving(false);
								if (ok) setModal(null);
							});
						}}
					/>
				</div>,
				document.body,
			)}

			{setStatsPresence.present && activeSetPayload && createPortal(
				<div
					className={`planner-modal-overlay modal-layer${setStatsPresence.shown ? ' is-open' : ''}`}
					onClick={() => setOpenSetKey(null)}
				>
					<ArtifactSetModal
						setName={activeSetPayload.name}
						image={activeSetPayload.image}
						characters={activeSetPayload.characters}
						localize={localize}
						onClose={() => setOpenSetKey(null)}
					/>
				</div>,
				document.body,
			)}
		</div>
	);
};

export default Planner;
