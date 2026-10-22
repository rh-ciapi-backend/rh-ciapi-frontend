import React from 'react';
import { ShieldCheck } from 'lucide-react';

type InstitutionalHeaderProps = {
  subtitle?: string;
  compact?: boolean;
};

/** Cabeçalho institucional compartilhado entre o portal CIAPI RH e SAE. */
export function InstitutionalHeader({
  subtitle = 'Centro Integrado de Atenção à Pessoa Idosa',
  compact = false,
}: InstitutionalHeaderProps) {
  return (
    <header className={`institutional-header${compact ? ' institutional-header--compact' : ''}`}>
      <div className="institutional-header__inner">
        <div className="institutional-brand">
          <img
            src="/images/governo-roraima-identidade.jpg"
            alt="Identidade visual do Governo de Roraima"
            className="institutional-brand__img"
          />
          <div className="institutional-brand__text">
            <strong>GOVERNO DE RORAIMA</strong>
            <span>SETRABES · CIAPI</span>
          </div>
        </div>
        <div className="institutional-heading">
          <strong>Portal Intranet CIAPI</strong>
          <span>{subtitle}</span>
        </div>
        <div className="institutional-seal" aria-label="Ambiente institucional">
          <ShieldCheck size={22} aria-hidden="true" />
          <span>Acesso institucional</span>
        </div>
      </div>
    </header>
  );
}

export default InstitutionalHeader;
