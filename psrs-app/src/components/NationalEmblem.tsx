import React from 'react';

interface NationalEmblemProps {
  size?: number;
  className?: string;
}

export const NationalEmblem: React.FC<NationalEmblemProps> = ({ size = 24, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="National Emblem of Kenya"
    >
      {/* Outer shield boundary */}
      <path
        d="M24 3L8 8V22C8 33.2 14.8 41.5 24 45C33.2 41.5 40 33.2 40 22V8L24 3Z"
        fill="#0A192F"
        stroke="#CBD5E1"
        strokeWidth="1.5"
      />
      {/* Black upper stripe */}
      <path
        d="M9.5 9.8L24 5.2L38.5 9.8V15H9.5V9.8Z"
        fill="#000000"
      />
      {/* Top white pin line */}
      <rect x="9.5" y="15" width="29" height="1.5" fill="#FFFFFF" />
      {/* Red middle stripe */}
      <path
        d="M9.5 16.5H38.5V26.5H9.5V16.5Z"
        fill="#B91C1C"
      />
      {/* Bottom white pin line */}
      <rect x="9.5" y="26.5" width="29" height="1.5" fill="#FFFFFF" />
      {/* Green lower field */}
      <path
        d="M9.5 28H38.5C38.2 34 32.5 40.5 24 43.5C15.5 40.5 9.8 34 9.5 28Z"
        fill="#006644"
      />
      {/* Center Masai shield silhouette & crossed spears */}
      <line x1="16" y1="12" x2="32" y2="34" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="32" y1="12" x2="16" y2="34" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
      <ellipse cx="24" cy="22" rx="4" ry="7" fill="#B91C1C" stroke="#FFFFFF" strokeWidth="1.2" />
      <circle cx="24" cy="22" r="1.5" fill="#FFFFFF" />
    </svg>
  );
};
