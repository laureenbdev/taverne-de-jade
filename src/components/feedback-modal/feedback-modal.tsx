import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { X } from 'phosphor-react';

import {
	FEEDBACK_SUBJECTS,
	FEEDBACK_TYPES,
	type FeedbackSubject,
	type FeedbackType,
} from '../../features/admin/types.ts';
import { useAuth } from '../../features/auth/AuthContext.tsx';
import SelectField from '../select-field/select-field.tsx';
import { useModalPresence } from '../../hooks/useModalPresence.ts';
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll.ts';
import { submitFeedback } from '../../services/feedback/feedbackRemote.ts';
import './feedback-modal.scss';

interface FeedbackModalProps {
	open: boolean;
	onClose: () => void;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ open, onClose }) => {
	const { t } = useTranslation();
	const { session } = useAuth();
	const [feedbackType, setFeedbackType] = useState<FeedbackType>('bug');
	const [subject, setSubject] = useState<FeedbackSubject>('other');
	const [message, setMessage] = useState('');
	const [submitting, setSubmitting] = useState(false);
	const [status, setStatus] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

	useEffect(() => {
		if (!open) return;
		setFeedbackType('bug');
		setSubject('other');
		setMessage('');
		setStatus(null);

		const onKey = (event: KeyboardEvent) => {
			if (event.key === 'Escape' && !event.defaultPrevented) onClose();
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [open, onClose]);

	const { present, shown } = useModalPresence(open);
	useLockBodyScroll(present);
	if (!present) return null;

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();
		if (!session?.user.id) return;

		const trimmed = message.trim();
		if (trimmed.length < 5) {
			setStatus({ type: 'error', text: t('feedback.errors.tooShort') });
			return;
		}

		setSubmitting(true);
		setStatus(null);
		const error = await submitFeedback({
			userId: session.user.id,
			message: trimmed,
			feedbackType,
			subject,
		});
		setSubmitting(false);

		if (error) {
			setStatus({
				type: 'error',
				text: error === 'invalid_message'
					? t('feedback.errors.tooShort')
					: t('feedback.errors.submit', { message: error }),
			});
			return;
		}

		setStatus({ type: 'ok', text: t('feedback.success') });
		setMessage('');
		window.setTimeout(() => onClose(), 900);
	};

	return createPortal(
		<div className={`feedback-modal-overlay modal-layer${shown ? ' is-open' : ''}`} onClick={onClose}>
			<div
				className="feedback-modal"
				role="dialog"
				aria-modal="true"
				aria-labelledby="feedback-modal-title"
				onClick={(event) => event.stopPropagation()}
			>
				<div className="feedback-modal-header">
					<h2 id="feedback-modal-title">{t('feedback.title')}</h2>
					<button type="button" className="feedback-modal-close" onClick={onClose} aria-label={t('common.close')}>
						<X size={18} />
					</button>
				</div>
				<p className="feedback-modal-lede">{t('feedback.lede')}</p>
				<form className="feedback-modal-form" onSubmit={(event) => void handleSubmit(event)}>
					<label>
						<span>{t('feedback.type')}</span>
						<SelectField
							value={feedbackType}
							onChange={(next) => setFeedbackType(next as FeedbackType)}
							options={FEEDBACK_TYPES.map((value) => ({
								value,
								label: t(`feedback.types.${value}`),
							}))}
						/>
					</label>
					<label>
						<span>{t('feedback.subject')}</span>
						<SelectField
							value={subject}
							onChange={(next) => setSubject(next as FeedbackSubject)}
							options={FEEDBACK_SUBJECTS.map((value) => ({
								value,
								label: t(`feedback.subjects.${value}`),
							}))}
						/>
					</label>
					<label className="feedback-modal-message">
						<span>{t('feedback.message')}</span>
						<textarea
							value={message}
							maxLength={4000}
							rows={5}
							required
							placeholder={t('feedback.messagePlaceholder')}
							onChange={(event) => {
								setMessage(event.target.value);
								setStatus(null);
							}}
						/>
					</label>
					{status && <p className={`feedback-modal-status ${status.type}`}>{status.text}</p>}
					<div className="feedback-modal-actions">
						<button type="button" className="btn-ghost" onClick={onClose}>
							{t('common.cancel')}
						</button>
						<button type="submit" className="btn-primary" disabled={submitting}>
							{t('feedback.submit')}
						</button>
					</div>
				</form>
			</div>
		</div>,
		document.body,
	);
};

export default FeedbackModal;
