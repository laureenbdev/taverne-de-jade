import React from 'react';

import WishesOverview from '../../components/wishes-overview/wishes-overview.tsx';
import Wishlist from '../../components/wishlist/wishlist.tsx';

const Wishes: React.FC = () => {
    return (
        <div id="wishes" className="page">

            <section className="left">

                <div className="section-container">
                    <h2>Stats</h2>
                </div>

                <WishesOverview />

            </section>

            <section className="right">

                <div className="section-container">
                    <h2>Wishlist</h2>
                    <Wishlist />
                </div>

            </section>
        </div>
    );
}

export default Wishes;