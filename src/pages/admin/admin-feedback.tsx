import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowsClockwise, ChatCircleText } from 'phosphor-react';

import AdminGate from '../../features/admin/AdminGate.tsx';
import {
	FEEDBACK_STATUSES,
	FEEDBACK_SUBJECTS,
	FEEDBACK_TYPES,
	type FeedbackRow,
	type FeedbackStatus,
	type FeedbackSubject,
	type FeedbackType,
} from '../../features/admin/types.ts';
import SelectField from '../../components/select-field/select-field.tsx';
import { LateUnfold } from '../../components/unfold/unfold.tsx';
import { listAdminFeedback, setFeedbackStatus } from '../../services/admin/adminRemote.ts';
import { formatAdminDate } from './admin-shared.ts';
import './admin.scss';

const STATUS_RANK: Record<FeedbackStatus, number> = {
	a_classer: 0,
	a_traiter: 1,
	traite: 2,
	a_ignorer: 3,
};

type FilterAll = 'all';

function sortFeedback(items: FeedbackRow[]) {
	return [...items].sort((a, b) => {
		const byStatus = STATUS_RANK[a.status] - STATUS_RANK[b.status];
		if (byStatus !== 0) return byStatus;
		return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
	});
}

const AdminFeedbackPage: React.FC = () => {
	const { t, i18n } = useTranslation();
	const [feedback, setFeedback] = useState<FeedbackRow[]>([]);
	const [loading, setLoading] = useState(true);
	const [status, setStatus] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
	const [busyId, setBusyId] = useState<string | null>(null);
	const [filterType, setFilterType] = useState<FeedbackType | FilterAll>('all');
	const [filterSubject, setFilterSubject] = useState<FeedbackSubject | FilterAll>('all');
	const [filterStatus, setFilterStatus] = useState<FeedbackStatus | FilterAll>('all');

	const load = useCallback(async () => {
		setLoading(true);
		setStatus(null);
		const result = await listAdminFeedback();
		setLoading(false);
		if (result.error) {
			setStatus({ type: 'error', text: result.error });
			return;
		}
		setFeedback(sortFeedback(result.items));
	}, []);

	useEffect(() => {
		void load();
	}, [load]);

	const filtered = useMemo(
		() => feedback.filter((item) => {
			if (filterType !== 'all' && item.feedbackType !== filterType) return false;
			if (filterSubject !== 'all' && item.subject !== filterSubject) return false;
			if (filterStatus !== 'all' && item.status !== filterStatus) return false;
			return true;
		}),
		[feedback, filterSubject, filterStatus, filterType],
	);

	const groups = useMemo(
		() => FEEDBACK_STATUSES
			.map((value) => ({
				status: value,
				items: filtered.filter((item) => item.status === value),
			}))
			.filter((group) => group.items.length > 0),
		[filtered],
	);

	const handleStatusChange = async (item: FeedbackRow, next: FeedbackStatus) => {
		if (next === item.status) return;
		setBusyId(item.id);
		const error = await setFeedbackStatus(item.id, next);
		setBusyId(null);
		if (error) {
			setStatus({ type: 'error', text: error });
			return;
		}
		setFeedback((prev) => sortFeedback(prev.map((row) => (
			row.id === item.id ? { ...row, status: next } : row
		))));
	};

	const hasFilters = filterType !== 'all' || filterSubject !== 'all' || filterStatus !== 'all';

	return (
		<AdminGate>
			<div id="admin-page" className="page">
				<section className="left">
					<div className="section-container admin-header">
						<div className="admin-header-title">
							<span className="admin-header-icon" aria-hidden="true">
								<ChatCircleText size={26} weight="duotone" />
							</span>
							<div>
								<p className="admin-kicker">{t('admin.title')}</p>
								<h2>{t('admin.feedback.title')}</h2>
								<p>{t('admin.feedback.lede')}</p>
							</div>
						</div>
					</div>

					{status && (
						<p className={`admin-status ${status.type}`} role="status">{status.text}</p>
					)}

					<div className="section-container">
						<div className="admin-toolbar">
							<span className="admin-count">
								{loading
									? '…'
									: t('admin.feedback.count', { count: filtered.length })}
							</span>
							<button type="button" className="btn-ghost" onClick={() => void load()}>
								<ArrowsClockwise size={16} />
								{t('admin.refresh')}
							</button>
						</div>

						<div className="admin-filters" aria-label={t('admin.feedback.filters')}>
							<label>
								<span>{t('admin.feedback.filterType')}</span>
								<SelectField
									value={filterType}
									onChange={(next) => setFilterType(next as FeedbackType | FilterAll)}
									options={[
										{ value: 'all', label: t('admin.feedback.filterAll') },
										...FEEDBACK_TYPES.map((value) => ({
											value,
											label: t(`feedback.types.${value}`),
										})),
									]}
								/>
							</label>
							<label>
								<span>{t('admin.feedback.filterSubject')}</span>
								<SelectField
									value={filterSubject}
									onChange={(next) => setFilterSubject(next as FeedbackSubject | FilterAll)}
									options={[
										{ value: 'all', label: t('admin.feedback.filterAll') },
										...FEEDBACK_SUBJECTS.map((value) => ({
											value,
											label: t(`feedback.subjects.${value}`),
										})),
									]}
								/>
							</label>
							<label>
								<span>{t('admin.feedback.filterStatus')}</span>
								<SelectField
									value={filterStatus}
									onChange={(next) => setFilterStatus(next as FeedbackStatus | FilterAll)}
									options={[
										{ value: 'all', label: t('admin.feedback.filterAll') },
										...FEEDBACK_STATUSES.map((value) => ({
											value,
											label: t(`feedback.statuses.${value}`),
										})),
									]}
								/>
							</label>
						</div>

						<LateUnfold
							loading={loading}
							className="admin-unfold"
							fallback={<p className="admin-loading">{t('common.loading')}</p>}
						>
								{feedback.length === 0 ? (
									<p className="admin-empty">{t('admin.feedback.empty')}</p>
								) : filtered.length === 0 ? (
									<p className="admin-empty">
										{hasFilters ? t('admin.feedback.emptyFiltered') : t('admin.feedback.empty')}
									</p>
								) : (
									<div className="admin-feedback-groups">
										{groups.map((group) => (
											<section
												key={group.status}
												className={`admin-feedback-group status-${group.status}`}
											>
												<h3 className="admin-feedback-group-title">
													<span>{t(`feedback.statuses.${group.status}`)}</span>
													<span className="admin-feedback-group-count">{group.items.length}</span>
												</h3>
												<ul className="admin-feedback-list">
													{group.items.map((item, index) => (
														<li
															key={item.id}
															className={`admin-feedback-card status-${item.status}`}
															style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
														>
															<div className="admin-feedback-top">
																<div className="admin-feedback-meta">
																	<span className="admin-feedback-author">
																		{item.displayName || item.email || '—'}
																	</span>
																	<span>
																		{formatAdminDate(item.createdAt, i18n.resolvedLanguage || 'en')}
																	</span>
																</div>
																<label className="admin-feedback-status">
																	<span className="visually-hidden">{t('admin.feedback.status')}</span>
																	<SelectField
																		value={item.status}
																		disabled={busyId === item.id}
																		aria-label={t('admin.feedback.status')}
																		onChange={(next) => void handleStatusChange(
																			item,
																			next as FeedbackStatus,
																		)}
																		options={FEEDBACK_STATUSES.map((value) => ({
																			value,
																			label: t(`feedback.statuses.${value}`),
																		}))}
																	/>
																</label>
															</div>
															<div className="admin-feedback-tags">
																<span className={`tag-type tag-type-${item.feedbackType}`}>
																	{t(`feedback.types.${item.feedbackType}`)}
																</span>
																<span className="tag-subject">
																	{t(`feedback.subjects.${item.subject}`)}
																</span>
															</div>
															<p className="admin-feedback-message">{item.message}</p>
														</li>
													))}
												</ul>
											</section>
										))}
									</div>
								)}
						</LateUnfold>
					</div>
				</section>
			</div>
		</AdminGate>
	);
};

export default AdminFeedbackPage;
