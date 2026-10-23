# VATEA – site vitrine (Next.js)

Version présentable de la maquette : 7 pages, 12 articles de blog, formulaire de devis, menu mobile.
Textes du copywriter repris mot pour mot. Les emplacements rayés attendent les vraies photos et vidéos.

## Mettre en ligne sur Vercel (10 minutes)

1. Créer un dépôt **privé** sur GitHub (par ex. `vatea-site`).
2. Décompresser ce zip, puis dans le dossier :
   ```sh
   git init
   git add .
   git commit -m "Site VATEA – première version"
   git branch -M main
   git remote add origin https://github.com/<ton-compte>/vatea-site.git
   git push -u origin main
   ```
   (Ou glisser les fichiers dans GitHub via « Add file > Upload files ».)
3. Sur vercel.com : **Add New… > Project**, importer le dépôt, laisser les réglages par défaut (Next.js détecté), cliquer **Deploy**.
4. Le site est en ligne sur une adresse `https://vatea-site-xxxx.vercel.app`. Chaque `git push` le met à jour automatiquement.

Le référencement Google est **bloqué** tant que c'est une maquette (`app/robots.js`, `INDEXATION = false`).
Le jour de la mise en ligne officielle sur www.vatea.be : passer `INDEXATION` à `true` et brancher le domaine dans Vercel > Settings > Domains.

## Travailler en local

```sh
npm install
npm run dev      # http://localhost:3000
npm run build    # vérifie que tout compile
```
Node.js 18.18 ou plus récent.

## Où modifier quoi

| Élément | Fichier |
| --- | --- |
| Coordonnées (e-mail, téléphone, adresse, réseaux) | `lib/site.js` |
| Menu | `lib/site.js` (`NAV`) |
| Couleurs, tailles, espacements | `app/globals.css` (variables en haut du fichier) |
| Accueil (dont la FAQ) | `app/page.js` |
| À propos | `app/a-propos/page.js` |
| Pages Corporate / Publicitaire / Formation | `app/video-*/page.js` (gabarit commun : `components/ServicePage.js`) |
| Portfolio | `app/portfolio/page.js` |
| Articles du blog | `content/blog.md` (même format que le document du copywriter) ; thèmes dans `lib/blog.js` |
| Formulaire de devis | `components/DevisForm.js` (écran), `app/api/devis/route.js` (traitement) |
| Pages légales | `app/mentions-legales`, `app/politique-de-confidentialite`, `app/cookies` |

## Médias (`public/media/`)

| Fichier | Usage | À remplacer par |
| --- | --- | --- |
| `demo-provisoire.mp4` | Vidéo en boucle de l'accueil | Bande démo VATEA (MP4, 15–30 s, sans son, < 10 Mo idéalement) — même nom de fichier |
| `hero-portfolio.jpg`, `hero-blog.jpg` | Hauts de pages Portfolio et Blog | — |
| `fond-formulaire.jpg` | Fond du formulaire | — |
| `logo-va.png` | Logo (menu, pied de page, icône d'onglet) | Version SVG si disponible |

Pour remplacer un emplacement rayé par une vraie image : remplacer le composant `<Placeholder … />` correspondant
par `<Image src="/media/ma-photo.jpg" alt="description" width={…} height={…} />` (import `next/image`).

## Formulaire de devis

- Validation côté navigateur et côté serveur, champ piège anti-spam.
- Sans configuration : chaque demande est enregistrée dans les **logs Vercel** (Project > Logs, recherche `[devis]`).
- Pour créer automatiquement un **prospect dans Dolibarr** : ajouter dans Vercel > Settings > Environment Variables
  `DOLIBARR_URL` (ex. `https://crm.vatea.be`) et `DOLIBARR_API_KEY` (clé d'un compte de service limité à la création de tiers), puis redéployer.
- **Reste à faire** : notification e-mail à Hugo et accusé de réception au prospect (choisir un service d'envoi, ex. Resend ou Brevo).

## Reste à compléter avant la mise en ligne officielle

- Coordonnées réelles, liens Instagram / LinkedIn.
- Photos, vidéos de démonstration et logos clients.
- Texte de consentement RGPD et message de confirmation du formulaire.
- Contenu des pages légales (validation juridique belge).
- Erreur de mise en forme dans la conclusion de l'article 5 (astérisques) à corriger dans `content/blog.md`.
