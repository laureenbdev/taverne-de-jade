import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
	ArrowRight,
	ChartLineUp,
	Check,
	Crown,
	Diamond,
	Drop,
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
	Wind,
	X,
} from 'phosphor-react';

import CharacterSelect from '../../components/character-select/character-select.tsx';
import ItemSelect from '../../components/item-select/item-select.tsx';
import {
	ArtifactBuild,
	CIRCLET_STATS,
	emptyArtifactBuild,
	GOBLET_STATS,
	SANDS_STATS,
	SUBSTATS,
} from '../../features/planner/artifactBuild.ts';
import { catalogItemForNeed } from '../../features/planner/farm.ts';
import {
	CHARACTER_LEVELS,
	CharacterLevel,
	FarmNeed,
	isCharacterLevel,
	isTalentLevel,
	needsForCharacter,
	PlannedCharacter,
	PlannerTab,
	plannerTabForLine,
	TALENT_LEVELS,
	TalentLevel,
} from '../../features/planner/materials.ts';
import { Character } from '../../services/genshin/charactersApi.ts';
import { GameData } from '../../services/genshin/gameDataApi.ts';
import { catalogIconUrl, characterIconUrl, weaponIconUrl } from '../../services/genshin/images.ts';
import { MaterialCatalog } from '../../services/genshin/materialsApi.ts';
import { Weapon } from '../../services/genshin/weaponsApi.ts';

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
	const [targetLevel, setTargetLevel] = useState<CharacterLevel>(initial?.targetLevel ?? 90);
	const [weaponId, setWeaponId] = useState<string | null>(initial?.weaponId ?? null);
	const [weaponCurrent, setWeaponCurrent] = useState<CharacterLevel>(initial?.weaponCurrentLevel ?? 1);
	const [weaponTarget, setWeaponTarget] = useState<CharacterLevel>(initial?.weaponTargetLevel ?? 1);
	const [talentNormal, setTalentNormal] = useState<TalentLevel>(initial?.talentNormal ?? 1);
	const [talentNormalTarget, setTalentNormalTarget] = useState<TalentLevel>(initial?.talentNormalTarget ?? 1);
	const [talentSkill, setTalentSkill] = useState<TalentLevel>(initial?.talentSkill ?? 1);
	const [talentSkillTarget, setTalentSkillTarget] = useState<TalentLevel>(initial?.talentSkillTarget ?? 1);
	const [talentBurst, setTalentBurst] = useState<TalentLevel>(initial?.talentBurst ?? 1);
	const [talentBurstTarget, setTalentBurstTarget] = useState<TalentLevel>(initial?.talentBurstTarget ?? 1);
	const [build, setBuild] = useState<ArtifactBuild>(initial?.artifactBuild ?? emptyArtifactBuild(initial?.artifactSet ?? null));
	const [tab, setTab] = useState<PlannerTab>(initialTab);

	const selected = mode === 'add'
		? characters.find((character) => character.name === draftName)
		: characters.find((character) => character.id === initial?.characterId);
	const weaponChoices = useMemo(() => (
		selected ? weapons.filter((weapon) => weapon.type === selected.weapon) : []
	), [weapons, selected]);
	const weaponName = weapons.find((weapon) => weapon.id === weaponId)?.name ?? '';

	const patchBuild = (patch: Partial<ArtifactBuild>) => setBuild((current) => ({ ...current, ...patch }));

	const changeCurrent = (value: string) => {
		const level = Number(value);
		if (!isCharacterLevel(level)) return;
		setCurrentLevel(level);
		if (targetLevel < level) setTargetLevel(level);
	};

	const changeTarget = (value: string) => {
		const level = Number(value);
		if (!isCharacterLevel(level) || level < currentLevel) return;
		setTargetLevel(level);
	};

	const changeWeaponCurrent = (value: string) => {
		const level = Number(value);
		if (!isCharacterLevel(level)) return;
		setWeaponCurrent(level);
		if (weaponTarget < level) setWeaponTarget(level);
	};

	const changeWeaponTarget = (value: string) => {
		const level = Number(value);
		if (!isCharacterLevel(level) || level < weaponCurrent) return;
		setWeaponTarget(level);
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
			setWeaponTarget(1);
		}
	};

	const chooseWeapon = (name: string) => {
		const weapon = weaponChoices.find((item) => item.name === name);
		setWeaponId(weapon?.id ?? null);
		if (!weapon) {
			setWeaponCurrent(1);
			setWeaponTarget(1);
		}
	};

	const chooseSet = (field: 'set' | 'setB', name: string) => {
		const found = artifactChoices.find((item) => item.name === name);
		patchBuild({ [field]: found?.name ?? null });
	};

	const submit = (event: React.FormEvent) => {
		event.preventDefault();
		const characterId = mode === 'add' ? selected?.id : initial?.characterId;
		if (!characterId) return;
		const plan: PlannedCharacter = {
			characterId,
			currentLevel,
			targetLevel,
			weaponId,
			weaponCurrentLevel: weaponId ? weaponCurrent : null,
			weaponTargetLevel: weaponId ? weaponTarget : null,
			talentNormal,
			talentNormalTarget,
			talentSkill,
			talentSkillTarget,
			talentBurst,
			talentBurstTarget,
			artifactSet: build.set,
			favorite: initial?.favorite ?? false,
			done: initial?.done ?? false,
			taskSignature: initial?.taskSignature ?? '',
			checkedTasks: initial?.checkedTasks ?? [],
			artifactBuild: build,
		};
		onSubmit(plan);
	};

	const showBuild = mode === 'edit' || draftName !== '';
	const resourceLines = useMemo(() => {
		if (!showBuild || !selected || !gameData || tab === 'artifacts') return [];
		const weapon = weapons.find((item) => item.id === weaponId);
		const plan: PlannedCharacter = {
			characterId: selected.id,
			currentLevel,
			targetLevel,
			weaponId,
			weaponCurrentLevel: weaponId ? weaponCurrent : null,
			weaponTargetLevel: weaponId ? weaponTarget : null,
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
			checkedTasks: [],
			artifactBuild: build,
		};
		const labelOf = (line: FarmNeed) => {
			if (line.kind === 'xp') return t('planner.heroWit');
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
				return { id: line.id, name: labelOf(line), count: line.count, image: item?.image };
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
		weaponTarget,
		currentLevel,
		targetLevel,
		talentNormal,
		talentNormalTarget,
		talentSkill,
		talentSkillTarget,
		talentBurst,
		talentBurstTarget,
		build,
		localize,
		t,
	]);
	const ElementIcon = selected ? (ELEMENT_ICONS[selected.element] ?? Sparkle) : Sparkle;
	const WeaponTypeIcon = selected ? (WEAPON_ICONS[selected.weapon] ?? Sword) : Sword;
	const statOptions = (stats: readonly string[]) => stats.map((stat) => (
		<option key={stat} value={stat}>{t(`planner.stats.${stat}`)}</option>
	));

	return (
		<div className="planner-modal" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="planner-modal-title">
			<div className="planner-modal-header">
				<h2 id="planner-modal-title">{mode === 'add' ? t('planner.addTitle') : t('planner.editTitle')}</h2>
				<button type="button" onClick={onClose} aria-label={t('common.close')}>
					<X size={22} />
				</button>
			</div>
			<form onSubmit={submit}>
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
					</div>
				</div>
				{showBuild && (
					<>
						<div className="planner-tabs" role="tablist">
							{(['level', 'weapon', 'talents', 'artifacts'] as const).map((id) => {
								const Icon = TAB_ICONS[id];
								return (
									<button
										key={id}
										type="button"
										role="tab"
										aria-selected={tab === id}
										onClick={() => setTab(id)}
									>
										<Icon size={16} />
										{t(`planner.tabs.${id}`)}
									</button>
								);
							})}
						</div>
						{tab === 'level' && (
						<section className="planner-form-block">
							<div className="planner-level-fields">
								<label>
									{t('planner.currentLevel')}
									<select value={currentLevel} onChange={(event) => changeCurrent(event.target.value)}>
										{CHARACTER_LEVELS.map((level) => <option key={level} value={level}>{level}</option>)}
									</select>
								</label>
								<ArrowRight className="planner-level-arrow" size={18} />
								<label>
									{t('planner.targetLevel')}
									<select value={targetLevel} onChange={(event) => changeTarget(event.target.value)}>
										{CHARACTER_LEVELS.filter((level) => level >= currentLevel).map((level) => <option key={level} value={level}>{level}</option>)}
									</select>
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
											<select value={weaponCurrent} onChange={(event) => changeWeaponCurrent(event.target.value)}>
												{CHARACTER_LEVELS.map((level) => <option key={level} value={level}>{level}</option>)}
											</select>
										</label>
										<ArrowRight className="planner-level-arrow" size={18} />
										<label>
											{t('planner.targetLevel')}
											<select value={weaponTarget} onChange={(event) => changeWeaponTarget(event.target.value)}>
												{CHARACTER_LEVELS.filter((level) => level >= weaponCurrent).map((level) => <option key={level} value={level}>{level}</option>)}
											</select>
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
										<select value={talentNormal} onChange={(event) => changeTalentCurrent(talentNormalTarget, setTalentNormal, setTalentNormalTarget, event.target.value)}>
											{TALENT_LEVELS.map((level) => <option key={level} value={level}>{level}</option>)}
										</select>
									</label>
									<label>
										{t('planner.targetLevel')}
										<select value={talentNormalTarget} onChange={(event) => changeTalentTarget(talentNormal, setTalentNormalTarget, event.target.value)}>
											{TALENT_LEVELS.filter((level) => level >= talentNormal).map((level) => <option key={level} value={level}>{level}</option>)}
										</select>
									</label>
								</div>
								<div className="planner-level-block">
									<span><Lightning size={16} />{t('planner.talentSkill')}</span>
									<label>
										{t('planner.currentLevel')}
										<select value={talentSkill} onChange={(event) => changeTalentCurrent(talentSkillTarget, setTalentSkill, setTalentSkillTarget, event.target.value)}>
											{TALENT_LEVELS.map((level) => <option key={level} value={level}>{level}</option>)}
										</select>
									</label>
									<label>
										{t('planner.targetLevel')}
										<select value={talentSkillTarget} onChange={(event) => changeTalentTarget(talentSkill, setTalentSkillTarget, event.target.value)}>
											{TALENT_LEVELS.filter((level) => level >= talentSkill).map((level) => <option key={level} value={level}>{level}</option>)}
										</select>
									</label>
								</div>
								<div className="planner-level-block">
									<span><Star size={16} />{t('planner.talentBurst')}</span>
									<label>
										{t('planner.currentLevel')}
										<select value={talentBurst} onChange={(event) => changeTalentCurrent(talentBurstTarget, setTalentBurst, setTalentBurstTarget, event.target.value)}>
											{TALENT_LEVELS.map((level) => <option key={level} value={level}>{level}</option>)}
										</select>
									</label>
									<label>
										{t('planner.targetLevel')}
										<select value={talentBurstTarget} onChange={(event) => changeTalentTarget(talentBurst, setTalentBurstTarget, event.target.value)}>
											{TALENT_LEVELS.filter((level) => level >= talentBurst).map((level) => <option key={level} value={level}>{level}</option>)}
										</select>
									</label>
								</div>
							</div>
						</section>
						)}
						{tab === 'artifacts' && (
						<section className="planner-form-block">
							<div className="planner-field">
								<span>{t('planner.set')}</span>
								<ItemSelect items={artifactChoices} isLoading={false} value={build.set ?? ''} onChange={(name) => chooseSet('set', name)} placeholder={t('planner.artifactNone')} />
							</div>
							<div className="planner-field">
								<span>{t('planner.setB')}</span>
								<ItemSelect items={artifactChoices} isLoading={false} value={build.setB ?? ''} onChange={(name) => chooseSet('setB', name)} placeholder={t('planner.artifactNone')} />
							</div>
							<div className="planner-main-stats">
								{([
									['sands', SANDS_STATS],
									['goblet', GOBLET_STATS],
									['circlet', CIRCLET_STATS],
								] as const).map(([slot, stats]) => (
									<div key={slot} className="planner-main-stat">
										<span className="planner-slot-label">
											{slot === 'sands' && <Hourglass size={15} />}
											{slot === 'goblet' && <Drop size={15} />}
											{slot === 'circlet' && <Crown size={15} />}
											{t(`planner.slots.${slot}`)}
										</span>
										<select aria-label={t(`planner.slots.${slot}`)} value={build[slot]} onChange={(event) => patchBuild({ [slot]: event.target.value })}>
											<option value="">{t('planner.any')}</option>
											{statOptions(stats)}
										</select>
									</div>
								))}
							</div>
							<div className="planner-subs">
								<span>{t('planner.subs')}</span>
								{build.subs.map((sub, index) => (
									<div key={`${sub.stat}-${index}`} className="planner-sub">
										<select
											value={sub.stat}
											onChange={(event) => patchBuild({
												subs: build.subs.map((entry, entryIndex) => (entryIndex === index ? { ...entry, stat: event.target.value } : entry)),
											})}
										>
											{statOptions(SUBSTATS)}
										</select>
										<label>
											<span>{t('planner.targetValue')}</span>
											<input
												type="number"
												min={0}
												step="0.1"
												aria-label={t('planner.targetValue')}
												value={sub.target}
												onChange={(event) => patchBuild({
													subs: build.subs.map((entry, entryIndex) => (entryIndex === index ? { ...entry, target: Number(event.target.value) } : entry)),
												})}
											/>
										</label>
										<button type="button" className="planner-sub-remove" onClick={() => patchBuild({ subs: build.subs.filter((_, entryIndex) => entryIndex !== index) })} aria-label={t('planner.removeStat')}>
											<X size={14} />
										</button>
									</div>
								))}
								<button type="button" className="planner-clear" onClick={() => patchBuild({ subs: [...build.subs, { stat: 'cr', current: 0, target: 0 }] })}>
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
						<ul>
							{resourceLines.map((line) => (
								<li key={line.id}>
									{line.image && <img src={catalogIconUrl(line.image)} alt="" onError={(event) => { event.currentTarget.style.display = 'none'; }} />}
									<span>{line.name}</span>
									<strong>× {line.count.toLocaleString(i18n.language)}</strong>
								</li>
							))}
						</ul>
					</div>
				)}
				{saveError && <p className="planner-save-error">{t('planner.saveError')}</p>}
				<div className="planner-modal-actions">
					{mode === 'edit' && (
						<button type="button" className="is-danger" onClick={onRemove} disabled={saving}>
							<Trash size={16} />
							{t('planner.remove')}
						</button>
					)}
					<button type="button" onClick={onClose} disabled={saving}>{t('common.cancel')}</button>
					<button type="submit" className="is-primary" disabled={saving || (mode === 'add' && !draftName)}>
						{mode === 'add' ? <Plus size={16} /> : <Check size={16} />}
						{mode === 'add' ? t('common.add') : t('common.save')}
					</button>
				</div>
			</form>
		</div>
	);
};

export default PlannerModal;
