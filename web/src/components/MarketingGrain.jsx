import React from 'react';

function MarketingGrain() {
  return (
    <svg className="lp-grain" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <filter id="lp-grain-f"><feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="4" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>
      <rect width="100%" height="100%" filter="url(#lp-grain-f)"/>
    </svg>
  );
}

export default MarketingGrain;
