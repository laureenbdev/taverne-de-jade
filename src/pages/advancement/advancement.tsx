import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CaretRight, ImageSquare } from 'phosphor-react';

import {
	ADVANCEMENT_CATEGORIES,
	AdvancementGroup,
	AdvancementItem,
	categoryItems,
	countChecked,
	labelOf,
} from '../../features/advancement/catalog.ts';
import { groupCover } from '../../features/advancement/covers.ts';
import Unfold from '../../components/unfold/unfold.tsx';
import { useAdvancement } from '../../hooks/useAdvancement.ts';
import './advancement.scss';

const RING_SIZE = 96;
const RING_STROKE = 8;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const Cover: React.FC<{ src: string | null; size: number }> = ({ src, size }) => (
	src
		? <img src={src} alt="" />
		: (
			<span className="advancement-placeholder" aria-hidden="true">
				<ImageSquare size={size} />
			</span>
		)
);

const STAT_IDS = ['quests', 'exploration', 'achievements'] as const;

interface ProgressRingProps {
	percent: number;
	label: string;
	className: string;
}

const ProgressRing: React.FC<ProgressRingProps> = ({ percent, label, className }) => {
	const clamped = Math.min(100, Math.max(0, percent));
	const offset = RING_CIRCUMFERENCE * (1 - clamped / 100);

	return (
		<div className={`stat-ring ${className}`}>
			<svg viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`} aria-hidden="true">
				<circle className="stat-ring-track" cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_RADIUS} />
				{clamped > 0 && (
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

const Advancement: React.FC = () => {
	const { t, i18n } = useTranslation();
	const { checked, isLoading, loadError, toggle } = useAdvancement();
	const [saveError, setSaveError] = useState<string | null>(null);
	const [pendingId, setPendingId] = useState<string | null>(null);
	const [openCategoryId, setOpenCategoryId] = useState<string | null>(null);
	const [shownCategoryId, setShownCategoryId] = useState<string | null>(null);
	const [openSeriesId, setOpenSeriesId] = useState<string | null>(null);
	const detailRef = useRef<HTMLDivElement>(null);

	const stats = useMemo(() => STAT_IDS.map((id) => {
		const category = ADVANCEMENT_CATEGORIES.find((entry) => entry.id === id);
		return {
			id,
			label: category ? labelOf(category, i18n.language) : id,
			progress: countChecked(category ? categoryItems(category) : [], checked),
		};
	}), [checked, i18n.language]);
	const openCategory = ADVANCEMENT_CATEGORIES.find((category) => category.id === (openCategoryId ?? shownCategoryId)) ?? null;
	const openProgress = openCategory ? countChecked(categoryItems(openCategory), checked) : null;

	const detail = (done: number, total: number) => (
		total === 0 ? t('advancement.empty') : t('advancement.done', { done, total })
	);

	const onToggle = async (id: string) => {
		setPendingId(id);
		setSaveError(null);
		try {
			await toggle(id);
		} catch (error) {
			setSaveError(error instanceof Error ? error.message : t('advancement.saveError'));
		} finally {
			setPendingId(null);
		}
	};

	const selectCategory = (categoryId: string) => {
		if (openCategoryId === categoryId) {
			setOpenCategoryId(null);
			setOpenSeriesId(null);
			return;
		}
		const category = ADVANCEMENT_CATEGORIES.find((entry) => entry.id === categoryId);
		setShownCategoryId(categoryId);
		setOpenCategoryId(categoryId);
		setOpenSeriesId(category?.groups[0]?.id ?? null);
	};

	useEffect(() => {
		if (!openCategoryId) return;
		detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
	}, [openCategoryId]);

	return (
		<div id="advancement" className="page">
			<section>
				<div className="section-container">
					<h2>{t('advancement.stats')}</h2>
					{(loadError || saveError) && <p className="advancement-error">{loadError || saveError}</p>}
					<div className="advancement-stats">
						{stats.map((stat) => (
							<article key={stat.id} className="stat-card">
								<ProgressRing className={`is-${stat.id}`} percent={stat.progress.percent} label={`${stat.progress.percent}%`} />
								<h3>{stat.label}</h3>
								<p>{isLoading ? t('common.loading') : detail(stat.progress.done, stat.progress.total)}</p>
							</article>
						))}
					</div>
				</div>

				<div className="section-container">
					<h2>{t('advancement.categories')}</h2>
					<div className="advancement-board">
						{ADVANCEMENT_CATEGORIES.map((category) => {
							const progress = countChecked(categoryItems(category), checked);
							return (
								<button
									key={category.id}
									type="button"
									className={`advancement-card${progress.percent === 100 ? ' is-complete' : ''}${openCategoryId === category.id ? ' is-selected' : ''}`}
									aria-expanded={openCategoryId === category.id}
									onClick={() => selectCategory(category.id)}
								>
									<span className="advancement-card-image">
										<Cover src={null} size={36} />
									</span>
									<strong>{labelOf(category, i18n.language)}</strong>
									<span className="advancement-bar" aria-hidden="true">
										<span style={{ width: `${progress.percent}%` }} />
									</span>
									<small>{t('advancement.done', { done: progress.done, total: progress.total })}</small>
								</button>
							);
						})}
					</div>
					<Unfold open={Boolean(openCategoryId)}>
						{openCategory && (
							<div className="advancement-detail" ref={detailRef}>
								<div className="advancement-detail-head">
									<h3>{labelOf(openCategory, i18n.language)}</h3>
									<p>{t('advancement.done', { done: openProgress?.done ?? 0, total: openProgress?.total ?? 0 })}</p>
								</div>
								<span className="advancement-bar" aria-hidden="true">
									<span style={{ width: `${openProgress?.percent ?? 0}%` }} />
								</span>
								<div className="advancement-series-list">
									{openCategory.groups.map((group) => (
										<SeriesBlock
											key={group.id}
											group={group}
											language={i18n.language}
											checked={checked}
											pendingId={pendingId}
											open={openSeriesId === group.id}
											onOpen={() => setOpenSeriesId(openSeriesId === group.id ? null : group.id)}
											onToggle={onToggle}
										/>
									))}
								</div>
							</div>
						)}
					</Unfold>
				</div>
			</section>
		</div>
	);
};

interface SeriesBlockProps {
	group: AdvancementGroup;
	language: string;
	checked: ReadonlySet<string>;
	pendingId: string | null;
	open: boolean;
	onOpen: () => void;
	onToggle: (id: string) => void;
}

const SeriesBlock: React.FC<SeriesBlockProps> = ({ group, language, checked, pendingId, open, onOpen, onToggle }) => {
	const { t } = useTranslation();
	const progress = countChecked(group.items, checked);

	return (
		<section className={`advancement-series${open ? ' is-open' : ''}${progress.percent === 100 ? ' is-complete' : ''}`}>
			<button type="button" className="advancement-series-head" onClick={onOpen} aria-expanded={open}>
				<Cover src={groupCover(group.id)} size={22} />
				<span className="advancement-series-title">
					<strong>{labelOf(group, language)}</strong>
					<span className="advancement-bar" aria-hidden="true">
						<span style={{ width: `${progress.percent}%` }} />
					</span>
				</span>
				<em>{t('advancement.done', { done: progress.done, total: progress.total })}</em>
				<CaretRight className="advancement-series-caret" size={18} />
			</button>
			<Unfold open={open}>
				<div className="advancement-series-body">
					<ul>
						{group.items.map((item) => (
							<CheckRow
								key={item.id}
								item={item}
								language={language}
								checked={checked.has(item.id)}
								disabled={pendingId === item.id}
								onToggle={onToggle}
							/>
						))}
					</ul>
					{group.todo && <p className="advancement-todo">{t(`advancement.todos.${group.todo}`)}</p>}
				</div>
			</Unfold>
		</section>
	);
};

interface CheckRowProps {
	item: AdvancementItem;
	language: string;
	checked: boolean;
	disabled: boolean;
	onToggle: (id: string) => void;
}

const CheckRow: React.FC<CheckRowProps> = ({ item, language, checked, disabled, onToggle }) => (
	<li className={checked ? 'is-done' : undefined}>
		<label>
			<input
				type="checkbox"
				checked={checked}
				disabled={disabled}
				onChange={() => onToggle(item.id)}
			/>
			<span>{labelOf(item, language)}</span>
		</label>
	</li>
);

export default Advancement;
