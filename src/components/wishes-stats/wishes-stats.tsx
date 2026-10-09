import React from 'react';
import { useTranslation } from 'react-i18next';
import './wishes-stats.scss';

import { useWeapons } from '../../hooks/useWeapons.ts';
import { useWishes } from '../../hooks/useWishes.ts';
import { Wish } from '../../features/wishes/types.ts';

const RING_SIZE = 96;
const RING_STROKE = 8;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const HARD_PITY = 90;

interface StatRingProps {
	value: number;
	label: string;
	className: string;
}

const StatRing: React.FC<StatRingProps> = ({ value, label, className }) => {
	const clamped = Math.min(100, Math.max(0, value));
	const offset = RING_CIRCUMFERENCE * (1 - clamped / 100);
	const showValue = clamped > 0;

	return (
		<div className={`stat-ring ${className}`}>
			<svg viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`} aria-hidden="true">
				<circle
					className="stat-ring-track"
					cx={RING_SIZE / 2}
					cy={RING_SIZE / 2}
					r={RING_RADIUS}
				/>
				{showValue && (
					<circle
						className="stat-ring-value"
						cx={RING_SIZE / 2}
						cy={RING_SIZE / 2}
						r={RING_RADIUS}
						strokeDasharray={RING_CIRCUMFERENCE}
						strokeDashoffset={offset}
					/>
				)}
			</svg>
			<span className="stat-ring-label">{label}</span>
		</div>
	);
};

function isWeaponWish(wish: Wish, weaponNames: Set<string>): boolean {
	if (wish.banner === 'weapon') return true;
	if (wish.banner === 'character') return false;
	return weaponNames.has(wish.characterName);
}

const WishesStats: React.FC = () => {
	const { t } = useTranslation();
	const { wishes } = useWishes();
	const { weapons } = useWeapons();

	const rated = wishes.filter((wish) => wish.banner !== 'standard' && wish.won !== null);
	const wins = rated.filter((wish) => wish.won).length;
	const losses = rated.length - wins;
	const winRate = rated.length === 0 ? null : Math.round((wins / rated.length) * 100);

	const fiveStars = wishes.length;
	const weaponNames = new Set(weapons.map((weapon) => weapon.name));
	const weaponCount = wishes.filter((wish) => isWeaponWish(wish, weaponNames)).length;
	const characterCount = fiveStars - weaponCount;

	const averagePity =
		wishes.length === 0
			? null
			: Math.round(wishes.reduce((sum, wish) => sum + wish.totalWishes, 0) / wishes.length);

	return (
		<div className="wishes-stats">
			<article className="stat-card">
				<StatRing
					className="is-win"
					value={winRate ?? 0}
					label={winRate === null ? '—' : `${winRate}%`}
				/>
				<h3>{t('wishes.statsCards.winRate')}</h3>
				<p>
					{rated.length === 0
						? t('wishes.statsCards.winEmpty')
						: `${t('wishes.statsCards.won', { count: wins })} · ${t('wishes.statsCards.lost', { count: losses })}`}
				</p>
			</article>

			<article className="stat-card">
				<StatRing
					className="is-characters"
					value={fiveStars === 0 ? 0 : (characterCount / fiveStars) * 100}
					label={String(fiveStars)}
				/>
				<h3>{t('wishes.statsCards.fiveStars')}</h3>
				<p>
					{fiveStars === 0
						? t('wishes.statsCards.fiveStarsEmpty')
						: `${t('wishes.statsCards.characters', { count: characterCount })} · ${t('wishes.statsCards.weapons', { count: weaponCount })}`}
				</p>
			</article>

			<article className="stat-card">
				<StatRing
					className="is-pity"
					value={averagePity === null ? 0 : (averagePity / HARD_PITY) * 100}
					label={averagePity === null ? '—' : String(averagePity)}
				/>
				<h3>{t('wishes.statsCards.pity')}</h3>
				<p>
					{wishes.length === 0
						? t('wishes.statsCards.pityEmpty')
						: t('wishes.statsCards.pulls', { count: wishes.length })}
				</p>
			</article>
		</div>
	);
};

export default WishesStats;
