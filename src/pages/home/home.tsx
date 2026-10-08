import React from "react";
import "./home.scss";

import { WarningCircle } from "phosphor-react";


const PageHome: React.FC = () => {
    return (
        <>
            <div id="home-page" className="page">
                <section className="left">
                    <div className="section-container">
                        <div className="presentation">
                            <h2><div className="icon-fr"></div>Bienvenue sur la Taverne de Jade ! </h2>
                            <p>La Taverne de Jade est un site multifonction dédié aux fans de Genshin Impact. Ici, vous pouvez suivre et consulter vos progrès dans le
                                jeu pour garder un œil sur ce qu'il vous reste à accomplir. Vous avez également la possibilité de créer et gérer une liste de tâches
                                pour suivre vos objectifs quotidiens, hebdomadaires, mensuels, ou liés aux mises à jour. Personnalisez vos rappels et choisissez ceux
                                que vous souhaitez afficher.
                                <br /><br />
                                Vous pourrez bientôt accéder à votre historique de vœux et plannifier l'ascension de vos personnages.
                                <br /><br />
                                Ce site a été développé avec amour par <a href="/home">Mei</a>, avec le soutien des membres du <a href="/home">serveur Discord</a> portant le même nom.
                                N'hésitez pas à nous contacter pour toute suggestion ou pour signaler un problème !
                            </p>

                            <h2><div className="icon-uk"></div>Welcome to la Taverne de Jade!</h2>
                            <p>La Taverne de Jade is a multifunctional site dedicated to fans of Genshin Impact. Here, you can track and review your progress in the game to 
                                stay on top of what you still need to complete. You also have the option to create and manage a to-do list to keep track of your daily, 
                                weekly, monthly, or update-related goals. Customize your reminders and choose which ones you want to display.
                                <br /><br />
                                Soon, you’ll be able to access your wish history and plan the ascension of your characters.
                                <br /><br />
                                This site was lovingly developed by <a href="/home">Mei</a>, with support from members of the (french) <a href="/home">Discord server</a> of the same name. 
                                Feel free to reach out if you have any suggestions or issues to share with us!
                            </p>
                            <hr />
                            <h3>What's new ?</h3>
                            <p>
                                <span><span><WarningCircle size={24} weight="duotone" color="var(--color-primary)" className="warning-icon" />[2025-01-22] </span> - Added wish history and wish list feature</span>
                                <span><span><WarningCircle size={24} weight="duotone" color="var(--color-primary)" className="warning-icon" />[2025-01-22] </span> - Refactored the codebase and styles</span>
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </>
    );
}

export default PageHome;