'use client';

import { useRef, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { Download } from 'lucide-react';

function formatFCFA(montant) {
  return new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA';
}

// Construit les 7 derniers jours (aujourd'hui inclus) et calcule le chiffre
// d'affaires (commandes non annulées) réalisé chaque jour.
function calculerCA7Jours(commandes) {
  const jours = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    jours.push(date);
  }

  return jours.map((date) => {
    const cle = date.toDateString();
    const total = commandes
      .filter((c) => c.statut !== 'Annulée' && new Date(c.dateCreation).toDateString() === cle)
      .reduce((sum, c) => sum + c.total, 0);

    return {
      label: date.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: '2-digit' }),
      total,
    };
  });
}

export default function GraphiqueVentes({ commandes }) {
  const zoneRef = useRef(null);
  const [export_, setExport] = useState(false);
  const donnees = calculerCA7Jours(commandes);
  const totalPeriode = donnees.reduce((sum, j) => sum + j.total, 0);

  async function telechargerEnPDF() {
    setExport(true);
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);

      const canvas = await html2canvas(zoneRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
      });
      const imageData = canvas.toDataURL('image/png');

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'pt',
        format: 'a4',
      });

      const largeurPage = pdf.internal.pageSize.getWidth();
      const hauteurPage = pdf.internal.pageSize.getHeight();
      const ratio = Math.min(
        (largeurPage - 60) / canvas.width,
        (hauteurPage - 100) / canvas.height
      );
      const largeurImage = canvas.width * ratio;
      const hauteurImage = canvas.height * ratio;

      pdf.setFontSize(16);
      pdf.text('Chez Lapin — Chiffre d\'affaires des 7 derniers jours', 30, 35);
      pdf.setFontSize(10);
      pdf.text(`Généré le ${new Date().toLocaleString('fr-FR')}`, 30, 52);
      pdf.addImage(
        imageData,
        'PNG',
        (largeurPage - largeurImage) / 2,
        70,
        largeurImage,
        hauteurImage
      );

      pdf.save(`rapport-ventes-${new Date().toISOString().slice(0, 10)}.pdf`);
    } finally {
      setExport(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-stone-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-stone-800">Chiffre d'affaires — 7 derniers jours</h3>
          <p className="text-sm text-stone-500">
            Total sur la période : <span className="font-semibold text-brand-700">{formatFCFA(totalPeriode)}</span>
          </p>
        </div>
        <button
          onClick={telechargerEnPDF}
          disabled={export_}
          className="flex items-center gap-2 text-sm font-medium bg-brand-600 text-white px-3 py-2 rounded-lg hover:bg-brand-700 transition disabled:opacity-60"
        >
          <Download size={16} />
          {export_ ? 'Génération...' : 'Télécharger en PDF'}
        </button>
      </div>

      <div ref={zoneRef} className="bg-white p-2">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={donnees}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="#78716c" />
            <YAxis
              tick={{ fontSize: 12 }}
              stroke="#78716c"
              tickFormatter={(v) => new Intl.NumberFormat('fr-FR', { notation: 'compact' }).format(v)}
            />
            <Tooltip formatter={(value) => formatFCFA(value)} />
            <Bar dataKey="total" name="Chiffre d'affaires" fill="#d9611f" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
