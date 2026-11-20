import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
	ArrowRight,
	ChartLineUp,
	CircleDashed,
	Crown,
	Diamond,
	Drop,
	Eye,
	EyeSlash,
	Flame,
	Hourglass,
	Leaf,
	Lightning,
	Plus,
	Snowflake,
	Sparkle,
	Star,
	Sword,
	Target,
	Trash,
	WarningCircle,
	Wind,
	X,
} from 'phosphor-react';

import CharacterSelect from '../../components/character-select/character-select.tsx';
import ItemSelect from '../../components/item-select/item-select.tsx';
import SelectField from '../../components/select-field/select-field.tsx';
import {
	ArtifactBuild,
	CIRCLET_STATS,
	emptyArtifactBuild,
	GOBLET_STATS,
	hasArtifactPlan,
	SANDS_STATS,
	SUBSTATS,
} from '../../features/planner/artifactBuild.ts';
import { catalogItemForNeed } from '../../features/planner/farm.ts';
import {
	CharacterLevel,
	FarmNeed,
	isTalentLevel,
	LEVEL_RANKS,
	needsForCharacter,
	PlannedCharacter,
	PlannerTab,
	plannerTabForLine,
	rankIndex,
	rankKey,
	ranksFrom,
	WEAPON_LEVEL_RANKS,
	TALENT_LEVELS,
	TalentLevel,
} from '../../features/planner/materials.ts';
import { Character } from '../../services/genshin/charactersApi.ts';
import { GameData } from '../../services/genshin/gameDataApi.ts';
import { catalogIconUrl, characterIconUrl, weaponIconUrl } from '../../services/genshin/images.ts';
import { MaterialCatalog } from '../../services/genshin/materialsApi.ts';
import { Weapon } from '../../services/genshin/weaponsApi.ts';
import { RoundCheck } from './planner-shared.tsx';

const ELEMENT_ICONS: Record<string, typeof Flame> = {
	pyro: Flame,
	hydro: Drop,
	electro: Lightning,
	cryo: Snowflake,
	anemo: Wind,
	geo: Diamond,
	dendro: Leaf,
};

const WEAPON_ICONS: Record<string, typeof Sword> = {
	sword: Sword,
	claymore: Sword,
	polearm: ArrowRight,
	bow: Target,
	catalyst: Sparkle,
};

const TAB_ICONS = {
	level: ChartLineUp,
	weapon: Sword,
	talents: Sparkle,
	artifacts: Diamond,
} as const;

interface Selectable {
	id: string;
	name: string;
	nameFr?: string;
	rarity: number;
	image?: string;
}

interface PlannerModalProps {
	mode: 'add' | 'edit';
	characters: Character[];
	weapons: Weapon[];
	artifactChoices: Selectable[];
	charactersLoading: boolean;
	weaponsLoading: boolean;
	initial: PlannedCharacter | null;
	initialTab?: PlannerTab;
	saving: boolean;
	saveError: string | null;
	gameData: GameData | null;
	catalog: MaterialCatalog | null;
	localize: (name: string) => string;
	onClose: () => void;
	onSubmit: (plan: PlannedCharacter) => void;
	onRemove: () => void;
}

const PlannerModal: React.FC<PlannerModalProps> = ({
	mode,
	characters,
	weapons,
	artifactChoices,
	charactersLoading,
	weaponsLoading,
	initial,
	initialTab = 'level',
	saving,
	saveError,
	gameData,
	catalog,
	localize,
	onClose,
	onSubmit,
	onRemove,
}) => {
	const { t, i18n } = useTranslation();
	const french = i18n.language.toLowerCase().startsWith('fr');
	const [draftName, setDraftName] = useState('');
	const [currentLevel, setCurrentLevel] = useState<CharacterLevel>(initial?.currentLevel ?? 1);
	const [currentAscended, setCurrentAscended] = useState(initial?.currentAscended ?? false);
	const [targetLevel, setTargetLevel] = useState<CharacterLevel>(initial?.targetLevel ?? 1);
	const [targetAscended, setTargetAscended] = useState(initial?.targetAscended ?? false);
	const [weaponId, setWeaponId] = useState<string | null>(initial?.weaponId ?? null);
	const [weaponCurrent, setWeaponCurrent] = useState<CharacterLevel>(initial?.weaponCurrentLevel ?? 1);
	const [weaponCurrentAscended, setWeaponCurrentAscended] = useState(initial?.weaponCurrentAscended ?? false);
	const [weaponTarget, setWeaponTarget] = useState<CharacterLevel>(initial?.weaponTargetLevel ?? 1);
	const [weaponTargetAscended, setWeaponTargetAscended] = useState(initial?.weaponTargetAscended ?? false);
	const [talentNormal, setTalentNormal] = useState<TalentLevel>(initial?.talentNormal ?? 1);
	const [talentNormalTarget, setTalentNormalTarget] = useState<TalentLevel>(initial?.talentNormalTarget ?? 1);
	const [talentSkill, setTalentSkill] = useState<TalentLevel>(initial?.talentSkill ?? 1);
	const [talentSkillTarget, setTalentSkillTarget] = useState<TalentLevel>(initial?.talentSkillTarget ?? 1);
	const [talentBurst, setTalentBurst] = useState<TalentLevel>(initial?.talentBurst ?? 1);
	const [talentBurstTarget, setTalentBurstTarget] = useState<TalentLevel>(initial?.talentBurstTarget ?? 1);
	const [build, setBuild] = useState<ArtifactBuild>(initial?.artifactBuild ?? emptyArtifactBuild(initial?.artifactSet ?? null));
	const [checkedTasks, setCheckedTasks] = useState<string[]>(initial?.checkedTasks ?? []);
	const [hiddenTasks, setHiddenTasks] = useState<string[]>(initial?.hiddenTasks ?? []);
	const [notes, setNotes] = useState(initial?.notes ?? '');
	const [tab, setTab] = useState<PlannerTab>(initialTab);
	const skipSave = useRef(true);
	const onSubmitRef = useRef(onSubmit);
	onSubmitRef.current = onSubmit;

	const selected = mode === 'add'
		? characters.find((character) => character.name === draftName)
		: characters.find((character) => character.id === initial?.characterId);
	const weaponChoices = useMemo(() => (
		selected ? weapons.filter((weapon) => weapon.type === selected.weapon) : []
	), [weapons, selected]);
	const weaponName = weapons.find((weapon) => weapon.id === weaponId)?.name ?? '';
	const characterId = mode === 'add' ? selected?.id : initial?.characterId;

	const patchBuild = (patch: Partial<ArtifactBuild>) => setBuild((current) => ({ ...current, ...patch }));

	const metaRef = useRef({
		favorite: initial?.favorite ?? false,
		done: initial?.done ?? false,
		taskSignature: initial?.taskSignature ?? '',
	});
	metaRef.current = {
		favorite: initial?.favorite ?? false,
		done: initial?.done ?? false,
		taskSignature: initial?.taskSignature ?? '',
	};

	useEffect(() => {
		if (skipSave.current) {
			skipSave.current = false;
			return;
		}
		if (!characterId) return;
		onSubmitRef.current({
			characterId,
			currentLevel,
			currentAscended,
			targetLevel,
			targetAscended,
			weaponId,
			weaponCurrentLevel: weaponId ? weaponCurrent : null,
			weaponCurrentAscended: weaponId ? weaponCurrentAscended : false,
			weaponTargetLevel: weaponId ? weaponTarget : null,
			weaponTargetAscended: weaponId ? weaponTargetAscended : false,
			talentNormal,
			talentNormalTarget,
			talentSkill,
			talentSkillTarget,
			talentBurst,
			talentBurstTarget,
			artifactSet: build.set,
			favorite: metaRef.current.favorite,
			done: metaRef.current.done,
			taskSignature: metaRef.current.taskSignature,
			checkedTasks,
			hiddenTasks,
			artifactBuild: build,
			notes,
		});
	}, [
		characterId,
		currentLevel,
		currentAscended,
		targetLevel,
		targetAscended,
		weaponId,
		weaponCurrent,
		weaponCurrentAscended,
		weaponTarget,
		weaponTargetAscended,
		checkedTasks,
		hiddenTasks,
		talentNormal,
		talentNormalTarget,
		talentSkill,
		talentSkillTarget,
		talentBurst,
		talentBurstTarget,
		build,
		notes,
	]);

	const changeCurrent = (value: string) => {
		const rank = LEVEL_RANKS.find((item) => rankKey(item) === value);
		if (!rank) return;
		setCurrentLevel(rank.level);
		setCurrentAscended(rank.ascended);
		if (rankIndex(targetLevel, targetAscended) < rankIndex(rank.level, rank.ascended)) {
			setTargetLevel(rank.level);
			setTargetAscended(rank.ascended);
		}
	};

	const changeTarget = (value: string) => {
		const rank = LEVEL_RANKS.find((item) => rankKey(item) === value);
		if (!rank || rankIndex(rank.level, rank.ascended) < rankIndex(currentLevel, currentAscended)) return;
		setTargetLevel(rank.level);
		setTargetAscended(rank.ascended);
	};

	const changeWeaponCurrent = (value: string) => {
		const rank = WEAPON_LEVEL_RANKS.find((item) => rankKey(item) === value);
		if (!rank) return;
		setWeaponCurrent(rank.level);
		setWeaponCurrentAscended(rank.ascended);
		if (rankIndex(weaponTarget, weaponTargetAscended, WEAPON_LEVEL_RANKS) < rankIndex(rank.level, rank.ascended, WEAPON_LEVEL_RANKS)) {
			setWeaponTarget(rank.level);
			setWeaponTargetAscended(rank.ascended);
		}
	};

	const changeWeaponTarget = (value: string) => {
		const rank = WEAPON_LEVEL_RANKS.find((item) => rankKey(item) === value);
		if (!rank || rankIndex(rank.level, rank.ascended, WEAPON_LEVEL_RANKS) < rankIndex(weaponCurrent, weaponCurrentAscended, WEAPON_LEVEL_RANKS)) return;
		setWeaponTarget(rank.level);
		setWeaponTargetAscended(rank.ascended);
	};

	const changeTalentCurrent = (
		target: TalentLevel,
		setCurrent: (level: TalentLevel) => void,
		setTarget: (level: TalentLevel) => void,
		value: string,
	) => {
		const level = Number(value);
		if (!isTalentLevel(level)) return;
		setCurrent(level);
		if (target < level) setTarget(level);
	};

	const changeTalentTarget = (current: TalentLevel, setTarget: (level: TalentLevel) => void, value: string) => {
		const level = Number(value);
		if (!isTalentLevel(level) || level < current) return;
		setTarget(level);
	};

	const chooseCharacter = (name: string) => {
		setDraftName(name);
		const next = characters.find((character) => character.name === name);
		const weapon = weapons.find((item) => item.id === weaponId);
		if (!next || (weapon && weapon.type !== next.weapon)) {
			setWeaponId(null);
			setWeaponCurrent(1);
			setWeaponCurrentAscended(false);
			setWeaponTarget(1);
			setWeaponTargetAscended(false);
		}
	};

	const chooseWeapon = (name: string) => {
		const weapon = weaponChoices.find((item) => item.name === name);
		setWeaponId(weapon?.id ?? null);
		if (!weapon) {
			setWeaponCurrent(1);
			setWeaponCurrentAscended(false);
			setWeaponTarget(1);
			setWeaponTargetAscended(false);
		}
	};

	const chooseSet = (field: 'set' | 'setB', name: string) => {
		const found = artifactChoices.find((item) => item.name === name);
		patchBuild({ [field]: found?.name ?? null });
	};

	const showBuild = mode === 'edit' || draftName !== '';
	const resourceLines = useMemo(() => {
		if (!showBuild || !selected || !gameData || tab === 'artifacts') return [];
		const weapon = weapons.find((item) => item.id === weaponId);
		const plan: PlannedCharacter = {
			characterId: selected.id,
			currentLevel,
			currentAscended,
			targetLevel,
			targetAscended,
			weaponId,
			weaponCurrentLevel: weaponId ? weaponCurrent : null,
			weaponCurrentAscended: weaponId ? weaponCurrentAscended : false,
			weaponTargetLevel: weaponId ? weaponTarget : null,
			weaponTargetAscended: weaponId ? weaponTargetAscended : false,
			talentNormal,
			talentNormalTarget,
			talentSkill,
			talentSkillTarget,
			talentBurst,
			talentBurstTarget,
			artifactSet: build.set,
			favorite: false,
			done: false,
			taskSignature: '',
			checkedTasks,
			hiddenTasks,
			artifactBuild: build,
			notes,
		};
		const labelOf = (line: FarmNeed) => {
			if (line.kind === 'xp') return t('planner.heroWit');
			if (line.kind === 'weaponXp') return t('planner.mysticOre');
			if (line.kind === 'fortuna') return t('planner.stellaFortuna');
			if (line.kind === 'stone' && line.element && line.tier) {
				return t('planner.stones.label', {
					tier: t(`planner.stones.tiers.${line.tier}`),
					stone: t(`planner.stones.names.${line.element}`, { defaultValue: line.element }),
				});
			}
			const item = catalogItemForNeed(catalog?.items ?? [], line);
			return localize(item?.name ?? line.name ?? line.id);
		};
		return needsForCharacter(plan, selected, weapon, gameData, catalog?.experience)
			.filter((line) => line.kind !== 'mora' && plannerTabForLine(plan, selected, weapon, line) === tab)
			.map((line) => {
				const item = catalogItemForNeed(catalog?.items ?? [], line);
				const image = line.kind === 'weaponXp'
					? catalog?.weaponOreImage
					: line.kind === 'fortuna'
						? catalog?.fortunaImage
						: item?.image;
				const taskId = `${selected.id}:${line.id}`;
				return {
					id: line.id,
					taskId,
					name: labelOf(line),
					count: line.count,
					image,
					done: checkedTasks.includes(taskId),
					hidden: hiddenTasks.includes(taskId),
				};
			});
	}, [
		showBuild,
		selected,
		gameData,
		catalog,
		tab,
		weapons,
		weaponId,
		weaponCurrent,
		weaponCurrentAscended,
		weaponTarget,
		weaponTargetAscended,
		currentLevel,
		currentAscended,
		targetLevel,
		targetAscended,
		talentNormal,
		talentNormalTarget,
		talentSkill,
		talentSkillTarget,
		talentBurst,
		talentBurstTarget,
		build,
		checkedTasks,
		hiddenTasks,
		localize,
		t,
	]);

	const toggleResourceTask = (taskId: string) => {
		setCheckedTasks((current) => (
			current.includes(taskId)
				? current.filter((id) => id !== taskId)
				: [...current, taskId]
		));
	};

	const toggleHiddenTask = (taskId: string) => {
		setHiddenTasks((current) => (
			current.includes(taskId)
				? current.filter((id) => id !== taskId)
				: [...current, taskId]
		));
	};

	const ElementIcon = selected ? (ELEMENT_ICONS[selected.element] ?? Sparkle) : Sparkle;
	const WeaponTypeIcon = selected ? (WEAPON_ICONS[selected.weapon] ?? Sword) : Sword;
	const tabStatus = useMemo(() => {
		const levelTodo = rankIndex(currentLevel, currentAscended) < rankIndex(targetLevel, targetAscended);
		const weaponMissing = !weaponId;
		const weaponTodo = Boolean(
			weaponId
			&& rankIndex(weaponCurrent, weaponCurrentAscended, WEAPON_LEVEL_RANKS)
				< rankIndex(weaponTarget, weaponTargetAscended, WEAPON_LEVEL_RANKS),
		);
		const talentsTodo = talentNormal < talentNormalTarget
			|| talentSkill < talentSkillTarget
			|| talentBurst < talentBurstTarget;
		const artifactsMissing = !hasArtifactPlan(build);
		const artifactsTodo = !artifactsMissing && build.done !== true;
		return {
			level: levelTodo ? 'todo' as const : null,
			weapon: weaponMissing ? 'missing' as const : weaponTodo ? 'todo' as const : null,
			talents: talentsTodo ? 'todo' as const : null,
			artifacts: artifactsMissing ? 'missing' as const : artifactsTodo ? 'todo' as const : null,
		};
	}, [
		currentLevel,
		currentAscended,
		targetLevel,
		targetAscended,
		weaponId,
		weaponCurrent,
		weaponCurrentAscended,
		weaponTarget,
		weaponTargetAscended,
		talentNormal,
		talentNormalTarget,
		talentSkill,
		talentSkillTarget,
		talentBurst,
		talentBurstTarget,
		build,
	]);
	const statOptions = (stats: readonly string[]) => stats.map((stat) => ({
		value: stat,
		label: t(`planner.stats.${stat}`),
	}));

	return (
		<div className="planner-modal" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="planner-modal-title">
			<div className="planner-modal-header">
				<h2 id="planner-modal-title">{mode === 'add' ? t('planner.addTitle') : t('planner.editTitle')}</h2>
				<button type="button" onClick={onClose} aria-label={t('common.close')}>
					<X size={22} />
				</button>
			</div>
			<div className="planner-modal-body">
				<div className={`planner-modal-identity${selected ? ` rarity-${selected.rarity}` : ''}`}>
					{selected && (
						<div className="planner-modal-portrait">
							<img src={characterIconUrl(selected.id)} alt="" onError={(event) => { event.currentTarget.style.display = 'none'; }} />
						</div>
					)}
					<div className="planner-modal-identity-copy">
						{mode === 'add' ? (
							<CharacterSelect
								characters={characters}
								isLoading={charactersLoading}
								value={draftName}
								onChange={chooseCharacter}
								placeholder={t('characterSelect.placeholder')}
								required
							/>
						) : (
							<strong>{selected?.name ?? initial?.characterId}</strong>
						)}
						{selected && (
							<p>
								<span className="planner-modal-stars" aria-label={`${selected.rarity}`}>
									{Array.from({ length: selected.rarity }, (_, index) => <Star key={index} size={12} weight="fill" />)}
								</span>
								<span>
									<ElementIcon size={15} weight="fill" />
									{t(`planner.elements.${selected.element}`, { defaultValue: selected.element })}
								</span>
								<span>
									<WeaponTypeIcon size={15} />
									{t(`planner.weaponTypes.${selected.weapon}`, { defaultValue: selected.weapon })}
								</span>
							</p>
						)}
						{showBuild && (
							<textarea
								className="planner-notes"
								value={notes}
								onChange={(event) => setNotes(event.target.value)}
								placeholder={t('planner.notesPlaceholder')}
								aria-label={t('planner.notes')}
								rows={2}
							/>
						)}
					</div>
					{mode === 'edit' && (
						<button
							type="button"
							className="planner-modal-remove tooltip-anchor"
							onClick={onRemove}
							disabled={saving}
							aria-label={t('planner.remove')}
						>
							<Trash size={18} />
							<span className="tooltip left" role="tooltip">{t('planner.remove')}</span>
						</button>
					)}
				</div>
				{showBuild && (
					<>
						<div className="planner-tabs" role="tablist">
							{(['level', 'weapon', 'talents', 'artifacts'] as const).map((id) => {
								const Icon = TAB_ICONS[id];
								const status = tabStatus[id];
								const StatusIcon = status === 'missing' ? CircleDashed : WarningCircle;
								return (
									<button
										key={id}
										type="button"
										role="tab"
										aria-selected={tab === id}
										className={status ? `has-${status}` : undefined}
										onClick={() => setTab(id)}
									>
										<Icon size={16} />
										<span className="planner-tab-label">{t(`planner.tabs.${id}`)}</span>
										{status && (
											<span className={`planner-tab-status is-${status} tooltip-anchor`}>
												<StatusIcon size={13} weight="fill" aria-hidden="true" />
												<span className="tooltip top" role="tooltip">
													{t(`planner.tabStatus.${status}`)}
												</span>
											</span>
										)}
									</button>
								);
							})}
						</div>
						{tab === 'level' && (
						<section className="planner-form-block">
							<div className="planner-level-fields">
								<label>
									{t('planner.currentLevel')}
									<SelectField
										value={rankKey({ level: currentLevel, ascended: currentAscended })}
										onChange={changeCurrent}
										options={LEVEL_RANKS.map((rank) => ({
											value: rankKey(rank),
											label: rankKey(rank),
										}))}
									/>
								</label>
								<ArrowRight className="planner-level-arrow" size={18} />
								<label>
									{t('planner.targetLevel')}
									<SelectField
										value={rankKey({ level: targetLevel, ascended: targetAscended })}
										onChange={changeTarget}
										options={ranksFrom(currentLevel, currentAscended).map((rank) => ({
											value: rankKey(rank),
											label: rankKey(rank),
										}))}
									/>
								</label>
							</div>
						</section>
						)}
						{tab === 'weapon' && (
						<section className="planner-form-block">
							<ItemSelect
								items={weaponChoices.map((weapon) => ({ id: weapon.id, name: weapon.name, nameFr: weapon.nameFr, rarity: weapon.rarity, image: weaponIconUrl(weapon.id) }))}
								isLoading={weaponsLoading}
								value={weaponName}
								onChange={chooseWeapon}
								placeholder={t('planner.weaponNone')}
							/>
							{weaponId && (
								<>
									<div className="planner-weapon-picked">
										<img src={weaponIconUrl(weaponId)} alt="" onError={(event) => { event.currentTarget.style.display = 'none'; }} />
										<span>{french ? (weapons.find((weapon) => weapon.name === weaponName)?.nameFr ?? weaponName) : weaponName}</span>
										<button type="button" onClick={() => chooseWeapon('')}>{t('planner.weaponNone')}</button>
									</div>
									<div className="planner-level-fields">
										<label>
											{t('planner.currentLevel')}
											<SelectField
												value={rankKey({ level: weaponCurrent, ascended: weaponCurrentAscended })}
												onChange={changeWeaponCurrent}
												options={WEAPON_LEVEL_RANKS.map((rank) => ({
													value: rankKey(rank),
													label: rankKey(rank),
												}))}
											/>
										</label>
										<ArrowRight className="planner-level-arrow" size={18} />
										<label>
											{t('planner.targetLevel')}
											<SelectField
												value={rankKey({ level: weaponTarget, ascended: weaponTargetAscended })}
												onChange={changeWeaponTarget}
												options={ranksFrom(weaponCurrent, weaponCurrentAscended, WEAPON_LEVEL_RANKS).map((rank) => ({
													value: rankKey(rank),
													label: rankKey(rank),
												}))}
											/>
										</label>
									</div>
								</>
							)}
						</section>
						)}
						{tab === 'talents' && (
						<section className="planner-form-block">
							<div className="planner-talent-fields">
								<div className="planner-level-block">
									<span><Sword size={16} />{t('planner.talentNormal')}</span>
									<label>
										{t('planner.currentLevel')}
										<SelectField
											value={String(talentNormal)}
											onChange={(next) => changeTalentCurrent(talentNormalTarget, setTalentNormal, setTalentNormalTarget, next)}
											options={TALENT_LEVELS.map((level) => ({ value: String(level), label: String(level) }))}
										/>
									</label>
									<label>
										{t('planner.targetLevel')}
										<SelectField
											value={String(talentNormalTarget)}
											onChange={(next) => changeTalentTarget(talentNormal, setTalentNormalTarget, next)}
											options={TALENT_LEVELS.filter((level) => level >= talentNormal).map((level) => ({
												value: String(level),
												label: String(level),
											}))}
										/>
									</label>
								</div>
								<div className="planner-level-block">
									<span><Lightning size={16} />{t('planner.talentSkill')}</span>
									<label>
										{t('planner.currentLevel')}
										<SelectField
											value={String(talentSkill)}
											onChange={(next) => changeTalentCurrent(talentSkillTarget, setTalentSkill, setTalentSkillTarget, next)}
											options={TALENT_LEVELS.map((level) => ({ value: String(level), label: String(level) }))}
										/>
									</label>
									<label>
										{t('planner.targetLevel')}
										<SelectField
											value={String(talentSkillTarget)}
											onChange={(next) => changeTalentTarget(talentSkill, setTalentSkillTarget, next)}
											options={TALENT_LEVELS.filter((level) => level >= talentSkill).map((level) => ({
												value: String(level),
												label: String(level),
											}))}
										/>
									</label>
								</div>
								<div className="planner-level-block">
									<span><Star size={16} />{t('planner.talentBurst')}</span>
									<label>
										{t('planner.currentLevel')}
										<SelectField
											value={String(talentBurst)}
											onChange={(next) => changeTalentCurrent(talentBurstTarget, setTalentBurst, setTalentBurstTarget, next)}
											options={TALENT_LEVELS.map((level) => ({ value: String(level), label: String(level) }))}
										/>
									</label>
									<label>
										{t('planner.targetLevel')}
										<SelectField
											value={String(talentBurstTarget)}
											onChange={(next) => changeTalentTarget(talentBurst, setTalentBurstTarget, next)}
											options={TALENT_LEVELS.filter((level) => level >= talentBurst).map((level) => ({
												value: String(level),
												label: String(level),
											}))}
										/>
									</label>
								</div>
							</div>
						</section>
						)}
						{tab === 'artifacts' && (
						<section className="planner-form-block planner-artifacts">
							<div className="planner-artifact-sets">
								<div className="planner-field">
									<span>{t('planner.set')}</span>
									<ItemSelect items={artifactChoices} isLoading={false} value={build.set ?? ''} onChange={(name) => chooseSet('set', name)} placeholder={t('planner.artifactNone')} />
								</div>
								<div className="planner-field">
									<span>{t('planner.setB')}</span>
									<ItemSelect items={artifactChoices} isLoading={false} value={build.setB ?? ''} onChange={(name) => chooseSet('setB', name)} placeholder={t('planner.artifactNone')} />
								</div>
							</div>
							<div className="planner-main-stats">
								{([
									['sands', SANDS_STATS],
									['goblet', GOBLET_STATS],
									['circlet', CIRCLET_STATS],
								] as const).map(([slot, stats]) => (
									<label key={slot} className="planner-main-stat">
										<span className="planner-slot-label">
											{slot === 'sands' && <Hourglass size={14} />}
											{slot === 'goblet' && <Drop size={14} />}
											{slot === 'circlet' && <Crown size={14} />}
											{t(`planner.slots.${slot}`)}
										</span>
										<SelectField
											value={build[slot]}
											onChange={(next) => patchBuild({ [slot]: next })}
											options={[
												{ value: '', label: t('planner.any') },
												...statOptions(stats),
											]}
										/>
									</label>
								))}
							</div>
							<div className="planner-subs">
								<span className="planner-subs-title">{t('planner.subs')}</span>
								{build.subs.map((sub, index) => (
									<div key={`sub-${index}`} className="planner-sub">
										<SelectField
											value={sub.stat}
											aria-label={t('planner.chooseStat')}
											onChange={(next) => patchBuild({
												subs: build.subs.map((entry, entryIndex) => (entryIndex === index ? { ...entry, stat: next } : entry)),
											})}
											options={[
												{ value: '', label: t('planner.chooseStat') },
												...statOptions(SUBSTATS),
											]}
										/>
										<input
											type="text"
											inputMode="decimal"
											aria-label={t('planner.targetValue')}
											placeholder={t('planner.targetValue')}
											value={sub.target}
											onChange={(event) => patchBuild({
												subs: build.subs.map((entry, entryIndex) => (entryIndex === index ? { ...entry, target: event.target.value } : entry)),
											})}
										/>
										<button type="button" className="planner-sub-remove" onClick={() => patchBuild({ subs: build.subs.filter((_, entryIndex) => entryIndex !== index) })} aria-label={t('planner.removeStat')}>
											<X size={14} />
										</button>
									</div>
								))}
								<button type="button" className="planner-clear" onClick={() => patchBuild({ subs: [...build.subs, { stat: '', current: 0, target: '' }] })}>
									<Plus size={14} />
									{t('planner.addStat')}
								</button>
							</div>
						</section>
						)}
					</>
				)}
				{resourceLines.length > 0 && (
					<div className="planner-modal-resources">
						<h3>{t('planner.views.resources')}</h3>
						<ul className="planner-task-tiles">
							{resourceLines.map((line) => (
								<li key={line.id} className="tooltip-anchor">
									<div className={`planner-task-tile${line.done ? ' is-checked' : ''}${line.hidden ? ' is-hidden' : ''}`}>
										{line.image && (
											<img
												src={catalogIconUrl(line.image)}
												alt=""
												onError={(event) => { event.currentTarget.style.display = 'none'; }}
											/>
										)}
										<span className="planner-task-count">
											{line.done ? (
												<span className="is-struck">× {line.count.toLocaleString(i18n.language)}</span>
											) : (
												<>× {line.count.toLocaleString(i18n.language)}</>
											)}
										</span>
										<button
											type="button"
											className={`planner-hide${line.hidden ? ' is-on' : ''}`}
											aria-pressed={line.hidden}
											aria-label={line.hidden ? t('planner.showResource') : t('planner.hideResource')}
											onClick={(event) => {
												event.stopPropagation();
												toggleHiddenTask(line.taskId);
											}}
										>
											{line.hidden
												? <EyeSlash size={12} weight="bold" />
												: <Eye size={12} weight="bold" />}
										</button>
										<RoundCheck
											checked={line.done}
											label={`${line.name}, ${line.done ? t('planner.uncheck') : t('planner.check')}`}
											onClick={() => toggleResourceTask(line.taskId)}
										/>
									</div>
									<span className="tooltip top" role="tooltip" aria-hidden="true">{line.name}</span>
								</li>
							))}
						</ul>
					</div>
				)}
				{saveError && <p className="planner-save-error">{t('planner.saveError')}</p>}
			</div>
		</div>
	);
};

export default PlannerModal;
