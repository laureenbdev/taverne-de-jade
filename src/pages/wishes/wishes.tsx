import React from 'react';
import { useTranslation } from 'react-i18next';
import './wishes.scss';

import WishesOverview from '../../components/wishes-overview/wishes-overview.tsx';
import WishesStats from '../../components/wishes-stats/wishes-stats.tsx';
import Wishlist from '../../components/wishlist/wishlist.tsx';

const Wishes: React.FC = () => {
    const { t } = useTranslation();

    return (
        <div id="wishes" className="page">

            <section className="left">

                <div className="section-container">
                    <h2>{t('wishes.stats')}</h2>
                    <WishesStats />
                </div>

                <WishesOverview />

            </section>

            <section className="right">

                <div className="section-container">
                    <h2>{t('wishes.wishlist')}</h2>
                    <Wishlist />
                </div>

            </section>
        </div>
    );
}

export default Wishes;