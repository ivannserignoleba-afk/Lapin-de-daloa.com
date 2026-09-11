'use client';

import { Minus, Plus, Trash2, ShoppingCart } from 'lucide-react';

function formatFCFA(montant) {
  return new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA';
}

export default function Panier({ articles, onModifierQuantite, onSupprimer, onCommander }) {
  const total = articles.reduce((sum, a) => sum + a.prix * a.quantite, 0);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-4 sticky top-4">
      <h3 className="font-bold text-stone-800 flex items-center gap-2 mb-3">
        <ShoppingCart size={18} />
        Votre panier
      </h3>

      {articles.length === 0 ? (
        <p className="text-sm text-stone-500">Votre panier est vide.</p>
      ) : (
        <div className="space-y-3">
          {articles.map((a) => (
            <div key={a.id} className="flex items-center justify-between gap-2 text-sm">
              <div className="flex-1">
                <p className="font-medium text-stone-700">{a.nom}</p>
                <p className="text-stone-400">{formatFCFA(a.prix)}</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onModifierQuantite(a.id, a.quantite - 1)}
                  className="p-1 rounded bg-stone-100 hover:bg-stone-200"
                >
                  <Minus size={14} />
                </button>
                <span className="w-6 text-center">{a.quantite}</span>
                <button
                  onClick={() => onModifierQuantite(a.id, a.quantite + 1)}
                  className="p-1 rounded bg-stone-100 hover:bg-stone-200"
                >
                  <Plus size={14} />
                </button>
              </div>
              <button
                onClick={() => onSupprimer(a.id)}
                className="p-1 rounded text-red-500 hover:bg-red-50"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}

          <div className="border-t pt-3 flex items-center justify-between font-semibold">
            <span>Total</span>
            <span className="text-brand-700">{formatFCFA(total)}</span>
          </div>

          <button
            onClick={onCommander}
            className="w-full bg-brand-600 text-white font-medium py-2 rounded-lg hover:bg-brand-700 transition"
          >
            Passer la commande
          </button>
        </div>
      )}
    </div>
  );
}
