'use client';

import { useEffect, useState } from 'react';
import Menu from '../components/Menu';
import Panier from '../components/Panier';
import FormulaireCommande from '../components/FormulaireCommande';
import { CheckCircle2 } from 'lucide-react';

export default function HomePage() {
  const [plats, setPlats] = useState([]);
  const [panier, setPanier] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [commandeConfirmee, setCommandeConfirmee] = useState(false);

  useEffect(() => {
    fetch('/api/plats')
      .then((res) => res.json())
      .then((data) => {
        setPlats(data);
        setChargement(false);
      });
  }, []);

  function ajouterAuPanier(plat) {
    setPanier((prev) => {
      const existant = prev.find((a) => a.id === plat.id);
      if (existant) {
        return prev.map((a) =>
          a.id === plat.id ? { ...a, quantite: a.quantite + 1 } : a
        );
      }
      return [...prev, { ...plat, quantite: 1 }];
    });
  }

  function modifierQuantite(id, quantite) {
    if (quantite < 1) {
      supprimerDuPanier(id);
      return;
    }
    setPanier((prev) => prev.map((a) => (a.id === id ? { ...a, quantite } : a)));
  }

  function supprimerDuPanier(id) {
    setPanier((prev) => prev.filter((a) => a.id !== id));
  }

  function handleCommandeReussie() {
    setFormulaireOuvert(false);
    setPanier([]);
    setCommandeConfirmee(true);
    setTimeout(() => setCommandeConfirmee(false), 4000);
  }

  return (
    <div>
      {commandeConfirmee && (
        <div className="mb-4 flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
          <CheckCircle2 size={18} />
          Votre commande a bien été enregistrée ! Nous vous contacterons bientôt.
        </div>
      )}

      <h1 className="text-2xl font-bold text-stone-800 mb-1">Notre carte du jour</h1>
      <p className="text-stone-500 mb-6">Des plats de lapin faits maison, livrés chez vous.</p>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          {chargement ? (
            <p className="text-stone-500">Chargement du menu...</p>
          ) : (
            <Menu plats={plats} onAjouterAuPanier={ajouterAuPanier} />
          )}
        </div>

        <div className="lg:col-span-1">
          <Panier
            articles={panier}
            onModifierQuantite={modifierQuantite}
            onSupprimer={supprimerDuPanier}
            onCommander={() => setFormulaireOuvert(true)}
          />
        </div>
      </div>

      {formulaireOuvert && (
        <FormulaireCommande
          articles={panier}
          onFermer={() => setFormulaireOuvert(false)}
          onSuccess={handleCommandeReussie}
        />
      )}
    </div>
  );
}
