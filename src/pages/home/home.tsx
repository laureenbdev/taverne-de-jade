import React from "react";
import "./home.scss";
import { useTranslation } from "react-i18next";
import { ChartBar, ListChecks, Sparkle } from "phosphor-react";

const PageHome: React.FC = () => {
    const { t, i18n } = useTranslation();
    const isFrench = i18n.resolvedLanguage?.startsWith("fr");

    return (
        <div id="home-page" className="page">
            <section className="left">
                <div className="hero">
                    <p className="hero-kicker">{t("home.kicker")}</p>
                    <h2>{t("home.title")}</h2>
                    <p className="hero-lede">{t("home.lede")}</p>
                </div>

                <div className="section-container sheet">
                    <article className="welcome">
                        <h2>
                            <span className={isFrench ? "icon-fr" : "icon-uk"} aria-hidden="true" />
                            {t("home.welcomeTitle")}
                        </h2>
                        <div className="welcome-copy">
                            <p>{t("home.welcome1")}</p>
                            <div>
                                <p>{t("home.welcome2")}</p>
                                <p>
                                    {t("home.welcome3Before")}
                                    <a href="https://github.com/laureenbdev" target="_blank" rel="noreferrer">Mei</a>
                                    {t("home.welcome3Middle")}
                                    <a href="https://discord.gg/Urwmqt9jgK" target="_blank" rel="noreferrer">{t("home.welcome3Discord")}</a>
                                    {t("home.welcome3After")}
                                </p>
                            </div>
                        </div>
                    </article>
                </div>

                <div className="features">
                    <article>
                        <ChartBar size={28} weight="duotone" />
                        <h3>{t("home.progressTitle")}</h3>
                        <p>{t("home.progressText")}</p>
                    </article>
                    <article>
                        <ListChecks size={28} weight="duotone" />
                        <h3>{t("home.goalsTitle")}</h3>
                        <p>{t("home.goalsText")}</p>
                    </article>
                    <article>
                        <Sparkle size={28} weight="duotone" />
                        <h3>{t("home.wishesTitle")}</h3>
                        <p>{t("home.wishesText")}</p>
                    </article>
                </div>

                <div className="section-container news">
                    <h3>{t("home.newsTitle")}</h3>
                    <ul>
                        <li>
                            <time dateTime="2025-01-22">2025-01-22</time>
                            <span>{t("home.newsWishHistory")}</span>
                        </li>
                        <li>
                            <time dateTime="2025-01-22">2025-01-22</time>
                            <span>{t("home.newsRefactor")}</span>
                        </li>
                    </ul>
                </div>
            </section>
        </div>
    );
};

export default PageHome;
