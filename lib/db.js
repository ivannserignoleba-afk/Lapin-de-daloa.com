import fs from 'fs';
import path from 'path';

/**
 * ATTENTION - IMPORTANT :
 * Sur Vercel, le système de fichiers du déploiement est en LECTURE SEULE,
 * sauf le dossier /tmp qui est accessible en écriture mais NON PERSISTANT
 * (il peut être réinitialisé à chaque nouvelle invocation / redéploiement,
 * et n'est pas partagé entre plusieurs instances serverless).
 *
 * Cette implémentation JSON convient parfaitement pour :
 *   - le développement local (les fichiers dans /data sont réellement modifiés)
 *   - une démo / un prototype sur Vercel
 *
 * Pour une utilisation en PRODUCTION réelle (données qui doivent survivre
 * aux redéploiements et être partagées entre toutes les requêtes), il est
 * fortement recommandé de migrer vers une base de données persistante :
 *   - Vercel Postgres / Neon / Supabase (SQL)
 *   - MongoDB Atlas (NoSQL)
 *   - Prisma + une des bases ci-dessus
 *
 * La fonction readData/writeData ci-dessous isole cette logique : il suffira
 * de remplacer leur contenu par des appels à votre BDD sans toucher aux routes API.
 */

const isVercel = !!process.env.VERCEL;
const dataDir = path.join(process.cwd(), 'data');
const tmpDir = '/tmp/lapin-data';

function ensureTmpDir() {
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }
}

function getFilePath(filename) {
  if (isVercel) {
    ensureTmpDir();
    const tmpFile = path.join(tmpDir, filename);
    if (!fs.existsSync(tmpFile)) {
      const source = path.join(dataDir, filename);
      fs.copyFileSync(source, tmpFile);
    }
    return tmpFile;
  }
  return path.join(dataDir, filename);
}

export function readData(filename) {
  const filePath = getFilePath(filename);
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
}

export function writeData(filename, data) {
  const filePath = getFilePath(filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
