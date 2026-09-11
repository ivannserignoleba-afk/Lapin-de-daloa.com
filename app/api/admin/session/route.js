import { NextResponse } from 'next/server';
import { requeteAuthentifiee } from '../../../../lib/auth';

export async function GET(request) {
  return NextResponse.json({ authentifie: requeteAuthentifiee(request) });
}
