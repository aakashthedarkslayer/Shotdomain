'use client';

import { useState } from 'react';

/** The agency's logo on share pages; hides itself if the image can't load (a broken link shouldn't show a broken icon to their client). */
export function BrandLogo({ src }: { src: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" referrerPolicy="no-referrer" onError={() => setFailed(true)} className="h-8 w-8 shrink-0 rounded-md object-contain" />;
}
