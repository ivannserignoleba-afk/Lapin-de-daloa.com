import { NextResponse } from 'next/server';
import { NOM_COOKIE } from '../../../../lib/auth';

export async function POST() {
  const reponse = NextResponse.json({ success: true });
  reponse.cookies.set(NOM_COOKIE, '', { path: '/', maxAge: 0 });
  return reponse;
}
