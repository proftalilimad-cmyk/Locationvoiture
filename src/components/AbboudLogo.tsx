import React from 'react';

interface AbboudLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'dark' | 'light';
}

export const AbboudLogo: React.FC<AbboudLogoProps> = ({
  className = '',
  size = 'md',
  variant = 'dark',
}) => {
  const dimensions =
    size === 'sm'
      ? 'h-9'
      : size === 'lg'
      ? 'h-16'
      : 'h-12';

  const textColor = variant === 'dark' ? '#FFFFFF' : '#0B192C';
  const goldColor = '#D4AF37';
  const subTextColor = variant === 'dark' ? '#E2E8F0' : '#334155';

  return (
    <div className={`inline-flex items-center select-none ${className}`}>
      <svg
        viewBox="0 0 310 92"
        className={`${dimensions} w-auto`}
        role="img"
        aria-label="Abboud Location — Location de voitures à Kénitra"
      >
        {/* Silhouette automobile élégante avec touche dorée */}
        <path
          d="M24,33 C62,25 94,10 144,9 C192,8 228,15 268,28 C277,30 284,32 288,35 C270,31 246,27 222,25 C186,15 144,14 108,19 C78,23 52,29 24,33 Z"
          fill="none"
          stroke={goldColor}
          strokeWidth="2.3"
          strokeLinecap="round"
        />
        <path
          d="M52,33 C98,27 176,25 262,33"
          stroke={textColor}
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.85"
        />

        {/* ABBOUD en lettres capitales italiques */}
        <text
          x="155"
          y="63"
          fill={textColor}
          fontFamily="'Plus Jakarta Sans', 'Inter', system-ui, sans-serif"
          fontSize="33"
          fontWeight="900"
          fontStyle="italic"
          letterSpacing="3"
          textAnchor="middle"
        >
          ABBOUD
        </text>

        {/* LOCATION · KÉNITRA avec filets dorés */}
        <line x1="28" y1="77" x2="68" y2="77" stroke={goldColor} strokeWidth="1.8" />
        <text
          x="155"
          y="81"
          fill={subTextColor}
          fontFamily="'Inter', system-ui, sans-serif"
          fontSize="9"
          fontWeight="700"
          letterSpacing="3.2"
          textAnchor="middle"
        >
          LOCATION · KÉNITRA
        </text>
        <line x1="242" y1="77" x2="282" y2="77" stroke={goldColor} strokeWidth="1.8" />
      </svg>
    </div>
  );
};
