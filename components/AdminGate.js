'use client';

import { useEffect, useState } from 'react';
import { KeyRound, Copy, Check, ShieldAlert, LogIn } from 'lucide-react';
import AdminDashboard from './AdminDashboard';

export default function AdminGate() {
  const [statut, setStatut] = useState('chargement'); // chargement | setup | login | authentifie
  const [motDePasseGenere, setMotDePasseGenere] = useState('');
  const [copie, setCopie] = useState(false);
  const [motDePasseSaisi, setMotDePasseSaisi] = useState('');
  const [erreur, setErreur] = useState('');
  const [envoi, setEnvoi] = useState(false);

  useEffect(() => {
    verifierEtat();
  }, []);

  async function verifierEtat() {
    const resSession = await fetch('/api/admin/session');
    const { authentifie } = await resSession.json();

    if (authentifie) {
      setStatut('authentifie');
      return;
    }

    const resSetup = await fetch('/api/admin/setup');
    const { motDePasse, dejaConfirme } = await resSetup.json();

    if (!dejaConfirme && motDePasse) {
      setMotDePasseGenere(motDePasse);
      setStatut('setup');
    } else {
      setStatut('login');
    }
  }

  async function regenerer() {
    const res = await fetch('/api/admin/setup/regenerer', { method: 'POST' });
    const data = await res.json();
    if (res.ok) {
      setMotDePasseGenere(data.motDePasse);
      setCopie(false);
    }
  }

  async function confirmerNote() {
    await fetch('/api/admin/setup/confirmer', { method: 'POST' });
    setStatut('login');
  }

  function copier() {
    navigator.clipboard.writeText(motDePasseGenere);
    setCopie(true);
    setTimeout(() => setCopie(false), 2000);
  }

  async function seConnecter(e) {
    e.preventDefault();
    setErreur('');
    setEnvoi(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motDePasse: motDePasseSaisi }),
      });
      if (!res.ok) {
        const data = await res.json();
        setErreur(data.error || 'Connexion impossible.');
        return;
      }
      setStatut('authentifie');
    } finally {
      setEnvoi(false);
    }
  }

  async function seDeconnecter() {
    await fetch('/api/admin/logout', { method: 'POST' });
    setStatut('login');
    setMotDePasseSaisi('');
  }

  if (statut === 'chargement') {
    return <p className="text-stone-500">Chargement...</p>;
  }

  if (statut === 'setup') {
    return (
      <div className="max-w-md mx-auto bg-white rounded-xl border border-amber-200 p-6 mt-8">
        <div className="flex items-center gap-2 text-amber-700 mb-3">
          <ShieldAlert size={22} />
          <h2 className="font-bold text-lg">Mot de passe administrateur généré</h2>
        </div>
        <p className="text-sm text-stone-600 mb-4">
          Ce mot de passe protège l'accès à la gestion des plats, des commandes et du
          stock. Il ne sera <strong>affiché qu'une seule fois</strong> : notez-le
          précieusement avant de continuer.
        </p>

        <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-lg px-3 py-3 mb-4">
          <KeyRound size={18} className="text-brand-600 shrink-0" />
          <span className="font-mono font-bold text-lg text-stone-800 tracking-wider flex-1">
            {motDePasseGenere}
          </span>
          <button
            onClick={copier}
            className="p-1.5 rounded bg-white border border-stone-200 hover:bg-stone-100"
            title="Copier"
          >
            {copie ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={confirmerNote}
            className="w-full bg-brand-600 text-white font-medium py-2 rounded-lg hover:bg-brand-700 transition"
          >
            J'ai noté mon mot de passe, continuer
          </button>
          <button
            onClick={regenerer}
            className="text-sm text-stone-500 hover:text-stone-700 underline"
          >
            Générer un autre mot de passe
          </button>
        </div>
      </div>
    );
  }

  if (statut === 'login') {
    return (
      <div className="max-w-sm mx-auto bg-white rounded-xl border border-stone-200 p-6 mt-8">
        <div className="flex items-center gap-2 text-stone-800 mb-4">
          <LogIn size={22} className="text-brand-600" />
          <h2 className="font-bold text-lg">Connexion administrateur</h2>
        </div>
        <form onSubmit={seConnecter} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-stone-600 mb-1">
              Mot de passe
            </label>
            <input
              type="password"
              autoFocus
              value={motDePasseSaisi}
              onChange={(e) => setMotDePasseSaisi(e.target.value)}
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          {erreur && <p className="text-sm text-red-600">{erreur}</p>}
          <button
            type="submit"
            disabled={envoi}
            className="w-full bg-brand-600 text-white font-medium py-2 rounded-lg hover:bg-brand-700 transition disabled:opacity-60"
          >
            {envoi ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    );
  }

  return <AdminDashboard onDeconnexion={seDeconnecter} />;
}
