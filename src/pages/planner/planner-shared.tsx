import React from 'react';
import { ArrowRight, Check } from 'phosphor-react';

import { CharacterLevel, rankIndex } from '../../features/planner/materials.ts';

export const formatRank = (level: number, ascended?: boolean) => (ascended ? `${level}+` : String(level));

export const LevelRange: React.FC<{
	current: number;
	currentAscended?: boolean;
	target: number;
	targetAscended?: boolean;
}> = ({ current, currentAscended, target, targetAscended }) => {
	const ranked = currentAscended !== undefined || targetAscended !== undefined;
	const done = ranked
		? rankIndex(current as CharacterLevel, Boolean(currentAscended)) >= rankIndex(target as CharacterLevel, Boolean(targetAscended))
		: current >= target;
	return (
		<span className={`planner-range${done ? ' is-done' : ''}`}>
			<span>{formatRank(current, currentAscended)}</span>
			{!done && (
				<>
					<ArrowRight size={11} />
					<span>{formatRank(target, targetAscended)}</span>
				</>
			)}
		</span>
	);
};

export const RoundCheck: React.FC<{ checked: boolean; label: string; onClick: () => void }> = ({ checked, label, onClick }) => (
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
