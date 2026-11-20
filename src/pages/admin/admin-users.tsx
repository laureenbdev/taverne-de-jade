import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { ArrowSquareOut, PencilSimple, Plus, Trash, UsersThree } from 'phosphor-react';

import AdminGate from '../../features/admin/AdminGate.tsx';
import { useAuth } from '../../features/auth/AuthContext.tsx';
import { startImpersonation } from '../../features/admin/impersonation.ts';
import type { AdminUserRow } from '../../features/admin/types.ts';
import {
	createAdminUser,
	deleteAdminUser,
	listAdminUsers,
	updateAdminUser,
} from '../../services/admin/adminRemote.ts';
import PasswordField from '../../components/password-field/password-field.tsx';
import Unfold, { LateUnfold } from '../../components/unfold/unfold.tsx';
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll.ts';
import { useModalPayload, useModalPresence } from '../../hooks/useModalPresence.ts';
import { formatAdminDate } from './admin-shared.ts';
import './admin.scss';

const AdminUsersPage: React.FC = () => {
	const { t, i18n } = useTranslation();
	const { session } = useAuth();
	const currentUserId = session?.user.id;
	const [users, setUsers] = useState<AdminUserRow[]>([]);
	const [loading, setLoading] = useState(true);
	const [status, setStatus] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
	const [busyId, setBusyId] = useState<string | null>(null);
	const [deleteTarget, setDeleteTarget] = useState<AdminUserRow | null>(null);
	const deletePresence = useModalPresence(Boolean(deleteTarget));
	const activeDelete = useModalPayload(deleteTarget, deletePresence.present);
	useLockBodyScroll(deletePresence.present);

	const [formOpen, setFormOpen] = useState(false);
	const [editTarget, setEditTarget] = useState<AdminUserRow | null>(null);
	const [formEmail, setFormEmail] = useState('');
	const [formPassword, setFormPassword] = useState('');
	const [formName, setFormName] = useState('');
	const [formBusy, setFormBusy] = useState(false);
	const isEditing = Boolean(editTarget);

	const load = useCallback(async () => {
		setLoading(true);
		setStatus(null);
		const result = await listAdminUsers();
		setLoading(false);
		if (result.error) {
			setStatus({ type: 'error', text: result.error });
			return;
		}
		setUsers(result.users);
	}, []);

	useEffect(() => {
		void load();
	}, [load]);

	useEffect(() => {
		if (!deleteTarget) return;
		const onKey = (event: KeyboardEvent) => {
			if (event.key === 'Escape') setDeleteTarget(null);
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [deleteTarget]);

	const closeForm = () => {
		setFormOpen(false);
		setEditTarget(null);
		setFormEmail('');
		setFormPassword('');
		setFormName('');
	};

	const openCreate = () => {
		if (formOpen && !isEditing) {
			closeForm();
			return;
		}
		setEditTarget(null);
		setFormEmail('');
		setFormPassword('');
		setFormName('');
		setFormOpen(true);
	};

	const openEdit = (user: AdminUserRow) => {
		setEditTarget(user);
		setFormEmail(user.email);
		setFormName(user.displayName);
		setFormPassword('');
		setFormOpen(true);
	};

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();
		setFormBusy(true);
		setStatus(null);

		const error = isEditing && editTarget
			? await updateAdminUser({
				userId: editTarget.id,
				email: formEmail,
				displayName: formName,
				password: formPassword,
			})
			: await createAdminUser({
				email: formEmail,
				password: formPassword,
				displayName: formName,
			});

		setFormBusy(false);
		if (error) {
			setStatus({ type: 'error', text: t(`admin.errors.${error}`, { defaultValue: error }) });
			return;
		}

		closeForm();
		setStatus({
			type: 'ok',
			text: isEditing ? t('admin.users.edited') : t('admin.users.created'),
		});
		void load();
	};

	const handleImpersonate = async (user: AdminUserRow) => {
		setBusyId(user.id);
		setStatus(null);
		const error = await startImpersonation({
			userId: user.id,
			targetEmail: user.email,
			targetDisplayName: user.displayName,
		});
		setBusyId(null);
		if (error) {
			setStatus({ type: 'error', text: t(`admin.errors.${error}`, { defaultValue: error }) });
		}
	};

	const handleDelete = async () => {
		if (!deleteTarget) return;
		const target = deleteTarget;
		setDeleteTarget(null);
		setBusyId(target.id);
		setStatus(null);
		const error = await deleteAdminUser(target.id);
		setBusyId(null);
		if (error) {
			setStatus({ type: 'error', text: t(`admin.errors.${error}`, { defaultValue: error }) });
			return;
		}
		if (editTarget?.id === target.id) closeForm();
		setStatus({ type: 'ok', text: t('admin.users.deleted') });
		void load();
	};

	return (
		<AdminGate>
			<div id="admin-page" className="page">
				<section className="left">
					<div className="section-container admin-header">
						<div className="admin-header-title">
							<span className="admin-header-icon" aria-hidden="true">
								<UsersThree size={26} weight="duotone" />
							</span>
							<div>
								<p className="admin-kicker">{t('admin.title')}</p>
								<h2>{t('admin.users.title')}</h2>
								<p>{t('admin.users.lede')}</p>
							</div>
						</div>
					</div>

					{status && (
						<p className={`admin-status ${status.type}`} role="status">{status.text}</p>
					)}

					<div className="section-container">
						<div className="admin-toolbar">
							<span className="admin-count">
								{loading ? '…' : t('admin.users.count', { count: users.length })}
							</span>
							<button
								type="button"
								className="btn-primary"
								onClick={openCreate}
							>
								<Plus size={16} />
								{t('admin.users.create')}
							</button>
						</div>

						<Unfold open={formOpen} className="admin-unfold">
							<form className="admin-create" onSubmit={(event) => void handleSubmit(event)}>
								<label>
									<span>{t('auth.email')}</span>
									<input
										type="email"
										autoComplete="off"
										required
										value={formEmail}
										onChange={(event) => setFormEmail(event.target.value)}
									/>
								</label>
								<label>
									<span>{t('auth.pseudo')}</span>
									<input
										type="text"
										autoComplete="off"
										required
										minLength={2}
										maxLength={24}
										value={formName}
										onChange={(event) => setFormName(event.target.value)}
									/>
								</label>
								<label>
									<span>
										{isEditing ? t('admin.users.passwordOptional') : t('auth.password')}
									</span>
									<PasswordField
										autoComplete="new-password"
										required={!isEditing}
										minLength={isEditing ? undefined : 8}
										value={formPassword}
										onChange={(event) => setFormPassword(event.target.value)}
									/>
								</label>
								<div className="admin-create-actions">
									<button type="button" className="btn-ghost" onClick={closeForm}>
										{t('common.cancel')}
									</button>
									<button type="submit" className="btn-primary" disabled={formBusy}>
										{isEditing ? t('admin.users.editSubmit') : t('admin.users.createSubmit')}
									</button>
								</div>
							</form>
						</Unfold>

						<LateUnfold
							loading={loading}
							className="admin-unfold"
							fallback={<p className="admin-loading">{t('common.loading')}</p>}
						>
								{users.length === 0 ? (
									<p className="admin-empty">{t('admin.users.empty')}</p>
								) : (
									<div className="admin-table-wrap">
										<table className="admin-table">
											<thead>
												<tr>
													<th>{t('auth.pseudo')}</th>
													<th>{t('auth.email')}</th>
													<th>{t('admin.users.role')}</th>
													<th>{t('admin.users.createdAt')}</th>
													<th>{t('admin.users.lastSignIn')}</th>
													<th>{t('admin.users.actions')}</th>
												</tr>
											</thead>
											<tbody>
												{users.map((user, index) => {
													const isSelf = user.id === currentUserId;
													const canDelete = !user.isAdmin && !isSelf;
													return (
														<tr
															key={user.id}
															style={{ animationDelay: `${Math.min(index, 10) * 35}ms` }}
														>
															<td>
																<div className="admin-user-name">{user.displayName || '—'}</div>
																{user.uid && <div className="admin-user-meta">UID {user.uid}</div>}
															</td>
															<td>{user.email || '—'}</td>
															<td>
																<span className={`admin-badge ${user.isAdmin ? 'admin' : 'user'}`}>
																	{user.isAdmin ? t('admin.users.admin') : t('admin.users.member')}
																</span>
															</td>
															<td>{formatAdminDate(user.createdAt, i18n.resolvedLanguage || 'en')}</td>
															<td>
																{user.lastSignInAt
																	? formatAdminDate(user.lastSignInAt, i18n.resolvedLanguage || 'en')
																	: t('admin.users.neverSignedIn')}
															</td>
															<td>
																<div className="admin-actions">
																	<div className="tooltip-anchor">
																		<button
																			type="button"
																			className="btn-icon"
																			disabled={busyId === user.id}
																			aria-label={t('admin.users.edit')}
																			onClick={() => openEdit(user)}
																		>
																			<PencilSimple size={18} />
																		</button>
																		<span className="tooltip bottom" role="tooltip">{t('admin.users.edit')}</span>
																	</div>
																	<div className="tooltip-anchor">
																		<button
																			type="button"
																			className="btn-icon"
																			disabled={busyId === user.id || user.isAdmin || isSelf}
																			aria-label={t('admin.users.loginAs')}
																			onClick={() => void handleImpersonate(user)}
																		>
																			<ArrowSquareOut size={18} />
																		</button>
																		<span className="tooltip bottom" role="tooltip">{t('admin.users.loginAs')}</span>
																	</div>
																	<div className="tooltip-anchor">
																		<button
																			type="button"
																			className="btn-icon btn-icon-danger"
																			disabled={busyId === user.id || !canDelete}
																			aria-label={t('admin.users.delete')}
																			onClick={() => setDeleteTarget(user)}
																		>
																			<Trash size={18} />
																		</button>
																		<span className="tooltip bottom" role="tooltip">{t('admin.users.delete')}</span>
																	</div>
																</div>
															</td>
														</tr>
													);
												})}
											</tbody>
										</table>
									</div>
								)}
						</LateUnfold>
					</div>
				</section>
			</div>

			{deletePresence.present && activeDelete && createPortal(
				<div
					className={`admin-confirm-overlay modal-layer${deletePresence.shown ? ' is-open' : ''}`}
					onClick={() => setDeleteTarget(null)}
				>
					<div
						className="admin-confirm"
						role="dialog"
						aria-modal="true"
						aria-labelledby="admin-delete-title"
						onClick={(event) => event.stopPropagation()}
					>
						<h2 id="admin-delete-title">{t('admin.users.delete')}</h2>
						<p>
							{t('admin.users.deleteConfirm', {
								name: activeDelete.displayName || activeDelete.email || '—',
							})}
						</p>
						<div className="admin-confirm-actions">
							<button type="button" className="btn-ghost" onClick={() => setDeleteTarget(null)}>
								{t('common.cancel')}
							</button>
							<button type="button" className="btn-danger" onClick={() => void handleDelete()}>
								{t('admin.users.delete')}
							</button>
						</div>
					</div>
				</div>,
				document.body,
			)}
		</AdminGate>
	);
};

export default AdminUsersPage;
