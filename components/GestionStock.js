'use client';

import { useEffect, useState } from 'react';
import { ArrowDownCircle, ArrowUpCircle, PackageSearch } from 'lucide-react';

export default function GestionStock({ plats, onStockMisAJour }) {
  const [mouvements, setMouvements] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [platId, setPlatId] = useState(plats[0]?.id || '');
  const [type, setType] = useState('Entrée');
  const [quantite, setQuantite] = useState('');
  const [motif, setMotif] = useState('');
  const [erreur, setErreur] = useState('');
  const [envoi, setEnvoi] = useState(false);

  useEffect(() => {
    chargerMouvements();
  }, []);

  useEffect(() => {
    if (!platId && plats.length) setPlatId(plats[0].id);
  }, [plats]);

  async function chargerMouvements() {
    setChargement(true);
    const res = await fetch('/api/mouvements');
    if (res.ok) setMouvements(await res.json());
    setChargement(false);
  }

  async function enregistrerMouvement(e) {
    e.preventDefault();
    setErreur('');

    if (!platId || !quantite || Number(quantite) <= 0) {
      setErreur('Sélectionnez un plat et indiquez une quantité positive.');
      return;
    }

    setEnvoi(true);
    try {
      const res = await fetch('/api/mouvements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platId, type, quantite: Number(quantite), motif }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErreur(data.error || 'Une erreur est survenue.');
        return;
      }

      setMouvements((prev) => [data, ...prev]);
      setQuantite('');
      setMotif('');
      onStockMisAJour();
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1">
        <div className="bg-white rounded-xl border border-stone-200 p-4 mb-4">
          <h3 className="font-bold text-stone-800 flex items-center gap-2 mb-3">
            <PackageSearch size={18} />
            Stock actuel par plat
          </h3>
          <ul className="space-y-2 text-sm">
            {plats.map((plat) => (
              <li key={plat.id} className="flex items-center justify-between">
                <span className="text-stone-600">{plat.nom}</span>
                <span
                  className={`font-semibold ${
                    (plat.stock ?? 0) === 0 ? 'text-red-600' : 'text-stone-800'
                  }`}
                >
                  {plat.stock ?? 0}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white rounded-xl border border-stone-200 p-4">
          <h3 className="font-bold text-stone-800 mb-3">Enregistrer un mouvement</h3>
          <form onSubmit={enregistrerMouvement} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1">Plat</label>
              <select
                value={platId}
                onChange={(e) => setPlatId(e.target.value)}
                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {plats.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nom}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setType('Entrée')}
                className={`flex-1 flex items-center justify-center gap-1 text-sm font-medium py-2 rounded-lg border ${
                  type === 'Entrée'
                    ? 'bg-green-50 border-green-300 text-green-700'
                    : 'border-stone-200 text-stone-500'
                }`}
              >
                <ArrowDownCircle size={16} />
                Entrée
              </button>
              <button
                type="button"
                onClick={() => setType('Sortie')}
                className={`flex-1 flex items-center justify-center gap-1 text-sm font-medium py-2 rounded-lg border ${
                  type === 'Sortie'
                    ? 'bg-red-50 border-red-300 text-red-700'
                    : 'border-stone-200 text-stone-500'
                }`}
              >
                <ArrowUpCircle size={16} />
                Sortie
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1">Quantité</label>
              <input
                type="number"
                min="1"
                value={quantite}
                onChange={(e) => setQuantite(e.target.value)}
                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1">
                Motif (optionnel)
              </label>
              <input
                type="text"
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
                placeholder={type === 'Entrée' ? 'Ex: Réapprovisionnement fournisseur' : 'Ex: Produit périmé'}
                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {erreur && <p className="text-sm text-red-600">{erreur}</p>}

            <button
              type="submit"
              disabled={envoi}
              className="w-full bg-brand-600 text-white font-medium py-2 rounded-lg hover:bg-brand-700 transition disabled:opacity-60"
            >
              {envoi ? 'Enregistrement...' : 'Enregistrer le mouvement'}
            </button>
          </form>
        </div>
      </div>

      <div className="lg:col-span-2">
        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-stone-100 font-bold text-stone-800">
            Historique des entrées / sorties
          </div>
          {chargement ? (
            <p className="text-stone-500 p-4">Chargement...</p>
          ) : mouvements.length === 0 ? (
            <p className="text-stone-500 p-4">Aucun mouvement enregistré pour le moment.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-stone-50 text-stone-500 text-left">
                <tr>
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2">Plat</th>
                  <th className="px-4 py-2">Type</th>
                  <th className="px-4 py-2">Quantité</th>
                  <th className="px-4 py-2">Motif</th>
                </tr>
              </thead>
              <tbody>
                {mouvements.map((m) => (
                  <tr key={m.id} className="border-t border-stone-100">
                    <td className="px-4 py-2 text-stone-500">
                      {new Date(m.date).toLocaleString('fr-FR')}
                    </td>
                    <td className="px-4 py-2 font-medium text-stone-700">{m.platNom}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          m.type === 'Entrée'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {m.type}
                      </span>
                    </td>
                    <td className="px-4 py-2">{m.quantite}</td>
                    <td className="px-4 py-2 text-stone-500">{m.motif}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
