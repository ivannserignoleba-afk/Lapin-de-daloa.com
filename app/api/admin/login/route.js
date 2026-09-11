import { NextResponse } from 'next/server';
import {
  verifierMotDePasse,
  creerJetonSession,
  NOM_COOKIE,
  DUREE_COOKIE_SECONDES,
} from '../../../../lib/auth';

export async function POST(request) {
  const { motDePasse } = await request.json();

  if (!verifierMotDePasse(motDePasse)) {
    return NextResponse.json({ error: 'Mot de passe incorrect.' }, { status: 401 });
  }

  const jeton = creerJetonSession();
  const reponse = NextResponse.json({ success: true });
  reponse.cookies.set(NOM_COOKIE, jeton, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: DUREE_COOKIE_SECONDES,
  });
  return reponse;
}
