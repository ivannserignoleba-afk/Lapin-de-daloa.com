import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const wa = (t) => 'https://wa.me/2250700000000?text=' + encodeURIComponent(t);
const plats = [
  ['Choukouya de Lapin', 'Lapin grillé aux épices maison, braisé au feu de bois.', '6 000', 'choukouya-lapin', 'Le préféré'],
  ['Lapin Braisé Spécial', 'Notre recette signature, tendre et généreuse à souhait.', '7 000', 'lapin-braise', 'Signature'],
  ['Civet de Lapin', 'Une sauce onctueuse et parfumée, mijotée tout doucement.', '6 500', 'civet-lapin', 'Nouveau'],
  ['Kédjenou de Lapin', 'La tradition ivoirienne revisitée avec notre lapin local.', '6 500', 'kedjenou-lapin', 'Tradition'],
];

export default function Home() {
  const [available, setAvailable] = useState(null);
  useEffect(() => { fetch('/api/public/stock').then((r) => r.json()).then((d) => setAvailable(d.available)).catch(() => {}); }, []);

  return (
    <>
      <header className="nav">
        <a href="#accueil" className="logo">🐇 O'LAPIN <i>225</i></a>
        <nav><a href="#vente">Lapin frais</a><a href="#menu">Plats</a><a href="#apropos">À propos</a><a href="#livraison">Livraison</a></nav>
        <Link to="/admin" className="ghost">Connexion admin</Link>
        <a className="btn" href={wa("Bonjour O'LAPIN 225, je souhaite passer une commande.")}>Commander</a>
      </header>

      <section id="accueil" className="hero">
        <div>
          <p className="tag">Abidjan, Côte d'Ivoire</p>
          <h1>Lapin frais en gros et au détail. Plats de lapin livrés chez vous.</h1>
          <p>Nous vendons du lapin frais et local aux particuliers, restaurateurs et revendeurs, et nous cuisinons nos propres plats.</p>
          <div className="row">
            <a className="btn" href="#vente">Acheter du lapin frais</a>
            <a className="btn alt" href="#menu">Voir les plats</a>
          </div>
        </div>
        <img src="/images/lapin-braise.png" alt="Plat de lapin braisé spécial" />
      </section>

      <section id="vente" className="sec">
        <h2>Lapin frais : gros et détail</h2>
        {available !== null && <p className="stock">{available} lapin{available > 1 ? 's' : ''} disponible{available > 1 ? 's' : ''} aujourd'hui</p>}
        <div className="grid two">
          <article className="card"><h3>Vente au détail</h3>
            <p>Un ou quelques lapins pour votre famille ou un événement. Préparés à la demande, prêts à cuisiner.</p>
            <a className="btn" href={wa('Bonjour, je souhaite acheter du lapin frais au détail.')}>Commander au détail</a></article>
          <article className="card"><h3>Vente en gros</h3>
            <p>Restaurants, maquis, traiteurs et revendeurs : approvisionnement régulier, prix dégressifs selon la quantité.</p>
            <a className="btn" href={wa('Bonjour, je souhaite un devis pour du lapin frais en gros.')}>Demander un devis gros</a></article>
        </div>
      </section>

      <section id="menu" className="sec">
        <h2>Nos plats de lapin</h2>
        <div className="grid four">
          {plats.map(([nom, desc, prix, img, badge]) => (
            <article className="card plat" key={nom}>
              <img src={`/images/${img}.png`} alt={nom} /><span className="badge">{badge}</span>
              <h3>{nom}</h3><p>{desc}</p><strong>{prix} FCFA</strong>
            </article>
          ))}
        </div>
      </section>

      <section id="apropos" className="sec narrow">
        <h2>Notre histoire</h2>
        <p>Chez O'LAPIN 225, nous mettons à l'honneur une viande tendre et savoureuse, élevée localement. Nous la vendons fraîche, en gros ou au détail, et nous la transformons en plats fidèles aux saveurs de notre terroir.</p>
        <p className="facts"><b>100 %</b> frais et local &nbsp; <b>30 min</b> livraison express</p>
      </section>

      <section id="livraison" className="sec cta">
        <h2>On vous livre le bonheur.</h2>
        <p>Commandez en quelques secondes sur WhatsApp. Cocody, Marcory, Plateau et alentours. Livraison de 11h à 22h.</p>
        <a className="btn alt" href={wa("Bonjour O'LAPIN 225, je souhaite passer une commande.")}>Commander sur WhatsApp</a>
      </section>
      <footer>© 2025 O'LAPIN 225 — Fait avec amour à Abidjan.</footer>
    </>
  );
}
