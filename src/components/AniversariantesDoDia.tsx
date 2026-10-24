import React,{useEffect,useMemo,useState} from 'react';
import {Cake,Download,X} from 'lucide-react';
import {aniversariantesHoje,hojeEmBoaVista,type Aniversariante} from '../utils/aniversariantes';
import {criarCardPNG,type TemaAniversario} from '../utils/exportarCard';
import {signedServidorFotoUrl} from '../services/servidorFotoService';
import './aniversariantes.css';
type Row=Record<string,any>;
export default function AniversariantesDoDia({servidores,isLoading=false}:{servidores:Row[];isLoading?:boolean}){
 const [dia,setDia]=useState(hojeEmBoaVista().chave),[selected,setSelected]=useState<Aniversariante|null>(null),[urls,setUrls]=useState<Record<string,string>>({}),[busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>{const id=window.setInterval(()=>{const now=hojeEmBoaVista().chave;setDia(v=>v===now?v:now)},60000);return()=>clearInterval(id)},[]);
 const items=useMemo(()=>aniversariantesHoje(servidores),[servidores,dia]);
 useEffect(()=>{let alive=true;(async()=>{const result:Record<string,string>={};await Promise.all(items.map(async(p)=>{if(!p.fotoPath)return;try{result[p.id]=p.fotoPath.startsWith('http')?p.fotoPath:await signedServidorFotoUrl(p.fotoPath)}catch{}}));if(alive)setUrls(result)})();return()=>{alive=false}},[items]);
 const tema=(p:Aniversariante):TemaAniversario=>p.sexo==='M'?'masculino':p.sexo==='F'?'feminino':'neutro';
 const download=async(p:Aniversariante)=>{setBusy(true);setError('');try{await criarCardPNG(p,tema(p),urls[p.id]||'')}catch(e:any){setError(e?.message||'Não foi possível baixar o card.')}finally{setBusy(false)}};
 const card=(p:Aniversariante,large=false)=><article className={'ciapi-bday-card ciapi-bday-'+tema(p)+(large?' ciapi-bday-large':'')} key={p.id}><div className="ciapi-bday-balloons">✦ 🎈 ✦</div><div className="ciapi-bday-salute">Feliz Aniversário!</div><div className="ciapi-bday-photo">{urls[p.id]?<img src={urls[p.id]} alt={'Foto de '+p.nomeCurto}/>:<span>{p.nomeCurto.split(' ').slice(0,2).map(x=>x[0]).join('').toUpperCase()}</span>}</div><strong>{p.nomeCurto}</strong><p>Que seu novo ciclo seja repleto de saúde, alegria e realizações!</p><small>Com carinho, equipe CIAPI</small><div className="ciapi-bday-actions">{!large&&<button type="button" onClick={()=>setSelected(p)}>Ampliar</button>}<button type="button" disabled={busy} onClick={()=>download(p)}><Download size={15}/> Baixar Card</button></div></article>;
 return <section className="ciapi-bday-section"><h2><Cake size={22}/> Aniversariantes do Dia</h2><p>Hoje é dia de celebrar a vida dos nossos servidores!</p>{isLoading?<p>Carregando aniversariantes...</p>:items.length?<div className="ciapi-bday-gallery">{items.map(x=>card(x))}</div>:<div className="ciapi-bday-empty">Não há aniversariantes registrados para hoje.</div>}{error&&<p role="alert" className="ciapi-bday-error">{error}</p>}{selected&&<div className="ciapi-bday-overlay" role="dialog" aria-modal="true"><div className="ciapi-bday-dialog"><button className="ciapi-bday-close" type="button" onClick={()=>setSelected(null)} aria-label="Fechar"><X/></button>{card(selected,true)}</div></div>}</section>
}
