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
// todo : remplacer 0 par une condition pour check si c'est perdu
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
					<th>{t('wishes.table.banner')}</th>
					<th></th>
					<th></th>
				</tr>
			</thead>
			<tbody>
				{wishes.length === 0 ? (
					<tr>
						<td colSpan={6} style={{ textAlign: 'center', padding: '20px' }}>
							{t('wishes.table.empty')}
						</td>
					</tr>
				) : (
					wishes.map((wish) => (
						<tr
							key={wish.id}
							className={0 ? 'text-red' : wish.banner === 'Perma' ? 'text-blue' : ''}
						>
							<td>
								{0 ? <ArrowElbowDownRight size={15} /> : <></>}
								{wish.characterName}
							</td>
							<td>{wish.totalWishes}</td>
							<td>{formatDate(wish.date)}</td>
							<td>{wish.banner}</td>
							<td
								className="edit-pull"
								title={t('wishes.table.edit')}
								onClick={() => onEdit(wish)}
								role="button"
								tabIndex={0}
								onKeyDown={(e) => {
									if (e.key === 'Enter' || e.key === ' ') {
										e.preventDefault();
										onEdit(wish);
									}
								}}
							>
								<PencilSimple size={15} />
							</td>
							<td
								className="del-pull"
								title={t('wishes.table.delete')}
								onClick={() => onDelete(wish.id)}
								role="button"
								tabIndex={0}
								onKeyDown={(e) => {
									if (e.key === 'Enter' || e.key === ' ') {
										e.preventDefault();
										onDelete(wish.id);
									}
								}}
							>
								<Trash size={15} />
							</td>
						</tr>
					))
				)}
			</tbody>
		</table>
	);
};

export default WishesTable;
