export const SITE_URL = 'https://www.vatea.be';

export const NAV = [
  { label: 'Accueil', href: '/' },
  { label: 'À propos', href: '/a-propos' },
  { label: 'Corporate', href: '/video-corporate' },
  { label: 'Publicité', href: '/video-publicitaire' },
  { label: 'Formation', href: '/video-formation' },
  { label: 'Portfolio', href: '/portfolio' },
  { label: 'Blog', href: '/blog' },
];

// Coordonnées reprises du site actuel vatea.be
export const CONTACT = {
  email: 'vatea.info@gmail.com',
  phone: '+32 492 40 60 61',
  phoneHref: '+32492406061',
  address: 'Beau-Site 1re Avenue 45, 1330 Rixensart',
  tva: 'BE0639.958.983',
  instagram: 'https://www.instagram.com/vatea_be/',
  linkedin: 'https://www.linkedin.com/in/hugo-elvira-producteur-video/',
};

export const CTA_DEVIS = 'Obtenir mon devis personnalisé';

/**
 * Vidéo de présentation de l'entreprise (accueil, sous la vidéo en boucle).
 * Renseigner UNE des trois sources. Tant qu'elles sont vides, un emplacement provisoire s'affiche.
 * Recommandé pour une vidéo de plusieurs minutes : YouTube ou Vimeo en « non répertorié »
 * (fichier lourd hors du site, lecture fluide, le lecteur ne se charge qu'au clic).
 */
export const VIDEO_PRESENTATION = {
  titre: 'Découvrez VATEA en vidéo', // provisoire : à valider par JEGO
  sousTitre: '', // ex. « 3 minutes pour comprendre notre façon de travailler »
  youtubeId: '', // ex. 'aBcD123xYz' (la partie après watch?v= dans l'adresse YouTube)
  vimeoId: '', // ex. '123456789'
  mp4: '', // ex. '/media/presentation.mp4' (déconseillé au-delà de 50 Mo)
  couverture: '', // image affichée avant la lecture, ex. '/media/presentation-couverture.jpg'
};
