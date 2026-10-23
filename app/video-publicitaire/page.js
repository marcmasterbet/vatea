import ServicePage from '@/components/ServicePage';

export const metadata = {
  title: 'Vidéo publicitaire à Bruxelles',
  description: 'Film publicitaire sur mesure pour valoriser vos produits, vos services et marquer les esprits, à Bruxelles, en Belgique et dans le nord de la France.',
  alternates: { canonical: '/video-publicitaire' },
};

export default function Page() {
  return (
    <ServicePage
      id="pub"
      h1a="Vidéo publicitaire à Bruxelles :"
      h1b="captez l'attention. Donnez envie d'agir."
      intro="Votre marque mérite plus qu'une belle image. Je conçois votre film publicitaire sur mesure pour valoriser vos produits, vos services et marquer les esprits."
      photoLabel="Photo — tournage publicitaire"
      videoTitle="Découvrez notre savoir-faire publicitaire"
      videoLabel="Vidéo publicitaire à intégrer"
      videoCaption="Découvrez comment une réalisation audiovisuelle donne vie à une idée et révèle l'univers d'une marque."
      msgTitleA="Une publicité réussie ne se regarde pas."
      msgTitleB="Elle se retient."
      question="Votre public voit défiler des dizaines de messages. Pourquoi s'arrêterait-il sur le vôtre ?"
      before={[
        "Parce qu'une vidéo publicitaire efficace raconte une histoire, révèle un bénéfice et donne une raison de s'intéresser à votre marque.",
        'Film publicitaire, vidéo promotionnelle ou campagne pour les réseaux sociaux : je construis chaque production autour de votre objectif commercial.',
      ]}
      difference="Je réunis une équipe de spécialistes adaptée à votre projet : scénario, image, éclairage, son, montage et animation selon les besoins."
      after={[
        'Vous validez le scénario avant le tournage et bénéficiez de plusieurs révisions avant la livraison.',
        'Chaque format est pensé pour vos supports de diffusion : site internet, LinkedIn, réseaux sociaux ou télévision.',
      ]}
      closing="Votre marque a un message à transmettre."
      closingGold="Donnons-lui les images pour marquer les esprits."
      ctaFinal="Donnons vie à votre publicité"
    />
  );
}
