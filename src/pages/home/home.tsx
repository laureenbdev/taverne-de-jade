import React from "react";
import "./home.scss";
import { ChartBar, ListChecks, Sparkle } from "phosphor-react";

const PageHome: React.FC = () => {
    return (
        <div id="home-page" className="page">
            <section className="left">
                <div className="hero">
                    <p className="hero-kicker">Genshin Impact</p>
                    <h2>La Taverne de Jade</h2>
                    <p className="hero-lede">Un outil multifonction.</p>
                </div>

                <div className="section-container sheet">
                    <div className="lang-grid">
                        <article>
                            <h2><span className="icon-fr" aria-hidden="true" /> Bienvenue</h2>
                            <p>
                                La Taverne de Jade est un site dédié aux fans de Genshin Impact.
                                Suivez votre progression et gardez un œil sur ce qu'il vous reste à accomplir.
                                Créez une liste d'objectifs — quotidiens, hebdomadaires, mensuels ou liés aux mises à jour —
                                et choisissez les rappels que vous voulez afficher.
                            </p>
                            <p>
                                L'historique de vœux et la liste de souhaits sont disponibles.
                                La planification d'ascension des personnages arrive bientôt.
                            </p>
                            <p>
                                Développé avec soin par <a href="https://github.com/laureenbdev" target="_blank" rel="noreferrer">Mei</a>,
                                avec le soutien du <a href="https://discord.gg/Urwmqt9jgK" target="_blank" rel="noreferrer">serveur Discord</a> du même nom.
                                Une suggestion ou un problème ? Écrivez-nous.
                            </p>
                        </article>
                        <article>
                            <h2><span className="icon-uk" aria-hidden="true" /> Welcome</h2>
                            <p>
                                La Taverne de Jade is a site for Genshin Impact fans.
                                Track your progress and keep an eye on what you still need to complete.
                                Build a to-do list for daily, weekly, monthly, or update goals,
                                and choose which reminders to show.
                            </p>
                            <p>
                                Wish history and the wishlist are available now.
                                Character ascension planning is on the way.
                            </p>
                            <p>
                                Lovingly built by <a href="https://github.com/laureenbdev" target="_blank" rel="noreferrer">Mei</a>,
                                with help from the French <a href="https://discord.gg/Urwmqt9jgK" target="_blank" rel="noreferrer">Discord server</a> of the same name.
                                Reach out with suggestions or issues.
                            </p>
                        </article>
                    </div>
                </div>

                <div className="features">
                    <article>
                        <ChartBar size={28} weight="duotone" />
                        <h3>Progression</h3>
                        <p>Gardez une vue claire sur ce qu'il reste à accomplir.</p>
                    </article>
                    <article>
                        <ListChecks size={28} weight="duotone" />
                        <h3>Objectifs</h3>
                        <p>Rappels du jour, de la semaine, du mois ou d'une mise à jour.</p>
                    </article>
                    <article>
                        <Sparkle size={28} weight="duotone" />
                        <h3>Vœux</h3>
                        <p>Historique, liste de souhaits, et bientôt l'ascension.</p>
                    </article>
                </div>

                <div className="section-container news">
                    <h3>Nouveautés</h3>
                    <ul>
                        <li>
                            <time dateTime="2025-01-22">2025-01-22</time>
                            <span>Added wish history and wish list</span>
                        </li>
                        <li>
                            <time dateTime="2025-01-22">2025-01-22</time>
                            <span>Refactored the codebase and styles</span>
                        </li>
                    </ul>
                </div>
            </section>
        </div>
    );
};

export default PageHome;
