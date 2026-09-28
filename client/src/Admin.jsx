import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase, api } from './supabase.js';

const fcfa = (n) => `${(n || 0).toLocaleString('fr-FR')} FCFA`;

function Login() {
  const [f, setF] = useState({ email: '', password: '' });
  const [err, setErr] = useState('');
  const submit = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword(f);
    if (error) setErr('E-mail ou mot de passe incorrect.');
  };
  return (
    <form className="card login" onSubmit={submit}>
      <h2>Connexion admin</h2>
      <input placeholder="E-mail" type="email" required onChange={(e) => setF({ ...f, email: e.target.value })} />
      <input placeholder="Mot de passe" type="password" required onChange={(e) => setF({ ...f, password: e.target.value })} />
      {err && <p className="err">{err}</p>}
      <button className="btn">Se connecter</button>
      <Link to="/">Retour au site</Link>
    </form>
  );
}

function Stock() {
  const [tab, setTab] = useState('en_stock');
  const [rabbits, setRabbits] = useState([]);
  const [moves, setMoves] = useState([]);
  const [sum, setSum] = useState({});
  const [form, setForm] = useState({ tag: '', breed: '', sex: 'F', weight_kg: '' });
  const [sale, setSale] = useState(null);
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    try {
      const [r, m, s] = await Promise.all([api(`/rabbits?status=${tab === 'mouvements' ? 'en_stock' : tab}`), api('/movements'), api('/summary')]);
      setRabbits(r); setMoves(m); setSum(s); setErr('');
    } catch (e) { setErr(e.message); }
  }, [tab]);
  useEffect(() => { load(); }, [load]);

  const addRabbit = async (e) => {
    e.preventDefault();
    try { await api('/rabbits', { method: 'POST', body: { ...form, weight_kg: form.weight_kg || null } }); setForm({ ...form, tag: '', weight_kg: '' }); load(); }
    catch (e) { setErr(e.message); }
  };
  const sell = async (e) => {
    e.preventDefault();
    try { await api(`/rabbits/${sale.id}/sell`, { method: 'POST', body: { sale_type: sale.sale_type, price: Number(sale.price), buyer: sale.buyer } }); setSale(null); load(); }
    catch (e) { setErr(e.message); }
  };

  return (
    <main className="admin">
      <div className="bar"><h2>Gestion du stock</h2>
        <span><Link to="/">Site</Link> <button className="ghost" onClick={() => supabase.auth.signOut()}>Déconnexion</button></span></div>
      <div className="grid three">
        <div className="card"><small>En stock</small><b>{sum.en_stock ?? '-'}</b></div>
        <div className="card"><small>Vendus</small><b>{sum.vendus ?? '-'}</b></div>
        <div className="card"><small>Chiffre d'affaires</small><b>{fcfa(sum.chiffre_affaires)}</b></div>
      </div>
      {err && <p className="err">{err}</p>}

      <form className="card row" onSubmit={addRabbit}>
        <input placeholder="N° / étiquette (ex. L-041)" required value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })} />
        <input placeholder="Race" value={form.breed} onChange={(e) => setForm({ ...form, breed: e.target.value })} />
        <select value={form.sex} onChange={(e) => setForm({ ...form, sex: e.target.value })}><option value="F">Femelle</option><option value="M">Mâle</option></select>
        <input placeholder="Poids (kg)" type="number" step="0.01" value={form.weight_kg} onChange={(e) => setForm({ ...form, weight_kg: e.target.value })} />
        <button className="btn">Enregistrer l'entrée</button>
      </form>

      <div className="tabs">
        {[['en_stock', 'En stock'], ['vendu', 'Vendus'], ['mouvements', 'Entrées / sorties']].map(([k, l]) =>
          <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>)}
      </div>

      <div className="scroll">
        {tab !== 'mouvements' ? (
          <table><thead><tr><th>N°</th><th>Race</th><th>Sexe</th><th>Poids</th><th>Entrée</th>{tab === 'vendu' ? <><th>Sortie</th><th>Type</th><th>Prix</th><th>Client</th></> : <th></th>}</tr></thead>
            <tbody>{rabbits.map((r) => (
              <tr key={r.id}><td>{r.tag}</td><td>{r.breed}</td><td>{r.sex}</td><td>{r.weight_kg}</td><td>{r.entered_at}</td>
                {tab === 'vendu' ? <><td>{r.sold_at}</td><td>{r.sale_type}</td><td>{fcfa(r.sale_price)}</td><td>{r.buyer}</td></>
                  : <td><button className="btn small" onClick={() => setSale({ id: r.id, tag: r.tag, sale_type: 'detail', price: '', buyer: '' })}>Vendre</button></td>}
              </tr>))}</tbody></table>
        ) : (
          <table><thead><tr><th>Date</th><th>N°</th><th>Mouvement</th><th>Vente</th><th>Prix</th><th>Note</th></tr></thead>
            <tbody>{moves.map((m) => (
              <tr key={m.id}><td>{new Date(m.created_at).toLocaleString('fr-FR')}</td><td>{m.tag}</td><td>{m.type === 'entree' ? 'Entrée' : 'Sortie'}</td><td>{m.sale_type}</td><td>{m.price ? fcfa(m.price) : ''}</td><td>{m.note}</td></tr>))}</tbody></table>
        )}
      </div>

      {sale && (
        <form className="card modal" onSubmit={sell}>
          <h3>Vendre le lapin {sale.tag}</h3>
          <select value={sale.sale_type} onChange={(e) => setSale({ ...sale, sale_type: e.target.value })}><option value="detail">Détail</option><option value="gros">Gros</option></select>
          <input placeholder="Prix (FCFA)" type="number" required value={sale.price} onChange={(e) => setSale({ ...sale, price: e.target.value })} />
          <input placeholder="Client (facultatif)" value={sale.buyer} onChange={(e) => setSale({ ...sale, buyer: e.target.value })} />
          <div className="row"><button className="btn">Confirmer la sortie</button><button type="button" className="ghost" onClick={() => setSale(null)}>Annuler</button></div>
        </form>
      )}
    </main>
  );
}

export default function Admin() {
  const [session, setSession] = useState(undefined);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);
  if (session === undefined) return null;
  return session ? <Stock /> : <Login />;
}
