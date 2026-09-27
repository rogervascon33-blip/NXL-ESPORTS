import express from 'express';
import cors from 'cors';
import { nanoid } from 'nanoid';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { getStore } from '@netlify/blobs';

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

const dataDir = path.resolve('data');
fs.mkdirSync(dataDir, { recursive: true });
const dbFile = path.join(dataDir, 'nxl.json');
const emptyDb = { players: [], championships: [], matches: [], shares: [], users: [], sessions: [] };
const useNetlifyBlobs = process.env.NETLIFY === 'true' || process.env.NETLIFY_DEV === 'true';
let blobDb = null;
let blobWriteQueue = Promise.resolve();
const blobStore = useNetlifyBlobs ? getStore({ name: 'nxl-data', consistency: 'strong' }) : null;

function normalizeDb(db) {
  return { ...emptyDb, ...(db || {}), players: db?.players || [], championships: db?.championships || [], matches: db?.matches || [], shares: db?.shares || [], users: db?.users || [], sessions: db?.sessions || [] };
}

async function loadLocalDb() {
  try { return normalizeDb(JSON.parse(fs.readFileSync(dbFile, 'utf8'))); }
  catch { return structuredClone(emptyDb); }
}

export const ready = (async () => {
  if (!useNetlifyBlobs) {
    blobDb = await loadLocalDb();
    if (!fs.existsSync(dbFile)) fs.writeFileSync(dbFile, JSON.stringify(blobDb, null, 2));
    return;
  }
  const remote = await blobStore.get('db.json', { type: 'json', consistency: 'strong' });
  if (remote) {
    blobDb = normalizeDb(remote);
  } else {
    blobDb = await loadLocalDb();
    await blobStore.setJSON('db.json', blobDb);
  }
})();

function readDb() {
  if (!blobDb) throw new Error('Banco do NXL ainda está inicializando.');
  return blobDb;
}
function writeDb(db) {
  blobDb = normalizeDb(db);
  if (useNetlifyBlobs) {
    const snapshot = structuredClone(blobDb);
    blobWriteQueue = blobWriteQueue.then(() => blobStore.setJSON('db.json', snapshot)).catch(err => console.error('Falha ao salvar NXL Blobs:', err));
    return;
  }
  fs.writeFileSync(dbFile, JSON.stringify(blobDb, null, 2));
}
function playerName(db, id) { return id ? (db.players.find(p => p.id === id)?.name || 'A definir') : 'A definir'; }
function participants(db, ch) { return (ch.participant_ids || []).map(id => db.players.find(p => p.id === id)).filter(Boolean); }


const TEAM_LOGOS = {
  'barcelona':'https://tmssl.akamaized.net/images/wappen/head/131.png', 'fc barcelona':'https://tmssl.akamaized.net/images/wappen/head/131.png',
  'real madrid':'https://tmssl.akamaized.net/images/wappen/head/418.png', 'real madrid cf':'https://tmssl.akamaized.net/images/wappen/head/418.png',
  'manchester united':'https://tmssl.akamaized.net/images/wappen/head/985.png', 'man united':'https://tmssl.akamaized.net/images/wappen/head/985.png',
  'manchester city':'https://tmssl.akamaized.net/images/wappen/head/281.png', 'man city':'https://tmssl.akamaized.net/images/wappen/head/281.png',
  'liverpool':'https://tmssl.akamaized.net/images/wappen/head/31.png',
  'chelsea':'https://tmssl.akamaized.net/images/wappen/head/631.png',
  'arsenal':'https://tmssl.akamaized.net/images/wappen/head/11.png',
  'tottenham':'https://tmssl.akamaized.net/images/wappen/head/148.png', 'tottenham hotspur':'https://tmssl.akamaized.net/images/wappen/head/148.png',
  'bayern munich':'https://tmssl.akamaized.net/images/wappen/head/27.png', 'bayern de munique':'https://tmssl.akamaized.net/images/wappen/head/27.png',
  'borussia dortmund':'https://tmssl.akamaized.net/images/wappen/head/16.png', 'dortmund':'https://tmssl.akamaized.net/images/wappen/head/16.png',
  'psg':'https://tmssl.akamaized.net/images/wappen/head/583.png', 'paris saint-germain':'https://tmssl.akamaized.net/images/wappen/head/583.png',
  'inter milan':'https://tmssl.akamaized.net/images/wappen/head/46.png', 'internazionale':'https://tmssl.akamaized.net/images/wappen/head/46.png',
  'ac milan':'https://tmssl.akamaized.net/images/wappen/head/5.png', 'milan':'https://tmssl.akamaized.net/images/wappen/head/5.png',
  'juventus':'https://tmssl.akamaized.net/images/wappen/head/506.png',
  'napoli':'https://tmssl.akamaized.net/images/wappen/head/6195.png',
  'roma':'https://tmssl.akamaized.net/images/wappen/head/12.png', 'as roma':'https://tmssl.akamaized.net/images/wappen/head/12.png',
  'ajax':'https://tmssl.akamaized.net/images/wappen/head/610.png',
  'psv':'https://tmssl.akamaized.net/images/wappen/head/383.png',
  'benfica':'https://tmssl.akamaized.net/images/wappen/head/294.png',
  'porto':'https://tmssl.akamaized.net/images/wappen/head/720.png',
  'sporting':'https://tmssl.akamaized.net/images/wappen/head/336.png', 'sporting cp':'https://tmssl.akamaized.net/images/wappen/head/336.png',
  'flamengo':'https://tmssl.akamaized.net/images/wappen/head/6140.png',
  'palmeiras':'https://tmssl.akamaized.net/images/wappen/head/1024.png',
  'corinthians':'https://tmssl.akamaized.net/images/wappen/head/199.png',
  'santos':'https://tmssl.akamaized.net/images/wappen/head/221.png',
  'sao paulo':'https://tmssl.akamaized.net/images/wappen/head/585.png', 'são paulo':'https://tmssl.akamaized.net/images/wappen/head/585.png',
  'vasco':'https://tmssl.akamaized.net/images/wappen/head/238.png', 'vasco da gama':'https://tmssl.akamaized.net/images/wappen/head/238.png',
  'gremio':'https://tmssl.akamaized.net/images/wappen/head/210.png', 'grêmio':'https://tmssl.akamaized.net/images/wappen/head/210.png',
  'internacional':'https://tmssl.akamaized.net/images/wappen/head/6600.png', 'athletico paranaense':'https://tmssl.akamaized.net/images/wappen/head/679.png',
  'cruzeiro':'https://tmssl.akamaized.net/images/wappen/head/6090.png', 'atletico mineiro':'https://tmssl.akamaized.net/images/wappen/head/237.png', 'atlético mineiro':'https://tmssl.akamaized.net/images/wappen/head/237.png',
  'botafogo':'https://tmssl.akamaized.net/images/wappen/head/537.png', 'bahia':'https://tmssl.akamaized.net/images/wappen/head/10011.png'
};
function normalizeTeamName(name='') { return name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim(); }
function logoForTeam(team='') { return TEAM_LOGOS[normalizeTeamName(team)] || null; }
function playerView(db, p) { return { ...p, logo_url: p.logo_url || logoForTeam(p.team || '') }; }
function championFor(db, ch) {
  const ko = db.matches.filter(m => m.championship_id === ch.id && m.type === 'knockout');
  if (!ko.length) return null;
  const finalRound = Math.max(...ko.map(m => m.round || 0));
  const finals = ko.filter(m => m.round === finalRound);
  if (!finals.length) return null;
  const winner = knockoutWinner(db, ch, finals[0].tie_id) || finals.find(m => m.status === 'bye')?.winner_id;
  return winner ? playerView(db, db.players.find(p => p.id === winner) || { id: winner, name: playerName(db, winner) }) : null;
}
function publicData(db, ch) {
  const ms = db.matches.filter(m => m.championship_id === ch.id).sort((a,b)=>(a.round||0)-(b.round||0)||(a.tie_order||0)-(b.tie_order||0)||(a.leg||0)-(b.leg||0));
  return { championship: { ...ch, participants: participants(db,ch).map(p=>playerView(db,p)) }, matches: ms.map(m=>({ ...m, home_name: playerName(db,m.home_id), away_name: playerName(db,m.away_id), home_logo: playerView(db,db.players.find(p=>p.id===m.home_id)||{}).logo_url, away_logo: playerView(db,db.players.find(p=>p.id===m.away_id)||{}).logo_url })), standings: ch.type==='groups' ? {groups:(ch.groups||[]).map(g=>({name:g.name,rows:standingsFor(db,ch,g.name).map(p=>({...p,logo_url:playerView(db,db.players.find(x=>x.id===p.id)||{}).logo_url}))}))} : {groups:[{name:'Classificação',rows:standingsFor(db,ch).map(p=>({...p,logo_url:playerView(db,db.players.find(x=>x.id===p.id)||{}).logo_url}))}]}, champion: championFor(db,ch) };
}

function roundRobin(ids, doubleLeg = false) {
  let teams = [...ids];
  if (teams.length % 2) teams.push(null);
  const n = teams.length;
  const rounds = n - 1;
  const first = [];
  for (let r = 0; r < rounds; r++) {
    const games = [];
    for (let i = 0; i < n / 2; i++) {
      const a = teams[i], b = teams[n - 1 - i];
      if (a && b) games.push([a, b]);
    }
    first.push(games);
    teams = [teams[0], teams[n - 1], ...teams.slice(1, n - 1)];
  }
  return doubleLeg ? [...first, ...first.map(g => g.map(([a, b]) => [b, a]))] : first;
}
function addMatch(db, fields) {
  const m = { id: nanoid(), status: 'scheduled', home_score: null, away_score: null, winner_id: null, ...fields };
  db.matches.push(m); return m;
}
function clearMatches(db, championshipId) { db.matches = db.matches.filter(m => m.championship_id !== championshipId); }

function generateLeague(db, ch, ids) {
  let created = 0;
  roundRobin(ids, ch.legs === 2).forEach((games, r) => games.forEach(([home, away]) => {
    addMatch(db, { championship_id: ch.id, type: 'league', round: r + 1, stage: 'Liga', home_id: home, away_id: away, leg: r >= ids.length - (ids.length % 2 === 0 ? 1 : 0) ? 2 : 1 });
    created++;
  }));
  return created;
}

function powerOfTwo(n) { let x = 1; while (x < n) x *= 2; return x; }
function generateKnockout(db, ch, ids, stagePrefix = 'Mata-mata') {
  const size = powerOfTwo(ids.length);
  const slots = [...ids]; while (slots.length < size) slots.push(null);
  const rounds = Math.log2(size);
  let created = 0;
  // Create every tie in every round. Later rounds begin empty and are filled automatically.
  for (let r = 1; r <= rounds; r++) {
    const ties = size / (2 ** r);
    for (let t = 0; t < ties; t++) {
      const tieId = nanoid();
      let home = null, away = null;
      if (r === 1) { home = slots[t * 2] || null; away = slots[t * 2 + 1] || null; }
      if (ch.legs === 2) {
        addMatch(db, { championship_id: ch.id, type: 'knockout', stage: `${stagePrefix} • ${r}/${rounds}`, round: r, tie_order: t, tie_id: tieId, leg: 1, home_id: home, away_id: away });
        addMatch(db, { championship_id: ch.id, type: 'knockout', stage: `${stagePrefix} • ${r}/${rounds}`, round: r, tie_order: t, tie_id: tieId, leg: 2, home_id: away, away_id: home });
        created += 2;
      } else {
        addMatch(db, { championship_id: ch.id, type: 'knockout', stage: `${stagePrefix} • ${r}/${rounds}`, round: r, tie_order: t, tie_id: tieId, leg: 1, home_id: home, away_id: away });
        created++;
      }
    }
  }
  // Resolve first-round byes.
  resolveKnockoutProgress(db, ch);
  return created;
}

function groupIds(ids, count) {
  const groups = Array.from({ length: Math.max(1, Math.min(count, ids.length)) }, () => []);
  ids.forEach((id, i) => groups[i % groups.length].push(id));
  return groups;
}
function generateGroups(db, ch, ids) {
  const groups = groupIds(ids, ch.group_count || 2);
  ch.groups = groups.map((members, i) => ({ name: `Grupo ${String.fromCharCode(65 + i)}`, player_ids: members }));
  let created = 0;
  groups.forEach((members, gi) => roundRobin(members, ch.legs === 2).forEach((games, r) => games.forEach(([home, away]) => {
    addMatch(db, { championship_id: ch.id, type: 'group', group_name: `Grupo ${String.fromCharCode(65 + gi)}`, round: r + 1, stage: 'Fase de grupos', home_id: home, away_id: away, leg: 1 }); created++;
  })));
  // Build the knockout skeleton now; qualifiers are populated once group phase is complete.
  const qualifiers = (ch.groups?.length || 0) * (ch.qualifiers_per_group || 2);
  if (qualifiers >= 2) {
    generateKnockout(db, { ...ch, legs: ch.knockout_legs }, Array.from({ length: qualifiers }, () => null), 'Mata-mata');
    db.matches.filter(m => m.championship_id === ch.id && m.type === 'knockout').forEach(m => { m.home_id = null; m.away_id = null; });
  }
  return created;
}

function standingsFor(db, ch, groupName = null) {
  const ids = groupName ? (ch.groups?.find(g => g.name === groupName)?.player_ids || []) : (ch.participant_ids || []);
  const map = new Map(ids.map(id => [id, { id, name: playerName(db, id), played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, gd: 0, points: 0 }]));
  const matches = db.matches.filter(m => m.championship_id === ch.id && m.status === 'played' && m.type !== 'knockout' && (!groupName || m.group_name === groupName));
  for (const m of matches) {
    const a = map.get(m.home_id), b = map.get(m.away_id); if (!a || !b) continue;
    a.played++; b.played++; a.gf += Number(m.home_score); a.ga += Number(m.away_score); b.gf += Number(m.away_score); b.ga += Number(m.home_score);
    if (m.home_score > m.away_score) { a.wins++; a.points += ch.points_win; b.losses++; }
    else if (m.home_score < m.away_score) { b.wins++; b.points += ch.points_win; a.losses++; }
    else { a.draws++; b.draws++; a.points += ch.points_draw; b.points += ch.points_draw; }
  }
  return [...map.values()].map(x => ({ ...x, gd: x.gf - x.ga, avg: x.played ? x.points / (x.played * ch.points_win) : 0 })).sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf || a.name.localeCompare(b.name));
}

function knockoutWinner(db, ch, tieId) {
  const games = db.matches.filter(m => m.championship_id === ch.id && m.type === 'knockout' && m.tie_id === tieId);
  if (!games.length || games.some(m => m.status !== 'played')) return null;
  const players = [...new Set(games.flatMap(m => [m.home_id, m.away_id]).filter(Boolean))];
  if (players.length !== 2) return null;
  const [a, b] = players;
  const aGoals = games.reduce((s, m) => s + (m.home_id === a ? Number(m.home_score) : Number(m.away_score)), 0);
  const bGoals = games.reduce((s, m) => s + (m.home_id === b ? Number(m.home_score) : Number(m.away_score)), 0);
  if (aGoals > bGoals) return a; if (bGoals > aGoals) return b;
  const decisive = games.slice().sort((x, y) => y.leg - x.leg)[0];
  return decisive.winner_id || null;
}
function resolveKnockoutProgress(db, ch) {
  const rounds = Math.max(0, ...db.matches.filter(m => m.championship_id === ch.id && m.type === 'knockout').map(m => m.round || 0));
  for (let r = 1; r <= rounds; r++) {
    const ties = [...new Set(db.matches.filter(m => m.championship_id === ch.id && m.type === 'knockout' && m.round === r).map(m => m.tie_id))];
    for (const tieId of ties) {
      const games = db.matches.filter(m => m.championship_id === ch.id && m.type === 'knockout' && m.tie_id === tieId);
      const hasBye = games.some(m => m.status === 'bye');
      if (games.length === 1 && (!games[0].home_id || !games[0].away_id)) {
        const winner = games[0].home_id || games[0].away_id;
        if (winner) { games[0].status = 'bye'; games[0].winner_id = winner; }
      }
      const distinctPlayers = [...new Set(games.flatMap(g => [g.home_id, g.away_id]).filter(Boolean))];
      if (distinctPlayers.length === 1 && games.some(g => !g.home_id || !g.away_id)) {
        games.forEach(g => { g.status = 'bye'; g.winner_id = distinctPlayers[0]; g.home_id = distinctPlayers[0]; g.away_id = null; });
      }
      const winner = knockoutWinner(db, ch, tieId) || games.find(g => g.status === 'bye')?.winner_id;
      if (!winner) continue;
      // The winner of tie T feeds the next-round tie floor(T / 2).
      // T even occupies the HOME slot; T odd occupies the AWAY slot.
      // (The old code incorrectly checked nextTie.tie_order, which is always
      // the destination tie index and caused both semifinalists to be written
      // into the same side.)
      const sourceTieOrder = games[0].tie_order || 0;
      const nextTie = db.matches.find(
        m => m.championship_id === ch.id &&
             m.type === 'knockout' &&
             m.round === r + 1 &&
             m.tie_order === Math.floor(sourceTieOrder / 2)
      );
      if (!nextTie) continue;

      const legs = db.matches.filter(
        m => m.championship_id === ch.id &&
             m.type === 'knockout' &&
             m.tie_id === nextTie.tie_id
      ).sort((a, b) => a.leg - b.leg);

      if (sourceTieOrder % 2 === 0) {
        // First source tie -> home in leg 1, away in leg 2.
        if (legs[0]) legs[0].home_id = winner;
        if (legs[1]) legs[1].away_id = winner;
      } else {
        // Second source tie -> away in leg 1, home in leg 2.
        if (legs[0]) legs[0].away_id = winner;
        if (legs[1]) legs[1].home_id = winner;
      }
    }
  }
}

function allGroupMatchesPlayed(db, ch) {
  return db.matches.filter(m => m.championship_id === ch.id && m.type === 'group').every(m => m.status === 'played');
}
function advanceGroups(db, ch) {
  if (!ch.groups?.length || !allGroupMatchesPlayed(db, ch)) return false;
  const qualified = [];
  ch.groups.forEach(g => standingsFor(db, ch, g.name).slice(0, ch.qualifiers_per_group || 2).forEach(p => qualified.push(p.id)));
  const koMatches = db.matches.filter(m => m.championship_id === ch.id && m.type === 'knockout');
  const firstRound = [...new Map(koMatches.filter(m => m.round === 1).map(m => [m.tie_id, m])).values()].sort((a, b) => a.tie_order - b.tie_order);
  qualified.forEach((id, i) => { const tie = firstRound[Math.floor(i / 2)]; if (!tie) return; const games = koMatches.filter(m => m.tie_id === tie.tie_id); if (i % 2 === 0) games.forEach(g => { g.home_id = id; }); else games.forEach(g => { g.away_id = id; }); if (games.length === 2) { games[1].home_id = games[0].away_id; games[1].away_id = games[0].home_id; } });
  return true;
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(String(password), salt, 64).toString('hex');
  return `${salt}:${hash}`;
}
function verifyPassword(password, stored) {
  try {
    const [salt, expected] = String(stored).split(':');
    const actual = crypto.scryptSync(String(password), salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(actual, 'hex'), Buffer.from(expected, 'hex'));
  } catch { return false; }
}
function currentUser(req) {
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const db = readDb();
  const session = db.sessions.find(s => s.token === token && (!s.expires_at || new Date(s.expires_at) > new Date()));
  return session ? db.users.find(u => u.id === session.user_id) || null : null;
}
function requireAuth(req, res, next) {
  const user = currentUser(req);
  if (!user) return res.status(401).json({ error: 'Faça login para continuar.' });
  req.user = user; next();
}
function requireRole(...roles) { return (req, res, next) => roles.includes(req.user?.role) ? next() : res.status(403).json({ error: 'Você não tem permissão para esta ação.' }); }

app.get('/api/auth/status', (_, res) => { const db = readDb(); res.json({ setup_required: db.users.length === 0 }); });
app.post('/api/auth/setup', (req, res) => {
  const db = readDb(); if (db.users.length) return res.status(409).json({ error: 'A conta principal já foi configurada.' });
  const { name = 'Administrador', username, password } = req.body || {};
  if (!username?.trim() || !password || String(password).length < 6) return res.status(400).json({ error: 'Informe usuário e senha (mínimo 6 caracteres).' });
  const user = { id: nanoid(), name: String(name).trim() || 'Administrador', username: String(username).trim().toLowerCase(), password_hash: hashPassword(password), role: 'owner', created_at: new Date().toISOString() };
  db.users.push(user); const token=nanoid(32); db.sessions.push({ token, user_id:user.id, created_at:new Date().toISOString() }); writeDb(db);
  res.status(201).json({ token, user:{ id:user.id,name:user.name,username:user.username,role:user.role } });
});
app.post('/api/auth/login', (req,res) => {
  const db=readDb(); const username=String(req.body?.username||'').trim().toLowerCase(); const password=String(req.body?.password||''); const user=db.users.find(u=>u.username===username);
  if(!user || !verifyPassword(password,user.password_hash)) return res.status(401).json({error:'Usuário ou senha incorretos.'});
  const token=nanoid(32); db.sessions=db.sessions.filter(s=>s.user_id!==user.id || new Date(s.expires_at||0)>new Date()); db.sessions.push({token,user_id:user.id,created_at:new Date().toISOString(),expires_at:new Date(Date.now()+1000*60*60*24*30).toISOString()}); writeDb(db);
  res.json({token,user:{id:user.id,name:user.name,username:user.username,role:user.role}});
});
app.get('/api/auth/me', requireAuth, (req,res)=>res.json({id:req.user.id,name:req.user.name,username:req.user.username,role:req.user.role}));
app.post('/api/auth/logout', requireAuth, (req,res)=>{ const token=String(req.headers.authorization||'').replace(/^Bearer\s+/i,''); const db=readDb(); db.sessions=db.sessions.filter(s=>s.token!==token); writeDb(db); res.sendStatus(204); });

// Everything below is private except the public share page and the team-logo helper.
app.use('/api', (req,res,next) => {
  if (req.path === '/auth/status' || req.path === '/auth/setup' || req.path === '/auth/login' || req.path.startsWith('/share/')) return next();
  if (req.path === '/teams/logo') return next();
  return requireAuth(req,res,next);
});

app.get('/api/moderators', requireRole('owner'), (req,res)=>{ const db=readDb(); res.json(db.users.map(u=>({id:u.id,name:u.name,username:u.username,role:u.role,created_at:u.created_at}))); });
app.post('/api/moderators', requireRole('owner'), (req,res)=>{ const db=readDb(); const {name='',username,password}=req.body||{}; const un=String(username||'').trim().toLowerCase(); if(!un||!password||String(password).length<6) return res.status(400).json({error:'Informe nome, usuário e senha (mínimo 6 caracteres).'}); if(db.users.some(u=>u.username===un)) return res.status(409).json({error:'Esse usuário já existe.'}); const u={id:nanoid(),name:String(name||un).trim(),username:un,password_hash:hashPassword(password),role:'moderator',created_at:new Date().toISOString()}; db.users.push(u); writeDb(db); res.status(201).json({id:u.id,name:u.name,username:u.username,role:u.role,created_at:u.created_at}); });
app.delete('/api/moderators/:id', requireRole('owner'), (req,res)=>{ const db=readDb(); const u=db.users.find(x=>x.id===req.params.id); if(!u) return res.sendStatus(404); if(u.role==='owner') return res.status(400).json({error:'A conta principal não pode ser removida.'}); db.users=db.users.filter(x=>x.id!==u.id); db.sessions=db.sessions.filter(x=>x.user_id!==u.id); writeDb(db); res.sendStatus(204); });
app.patch('/api/moderators/:id', requireRole('owner'), (req,res)=>{ const db=readDb(); const u=db.users.find(x=>x.id===req.params.id); if(!u) return res.sendStatus(404); if(req.body?.password){ if(String(req.body.password).length<6)return res.status(400).json({error:'A senha deve ter pelo menos 6 caracteres.'}); u.password_hash=hashPassword(req.body.password); } if(req.body?.name)u.name=String(req.body.name).trim(); writeDb(db); res.json({id:u.id,name:u.name,username:u.username,role:u.role}); });
app.get('/api/health', (_, res) => res.json({ ok: true }));
app.get('/api/players', (_, res) => { const db = readDb(); res.json(db.players.sort((a, b) => a.name.localeCompare(b.name)).map(p => playerView(db,p))); });
app.post('/api/players', requireRole('owner'), (req, res) => { const db = readDb(); const { name, handle = '', team = '', logo_url = '' } = req.body; if (!name?.trim()) return res.status(400).json({ error: 'Nome obrigatório' }); const p = { id: nanoid(), name: name.trim(), handle: handle.trim(), team: team.trim(), logo_url: logo_url || logoForTeam(team), created_at: new Date().toISOString() }; db.players.push(p); writeDb(db); res.status(201).json(playerView(db,p)); });
app.delete('/api/players/:id', requireRole('owner'), (req, res) => { const db = readDb(); if (db.championships.some(c => (c.participant_ids || []).includes(req.params.id))) return res.status(409).json({ error: 'Jogador participa de um campeonato. Remova-o dos campeonatos antes.' }); db.players = db.players.filter(p => p.id !== req.params.id); writeDb(db); res.sendStatus(204); });
app.patch('/api/players/:id', requireRole('owner'), (req, res) => { const db = readDb(); const p = db.players.find(x => x.id === req.params.id); if (!p) return res.sendStatus(404); if (typeof req.body.logo_url !== 'undefined') { const logo = String(req.body.logo_url || ''); if (logo && !/^data:image\/(png|jpe?g|webp);base64,/i.test(logo)) return res.status(400).json({ error: 'Escudo inválido. Use PNG, JPG ou WebP.' }); p.logo_url = logo; } writeDb(db); res.json(playerView(db, p)); });

app.get('/api/championships', (_, res) => { const db = readDb(); res.json(db.championships.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map(c => ({ ...c, participant_count: (c.participant_ids || []).length }))); });
app.post('/api/championships', (req, res) => {
  const db = readDb(); const { name, description = '', type = 'league', legs = 1, participant_ids = [], points_win = 3, points_draw = 1, group_count = 2, qualifiers_per_group = 2, knockout_legs = 1 } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Nome obrigatório' });
  if (participant_ids.length < 2) return res.status(400).json({ error: 'Selecione pelo menos 2 jogadores.' });
  const c = { id: nanoid(), name: name.trim(), description, type, legs: Number(legs) === 2 ? 2 : 1, points_win: Number(points_win) || 3, points_draw: Number(points_draw) || 1, participant_ids, group_count: Number(group_count) || 2, qualifiers_per_group: Number(qualifiers_per_group) || 2, knockout_legs: Number(knockout_legs) === 2 ? 2 : 1, position_highlights: { enabled: true, colors: ['#183b63','#254d3a','#5a4a1f','#4b2630'] }, status: 'draft', created_at: new Date().toISOString(), groups: [] };
  db.championships.push(c); writeDb(db); res.status(201).json(c);
});
app.get('/api/championships/:id', (req, res) => { const db = readDb(); const c = db.championships.find(x => x.id === req.params.id); if (!c) return res.sendStatus(404); res.json({ ...c, participants: participants(db, c) }); });
app.patch('/api/championships/:id', requireRole('owner','moderator'), (req,res)=>{ const db=readDb(); const c=db.championships.find(x=>x.id===req.params.id); if(!c)return res.sendStatus(404); if(typeof req.body.name!=='undefined'){ if(!String(req.body.name).trim())return res.status(400).json({error:'Nome obrigatório.'}); c.name=String(req.body.name).trim(); } if(typeof req.body.description!=='undefined')c.description=String(req.body.description); writeDb(db); res.json({...c,participant_count:(c.participant_ids||[]).length}); });
app.patch('/api/championships/:id/settings', (req, res) => { const db = readDb(); const c = db.championships.find(x => x.id === req.params.id); if (!c) return res.sendStatus(404); const incoming = req.body?.position_highlights || {}; const enabled = incoming.enabled !== false; const colors = Array.isArray(incoming.colors) ? incoming.colors.slice(0, 8).map(x => String(x)) : []; c.position_highlights = { enabled, colors: colors.length ? colors : ['#183b63','#254d3a','#5a4a1f','#4b2630'] }; writeDb(db); res.json(c.position_highlights); });
app.delete('/api/championships/:id', requireRole('owner'), (req, res) => { const db = readDb(); db.championships = db.championships.filter(c => c.id !== req.params.id); db.matches = db.matches.filter(m => m.championship_id !== req.params.id); writeDb(db); res.sendStatus(204); });
app.post('/api/championships/:id/generate', (req, res) => {
  const db = readDb(); const ch = db.championships.find(c => c.id === req.params.id); if (!ch) return res.sendStatus(404);
  clearMatches(db, ch.id); const ids = (ch.participant_ids || []).filter(id => db.players.some(p => p.id === id)); if (ids.length < 2) return res.status(400).json({ error: 'O campeonato precisa de pelo menos 2 participantes.' });
  let count = 0; if (ch.type === 'league') count = generateLeague(db, ch, ids); else if (ch.type === 'knockout') count = generateKnockout(db, ch, ids); else count = generateGroups(db, ch, ids);
  ch.status = 'active'; ch.generated_at = new Date().toISOString(); writeDb(db); res.json({ count, championship: ch });
});
app.get('/api/championships/:id/matches', (req, res) => { const db = readDb(); const ms = db.matches.filter(m => m.championship_id === req.params.id).sort((a, b) => (a.round || 0) - (b.round || 0) || (a.tie_order || 0) - (b.tie_order || 0) || (a.leg || 0) - (b.leg || 0)); res.json(ms.map(m => ({ ...m, home_name: playerName(db, m.home_id), away_name: playerName(db, m.away_id), home_logo: playerView(db,db.players.find(p=>p.id===m.home_id)||{}).logo_url, away_logo: playerView(db,db.players.find(p=>p.id===m.away_id)||{}).logo_url }))); });
app.patch('/api/matches/:id/result', (req, res) => { const db = readDb(); const m = db.matches.find(x => x.id === req.params.id); if (!m) return res.sendStatus(404); if (m.status === 'bye') return res.status(400).json({ error: 'Confronto por bye não recebe placar.' }); const { home_score, away_score, winner_id = null } = req.body; if (home_score === '' || away_score === '' || home_score == null || away_score == null || Number(home_score) < 0 || Number(away_score) < 0) return res.status(400).json({ error: 'Placar inválido.' }); m.home_score = Number(home_score); m.away_score = Number(away_score); m.status = 'played'; if (winner_id) m.winner_id = winner_id; const ch = db.championships.find(c => c.id === m.championship_id); if (ch?.type !== 'league') resolveKnockoutProgress(db, ch); if (ch?.type === 'groups') advanceGroups(db, ch); writeDb(db); res.json({ ok: true }); });
app.post('/api/championships/:id/advance', (req, res) => { const db = readDb(); const ch = db.championships.find(c => c.id === req.params.id); if (!ch) return res.sendStatus(404); if (ch.type !== 'groups') return res.status(400).json({ error: 'Apenas grupos + mata-mata usa avanço de fase.' }); const ok = advanceGroups(db, ch); if (!ok) return res.status(400).json({ error: 'Finalize todos os jogos da fase de grupos antes de avançar.' }); writeDb(db); res.json({ ok: true }); });
app.get('/api/championships/:id/standings', (req, res) => { const db = readDb(); const ch = db.championships.find(c => c.id === req.params.id); if (!ch) return res.sendStatus(404); if (ch.type === 'groups') return res.json({ groups: (ch.groups || []).map(g => ({ name: g.name, rows: standingsFor(db, ch, g.name) })) }); res.json({ groups: [{ name: 'Classificação', rows: standingsFor(db, ch) }] }); });
app.get('/api/championships/:id/stats', (req, res) => { const db = readDb(); const ch = db.championships.find(c => c.id === req.params.id); if (!ch) return res.sendStatus(404); const ms = db.matches.filter(m => m.championship_id === ch.id && m.status === 'played'); const goals = ms.reduce((s, m) => s + Number(m.home_score) + Number(m.away_score), 0); const scorers = {}; ms.forEach(m => { if (m.home_score > m.away_score) scorers[m.home_id] = (scorers[m.home_id] || 0) + Number(m.home_score); if (m.away_score > m.home_score) scorers[m.away_id] = (scorers[m.away_id] || 0) + Number(m.away_score); }); res.json({ played: ms.length, goals, avg_goals: ms.length ? goals / ms.length : 0, top_scorers: Object.entries(scorers).sort((a,b) => b[1]-a[1]).slice(0, 10).map(([id, g]) => ({ id, name: playerName(db,id), wins: g })), champion: championFor(db,ch) }); });
app.post('/api/championships/:id/share', (req, res) => { const db = readDb(); const ch = db.championships.find(c => c.id === req.params.id); if (!ch) return res.sendStatus(404); let share = db.shares.find(s => s.championship_id === ch.id); if (!share) { share = { token: nanoid(12), championship_id: ch.id, created_at: new Date().toISOString() }; db.shares.push(share); writeDb(db); } res.json({ token: share.token, path: `/share/${share.token}` }); });
app.get('/api/share/:token', (req,res) => { const db=readDb(); const share=db.shares.find(s=>s.token===req.params.token); if(!share) return res.status(404).json({error:'Link de compartilhamento inválido.'}); const ch=db.championships.find(c=>c.id===share.championship_id); if(!ch) return res.status(404).json({error:'Campeonato não encontrado.'}); res.json(publicData(db,ch)); });
app.get('/api/teams/logo', (req,res) => { const team=String(req.query.name||'').trim(); res.json({ team, logo_url: logoForTeam(team) }); });
app.get('/api/dashboard', (_, res) => { const db = readDb(); res.json({ players: db.players.length, championships: db.championships.length, matches: db.matches.filter(m => m.status === 'played').length, scheduled: db.matches.filter(m => m.status === 'scheduled').length }); });

export { app };

if (!useNetlifyBlobs) {
  app.listen(process.env.PORT || 4000, '0.0.0.0', () => console.log(`NXL API on http://localhost:${process.env.PORT || 4000}`));
}
