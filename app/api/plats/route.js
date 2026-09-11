import { NextResponse } from 'next/server';
import { readData, writeData, generateId } from '../../../lib/db';

const FILE = 'plats.json';

// GET /api/plats - liste tous les plats
export async function GET() {
  const plats = readData(FILE);
  return NextResponse.json(plats);
}

// POST /api/plats - ajoute un nouveau plat
export async function POST(request) {
  const body = await request.json();
  const { nom, description, prix, statut, image } = body;

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
  };

  plats.push(nouveauPlat);
  writeData(FILE, plats);

  return NextResponse.json(nouveauPlat, { status: 201 });
}
