'use client';

import { useState } from 'react';
import { IconChevron } from './Icons';

export default function Faq({ items }) {
  const [open, setOpen] = useState(0);
  return (
    <div className="faq-list">
      {items.map((it, i) => {
        const isOpen = open === i;
        return (
          <div className="faq-item" key={it.q}>
            <h3>
              <button className="faq-q" type="button" aria-expanded={isOpen} aria-controls={`faq-${i}`} onClick={() => setOpen(isOpen ? -1 : i)}>
                <span>{it.q}</span>
                <span className="chev" aria-hidden="true"><IconChevron /></span>
              </button>
            </h3>
            <div id={`faq-${i}`} hidden={!isOpen}>
              <p className="faq-a">{it.a}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
