'use client';
import { useState } from 'react';
import Placeholder from './Placeholder';
import { IconPlay } from './Icons';
import { VIDEO_PRESENTATION as V } from '@/lib/site';

/**
 * Lecteur de la vidéo de présentation.
 * YouTube / Vimeo : seule une image est chargée ; le lecteur (et ses cookies) n'arrive qu'au clic.
 */
export default function VideoPresentation() {
  const [lecture, setLecture] = useState(false);
  const titre = V.titre || 'Vidéo de présentation';

  if (!V.youtubeId && !V.vimeoId && !V.mp4) {
    return <Placeholder label="Vidéo de présentation de l'entreprise (quelques minutes)" video ratio="16 / 9" />;
  }

  if (V.mp4) {
    return (
      <video className="video-pres" src={V.mp4} poster={V.couverture || undefined} controls preload="none" playsInline>
        Votre navigateur ne lit pas cette vidéo.
      </video>
    );
  }

  const src = V.youtubeId
    ? `https://www.youtube-nocookie.com/embed/${V.youtubeId}?autoplay=1&rel=0&modestbranding=1`
    : `https://player.vimeo.com/video/${V.vimeoId}?autoplay=1&dnt=1&title=0&byline=0`;
  const couverture = V.couverture || (V.youtubeId ? `https://i.ytimg.com/vi/${V.youtubeId}/maxresdefault.jpg` : '');

  if (lecture) {
    return (
      <div className="video-pres">
        <iframe src={src} title={titre} allow="autoplay; fullscreen; picture-in-picture; encrypted-media" allowFullScreen />
      </div>
    );
  }
  return (
    <button type="button" className="video-pres video-facade" onClick={() => setLecture(true)} aria-label={`Lire la vidéo : ${titre}`}>
      {couverture && <img src={couverture} alt="" loading="lazy" />}
      <span className="play" aria-hidden="true"><IconPlay size={34} /></span>
    </button>
  );
}
