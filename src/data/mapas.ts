import { LinhaMapa } from '../types';
import { MOCK_SERVIDORES } from './servidores';

export const MOCK_MAPAS: LinhaMapa[] = MOCK_SERVIDORES.map((emp, i) => ({
  ordem: i + 1,
  nome: emp.nomeCompleto,
  nomeCompleto: emp.nomeCompleto,
  matricula: emp.matricula,
  frequencia: 100,
  faltas: 0,
  observacao: 'Sem ocorrências',
  categoria: emp.categoria,
  setor: emp.setor
}));
