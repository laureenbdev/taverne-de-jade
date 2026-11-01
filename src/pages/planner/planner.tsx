import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Trash, X } from 'phosphor-react';

import CharacterSelect from '../../components/character-select/character-select.tsx';
import ItemSelect from '../../components/item-select/item-select.tsx';
import { ARTIFACT_SETS } from '../../features/planner/artifactSets.ts';
import {
	CHARACTER_LEVELS,
	CharacterLevel,
	FarmLine,
	isCharacterLevel,
	isTalentLevel,
	materialsForPlan,
	PlannedCharacter,
	TALENT_LEVELS,
	TalentLevel,
} from '../../features/planner/materials.ts';
import { useCharacters } from '../../hooks/useCharacters.ts';
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll.ts';
import { useGameData } from '../../hooks/useGameData.ts';
import { usePlanner } from '../../hooks/usePlanner.ts';
import { useWeapons } from '../../hooks/useWeapons.ts';
import { characterIconUrl } from '../../services/genshin/images.ts';
import './planner.scss';

type PlannerModal =
	| { mode: 'add' }
	| { mode: 'edit'; characterId: string };

const Planner: React.FC = () => {
	const { t, i18n } = useTranslation();
	const { characters, isLoading: charactersLoading } = useCharacters();
	const { weapons, isLoading: weaponsLoading } = useWeapons();
	const { gameData, isLoading: gameDataLoading } = useGameData();
	const { plans, isLoading: plansLoading, loadError, addCharacter, updateLevels, removeCharacter } = usePlanner();
	const [modal, setModal] = useState<PlannerModal | null>(null);
	useLockBodyScroll(Boolean(modal));
	const [draftName, setDraftName] = useState('');
	const [currentLevel, setCurrentLevel] = useState<CharacterLevel>(1);
	const [targetLevel, setTargetLevel] = useState<CharacterLevel>(90);
	const [weaponId, setWeaponId] = useState<string | null>(null);
	const [weaponCurrent, setWeaponCurrent] = useState<CharacterLevel>(1);
	const [weaponTarget, setWeaponTarget] = useState<CharacterLevel>(1);
	const [talentNormal, setTalentNormal] = useState<TalentLevel>(1);
	const [talentNormalTarget, setTalentNormalTarget] = useState<TalentLevel>(1);
	const [talentSkill, setTalentSkill] = useState<TalentLevel>(1);
	const [talentSkillTarget, setTalentSkillTarget] = useState<TalentLevel>(1);
	const [talentBurst, setTalentBurst] = useState<TalentLevel>(1);
	const [talentBurstTarget, setTalentBurstTarget] = useState<TalentLevel>(1);
	const [artifactSet, setArtifactSet] = useState('');
	const [saving, setSaving] = useState(false);
	const [saveError, setSaveError] = useState<string | null>(null);

	const byId = useMemo(() => new Map(characters.map((character) => [character.id, character])), [characters]);
	const editing = modal?.mode === 'edit' ? plans.find((plan) => plan.characterId === modal.characterId) : undefined;
	const editingCharacter = editing ? byId.get(editing.characterId) : undefined;
	const selectedCharacter = modal?.mode === 'add'
		? characters.find((character) => character.name === draftName)
		: editingCharacter;
	const available = characters.filter((character) => !plans.some((plan) => plan.characterId === character.id));
	const weaponChoices = useMemo(() => {
		if (!selectedCharacter) return [];
		return weapons.filter((weapon) => weapon.type === selectedCharacter.weapon);
	}, [weapons, selectedCharacter]);
	const weaponName = weapons.find((weapon) => weapon.id === weaponId)?.name ?? '';
	const artifactOptions = artifactSet && !ARTIFACT_SETS.includes(artifactSet as typeof ARTIFACT_SETS[number])
		? [artifactSet, ...ARTIFACT_SETS]
		: [...ARTIFACT_SETS];

	const materials = useMemo(() => {
		if (!gameData) return [];
		return materialsForPlan(plans, characters, weapons, gameData);
	}, [plans, characters, weapons, gameData]);

	const grouped = useMemo(() => {
		const groups = new Map<FarmLine['kind'], FarmLine[]>();
		materials.forEach((line) => {
			const list = groups.get(line.kind) ?? [];
			list.push(line);
			groups.set(line.kind, list);
		});
		return [...groups.entries()];
	}, [materials]);

	const formatCount = (count: number) => count.toLocaleString(i18n.language);

	const lineLabel = (line: FarmLine) => {
		if (line.kind === 'mora') return t('planner.mora');
		if (line.kind === 'stone' && line.element && line.tier) {
			return t('planner.stones.label', {
				tier: t(`planner.stones.tiers.${line.tier}`),
				stone: t(`planner.stones.names.${line.element}`, { defaultValue: line.element }),
			});
		}
		if (line.name && line.rarity && (line.kind === 'common' || line.kind === 'talentBook' || line.kind === 'weaponMat' || line.kind === 'elite')) {
			return t('planner.commonTier', { name: line.name, rarity: line.rarity });
		}
		return line.name ?? line.id;
	};

	const resetBuild = () => {
		setCurrentLevel(1);
		setTargetLevel(90);
		setWeaponId(null);
		setWeaponCurrent(1);
		setWeaponTarget(1);
		setTalentNormal(1);
		setTalentNormalTarget(1);
		setTalentSkill(1);
		setTalentSkillTarget(1);
		setTalentBurst(1);
		setTalentBurstTarget(1);
		setArtifactSet('');
	};

	const openAdd = () => {
		setDraftName('');
		resetBuild();
		setSaveError(null);
		setModal({ mode: 'add' });
	};

	const openEdit = (characterId: string) => {
		const plan = plans.find((item) => item.characterId === characterId);
		if (!plan) return;
		setCurrentLevel(plan.currentLevel);
		setTargetLevel(plan.targetLevel);
		setWeaponId(plan.weaponId);
		setWeaponCurrent(plan.weaponCurrentLevel ?? 1);
		setWeaponTarget(plan.weaponTargetLevel ?? plan.weaponCurrentLevel ?? 1);
		setTalentNormal(plan.talentNormal);
		setTalentNormalTarget(plan.talentNormalTarget);
		setTalentSkill(plan.talentSkill);
		setTalentSkillTarget(plan.talentSkillTarget);
		setTalentBurst(plan.talentBurst);
		setTalentBurstTarget(plan.talentBurstTarget);
		setArtifactSet(plan.artifactSet ?? '');
		setSaveError(null);
		setModal({ mode: 'edit', characterId });
	};

	const closeModal = () => {
		if (saving) return;
		setModal(null);
	};

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

	const changeTalentCurrent = (current: TalentLevel, setCurrent: (level: TalentLevel) => void, target: TalentLevel, setTarget: (level: TalentLevel) => void, value: string) => {
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

	const toPlan = (characterId: string): PlannedCharacter => ({
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
		artifactSet: artifactSet || null,
	});

	const submit = async (event: React.FormEvent) => {
		event.preventDefault();
		if (!modal) return;
		setSaving(true);
		setSaveError(null);
		try {
			if (modal.mode === 'add') {
				const character = characters.find((item) => item.name === draftName);
				if (!character) return;
				await addCharacter(toPlan(character.id));
			} else {
				await updateLevels(toPlan(modal.characterId));
			}
			setModal(null);
		} catch (error) {
			setSaveError(error instanceof Error ? error.message : t('planner.saveError'));
		} finally {
			setSaving(false);
		}
	};

	const removeEditing = async () => {
		if (modal?.mode !== 'edit') return;
		setSaving(true);
		setSaveError(null);
		try {
			await removeCharacter(modal.characterId);
			setModal(null);
		} catch (error) {
			setSaveError(error instanceof Error ? error.message : t('planner.saveError'));
		} finally {
			setSaving(false);
		}
	};

	const showBuild = modal?.mode === 'edit' || draftName !== '';

	return (
		<div id="planner" className="page">
			<section>
				<div className="section-container">
					<h2>{t('planner.characters')}</h2>
					{loadError && <p className="planner-save-error">{loadError}</p>}
					{plans.length === 0 && !plansLoading && !loadError && <p className="planner-empty">{t('planner.emptyRoster')}</p>}
					<div className="planner-roster">
						{plans.map((plan) => {
							const character = byId.get(plan.characterId);
							const name = character?.name ?? plan.characterId;
							return (
								<button
									key={plan.characterId}
									type="button"
									className={`planner-character${character ? ` rarity-${character.rarity}` : ''}`}
									onClick={() => openEdit(plan.characterId)}
								>
									<span className="planner-portrait">
										<img
											src={characterIconUrl(plan.characterId)}
											alt=""
											onError={(event) => {
												event.currentTarget.style.display = 'none';
											}}
										/>
									</span>
									<span className="planner-character-name">{name}</span>
								</button>
							);
						})}
					</div>
					<button type="button" className="planner-add" onClick={openAdd}>
						<Plus size={22} />
						<span>{t('planner.add')}</span>
					</button>
				</div>

				<div className="section-container">
					<h2>{t('planner.materials')}</h2>
					{plans.length === 0 ? (
						<p className="planner-empty">{t('planner.materialsNeedRoster')}</p>
					) : gameDataLoading || charactersLoading || plansLoading ? (
						<p className="planner-empty">{t('common.loading')}</p>
					) : grouped.length === 0 ? (
						<p className="planner-empty">{t('planner.materialsEmpty')}</p>
					) : (
						<div className="planner-materials">
							{grouped.map(([kind, lines]) => (
								<div key={kind} className="planner-material-group">
									<h3>{t(`planner.groups.${kind}`)}</h3>
									<ul>
										{lines.map((line) => (
											<li key={line.id}>
												<span>{lineLabel(line)}</span>
												<strong>{formatCount(line.count)}</strong>
											</li>
										))}
									</ul>
								</div>
							))}
						</div>
					)}
				</div>
			</section>

			{modal && createPortal(
				<div className="planner-modal-overlay" onClick={closeModal}>
					<div className="planner-modal" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="planner-modal-title">
						<div className="planner-modal-header">
							<h2 id="planner-modal-title">{modal.mode === 'add' ? t('planner.addTitle') : t('planner.editTitle')}</h2>
							<button type="button" onClick={closeModal} aria-label={t('common.close')}>
								<X size={22} />
							</button>
						</div>
						<form onSubmit={submit}>
							{modal.mode === 'add' ? (
								<CharacterSelect
									characters={available}
									isLoading={charactersLoading}
									value={draftName}
									onChange={chooseCharacter}
									placeholder={t('characterSelect.placeholder')}
									required
								/>
							) : (
								<p className="planner-modal-name">{editingCharacter?.name ?? modal.characterId}</p>
							)}
							{showBuild && (
								<>
									<div className="planner-level-fields">
										<label>
											{t('planner.currentLevel')}
											<select value={currentLevel} onChange={(event) => changeCurrent(event.target.value)}>
												{CHARACTER_LEVELS.map((level) => (
													<option key={level} value={level}>{level}</option>
												))}
											</select>
										</label>
										<label>
											{t('planner.targetLevel')}
											<select value={targetLevel} onChange={(event) => changeTarget(event.target.value)}>
												{CHARACTER_LEVELS.filter((level) => level >= currentLevel).map((level) => (
													<option key={level} value={level}>{level}</option>
												))}
											</select>
										</label>
									</div>
									<div className="planner-field">
										<span>{t('planner.weapon')}</span>
										<ItemSelect
											items={weaponChoices}
											isLoading={weaponsLoading}
											value={weaponName}
											onChange={chooseWeapon}
											placeholder={t('planner.weaponNone')}
										/>
										{weaponId && (
											<button type="button" className="planner-clear" onClick={() => chooseWeapon('')}>
												{t('planner.weaponNone')}
											</button>
										)}
									</div>
									{weaponId && (
										<div className="planner-level-block">
											<span>{t('planner.weaponLevel')}</span>
											<div className="planner-level-fields">
												<label>
													{t('planner.currentLevel')}
													<select value={weaponCurrent} onChange={(event) => changeWeaponCurrent(event.target.value)}>
														{CHARACTER_LEVELS.map((level) => (
															<option key={level} value={level}>{level}</option>
														))}
													</select>
												</label>
												<label>
													{t('planner.targetLevel')}
													<select value={weaponTarget} onChange={(event) => changeWeaponTarget(event.target.value)}>
														{CHARACTER_LEVELS.filter((level) => level >= weaponCurrent).map((level) => (
															<option key={level} value={level}>{level}</option>
														))}
													</select>
												</label>
											</div>
										</div>
									)}
									<div className="planner-talent-fields">
										<div className="planner-level-block">
											<span>{t('planner.talentNormal')}</span>
											<label>
												{t('planner.currentLevel')}
												<select value={talentNormal} onChange={(event) => changeTalentCurrent(talentNormal, setTalentNormal, talentNormalTarget, setTalentNormalTarget, event.target.value)}>
													{TALENT_LEVELS.map((level) => (
														<option key={level} value={level}>{level}</option>
													))}
												</select>
											</label>
											<label>
												{t('planner.targetLevel')}
												<select value={talentNormalTarget} onChange={(event) => changeTalentTarget(talentNormal, setTalentNormalTarget, event.target.value)}>
													{TALENT_LEVELS.filter((level) => level >= talentNormal).map((level) => (
														<option key={level} value={level}>{level}</option>
													))}
												</select>
											</label>
										</div>
										<div className="planner-level-block">
											<span>{t('planner.talentSkill')}</span>
											<label>
												{t('planner.currentLevel')}
												<select value={talentSkill} onChange={(event) => changeTalentCurrent(talentSkill, setTalentSkill, talentSkillTarget, setTalentSkillTarget, event.target.value)}>
													{TALENT_LEVELS.map((level) => (
														<option key={level} value={level}>{level}</option>
													))}
												</select>
											</label>
											<label>
												{t('planner.targetLevel')}
												<select value={talentSkillTarget} onChange={(event) => changeTalentTarget(talentSkill, setTalentSkillTarget, event.target.value)}>
													{TALENT_LEVELS.filter((level) => level >= talentSkill).map((level) => (
														<option key={level} value={level}>{level}</option>
													))}
												</select>
											</label>
										</div>
										<div className="planner-level-block">
											<span>{t('planner.talentBurst')}</span>
											<label>
												{t('planner.currentLevel')}
												<select value={talentBurst} onChange={(event) => changeTalentCurrent(talentBurst, setTalentBurst, talentBurstTarget, setTalentBurstTarget, event.target.value)}>
													{TALENT_LEVELS.map((level) => (
														<option key={level} value={level}>{level}</option>
													))}
												</select>
											</label>
											<label>
												{t('planner.targetLevel')}
												<select value={talentBurstTarget} onChange={(event) => changeTalentTarget(talentBurst, setTalentBurstTarget, event.target.value)}>
													{TALENT_LEVELS.filter((level) => level >= talentBurst).map((level) => (
														<option key={level} value={level}>{level}</option>
													))}
												</select>
											</label>
										</div>
									</div>
									<label>
										{t('planner.artifactSet')}
										<select value={artifactSet} onChange={(event) => setArtifactSet(event.target.value)}>
											<option value="">{t('planner.artifactNone')}</option>
											{artifactOptions.map((setName) => (
												<option key={setName} value={setName}>{setName}</option>
											))}
										</select>
									</label>
								</>
							)}
							{saveError && <p className="planner-save-error">{t('planner.saveError')}</p>}
							<div className="planner-modal-actions">
								{modal.mode === 'edit' && (
									<button type="button" className="is-danger" onClick={removeEditing} disabled={saving}>
										<Trash size={16} />
										{t('planner.remove')}
									</button>
								)}
								<button type="button" onClick={closeModal} disabled={saving}>{t('common.cancel')}</button>
								<button type="submit" className="is-primary" disabled={saving || (modal.mode === 'add' && !draftName)}>
									{modal.mode === 'add' ? t('common.add') : t('common.save')}
								</button>
							</div>
						</form>
					</div>
				</div>,
				document.body,
			)}
		</div>
	);
};

export default Planner;
