import React from 'react';
import { ShieldCheck } from 'lucide-react';

export function InstitutionalHeader({ subtitle = 'Centro Integrado de Atenção à Pessoa Idosa', compact = false }: { subtitle?: string; compact?: boolean }) {
  return (
    <header className={`institutional-header ${compact ? 'institutional-header--compact' : ''}`}>
      <div className="institutional-header__inner">
        <div className="institutional-brand">
          <img src="/images/governo-roraima-logo.png" alt="Logomarca do Governo de Roraima" />
          <span className="institutional-brand__unit">SETRABES · CIAPI</span>
        </div>
        <div className="institutional-heading">
          <strong>Portal Intranet CIAPI</strong>
          <span>{subtitle}</span>
        </div>
        <div className="institutional-seal"><ShieldCheck size={19} /><span>Acesso institucional</span></div>
      </div>
    </header>
  );
}
