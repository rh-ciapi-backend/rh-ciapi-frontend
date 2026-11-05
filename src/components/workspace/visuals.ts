import type { DashboardIconName } from '../dashboard/DashboardIcon';
export type WorkspaceTone = 'blue' | 'green' | 'purple' | 'orange';
export const workspaceVisuals: Record<string, {icon:DashboardIconName; tone:WorkspaceTone}> = {
 dashboard:{icon:'personnel',tone:'blue'}, servidores:{icon:'people',tone:'blue'},
 frequencia:{icon:'attendance',tone:'purple'}, ferias:{icon:'holiday',tone:'orange'},
 mapas:{icon:'reports',tone:'blue'}, atestados:{icon:'medical',tone:'green'},
 requerimentos:{icon:'document',tone:'purple'}, relatorios:{icon:'reports',tone:'blue'},
 admin:{icon:'settings',tone:'purple'}, 'admin-usuarios':{icon:'people',tone:'blue'},
 'admin-categorias':{icon:'document',tone:'purple'},'admin-setores':{icon:'personnel',tone:'green'},
 'admin-logs':{icon:'shield',tone:'orange'}, diagnostico:{icon:'shield',tone:'green'},
 usuarios:{icon:'people',tone:'blue'},triagem:{icon:'medical',tone:'green'},
 agendamentos:{icon:'agenda',tone:'purple'},atendimentos:{icon:'medical',tone:'green'},
 'sinais-vitais':{icon:'heart',tone:'green'}, profissionais:{icon:'active',tone:'blue'},
};
export const visualFor = (key:string) => workspaceVisuals[key] || workspaceVisuals.dashboard;
