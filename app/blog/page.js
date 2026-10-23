import Image from 'next/image';
import BlogList from '@/components/BlogList';
import { getArticles } from '@/lib/blog';

export const metadata = {
  title: 'Blog – Production vidéo : les conseils pour réussir vos projets',
  description: "Corporate, publicité, formation : découvrez nos conseils pour concevoir des vidéos d'entreprise qui transmettent le bon message.",
  alternates: { canonical: '/blog' },
};

export default function BlogPage() {
  const articles = getArticles().map(({ slug, title, category, readingTime, excerpt }) => ({ slug, title, category, readingTime, excerpt }));
  return (
    <>
      <section className="hero-photo" aria-labelledby="titre-blog" style={{ minHeight: 640, height: '84vh', maxHeight: 880 }}>
        <Image src="/media/hero-blog.jpg" alt="" fill priority sizes="100vw" className="bg" style={{ objectPosition: '75% 55%', '--mpos': '68% 60%' }} />
        <div className="fade-x" aria-hidden="true" />
        <div className="fade-y" aria-hidden="true" />
        <div className="container content">
          <div className="inner" style={{ maxWidth: 620 }}>
            <span className="rule rule-lg" aria-hidden="true" />
            <h1 id="titre-blog" className="h1" style={{ marginBottom: 22, textShadow: '0 2px 24px rgba(0,0,0,.5)' }}>Production vidéo : <span className="gold">les conseils pour réussir vos projets.</span></h1>
            <p className="lead" style={{ maxWidth: 580, marginBottom: 30 }}>Corporate, publicité, formation : découvrez nos conseils pour concevoir des vidéos d'entreprise qui transmettent le bon message.</p>
            <a className="btn btn-gold" href="#articles">Découvrir nos articles</a>
          </div>
        </div>
      </section>

      <section id="articles" aria-label="Articles" style={{ padding: 'clamp(24px, 3vw, 40px) 0 clamp(56px, 7vw, 98px)' }}>
        <div className="container">
          <BlogList articles={articles} />
        </div>
      </section>
    </>
  );
}
