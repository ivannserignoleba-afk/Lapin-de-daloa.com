import './globals.css';
import Link from 'next/link';
import { Rabbit, LayoutDashboard, Store } from 'lucide-react';

export const metadata = {
  title: 'Chez Lapin — Vente de plats de lapin',
  description: 'Commandez vos plats de lapin préférés en ligne.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        <header className="bg-brand-700 text-white shadow-md">
          <nav className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg">
              <Rabbit size={26} />
              Chez Lapin
            </Link>
            <div className="flex items-center gap-4 text-sm">
              <Link href="/" className="flex items-center gap-1 hover:text-brand-100">
                <Store size={16} />
                Boutique
              </Link>
              <Link href="/admin" className="flex items-center gap-1 hover:text-brand-100">
                <LayoutDashboard size={16} />
                Administration
              </Link>
            </div>
          </nav>
        </header>
        <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
        <footer className="text-center text-xs text-stone-400 py-8">
          Chez Lapin — Gestionnaire de vente de plats de lapin
        </footer>
      </body>
    </html>
  );
}
