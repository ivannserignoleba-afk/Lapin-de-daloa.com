import { NextResponse } from 'next/server';
import { readData, writeData, generateId } from '../../../../lib/db';
import { requeteAuthentifiee } from '../../../../lib/auth';

const FILE_COMMANDES = 'commandes.json';
const FILE_PLATS = 'plats.json';
const FILE_MOUVEMENTS = 'mouvements.json';
const STATUTS_VALIDES = ['En attente', 'En préparation', 'Livrée', 'Annulée'];

// Enregistre une sortie de stock pour chaque article d'une commande livrée.
// Ne descend jamais un stock en dessous de 0.
function deduireStockCommande(commande) {
  const plats = readData(FILE_PLATS);
  let mouvements = [];
  try {
    mouvements = readData(FILE_MOUVEMENTS);
  } catch {
    mouvements = [];
  }

  for (const article of commande.articles) {
    const index = plats.findIndex((p) => p.id === article.platId);
    if (index === -1) continue;

    const stockActuel = plats[index].stock ?? 0;
    const quantiteDeduite = Math.min(stockActuel, article.quantite);
    plats[index].stock = Math.max(0, stockActuel - article.quantite);

    mouvements.push({
      id: generateId(),
      platId: plats[index].id,
      platNom: plats[index].nom,
      type: 'Sortie',
      quantite: quantiteDeduite,
      motif: `Vente - commande #${commande.id.slice(-6)}`,
      date: new Date().toISOString(),
      automatique: true,
    });
  }

  writeData(FILE_PLATS, plats);
  writeData(FILE_MOUVEMENTS, mouvements);
}

// PUT /api/commandes/:id - met à jour le statut d'une commande (réservé à l'admin)
export async function PUT(request, { params }) {
  if (!requeteAuthentifiee(request)) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  }

  const { id } = params;
  const body = await request.json();

  if (body.statut && !STATUTS_VALIDES.includes(body.statut)) {
    return NextResponse.json(
      { error: `Statut invalide. Valeurs possibles : ${STATUTS_VALIDES.join(', ')}` },
      { status: 400 }
    );
  }

  const commandes = readData(FILE_COMMANDES);
  const index = commandes.findIndex((c) => c.id === id);

  if (index === -1) {
    return NextResponse.json({ error: 'Commande introuvable.' }, { status: 404 });
  }

  const commandeAvant = commandes[index];
  commandes[index] = { ...commandeAvant, ...body, id };

  // Déduction automatique du stock : uniquement au passage vers "Livrée",
  // et uniquement une seule fois par commande (contrôle des entrées/sorties).
  const passeALivree =
    body.statut === 'Livrée' && commandeAvant.statut !== 'Livrée' && !commandeAvant.stockDeduit;

  if (passeALivree) {
    deduireStockCommande(commandes[index]);
    commandes[index].stockDeduit = true;
  }

  writeData(FILE_COMMANDES, commandes);
  return NextResponse.json(commandes[index]);
}
