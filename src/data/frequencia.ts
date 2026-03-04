import { OcorrenciaFrequencia } from '../types';

export const MOCK_FREQUENCIA: OcorrenciaFrequencia[] = [
  {
    id: 'f1',
    servidorId: '1',
    data: '2024-02-15',
    tipo: 'FALTA',
    turno: 'INTEGRAL',
    descricao: 'Falta sem justificativa'
  },
  {
    id: 'f2',
    servidorId: '2',
    data: '2024-02-22',
    tipo: 'ATESTADO',
    turno: 'MANHA',
    descricao: 'Atestado médico'
  }
];
