import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CaretDown, CaretUp, Stack, Table, User } from 'phosphor-react';

import { hasArtifactPlan } from '../../features/planner/artifactBuild.ts';
import { shortDomainName } from '../../features/planner/artifactFarm.ts';
import { FarmCluster, FarmSectionId, FarmTask, FarmView } from '../../features/planner/farm.ts';
import {
	FarmLine,
	PlannedCharacter,
	PlannerTab,
	plannerTabForLine,
	rankIndex,
} from '../../features/planner/materials.ts';
import { LateUnfold } from '../../components/unfold/unfold.tsx';
import { Character } from '../../services/genshin/charactersApi.ts';
import { catalogIconUrl, characterIconUrl, weaponIconUrl } from '../../services/genshin/images.ts';
import { Weapon } from '../../services/genshin/weaponsApi.ts';
import { LevelRange, RoundCheck } from './planner-shared.tsx';

type FarmViewMode = 'source' | 'character' | 'table';
type TableSortKey = 'character' | 'level' | 'weapon' | 'talents' | 'artifacts';
type TableSort = { key: TableSortKey; dir: 'asc' | 'desc' };

const FARM_VIEW_KEY = 'planner_farm_view';
const TABLE_SORT_KEYS: TableSortKey[] = ['character', 'level', 'weapon', 'talents', 'artifacts'];
const FARM_VIEWS: { mode: FarmViewMode; icon: typeof Stack }[] = [
	{ mode: 'source', icon: Stack },
	{ mode: 'character', icon: User },
	{ mode: 'table', icon: Table },
];

function isFarmViewMode(value: string | null | undefined): value is FarmViewMode {
	return value === 'character' || value === 'table' || value === 'source';
}

function farmViewStorageKey(userId: string | null | undefined) {
	return userId ? `${FARM_VIEW_KEY}:${userId}` : FARM_VIEW_KEY;
}

export function readFarmView(userId?: string | null): FarmViewMode {
	try {
		const scoped = localStorage.getItem(farmViewStorageKey(userId));
		if (isFarmViewMode(scoped)) return scoped;
		const legacy = localStorage.getItem(FARM_VIEW_KEY);
		if (isFarmViewMode(legacy)) return legacy;
	} catch {
		/* navigation privée */
	}
	return 'source';
}

function writeFarmView(mode: FarmViewMode, userId?: string | null) {
	try {
		localStorage.setItem(farmViewStorageKey(userId), mode);
		localStorage.setItem(FARM_VIEW_KEY, mode);
	} catch {
		/* navigation privée */
	}
}

interface PlannerMaterialsProps {
	farm: FarmView | null;
	plans: PlannedCharacter[];
	weapons: Weapon[];
	byId: Map<string, Character>;
	userId: string | null;
	loading: boolean;
	localize: (name: string) => string;
	onEdit: (characterId: string, tab?: PlannerTab) => void;
	onSavePlan: (plan: PlannedCharacter) => Promise<void>;
}

const PlannerMaterials: React.FC<PlannerMaterialsProps> = ({
	farm,
	plans,
	weapons,
	byId,
	userId,
	loading,
	localize,
	onEdit,
	onSavePlan,
}) => {
	const { t, i18n } = useTranslation();
	const [farmView, setFarmView] = useState<FarmViewMode>(() => readFarmView(userId));
	const [tableSort, setTableSort] = useState<TableSort>({ key: 'character', dir: 'asc' });

	useEffect(() => {
		setFarmView(readFarmView(userId));
	}, [userId]);

	const formatCount = (count: number) => count.toLocaleString(i18n.language);
	const dayLabel = (count: number) => (count <= 1 ? t('planner.day') : t('planner.days', { count }));

	const taskName = (task: FarmTask) => {
		const line: FarmLine = task.line;
		if (line.kind === 'mora') return t('planner.mora');
		if (line.kind === 'xp') return t('planner.heroWit');
		if (line.kind === 'fortuna') return t('planner.stellaFortuna');
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
		if (cluster.title === 'stones') return t('planner.stones.group');
		if (cluster.title === 'Masterless Stella Fortuna') return t('planner.stellaFortuna');
		return shortDomainName(localize(cluster.title));
	};

	const sourceLabel = (name: string) => {
		if (name === 'Blossom of Wealth') return t('planner.blossoms.wealth');
		if (name === 'Blossom of Revelation') return t('planner.blossoms.revelation');
		return shortDomainName(localize(name));
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
		writeFarmView(mode, userId);
	};

	const characterGroups = useMemo(() => {
		if (!farm) return [] as { characterId: string; favorite: boolean; cluster: FarmCluster }[];
		const checkedIds = new Set(plans.flatMap((plan) => plan.checkedTasks));
		const isDone = (cluster: FarmCluster) => (
			cluster.tasks.length > 0 && cluster.tasks.every((task) => checkedIds.has(task.id))
		);
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
			Number(isDone(left.cluster)) - Number(isDone(right.cluster))
			|| Number(right.favorite) - Number(left.favorite)
			|| left.cluster.title.localeCompare(right.cluster.title, i18n.language)
		));
		return groups;
	}, [farm, plans, byId, i18n.language]);

	const toggleTableSort = (key: TableSortKey) => {
		setTableSort((previous) => (
			previous.key === key
				? { key, dir: previous.dir === 'asc' ? 'desc' : 'asc' }
				: { key, dir: 'asc' }
		));
	};

	const tableGroups = useMemo(() => {
		const direction = tableSort.dir === 'asc' ? 1 : -1;
		const byName = (left: string, right: string) => left.localeCompare(right, i18n.language);
		const planOf = (characterId: string) => plans.find((item) => item.characterId === characterId);
		const weaponName = (plan: PlannedCharacter | undefined) => {
			if (!plan?.weaponId) return '';
			const weapon = weapons.find((item) => item.id === plan.weaponId);
			return weapon ? localize(weapon.name) : '';
		};
		const setName = (plan: PlannedCharacter | undefined) => {
			const name = plan?.artifactBuild?.set ?? plan?.artifactSet ?? '';
			return name ? localize(name) : '';
		};
		const emptyLast = (left: string, right: string) => Number(!left) - Number(!right);

		return [...characterGroups].sort((left, right) => {
			const favorite = Number(right.favorite) - Number(left.favorite);
			if (favorite) return favorite;

			const leftPlan = planOf(left.characterId);
			const rightPlan = planOf(right.characterId);
			let compare = 0;

			if (tableSort.key === 'character') {
				compare = byName(left.cluster.title, right.cluster.title);
			} else if (tableSort.key === 'level') {
				compare = (leftPlan && rightPlan)
					? (
						rankIndex(leftPlan.currentLevel, leftPlan.currentAscended)
						- rankIndex(rightPlan.currentLevel, rightPlan.currentAscended)
						|| rankIndex(leftPlan.targetLevel, leftPlan.targetAscended)
						- rankIndex(rightPlan.targetLevel, rightPlan.targetAscended)
					)
					: 0;
			} else if (tableSort.key === 'weapon') {
				const leftWeapon = weaponName(leftPlan);
				const rightWeapon = weaponName(rightPlan);
				const empty = emptyLast(leftWeapon, rightWeapon);
				if (empty) return empty;
				compare = byName(leftWeapon, rightWeapon);
			} else if (tableSort.key === 'talents') {
				const talentGap = (plan: PlannedCharacter | undefined) => {
					if (!plan) return 0;
					return Math.max(0, plan.talentNormalTarget - plan.talentNormal)
						+ Math.max(0, plan.talentSkillTarget - plan.talentSkill)
						+ Math.max(0, plan.talentBurstTarget - plan.talentBurst);
				};
				compare = talentGap(leftPlan) - talentGap(rightPlan);
			} else {
				const needsArtifactFarm = (plan: PlannedCharacter | undefined) => {
					const build = plan?.artifactBuild ?? null;
					return hasArtifactPlan(build) && build?.done !== true;
				};
				const farmOrder = Number(needsArtifactFarm(rightPlan)) - Number(needsArtifactFarm(leftPlan));
				if (farmOrder) return farmOrder;
				const leftSet = setName(leftPlan);
				const rightSet = setName(rightPlan);
				const empty = emptyLast(leftSet, rightSet);
				if (empty) return empty;
				compare = byName(leftSet, rightSet);
			}

			return compare * direction || byName(left.cluster.title, right.cluster.title);
		});
	}, [characterGroups, tableSort, plans, weapons, i18n.language, localize]);

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

	const toggleTask = (task: FarmTask) => {
		const plan = plans.find((item) => item.characterId === task.characterId);
		if (!plan) return;
		const has = checked(plan, task.id);
		void onSavePlan({
			...plan,
			checkedTasks: has
				? plan.checkedTasks.filter((id) => id !== task.id)
				: [...plan.checkedTasks, task.id],
		});
	};

	const renderTiles = (cluster: FarmCluster, byCharacter = false) => {
		const rows = materialRows(cluster);
		if (rows.length === 0) return null;
		return (
			<ul className="planner-task-tiles">
				{rows.map((row) => {
					const sample = row[0];
					const count = row.reduce((total, task) => total + task.line.count, 0);
					const remaining = row.reduce((total, task) => (
						taskChecked(task) ? total : total + task.line.count
					), 0);
					const doneCount = row.filter(taskChecked).length;
					const done = doneCount === row.length;
					const partial = !done && doneCount > 0;
					const name = taskName(sample);
					const favorite = row.some((task) => task.favorite);
					const people = [...row].sort((left, right) => (
						Number(right.favorite) - Number(left.favorite)
						|| left.characterName.localeCompare(right.characterName, i18n.language)
					));
					return (
						<li key={sample.line.id} className="planner-task-group">
							<div className="tooltip-anchor">
								<div className={`planner-task-tile${done ? ' is-checked' : ''}${partial ? ' is-partial' : ''}${favorite ? ' is-favorite' : ''}`}>
									{sample.item?.image && (
										<img src={catalogIconUrl(sample.item.image)} alt={name} onError={(event) => { event.currentTarget.style.display = 'none'; }} />
									)}
									<span className="planner-task-count">
										{(done || partial) ? (
											<span className="is-struck">× {formatCount(count)}</span>
										) : (
											<>× {formatCount(count)}</>
										)}
										{partial && (
											<span className="is-remaining">× {formatCount(remaining)}</span>
										)}
									</span>
									{byCharacter && (
										<RoundCheck
											checked={done}
											label={`${name}, ${done ? t('planner.uncheck') : t('planner.check')}`}
											onClick={() => toggleTask(sample)}
										/>
									)}
								</div>
								<span className="tooltip top" role="tooltip" aria-hidden="true">{name}</span>
							</div>
							{!byCharacter && (
								<div className="planner-faces">
									{people.map((task) => {
										const plan = plans.find((item) => item.characterId === task.characterId);
										const taskDone = plan ? checked(plan, task.id) : false;
										const character = byId.get(task.characterId);
										const weapon = plan?.weaponId ? weapons.find((item) => item.id === plan.weaponId) : undefined;
										const tab = plan
											? plannerTabForLine(plan, character, weapon, task.line)
											: 'level';
										return (
											<span key={task.id} className="tooltip-anchor planner-task-face">
												<span className="planner-task-face-wrap">
													<button
														type="button"
														className={`planner-face${taskDone ? ' is-checked' : ''}${task.favorite ? ' is-favorite' : ''}`}
														aria-label={task.characterName}
														onClick={() => onEdit(task.characterId, tab)}
													>
														<img src={characterIconUrl(task.characterId)} alt="" onError={(event) => { event.currentTarget.style.display = 'none'; }} />
													</button>
													<RoundCheck
														checked={taskDone}
														label={`${task.characterName}, ${taskDone ? t('planner.uncheck') : t('planner.check')}`}
														onClick={() => toggleTask(task)}
													/>
												</span>
												<span className="tooltip top" role="tooltip" aria-hidden="true">{task.characterName}</span>
											</span>
										);
									})}
								</div>
							)}
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
		const groupFavorite = byCharacter
			? plans.some((plan) => plan.characterId === cluster.key && plan.favorite)
			: cluster.tasks.some((task) => task.favorite);
		const tiles = renderTiles(cluster, byCharacter);
		const portraitDone = byCharacter && clusterDone(cluster);
		return (
			<article key={cluster.key} className={`planner-cluster${single ? ' is-single' : ''}${groupFavorite ? ' is-favorite' : ''}`}>
				<header className={byCharacter ? 'is-character' : undefined}>
					{byCharacter && (
						<button
							type="button"
							className={`planner-face${portraitDone ? ' is-checked' : ''}${groupFavorite ? ' is-favorite' : ''}`}
							aria-label={title}
							onClick={() => onEdit(cluster.key)}
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
				{tiles}
			</article>
		);
	};

	const renderEnemyGroups = (common: FarmCluster[], elite: FarmCluster[]) => (
		<section className="planner-farm-section">
			<h3>{t('planner.sections.enemies')}</h3>
			<div className="planner-cluster-grid">
				{orderClusters([...common, ...elite]).map((cluster) => renderCluster(cluster))}
			</div>
		</section>
	);

	const renderSection = (id: FarmSectionId, clusters: FarmCluster[]) => {
		const single = id === 'boss' || id === 'local';
		return (
			<section key={id} className={`planner-farm-section${id === 'today' ? ' is-today' : ''}`}>
				<h3>{t(`planner.sections.${id}`)}</h3>
				<div className={`planner-cluster-grid${single ? ' is-single' : ''}`}>
					{orderClusters(clusters).map((cluster) => renderCluster(cluster, single))}
				</div>
			</section>
		);
	};

	return (
		<div className="section-container">
			<h2>{t('planner.materials')}</h2>
			<LateUnfold
				loading={loading || !farm}
				className="admin-unfold"
				fallback={<p className="planner-loading" aria-live="polite">{t('planner.loadingMaterials')}</p>}
			>
				{plans.length === 0 ? (
					<p className="planner-empty">{t('planner.materialsNeedRoster')}</p>
				) : (
				<>
					<div className="planner-materials-bar">
						<ul className="planner-stats">
							{farm.resin > 0 && (
								<li>
									{farm.stock.resinImage && <img src={catalogIconUrl(farm.stock.resinImage)} alt="" />}
									<div className="planner-stat">
										<strong>{formatCount(farm.resin)}</strong>
										<span>
											{formatCount(Math.ceil(farm.resin / 40))} {t('planner.condensedResin')}
											{' · '}
											{dayLabel(farm.days)}
										</span>
									</div>
								</li>
							)}
							{farm.stock.mora > 0 && (
								<li>
									{farm.stock.moraImage && <img src={catalogIconUrl(farm.stock.moraImage)} alt="" />}
									<div className="planner-stat">
										<strong>{formatCount(farm.stock.mora)}</strong>
										<span>{t('planner.mora')}</span>
									</div>
								</li>
							)}
							{farm.stock.xp > 0 && (
								<li>
									{farm.stock.xpImage && <img src={catalogIconUrl(farm.stock.xpImage)} alt="" />}
									<div className="planner-stat">
										<strong>{formatCount(farm.stock.xp)}</strong>
										<span>{t('planner.heroWit')}</span>
									</div>
								</li>
							)}
							{farm.stock.weaponOre > 0 && (
								<li>
									{farm.stock.weaponOreImage && <img src={catalogIconUrl(farm.stock.weaponOreImage)} alt="" />}
									<div className="planner-stat">
										<strong>{formatCount(farm.stock.weaponOre)}</strong>
										<span>{t('planner.mysticOre')}</span>
									</div>
								</li>
							)}
						</ul>
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
					</div>
					{farmView === 'character' ? (
						characterGroups.some((group) => group.cluster.tasks.length > 0) ? (
							<div className="planner-cluster-grid">
								{characterGroups
									.filter((group) => group.cluster.tasks.length > 0)
									.map((group) => renderCluster(group.cluster, false, true))}
							</div>
						) : (
							<p className="planner-empty">{t('planner.materialsEmpty')}</p>
						)
					) : farmView === 'table' ? (
						<div className="planner-table-wrap">
							<table className="planner-table">
								<thead>
									<tr>
										{TABLE_SORT_KEYS.map((key) => {
											const active = tableSort.key === key;
											const label = key === 'character'
												? t('planner.characters')
												: t(`planner.tabs.${key}`);
											return (
												<th
													key={key}
													aria-sort={active ? (tableSort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
												>
													<button
														type="button"
														className={`planner-table-sort${active ? ' is-active' : ''}`}
														onClick={() => toggleTableSort(key)}
													>
														{label}
														{active ? (
															tableSort.dir === 'asc'
																? <CaretUp size={12} weight="bold" aria-hidden="true" />
																: <CaretDown size={12} weight="bold" aria-hidden="true" />
														) : (
															<span className="planner-table-sort-placeholder" aria-hidden="true" />
														)}
													</button>
												</th>
											);
										})}
									</tr>
								</thead>
								<tbody>
									{tableGroups.map((group) => {
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
															onClick={() => onEdit(group.characterId, 'level')}
														>
															<img src={characterIconUrl(group.characterId)} alt="" onError={(event) => { event.currentTarget.style.display = 'none'; }} />
														</button>
														<button type="button" className="planner-table-name" onClick={() => onEdit(group.characterId, 'level')}>
															{group.cluster.title}
														</button>
													</span>
												</th>
												<td>
													{plan && (
														<div className="planner-table-level">
															<button type="button" className="planner-table-cell" onClick={() => onEdit(group.characterId, 'level')}>
																<LevelRange current={plan.currentLevel} currentAscended={plan.currentAscended} target={plan.targetLevel} targetAscended={plan.targetAscended} />
															</button>
															{renderTiles({
																...group.cluster,
																tasks: group.cluster.tasks.filter((task) => plannerTabForLine(
																	plan,
																	byId.get(plan.characterId),
																	weapon,
																	task.line,
																) === 'level'),
															}, true)}
														</div>
													)}
												</td>
												<td>
													{plan && (
														<div className="planner-table-level">
															<button type="button" className="planner-table-weapon" onClick={() => onEdit(group.characterId, 'weapon')}>
																{weapon ? (
																	<>
																		<img src={weaponIconUrl(weapon.id)} alt="" onError={(event) => { event.currentTarget.style.display = 'none'; }} />
																		<span>
																			<strong>{localize(weapon.name)}</strong>
																			{plan.weaponCurrentLevel != null && plan.weaponTargetLevel != null && (
																				<LevelRange current={plan.weaponCurrentLevel} currentAscended={plan.weaponCurrentAscended} target={plan.weaponTargetLevel} targetAscended={plan.weaponTargetAscended} />
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
															}, true)}
														</div>
													)}
												</td>
												<td>
													{plan && (
														<div className="planner-table-level">
															<button type="button" className="planner-table-talents" onClick={() => onEdit(group.characterId, 'talents')}>
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
															}, true)}
														</div>
													)}
												</td>
												<td>
													{plan && (
														<button type="button" className="planner-table-cell" onClick={() => onEdit(group.characterId, 'artifacts')}>
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
					) : farm.sections.length === 0 ? (
						<p className="planner-empty">{t('planner.materialsEmpty')}</p>
					) : (
						<div className="planner-farm">
							{farm.sections.flatMap((section, index) => {
								if (section.id !== 'common' && section.id !== 'elite') {
									return [renderSection(section.id, section.clusters)];
								}
								if (farm.sections.slice(0, index).some((item) => item.id === 'common' || item.id === 'elite')) return [];
								return [renderEnemyGroups(
									farm.sections.find((item) => item.id === 'common')?.clusters ?? [],
									farm.sections.find((item) => item.id === 'elite')?.clusters ?? [],
								)];
							})}
						</div>
					)}
				</>
				)}
			</LateUnfold>
		</div>
	);
};

export default PlannerMaterials;
