import { NextResponse } from 'next/server';
import { readData, writeData, generateId } from '../../../lib/db';
import { requeteAuthentifiee } from '../../../lib/auth';

const FILE = 'plats.json';

// GET /api/plats - liste tous les plats (catalogue public)
export async function GET() {
  const plats = readData(FILE);
  return NextResponse.json(plats);
}

// POST /api/plats - ajoute un nouveau plat (réservé à l'administrateur)
export async function POST(request) {
  if (!requeteAuthentifiee(request)) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  }

  const body = await request.json();
  const { nom, description, prix, statut, image, stock } = body;

  if (!nom || prix === undefined) {
    return NextResponse.json(
      { error: 'Les champs "nom" et "prix" sont obligatoires.' },
      { status: 400 }
    );
  }

  const plats = readData(FILE);
  const nouveauPlat = {
    id: generateId(),
    nom,
    description: description || '',
    prix: Number(prix),
    statut: statut || 'En stock',
    image: image || 'https://picsum.photos/seed/lapin/600/400',
    stock: stock !== undefined ? Number(stock) : 0,
  };

  plats.push(nouveauPlat);
  writeData(FILE, plats);

  return NextResponse.json(nouveauPlat, { status: 201 });
}
