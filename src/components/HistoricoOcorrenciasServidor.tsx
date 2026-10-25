import React, { useEffect, useState } from 'react';
import { historicoServidorService, type OcorrenciaServidor } from '../services/historicoServidorService';
export function HistoricoOcorrenciasServidor({matricula}:{matricula:string}){
 const [itens,setItens]=useState<OcorrenciaServidor[]>([]); const [erro,setErro]=useState('');
 useEffect(()=>{let active=true;setErro('');historicoServidorService.listarPorMatricula(matricula).then(rows=>{if(active)setItens(rows)}).catch(e=>{if(active)setErro(e.message)});return()=>{active=false}},[matricula]);
 return <section className="rounded-xl border border-slate-200 bg-white p-4 text-slate-900"><h3 className="mb-3 font-bold">Histórico de ocorrências por competência</h3>{erro&&<p className="text-red-700">{erro}</p>}{!erro&&!itens.length&&<p className="text-sm text-slate-500">Sem lançamentos históricos adicionais.</p>}
 <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr><th className="p-2">Competência</th><th className="p-2">Data</th><th className="p-2">Tipo</th><th className="p-2">Descrição</th></tr></thead><tbody>{itens.map(o=><tr key={o.id} className="border-t"><td className="p-2">{String(o.competencia_mes).padStart(2,'0')}/{o.competencia_ano}</td><td className="p-2">{o.data_evento.split('-').reverse().join('/')}</td><td className="p-2">{o.tipo}{o.tipo==='FALTA'&&o.turno?` (${o.turno})`:''}</td><td className="p-2">{o.descricao}</td></tr>)}</tbody></table></div></section>;
}
