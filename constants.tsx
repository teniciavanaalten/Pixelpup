
import React from 'react';

const DogSVG = ({ eyes = "● ●", mouth = "◡", extra = null, opacity = 1 }: { eyes?: string, mouth?: string, extra?: React.ReactNode, opacity?: number }) => (
  <svg width="120" height="120" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ imageRendering: 'pixelated', opacity }}>
    <rect x="3" y="4" width="4" height="6" fill="#8B4513" />
    <rect x="17" y="4" width="4" height="6" fill="#8B4513" />
    <rect x="5" y="6" width="14" height="12" fill="#D2B48C" />
    <rect x="7" y="14" width="10" height="6" fill="#F5DEB3" />
    <rect x="11" y="15" width="2" height="1.5" fill="#333" />
    <text x="12" y="12" fontSize="4" fontWeight="bold" fill="#333" textAnchor="middle" style={{ fontFamily: 'monospace' }}>{eyes}</text>
    <text x="12" y="18.5" fontSize="4" fontWeight="bold" fill="#333" textAnchor="middle" style={{ fontFamily: 'monospace' }}>{mouth}</text>
    {extra}
  </svg>
);

export const INITIAL_STATS = {
  hunger: 100,
  energy: 100,
  happiness: 100,
  hygiene: 100,
  health: 100,
  level: 1,
  xp: 0,
  is_dead: false,
  last_updated: new Date().toISOString()
};

export const XP_PER_ACTION = 10;
export const XP_FOR_NEXT_LEVEL = 100;

export const PetIcons: Record<string, React.ReactNode> = {
  happy: <DogSVG eyes="^ ^" mouth="◡" extra={<rect x="11" y="19" width="2" height="2" fill="#FFB6C1" opacity="0.8" />} />,
  sad: <DogSVG eyes="T T" mouth="◠" />,
  sleeping: <DogSVG eyes="- -" mouth="◡" />,
  angry: <DogSVG eyes="> <" mouth="⁛" />,
  hungry: <DogSVG eyes="● ●" mouth="👅" />,
  dirty: <DogSVG eyes="● ●" mouth="◡" extra={<circle cx="18" cy="18" r="2" fill="#556B2F" opacity="0.6" />} />,
  dead: (
    <div className="relative flex items-center justify-center">
      <div className="absolute -top-4 text-2xl">👻</div>
      <DogSVG eyes="x x" mouth="—" opacity={0.4} />
    </div>
  ),
};
