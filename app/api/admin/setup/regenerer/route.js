import { NextResponse } from 'next/server';
import { regenererAvantConfirmation } from '../../../../../lib/auth';

export async function POST() {
  const resultat = regenererAvantConfirmation();
  if (resultat.erreur) {
    return NextResponse.json({ error: resultat.erreur }, { status: 403 });
  }
  return NextResponse.json({ motDePasse: resultat.motDePasse });
}
