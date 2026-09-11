import { NextResponse } from 'next/server';
import { readData, writeData, generateId } from '../../../lib/db';
import { requeteAuthentifiee } from '../../../lib/auth';

const FILE = 'commandes.json';

// GET /api/commandes - liste toutes les commandes (réservé à l'admin : contient
// des données personnelles clients - nom, téléphone, adresse)
export async function GET(request) {
  if (!requeteAuthentifiee(request)) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  }

  const commandes = readData(FILE);
  const triees = [...commandes].sort(
    (a, b) => new Date(b.dateCreation) - new Date(a.dateCreation)
  );
  return NextResponse.json(triees);
}

// POST /api/commandes - crée une nouvelle commande
export async function POST(request) {
  const body = await request.json();
  const { client, articles, modePaiement } = body;

  if (!client?.nom || !client?.telephone || !articles?.length) {
    return NextResponse.json(
      { error: 'Nom, téléphone et au moins un article sont obligatoires.' },
      { status: 400 }
    );
  }

  const total = articles.reduce(
    (sum, item) => sum + item.prix * item.quantite,
    0
  );

  const commandes = readData(FILE);
  const nouvelleCommande = {
    id: generateId(),
    client: {
      nom: client.nom,
      telephone: client.telephone,
      adresse: client.adresse || '',
    },
    articles,
    modePaiement: modePaiement || 'Espèces à la livraison',
    total,
    statut: 'En attente',
    dateCreation: new Date().toISOString(),
    stockDeduit: false,
  };

  commandes.push(nouvelleCommande);
  writeData(FILE, commandes);

  return NextResponse.json(nouvelleCommande, { status: 201 });
}
