'use client';

interface LogoProps {
  size?: number;
  className?: string;
}

export function Logo({ size = 40, className = '' }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer hexagon */}
      <path
        d="M50 5L90 27.5V72.5L50 95L10 72.5V27.5L50 5Z"
        stroke="url(#logoGradient)"
        strokeWidth="2"
        fill="none"
      />
      {/* Inner cube - 3D effect */}
      <path
        d="M50 25L75 40V65L50 80L25 65V40L50 25Z"
        fill="url(#logoGradient)"
        fillOpacity="0.1"
        stroke="url(#logoGradient)"
        strokeWidth="1.5"
      />
      {/* Center dot */}
      <circle cx="50" cy="52" r="4" fill="url(#logoGradient)" />
      {/* Connecting lines */}
      <line x1="50" y1="25" x2="50" y2="48" stroke="url(#logoGradient)" strokeWidth="1" strokeOpacity="0.5" />
      <line x1="25" y1="40" x2="46" y2="52" stroke="url(#logoGradient)" strokeWidth="1" strokeOpacity="0.5" />
      <line x1="75" y1="40" x2="54" y2="52" stroke="url(#logoGradient)" strokeWidth="1" strokeOpacity="0.5" />
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function LogoMinimal({ size = 28 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M50 10L85 30V70L50 90L15 70V30L50 10Z"
        stroke="url(#logoGradientMin)"
        strokeWidth="3"
        fill="none"
      />
      <path
        d="M50 30L70 42V66L50 78L30 66V42L50 30Z"
        fill="url(#logoGradientMin)"
        fillOpacity="0.15"
      />
      <defs>
        <linearGradient id="logoGradientMin" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
    </svg>
  );
}
