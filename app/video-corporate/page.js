import ServicePage from '@/components/ServicePage';

export const metadata = {
  title: 'Vidéo corporate à Bruxelles',
  description: 'Film institutionnel, interview ou communication interne : une vidéo corporate sur mesure pour valoriser votre entreprise, vos équipes et votre savoir-faire.',
  alternates: { canonical: '/video-corporate' },
};

export default function Page() {
  return (
    <ServicePage
      id="corporate"
      h1a="Vidéo corporate à Bruxelles :"
      h1b="faites comprendre ce qui rend votre entreprise unique."
      intro="Film institutionnel, interview ou communication interne : je conçois votre vidéo corporate sur mesure pour valoriser votre entreprise, vos équipes et votre savoir-faire."
      photoLabel="Photo — tournage corporate"
      videoTitle="Découvrez notre savoir-faire en vidéo"
      videoLabel="Vidéo corporate à intégrer"
      videoCaption="Découvrez comment une production audiovisuelle professionnelle donne du poids à votre message."
      msgTitleA="Votre message mérite d'être compris,"
      msgTitleB="pas seulement regardé."
      before={[
        'Présenter votre entreprise, expliquer un projet stratégique ou donner la parole à vos collaborateurs : chaque film corporate doit répondre à un objectif précis.',
        "Je vous accompagne dans la conception de votre film d'entreprise, de l'écriture du scénario au montage final.",
      ]}
      difference="Je constitue une équipe de spécialistes adaptée à votre projet, plutôt que de vous imposer une production standard."
      after={[
        'Interviews professionnelles, vidéos institutionnelles ou communication interne : chaque réalisation est pensée pour votre public et vos supports de diffusion.',
        'Vous validez votre message avant le tournage et bénéficiez de plusieurs révisions avant la livraison.',
      ]}
      closing="Une vidéo corporate réussie ne montre pas seulement votre entreprise."
      closingGold="Elle fait comprendre ce qui la distingue."
      ctaFinal="Parlons de votre vidéo corporate"
    />
  );
}
