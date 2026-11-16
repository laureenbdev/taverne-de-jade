import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Check, Plus, Stack, Star, Table, User } from 'phosphor-react';

import { ARTIFACT_SETS } from '../../features/planner/artifactSets.ts';
import { ArtifactBuild, hasArtifactPlan, isPercentStat } from '../../features/planner/artifactBuild.ts';
import { buildFarm, FarmCluster, FarmSectionId, FarmTask } from '../../features/planner/farm.ts';
import { FarmLine, PLANNER_TABS, PlannedCharacter, PlannerTab, plannerTabForLine } from '../../features/planner/materials.ts';
import { useCharacters } from '../../hooks/useCharacters.ts';
import { useFarmCatalog } from '../../hooks/useFarmCatalog.ts';
import { useGameData } from '../../hooks/useGameData.ts';
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll.ts';
import { usePlanner } from '../../hooks/usePlanner.ts';
import { useWeapons } from '../../hooks/useWeapons.ts';
import { catalogIconUrl, characterIconUrl, weaponIconUrl } from '../../services/genshin/images.ts';
import PlannerModal from './planner-modal.tsx';
import './planner.scss';

type PlannerModalState = { mode: 'add' } | { mode: 'edit'; characterId: string; tab: PlannerTab };

type FarmViewMode = 'source' | 'character' | 'table';

const FARM_VIEW_KEY = 'planner_farm_view';

function readFarmView(): FarmViewMode {
	try {
		const value = localStorage.getItem(FARM_VIEW_KEY);
		if (value === 'character' || value === 'table' || value === 'source') return value;
	} catch {
		/* navigation privée */
	}
	return 'source';
}

const ARTIFACT_SLOTS = ['sands', 'goblet', 'circlet'] as const;

type KeptLine = { key: string; label: string; got: boolean };

function characterKeptLines(
	build: ArtifactBuild,
	label: (key: string) => string,
	format: (stat: string, value: number) => string,
): KeptLine[] {
	const lines: KeptLine[] = [];
	ARTIFACT_SLOTS.forEach((slot) => {
		const stat = build[slot];
		if (!stat) return;
		lines.push({
			key: `${slot}:${stat}`,
			label: `${label(`planner.slots.${slot}`)} · ${label(`planner.stats.${stat}`)}`,
			got: false,
		});
	});
	build.subs.forEach((sub, index) => {
		if (!sub.stat) return;
		lines.push({
			key: `sub:${index}:${sub.stat}`,
			label: `${label(`planner.stats.${sub.stat}`)} · ${format(sub.stat, sub.target)}`,
			got: false,
		});
	});
	return lines;
}

const FARM_VIEWS: { mode: FarmViewMode; icon: typeof Stack }[] = [
	{ mode: 'source', icon: Stack },
	{ mode: 'character', icon: User },
	{ mode: 'table', icon: Table },
];

const LevelRange: React.FC<{ current: number; target: number }> = ({ current, target }) => (
	<span className={`planner-range${current >= target ? ' is-done' : ''}`}>
		<span>{current}</span>
		{current < target && (
			<>
				<ArrowRight size={11} />
				<span>{target}</span>
			</>
		)}
	</span>
);

const RoundCheck: React.FC<{ checked: boolean; label: string; onClick: () => void }> = ({ checked, label, onClick }) => (
	<button
		type="button"
		className={`planner-check${checked ? ' is-on' : ''}`}
		aria-pressed={checked}
		aria-label={label}
		onClick={(event) => {
			event.stopPropagation();
			onClick();
		}}
	>
		{checked && <Check size={12} weight="bold" />}
	</button>
);

const Planner: React.FC = () => {
	const { t, i18n } = useTranslation();
	const { characters, isLoading: charactersLoading } = useCharacters();
	const { weapons, isLoading: weaponsLoading } = useWeapons();
	const { gameData, isLoading: gameDataLoading } = useGameData();
	const { catalog, artifacts, isLoading: catalogLoading } = useFarmCatalog();
	const { plans, isLoading: plansLoading, loadError, savePlan, removeCharacter } = usePlanner();
	const [modal, setModal] = useState<PlannerModalState | null>(null);
	const [farmView, setFarmView] = useState<FarmViewMode>(readFarmView);
	const [saving, setSaving] = useState(false);
	const [saveError, setSaveError] = useState<string | null>(null);
	useLockBodyScroll(Boolean(modal));

	const byId = useMemo(() => new Map(characters.map((character) => [character.id, character])), [characters]);
	const editing = modal?.mode === 'edit' ? plans.find((plan) => plan.characterId === modal.characterId) ?? null : null;
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

	const builds = roster.filter((plan) => hasArtifactPlan(plan.artifactBuild));

	const formatCount = (count: number) => count.toLocaleString(i18n.language);
	const dayLabel = (count: number) => (count <= 1 ? t('planner.day') : t('planner.days', { count }));

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

	const taskName = (task: FarmTask) => {
		const line: FarmLine = task.line;
		if (line.kind === 'mora') return t('planner.mora');
		if (line.kind === 'xp') return t('planner.heroWit');
		if (line.kind === 'stone' && line.element && line.tier) {
			return t('planner.stones.label', {
				tier: t(`planner.stones.tiers.${line.tier}`),
				stone: t(`planner.stones.names.${line.element}`, { defaultValue: line.element }),
			});
		}
		return localize(task.item?.name ?? line.name ?? line.id);
	};

	const clusterTitle = (cluster: FarmCluster) => {
		if (cluster.title === 'mora') return t('planner.mora');
		if (cluster.title === 'xp') return t('planner.heroWit');
		return localize(cluster.title);
	};

	const sourceLabel = (name: string) => {
		if (name === 'Blossom of Wealth') return t('planner.blossoms.wealth');
		if (name === 'Blossom of Revelation') return t('planner.blossoms.revelation');
		return localize(name);
	};

	const formatStat = (stat: string, value: number) => {
		const text = value.toLocaleString(i18n.language, { maximumFractionDigits: 1 });
		return isPercentStat(stat) ? `${text} %` : text;
	};

	const checked = (plan: PlannedCharacter, taskId: string) => plan.checkedTasks.includes(taskId);
	const taskChecked = (task: FarmTask) => {
		const plan = plans.find((item) => item.characterId === task.characterId);
		return plan ? checked(plan, task.id) : false;
	};
	const clusterDone = (cluster: FarmCluster) => cluster.tasks.length > 0 && cluster.tasks.every(taskChecked);
	const orderClusters = (clusters: FarmCluster[]) => [...clusters].sort(
		(left, right) => Number(clusterDone(left)) - Number(clusterDone(right)),
	);

	const chooseFarmView = (mode: FarmViewMode) => {
		setFarmView(mode);
		try {
			localStorage.setItem(FARM_VIEW_KEY, mode);
		} catch {
			/* navigation privée */
		}
	};

	const characterGroups = (() => {
		if (!farm) return [] as { characterId: string; favorite: boolean; cluster: FarmCluster }[];
		const tasksByCharacter = new Map<string, FarmTask[]>();
		farm.sections.forEach((section) => {
			section.clusters.forEach((cluster) => {
				cluster.tasks.forEach((task) => {
					const list = tasksByCharacter.get(task.characterId) ?? [];
					list.push(task);
					tasksByCharacter.set(task.characterId, list);
				});
			});
		});
		const groups = plans.map((plan) => {
			const tasks = tasksByCharacter.get(plan.characterId) ?? [];
			const name = tasks[0]?.characterName ?? byId.get(plan.characterId)?.name ?? plan.characterId;
			const cluster: FarmCluster = {
				key: plan.characterId,
				section: 'overworld',
				title: name,
				subtitle: '',
				days: [],
				resin: 0,
				dayCount: 0,
				tasks,
			};
			return { characterId: plan.characterId, favorite: plan.favorite, cluster };
		});
		groups.sort((left, right) => (
			Number(clusterDone(left.cluster)) - Number(clusterDone(right.cluster))
			|| Number(right.favorite) - Number(left.favorite)
			|| left.cluster.title.localeCompare(right.cluster.title, i18n.language)
		));
		return groups;
	})();

	const renderIdle = (ids: string[]) => (
		ids.length > 0 ? (
			<ul className="planner-idle">
				{ids.map((id) => <li key={id}>{byId.get(id)?.name ?? id}</li>)}
			</ul>
		) : null
	);

	const editCharacter = (characterId: string, tab: PlannerTab = 'level') => {
		setSaveError(null);
		setModal({ mode: 'edit', characterId, tab });
	};

	const materialRows = (cluster: FarmCluster) => {
		const groups = new Map<string, FarmTask[]>();
		cluster.tasks.forEach((task) => {
			const list = groups.get(task.line.id) ?? [];
			list.push(task);
			groups.set(task.line.id, list);
		});
		return [...groups.values()].sort((left, right) => {
			const rarity = (task: FarmTask) => task.line.rarity ?? task.item?.rarity ?? 0;
			const done = (row: FarmTask[]) => row.every(taskChecked);
			return Number(done(left)) - Number(done(right))
				|| rarity(left[0]) - rarity(right[0])
				|| taskName(left[0]).localeCompare(taskName(right[0]));
		});
	};

	const toggleRow = (row: FarmTask[]) => {
		const allChecked = row.every((task) => {
			const plan = plans.find((item) => item.characterId === task.characterId);
			return plan ? checked(plan, task.id) : true;
		});
		row.forEach((task) => {
			const plan = plans.find((item) => item.characterId === task.characterId);
			if (!plan) return;
			const has = checked(plan, task.id);
			if (allChecked) {
				if (!has) return;
				void run(() => savePlan({ ...plan, checkedTasks: plan.checkedTasks.filter((id) => id !== task.id) }));
				return;
			}
			if (has) return;
			void run(() => savePlan({ ...plan, checkedTasks: [...plan.checkedTasks, task.id] }));
		});
	};

	const renderTiles = (cluster: FarmCluster, hideStones: boolean, foldGems: boolean, singleBoss: boolean) => {
		const rows = materialRows(cluster);
		const kept = hideStones ? rows.filter((row) => row[0].line.kind !== 'stone') : rows;
		const visible = kept.length > 0 ? kept : rows.slice(0, 1);
		if (visible.length === 0) return null;
		return (
			<ul className="planner-task-tiles">
				{visible.map((row) => {
					const sample = row[0];
					const scope = singleBoss && cluster.section === 'boss'
						? cluster.tasks
						: foldGems && sample.line.kind === 'boss'
							? cluster.tasks.filter((task) => task.line.kind === 'boss' || task.line.kind === 'stone')
							: row;
					const count = row.reduce((total, task) => total + task.line.count, 0);
					const doneCount = scope.filter((task) => {
						const plan = plans.find((item) => item.characterId === task.characterId);
						return plan ? checked(plan, task.id) : false;
					}).length;
					const done = doneCount === scope.length;
					const name = taskName(sample);
					const favorite = scope.some((task) => task.favorite);
					return (
						<li key={sample.line.id} className="tooltip-anchor">
							<div className={`planner-task-tile${done ? ' is-checked' : ''}${!done && doneCount > 0 ? ' is-partial' : ''}${favorite ? ' is-favorite' : ''}`}>
								{sample.item?.image && (
									<img src={catalogIconUrl(sample.item.image)} alt={name} onError={(event) => { event.currentTarget.style.display = 'none'; }} />
								)}
								<span>× {formatCount(count)}</span>
								<RoundCheck
									checked={done}
									label={`${name}, ${done ? t('planner.uncheck') : t('planner.check')}`}
									onClick={() => toggleRow(scope)}
								/>
							</div>
							<span className="tooltip top" role="tooltip" aria-hidden="true">{name}</span>
						</li>
					);
				})}
			</ul>
		);
	};

	const renderCluster = (cluster: FarmCluster, single = false, byCharacter = false) => {
		const title = clusterTitle(cluster);
		const subtitle = cluster.subtitle ? sourceLabel(cluster.subtitle) : '';
		const days = cluster.days.map((day) => t(`planner.weekdays.${day}`)).join(' · ');
		const domain = subtitle && subtitle !== title ? subtitle : '';
		const people = [...new Map(cluster.tasks.map((task) => [task.characterId, task])).values()]
			.sort((left, right) => Number(right.favorite) - Number(left.favorite) || left.characterName.localeCompare(right.characterName, i18n.language));
		const groupFavorite = byCharacter
			? plans.some((plan) => plan.characterId === cluster.key && plan.favorite)
			: cluster.tasks.some((task) => task.favorite);
		const tiles = renderTiles(cluster, single || byCharacter, byCharacter, single);
		const portraitDone = byCharacter && clusterDone(cluster);
		return (
			<article key={cluster.key} className={`planner-cluster${single ? ' is-single' : ''}${groupFavorite ? ' is-favorite' : ''}`}>
				<header className={byCharacter ? 'is-character' : undefined}>
					{byCharacter && (
						<button
							type="button"
							className={`planner-face${portraitDone ? ' is-checked' : ''}${groupFavorite ? ' is-favorite' : ''}`}
							aria-label={title}
							onClick={() => editCharacter(cluster.key)}
						>
							<img src={characterIconUrl(cluster.key)} alt="" onError={(event) => { event.currentTarget.style.display = 'none'; }} />
						</button>
					)}
					<h4>{title}</h4>
					{!byCharacter && (domain || days) && (
						<p>
							{domain}
							{domain && days && <br />}
							{days}
						</p>
					)}
				</header>
				{tiles ?? (byCharacter ? <p className="planner-cluster-empty">{t('planner.sections.overworld')}</p> : null)}
				{!byCharacter && (
					<div className="planner-faces">
						{people.map((task) => {
							const own = cluster.tasks.filter((item) => item.characterId === task.characterId);
							const plan = plans.find((item) => item.characterId === task.characterId);
							const done = own.every((item) => (plan ? checked(plan, item.id) : false));
							const character = byId.get(task.characterId);
							const weapon = plan?.weaponId ? weapons.find((item) => item.id === plan.weaponId) : undefined;
							const tabs = own.map((item) => (plan ? plannerTabForLine(plan, character, weapon, item.line) : 'level'));
							const tab = PLANNER_TABS.find((entry) => tabs.includes(entry)) ?? 'level';
							return (
								<span key={task.characterId} className="tooltip-anchor">
									<button
										type="button"
										className={`planner-face${done ? ' is-checked' : ''}${task.favorite ? ' is-favorite' : ''}`}
										aria-label={task.characterName}
										onClick={() => editCharacter(task.characterId, tab)}
									>
										<img src={characterIconUrl(task.characterId)} alt="" onError={(event) => { event.currentTarget.style.display = 'none'; }} />
									</button>
									<span className="tooltip top" role="tooltip" aria-hidden="true">{task.characterName}</span>
								</span>
							);
						})}
					</div>
				)}
			</article>
		);
	};

	const renderSection = (id: FarmSectionId, clusters: FarmCluster[], idleIds: string[] = []) => {
		const single = id === 'boss' || id === 'local';
		return (
		<section key={id} className={`planner-farm-section${id === 'today' ? ' is-today' : ''}`}>
			<h3>{t(`planner.sections.${id}`)}</h3>
			<div className={`planner-cluster-grid${single ? ' is-single' : ''}`}>
				{orderClusters(clusters).map((cluster) => renderCluster(cluster, single))}
			</div>
			{id === 'overworld' && renderIdle(idleIds)}
		</section>
		);
	};

	return (
		<div id="planner" className="page">
			<section>
				<div className="section-container">
					<h2>{t('planner.characters')}</h2>
					{(loadError || saveError) && <p className="planner-save-error">{saveError ? t('planner.saveError') : loadError}</p>}
					{plans.length === 0 && !plansLoading && !loadError && <p className="planner-empty">{t('planner.emptyRoster')}</p>}
					<div className="planner-roster">
						{roster.map((plan) => {
							const character = byId.get(plan.characterId);
							const name = character?.name ?? plan.characterId;
							return (
								<div key={plan.characterId} className={`planner-character${character ? ` rarity-${character.rarity}` : ''}${plan.done ? ' is-done' : ''}${plan.favorite ? ' is-favorite' : ''}`}>
									<div className="planner-portrait-wrap">
										<button type="button" className="planner-portrait" onClick={() => editCharacter(plan.characterId)}>
											<img src={characterIconUrl(plan.characterId)} alt="" onError={(event) => { event.currentTarget.style.display = 'none'; }} />
										</button>
										<button
											type="button"
											className={`planner-fav${plan.favorite ? ' is-on' : ''}`}
											aria-pressed={plan.favorite}
											aria-label={plan.favorite ? t('planner.favoriteOn') : t('planner.favoriteOff')}
											onClick={() => void run(() => savePlan({ ...plan, favorite: !plan.favorite }))}
										>
											<Star size={11} weight={plan.favorite ? 'fill' : 'regular'} />
										</button>
										<RoundCheck
											checked={plan.done}
											label={plan.done ? t('planner.uncheck') : t('planner.check')}
											onClick={() => void run(() => savePlan({ ...plan, done: !plan.done }))}
										/>
									</div>
									<button type="button" className="planner-character-name" onClick={() => editCharacter(plan.characterId)}>
										{name}
									</button>
								</div>
							);
						})}
						<button type="button" className="planner-add" aria-label={t('planner.add')} onClick={() => { setSaveError(null); setModal({ mode: 'add' }); }}>
							<Plus size={18} />
						</button>
					</div>
				</div>

				<div className="section-container">
					<h2>{t('planner.materials')}</h2>
					{farm && plans.length > 0 && (
						<ul className="planner-stats">
							{farm.resin > 0 && (
								<li>
									{farm.stock.resinImage && <img src={catalogIconUrl(farm.stock.resinImage)} alt="" />}
									<strong>{formatCount(farm.resin)}</strong>
									<span>{t('planner.resin')} · {t('planner.inDays', { days: dayLabel(farm.days) })}</span>
								</li>
							)}
							{farm.stock.mora > 0 && (
								<li>
									{farm.stock.moraImage && <img src={catalogIconUrl(farm.stock.moraImage)} alt="" />}
									<strong>{formatCount(farm.stock.mora)}</strong>
									<span>{t('planner.mora')}</span>
								</li>
							)}
							{farm.stock.xp > 0 && (
								<li>
									{farm.stock.xpImage && <img src={catalogIconUrl(farm.stock.xpImage)} alt="" />}
									<strong>{formatCount(farm.stock.xp)}</strong>
									<span>{t('planner.heroWit')}</span>
								</li>
							)}
							{farm.stock.weaponStones > 0 && (
								<li>
									{farm.stock.weaponImage && <img src={catalogIconUrl(farm.stock.weaponImage)} alt="" />}
									<strong>{formatCount(farm.stock.weaponStones)}</strong>
									<span>{t('planner.weaponStones')}</span>
								</li>
							)}
						</ul>
					)}
					{plans.length === 0 ? (
						<p className="planner-empty">{t('planner.materialsNeedRoster')}</p>
					) : gameDataLoading || charactersLoading || plansLoading || catalogLoading || !farm ? (
						<p className="planner-empty">{t('common.loading')}</p>
					) : (
						<>
							<div className="planner-views" role="group" aria-label={t('planner.views.label')}>
								{FARM_VIEWS.map(({ mode, icon: Icon }) => (
									<button
										key={mode}
										type="button"
										className={farmView === mode ? 'is-on' : ''}
										aria-pressed={farmView === mode}
										onClick={() => chooseFarmView(mode)}
									>
										<Icon size={16} />
										{t(`planner.views.${mode}`)}
									</button>
								))}
							</div>
							{farmView === 'character' ? (
								<div className="planner-cluster-grid">
									{characterGroups.map((group) => renderCluster(group.cluster, false, true))}
								</div>
							) : farmView === 'table' ? (
								<div className="planner-table-wrap">
									<table className="planner-table">
										<thead>
											<tr>
												<th>{t('planner.characters')}</th>
												<th>{t('planner.tabs.level')}</th>
												<th>{t('planner.tabs.weapon')}</th>
												<th>{t('planner.tabs.talents')}</th>
												<th>{t('planner.tabs.artifacts')}</th>
											</tr>
										</thead>
										<tbody>
											{characterGroups.map((group) => {
												const done = clusterDone(group.cluster);
												const plan = plans.find((item) => item.characterId === group.characterId);
												const weapon = plan?.weaponId ? weapons.find((item) => item.id === plan.weaponId) : undefined;
												const setName = plan?.artifactBuild?.set ?? plan?.artifactSet ?? null;
												const talents = plan ? [
													['normal', plan.talentNormal, plan.talentNormalTarget],
													['skill', plan.talentSkill, plan.talentSkillTarget],
													['burst', plan.talentBurst, plan.talentBurstTarget],
												] as const : [];
												return (
													<tr key={group.characterId} className={`${group.favorite ? 'is-favorite' : ''}${done ? ' is-done' : ''}`}>
														<th scope="row">
															<span className="planner-table-who">
																<button
																	type="button"
																	className={`planner-face${done ? ' is-checked' : ''}${group.favorite ? ' is-favorite' : ''}`}
																	aria-label={group.cluster.title}
																	onClick={() => editCharacter(group.characterId, 'level')}
																>
																	<img src={characterIconUrl(group.characterId)} alt="" onError={(event) => { event.currentTarget.style.display = 'none'; }} />
																</button>
																<button type="button" className="planner-table-name" onClick={() => editCharacter(group.characterId, 'level')}>
																	{group.cluster.title}
																</button>
															</span>
														</th>
														<td>
															{plan && (
																<div className="planner-table-level">
																	<button type="button" className="planner-table-cell" onClick={() => editCharacter(group.characterId, 'level')}>
																		<LevelRange current={plan.currentLevel} target={plan.targetLevel} />
																	</button>
																	{renderTiles({
																		...group.cluster,
																		tasks: group.cluster.tasks.filter((task) => plannerTabForLine(
																			plan,
																			byId.get(plan.characterId),
																			weapon,
																			task.line,
																		) === 'level'),
																	}, true, true, false)}
																</div>
															)}
														</td>
														<td>
															{plan && (
																<div className="planner-table-level">
																	<button type="button" className="planner-table-weapon" onClick={() => editCharacter(group.characterId, 'weapon')}>
																		{weapon ? (
																			<>
																				<img src={weaponIconUrl(weapon.id)} alt="" onError={(event) => { event.currentTarget.style.display = 'none'; }} />
																				<span>
																					<strong>{localize(weapon.name)}</strong>
																					{plan.weaponCurrentLevel != null && plan.weaponTargetLevel != null && (
																						<LevelRange current={plan.weaponCurrentLevel} target={plan.weaponTargetLevel} />
																					)}
																				</span>
																			</>
																		) : (
																			<span className="planner-table-missing">{t('planner.weaponNone')}</span>
																		)}
																	</button>
																	{renderTiles({
																		...group.cluster,
																		tasks: group.cluster.tasks.filter((task) => plannerTabForLine(
																			plan,
																			byId.get(plan.characterId),
																			weapon,
																			task.line,
																		) === 'weapon'),
																	}, true, true, false)}
																</div>
															)}
														</td>
														<td>
															{plan && (
																<div className="planner-table-level">
																	<button type="button" className="planner-table-talents" onClick={() => editCharacter(group.characterId, 'talents')}>
																		{talents.map(([key, current, target]) => (
																			<span key={key}>
																				<small>{t(`planner.talentShort.${key}`)}</small>
																				<LevelRange current={current} target={target} />
																			</span>
																		))}
																	</button>
																	{renderTiles({
																		...group.cluster,
																		tasks: group.cluster.tasks.filter((task) => plannerTabForLine(
																			plan,
																			byId.get(plan.characterId),
																			weapon,
																			task.line,
																		) === 'talents'),
																	}, true, true, false)}
																</div>
															)}
														</td>
														<td>
															{plan && (
																<button type="button" className="planner-table-cell" onClick={() => editCharacter(group.characterId, 'artifacts')}>
																	{setName ? <span className="planner-table-set">{localize(setName)}</span> : (
																		<span className="planner-table-missing">{t('planner.artifactNone')}</span>
																	)}
																</button>
															)}
														</td>
													</tr>
												);
											})}
										</tbody>
									</table>
								</div>
							) : farm.sections.length === 0 && farm.idleCharacterIds.length === 0 ? (
								<p className="planner-empty">{t('planner.materialsEmpty')}</p>
							) : (
								<div className="planner-farm">
									{farm.sections.map((section) => renderSection(
										section.id,
										section.clusters,
										section.id === 'overworld' ? farm.idleCharacterIds : [],
									))}
									{farm.idleCharacterIds.length > 0 && !farm.sections.some((section) => section.id === 'overworld') && (
										renderSection('overworld', [], farm.idleCharacterIds)
									)}
								</div>
							)}
						</>
					)}
				</div>

				<div className="section-container">
					<h2>{t('planner.artifactsTitle')}</h2>
					{builds.length === 0 ? <p className="planner-empty">{t('planner.artifactsEmpty')}</p> : (
						<ul className="planner-artifact-list">
							{builds.map((plan) => {
								const build = plan.artifactBuild;
								if (!build) return null;
								const name = byId.get(plan.characterId)?.name ?? plan.characterId;
								const done = build.done === true;
								const lines = characterKeptLines(build, t, formatStat);
								const setNames = [build.set, build.setB].filter((entry): entry is string => Boolean(entry));
								const domains = [...new Set(setNames.flatMap((setName) => {
									const info = setsByName.get(setName.toLowerCase());
									if (info?.domain) return [localize(info.domain)];
									if (info?.source === 'boss') return [t('planner.artifactBoss')];
									return [];
								}))];
								return (
									<li key={plan.characterId} className={`planner-artifact${done ? ' is-done' : ''}${plan.favorite ? ' is-favorite' : ''}`}>
										<div className="planner-artifact-head">
											<RoundCheck
												checked={done}
												label={done ? t('planner.uncheck') : t('planner.check')}
												onClick={() => void run(() => savePlan({ ...plan, artifactBuild: { ...build, done: !done } }))}
											/>
											<button type="button" className="planner-artifact-who" onClick={() => editCharacter(plan.characterId, 'artifacts')}>
												<img src={characterIconUrl(plan.characterId)} alt="" onError={(event) => { event.currentTarget.style.display = 'none'; }} />
												<span>
													<strong>{name}</strong>
													<small>
														{setNames.length > 0 ? setNames.map((setName) => localize(setName)).join(' · ') : t('planner.noBuild')}
														{domains.length > 0 ? ` · ${domains.join(' · ')}` : ''}
													</small>
												</span>
											</button>
										</div>
										{lines.length > 0 && (
											<ul className="planner-artifact-lines">
												{lines.map((line) => (
													<li key={line.key} className={line.got || done ? 'is-got' : ''}>{line.label}</li>
												))}
											</ul>
										)}
									</li>
								);
							})}
						</ul>
					)}
				</div>
			</section>

			{modal && createPortal(
				<div className="planner-modal-overlay" onClick={() => { if (!saving) setModal(null); }}>
					<PlannerModal
						key={modal.mode === 'add' ? 'add' : `${modal.characterId}:${modal.tab}`}
						initialTab={modal.mode === 'edit' ? modal.tab : 'level'}
						mode={modal.mode}
						characters={modal.mode === 'add' ? available : characters}
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
							setSaving(true);
							void run(() => savePlan(plan)).then((ok) => {
								setSaving(false);
								if (ok) setModal(null);
							});
						}}
						onRemove={() => {
							if (modal.mode !== 'edit') return;
							setSaving(true);
							void run(() => removeCharacter(modal.characterId)).then((ok) => {
								setSaving(false);
								if (ok) setModal(null);
							});
						}}
					/>
				</div>,
				document.body,
			)}
		</div>
	);
};

export default Planner;
