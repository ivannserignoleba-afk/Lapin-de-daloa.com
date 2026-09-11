import { NextResponse } from 'next/server';
import { confirmerMotDePasseNote } from '../../../../../lib/auth';

export async function POST() {
  const ok = confirmerMotDePasseNote();
  if (!ok) {
    return NextResponse.json({ error: 'Aucune configuration trouvée.' }, { status: 400 });
  }
  return NextResponse.json({ success: true });
}
