import React, { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';

import { supabase } from '../../lib/supabase.js';
import './supabase-test.scss';

const SupabaseTest: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [session, setSession] = useState<Session | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  const signIn = async () => {
    if (!supabase) return;
    setMessage('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setMessage(error.message);
  };

  const signUp = async () => {
    if (!supabase) return;
    setMessage('');
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) setMessage(error.message);
    else setMessage('Compte créé. Vérifie tes emails si la confirmation est activée.');
  };

  const signOut = async () => {
    if (!supabase) return;
    setMessage('');
    const { error } = await supabase.auth.signOut();
    if (error) setMessage(error.message);
  };

  return (
    <div className="supabase-test page">
      <div className="card">
        <h2>Test Supabase</h2>

        {!supabase && (
          <p className="message">
            Renseigne REACT_APP_SUPABASE_URL et REACT_APP_SUPABASE_PUBLISHABLE_KEY dans .env.local, puis redémarre le serveur.
          </p>
        )}

        {supabase && loading && <p>Chargement…</p>}

        {supabase && !loading && session && (
          <div className="welcome">
            <p>Bienvenue !</p>
            <p>Email : {session.user.email}</p>
            <button type="button" onClick={signOut}>Se déconnecter</button>
          </div>
        )}

        {supabase && !loading && !session && (
          <>
            <label>
              Email
              <input
                type="email"
                value={email}
                autoComplete="email"
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            <label>
              Mot de passe
              <input
                type="password"
                value={password}
                autoComplete="current-password"
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
            <div className="actions">
              <button type="button" onClick={signIn}>Se connecter</button>
              <button type="button" className="secondary" onClick={signUp}>Créer un compte</button>
            </div>
          </>
        )}

        {message && <p className="message">{message}</p>}
      </div>
    </div>
  );
};

export default SupabaseTest;
