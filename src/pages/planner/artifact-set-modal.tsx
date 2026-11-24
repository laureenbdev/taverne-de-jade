import React from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLineUp, Crown, Drop, Flower, Hourglass, X } from 'phosphor-react';

import {
	ARTIFACT_PIECES,
	ArtifactBuild,
	ArtifactPieceId,
	artifactMainStatLabel,
	artifactSubStatLabel,
	isArtifactPieceNeeded,
	normalizeArtifactStatId,
} from '../../features/planner/artifactBuild.ts';
import { ArtifactFarmCharacter } from '../../features/planner/artifactFarm.ts';
import { catalogIconUrl, characterIconUrl } from '../../services/genshin/images.ts';

interface ArtifactSetModalProps {
	setName: string;
	image: string;
	characters: ArtifactFarmCharacter[];
	localize: (name: string) => string;
	onClose: () => void;
}

const PIECE_ICONS = {
	flower: Flower,
	plume: ArrowLineUp,
	sands: Hourglass,
	goblet: Drop,
	circlet: Crown,
} as const;

const MAIN_PIECES = new Set<ArtifactPieceId>(['sands', 'goblet', 'circlet']);

function mainForPiece(build: ArtifactBuild, piece: ArtifactPieceId): string {
	if (piece === 'sands') return build.sands;
	if (piece === 'goblet') return build.goblet;
	if (piece === 'circlet') return build.circlet;
	return '';
}

function subsForPiece(build: ArtifactBuild, piece: ArtifactPieceId, charOpen: boolean): { stat: string; open: boolean }[] {
	const main = mainForPiece(build, piece);
	const mainId = main ? normalizeArtifactStatId(main) : '';
	const seen = new Set<string>();
	return build.subs.flatMap((sub) => {
		if (!sub.stat) return [];
		const id = normalizeArtifactStatId(sub.stat);
		if (MAIN_PIECES.has(piece) && id === mainId) return [];
		if (piece === 'flower' && id === 'hp_') return [];
		if (piece === 'plume' && id === 'atk_') return [];
		if (seen.has(id)) return [];
		seen.add(id);
		return [{ stat: sub.stat, open: charOpen }];
	});
}

function pieceVisible(build: ArtifactBuild, piece: ArtifactPieceId): boolean {
	if (isArtifactPieceNeeded(build, piece)) return true;
	if (MAIN_PIECES.has(piece) && mainForPiece(build, piece)) return true;
	return subsForPiece(build, piece, true).length > 0;
}

const CharacterPlan: React.FC<{ character: ArtifactFarmCharacter }> = ({ character }) => {
	const { t } = useTranslation();
	const { build, done } = character;
	const charOpen = !done;
	if (!ARTIFACT_PIECES.some((piece) => pieceVisible(build, piece))) return null;

	return (
		<article className={`planner-set-char-plan${done ? ' is-done' : ' is-open'}`}>
			<div className="planner-set-char-plan-head">
				<img
					className="planner-set-character-icon"
					src={characterIconUrl(character.characterId)}
					alt=""
					onError={(event) => { event.currentTarget.style.display = 'none'; }}
				/>
				<span className="planner-set-character-name">{character.characterName}</span>
			</div>
			<ul className="planner-set-char-pieces">
				{ARTIFACT_PIECES.map((piece) => {
					const Icon = PIECE_ICONS[piece];
					const visible = pieceVisible(build, piece);
					const needed = isArtifactPieceNeeded(build, piece);
					const main = mainForPiece(build, piece);
					const subs = subsForPiece(build, piece, charOpen);
					return (
						<li
							key={piece}
							className={`planner-set-mini-piece${needed ? ' is-needed' : ''}${visible ? '' : ' is-inactive'}`}
						>
							<span className="planner-set-mini-piece-label">
								<Icon size={12} aria-hidden="true" />
								{t(`planner.slots.${piece}`)}
							</span>
							<div className="planner-set-piece-inner">
								<div className="planner-set-main-stat-slot">
									{MAIN_PIECES.has(piece) && main ? (
										<p className="planner-set-main-stat">{artifactMainStatLabel(t, main, true)}</p>
									) : null}
								</div>
								<div className="planner-set-subs-slot">
									{subs.length > 0 ? (
										<ul className="planner-set-stat-chips">
											{subs.map((entry) => (
												<li key={entry.stat} className={entry.open ? '' : 'is-stale'}>
													{artifactSubStatLabel(t, entry.stat, true)}
												</li>
											))}
										</ul>
									) : visible ? (
										<span className="planner-set-wanted-hint is-muted" aria-hidden="true">—</span>
									) : null}
								</div>
							</div>
						</li>
					);
				})}
			</ul>
		</article>
	);
};

const ArtifactSetModal: React.FC<ArtifactSetModalProps> = ({
	setName,
	image,
	characters,
	localize,
	onClose,
}) => {
	const { t } = useTranslation();
	const title = localize(setName);
	const plans = characters.filter((character) => (
		ARTIFACT_PIECES.some((piece) => pieceVisible(character.build, piece))
	));

	return (
		<div className="planner-modal planner-artifact-set-modal" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="planner-artifact-set-title">
			<div className="planner-modal-header planner-set-modal-header">
				<div className="planner-set-modal-title">
					{image && (
						<img
							className="planner-artifact-set-modal-icon"
							src={catalogIconUrl(image)}
							alt=""
							onError={(event) => { event.currentTarget.style.display = 'none'; }}
						/>
					)}
					<h2 id="planner-artifact-set-title">{title}</h2>
				</div>
				<button type="button" onClick={onClose} aria-label={t('common.close')}>
					<X size={20} />
				</button>
			</div>
			<div className="planner-modal-body">
				{plans.length === 0 ? (
					<p className="planner-empty">{t('planner.keepEmpty')}</p>
				) : (
					<div className="planner-set-characters-stack">
						{plans.map((character) => (
							<CharacterPlan key={character.characterId} character={character} />
						))}
					</div>
				)}
			</div>
		</div>
	);
};

export default ArtifactSetModal;