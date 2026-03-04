import { LinhaMapa } from '../types';
import { MOCK_MAPAS } from '../data/mapas';
import { API_CONFIG } from '../config/api';
import { supabase } from '../lib/supabaseClient';
import { GerarMapaParams } from './apiTypes';

export const apiMapas = {
  listar: async (filtros: GerarMapaParams): Promise<LinhaMapa[]> => {
    if (API_CONFIG.useMock) {
      let result = [...MOCK_MAPAS];
      
      if (filtros.categoria) {
        result = result.filter(m => m.categoria === filtros.categoria);
      }
      
      return result;
    }

    // Fetch servers based on filters
    let query = supabase.from('servidores').select('id, nome_completo, matricula, categoria, setor');
    if (filtros.categoria) query = query.eq('categoria', filtros.categoria);
    if (filtros.setor) query = query.eq('setor', filtros.setor);

    const { data: servidores, error: sError } = await query.order('nome_completo');
    if (sError) throw sError;

    // Fetch frequency for the month to count absences
    const startDate = `${filtros.ano}-${String(filtros.mes).padStart(2, '0')}-01`;
    const endDate = `${filtros.ano}-${String(filtros.mes).padStart(2, '0')}-31`;
    
    const { data: frequencias, error: fError } = await supabase
      .from('frequencia')
      .select('servidor_id, tipo')
      .gte('data', startDate)
      .lte('data', endDate)
      .eq('tipo', 'FALTA');
    
    if (fError) throw fError;

    // Map to LinhaMapa
    return (servidores || []).map((s, index) => {
      const faltas = (frequencias || []).filter(f => f.servidor_id === s.id).length;
      return {
        ordem: index + 1,
        nome: s.nome_completo,
        nomeCompleto: s.nome_completo,
        matricula: s.matricula,
        frequencia: 100 - (faltas * 5), // Basic calculation
        faltas: faltas,
        observacao: '',
        categoria: s.categoria,
        setor: s.setor
      };
    });
  },

  gerar: async (filtros: GerarMapaParams): Promise<LinhaMapa[]> => {
    return apiMapas.listar(filtros);
  }
};

export const mapasService = apiMapas;
