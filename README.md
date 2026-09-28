# O'LAPIN 225 — site + gestionnaire de stock
1. Supabase : exécuter `supabase/schema.sql` (SQL Editor), créer un utilisateur admin (Authentication > Users).
2. `cd server && cp .env.example .env` (remplir) puis `npm i && npm start`
3. `cd client && cp .env.example .env` (remplir) puis `npm i && npm run dev`
4. Copier les images du site actuel dans `client/public/images/` (lapin-braise.png, choukouya-lapin.png, civet-lapin.png, kedjenou-lapin.png).
Admin : /admin — accès limité aux e-mails listés dans ADMIN_EMAILS.
