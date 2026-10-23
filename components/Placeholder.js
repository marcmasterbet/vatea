import { IconPhoto, IconPlay } from './Icons';

/** Emplacement provisoire pour une photo ou une vidéo à fournir. */
export default function Placeholder({ label, video = false, ratio = '4 / 3', framed = false, small = false, style }) {
  return (
    <div className={`ph${framed ? ' ph-framed' : ''}`} role="img" aria-label={`Emplacement ${video ? 'vidéo' : 'photo'} — ${label}`} style={{ aspectRatio: ratio, ...style }}>
      {video ? (
        <span className={small ? 'mini-play' : 'play'} aria-hidden="true"><IconPlay size={small ? 22 : 28} /></span>
      ) : (
        <IconPhoto />
      )}
      <span className="ph-label">{label}</span>
    </div>
  );
}
