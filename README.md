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
| `demo-poster.jpg` | Image affichée le temps que la vidéo démarre | Première image de la nouvelle vidéo (même nom) |
| `hero-portfolio.jpg`, `hero-blog.jpg` | Hauts de pages Portfolio et Blog | — |
| `fond-formulaire.jpg` | Fond du formulaire | — |
| `logo-va.png` | Logo (menu, pied de page, icône d'onglet) | Version SVG si disponible |

Pour remplacer un emplacement rayé par une vraie image : remplacer le composant `<Placeholder … />` correspondant
par `<Image src="/media/ma-photo.jpg" alt="description" width={…} height={…} />` (import `next/image`).


## Vidéo de présentation (accueil)

Sous la vidéo en boucle, un grand lecteur attend la vidéo de présentation de l'entreprise (plusieurs minutes).
Renseigner **une** source dans `lib/site.js` > `VIDEO_PRESENTATION` :

- `youtubeId` ou `vimeoId` (**recommandé** : mettre la vidéo en « non répertorié », puis copier son identifiant) ;
  seule une image est chargée, le lecteur n'arrive qu'au clic (rapide et sans cookies avant lecture) ;
- ou `mp4` (fichier dans `public/media/`, déconseillé au-delà de 50 Mo) avec `couverture` pour l'image d'attente.

Le titre « Découvrez VATEA en vidéo » est provisoire : à valider par JEGO.

## Démo du CRM (`/demo-crm`)

Démonstration autonome (version 3, décisions de la réunion du 24/10), données fictives enregistrées dans le navigateur du
visiteur (bouton « Réinitialiser »). Fichiers : `public/demo-crm/` (index.html, demo.js, demo.css, polices). Non indexée.

- **Comptes** : Hugo et Jeff (Gérant, même accès : saisie et pipeline), Marc (Consultation), Administrateur (comptes).
- **Commission = 16 % du HT signé (JEGO) et 9 % du HT signé (EI BRETZNER MARC)**, acquise dès la signature : la coopérative
  verse l'argent à Hugo à la signature. Une ligne par devis signé, par avenant signé, et une ligne négative par annulation.
- **Paiement des commissions** : « À payer » / « Payée le … » ; **chaque bénéficiaire confirme lui-même** qu'il a été payé
  (Jeff pour JEGO, Marc pour la sienne), la ligne est alors figée. Preuve de signature obligatoire pour confirmer.
- **Paiements clients** : simple suivi pour Hugo (facturé par la coopérative / « Le client a payé »), sans effet sur les commissions.
- **Fiche client** : bouton « Envoyer un e-mail » (messagerie ouverte, adresse remplie) et « Appeler » ; onglet **Documents**
  (ajout depuis l'ordinateur, glisser-déposer, téléchargement) ; modifications tracées avec ancienne et nouvelle valeur.
- **Pas de retour en arrière** dans le pipeline (perdu réactivable à son étape d'avant ; correction réservée à l'admin, tracée).
- Calendrier des champs date visible sur tous les navigateurs ; « 📧 Simuler la campagne » (Nouveau → Contacté automatique).

## Images

Les photos de fond sont importées dans le code (`import … from '@/public/media/…'`) : un aperçu flou s'affiche
instantanément, puis Vercel sert une version WebP adaptée à l'écran. Le tout premier affichage après une mise en ligne
prend un peu plus de temps (Vercel prépare les versions), ensuite elles sont en cache 31 jours.

## Formulaire de devis

- Validation côté navigateur et côté serveur, champ piège anti-spam.
- Sans configuration : chaque demande est enregistrée dans les **logs Vercel** (Project > Logs, recherche `[devis]`).
- Pour envoyer automatiquement chaque demande dans le **CRM VATEA** (colonne « Nouveau », source « Formulaire du site ») :
  ajouter dans Vercel > Settings > Environment Variables `CRM_URL` (`https://crm.vatea.be`) et `CRM_LEADS_KEY`
  (la même valeur que `LEADS_API_KEY` dans le projet CRM), puis redéployer.
- **Reste à faire** : notification e-mail à Hugo et accusé de réception au prospect (choisir un service d'envoi, ex. Resend ou Brevo).

## Reste à compléter avant la mise en ligne officielle

- Coordonnées réelles, liens Instagram / LinkedIn.
- Photos, vidéos de démonstration et logos clients.
- Texte de consentement RGPD et message de confirmation du formulaire.
- Contenu des pages légales (validation juridique belge).
- Erreur de mise en forme dans la conclusion de l'article 5 (astérisques) à corriger dans `content/blog.md`.
