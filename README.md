# Carnet d'Atelier — version web indépendante

Ceci est la version autonome de Carnet d'Atelier : un vrai serveur, une vraie
base de données, accessible par une adresse à vous, sans dépendre de Claude.

## ⚠️ À lire avant de déployer : la persistance des données

Ce serveur stocke toutes vos données (clients, véhicules, réceptions...) dans
un fichier `data.json` **sur le disque du serveur**. C'est simple et
suffisant pour un garage indépendant, mais il y a un piège fréquent :

**Sur la plupart des hébergeurs gratuits (dont le plan gratuit de Render),
le disque est effacé à chaque redéploiement.** Si vous mettez à jour le code
un jour, vous perdrez toutes les données enregistrées entre-temps, sauf si
vous avez un **disque persistant**.

Options pour éviter ça :
- **Render** : ajoutez un "Persistent Disk" à votre service (quelques euros
  par mois, ce n'est plus le plan gratuit) et montez-le sur `/data`, puis
  changez `DB_FILE` dans `server.js` pour pointer vers `/data/data.json`.
- **Railway** ou **Fly.io** : proposent des volumes persistants inclus dès
  les premiers paliers payants, souvent plus simples à configurer.
- Sauvegardez régulièrement `data.json` (bouton de téléchargement à ajouter,
  ou copie manuelle via le tableau de bord de votre hébergeur).

Ne mettez pas ce serveur en production avec de vraies données clients sans
avoir réglé ce point.

## 1. Installer

```
npm install
```

## 2. Configurer

Définissez ces variables d'environnement (dans le tableau de bord de votre
hébergeur, ou dans un fichier `.env` si vous utilisez un outil comme `dotenv`
en local) :

```
APP_PASSWORD=le-mot-de-passe-de-votre-atelier
SESSION_SECRET=une-longue-chaine-aleatoire-et-secrete
NODE_ENV=production
```

`APP_PASSWORD` est le mot de passe que votre équipe utilisera pour se
connecter à l'application — choisissez-le solide et changez-le si quelqu'un
quitte l'équipe.

## 3. Lancer en local (pour tester)

```
npm start
```

Puis ouvrez http://localhost:3000 — vous devriez voir l'écran de connexion.

## 4. Déployer

Le principe est le même que pour le relais SIV qu'on a déjà déployé
ensemble : créez un dépôt GitHub avec ces fichiers, connectez-le à Render
(ou l'hébergeur de votre choix), réglez Build Command sur `npm install` et
Start Command sur `node server.js`, ajoutez les variables d'environnement
ci-dessus, et déployez.

## 5. Nom de domaine (optionnel)

Une fois déployé, votre app a une adresse du type
`https://carnet-atelier.onrender.com`. Si vous voulez une adresse à votre
nom (ex: `gestion.bkautos38.fr`), il faut :
1. Acheter un nom de domaine (OVH, Gandi, Namecheap...)
2. Dans les réglages DNS de ce domaine, ajouter un enregistrement CNAME
   pointant vers l'adresse fournie par votre hébergeur
3. Configurer ce domaine personnalisé dans les réglages de votre service
   sur Render (section "Custom Domain")

## 6. Utilisation quotidienne

Une fois déployé, donnez l'adresse et le mot de passe à votre équipe. Chacun
peut l'ouvrir sur son téléphone ou son PC, se connecter, et travaille sur la
même base de données en temps réel (l'app se resynchronise automatiquement
toutes les 15 secondes, comme avant).

## 7. Sécurité — points à connaître

- Un seul mot de passe partagé protège toute l'application : c'est simple
  mais ça ne distingue pas les utilisateurs. Si vous avez besoin de comptes
  individuels (ex. savoir qui a fait quoi), dites-le-moi, c'est une
  évolution possible.
- Le cookie de session dure 30 jours. Un appareil volé resterait connecté
  pendant cette période — pensez à vous déconnecter sur un appareil partagé
  si nécessaire (fonction à ajouter dans l'app si vous la voulez visible).
- HTTPS est automatiquement fourni par la plupart des hébergeurs (Render,
  Railway...) — ne déployez jamais ce genre d'app derrière du simple HTTP.
