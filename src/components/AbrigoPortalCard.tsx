import type { CSSProperties } from 'react';

const ABRIGO_URL = 'https://sgilpi.up.railway.app/login/';

type AbrigoPortalCardProps = {
  className?: string;
};

/** Cartão do ABRIGO no seletor de Sistemas Internos do CIAPI. */
export default function AbrigoPortalCard({ className = '' }: AbrigoPortalCardProps) {
  const cardStyle: CSSProperties = {
    boxSizing: 'border-box',
    width: '100%',
    minWidth: 0,
    minHeight: 240,
    padding: '26px 20px',
    background: '#ffffff',
    border: '1px solid #d8e6f5',
    borderRadius: 15,
    boxShadow: '0 10px 25px rgba(18, 47, 80, 0.08)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    textAlign: 'center',
    textDecoration: 'none',
    color: '#092f56',
  };

  return (
    <a
      href={ABRIGO_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      style={cardStyle}
      aria-label="Acessar sistema ABRIGO (abre uma nova aba)"
    >
      <span
        aria-hidden="true"
        style={{
          width: 80,
          height: 80,
          background: 'linear-gradient(160deg, #0d3b8e 0%, #071540 100%)',
          borderRadius: 10,
          display: 'grid',
          placeItems: 'center',
          color: '#ffffff',
        }}
      >
        <svg width="35" height="35" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V10Z" />
          <path d="M9 21v-9h6v9" />
        </svg>
      </span>
      <strong style={{ fontSize: 16, lineHeight: 1.3 }}>ABRIGO</strong>
      <span style={{ color: '#607b98', fontSize: 13 }}>Gestão do Abrigo</span>
      <span style={{ marginTop: 8, color: '#0066b5', fontSize: 13, fontWeight: 700 }}>
        Acessar sistema →
      </span>
    </a>
  );
}
