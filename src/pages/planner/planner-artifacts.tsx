import React from 'react';
import { useTranslation } from 'react-i18next';

import { LateUnfold } from '../../components/unfold/unfold.tsx';
import {
	ArtifactFarmCluster,
	ArtifactFarmSet,
	shortDomainName,
} from '../../features/planner/artifactFarm.ts';
import { PlannedCharacter } from '../../features/planner/materials.ts';
import { catalogIconUrl, characterIconUrl } from '../../services/genshin/images.ts';
import { RoundCheck } from './planner-shared.tsx';

interface PlannerArtifactsProps {
	clusters: ArtifactFarmCluster[];
	plans: PlannedCharacter[];
	loading: boolean;
	localize: (name: string) => string;
	onEdit: (characterId: string) => void;
	onToggleDone: (characterId: string) => void;
	onOpenSet: (set: ArtifactFarmSet) => void;
}

const PlannerArtifacts: React.FC<PlannerArtifactsProps> = ({
	clusters,
	plans,
	loading,
	localize,
	onEdit,
	onToggleDone,
	onOpenSet,
}) => {
	const { t } = useTranslation();

	return (
		<div className="section-container">
			<h2>{t('planner.artifactsTitle')}</h2>
			<LateUnfold
				loading={loading}
				className="admin-unfold"
				fallback={<p className="planner-loading" aria-live="polite">{t('planner.loadingArtifacts')}</p>}
			>
				{clusters.length === 0 ? (
					<p className="planner-empty">{t('planner.artifactsEmpty')}</p>
				) : (
					<div className="planner-farm planner-artifact-farm">
						<div className="planner-cluster-grid">
							{clusters.map((cluster) => {
								const title = cluster.key === 'boss' || cluster.key === 'other'
									? cluster.title
									: shortDomainName(localize(cluster.title));
								return (
									<article key={cluster.key} className={`planner-cluster${cluster.favorite ? ' is-favorite' : ''}`}>
										<header>
											<h4>{title}</h4>
										</header>
										{cluster.sets.length > 0 && (
											<ul className="planner-task-tiles">
												{cluster.sets.map((set) => {
													const name = localize(set.name);
													return (
														<li key={set.name} className="tooltip-anchor">
															<button
																type="button"
																className={`planner-task-tile planner-artifact-tile${set.allDone ? ' is-checked' : ''}${set.favorite ? ' is-favorite' : ''}`}
																aria-label={name}
																onClick={() => onOpenSet(set)}
															>
																{set.image ? (
																	<img
																		src={catalogIconUrl(set.image)}
																		alt=""
																		onError={(event) => { event.currentTarget.style.display = 'none'; }}
																	/>
																) : (
																	<span>{name}</span>
																)}
															</button>
															<span className="tooltip top" role="tooltip" aria-hidden="true">{name}</span>
														</li>
													);
												})}
											</ul>
										)}
										<div className="planner-faces">
											{cluster.characters.map((character) => {
												const plan = plans.find((item) => item.characterId === character.characterId);
												return (
													<span key={character.characterId} className="tooltip-anchor planner-artifact-face">
														<span className="planner-artifact-face-wrap">
															<button
																type="button"
																className={`planner-face${character.done ? ' is-checked' : ''}${character.favorite ? ' is-favorite' : ''}`}
																aria-label={character.characterName}
																onClick={() => onEdit(character.characterId)}
															>
																<img
																	src={characterIconUrl(character.characterId)}
																	alt=""
																	onError={(event) => { event.currentTarget.style.display = 'none'; }}
																/>
															</button>
															{plan && (
																<RoundCheck
																	checked={character.done}
																	label={character.done ? t('planner.uncheck') : t('planner.check')}
																	onClick={() => onToggleDone(character.characterId)}
																/>
															)}
														</span>
														<span className="tooltip top" role="tooltip" aria-hidden="true">{character.characterName}</span>
													</span>
												);
											})}
										</div>
									</article>
								);
							})}
						</div>
					</div>
				)}
			</LateUnfold>
		</div>
	);
};

export default PlannerArtifacts;
