import { NextResponse } from 'next/server';
import { readData, writeData, generateId } from '../../../lib/db';
import { requeteAuthentifiee } from '../../../lib/auth';

const FILE_MOUVEMENTS = 'mouvements.json';
const FILE_PLATS = 'plats.json';
const TYPES_VALIDES = ['Entrée', 'Sortie'];

function lireMouvements() {
  try {
    return readData(FILE_MOUVEMENTS);
  } catch {
    return [];
  }
}

// GET /api/mouvements - historique des entrées/sorties de stock (plus récent d'abord)
export async function GET(request) {
  if (!requeteAuthentifiee(request)) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  }

  const mouvements = lireMouvements();
  const tries = [...mouvements].sort((a, b) => new Date(b.date) - new Date(a.date));
  return NextResponse.json(tries);
}

// POST /api/mouvements - enregistre une entrée (réapprovisionnement) ou une
// sortie manuelle (perte, ajustement) de stock pour un plat donné
export async function POST(request) {
  if (!requeteAuthentifiee(request)) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  }

  const body = await request.json();
  const { platId, type, quantite, motif } = body;

  if (!platId || !TYPES_VALIDES.includes(type) || !quantite || Number(quantite) <= 0) {
    return NextResponse.json(
      { error: 'platId, type ("Entrée" ou "Sortie") et une quantité positive sont obligatoires.' },
      { status: 400 }
    );
  }

  const plats = readData(FILE_PLATS);
  const index = plats.findIndex((p) => p.id === platId);
  if (index === -1) {
    return NextResponse.json({ error: 'Plat introuvable.' }, { status: 404 });
  }

  const stockActuel = plats[index].stock ?? 0;
  const quantiteNombre = Number(quantite);

  if (type === 'Sortie' && quantiteNombre > stockActuel) {
    return NextResponse.json(
      { error: `Stock insuffisant (disponible : ${stockActuel}).` },
      { status: 400 }
    );
  }

  plats[index].stock =
    type === 'Entrée' ? stockActuel + quantiteNombre : stockActuel - quantiteNombre;

  const mouvements = lireMouvements();
  const nouveauMouvement = {
    id: generateId(),
    platId,
    platNom: plats[index].nom,
    type,
    quantite: quantiteNombre,
    motif: motif || (type === 'Entrée' ? 'Réapprovisionnement' : 'Ajustement manuel'),
    date: new Date().toISOString(),
    automatique: false,
  };
  mouvements.push(nouveauMouvement);

  writeData(FILE_PLATS, plats);
  writeData(FILE_MOUVEMENTS, mouvements);

  return NextResponse.json(nouveauMouvement, { status: 201 });
}
