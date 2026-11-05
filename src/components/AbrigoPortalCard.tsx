import { ArrowUpRight, House } from 'lucide-react';

const ABRIGO_URL = 'https://sgilpi.up.railway.app/login/';

type AbrigoPortalCardProps = {
  className?: string;
};

/** Preserves the external Abrigo destination and new-tab behavior. */
export default function AbrigoPortalCard({ className = '' }: AbrigoPortalCardProps) {
  return (
    <a
      href={ABRIGO_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`ciapi-portal-card ciapi-portal-card--abrigo ${className}`}
      aria-label="Acessar sistema ABRIGO (abre uma nova aba)"
    >
      <span className="ciapi-portal-card__top">
        <span className="ciapi-portal-card__icon" aria-hidden="true"><House size={27} strokeWidth={1.7}/></span>
        <span className="ciapi-portal-card__tag">Acolhimento</span>
      </span>
      <span className="ciapi-portal-card__body">
        <strong>ABRIGO</strong>
        <span>Gestão do Abrigo</span>
        <small>Organização e apoio ao acolhimento.</small>
      </span>
      <span className="ciapi-portal-card__action">Acessar Abrigo <ArrowUpRight size={17} aria-hidden="true"/></span>
    </a>
  );
}
