import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Trophy, Users, CalendarDays, LayoutDashboard, Plus, Play, RefreshCw, ChevronRight, Menu, X, CheckCircle2, Trash2, Settings2, Brackets, Medal, ShieldCheck, Share2, Copy, ExternalLink, UserPlus, LogOut, Pencil, UserCog } from 'lucide-react';
import './styles.css';

const API = import.meta.env.DEV ? `${window.location.protocol}//${window.location.hostname}:4000/api` : '/api';
async function api(path, opts = {}) {
  const token = localStorage.getItem('nxl_token');
  const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(opts.headers || {}) };
  const method = String(opts.method || 'GET').toUpperCase();
  const url = method === 'GET' ? `${API + path}${(API + path).includes('?') ? '&' : '?'}_nxl=${Date.now()}` : API + path;
  const r = await fetch(url, { ...opts, headers, ...(method === 'GET' ? { cache: 'no-store' } : {}) });
  if (!r.ok) { let e = 'Erro'; try { e = (await r.json()).error || e; } catch {} throw new Error(e); }
  return r.status === 204 ? null : r.json();
}
function Logo() { return <div className="logo"><strong>N</strong><b>XL</b><small>eFOOTBALL</small></div>; }
async function imageFileToDataUrl(file) {
  if (!file) return '';
  if (!['image/png','image/jpeg','image/webp'].includes(file.type)) throw new Error('Escolha uma imagem PNG, JPG ou WebP.');
  if (file.size > 8 * 1024 * 1024) throw new Error('A imagem deve ter no máximo 8 MB.');
  const raw = await new Promise((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(r.result); r.onerror = reject; r.readAsDataURL(file); });
  const img = await new Promise((resolve, reject) => { const i = new Image(); i.onload = () => resolve(i); i.onerror = reject; i.src = raw; });
  const max = 256, scale = Math.min(1, max / Math.max(img.width, img.height));
  const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(img.width * scale)); canvas.height = Math.max(1, Math.round(img.height * scale));
  const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/webp', 0.86);
}
function LogoPicker({onChange, compact=false}) {
  const [busy,setBusy]=useState(false);
  const pick=async e=>{ const file=e.target.files?.[0]; e.target.value=''; if(!file)return; try{setBusy(true); const data=await imageFileToDataUrl(file); await onChange(data);}catch(err){onChange(null,err)}finally{setBusy(false)} };
  return <label className={`logo-picker ${compact?'compact':''}`}> <input type="file" accept="image/png,image/jpeg,image/webp" onChange={pick}/><span>{busy?'Processando...':'🛡️ Escolher escudo'}</span></label>;
}

function positionHighlightStyle(index, config) {
  if (config?.enabled === false) return undefined;
  const color = (config?.colors || ['#183b63','#254d3a','#5a4a1f','#4b2630'])?.[index];
  return color ? { backgroundColor: color, boxShadow: `inset 3px 0 0 rgba(255,255,255,.28)` } : undefined;
}
function PositionLegend({c}) {
  const cfg=c?.position_highlights;
  if (cfg?.enabled === false) return null;
  const colors=(cfg?.colors || ['#183b63','#254d3a','#5a4a1f','#4b2630']).slice(0,8);
  return <div className="position-legend"><span className="legend-title">Legenda</span>{colors.map((color,i)=><span className="legend-item" key={i}><i style={{backgroundColor:color}}></i>{i+1}º lugar</span>)}</div>;
}

function PositionColors({c,toast}) {
  const defaults=['#183b63','#254d3a','#5a4a1f','#4b2630'];
  const [enabled,setEnabled]=useState(c?.position_highlights?.enabled!==false);
  const [colors,setColors]=useState((c?.position_highlights?.colors||defaults).slice(0,8));
  useEffect(()=>{setEnabled(c?.position_highlights?.enabled!==false);setColors((c?.position_highlights?.colors||defaults).slice(0,8));},[c?.id,c?.position_highlights]);
  if(!c)return null;
  const save=async()=>{try{const x=await api(`/championships/${c.id}/settings`,{method:'PATCH',body:JSON.stringify({position_highlights:{enabled,colors}})});c.position_highlights=x;toast('Cores das posições salvas.');}catch(e){toast(e.message)}};
  return <div className="panel position-settings"><div className="paneltitle"><b>Destacar posições</b><span>Classificação</span></div><div className="position-settings-body"><label className="toggle-row"><span><b>Ativar cores</b><small>Destaca automaticamente as primeiras posições da tabela.</small></span><input type="checkbox" checked={enabled} onChange={e=>setEnabled(e.target.checked)}/></label><div className="position-colors">{colors.map((color,i)=><label key={i}><span>#{i+1} posição</span><input type="color" value={color} onChange={e=>setColors(a=>a.map((x,j)=>j===i?e.target.value:x))}/></label>)}</div><button className="secondary full" onClick={save}>Salvar cores</button></div></div>
}

function PublicShare({token}) {
  const [data,setData]=useState(null), [error,setError]=useState('');
  useEffect(()=>{let alive=true; const load=()=>api(`/share/${token}`).then(x=>{if(alive)setData(x)}).catch(e=>{if(alive)setError(e.message)}); load(); const timer=setInterval(load,15000); return ()=>{alive=false;clearInterval(timer)}},[token]);
  if(error) return <div className="public-page"><div className="public-error">{error}</div></div>;
  if(!data) return <div className="public-page"><div className="public-error">Carregando campeonato...</div></div>;
  const {championship:c,matches,standings,champion}=data;
  return <div className="public-page"><div className="public-shell"><div className="public-head"><div><div className="eyebrow">NXL ESPORTS • ACOMPANHAMENTO</div><h1>{c.name}</h1><p>{c.description||'Acompanhe a tabela e os resultados em tempo real.'}</p></div><span className="public-live">AO VIVO</span></div>{champion&&<div className="champion-banner"><Medal/><div><small>CAMPEÃO</small><b>{champion.name}</b></div>{champion.logo_url?<img src={champion.logo_url} alt=""/>:<div className="shield-fallback">{champion.name?.[0]}</div>}</div>}<div className="public-grid"><div className="panel"><div className="paneltitle"><b>Partidas</b><span>{matches.filter(m=>m.status==='played').length}/{matches.length} concluídas</span></div>{[...new Set(matches.map(m=>m.round))].map(r=><div className="roundblock" key={r}><div className="roundtitle">Rodada {r}</div>{matches.filter(m=>m.round===r).map(m=><PublicMatch key={m.id} m={m}/>)}</div>)}</div><div className="sidepanels"><div className="panel"><div className="paneltitle"><b>Classificação</b><span>Atualizada</span></div>{(standings.groups||[]).map(g=><div key={g.name}><div className="groupname">{g.name}</div><table className="stand"><thead><tr><th>#</th><th>TIME</th><th>J</th><th>V</th><th>SG</th><th>PTS</th></tr></thead><tbody>{g.rows.map((x,i)=><tr key={x.id} style={positionHighlightStyle(i,c.position_highlights)}><td>{i+1}</td><td><div className="teamcell">{x.logo_url?<img src={x.logo_url} alt=""/>:<span className="tiny-shield">{x.name?.[0]}</span>}<b>{x.name}</b></div></td><td>{x.played}</td><td>{x.wins}</td><td>{x.gd}</td><td><strong>{x.points}</strong></td></tr>)}</tbody></table></div>)}<PositionLegend c={c}/></div></div></div></div></div>
}
function PublicMatch({m}) { return <div className="match public-match"><div className="round"><span>R{m.round}</span><small>{m.group_name||m.stage}{m.leg===2?' • VOLTA':m.leg===1?' • IDA':''}</small></div><div className="teams"><span>{m.home_logo?<img src={m.home_logo} alt=""/>:null}<b>{m.home_name}</b></span><strong>{m.status==='played'?m.home_score:m.status==='bye'?'—':'•'}</strong><i>×</i><strong>{m.status==='played'?m.away_score:m.status==='bye'?'—':'•'}</strong><span><b>{m.away_name}</b>{m.away_logo?<img src={m.away_logo} alt=""/>:null}</span></div><div>{m.status==='bye'?<em className="bye-label">BYE</em>:<span className="public-status">{m.status==='played'?'FINALIZADO':'AGENDADO'}</span>}</div></div> }
function LoginScreen({setup,onDone}) {
  const [name,setName]=useState('Administrador'),[username,setUsername]=useState(''),[password,setPassword]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const submit=async e=>{e.preventDefault();setError('');setBusy(true);try{const x=await api(setup?'/auth/setup':'/auth/login',{method:'POST',body:JSON.stringify(setup?{name,username,password}:{username,password})});localStorage.setItem('nxl_token',x.token);onDone(x.user);}catch(err){setError(err.message)}finally{setBusy(false)}};
  return <div className="auth-page"><div className="auth-card"><Logo/><div className="eyebrow">NXL ESPORTS • ACESSO</div><h1>{setup?'Configurar conta principal':'Entrar no painel'}</h1><p>{setup?'Crie a conta do proprietário. Depois você poderá adicionar moderadores.':'Entre para gerenciar campeonatos e rodadas.'}</p><form onSubmit={submit}>{setup&&<label>Nome<input value={name} onChange={e=>setName(e.target.value)} placeholder="Seu nome"/></label>}<label>Usuário<input autoFocus value={username} onChange={e=>setUsername(e.target.value)} placeholder="ex.: admin"/></label><label>Senha<input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Mínimo 6 caracteres"/></label>{error&&<div className="auth-error">{error}</div>}<button className="primary full" disabled={busy}>{busy?(setup?'Criando...':'Entrando...'):(setup?'Criar conta principal':'Entrar')}</button></form></div></div>
}
function AuthGate(){
  const [state,setState]=useState('loading'),[user,setUser]=useState(null);
  const check=async()=>{try{const st=await api('/auth/status');if(st.setup_required){setState('setup');return}const me=await api('/auth/me');setUser(me);setState('app')}catch{setState('login')}};
  useEffect(()=>{check()},[]);
  if(state==='loading')return <div className="auth-page"><div className="auth-card"><div className="eyebrow">NXL ESPORTS</div><h1>Carregando...</h1></div></div>;
  if(state==='setup'||state==='login')return <LoginScreen setup={state==='setup'} onDone={u=>{setUser(u);setState('app')}}/>;
  return <App user={user} onLogout={()=>{localStorage.removeItem('nxl_token');setState('login')}}/>;
}

function App({user,onLogout}) {
  const [tab, setTab] = useState('dashboard'), [dash, setDash] = useState({}), [players, setPlayers] = useState([]), [chs, setChs] = useState([]);
  const [selected, setSelected] = useState(null), [matches, setMatches] = useState([]), [standings, setStandings] = useState({ groups: [] }), [stats, setStats] = useState({}), [modal, setModal] = useState(false), [mobile, setMobile] = useState(false), [toast, setToast] = useState('');
  const toastIt = (m) => { setToast(m); setTimeout(() => setToast(''), 2800); };
  const load = async () => { try { const [d,p,c] = await Promise.all([api('/dashboard'), api('/players'), api('/championships')]); setDash(d); setPlayers(p); setChs(c); } catch(e){ toastIt(e.message); } };
  const loadSelected = async (id = selected) => { if (!id) return; try { const [m,s,st] = await Promise.all([api(`/championships/${id}/matches`), api(`/championships/${id}/standings`), api(`/championships/${id}/stats`)]); setMatches(m); setStandings(s); setStats(st); } catch(e){ toastIt(e.message); } };
  useEffect(() => { load(); }, []); useEffect(() => { if (selected) loadSelected(selected); }, [selected]);
  const nav = t => { setTab(t); setMobile(false); };
  const canPlayers = user.role==='owner';
  return <div className="app">
    <aside className={mobile ? 'open' : ''}><Logo/><nav>
      <button className={tab==='dashboard'?'active':''} onClick={()=>nav('dashboard')}><LayoutDashboard/>Dashboard</button>
      <button className={tab==='championships'?'active':''} onClick={()=>nav('championships')}><Trophy/>Campeonatos</button>
      <button className={tab==='players'?'active':''} onClick={()=>nav('players')}><Users/>Jogadores</button>
      <button className={tab==='matches'?'active':''} onClick={()=>nav('matches')}><CalendarDays/>Partidas</button>
      {user.role==='owner'&&<button className={tab==='moderators'?'active':''} onClick={()=>nav('moderators')}><UserCog/>Moderadores</button>}
    </nav><div className="sidefoot"><b>{user.name}</b><br/><span>{user.role==='owner'?'PROPRIETÁRIO':'MODERADOR'}</span><button className="logout-link" onClick={onLogout}><LogOut size={14}/> Sair</button></div></aside>
    <main><header><button className="hamb" onClick={()=>setMobile(!mobile)}>{mobile?<X/>:<Menu/>}</button><div><div className="eyebrow">NXL ESPORTS • {user.role==='owner'?'PROPRIETÁRIO':'MODERADOR'}</div><h1>{tab==='dashboard'?'Central de comando':tab==='championships'?'Campeonatos':tab==='players'?'Jogadores':tab==='matches'?'Partidas & fases':'Moderadores'}</h1></div><button className="refresh" onClick={load}><RefreshCw size={18}/></button></header>
      {tab==='dashboard' && <Dashboard dash={dash} chs={chs} onOpen={id=>{setSelected(id);setTab('matches')}}/>}
      {tab==='championships' && <Championships chs={chs} players={players} openCreate={()=>setModal(true)} open={id=>{setSelected(id);setTab('matches')}} reload={load} toast={toastIt}/>} 
      {tab==='players' && <Players players={players} reload={load} toast={toastIt} readOnly={!canPlayers}/>} 
      {tab==='matches' && <Matches chs={chs} selected={selected} setSelected={setSelected} matches={matches} standings={standings} stats={stats} reload={()=>loadSelected()} toast={toastIt}/>} 
      {tab==='moderators' && user.role==='owner' && <Moderators toast={toastIt}/>} 
    </main>
    {modal && <CreateModal players={players} close={()=>setModal(false)} reload={load} toast={toastIt}/>} {toast && <div className="toast">{toast}</div>}
  </div>
}
function Dashboard({dash,chs,onOpen}) { return <section>
  <div className="hero"><div><span className="pill">NXL • COMPETITIVE PLATFORM</span><h2>Seu campeonato.<br/><em>Seu espetáculo.</em></h2><p>Crie formatos, gere confrontos e acompanhe tudo em um só lugar.</p></div><div className="hero-logo">NXL</div></div>
  <div className="stats"><Stat label="Campeonatos" value={dash.championships||0} icon={<Trophy/>}/><Stat label="Jogadores" value={dash.players||0} icon={<Users/>}/><Stat label="Partidas concluídas" value={dash.matches||0} icon={<CheckCircle2/>}/><Stat label="Agendadas" value={dash.scheduled||0} icon={<CalendarDays/>}/></div>
  <div className="sectionhead"><div><h3>Campeonatos recentes</h3><p>Abra um campeonato para acompanhar partidas, tabela e fases.</p></div></div>
  <div className="cards">{chs.slice(0,6).map(c=><div className="champ-card" key={c.id} onClick={()=>onOpen(c.id)}><div className="cardtop"><span className="type">{formatType(c.type)}</span><span className={c.status==='active'?'live':'draft'}>{c.status==='active'?'ATIVO':'RASCUNHO'}</span></div><h4>{c.name}</h4><p>{c.participant_count||0} participantes • {c.legs===2?'Ida e volta':'Jogo único'}</p><ChevronRight/></div>)}{!chs.length&&<Empty text="Crie seu primeiro campeonato para começar."/>}</div>
</section> }
function Stat({label,value,icon}) { return <div className="stat"><div className="staticon">{icon}</div><div><b>{value}</b><span>{label}</span></div></div> }
function Championships({chs,players,openCreate,open,reload,toast}) { const [confirm,setConfirm]=useState(null); const del=async id=>{try{await api(`/championships/${id}`,{method:'DELETE'});setConfirm(null);await reload();toast('Campeonato excluído.')}catch(e){toast(e.message)}}; return <section>
  <div className="toolbar"><div><h3>Meus campeonatos</h3><p>Crie formatos e gere automaticamente todas as rodadas e fases.</p></div><button className="primary" onClick={openCreate}><Plus/>Novo campeonato</button></div>
  <div className="champ-grid">{chs.map(c=><div className="big-card" key={c.id}><div className="big-card-top"><span className="type">{formatType(c.type)}</span><span className={c.status==='active'?'live':'draft'}>{c.status==='active'?'ATIVO':'RASCUNHO'}</span></div><h3>{c.name}</h3><p>{c.description||'Sem descrição'}</p><div className="mini-stats"><span><Users/> {c.participant_count} jogadores</span><span><ShieldCheck/> {c.legs===2?'Ida e volta':'Jogo único'}</span></div><div className="card-actions"><button className="primary small" onClick={()=>open(c.id)}>Abrir campeonato <ChevronRight/></button><button className="secondary small" onClick={async()=>{const name=prompt('Nome do campeonato',c.name);if(name===null)return;const description=prompt('Descrição',c.description||'');if(description===null)return;try{await api(`/championships/${c.id}`,{method:'PATCH',body:JSON.stringify({name,description})});reload();toast('Campeonato atualizado.')}catch(e){toast(e.message)}}}><Pencil/>Editar</button><button className="danger" onClick={()=>setConfirm(c.id)}><Trash2/></button></div></div>)}{!chs.length&&<Empty text="Nenhum campeonato cadastrado. Clique em Novo campeonato."/>}</div>
  {confirm && <Confirm text="Excluir este campeonato e todas as partidas dele?" cancel={()=>setConfirm(null)} ok={()=>del(confirm)}/>} 
</section> }
function Players({players,reload,toast,readOnly=false}) {
  const [name,setName]=useState(''),[handle,setHandle]=useState(''),[team,setTeam]=useState(''),[logo,setLogo]=useState(''),[confirm,setConfirm]=useState(null);
  const add=async()=>{try{if(!name.trim())return;await api('/players',{method:'POST',body:JSON.stringify({name,handle,team,logo_url:logo})});setName('');setHandle('');setTeam('');setLogo('');await reload();toast('Jogador cadastrado.')}catch(e){toast(e.message)}};
  const del=async id=>{try{await api(`/players/${id}`,{method:'DELETE'});setConfirm(null);await reload();toast('Jogador removido.')}catch(e){toast(e.message)}};
  const changeLogo=async(id,data,err)=>{if(err){toast(err.message);return}try{await api(`/players/${id}`,{method:'PATCH',body:JSON.stringify({logo_url:data})});await reload();toast('Escudo atualizado.')}catch(e){toast(e.message)}};
  const pickNew=async(data,err)=>{if(err){toast(err.message);return}setLogo(data);toast('Escudo manual selecionado.');};
  return <section>
  <div className="toolbar"><div><h3>Jogadores</h3><p>Cadastre os participantes da NXL. O escudo pode ser automático ou escolhido manualmente.</p></div></div>
  {!readOnly&&<div className="quickadd"><input placeholder="Nome do jogador" value={name} onChange={e=>setName(e.target.value)}/><input placeholder="ID / nickname do eFootball" value={handle} onChange={e=>setHandle(e.target.value)}/><input placeholder="Time / clube" value={team} onChange={e=>setTeam(e.target.value)}/><LogoPicker onChange={pickNew}/><button className="primary" onClick={add}><Plus/>Adicionar</button></div>}<div className="logo-hint">Se você não escolher um escudo, o NXL tenta usar o escudo automático pelo nome do clube.</div>
  <div className="playersgrid">{players.map((p,i)=><div className="player" key={p.id}>{p.logo_url?<img className="team-logo" src={p.logo_url} alt=""/>:<div className="avatar">{p.name[0]?.toUpperCase()}</div>}<div><b>{p.name}</b><span>{p.team||'Sem time'}{p.handle?` • ${p.handle}`:''}</span>{!readOnly&&<LogoPicker compact onChange={(data,err)=>changeLogo(p.id,data,err)}/>}</div><small>#{String(i+1).padStart(2,'0')}</small>{!readOnly&&<button className="ghostdanger" onClick={()=>setConfirm(p.id)}><Trash2 size={16}/></button>}</div>)}{!players.length&&<Empty text="Cadastre os primeiros jogadores da NXL."/>}</div>
  {confirm&&<Confirm text="Remover este jogador? Se ele estiver em um campeonato, será necessário removê-lo de lá primeiro." cancel={()=>setConfirm(null)} ok={()=>del(confirm)}/>} 
</section> }
function Moderators({toast}) {
  const [users,setUsers]=useState([]),[name,setName]=useState(''),[username,setUsername]=useState(''),[password,setPassword]=useState(''),[busy,setBusy]=useState(false);
  const load=async()=>{try{setUsers(await api('/moderators'))}catch(e){toast(e.message)}}; useEffect(()=>{load()},[]);
  const add=async()=>{try{setBusy(true);await api('/moderators',{method:'POST',body:JSON.stringify({name,username,password})});setName('');setUsername('');setPassword('');load();toast('Moderador adicionado.')}catch(e){toast(e.message)}finally{setBusy(false)}};
  const remove=async id=>{if(!confirm('Remover este moderador?'))return;try{await api(`/moderators/${id}`,{method:'DELETE'});load();toast('Moderador removido.')}catch(e){toast(e.message)}};
  return <section><div className="toolbar"><div><h3>Moderadores</h3><p>Crie acessos para pessoas que podem editar campeonatos, lançar resultados e atualizar rodadas.</p></div></div><div className="moderator-grid"><div className="panel"><div className="paneltitle"><b>Novo moderador</b><span>Acesso de gestão</span></div><div className="formgrid"><label>Nome<input value={name} onChange={e=>setName(e.target.value)} placeholder="Nome da pessoa"/></label><label>Usuário<input value={username} onChange={e=>setUsername(e.target.value)} placeholder="usuario"/></label></div><label>Senha<input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Mínimo 6 caracteres"/></label><button className="primary full" disabled={busy||!username||password.length<6} onClick={add}><UserPlus/>{busy?'Adicionando...':'Adicionar moderador'}</button><div className="permission-note"><b>Permissões do moderador</b><span>• Criar e editar campeonatos</span><span>• Gerar e atualizar rodadas</span><span>• Lançar e editar resultados</span><span>• Avançar fases e configurar cores</span><span>• Compartilhar tabelas</span><span>• Não pode gerenciar outros moderadores ou apagar jogadores/campeonatos</span></div></div><div className="panel"><div className="paneltitle"><b>Acessos cadastrados</b><span>{users.length}</span></div><div className="moderator-list">{users.map(u=><div className="moderator-row" key={u.id}><div className="avatar mini">{u.name?.[0]?.toUpperCase()}</div><div><b>{u.name}</b><span>@{u.username} • {u.role==='owner'?'Proprietário':'Moderador'}</span></div>{u.role!=='owner'&&<button className="ghostdanger" onClick={()=>remove(u.id)}><Trash2 size={16}/></button>}</div>)}</div></div></div></section>
}

function CreateModal({players,close,reload,toast}) { const [name,setName]=useState(''),[desc,setDesc]=useState(''),[type,setType]=useState('league'),[legs,setLegs]=useState(1),[selected,setSelected]=useState([]),[groups,setGroups]=useState(2),[qual,setQual]=useState(2),[koLegs,setKoLegs]=useState(1),[busy,setBusy]=useState(false); const toggle=id=>setSelected(s=>s.includes(id)?s.filter(x=>x!==id):[...s,id]); const save=async()=>{try{setBusy(true);await api('/championships',{method:'POST',body:JSON.stringify({name,description:desc,type,legs,participant_ids:selected,group_count:groups,qualifiers_per_group:qual,knockout_legs:koLegs})});close();reload();toast('Campeonato criado. Agora abra e gere as partidas.')}catch(e){toast(e.message)}finally{setBusy(false)}}; return <div className="overlay"><div className="modal wide"><div className="modalhead"><div><span className="eyebrow">CONFIGURAÇÃO NXL</span><h3>Novo campeonato</h3></div><button onClick={close}><X/></button></div><div className="formgrid"><label>Nome<input autoFocus value={name} onChange={e=>setName(e.target.value)} placeholder="Ex.: NXL Season 01"/></label><label>Formato<select value={type} onChange={e=>setType(e.target.value)}><option value="league">Pontos corridos</option><option value="knockout">Mata-mata</option><option value="groups">Grupos + mata-mata</option></select></label></div><label>Descrição<textarea value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Regras, temporada, premiação..."/></label>
  {type==='league'&&<div className="configbox"><b>Formato da liga</b><div className="choice"><button className={legs===1?'chosen':''} onClick={()=>setLegs(1)}>Turno único</button><button className={legs===2?'chosen':''} onClick={()=>setLegs(2)}>Ida e volta</button></div></div>}
  {type==='knockout'&&<div className="configbox"><b>Formato do mata-mata</b><div className="choice"><button className={legs===1?'chosen':''} onClick={()=>setLegs(1)}>Jogo único</button><button className={legs===2?'chosen':''} onClick={()=>setLegs(2)}>Ida e volta</button></div><small>O sistema cria o chaveamento completo e trata vagas por bye quando necessário.</small></div>}
  {type==='groups'&&<div className="configbox"><b>Fase de grupos</b><div className="formgrid three"><label>Grupos<input type="number" min="2" max="8" value={groups} onChange={e=>setGroups(Number(e.target.value))}/></label><label>Classificados por grupo<input type="number" min="1" max="4" value={qual} onChange={e=>setQual(Number(e.target.value))}/></label><label>Ida/volta do mata-mata<select value={koLegs} onChange={e=>setKoLegs(Number(e.target.value))}><option value="1">Jogo único</option><option value="2">Ida e volta</option></select></label></div></div>}
  <div className="participants-head"><b>Participantes ({selected.length})</b><span>Selecione quem jogará este campeonato</span></div><div className="pickgrid">{players.map(p=><button key={p.id} className={selected.includes(p.id)?'picked':''} onClick={()=>toggle(p.id)}>{p.logo_url?<img className="team-logo mini" src={p.logo_url} alt=""/>:<span className="avatar mini">{p.name[0]?.toUpperCase()}</span>}<span><b>{p.name}</b><small>{p.team||'Sem time'}{p.handle?` • ${p.handle}`:''}</small></span>{selected.includes(p.id)&&<CheckCircle2/>}</button>)}{!players.length&&<Empty text="Cadastre jogadores antes de criar o campeonato."/>}</div>
  <div className="modalactions"><button onClick={close}>Cancelar</button><button className="primary" disabled={!name.trim()||selected.length<2||busy} onClick={save}>{busy?'Criando...':'Criar campeonato'}</button></div>
</div></div> }
function ShareButton({c,toast}) { const [busy,setBusy]=useState(false); if(!c)return null; const share=async()=>{try{setBusy(true);const x=await api(`/championships/${c.id}/share`,{method:'POST'});const url=`${window.location.origin}${x.path}`; if(navigator.clipboard) await navigator.clipboard.writeText(url); else window.prompt('Copie este link:',url);toast('Link público copiado.');}catch(e){toast(e.message)}finally{setBusy(false)}}; return <div className="sharebar"><button className="secondary" onClick={share} disabled={busy}><Share2/>{busy?'Gerando...':'Compartilhar tabela'}</button></div> }
function Matches({chs,selected,setSelected,matches,standings,stats,reload,toast}) { const c=chs.find(x=>x.id===selected); const [filter,setFilter]=useState('all'); const generate=async()=>{try{await api(`/championships/${c.id}/generate`,{method:'POST'});reload();toast('Partidas geradas automaticamente.')}catch(e){toast(e.message)}}; const result=async m=>{const h=prompt(`Placar de ${m.home_name}`,'0');if(h===null)return;const a=prompt(`Placar de ${m.away_name}`,'0');if(a===null)return;let winner=null;if(c.type!=='league'&&Number(h)===Number(a)&&m.leg===2){const pick=prompt(`Empate no jogo decisivo. Digite exatamente o vencedor: ${m.home_name} ou ${m.away_name}`,'');winner=pick===m.home_name?m.home_id:pick===m.away_name?m.away_id:null;}try{await api(`/matches/${m.id}/result`,{method:'PATCH',body:JSON.stringify({home_score:h,away_score:a,winner_id:winner})});reload();toast('Resultado salvo.')}catch(e){toast(e.message)}}; const advance=async()=>{try{await api(`/championships/${c.id}/advance`,{method:'POST'});reload();toast('Classificados enviados ao mata-mata.')}catch(e){toast(e.message)}}; const visible=filter==='all'?matches:matches.filter(m=>m.type===filter); const rounds=[...new Set(visible.map(m=>m.round))]; return <section>
  <ShareButton c={c} toast={toast}/>{c&&<div className="toolbar"><div><h3>{c?c.name:'Partidas & fases'}</h3><p>{c?`${formatType(c.type)} • ${c.participant_count||0} participantes`:'Selecione um campeonato'}</p></div><div className="toolbar-actions"><button className="secondary" onClick={generate}><RefreshCw/>Regenerar</button><button className="primary" onClick={generate}><Play/>Gerar partidas</button></div></div>}
  <select className="select" value={selected||''} onChange={e=>setSelected(e.target.value||null)}><option value="">Selecione o campeonato</option>{chs.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select>
  {c&&<><div className="tabs"><button className={filter==='all'?'on':''} onClick={()=>setFilter('all')}>Todos</button><button className={filter==='league'?'on':''} onClick={()=>setFilter('league')}>Liga</button><button className={filter==='group'?'on':''} onClick={()=>setFilter('group')}>Grupos</button><button className={filter==='knockout'?'on':''} onClick={()=>setFilter('knockout')}>Mata-mata</button></div>{stats.champion&&<div className="champion-banner"><Medal/><div><small>CAMPEÃO</small><b>{stats.champion.name}</b></div>{stats.champion.logo_url?<img src={stats.champion.logo_url} alt=""/>:<div className="shield-fallback">{stats.champion.name?.[0]}</div>}</div>}
  <div className="settings-grid"><PositionColors c={c} toast={toast}/></div><div className="matchlayout"><div className="panel"><div className="paneltitle"><b>Calendário</b><span>{visible.filter(m=>m.status==='played').length}/{visible.length} concluídas</span></div>{rounds.map(r=><div key={r} className="roundblock"><div className="roundtitle">Rodada {r}</div>{visible.filter(m=>m.round===r).map(m=><MatchRow key={m.id} m={m} onResult={result}/>)}</div>)}{!visible.length&&<Empty text="Clique em Gerar partidas para montar o calendário automaticamente."/>}</div><div className="sidepanels">
    <div className="panel"><div className="paneltitle"><b>Classificação</b><span>Atualizada</span></div>{(standings.groups||[]).map(g=><div key={g.name}><div className="groupname">{g.name}</div><table className="stand"><thead><tr><th>#</th><th>JOGADOR</th><th>J</th><th>V</th><th>SG</th><th>PTS</th></tr></thead><tbody>{g.rows.map((s,i)=><tr key={s.id} style={positionHighlightStyle(i,c.position_highlights)}><td>{i+1}</td><td><b>{s.name}</b></td><td>{s.played}</td><td>{s.wins}</td><td>{s.gd}</td><td><strong>{s.points}</strong></td></tr>)}</tbody></table></div>)}<PositionLegend c={c}/></div>
    <div className="panel statsbox"><div className="paneltitle"><b>Resumo</b><span>Campeonato</span></div><div className="summary"><div><b>{stats.played||0}</b><span>jogos</span></div><div><b>{stats.goals||0}</b><span>gols</span></div><div><b>{Number(stats.avg_goals||0).toFixed(2)}</b><span>gols/jogo</span></div></div>{c.type==='groups'&&<button className="primary full" onClick={advance}><Brackets/>Avançar classificados</button>}</div>
  </div></div></>}
</section> }
function MatchRow({m,onResult}) { return <div className={`match ${m.status==='bye'?'bye':''}`}><div className="round"><span>R{m.round}</span><small>{m.group_name||m.stage}{m.leg===2?' • VOLTA':m.leg===1?' • IDA':''}</small></div><div className="teams"><span>{m.home_logo?<img src={m.home_logo} alt=""/>:null}<b>{m.home_name}</b></span><strong>{m.status==='played'?m.home_score:m.status==='bye'?'—':'•'}</strong><i>×</i><strong>{m.status==='played'?m.away_score:m.status==='bye'?'—':'•'}</strong><span><b>{m.away_name}</b>{m.away_logo?<img src={m.away_logo} alt=""/>:null}</span></div>{m.status==='bye'?<em className="bye-label">BYE</em>:<button onClick={()=>onResult(m)}>{m.status==='played'?'Editar':'Resultado'}</button>}</div> }
function Confirm({text,cancel,ok}) { return <div className="overlay"><div className="modal confirm"><h3>Confirmar</h3><p>{text}</p><div className="modalactions"><button onClick={cancel}>Cancelar</button><button className="danger solid" onClick={ok}>Excluir</button></div></div></div> }
function Empty({text}) { return <div className="empty">{text}</div> }
function formatType(t){return t==='league'?'PONTOS CORRIDOS':t==='knockout'?'MATA-MATA':'GRUPOS + MATA-MATA'}
const shareMatch = window.location.pathname.match(/^\/share\/([^/]+)/);
createRoot(document.getElementById('root')).render(shareMatch ? <PublicShare token={shareMatch[1]}/> : <AuthGate/>);
