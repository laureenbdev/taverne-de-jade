import React, { useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CaretDown, Plus, Star } from 'phosphor-react';

import { PlannedCharacter } from '../../features/planner/materials.ts';
import Unfold, { LateUnfold } from '../../components/unfold/unfold.tsx';
import { Character } from '../../services/genshin/charactersApi.ts';
import { characterIconUrl } from '../../services/genshin/images.ts';

interface PlannerRosterProps {
	roster: PlannedCharacter[];
	byId: Map<string, Character>;
	loadError: string | null;
	saveError: string | null;
	plansLoading: boolean;
	onEdit: (characterId: string) => void;
	onAdd: () => void;
	onToggleFavorite: (plan: PlannedCharacter) => void;
}

const PlannerRoster: React.FC<PlannerRosterProps> = ({
	roster,
	byId,
	loadError,
	saveError,
	plansLoading,
	onEdit,
	onAdd,
	onToggleFavorite,
}) => {
	const { t } = useTranslation();
	const [rosterOpen, setRosterOpen] = useState(false);
	const [rosterOverflow, setRosterOverflow] = useState(false);
	const [rosterRowCap, setRosterRowCap] = useState<number | null>(null);
	const rosterRef = useRef<HTMLDivElement>(null);

	useLayoutEffect(() => {
		const wrap = rosterRef.current;
		if (!wrap) {
			setRosterOverflow(false);
			setRosterRowCap(null);
			return;
		}
		const measure = () => {
			const line = wrap.querySelector<HTMLElement>(':scope > .planner-roster');
			const styles = line ? getComputedStyle(line) : null;
			const gap = Number.parseFloat(styles?.columnGap || styles?.gap || '') || 6;
			const charWidth = 96;
			const width = wrap.clientWidth;
			let capacity = Math.max(1, Math.floor((width + gap) / (charWidth + gap)));
			while (capacity > 0 && capacity * charWidth + (capacity - 1) * gap > width + 0.5) {
				capacity -= 1;
			}
			const overflows = roster.length > capacity;
			if (overflows) {
				const lineWidth = capacity * charWidth + Math.max(0, capacity - 1) * gap;
				wrap.style.setProperty('--roster-line-width', `${lineWidth}px`);
			} else {
				wrap.style.removeProperty('--roster-line-width');
			}
			setRosterRowCap(capacity);
			setRosterOverflow(overflows);
			if (!overflows) setRosterOpen(false);
		};
		measure();
		const observer = new ResizeObserver(measure);
		observer.observe(wrap);
		return () => observer.disconnect();
	}, [roster.length]);

	const head = rosterRowCap === null ? roster : roster.slice(0, rosterRowCap);
	const rest = rosterRowCap === null ? [] : roster.slice(rosterRowCap);

	const renderCharacter = (plan: PlannedCharacter) => {
		const character = byId.get(plan.characterId);
		const name = character?.name ?? plan.characterId;
		return (
			<div
				key={plan.characterId}
				className={`planner-character${character ? ` rarity-${character.rarity}` : ''}${plan.done ? ' is-done' : ''}${plan.favorite ? ' is-favorite' : ''}`}
			>
				<div className="planner-portrait-wrap">
					<button type="button" className="planner-portrait" onClick={() => onEdit(plan.characterId)}>
						<img src={characterIconUrl(plan.characterId)} alt="" onError={(event) => { event.currentTarget.style.display = 'none'; }} />
					</button>
					<button
						type="button"
						className={`planner-fav${plan.favorite ? ' is-on' : ''}`}
						aria-pressed={plan.favorite}
						aria-label={plan.favorite ? t('planner.favoriteOn') : t('planner.favoriteOff')}
						onClick={() => onToggleFavorite(plan)}
					>
						<Star size={11} weight={plan.favorite ? 'fill' : 'regular'} />
					</button>
				</div>
				<button type="button" className="planner-character-name" onClick={() => onEdit(plan.characterId)}>
					{name}
				</button>
			</div>
		);
	};

	const addButton = (
		<button type="button" className="planner-add" aria-label={t('planner.add')} onClick={onAdd}>
			<Plus size={18} />
		</button>
	);

	return (
		<div className="section-container">
			<h2>{t('planner.characters')}</h2>
			{(loadError || saveError) && <p className="planner-save-error">{saveError ? t('planner.saveError') : loadError}</p>}
			<LateUnfold
				loading={plansLoading}
				className="admin-unfold"
				fallback={<p className="planner-loading" aria-live="polite">{t('planner.loadingRoster')}</p>}
			>
				{roster.length === 0 && !loadError ? (
					<p className="planner-empty">{t('planner.emptyRoster')}</p>
				) : (
					<div ref={rosterRef} className="planner-roster-wrap">
						<div className="planner-roster">
							{head.map(renderCharacter)}
							{!rosterOverflow && addButton}
						</div>
						{rosterOverflow && (
							<Unfold open={rosterOpen} className="planner-roster-extra">
								<div className="planner-roster">
									{rest.map(renderCharacter)}
									{addButton}
								</div>
							</Unfold>
						)}
						{rosterOverflow && (
							<button
								type="button"
								className={`planner-roster-toggle${rosterOpen ? ' is-open' : ''}`}
								aria-expanded={rosterOpen}
								aria-label={rosterOpen ? t('planner.rosterLess') : t('planner.rosterMore')}
								onClick={() => setRosterOpen((open) => !open)}
							>
								<CaretDown size={16} weight="bold" />
							</button>
						)}
					</div>
				)}
			</LateUnfold>
		</div>
	);
};

export default PlannerRoster;
