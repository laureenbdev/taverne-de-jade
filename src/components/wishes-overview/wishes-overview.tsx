import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import "./wishes-overview.scss";

import { ListPlus } from "phosphor-react";
import { LateUnfold } from "../unfold/unfold.tsx";
import { useWishes } from "../../hooks/useWishes.ts";
import { WISH_BANNERS, Wish, WishBanner, WishFormData } from "../../features/wishes/types.ts";

import WishesTable from "../wishes-table/wishes-table.tsx";
import WishModal from "../wish-modal/wish-modal.tsx";

const WishesOverview: React.FC = () => {
    const { t } = useTranslation();
    const { wishes, isLoading, addWish, updateWish, deleteWish } = useWishes();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingWish, setEditingWish] = useState<Wish | null>(null);
    const [defaultBanner, setDefaultBanner] = useState<WishBanner>('character');

    const handleAddClick = () => {
        setEditingWish(null);
        setDefaultBanner('character');
        setIsModalOpen(true);
    };

    const handleEdit = (wish: Wish) => {
        setEditingWish(wish);
        setDefaultBanner(wish.banner);
        setIsModalOpen(true);
    };

    const handleDelete = (id: string) => {
        if (window.confirm(t("wishes.confirmDelete"))) {
            deleteWish(id);
        }
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setEditingWish(null);
    };

	const handleModalSubmit = (data: WishFormData) => {
		if (editingWish) {
			updateWish(editingWish.id, data);
		} else {
			addWish(data);
		}
	};

	const sortedWishes = [...wishes].sort((a, b) => {
		const dateA = new Date(a.date).getTime();
		const dateB = new Date(b.date).getTime();
		return dateB - dateA;
	});

	return (
		<>
			<LateUnfold
				loading={isLoading}
				className="admin-unfold"
				fallback={<p className="wishes-loading" aria-live="polite">{t('common.loading')}</p>}
			>
				<section className="wishes-overview">
					{WISH_BANNERS.map((banner) => (
						<div className="section-container" key={banner}>
							<h3>{t('wishes.bannerBlock', { name: t(`wishes.banners.${banner}`) })}</h3>
							<WishesTable
								wishes={sortedWishes.filter((wish) => wish.banner === banner)}
								onEdit={handleEdit}
								onDelete={handleDelete}
							/>
						</div>
					))}

					<button
						type="button"
						className="section-container add-wish"
						onClick={handleAddClick}
					>
						<ListPlus size={24} />
						<span>{t("wishes.addPull")}</span>
					</button>
				</section>
			</LateUnfold>

			<WishModal
				isOpen={isModalOpen}
				wish={editingWish}
				defaultBanner={defaultBanner}
				onClose={handleModalClose}
				onSubmit={handleModalSubmit}
			/>
		</>
	);
};

export default WishesOverview;
