/**
 * Serveur Carnet d'Atelier — backend indépendant de Claude.
 *
 * Ce serveur fait deux choses :
 * 1. Sert l'application (public/index.html) à qui se connecte.
 * 2. Expose une petite API de stockage clé/valeur (identique dans l'esprit à
 *    ce qu'utilisait la version Claude) sauvegardée dans un fichier data.json
 *    sur le disque du serveur — c'est votre vraie base de données.
 *
 * Toutes les routes /api/storage/* exigent d'être connecté (mot de passe).
 *
 * Installation :
 *   npm install
 *   cp .env.example .env    puis modifiez APP_PASSWORD et SESSION_SECRET
 *   npm start
 */

const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs');

const app = express();
app.set('trust proxy', 1); // nécessaire derrière la plupart des hébergeurs (Render, Railway...)
app.use(express.json({ limit: '15mb' })); // les signatures sont des images encodées, prévoir de la marge

const DB_FILE = path.join(__dirname, 'data.json');

let db = {};
try {
  db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
} catch (e) {
  db = {}; // premier démarrage : pas encore de fichier
}

function persist() {
  const tmp = DB_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(db));
  fs.renameSync(tmp, DB_FILE); // écriture atomique : évite un fichier corrompu en cas de coupure
}

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'changez-moi-absolument',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 30, // 30 jours
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    },
  })
);

function requireAuth(req, res, next) {
  if (req.session && req.session.authed) return next();
  res.status(401).json({ error: 'Non authentifié.' });
}

// --- Authentification ---
app.post('/api/login', (req, res) => {
  const { password } = req.body || {};
  if (!process.env.APP_PASSWORD) {
    return res.status(500).json({ error: "APP_PASSWORD n'est pas configuré sur le serveur." });
  }
  if (password && password === process.env.APP_PASSWORD) {
    req.session.authed = true;
    return res.json({ ok: true });
  }
  res.status(401).json({ error: 'Mot de passe incorrect.' });
});
app.post('/api/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});
app.get('/api/session', (req, res) => {
  res.json({ authed: !!(req.session && req.session.authed) });
});

// --- Stockage clé/valeur (remplace window.storage) ---
app.get('/api/storage/list', requireAuth, (req, res) => {
  const prefix = req.query.prefix || '';
  const keys = Object.keys(db).filter((k) => k.startsWith(prefix));
  res.json({ keys });
});
app.get('/api/storage/get', requireAuth, (req, res) => {
  const key = req.query.key;
  if (!key || !(key in db)) return res.status(404).json({ error: 'Introuvable.' });
  res.json({ key, value: db[key] });
});
app.post('/api/storage/set', requireAuth, (req, res) => {
  const { key, value } = req.body || {};
  if (!key) return res.status(400).json({ error: 'Paramètre "key" manquant.' });
  db[key] = value;
  persist();
  res.json({ key, value });
});
app.delete('/api/storage/delete', requireAuth, (req, res) => {
  const key = req.query.key;
  delete db[key];
  persist();
  res.json({ key, deleted: true });
});

// --- Fichiers statiques (l'application elle-même) ---
app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Carnet d'Atelier démarré sur le port ${PORT}`));
