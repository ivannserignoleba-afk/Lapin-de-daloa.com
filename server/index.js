import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const admins = (process.env.ADMIN_EMAILS || '').split(',').map((e) => e.trim().toLowerCase());
const app = express();
app.use(cors(), express.json());

// Public : nombre de lapins disponibles
app.get('/api/public/stock', async (_req, res) => {
  const { count, error } = await db.from('rabbits').select('*', { count: 'exact', head: true }).eq('status', 'en_stock');
  if (error) return res.status(500).json({ error: error.message });
  res.json({ available: count });
});

// Admin : vérifie le token Supabase et l'e-mail autorisé
app.use('/api/admin', async (req, res, next) => {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const { data, error } = await db.auth.getUser(token);
  if (error || !data.user || !admins.includes(data.user.email.toLowerCase()))
    return res.status(401).json({ error: 'Accès refusé' });
  next();
});

const ok = (res) => ({ data, error }) => (error ? res.status(400).json({ error: error.message }) : res.json(data));

app.get('/api/admin/rabbits', (req, res) => {
  let q = db.from('rabbits').select('*').order('entered_at', { ascending: false });
  if (req.query.status) q = q.eq('status', req.query.status);
  q.then(ok(res));
});

// Entrée : un lapin arrive en stock
app.post('/api/admin/rabbits', async (req, res) => {
  const { tag, breed, sex, weight_kg } = req.body;
  const { data, error } = await db.from('rabbits').insert({ tag, breed, sex, weight_kg }).select().single();
  if (error) return res.status(400).json({ error: error.message });
  await db.from('stock_movements').insert({ rabbit_id: data.id, tag, type: 'entree' });
  res.json(data);
});

// Sortie : un lapin est vendu (gros ou détail)
app.post('/api/admin/rabbits/:id/sell', async (req, res) => {
  const { sale_type, price, buyer } = req.body;
  if (!['gros', 'detail'].includes(sale_type)) return res.status(400).json({ error: 'Type de vente invalide' });
  const { data, error } = await db.from('rabbits')
    .update({ status: 'vendu', sold_at: new Date().toISOString().slice(0, 10), sale_type, sale_price: price, buyer })
    .eq('id', req.params.id).eq('status', 'en_stock').select().single();
  if (error) return res.status(400).json({ error: 'Lapin introuvable ou déjà vendu' });
  await db.from('stock_movements').insert({ rabbit_id: data.id, tag: data.tag, type: 'sortie', sale_type, price, note: buyer });
  res.json(data);
});

app.get('/api/admin/movements', (_req, res) =>
  db.from('stock_movements').select('*').order('created_at', { ascending: false }).limit(200).then(ok(res)));

app.get('/api/admin/summary', async (_req, res) => {
  const { data, error } = await db.from('rabbits').select('status,sale_price');
  if (error) return res.status(500).json({ error: error.message });
  const sold = data.filter((r) => r.status === 'vendu');
  res.json({ en_stock: data.length - sold.length, vendus: sold.length, chiffre_affaires: sold.reduce((s, r) => s + (r.sale_price || 0), 0) });
});

app.listen(process.env.PORT || 3001, () => console.log("API O'LAPIN prête"));
