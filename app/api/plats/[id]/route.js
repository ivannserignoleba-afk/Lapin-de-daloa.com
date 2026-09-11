import { NextResponse } from 'next/server';
import { readData, writeData } from '../../../../lib/db';
import { requeteAuthentifiee } from '../../../../lib/auth';

const FILE = 'plats.json';

// PUT /api/plats/:id - modifie un plat (y compris changer le statut) - réservé à l'admin
export async function PUT(request, { params }) {
  if (!requeteAuthentifiee(request)) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  }

  const { id } = params;
  const body = await request.json();

  const plats = readData(FILE);
  const index = plats.findIndex((p) => p.id === id);

  if (index === -1) {
    return NextResponse.json({ error: 'Plat introuvable.' }, { status: 404 });
  }

  plats[index] = {
    ...plats[index],
    ...body,
    id, // on empêche l'écrasement de l'id
    prix: body.prix !== undefined ? Number(body.prix) : plats[index].prix,
  };

  writeData(FILE, plats);
  return NextResponse.json(plats[index]);
}

// DELETE /api/plats/:id - supprime un plat - réservé à l'admin
export async function DELETE(request, { params }) {
  if (!requeteAuthentifiee(request)) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  }

  const { id } = params;
  const plats = readData(FILE);
  const nouveauxPlats = plats.filter((p) => p.id !== id);

  if (nouveauxPlats.length === plats.length) {
    return NextResponse.json({ error: 'Plat introuvable.' }, { status: 404 });
  }

  writeData(FILE, nouveauxPlats);
  return NextResponse.json({ success: true });
}
