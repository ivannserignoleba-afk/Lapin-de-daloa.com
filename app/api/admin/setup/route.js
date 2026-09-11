import { NextResponse } from 'next/server';
import { obtenirEtatInitial } from '../../../../lib/auth';

export async function GET() {
  const etat = obtenirEtatInitial();
  return NextResponse.json(etat);
}
