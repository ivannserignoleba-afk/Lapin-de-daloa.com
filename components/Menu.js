'use client';

import { PlusCircle, CircleOff } from 'lucide-react';

function formatFCFA(montant) {
  return new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA';
}

export default function Menu({ plats, onAjouterAuPanier }) {
  if (!plats.length) {
    return <p className="text-stone-500">Aucun plat disponible pour le moment.</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {plats.map((plat) => {
        const epuise = plat.statut === 'Épuisé';
        return (
          <div
            key={plat.id}
            className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden flex flex-col"
          >
            <div className="relative">
              <img
                src={plat.image}
                alt={plat.nom}
                className={`w-full h-40 object-cover ${epuise ? 'grayscale opacity-60' : ''}`}
              />
              <span
                className={`absolute top-2 right-2 text-xs font-semibold px-2 py-1 rounded-full ${
                  epuise ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                }`}
              >
                {plat.statut}
              </span>
            </div>
            <div className="p-4 flex flex-col flex-1">
              <h3 className="font-bold text-stone-800">{plat.nom}</h3>
              <p className="text-sm text-stone-500 flex-1 mt-1">{plat.description}</p>
              <div className="flex items-center justify-between mt-3">
                <span className="font-semibold text-brand-700">{formatFCFA(plat.prix)}</span>
                <button
                  onClick={() => onAjouterAuPanier(plat)}
                  disabled={epuise}
                  className={`flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-lg transition ${
                    epuise
                      ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                      : 'bg-brand-600 text-white hover:bg-brand-700'
                  }`}
                >
                  {epuise ? <CircleOff size={16} /> : <PlusCircle size={16} />}
                  {epuise ? 'Épuisé' : 'Ajouter'}
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
