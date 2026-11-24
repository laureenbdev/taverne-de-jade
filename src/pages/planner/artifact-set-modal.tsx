import React from 'react';
import { useTranslation } from 'react-i18next';
import { Crown, Drop, Hourglass, X } from 'phosphor-react';

import { normalizeArtifactStatId } from '../../features/planner/artifactBuild.ts';
import { ArtifactSetStats, ArtifactStatEntry } from '../../features/planner/artifactFarm.ts';
import { catalogIconUrl } from '../../services/genshin/images.ts';

interface ArtifactSetModalProps {
	stats: ArtifactSetStats;
	localize: (name: string) => string;
	onClose: () => void;
}

const SLOT_ICONS = {
	sands: Hourglass,
	goblet: Drop,
	circlet: Crown,
} as const;

const StatList: React.FC<{ entries: ArtifactStatEntry[] }> = ({ entries }) => {
	const { t } = useTranslation();
	return (
		<ul>
			{entries.map((entry) => (
				<li key={entry.stat} className={entry.open ? 'is-open' : 'is-done'}>
					{t(`planner.stats.${normalizeArtifactStatId(entry.stat)}`)}
				</li>
			))}
		</ul>
	);
};

const ArtifactSetModal: React.FC<ArtifactSetModalProps> = ({ stats, localize, onClose }) => {
	const { t } = useTranslation();
	const title = localize(stats.setName);
	const slots = [
		{ id: 'sands' as const, values: stats.sands },
		{ id: 'goblet' as const, values: stats.goblet },
		{ id: 'circlet' as const, values: stats.circlet },
	];
	const hasMains = slots.some((slot) => slot.values.length > 0);
	const hasSubs = stats.subs.length > 0;
	const empty = !hasMains && !hasSubs;

	return (
		<div className="planner-modal planner-artifact-set-modal" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="planner-artifact-set-title">
			<div className="planner-modal-header">
				<h2 id="planner-artifact-set-title">{title}</h2>
				<button type="button" onClick={onClose} aria-label={t('common.close')}>
					<X size={20} />
				</button>
			</div>
			<div className="planner-modal-body">
				{stats.image && (
					<img
						className="planner-artifact-set-modal-icon"
						src={catalogIconUrl(stats.image)}
						alt=""
						onError={(event) => { event.currentTarget.style.display = 'none'; }}
					/>
				)}
				{empty ? (
					<p className="planner-empty">{t('planner.keepEmpty')}</p>
				) : (
					<>
						{hasMains && (
							<div className="planner-artifact-set-stats">
								{slots.map((slot) => {
									if (slot.values.length === 0) return null;
									const Icon = SLOT_ICONS[slot.id];
									return (
										<section key={slot.id}>
											<h3>
												<Icon size={14} />
												{t(`planner.slots.${slot.id}`)}
											</h3>
											<StatList entries={slot.values} />
										</section>
									);
								})}
							</div>
						)}
						{hasSubs && (
							<div className="planner-artifact-set-subs">
								<h3>{t('planner.subs')}</h3>
								<StatList entries={stats.subs} />
							</div>
						)}
					</>
				)}
			</div>
		</div>
	);
};

export default ArtifactSetModal;
