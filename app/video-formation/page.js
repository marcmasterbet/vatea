import ServicePage from '@/components/ServicePage';

export const metadata = {
  title: 'Vidéo de formation à Bruxelles',
  description: 'Transformez vos connaissances et vos méthodes en vidéos de formation sur mesure, claires et adaptées à vos collaborateurs.',
  alternates: { canonical: '/video-formation' },
};

export default function Page() {
  return (
    <ServicePage
      id="formation"
      h1a="Vidéo de formation à Bruxelles :"
      h1b="transmettez votre savoir-faire. Faites-le comprendre."
      intro="Transformez vos connaissances et vos méthodes en vidéos de formation sur mesure, claires et adaptées à vos collaborateurs."
      photoLabel="Photo — tournage de formation"
      videoTitle="Découvrez notre savoir-faire en vidéo"
      videoLabel="Vidéo de formation à intégrer"
      videoCaption="Une réalisation illustrant comment transformer un savoir-faire professionnel en contenu pédagogique accessible."
      msgTitleA="Une formation efficace ne se contente pas d'informer."
      msgTitleB="Elle aide à comprendre."
      question="Vos collaborateurs doivent maîtriser une procédure, apprendre un nouveau geste ou utiliser un outil ?"
      before={[
        'Une explication trop complexe peut laisser place aux incompréhensions. Une vidéo pédagogique bien conçue rend chaque étape plus claire et permet de revoir les démonstrations à son rythme.',
        'Tutoriels professionnels, modules e-learning ou formations internes : je conçois chaque production autour de vos objectifs pédagogiques.',
      ]}
      difference="Je constitue une équipe de spécialistes adaptée à votre projet, pour associer la précision de votre savoir-faire à une production audiovisuelle professionnelle."
      after={[
        "Je vous accompagne de l'écriture du scénario au montage final. Vous validez le contenu avant le tournage et bénéficiez de plusieurs révisions avant la livraison.",
      ]}
      closing="Votre expertise mérite d'être transmise"
      closingGold="avec autant de précision qu'elle est exercée."
      ctaFinal="Créons votre vidéo de formation"
    />
  );
}
