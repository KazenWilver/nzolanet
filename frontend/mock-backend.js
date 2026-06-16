import express from 'express';
import cors from 'cors';
import multer from 'multer';

const app = express();
app.use(cors());
app.use(express.json());

// Middleware para garantir que a rota /api/posts/search é tratada antes de rotas com parâmetros
app.use((req, res, next) => {
  if (req.method === 'GET' && req.path === '/api/posts/search') {
    const q = (req.query.q || '').toString().toLowerCase();
    const pagina = parseInt(req.query.pagina ?? '1', 10);
    const porPagina = parseInt(req.query.porPagina ?? '10', 10);
    const start = (pagina - 1) * porPagina;
    const resultado = posts.filter(p => {
      const autor = p.autorNomeUtilizador?.toLowerCase() ?? '';
      const texto = p.texto?.toLowerCase() ?? '';
      return q === '' || texto.includes(q) || autor.includes(q);
    });
    return res.json(resultado.slice(start, start + porPagina).map(transformarPost));
  }
  next();
});

const upload = multer();
const PORT = 5000;
const TOKEN_PREFIX = 'mock-token-';

const users = [
  {
    id: 1,
    nome: 'Demo User',
    nomeUtilizador: 'demo',
    email: 'demo@demo.com',
    fotoPerfil: '',
    fotoCapa: '',
    bio: 'Conta de demonstração',
    localizacao: 'Luanda, Angola',
    totalSeguidores: 10,
    totalSeguindo: 5,
    totalPublicacoes: 3,
    privado: false,
    eAdmin: true,
    criadoEm: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 2,
    nome: 'Ana Silva',
    nomeUtilizador: 'ana',
    email: 'ana@demo.com',
    fotoPerfil: '',
    fotoCapa: '',
    bio: 'Fotógrafa amadora',
    localizacao: 'Porto, Portugal',
    totalSeguidores: 120,
    totalSeguindo: 75,
    totalPublicacoes: 8,
    privado: false,
    eAdmin: false,
    criadoEm: '2025-11-02T12:00:00.000Z'
  },
  {
    id: 3,
    nome: 'João Privado',
    nomeUtilizador: 'joao',
    email: 'joao@demo.com',
    fotoPerfil: '',
    fotoCapa: '',
    bio: 'Conta privada para testar privacidade',
    localizacao: 'Lisboa, Portugal',
    totalSeguidores: 2,
    totalSeguindo: 1,
    totalPublicacoes: 1,
    privado: true,
    eAdmin: false,
    criadoEm: '2026-02-14T09:00:00.000Z'
  },
  {
    id: 4,
    nome: 'Marta',
    nomeUtilizador: 'marta',
    email: 'marta@demo.com',
    fotoPerfil: '',
    fotoCapa: '',
    bio: 'Designer',
    localizacao: 'Coimbra, Portugal',
    totalSeguidores: 45,
    totalSeguindo: 30,
    totalPublicacoes: 5,
    privado: false,
    eAdmin: false,
    criadoEm: '2024-08-20T08:00:00.000Z'
  }
];

const posts = [
  {
    id: 1,
    autorId: 1,
    autorNome: 'Demo User',
    autorFoto: '',
    autorNomeUtilizador: 'demo',
    texto: 'Bem-vindo ao mock feed! Este post serve para testar a interface.',
    imagemUrl: '',
    videoUrl: '',
    totalBazes: 3,
    totalComentarios: 1,
    utilizadorDeuBaze: false,
    criadoEm: '2026-06-01T10:00:00.000Z'
  },
  {
    id: 2,
    autorId: 2,
    autorNome: 'Ana Silva',
    autorFoto: '',
    autorNomeUtilizador: 'ana',
    texto: 'Explorando a cidade durante o fim-de-semana. #fotografia',
    imagemUrl: 'https://via.placeholder.com/800x600.png',
    videoUrl: '',
    totalBazes: 25,
    totalComentarios: 4,
    utilizadorDeuBaze: false,
    criadoEm: '2026-05-25T14:30:00.000Z'
  },
  {
    id: 3,
    autorId: 4,
    autorNome: 'Marta',
    autorFoto: '',
    autorNomeUtilizador: 'marta',
    texto: 'Novo design do meu portefólio! Deixem feedback.',
    imagemUrl: '',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    totalBazes: 10,
    totalComentarios: 2,
    utilizadorDeuBaze: true,
    criadoEm: '2026-04-10T09:00:00.000Z'
  },
  {
    id: 4,
    autorId: 3,
    autorNome: 'João Privado',
    autorFoto: '',
    autorNomeUtilizador: 'joao',
    texto: 'Post privado para testar visibilidade.',
    imagemUrl: '',
    videoUrl: '',
    totalBazes: 0,
    totalComentarios: 0,
    utilizadorDeuBaze: false,
    criadoEm: '2026-03-01T08:00:00.000Z'
  }
];

const comments = [
  {
    id: 1,
    postId: 1,
    autorId: 1,
    autorNome: 'Demo User',
    autorFoto: '',
    autorNomeUtilizador: 'demo',
    texto: 'Comentário de exemplo no post.',
    criadoEm: '2026-06-01T10:15:00.000Z',
    reports: []
  },
  {
    id: 2,
    postId: 2,
    autorId: 1,
    autorNome: 'Demo User',
    autorFoto: '',
    autorNomeUtilizador: 'demo',
    texto: 'Bela foto, Ana!',
    criadoEm: '2026-05-25T15:00:00.000Z',
    reports: []
  },
  {
    id: 3,
    postId: 3,
    autorId: 2,
    autorNome: 'Ana Silva',
    autorFoto: '',
    autorNomeUtilizador: 'ana',
    texto: 'Adoro o novo look!',
    criadoEm: '2026-04-10T10:00:00.000Z',
    reports: []
  }
];

function criarTokenParaUtilizador(utilizador) {
  return `${TOKEN_PREFIX}${utilizador.id}`;
}

const followRequests = [];

function transformarUtilizador(u) {
  if (!u) return u;
  const mapped = { ...u };
  mapped.username = u.nomeUtilizador;
  mapped.profilePhoto = u.fotoPerfil || '';
  mapped.followersCount = u.totalSeguidores || 0;
  mapped.followingCount = u.totalSeguindo || 0;
  mapped.isPrivate = u.privado || false;
  mapped.createdAt = u.criadoEm;
  return mapped;
}

function transformarPost(p) {
  if (!p) return p;
  const user = users.find(u => u.id === p.autorId);
  const mapped = { ...p };
  mapped.userId = p.autorId;
  mapped.userName = p.autorNome || (user ? user.nome : 'Utilizador');
  mapped.userPhoto = p.autorFoto || (user ? user.fotoPerfil : '');
  mapped.text = p.texto;
  mapped.imageUrl = p.imagemUrl || '';
  mapped.videoUrl = p.videoUrl || '';
  mapped.commentsCount = p.totalComentarios || 0;
  mapped.createdAt = p.criadoEm;
  return mapped;
}

function transformarComentario(comentario, utilizador = null) {
  const reports = Array.isArray(comentario.reports) ? comentario.reports : [];
  const user = users.find(u => u.id === comentario.autorId || u.id === comentario.utilizadorId);
  return {
    ...comentario,
    reportsCount: reports.length,
    reportadoPorMim: utilizador ? reports.some(r => r.userId === utilizador.id) : false,
    
    // English mapping
    userId: comentario.autorId || comentario.utilizadorId,
    userName: comentario.autorNome || comentario.utilizadorNome || (user ? user.nome : 'Utilizador'),
    userPhoto: comentario.autorFoto || (user ? user.fotoPerfil : ''),
    text: comentario.texto,
    createdAt: comentario.criadoEm
  };
}

function findUserByToken(req) {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return null;
  const token = auth.replace('Bearer ', '').trim();
  if (!token.startsWith(TOKEN_PREFIX)) return null;
  const id = parseInt(token.replace(TOKEN_PREFIX, ''), 10);
  return users.find(u => u.id === id) || null;
}

// Seguidores: pares { followerId, followingId }
const follows = [
  { followerId: 2, followingId: 1 },
  { followerId: 4, followingId: 1 },
  { followerId: 1, followingId: 2 },
  { followerId: 1, followingId: 4 }
];

const notificacoes = [
  { id: 1, tipo: 'baze', utilizadorId: 2, utilizadorNome: 'ana', postId: 2, lida: false, criadoEm: '2026-05-26T09:00:00.000Z' },
  { id: 2, tipo: 'comentario', utilizadorId: 1, utilizadorNome: 'demo', postId: 2, lida: false, criadoEm: '2026-05-26T09:05:00.000Z' },
  { id: 3, tipo: 'seguidor', utilizadorId: 4, utilizadorNome: 'marta', lida: true, criadoEm: '2026-04-11T11:00:00.000Z' }
];

app.post('/api/auth/login', (req, res) => {
  const email = req.body.email || req.body.usernameOrEmail;
  const senha = req.body.senha || req.body.password;
  const user = users.find(u => u.email === email || u.nomeUtilizador === email);
  if (!user || senha !== 'senha123') {
    return res.status(401).json({ message: 'Email ou senha incorrectos.' });
  }
  // Não expor a flag `eAdmin` diretamente na resposta para evitar revelar existência do painel
  const utilizadorSemFlag = { ...user };
  delete utilizadorSemFlag.eAdmin;
  return res.json({ token: criarTokenParaUtilizador(user), utilizador: transformarUtilizador(utilizadorSemFlag) });
});

const handleRegister = (req, res) => {
  const nome = req.body.nome || req.body.username;
  const nomeUtilizador = req.body.nomeUtilizador || req.body.username;
  const email = req.body.email;
  const senha = req.body.senha || req.body.password;
  
  if (!nomeUtilizador || !email || !senha) {
    return res.status(400).json({ message: 'Dados inválidos.' });
  }
  const exists = users.some(u => u.email === email || u.nomeUtilizador === nomeUtilizador);
  if (exists) return res.status(400).json({ message: 'Utilizador já existe.' });
  const novo = {
    id: users.length + 1,
    nome: nome || nomeUtilizador,
    nomeUtilizador,
    email,
    fotoPerfil: '',
    fotoCapa: '',
    bio: '',
    localizacao: '',
    totalSeguidores: 0,
    totalSeguindo: 0,
    totalPublicacoes: 0,
    privado: false,
    eAdmin: false,
    criadoEm: new Date().toISOString()
  };
  users.push(novo);
  return res.json({ token: criarTokenParaUtilizador(novo), utilizador: transformarUtilizador(novo) });
};

app.post('/api/auth/registar', handleRegister);
app.post('/api/auth/register', handleRegister);

app.post('/api/auth/recuperar-senha', (req, res) => {
  return res.status(200).json({});
});

app.get('/api/auth/me', (req, res) => {
  const user = findUserByToken(req);
  if (!user) return res.status(401).json({ message: 'Token inválido.' });
  const utilizadorSemFlag = { ...user };
  delete utilizadorSemFlag.eAdmin;
  return res.json(transformarUtilizador(utilizadorSemFlag));
});

// Endpoint para verificar, no servidor, se o token pertence a um administrador.
app.get('/api/auth/check-admin', (req, res) => {
  const user = findUserByToken(req);
  if (!user || !user.eAdmin) return res.status(403).json({ message: 'Acesso negado.' });
  return res.status(200).json({ isAdmin: true });
});

// ===== ENDPOINTS DE ADMIN (Login e Verificação Separada) =====

const ADMIN_TOKEN_PREFIX = 'admin-token-';
const adminCredenciais = {
  email: 'admin@nzolanet.com',
  senha: 'AdminSeguro2024!'
};

function criarTokenAdmin() {
  return `${ADMIN_TOKEN_PREFIX}${Date.now()}`;
}

function verificarTokenAdmin(token) {
  // Em produção, isto seria validado com JWT e assinado com uma chave secreta
  return token.startsWith(ADMIN_TOKEN_PREFIX);
}

function findAdminToken(req) {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return null;
  const token = auth.replace('Bearer ', '').trim();
  return verificarTokenAdmin(token) ? token : null;
}

app.post('/api/admin/login', (req, res) => {
  const { email, senha } = req.body;
  if (email !== adminCredenciais.email || senha !== adminCredenciais.senha) {
    return res.status(401).json({ message: 'Email ou senha de administrador incorrectos.' });
  }
  const token = criarTokenAdmin();
  return res.json({ token, message: 'Login de administrador bem-sucedido.' });
});

app.get('/api/admin/verify-access', (req, res) => {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return res.status(401).json({ message: 'Token inválido.' });
  const token = auth.replace('Bearer ', '').trim();
  if (!verificarTokenAdmin(token)) return res.status(403).json({ message: 'Acesso negado.' });
  return res.status(200).json({ isAdmin: true });
});

app.get('/api/posts/feed', (req, res) => {
  const pagina = parseInt(req.query.pagina ?? '1', 10);
  const porPagina = parseInt(req.query.porPagina ?? '10', 10);
  const start = (pagina - 1) * porPagina;
  // Simula feed: retorna posts públicos e posts dos utilizadores seguidos
  const user = findUserByToken(req);
  const followedIds = user ? follows.filter(f => f.followerId === user.id).map(f => f.followingId) : [];
  const feed = posts.filter(p => !users.find(u => u.id === p.autorId)?.privado || followedIds.includes(p.autorId));
  return res.json(feed.slice(start, start + porPagina).map(transformarPost));
});

// Pesquisa por texto e por autor (nomeUtilizador)
app.get('/api/posts/search', (req, res) => {
  const q = (req.query.q || '').toString().toLowerCase();
  const pagina = parseInt(req.query.pagina ?? '1', 10);
  const porPagina = parseInt(req.query.porPagina ?? '10', 10);
  const start = (pagina - 1) * porPagina;
  const resultado = posts.filter(p => {
    const autor = p.autorNomeUtilizador?.toLowerCase() ?? '';
    const texto = p.texto?.toLowerCase() ?? '';
    return q === '' || texto.includes(q) || autor.includes(q);
  });
  return res.json(resultado.slice(start, start + porPagina).map(transformarPost));
});

// Rota alternativa para pesquisa (caso haja conflitos com rotas parametrizadas)
app.get('/api/search/posts', (req, res) => {
  const q = (req.query.q || '').toString().toLowerCase();
  const pagina = parseInt(req.query.pagina ?? '1', 10);
  const porPagina = parseInt(req.query.porPagina ?? '10', 10);
  const start = (pagina - 1) * porPagina;
  const resultado = posts.filter(p => {
    const autor = p.autorNomeUtilizador?.toLowerCase() ?? '';
    const texto = p.texto?.toLowerCase() ?? '';
    return q === '' || texto.includes(q) || autor.includes(q);
  });
  return res.json(resultado.slice(start, start + porPagina).map(transformarPost));
});

// Nota: endpoint de debug removido para evitar exposição das rotas em ambiente de desenvolvimento.

app.get('/api/posts/:id', (req, res) => {
  const post = posts.find(p => p.id === Number(req.params.id));
  if (!post) return res.status(404).json({ message: 'Post não encontrado.' });
  return res.json(transformarPost(post));
});

app.get('/api/posts/utilizador/:id', (req, res) => {
  const lista = posts.filter(p => p.autorId === Number(req.params.id));
  return res.json(lista.map(transformarPost));
});

app.post('/api/posts', upload.fields([{ name: 'imagem' }, { name: 'video' }]), (req, res) => {
  const texto = req.body.Text || req.body.texto || '';
  const novo = {
    id: posts.length + 1,
    autorId: 1,
    autorNome: 'Demo User',
    autorFoto: '',
    autorNomeUtilizador: 'demo',
    texto,
    imagemUrl: '',
    videoUrl: '',
    totalBazes: 0,
    totalComentarios: 0,
    utilizadorDeuBaze: false,
    criadoEm: new Date().toISOString()
  };
  posts.unshift(novo);
  return res.json(transformarPost(novo));
});

app.put('/api/posts/:id', (req, res) => {
  const post = posts.find(p => p.id === Number(req.params.id));
  if (!post) return res.status(404).json({ message: 'Post não encontrado.' });
  const criado = new Date(post.criadoEm).getTime();
  const limiteEdicao = 1000 * 60 * 60 * 24 * 7; // 7 dias
  if (Date.now() - criado > limiteEdicao) {
    return res.status(403).json({ message: 'O prazo de edição desta publicação expirou.' });
  }
  post.texto = req.body.Text ?? req.body.texto ?? post.texto;
  post.atualizadoEm = new Date().toISOString();
  return res.json(transformarPost(post));
});

app.delete('/api/posts/:id', (req, res) => {
  const index = posts.findIndex(p => p.id === Number(req.params.id));
  if (index === -1) return res.status(404).json({ message: 'Post não encontrado.' });
  posts.splice(index, 1);
  return res.status(204).send();
});

app.post('/api/posts/:id/baze', (req, res) => {
  const post = posts.find(p => p.id === Number(req.params.id));
  if (!post) return res.status(404).json({ message: 'Post não encontrado.' });
  post.totalBazes += 1;
  post.utilizadorDeuBaze = true;
  return res.json({ totalBazes: post.totalBazes });
});

app.delete('/api/posts/:id/baze', (req, res) => {
  const post = posts.find(p => p.id === Number(req.params.id));
  if (!post) return res.status(404).json({ message: 'Post não encontrado.' });
  post.totalBazes = Math.max(0, post.totalBazes - 1);
  post.utilizadorDeuBaze = false;
  return res.json({ totalBazes: post.totalBazes });
});

app.get('/api/comments/post/:postId', (req, res) => {
  const user = findUserByToken(req);
  const lista = comments.filter(c => c.postId === Number(req.params.postId));
  return res.json(lista.map(c => transformarComentario(c, user)));
});

app.post('/api/comments', (req, res) => {
  const user = findUserByToken(req);
  const { postId, texto } = req.body;
  const novo = {
    id: comments.length + 1,
    postId: Number(postId),
    autorId: 1,
    autorNome: 'Demo User',
    autorFoto: '',
    autorNomeUtilizador: 'demo',
    texto,
    criadoEm: new Date().toISOString(),
    reports: []
  };
  comments.unshift(novo);
  const post = posts.find(p => p.id === Number(postId));
  if (post) post.totalComentarios += 1;
  return res.json(transformarComentario(novo, user));
});

app.put('/api/comments/:id', (req, res) => {
  const user = findUserByToken(req);
  const comentario = comments.find(c => c.id === Number(req.params.id));
  if (!comentario) return res.status(404).json({ message: 'Comentário não encontrado.' });
  const criado = new Date(comentario.criadoEm).getTime();
  const limiteEdicao = 1000 * 60 * 60 * 24 * 7; // 7 dias
  if (Date.now() - criado > limiteEdicao) {
    return res.status(403).json({ message: 'O prazo de edição deste comentário expirou.' });
  }
  comentario.texto = req.body.texto ?? comentario.texto;
  comentario.atualizadoEm = new Date().toISOString();
  return res.json(transformarComentario(comentario, user));
});

app.post('/api/comments/:id/report', (req, res) => {
  const user = findUserByToken(req);
  if (!user) return res.status(401).json({ message: 'Token inválido.' });
  const comentario = comments.find(c => c.id === Number(req.params.id));
  if (!comentario) return res.status(404).json({ message: 'Comentário não encontrado.' });
  if (!comentario.reports) comentario.reports = [];
  const motivo = req.body.motivo || 'Sem descrição';
  // Registar denúncia com motivo e utilizador
  if (!comentario.reports.find(r => r.userId === user.id)) {
    comentario.reports.push({ userId: user.id, motivo, criadoEm: new Date().toISOString() });
  }
  return res.json(transformarComentario(comentario, user));
});

app.delete('/api/comments/:id', (req, res) => {
  const index = comments.findIndex(c => c.id === Number(req.params.id));
  if (index === -1) return res.status(404).json({ message: 'Comentário não encontrado.' });
  const [removido] = comments.splice(index, 1);
  const post = posts.find(p => p.id === removido.postId);
  if (post) post.totalComentarios = Math.max(0, post.totalComentarios - 1);
  return res.status(204).send();
});

app.get('/api/admin/metrics', (req, res) => {
  const token = findAdminToken(req);
  if (!token) return res.status(403).json({ message: 'Acesso negado.' });
  const totalComentariosDenunciados = comments.reduce((acc, comentario) => acc + ((comentario.reports || []).length > 0 ? 1 : 0), 0);
  const totalBazes = posts.reduce((acc, post) => acc + (post.totalBazes || 0), 0);
  return res.json({
    totalUtilizadores: users.length,
    totalPublicacoes: posts.length,
    totalComentarios: comments.length,
    totalComentariosDenunciados,
    totalBazes
  });
});

app.get('/api/admin/comments/reported', (req, res) => {
  const token = findAdminToken(req);
  if (!token) return res.status(403).json({ message: 'Acesso negado.' });
  const denunciados = comments.filter(c => (c.reports || []).length > 0).map(c => transformarComentario(c));
  return res.json(denunciados);
});

app.get('/api/users/:id', (req, res) => {
  const user = users.find(u => u.id === Number(req.params.id));
  if (!user) return res.status(404).json({ message: 'Utilizador não encontrado.' });
  return res.json(transformarUtilizador(user));
});

app.get('/api/users/:id/seguidores', (req, res) => {
  const id = Number(req.params.id);
  const seguidores = follows.filter(f => f.followingId === id).map(f => users.find(u => u.id === f.followerId));
  return res.json(seguidores.filter(Boolean).map(transformarUtilizador));
});

app.get('/api/users/:id/seguindo', (req, res) => {
  const id = Number(req.params.id);
  const seguindo = follows.filter(f => f.followerId === id).map(f => users.find(u => u.id === f.followingId));
  return res.json(seguindo.filter(Boolean).map(transformarUtilizador));
});

app.post('/api/users/:id/seguir', (req, res) => {
  const alvo = Number(req.params.id);
  const user = findUserByToken(req);
  if (!user) return res.status(401).json({ message: 'Token inválido.' });
  if (user.id === alvo) return res.status(400).json({ message: 'Não pode seguir a si próprio.' });
  const exists = follows.some(f => f.followerId === user.id && f.followingId === alvo);
  if (!exists) {
    follows.push({ followerId: user.id, followingId: alvo });
    const alvoUser = users.find(u => u.id === alvo);
    if (alvoUser) alvoUser.totalSeguidores += 1;
    user.totalSeguindo += 1;
    // criar notificação de seguidor
    notificacoes.unshift({ id: notificacoes.length + 1, tipo: 'seguidor', utilizadorId: user.id, utilizadorNome: user.nomeUtilizador, lida: false, criadoEm: new Date().toISOString() });
  }
  return res.status(200).json({});
});

app.delete('/api/users/:id/seguir', (req, res) => {
  const alvo = Number(req.params.id);
  const user = findUserByToken(req);
  if (!user) return res.status(401).json({ message: 'Token inválido.' });
  const idx = follows.findIndex(f => f.followerId === user.id && f.followingId === alvo);
  if (idx !== -1) {
    follows.splice(idx, 1);
    const alvoUser = users.find(u => u.id === alvo);
    if (alvoUser) alvoUser.totalSeguidores = Math.max(0, alvoUser.totalSeguidores - 1);
    user.totalSeguindo = Math.max(0, user.totalSeguindo - 1);
  }
  return res.status(200).json({});
});

app.put('/api/users/:id', upload.none(), (req, res) => {
  const user = users.find(u => u.id === Number(req.params.id));
  if (!user) return res.status(404).json({ message: 'Utilizador não encontrado.' });
  user.nome = req.body.nome ?? user.nome;
  user.nomeUtilizador = req.body.nomeUtilizador ?? user.nomeUtilizador;
  user.bio = req.body.bio ?? user.bio;
  user.localizacao = req.body.localizacao ?? user.localizacao;
  return res.json(transformarUtilizador(user));
});

app.post('/api/upload/imagem', upload.single('ficheiro'), (req, res) => {
  return res.json({ url: 'https://via.placeholder.com/400x300.png' });
});

app.post('/api/upload/video', upload.single('ficheiro'), (req, res) => {
  return res.json({ url: 'https://www.w3schools.com/html/mov_bbb.mp4' });
});

// Notificações
app.get('/api/notificacoes', (req, res) => {
  const user = findUserByToken(req);
  if (!user) return res.status(401).json({ message: 'Token inválido.' });
  // Em mock, retornamos todas as notificações para facilitar os testes
  return res.json(notificacoes);
});

app.post('/api/notificacoes/marcar-lidas', (req, res) => {
  const user = findUserByToken(req);
  if (!user) return res.status(401).json({ message: 'Token inválido.' });
  notificacoes.forEach(n => n.lida = true);
  return res.status(200).json({});
});

app.delete('/api/notificacoes/:id', (req, res) => {
  const id = Number(req.params.id);
  const idx = notificacoes.findIndex(n => n.id === id);
  if (idx === -1) return res.status(404).json({ message: 'Notificação não encontrada.' });
  notificacoes.splice(idx, 1);
  return res.status(204).send();
});

app.listen(PORT, () => {
  console.log(`Mock backend a correr em http://localhost:${PORT}`);
});