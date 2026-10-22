import React from 'react';
import { Building2, ShieldCheck } from 'lucide-react';
import ciapiLogo from './layout/ciapi_logo.png';

export function InstitutionalHeader({ subtitle = 'Centro Integrado de Atenção à Pessoa Idosa', compact = false }: { subtitle?: string; compact?: boolean }) {
  return <div className={`institutional-header ${compact ? 'institutional-header--compact' : ''}`}>
    <div className="institutional-header__inner">
      <div className="institutional-brand"><img src={ciapiLogo} alt="Identidade visual do CIAPI" /><div><strong>GOVERNO DE RORAIMA</strong><span>SETRABES · CIAPI</span></div></div>
      <div className="institutional-heading"><strong>Portal Intranet CIAPI</strong><span>{subtitle}</span></div>
      <div className="institutional-seal" aria-label="Ambiente institucional"><ShieldCheck size={22} /><span>Acesso institucional</span></div>
    </div>
  </div>;
}
