import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Info, 
  Calendar as CalendarIcon,
  Clock,
  AlertCircle,
  X,
  Cake,
  FileText,
  Archive,
  Download,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { eventosService } from '../services/eventosService';
import { frequenciaService } from '../services/frequenciaService';
import { servidoresService } from '../services/servidoresService';
import { EventoCalendario, OcorrenciaFrequencia, Servidor } from '../types';
import { API_CONFIG, fetchJson } from '../config/api';

export const FrequenciaPage = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [eventos, setEventos] = useState<EventoCalendario[]>([]);
  const [frequencias, setFrequencias] = useState<OcorrenciaFrequencia[]>([]);
  const [servidores, setServidores] = useState<Servidor[]>([]);
  const [aniversariosDoMes, setAniversariosDoMes] = useState<any[]>([]);
  const [showBirthdays, setShowBirthdays] = useState(() => {
    const saved = localStorage.getItem('ciapi_show_birthdays');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [selectedServidorId, setSelectedServidorId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [incluirPonto, setIncluirPonto] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [registroTipo, setRegistroTipo] = useState('FALTA');
  const [registroTurno, setRegistroTurno] = useState('INTEGRAL');
  const [loadTimeout, setLoadTimeout] = useState(false);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setLoadTimeout(false);
      const mes = currentMonth.getMonth() + 1;
      const ano = currentMonth.getFullYear();
      
      console.log(`[Frequencia] Fetching data for ${mes}/${ano}...`);

      const [eData, sData] = await Promise.all([
        eventosService.listar({ ano, mes }),
        servidoresService.listar()
      ]);
      
      setEventos(eData);
      setServidores(sData);

      // Calcular aniversários do mês
      const bdays = sData
        .filter(s => s.aniversario)
        .filter(s => {
          const [_, month] = s.aniversario!.split('-').map(Number);
          return month === (currentMonth.getMonth() + 1);
        })
        .map(s => {
          const [_, month, day] = s.aniversario!.split('-').map(Number);
          return {
            data: `${currentMonth.getFullYear()}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
            titulo: `🎂 Aniversário: ${s.nomeCompleto}`,
            tipo: 'ANIVERSARIO',
            servidorId: s.id,
            dia: day
          };
        });
      setAniversariosDoMes(bdays);
      
      if (sData.length > 0 && !selectedServidorId) {
        setSelectedServidorId(sData[0].id);
      }

      const fData = await frequenciaService.listar({ 
        ano, 
        mes, 
        servidorId: selectedServidorId || (sData.length > 0 ? sData[0].id : undefined)
      });
      setFrequencias(fData);
    } catch (err: any) {
      const isTimeout = err.message?.includes('Tempo limite') || err.name === 'AbortError';
      if (isTimeout) {
        setLoadTimeout(true);
        setError('Tempo limite de carregamento excedido. Verifique sua conexão.');
      } else {
        setError('Erro ao carregar dados de frequência. Verifique a conexão com o servidor.');
      }
      console.error('[Frequencia] Erro:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGerarRelatorio = async (tipo: 'SERVIDOR' | 'SETOR' | 'CATEGORIA') => {
    try {
      setIsGenerating(true);
      setError(null);

      const mes = currentMonth.getMonth() + 1;
      const ano = currentMonth.getFullYear();
      const servidor = servidores.find(s => s.id === selectedServidorId);

      let endpoint = '/gerar_frequencia';
      let body: any = { ano, mes, incluir_ponto: incluirPonto };

      if (tipo === 'SERVIDOR') {
        if (!selectedServidorId) throw new Error('Selecione um servidor');
        body.servidor_id = selectedServidorId;
      } else if (tipo === 'SETOR') {
        if (!servidor?.setor) throw new Error('Servidor selecionado não possui setor definido');
        endpoint = '/gerar_frequencia_setor';
        body.setor = servidor.setor;
      } else if (tipo === 'CATEGORIA') {
        if (!servidor?.categoria) throw new Error('Servidor selecionado não possui categoria definida');
        endpoint = '/gerar_frequencia_categoria';
        body.categoria = servidor.categoria;
      }

      const result = await fetchJson<any>(endpoint, {
        method: 'POST',
        body: JSON.stringify(body)
      });

      if (!result.ok) throw new Error(result.error || 'Erro ao gerar relatório');

      // Abrir download
      window.location.href = result.url_download;
      setSuccessMessage('Relatório gerado com sucesso! O download iniciará em instantes.');

    } catch (err: any) {
      setError(err.message || 'Erro ao conectar com o servidor de relatórios.');
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentMonth, selectedServidorId]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    localStorage.setItem('ciapi_show_birthdays', JSON.stringify(showBirthdays));
  }, [showBirthdays]);

  const handleSaveRegistro = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedDay) return;

    const formData = new FormData(e.currentTarget);
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
    
    if (!selectedServidorId) {
      setError('Selecione um servidor para registrar a frequência.');
      return;
    }

    const dados = {
      servidorId: selectedServidorId,
      data: dateStr,
      tipo: registroTipo as any,
      turno: registroTurno as any,
      descricao: formData.get('descricao') as string,
    };

    try {
      setIsLoading(true);
      await frequenciaService.adicionar(dados);
      setSuccessMessage('Ocorrência registrada com sucesso!');
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Erro ao registrar ocorrência.');
    } finally {
      setIsLoading(false);
    }
  };

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleDayClick = (day: number) => {
    setSelectedDay(day);
    setIsModalOpen(true);
  };

  const getDayType = (day: number) => {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const event = eventos.find(e => e.data === dateStr);
    
    if (event) {
      if (event.tipo === 'FERIADO') return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      if (event.tipo === 'PONTO') return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    }

    const freq = frequencias.find(f => f.data === dateStr);
    if (freq) {
      if (freq.tipo === 'FALTA') return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      if (freq.tipo === 'ATESTADO') return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }

    if (showBirthdays) {
      const bday = aniversariosDoMes.find(b => b.data === dateStr);
      if (bday) return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    }

    return 'bg-slate-800/50 text-slate-300 border-border-dark hover:border-primary/50';
  };

  const getDayLabel = (day: number) => {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const event = eventos.find(e => e.data === dateStr);
    if (event) return event.titulo;
    
    const freq = frequencias.find(f => f.data === dateStr);
    if (freq) return freq.tipo;

    if (showBirthdays) {
      const bday = aniversariosDoMes.find(b => b.data === dateStr);
      if (bday) return '🎂 ANIVERSÁRIO';
    }
    
    return null;
  };

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {(error || loadTimeout) && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 text-rose-400 text-sm"
          >
            <div className="flex items-center gap-3">
              <X size={18} className="cursor-pointer" onClick={() => { setError(null); setLoadTimeout(false); }} />
              <span>{error}</span>
            </div>
            <button 
              onClick={() => fetchData()}
              className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-1.5 rounded-lg font-bold text-xs transition-all"
            >
              Tentar Novamente
            </button>
          </motion.div>
        )}
        {successMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex items-center gap-3 text-emerald-400 text-sm"
          >
            <Clock size={18} />
            {successMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-card-dark p-6 rounded-2xl border border-border-dark shadow-xl relative min-h-[400px]">
            {isLoading && (
              <div className="absolute inset-0 bg-card-dark/50 backdrop-blur-[2px] z-10 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
            <div className="flex items-center justify-between mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <h2 className="text-xl font-bold text-white">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </h2>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => fetchData()}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                  title="Recarregar dados"
                >
                  <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                </button>
                <button onClick={handlePrevMonth} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all">
                  <ChevronLeft size={20} />
                </button>
                <button onClick={handleNextMonth} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all">
                  <ChevronRight size={20} />
                </button>
              </div>
              <select 
                value={selectedServidorId}
                onChange={(e) => setSelectedServidorId(e.target.value)}
                className="bg-slate-800 border border-border-dark rounded-xl py-1.5 px-3 text-xs text-slate-200 outline-none focus:ring-2 focus:ring-primary min-w-[200px]"
              >
                <option value="">Selecione o Servidor</option>
                {servidores.map(s => <option key={s.id} value={s.id}>{s.nomeCompleto}</option>)}
              </select>
              
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative">
                  <input 
                    type="checkbox" 
                    className="sr-only" 
                    checked={showBirthdays}
                    onChange={(e) => setShowBirthdays(e.target.checked)}
                  />
                  <div className={`w-10 h-5 rounded-full transition-colors ${showBirthdays ? 'bg-primary' : 'bg-slate-700'}`}></div>
                  <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${showBirthdays ? 'translate-x-5' : 'translate-x-0'}`}></div>
                </div>
                <span className="text-xs font-medium text-slate-400 group-hover:text-slate-200 transition-colors">Aniversários</span>
              </label>

              <div className="h-6 w-px bg-border-dark mx-2 hidden sm:block"></div>

              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative">
                  <input 
                    type="checkbox" 
                    className="sr-only" 
                    checked={incluirPonto}
                    onChange={(e) => setIncluirPonto(e.target.checked)}
                  />
                  <div className={`w-10 h-5 rounded-full transition-colors ${incluirPonto ? 'bg-amber-500' : 'bg-slate-700'}`}></div>
                  <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${incluirPonto ? 'translate-x-5' : 'translate-x-0'}`}></div>
                </div>
                <span className="text-xs font-medium text-slate-400 group-hover:text-slate-200 transition-colors">Incluir Ponto</span>
              </label>
            </div>
            <button 
              onClick={() => setCurrentMonth(new Date())}
              className="bg-slate-800 text-slate-300 px-4 py-2 rounded-xl text-sm font-semibold hover:text-white transition-all hidden sm:block"
            >
              Hoje
            </button>
          </div>

          <div className="grid grid-cols-7 gap-px bg-border-dark border border-border-dark rounded-xl overflow-hidden">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
              <div key={day} className="bg-slate-800/50 p-4 text-center text-xs font-bold text-slate-500 uppercase">
                {day}
              </div>
            ))}
            
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="bg-slate-900/30 h-32" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const typeClass = getDayType(day);
              return (
                <button 
                  key={day} 
                  onClick={() => handleDayClick(day)}
                  className={`bg-card-dark h-32 p-3 text-left transition-all border-transparent border-2 flex flex-col justify-between group ${typeClass}`}
                >
                  <span className="font-bold text-sm">{day}</span>
                  <div className="space-y-1">
                    {getDayLabel(day) && (
                      <span className="block text-[10px] font-bold uppercase truncate">
                        {getDayLabel(day)}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-8 flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-slate-800 border border-border-dark"></div>
              <span className="text-xs text-slate-400">Normal</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500/40 border border-rose-500/60"></div>
              <span className="text-xs text-slate-400">Feriado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500/40 border border-amber-500/60"></div>
              <span className="text-xs text-slate-400">Ponto Facultativo</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500/40 border border-orange-500/60"></div>
              <span className="text-xs text-slate-400">Falta</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500/40 border border-blue-500/60"></div>
              <span className="text-xs text-slate-400">Atestado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500/40 border border-purple-500/60"></div>
              <span className="text-xs text-slate-400">Aniversário</span>
            </div>
          </div>

          {/* Botões de Geração de Relatórios */}
          <div className="mt-8 pt-8 border-t border-border-dark flex flex-wrap gap-4">
            <button 
              disabled={isGenerating || !selectedServidorId}
              onClick={() => handleGerarRelatorio('SERVIDOR')}
              className="flex items-center gap-2 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg shadow-primary/20"
            >
              {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
              Gerar DOCX (Servidor)
            </button>
            <button 
              disabled={isGenerating || !selectedServidorId}
              onClick={() => handleGerarRelatorio('SETOR')}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 px-6 py-3 rounded-xl font-bold text-sm transition-all border border-border-dark"
            >
              {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Archive size={18} />}
              Gerar ZIP (Setor)
            </button>
            <button 
              disabled={isGenerating || !selectedServidorId}
              onClick={() => handleGerarRelatorio('CATEGORIA')}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 px-6 py-3 rounded-xl font-bold text-sm transition-all border border-border-dark"
            >
              {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
              Gerar ZIP (Categoria)
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-card-dark p-6 rounded-2xl border border-border-dark shadow-xl">
          <h3 className="text-lg font-bold text-white mb-6">Resumo do Mês</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-border-dark">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg">
                  <Cake size={18} />
                </div>
                <span className="text-sm font-medium text-slate-300">Aniversariantes</span>
              </div>
              <span className="text-lg font-bold text-white">
                {String(aniversariosDoMes.length).padStart(2, '0')}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-border-dark">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-500/10 text-rose-400 rounded-lg">
                  <AlertCircle size={18} />
                </div>
                <span className="text-sm font-medium text-slate-300">Faltas</span>
              </div>
              <span className="text-lg font-bold text-white">
                {String(frequencias.filter(f => f.tipo === 'FALTA').length).padStart(2, '0')}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-border-dark">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
                  <Info size={18} />
                </div>
                <span className="text-sm font-medium text-slate-300">Atestados</span>
              </div>
              <span className="text-lg font-bold text-white">
                {String(frequencias.filter(f => f.tipo === 'ATESTADO').length).padStart(2, '0')}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-border-dark">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
                  <CalendarIcon size={18} />
                </div>
                <span className="text-sm font-medium text-slate-300">Feriados</span>
              </div>
              <span className="text-lg font-bold text-white">
                {String(eventos.filter(e => e.tipo === 'FERIADO').length).padStart(2, '0')}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-primary/10 border border-primary/20 p-6 rounded-2xl">
          <h4 className="text-primary font-bold mb-2 flex items-center gap-2">
            <Info size={16} />
            Dica de Uso
          </h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Clique em um dia do calendário para registrar ocorrências, faltas ou atestados para o servidor selecionado.
          </p>
        </div>
      </div>
    </div>

    <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-card-dark border border-border-dark rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-border-dark flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Registrar Ocorrência</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white">
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="p-4 bg-slate-800 rounded-xl border border-border-dark flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/20 text-primary rounded-lg flex flex-col items-center justify-center">
                    <span className="text-xs font-bold uppercase">{monthNames[currentMonth.getMonth()].substring(0, 3)}</span>
                    <span className="text-xl font-bold">{selectedDay}</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Data Selecionada</p>
                    <p className="text-xs text-slate-500">Quinta-feira, {selectedDay} de {monthNames[currentMonth.getMonth()]}</p>
                  </div>
                </div>

                {/* Lista de Aniversariantes do Dia */}
                {showBirthdays && aniversariosDoMes.filter(b => b.dia === selectedDay).length > 0 && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase">Aniversariantes do Dia</label>
                    <div className="space-y-2">
                      {aniversariosDoMes.filter(b => b.dia === selectedDay).map((b, idx) => {
                        const servidor = servidores.find(s => s.id === b.servidorId);
                        return (
                          <div key={idx} className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center gap-3 text-purple-400">
                            <span className="text-lg">🎂</span>
                            <div className="flex flex-col">
                              <span className="text-sm font-bold">{servidor?.nomeCompleto}</span>
                              <span className="text-[10px] opacity-70 uppercase font-bold">
                                {servidor?.setor} • {servidor?.categoria}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <form id="frequencia-form" onSubmit={handleSaveRegistro} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase">Tipo de Registro</label>
                    <select 
                      value={registroTipo}
                      onChange={(e) => setRegistroTipo(e.target.value)}
                      className="w-full bg-slate-800 border border-border-dark rounded-xl p-3 text-sm text-white outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="FALTA">FALTA</option>
                      <option value="ATESTADO">ATESTADO</option>
                      <option value="LEMBRETE">LEMBRETE</option>
                      <option value="EVENTO">EVENTO</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase">Turno</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['MANHA', 'TARDE', 'INTEGRAL'].map(t => (
                        <button 
                          key={t} 
                          type="button"
                          onClick={() => setRegistroTurno(t)}
                          className={`py-2 border rounded-lg text-[10px] font-bold transition-all ${
                            registroTurno === t 
                              ? 'bg-primary border-primary text-white' 
                              : 'bg-slate-800 border-border-dark text-slate-400 hover:border-primary hover:text-primary'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase">Descrição / Motivo</label>
                    <textarea name="descricao" className="w-full bg-slate-800 border border-border-dark rounded-xl p-3 text-sm text-white outline-none focus:ring-2 focus:ring-primary h-24 resize-none" placeholder="Detalhes da ocorrência..." />
                  </div>
                </form>
              </div>
              
              <div className="p-6 border-t border-border-dark flex justify-end gap-3 bg-slate-800/20">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  form="frequencia-form"
                  type="submit"
                  className="bg-primary hover:bg-primary-hover text-white px-8 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 transition-all"
                >
                  Salvar Registro
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
