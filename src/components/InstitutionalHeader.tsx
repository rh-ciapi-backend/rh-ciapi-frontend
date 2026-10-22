import React from 'react';
import { ShieldCheck } from 'lucide-react';

type InstitutionalHeaderProps = {
  subtitle?: string;
  compact?: boolean;
};

/** Cabeçalho institucional — apenas apresentação; nenhuma mudança em autenticação. */
export function InstitutionalHeader({
  subtitle = 'Centro Integrado de Atenção à Pessoa Idosa',
  compact = false,
}: InstitutionalHeaderProps) {
  return (
    <header className={`institutional-header ${compact ? 'institutional-header--compact' : ''}`}>
      <div className="institutional-header__inner">
        <div className="institutional-brand institutional-brand--dual">
          <div className="institutional-brand__logos">
            <img className="institutional-brand__ciapi" src="/images/ciapi-simbolo-colorido.png" alt="Símbolo do CIAPI" />
            <span className="institutional-brand__divider" aria-hidden="true" />
            <img className="institutional-brand__gov" src="/images/governo-roraima-branco.png" alt="Governo de Roraima" />
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
