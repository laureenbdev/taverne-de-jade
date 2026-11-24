import React from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowElbowDownRight, PencilSimple, Trash } from 'phosphor-react';
import { Wish } from '../../features/wishes/types';
import './wishes-table.scss';

interface WishesTableProps {
	wishes: Wish[];
	onEdit: (wish: Wish) => void;
	onDelete: (id: string) => void;
}

/**
 * Composant tableau pour afficher l'historique des vœux
 */
const WishesTable: React.FC<WishesTableProps> = ({ wishes, onEdit, onDelete }) => {
	const { t, i18n } = useTranslation();
	const locale = i18n.language.startsWith('fr') ? 'fr-FR' : 'en-US';

	const formatDate = (value: string) => {
		if (!value) return '';
		const date = new Date(`${value}T00:00:00`);
		if (Number.isNaN(date.getTime())) return value;
		return date.toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });
	};

	return (
		<table className="wishes-table">
			<thead>
				<tr>
					<th>{t('wishes.table.name')}</th>
					<th>{t('wishes.table.total')}</th>
					<th>{t('wishes.table.date')}</th>
					<th scope="col">{t('common.edit')}</th>
					<th scope="col">{t('common.delete')}</th>
				</tr>
			</thead>
			<tbody>
				{wishes.length === 0 ? (
					<tr>
						<td colSpan={5} style={{ textAlign: 'center', padding: '20px' }}>
							{t('wishes.table.empty')}
						</td>
					</tr>
				) : (
					wishes.map((wish) => {
						const lost = wish.banner !== 'standard' && wish.won === false;
						return (
						<tr key={wish.id} className={lost ? 'lost' : ''}>
							<td className="wish-name">
								{lost && <ArrowElbowDownRight size={15} />}
								{wish.characterName}
							</td>
							<td>{wish.totalWishes}</td>
							<td>{formatDate(wish.date)}</td>
							<td
								className="edit-pull tooltip-anchor"
								onClick={() => onEdit(wish)}
								role="button"
								tabIndex={0}
								aria-label={t('wishes.table.edit')}
								onKeyDown={(e) => {
									if (e.key === 'Enter' || e.key === ' ') {
										e.preventDefault();
										onEdit(wish);
									}
								}}
							>
								<PencilSimple size={15} />
								<span className="tooltip top" role="tooltip">{t('wishes.table.edit')}</span>
							</td>
							<td
								className="del-pull tooltip-anchor"
								onClick={() => onDelete(wish.id)}
								role="button"
								tabIndex={0}
								aria-label={t('wishes.table.delete')}
								onKeyDown={(e) => {
									if (e.key === 'Enter' || e.key === ' ') {
										e.preventDefault();
										onDelete(wish.id);
									}
								}}
							>
								<Trash size={15} />
								<span className="tooltip top" role="tooltip">{t('wishes.table.delete')}</span>
							</td>
						</tr>
						);
					})
				)}
			</tbody>
		</table>
	);
};

export default WishesTable;
