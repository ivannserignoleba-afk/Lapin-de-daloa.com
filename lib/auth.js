import crypto from 'crypto';
import { readData, writeData } from './db';

const FICHIER = 'admin.json';
const DUREE_SESSION_MS = 8 * 60 * 60 * 1000; // 8 heures

/**
 * NOTE DE SÉCURITÉ :
 * Cette implémentation est volontairement simple (fichier JSON, hachage PBKDF2,
 * jeton de session signé par HMAC) pour rester légère et fonctionner sans
 * base de données ni service d'authentification externe. Elle convient à un
 * usage mono-administrateur (un seul vendeur). Pour un usage professionnel
 * avec plusieurs comptes, rôles, ou une exigence de sécurité plus forte,
 * remplacez ceci par NextAuth.js ou un fournisseur d'authentification dédié.
 *
 * Le mot de passe généré n'est JAMAIS stocké en clair une fois confirmé par
 * l'administrateur : seul son hash (PBKDF2 + sel) est conservé. Avant la
 * confirmation ("j'ai noté mon mot de passe"), il est gardé temporairement en
 * clair afin de pouvoir le réafficher si la page est rechargée par erreur.
 */

function lireConfig() {
  try {
    return readData(FICHIER);
  } catch {
    return null;
  }
}

function genererMotDePasse(longueur = 12) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const octets = crypto.randomBytes(longueur);
  let mdp = '';
  for (let i = 0; i < longueur; i++) {
    mdp += alphabet[octets[i] % alphabet.length];
  }
  return mdp;
}

function hacher(valeur, sel) {
  return crypto.pbkdf2Sync(valeur, sel, 100000, 32, 'sha256').toString('hex');
}

function creerNouvelleConfig() {
  const motDePasse = genererMotDePasse();
  const sel = crypto.randomBytes(16).toString('hex');
  const config = {
    passwordHash: hacher(motDePasse, sel),
    sel,
    secret: crypto.randomBytes(32).toString('hex'),
    cree: new Date().toISOString(),
    affiche: false,
    motDePasseTemporaire: motDePasse,
  };
  writeData(FICHIER, config);
  return config;
}

// Appelé au chargement de l'écran /admin : crée le mot de passe s'il n'existe
// pas encore, ou renvoie le mot de passe en attente de confirmation.
export function obtenirEtatInitial() {
  let config = lireConfig();
  if (!config) {
    config = creerNouvelleConfig();
  }
  return {
    dejaConfirme: config.affiche === true,
    motDePasse: config.affiche ? null : config.motDePasseTemporaire || null,
  };
}

// L'administrateur clique sur "j'ai noté mon mot de passe" : on efface la
// version en clair et on verrouille la configuration.
export function confirmerMotDePasseNote() {
  const config = lireConfig();
  if (!config) return false;
  delete config.motDePasseTemporaire;
  config.affiche = true;
  writeData(FICHIER, config);
  return true;
}

// Autorisé uniquement tant que le mot de passe initial n'a jamais été confirmé
// (ex: l'administrateur a fermé la page avant de le noter).
export function regenererAvantConfirmation() {
  const config = lireConfig();
  if (config && config.affiche) {
    return { erreur: 'Mot de passe déjà confirmé. Utilisez le changement de mot de passe dans les Paramètres.' };
  }
  const nouvelleConfig = creerNouvelleConfig();
  return { motDePasse: nouvelleConfig.motDePasseTemporaire };
}

// Changement de mot de passe depuis l'espace admin (session déjà valide).
export function changerMotDePasse() {
  const config = lireConfig();
  if (!config) return null;
  const motDePasse = genererMotDePasse();
  const sel = crypto.randomBytes(16).toString('hex');
  config.passwordHash = hacher(motDePasse, sel);
  config.sel = sel;
  delete config.motDePasseTemporaire;
  config.affiche = true;
  writeData(FICHIER, config);
  return motDePasse;
}

export function verifierMotDePasse(motDePasseSaisi) {
  const config = lireConfig();
  if (!config || !motDePasseSaisi) return false;
  return hacher(motDePasseSaisi, config.sel) === config.passwordHash;
}

export function creerJetonSession() {
  const config = lireConfig();
  if (!config) return null;
  const payload = JSON.stringify({ exp: Date.now() + DUREE_SESSION_MS });
  const payloadB64 = Buffer.from(payload).toString('base64url');
  const signature = crypto
    .createHmac('sha256', config.secret)
    .update(payloadB64)
    .digest('base64url');
  return `${payloadB64}.${signature}`;
}

export function jetonValide(jeton) {
  if (!jeton) return false;
  const config = lireConfig();
  if (!config) return false;

  const [payloadB64, signature] = jeton.split('.');
  if (!payloadB64 || !signature) return false;

  const signatureAttendue = crypto
    .createHmac('sha256', config.secret)
    .update(payloadB64)
    .digest('base64url');

  if (signature !== signatureAttendue) return false;

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8'));
    return payload.exp > Date.now();
  } catch {
    return false;
  }
}

// Utilitaire pour protéger une route API : lit le cookie de session de la
// requête entrante et vérifie sa validité.
export function requeteAuthentifiee(request) {
  const jeton = request.cookies.get('admin_session')?.value;
  return jetonValide(jeton);
}

export const NOM_COOKIE = 'admin_session';
export const DUREE_COOKIE_SECONDES = DUREE_SESSION_MS / 1000;
