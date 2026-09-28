'use client';

import { useEffect, useState } from 'react';
import {
  Pencil,
  Trash2,
  PlusCircle,
  PackageCheck,
  Receipt,
  TrendingUp,
  X,
  LogOut,
  KeyRound,
  Copy,
  Check,
} from 'lucide-react';
import GraphiqueVentes from './GraphiqueVentes';
import GestionStock from './GestionStock';

function formatFCFA(montant) {
  return new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA';
}

const STATUTS_COMMANDE = ['En attente', 'En préparation', 'Livrée', 'Annulée'];
const STATUT_COULEUR = {
  'En attente': 'bg-amber-100 text-amber-700',
  'En préparation': 'bg-blue-100 text-blue-700',
  Livrée: 'bg-green-100 text-green-700',
  Annulée: 'bg-red-100 text-red-700',
};

const PLAT_VIDE = { nom: '', description: '', prix: '', prixGros: '', type: 'lapin_prepare', statut: 'En stock', image: '', stock: '' };

export default function AdminDashboard({ onDeconnexion }) {
  const [ongletActif, setOngletActif] = useState('stats');
  const [plats, setPlats] = useState([]);
  const [commandes, setCommandes] = useState([]);
  const [chargement, setChargement] = useState(true);

  const [modalOuverte, setModalOuverte] = useState(false);
  const [platEnEdition, setPlatEnEdition] = useState(null);
  const [formPlat, setFormPlat] = useState(PLAT_VIDE);

  useEffect(() => {
    chargerDonnees();
  }, []);

  // Gère les réponses 401 (session expirée) en renvoyant vers l'écran de connexion
  function verifierSession(res) {
    if (res.status === 401) {
      onDeconnexion?.();
      return false;
    }
    return true;
  }

  async function chargerDonnees() {
    setChargement(true);
    const [resPlats, resCommandes] = await Promise.all([
      fetch('/api/plats'),
      fetch('/api/commandes'),
    ]);
    if (!verifierSession(resCommandes)) return;
    setPlats(await resPlats.json());
    setCommandes(await resCommandes.json());
    setChargement(false);
  }

  // ---------- Statistiques ----------
  const aujourdHui = new Date().toDateString();
  const commandesDuJour = commandes.filter(
    (c) => new Date(c.dateCreation).toDateString() === aujourdHui
  );
  const chiffreAffairesDuJour = commandesDuJour
    .filter((c) => c.statut !== 'Annulée')
    .reduce((sum, c) => sum + c.total, 0);
  const totalCommandes = commandes.length;

  // ---------- Gestion des plats ----------
  function ouvrirAjoutPlat() {
    setPlatEnEdition(null);
    setFormPlat(PLAT_VIDE);
    setModalOuverte(true);
  }

  function ouvrirEditionPlat(plat) {
    setPlatEnEdition(plat);
    setFormPlat({
      nom: plat.nom,
      description: plat.description,
      prix: plat.prix,
      prixGros: plat.prixGros ?? '',
      type: plat.type || 'lapin_prepare',
      statut: plat.statut,
      image: plat.image,
      stock: plat.stock ?? 0,
    });
    setModalOuverte(true);
  }

  async function enregistrerPlat(e) {
    e.preventDefault();
    const payload = { ...formPlat, prix: Number(formPlat.prix), prixGros: Number(formPlat.prixGros) || 0, stock: Number(formPlat.stock) || 0 };

    if (platEnEdition) {
      const res = await fetch(`/api/plats/${platEnEdition.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!verifierSession(res)) return;
      const maj = await res.json();
      setPlats((prev) => prev.map((p) => (p.id === maj.id ? maj : p)));
    } else {
      const res = await fetch('/api/plats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!verifierSession(res)) return;
      const nouveau = await res.json();
      setPlats((prev) => [...prev, nouveau]);
    }
    setModalOuverte(false);
  }

  async function supprimerPlat(id) {
    if (!confirm('Supprimer définitivement ce plat ?')) return;
    const res = await fetch(`/api/plats/${id}`, { method: 'DELETE' });
    if (!verifierSession(res)) return;
    setPlats((prev) => prev.filter((p) => p.id !== id));
  }

  async function basculerStatutPlat(plat) {
    const nouveauStatut = plat.statut === 'En stock' ? 'Épuisé' : 'En stock';
    const res = await fetch(`/api/plats/${plat.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statut: nouveauStatut }),
    });
    if (!verifierSession(res)) return;
    const maj = await res.json();
    setPlats((prev) => prev.map((p) => (p.id === maj.id ? maj : p)));
  }

  // ---------- Gestion des commandes ----------
  async function changerStatutCommande(id, statut) {
    const res = await fetch(`/api/commandes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statut }),
    });
    if (!verifierSession(res)) return;
    const maj = await res.json();
    setCommandes((prev) => prev.map((c) => (c.id === maj.id ? maj : c)));
    // Le stock peut avoir été déduit automatiquement (passage à "Livrée")
    if (maj.stockDeduit) {
      const resPlats = await fetch('/api/plats');
      setPlats(await resPlats.json());
    }
  }

  if (chargement) {
    return <p className="text-stone-500">Chargement du tableau de bord...</p>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-stone-800">Espace Administration</h1>
        <button
          onClick={onDeconnexion}
          className="flex items-center gap-1 text-sm text-stone-500 hover:text-red-600"
        >
          <LogOut size={16} />
          Se déconnecter
        </button>
      </div>

      <div className="flex gap-2 mb-6 border-b border-stone-200 overflow-x-auto">
        {[
          { id: 'stats', label: 'Statistiques' },
          { id: 'plats', label: 'Plats' },
          { id: 'stock', label: 'Entrées / Sorties' },
          { id: 'commandes', label: 'Commandes' },
          { id: 'parametres', label: 'Paramètres' },
        ].map((onglet) => (
          <button
            key={onglet.id}
            onClick={() => setOngletActif(onglet.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition whitespace-nowrap ${
              ongletActif === onglet.id
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-stone-500 hover:text-stone-700'
            }`}
          >
            {onglet.label}
          </button>
        ))}
      </div>

      {ongletActif === 'stats' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-stone-200 p-5 flex items-center gap-3">
              <Receipt className="text-brand-600" size={28} />
              <div>
                <p className="text-sm text-stone-500">Total des commandes</p>
                <p className="text-xl font-bold text-stone-800">{totalCommandes}</p>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-stone-200 p-5 flex items-center gap-3">
              <PackageCheck className="text-brand-600" size={28} />
              <div>
                <p className="text-sm text-stone-500">Commandes aujourd'hui</p>
                <p className="text-xl font-bold text-stone-800">{commandesDuJour.length}</p>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-stone-200 p-5 flex items-center gap-3">
              <TrendingUp className="text-brand-600" size={28} />
              <div>
                <p className="text-sm text-stone-500">Chiffre d'affaires du jour</p>
                <p className="text-xl font-bold text-stone-800">
                  {formatFCFA(chiffreAffairesDuJour)}
                </p>
              </div>
            </div>
          </div>

          <GraphiqueVentes commandes={commandes} />
        </div>
      )}

      {ongletActif === 'plats' && (
        <div>
          <div className="flex justify-end mb-3">
            <button
              onClick={ouvrirAjoutPlat}
              className="flex items-center gap-1 bg-brand-600 text-white text-sm font-medium px-3 py-2 rounded-lg hover:bg-brand-700"
            >
              <PlusCircle size={16} />
              Ajouter un plat
            </button>
          </div>

          <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 text-stone-500 text-left">
                <tr>
                  <th className="px-4 py-2">Produit</th>
                  <th className="px-4 py-2">Type</th>
                  <th className="px-4 py-2">Prix</th>
                  <th className="px-4 py-2">Stock</th>
                  <th className="px-4 py-2">Statut</th>
                  <th className="px-4 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {plats.map((plat) => (
                  <tr key={plat.id} className="border-t border-stone-100">
                    <td className="px-4 py-2 font-medium text-stone-700">{plat.nom}</td>
                    <td className="px-4 py-2 text-xs">{plat.type === 'lapin_frais' ? 'Lapin frais' : plat.type === 'lapin_prepare' ? 'Lapin préparé' : 'Plat de lapin'}</td>
                    <td className="px-4 py-2">{formatFCFA(plat.prix)}</td>
                    <td className="px-4 py-2">
                      <span className={(plat.stock ?? 0) === 0 ? 'text-red-600 font-semibold' : ''}>
                        {plat.stock ?? 0}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => basculerStatutPlat(plat)}
                        className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          plat.statut === 'En stock'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                        title="Cliquer pour changer le statut"
                      >
                        {plat.statut}
                      </button>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => ouvrirEditionPlat(plat)}
                          className="p-1.5 rounded bg-stone-100 hover:bg-stone-200"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => supprimerPlat(plat.id)}
                          className="p-1.5 rounded bg-red-50 text-red-600 hover:bg-red-100"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {ongletActif === 'stock' && (
        <GestionStock plats={plats} onStockMisAJour={chargerDonnees} />
      )}

      {ongletActif === 'commandes' && (
        <div className="space-y-3">
          {commandes.length === 0 && (
            <p className="text-stone-500">Aucune commande pour le moment.</p>
          )}
          {commandes.map((commande) => (
            <div
              key={commande.id}
              className="bg-white rounded-xl border border-stone-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div>
                <p className="font-semibold text-stone-800">
                  {commande.client.nom} — {commande.client.telephone}
                </p>
                <p className="text-sm text-stone-500">{commande.client.adresse}</p>
                <p className="text-sm text-stone-500 mt-1">
                  {commande.articles.map((a) => `${a.nom} x${a.quantite}`).join(', ')}
                </p>
                <p className="text-xs text-stone-400 mt-1">
                  {new Date(commande.dateCreation).toLocaleString('fr-FR')} ·{' '}
                  {commande.modePaiement}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="font-semibold text-brand-700">
                  {formatFCFA(commande.total)}
                </span>
                <select
                  value={commande.statut}
                  onChange={(e) => changerStatutCommande(commande.id, e.target.value)}
                  className={`text-xs font-semibold px-2 py-1.5 rounded-lg border-0 ${STATUT_COULEUR[commande.statut]}`}
                >
                  {STATUTS_COMMANDE.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}

      {ongletActif === 'parametres' && <ParametresAdmin />}

      {modalOuverte && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 relative">
            <button
              onClick={() => setModalOuverte(false)}
              className="absolute top-3 right-3 text-stone-400 hover:text-stone-600"
            >
              <X size={20} />
            </button>
            <h3 className="font-bold text-lg text-stone-800 mb-4">
              {platEnEdition ? 'Modifier le plat' : 'Ajouter un plat'}
            </h3>
            <form onSubmit={enregistrerPlat} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-stone-600 mb-1">Nom *</label>
                <input
                  required
                  type="text"
                  value={formPlat.nom}
                  onChange={(e) => setFormPlat({ ...formPlat, nom: e.target.value })}
                  className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-600 mb-1">
                  Description
                </label>
                <textarea
                  value={formPlat.description}
                  onChange={(e) => setFormPlat({ ...formPlat, description: e.target.value })}
                  rows={2}
                  className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium text-stone-600 mb-1">Type *</label><select required value={formPlat.type} onChange={(e) => setFormPlat({ ...formPlat, type: e.target.value })} className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm"><option value="lapin_frais">Lapin frais</option><option value="lapin_prepare">Lapin préparé</option><option value="plat">Plat de lapin</option></select></div>
                <div><label className="block text-sm font-medium text-stone-600 mb-1">Prix gros (FCFA)</label><input type="number" min="0" value={formPlat.prixGros} onChange={(e) => setFormPlat({ ...formPlat, prixGros: e.target.value })} className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm"/></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-stone-600 mb-1">
                    Prix (FCFA) *
                  </label>
                  <input
                    required
                    type="number"
                    min="0"
                    value={formPlat.prix}
                    onChange={(e) => setFormPlat({ ...formPlat, prix: e.target.value })}
                    className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-600 mb-1">
                    Stock initial
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formPlat.stock}
                    onChange={(e) => setFormPlat({ ...formPlat, stock: e.target.value })}
                    className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-600 mb-1">Statut</label>
                  <select
                    value={formPlat.statut}
                    onChange={(e) => setFormPlat({ ...formPlat, statut: e.target.value })}
                    className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="En stock">En stock</option>
                    <option value="Épuisé">Épuisé</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-600 mb-1">
                  URL de l'image
                </label>
                <input
                  type="text"
                  value={formPlat.image}
                  onChange={(e) => setFormPlat({ ...formPlat, image: e.target.value })}
                  placeholder="https://..."
                  className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <p className="text-xs text-stone-400">
                Le stock indiqué ici sert de point de départ ; utilisez ensuite l'onglet
                "Entrées / Sorties" pour l'ajuster (réapprovisionnement, pertes...).
              </p>
              <button
                type="submit"
                className="w-full bg-brand-600 text-white font-medium py-2 rounded-lg hover:bg-brand-700 transition"
              >
                {platEnEdition ? 'Enregistrer les modifications' : 'Ajouter le plat'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ParametresAdmin() {
  const [motDePasse, setMotDePasse] = useState(null);
  const [copie, setCopie] = useState(false);
  const [envoi, setEnvoi] = useState(false);

  async function genererNouveauMotDePasse() {
    if (
      !confirm(
        "Générer un nouveau mot de passe admin ? L'ancien ne fonctionnera plus."
      )
    )
      return;

    setEnvoi(true);
    try {
      const res = await fetch('/api/admin/mot-de-passe', { method: 'POST' });
      const data = await res.json();
      if (res.ok) setMotDePasse(data.motDePasse);
    } finally {
      setEnvoi(false);
    }
  }

  function copier() {
    navigator.clipboard.writeText(motDePasse);
    setCopie(true);
    setTimeout(() => setCopie(false), 2000);
  }

  return (
    <div className="max-w-md bg-white rounded-xl border border-stone-200 p-5">
      <h3 className="font-bold text-stone-800 flex items-center gap-2 mb-2">
        <KeyRound size={18} />
        Sécurité de l'accès admin
      </h3>
      <p className="text-sm text-stone-500 mb-4">
        Vous pouvez générer un nouveau mot de passe administrateur à tout moment.
        L'ancien mot de passe sera immédiatement invalidé.
      </p>

      {motDePasse ? (
        <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-lg px-3 py-3 mb-3">
          <span className="font-mono font-bold text-lg text-stone-800 tracking-wider flex-1">
            {motDePasse}
          </span>
          <button
            onClick={copier}
            className="p-1.5 rounded bg-white border border-stone-200 hover:bg-stone-100"
          >
            {copie ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
          </button>
        </div>
      ) : null}

      <button
        onClick={genererNouveauMotDePasse}
        disabled={envoi}
        className="bg-brand-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-brand-700 transition disabled:opacity-60"
      >
        {envoi ? 'Génération...' : 'Générer un nouveau mot de passe'}
      </button>
    </div>
  );
}
