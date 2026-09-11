import { NextResponse } from 'next/server';
import { readData, writeData } from '../../../../lib/db';

const FILE = 'commandes.json';
const STATUTS_VALIDES = ['En attente', 'En préparation', 'Livrée', 'Annulée'];

// PUT /api/commandes/:id - met à jour le statut d'une commande
export async function PUT(request, { params }) {
  const { id } = params;
  const body = await request.json();

  if (body.statut && !STATUTS_VALIDES.includes(body.statut)) {
    return NextResponse.json(
      { error: `Statut invalide. Valeurs possibles : ${STATUTS_VALIDES.join(', ')}` },
      { status: 400 }
    );
  }

  const commandes = readData(FILE);
  const index = commandes.findIndex((c) => c.id === id);

  if (index === -1) {
    return NextResponse.json({ error: 'Commande introuvable.' }, { status: 404 });
  }

  commandes[index] = { ...commandes[index], ...body, id };
  writeData(FILE, commandes);

  return NextResponse.json(commandes[index]);
}
