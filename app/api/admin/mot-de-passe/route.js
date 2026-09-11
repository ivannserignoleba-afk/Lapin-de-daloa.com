import { NextResponse } from 'next/server';
import { requeteAuthentifiee, changerMotDePasse } from '../../../../lib/auth';

export async function POST(request) {
  if (!requeteAuthentifiee(request)) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  }
  const motDePasse = changerMotDePasse();
  return NextResponse.json({ motDePasse });
}
