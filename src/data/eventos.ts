import { EventoCalendario } from '../types';

export const MOCK_EVENTOS: EventoCalendario[] = [
  {
    id: 'e1',
    data: '2024-01-01',
    tipo: 'FERIADO',
    titulo: 'Confraternização Universal',
    descricao: 'Ano Novo'
  },
  {
    id: 'e2',
    data: '2024-02-12',
    tipo: 'PONTO',
    titulo: 'Carnaval',
    descricao: 'Ponto Facultativo'
  },
  {
    id: 'e3',
    data: '2024-02-13',
    tipo: 'FERIADO',
    titulo: 'Carnaval',
    descricao: 'Feriado Nacional'
  }
];
