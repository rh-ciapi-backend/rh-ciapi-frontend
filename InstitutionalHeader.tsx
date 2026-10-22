import React from 'react';
import { ShieldCheck } from 'lucide-react';

export function InstitutionalHeader({ subtitle = 'Centro Integrado de Atenção à Pessoa Idosa', compact = false }: { subtitle?: string; compact?: boolean }) {
  return <header className={`institutional-header ${compact ? 'institutional-header--compact' : ''}`}>
    <div className="institutional-header__inner">
      <div className="institutional-brand"><img src="/images/governo-roraima-identidade.jpg" alt="Governo de Roraima"/><div className="institutional-brand__caption"><strong>GOVERNO DE RORAIMA</strong><span>SETRABES · CIAPI</span></div></div>
      <div className="institutional-heading"><strong>Portal Intranet CIAPI</strong><span>{subtitle}</span></div>
      <div className="institutional-seal"><ShieldCheck size={18}/><span>Acesso institucional</span></div>
    </div>
  </header>;
}
