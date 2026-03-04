import { Ferias } from '../types';

export const MOCK_FERIAS: Ferias[] = [
  {
    id: 'v1',
    servidorId: '1',
    ano: 2024,
    periodo1Inicio: '2024-01-02',
    periodo1Fim: '2024-01-31',
    observacao: 'Férias regulamentares'
  },
  {
    id: 'v2',
    servidorId: '3',
    ano: 2024,
    periodo1Inicio: '2024-02-15',
    periodo1Fim: '2024-03-01',
    periodo2Inicio: '2024-07-10',
    periodo2Fim: '2024-07-25',
    observacao: 'Parcelamento em 2 períodos'
  }
];
