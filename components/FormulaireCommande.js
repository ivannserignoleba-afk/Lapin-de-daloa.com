'use client';

import { useState } from 'react';
import { X, CheckCircle2 } from 'lucide-react';

const MODES_PAIEMENT = ['Espèces à la livraison', 'Mobile Money', 'Carte bancaire'];

export default function FormulaireCommande({ articles, onFermer, onSuccess }) {
  const [nom, setNom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [adresse, setAdresse] = useState('');
  const [modePaiement, setModePaiement] = useState(MODES_PAIEMENT[0]);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState('');

  const total = articles.reduce((sum, a) => sum + a.prix * a.quantite, 0);

  async function handleSubmit(e) {
    e.preventDefault();
    setErreur('');

    if (!nom.trim() || !telephone.trim() || !adresse.trim()) {
      setErreur('Merci de remplir tous les champs obligatoires.');
      return;
    }

    setEnvoi(true);
    try {
      const res = await fetch('/api/commandes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client: { nom, telephone, adresse },
          modePaiement,
          articles: articles.map((a) => ({
            platId: a.id,
            nom: a.nom,
            prix: a.prix,
            quantite: a.quantite,
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Une erreur est survenue.');
      }

      onSuccess();
    } catch (err) {
      setErreur(err.message);
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 relative">
        <button
          onClick={onFermer}
          className="absolute top-3 right-3 text-stone-400 hover:text-stone-600"
        >
          <X size={20} />
        </button>

        <h3 className="font-bold text-lg text-stone-800 mb-4">Finaliser la commande</h3>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-stone-600 mb-1">Nom complet *</label>
            <input
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="Ex: Awa Koné"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-600 mb-1">Téléphone *</label>
            <input
              type="tel"
              value={telephone}
              onChange={(e) => setTelephone(e.target.value)}
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="Ex: 07 00 00 00 00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-600 mb-1">
              Adresse de livraison *
            </label>
            <textarea
              value={adresse}
              onChange={(e) => setAdresse(e.target.value)}
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              rows={2}
              placeholder="Ex: Cocody, Angré 8e tranche"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-600 mb-1">
              Mode de paiement
            </label>
            <select
              value={modePaiement}
              onChange={(e) => setModePaiement(e.target.value)}
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {MODES_PAIEMENT.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between font-semibold text-stone-700 pt-2 border-t">
            <span>Total à payer</span>
            <span>{new Intl.NumberFormat('fr-FR').format(total)} FCFA</span>
          </div>

          {erreur && <p className="text-sm text-red-600">{erreur}</p>}

          <button
            type="submit"
            disabled={envoi}
            className="w-full flex items-center justify-center gap-2 bg-brand-600 text-white font-medium py-2 rounded-lg hover:bg-brand-700 transition disabled:opacity-60"
          >
            <CheckCircle2 size={18} />
            {envoi ? 'Envoi en cours...' : 'Confirmer la commande'}
          </button>
        </form>
      </div>
    </div>
  );
}
