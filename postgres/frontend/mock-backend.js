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
const bookmarks = [];
const conversations = [
  {
    id: 'conv-1',
    title: null,
    isGroup: false,
    participantIds: [1, 2],
    lastMessageAt: '2026-06-30T12:00:00.000Z'
  }
];
const conversationMessages = [
  {
    id: 'msg-1',
    conversationId: 'conv-1',
    senderId: '2',
    senderUsername: 'ana',
    senderDisplayName: 'Ana Silva',
    senderPhotoUrl: '',
    text: 'Olá! Esta é uma mensagem de teste.',
    imageUrl: '',
    videoUrl: '',
    remoteImageUrl: '',
    forwardedFromMessageId: null,
    isEdited: false,
    isDeletedForEveryone: false,
    isGif: false,
    createdAt: '2026-06-30T12:00:00.000Z',
    reactions: [],
    replyTo: null
  }
];

function transformarUtilizador(u) {
  if (!u) return u;
  return mapUserDto(u);
}

function mapUserDto(u) {
  return {
    id: String(u.id),
    username: u.nomeUtilizador,
    displayName: u.nome,
    email: u.email,
    bio: u.bio || '',
    profilePhotoUrl: u.fotoPerfil || '',
    coverPhotoUrl: u.fotoCapa || '',
    isPrivate: u.privado || false,
    followersCount: u.totalSeguidores || 0,
    followingCount: u.totalSeguindo || 0,
    createdAt: u.criadoEm
  };
}

function mapPostToPublication(post, currentUser = null) {
  const author = users.find(u => u.id === post.autorId);
  const bookmarksCount = bookmarks.filter(bookmark => bookmark.postId === post.id).length;
  const hasBookmarked = !!currentUser && bookmarks.some(
    bookmark => bookmark.userId === currentUser.id && bookmark.postId === post.id
  );
  return {
    id: String(post.id),
    text: post.texto,
    imageUrl: post.imagemUrl || '',
    videoUrl: post.videoUrl || '',
    createdAt: post.criadoEm,
    updatedAt: post.criadoEm,
    authorId: String(post.autorId),
    authorUsername: author?.nomeUtilizador || post.autorNomeUtilizador || 'user',
    authorDisplayName: author?.nome || post.autorNome || 'Utilizador',
    authorPhotoUrl: author?.fotoPerfil || '',
    likesCount: post.totalBazes || 0,
    commentsCount: post.totalComentarios || 0,
    repostsCount: post.repostsCount || 0,
    bookmarksCount,
    hasLiked: !!post.utilizadorDeuBaze,
    hasReposted: !!post.hasReposted,
    hasBookmarked
  };
}

function paginatePublications(items, page, pageSize) {
  const safePage = Math.max(1, page);
  const safeSize = Math.max(1, pageSize);
  const start = (safePage - 1) * safeSize;
  const slice = items.slice(start, start + safeSize);
  return {
    items: slice,
    page: safePage,
    pageSize: safeSize,
    totalCount: items.length,
    hasMore: start + safeSize < items.length
  };
}

function getVisibleFeedPosts(currentUser) {
  const followedIds = currentUser
    ? follows.filter(f => f.followerId === currentUser.id).map(f => f.followingId)
    : [];
  return posts.filter(post => {
    const author = users.find(u => u.id === post.autorId);
    return !author?.privado || followedIds.includes(post.autorId) || post.autorId === currentUser?.id;
  });
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
  return res.json({ token: criarTokenParaUtilizador(user), user: mapUserDto(utilizadorSemFlag) });
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
  return res.json({ token: criarTokenParaUtilizador(novo), user: mapUserDto(novo) });
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

app.get('/api/users/search', (req, res) => {
  const q = (req.query.q || '').toString().toLowerCase();
  if (q.length < 2) return res.json([]);
  const results = users.filter(u =>
    u.nomeUtilizador.toLowerCase().includes(q) ||
    u.nome.toLowerCase().includes(q) ||
    u.email.toLowerCase().includes(q)
  );
  return res.json(results.map(mapUserDto));
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

function mapNotificationDto(notification) {
  const actor = users.find(u => u.id === notification.utilizadorId);
  const typeMap = {
    baze: 'baze',
    comentario: 'comment',
    seguidor: 'follow',
    pedido_seguir: 'follow_request',
    mensagem: 'message'
  };

  return {
    id: String(notification.id),
    type: typeMap[notification.tipo] || 'baze',
    isRead: notification.lida ?? false,
    createdAt: notification.criadoEm,
    actorId: String(notification.utilizadorId),
    actorUsername: actor?.nomeUtilizador || notification.utilizadorNome || 'user',
    actorDisplayName: actor?.nome || notification.utilizadorNome || 'Utilizador',
    actorPhotoUrl: actor?.fotoPerfil || '',
    publicationId: notification.postId ? String(notification.postId) : undefined,
    publicationText: notification.postId
      ? posts.find(p => p.id === notification.postId)?.texto
      : undefined,
    conversationId: notification.conversationId,
    messageText: notification.messageText
  };
}

// ── API moderna (publications / notifications / users) ──
app.get('/api/publications', (req, res) => {
  const page = parseInt(req.query.page ?? '1', 10);
  const pageSize = parseInt(req.query.pageSize ?? '20', 10);
  const mapped = posts.map(post => mapPostToPublication(post));
  return res.json(paginatePublications(mapped, page, pageSize));
});

app.get('/api/publications/feed', (req, res) => {
  const page = parseInt(req.query.page ?? '1', 10);
  const pageSize = parseInt(req.query.pageSize ?? '20', 10);
  const user = findUserByToken(req);
  const feed = getVisibleFeedPosts(user).map(post => mapPostToPublication(post, user));
  return res.json(paginatePublications(feed, page, pageSize));
});

app.get('/api/publications/user/:id', (req, res) => {
  const userId = Number(req.params.id);
  const page = parseInt(req.query.page ?? '1', 10);
  const pageSize = parseInt(req.query.pageSize ?? '20', 10);
  const mediaOnly = req.query.mediaOnly === 'true';
  let userPosts = posts.filter(p => p.autorId === userId);
  if (mediaOnly) {
    userPosts = userPosts.filter(p => p.imagemUrl || p.videoUrl);
  }
  const mapped = userPosts.map(post => mapPostToPublication(post));
  return res.json(paginatePublications(mapped, page, pageSize));
});

app.get('/api/publications/:id', (req, res) => {
  const post = posts.find(p => String(p.id) === req.params.id);
  if (!post) return res.status(404).json({ message: 'Publicação não encontrada.' });
  return res.json(mapPostToPublication(post));
});

app.post('/api/publications', upload.fields([{ name: 'image' }, { name: 'video' }, { name: 'imagem' }]), (req, res) => {
  const user = findUserByToken(req) || users[0];
  const text = req.body.text || req.body.Text || req.body.texto || '';
  const novo = {
    id: posts.length + 1,
    autorId: user.id,
    autorNome: user.nome,
    autorFoto: user.fotoPerfil || '',
    autorNomeUtilizador: user.nomeUtilizador,
    texto: text,
    imagemUrl: '',
    videoUrl: '',
    totalBazes: 0,
    totalComentarios: 0,
    utilizadorDeuBaze: false,
    criadoEm: new Date().toISOString()
  };
  posts.unshift(novo);
  return res.status(201).json(mapPostToPublication(novo));
});

app.put('/api/publications/:id', (req, res) => {
  const post = posts.find(p => String(p.id) === req.params.id);
  if (!post) return res.status(404).json({ message: 'Publicação não encontrada.' });
  post.texto = req.body.text ?? post.texto;
  return res.json(mapPostToPublication(post));
});

app.delete('/api/publications/:id', (req, res) => {
  const idx = posts.findIndex(p => String(p.id) === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Publicação não encontrada.' });
  posts.splice(idx, 1);
  return res.status(204).send();
});

app.post('/api/publications/:id/like', (req, res) => {
  const post = posts.find(p => String(p.id) === req.params.id);
  if (!post) return res.status(404).json({ message: 'Publicação não encontrada.' });
  post.totalBazes = (post.totalBazes || 0) + 1;
  post.utilizadorDeuBaze = true;
  return res.status(200).send();
});

app.delete('/api/publications/:id/like', (req, res) => {
  const post = posts.find(p => String(p.id) === req.params.id);
  if (!post) return res.status(404).json({ message: 'Publicação não encontrada.' });
  post.totalBazes = Math.max(0, (post.totalBazes || 0) - 1);
  post.utilizadorDeuBaze = false;
  return res.status(204).send();
});

app.get('/api/publications/hashtag/:tag', (req, res) => {
  const tag = String(req.params.tag || '').toLowerCase().replace(/^#/, '');
  const page = parseInt(req.query.page ?? '1', 10);
  const pageSize = parseInt(req.query.pageSize ?? '20', 10);
  const filtered = posts
    .filter(post => (post.texto || '').toLowerCase().includes(`#${tag}`))
    .map(post => mapPostToPublication(post, findUserByToken(req)));
  return res.json(paginatePublications(filtered, page, pageSize));
});

app.get('/api/publications/trending-hashtags', (req, res) => {
  const limit = parseInt(req.query.limit ?? '10', 10);
  const counts = new Map();
  posts.forEach(post => {
    const text = post.texto || '';
    const matches = text.match(/#([A-Za-z0-9_\u00C0-\u024F]+)/g) || [];
    matches.forEach(match => {
      const tag = match.slice(1).toLowerCase();
      counts.set(tag, (counts.get(tag) || 0) + 1);
    });
  });
  const trending = [...counts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, Math.max(1, limit))
    .map(entry => entry[0]);
  return res.json(trending);
});

app.post('/api/publications/:id/bookmark', (req, res) => {
  const user = findUserByToken(req);
  if (!user) return res.status(401).json({ message: 'Token inválido.' });

  const postId = Number(req.params.id);
  const exists = bookmarks.some(bookmark => bookmark.userId === user.id && bookmark.postId === postId);
  if (!exists) {
    bookmarks.push({
      id: bookmarks.length + 1,
      userId: user.id,
      postId,
      createdAt: new Date().toISOString()
    });
  }

  return res.status(204).send();
});

app.delete('/api/publications/:id/bookmark', (req, res) => {
  const user = findUserByToken(req);
  if (!user) return res.status(401).json({ message: 'Token inválido.' });

  const postId = Number(req.params.id);
  const index = bookmarks.findIndex(bookmark => bookmark.userId === user.id && bookmark.postId === postId);
  if (index !== -1) {
    bookmarks.splice(index, 1);
  }

  return res.status(204).send();
});

app.get('/api/users/:id/liked-publications', (req, res) => {
  const liked = posts.filter(p => p.utilizadorDeuBaze).map(post => mapPostToPublication(post));
  return res.json(liked);
});

app.get('/api/users/me/bookmarks', (req, res) => {
  const user = findUserByToken(req);
  if (!user) return res.status(401).json({ message: 'Token inválido.' });
  const page = parseInt(req.query.page ?? '1', 10);
  const pageSize = parseInt(req.query.pageSize ?? '20', 10);
  const saved = bookmarks
    .filter(bookmark => bookmark.userId === user.id)
    .sort((left, right) => String(right.createdAt).localeCompare(String(left.createdAt)))
    .map(bookmark => posts.find(post => post.id === bookmark.postId))
    .filter(Boolean)
    .map(post => mapPostToPublication(post, user));
  return res.json(paginatePublications(saved, page, pageSize));
});

app.get('/api/users/:id/followers', (req, res) => {
  const id = Number(req.params.id);
  const seguidores = follows.filter(f => f.followingId === id).map(f => users.find(u => u.id === f.followerId));
  return res.json(seguidores.filter(Boolean).map(mapUserDto));
});

app.get('/api/users/:id/following', (req, res) => {
  const id = Number(req.params.id);
  const seguindo = follows.filter(f => f.followerId === id).map(f => users.find(u => u.id === f.followingId));
  return res.json(seguindo.filter(Boolean).map(mapUserDto));
});

app.post('/api/users/:id/follow', (req, res) => {
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
    notificacoes.unshift({
      id: notificacoes.length + 1,
      tipo: 'seguidor',
      utilizadorId: user.id,
      utilizadorNome: user.nomeUtilizador,
      lida: false,
      criadoEm: new Date().toISOString()
    });
  }
  return res.status(204).send();
});

app.delete('/api/users/:id/follow', (req, res) => {
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
  return res.status(204).send();
});

app.get('/api/conversations', (req, res) => {
  const user = findUserByToken(req);
  if (!user) return res.status(401).json({ message: 'Token inválido.' });

  const items = conversations
    .filter(conversation => conversation.participantIds.includes(user.id))
    .map(conversation => {
      const otherParticipant = users.find(participant => participant.id !== user.id && conversation.participantIds.includes(participant.id));
      return {
        id: conversation.id,
        otherUserId: otherParticipant ? String(otherParticipant.id) : undefined,
        otherUsername: otherParticipant?.nomeUtilizador,
        otherDisplayName: otherParticipant?.nome,
        otherPhotoUrl: otherParticipant?.fotoPerfil || '',
        title: conversation.title,
        isGroup: conversation.isGroup,
        participantCount: conversation.participantIds.length,
        lastMessageText: 'Mensagem de teste',
        lastMessageAt: conversation.lastMessageAt,
        unreadCount: 1
      };
    });

  return res.json(items);
});

app.get('/api/conversations/unread-count', (req, res) => {
  const user = findUserByToken(req);
  if (!user) return res.status(401).json({ message: 'Token inválido.' });
  const count = conversations.filter(conversation => conversation.participantIds.includes(user.id)).length;
  return res.json({ count });
});

app.post('/api/conversations', (req, res) => {
  const user = findUserByToken(req);
  if (!user) return res.status(401).json({ message: 'Token inválido.' });
  const participantId = Number(req.body.participantId);
  const other = users.find(item => item.id === participantId);
  if (!other) return res.status(404).json({ message: 'Utilizador não encontrado.' });
  const existing = conversations.find(conversation =>
    !conversation.isGroup &&
    conversation.participantIds.includes(user.id) &&
    conversation.participantIds.includes(participantId)
  );
  const conversation = existing || {
    id: `conv-${conversations.length + 1}`,
    title: null,
    isGroup: false,
    participantIds: [user.id, participantId],
    lastMessageAt: new Date().toISOString()
  };
  if (!existing) {
    conversations.unshift(conversation);
  }
  return res.json({
    id: conversation.id,
    otherUserId: String(other.id),
    otherUsername: other.nomeUtilizador,
    otherDisplayName: other.nome,
    otherPhotoUrl: other.fotoPerfil || '',
    isGroup: false,
    participantCount: 2,
    lastMessageText: '',
    lastMessageAt: conversation.lastMessageAt,
    unreadCount: 0
  });
});

app.post('/api/conversations/group', (req, res) => {
  const user = findUserByToken(req);
  if (!user) return res.status(401).json({ message: 'Token inválido.' });

  const participantIds = Array.isArray(req.body.participantIds) ? req.body.participantIds.map(Number) : [];
  const conversation = {
    id: `conv-${conversations.length + 1}`,
    title: req.body.title || 'Grupo',
    isGroup: true,
    participantIds: [user.id, ...participantIds.filter(id => Number.isFinite(id))],
    lastMessageAt: new Date().toISOString()
  };
  conversations.unshift(conversation);

  return res.json({
    id: conversation.id,
    title: conversation.title,
    isGroup: true,
    participantCount: conversation.participantIds.length,
    unreadCount: 0
  });
});

app.get('/api/conversations/:id/messages', (req, res) => {
  const user = findUserByToken(req);
  if (!user) return res.status(401).json({ message: 'Token inválido.' });

  const limit = parseInt(req.query.limit ?? '50', 10);
  const before = req.query.before ? new Date(String(req.query.before)).getTime() : Number.POSITIVE_INFINITY;
  const messages = conversationMessages
    .filter(message => message.conversationId === req.params.id)
    .filter(message => new Date(message.createdAt).getTime() < before)
    .sort((left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime())
    .slice(-limit)
    .map(message => ({
      ...message,
      isMine: message.senderId === String(user.id),
      isRead: false
    }));

  return res.json(messages);
});

app.post('/api/conversations/:id/messages', (req, res) => {
  const user = findUserByToken(req);
  if (!user) return res.status(401).json({ message: 'Token inválido.' });
  const now = new Date().toISOString();
  const message = {
    id: `msg-${conversationMessages.length + 1}`,
    conversationId: req.params.id,
    senderId: String(user.id),
    senderUsername: user.nomeUtilizador,
    senderDisplayName: user.nome,
    senderPhotoUrl: user.fotoPerfil || '',
    text: req.body.text || '',
    imageUrl: '',
    videoUrl: '',
    remoteImageUrl: req.body.remoteImageUrl || '',
    forwardedFromMessageId: null,
    isEdited: false,
    isDeletedForEveryone: false,
    isGif: (req.body.remoteImageUrl || '').toLowerCase().endsWith('.gif'),
    replyTo: null,
    reactions: [],
    createdAt: now
  };
  conversationMessages.push(message);

  notificacoes.unshift({
    id: notificacoes.length + 1,
    tipo: 'mensagem',
    utilizadorId: user.id,
    utilizadorNome: user.nomeUtilizador,
    lida: false,
    conversationId: req.params.id,
    messageText: message.text,
    criadoEm: now
  });

  return res.json({ ...message, isMine: true, isRead: false });
});

app.post('/api/conversations/:id/messages/media', upload.fields([{ name: 'image' }, { name: 'video' }]), (req, res) => {
  const user = findUserByToken(req);
  if (!user) return res.status(401).json({ message: 'Token inválido.' });
  const now = new Date().toISOString();
  const message = {
    id: `msg-${conversationMessages.length + 1}`,
    conversationId: req.params.id,
    senderId: String(user.id),
    senderUsername: user.nomeUtilizador,
    senderDisplayName: user.nome,
    senderPhotoUrl: user.fotoPerfil || '',
    text: req.body.text || '',
    imageUrl: req.body.remoteImageUrl || '',
    videoUrl: '',
    remoteImageUrl: req.body.remoteImageUrl || '',
    forwardedFromMessageId: null,
    isEdited: false,
    isDeletedForEveryone: false,
    isGif: (req.body.remoteImageUrl || '').toLowerCase().endsWith('.gif'),
    replyTo: null,
    reactions: [],
    createdAt: now
  };
  conversationMessages.push(message);
  return res.json({ ...message, isMine: true, isRead: false });
});

app.patch('/api/conversations/:id/messages/:messageId', (req, res) => {
  const user = findUserByToken(req);
  if (!user) return res.status(401).json({ message: 'Token inválido.' });
  const message = conversationMessages.find(item => item.id === req.params.messageId && item.conversationId === req.params.id);
  if (!message) return res.status(404).json({ message: 'Mensagem não encontrada.' });
  message.text = req.body.text || message.text;
  message.isEdited = true;
  return res.json({ ...message, isMine: message.senderId === String(user.id), isRead: false });
});

app.delete('/api/conversations/:id/messages/:messageId', (req, res) => {
  const scope = String(req.query.scope || 'self');
  const index = conversationMessages.findIndex(item => item.id === req.params.messageId && item.conversationId === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Mensagem não encontrada.' });
  if (scope === 'self') {
    conversationMessages.splice(index, 1);
    return res.status(204).send();
  }
  conversationMessages[index].isDeletedForEveryone = true;
  conversationMessages[index].text = '';
  conversationMessages[index].imageUrl = '';
  conversationMessages[index].videoUrl = '';
  return res.status(204).send();
});

app.post('/api/conversations/:id/messages/:messageId/forward', (req, res) => {
  const user = findUserByToken(req);
  if (!user) return res.status(401).json({ message: 'Token inválido.' });
  const sourceMessage = conversationMessages.find(item => item.id === req.params.messageId);
  if (!sourceMessage) return res.status(404).json({ message: 'Mensagem não encontrada.' });
  const targetIds = Array.isArray(req.body.targetConversationIds) ? req.body.targetConversationIds : [];
  const now = new Date().toISOString();
  const forwarded = targetIds.map(targetId => ({
    ...sourceMessage,
    id: `msg-${conversationMessages.length + 1 + Math.floor(Math.random() * 1000)}`,
    conversationId: String(targetId),
    senderId: String(user.id),
    senderUsername: user.nomeUtilizador,
    senderDisplayName: user.nome,
    forwardedFromMessageId: sourceMessage.id,
    createdAt: now,
    isMine: true,
    isRead: false
  }));
  conversationMessages.push(...forwarded.map(item => ({ ...item })));
  return res.json(forwarded);
});

app.post('/api/conversations/:id/messages/:messageId/reactions', (req, res) => {
  const message = conversationMessages.find(item => item.id === req.params.messageId && item.conversationId === req.params.id);
  if (!message) return res.status(404).json({ message: 'Mensagem não encontrada.' });
  const emoji = req.body.emoji || '👍';
  message.reactions = [{ emoji, count: 1, reactedByMe: true }];
  return res.json({ reactions: message.reactions });
});

app.put('/api/conversations/:id/read', (_req, res) => {
  return res.status(204).send();
});

app.get('/api/notifications', (req, res) => {
  const user = findUserByToken(req);
  if (!user) return res.status(401).json({ message: 'Token inválido.' });
  return res.json(notificacoes.map(mapNotificationDto));
});

app.get('/api/notifications/unread-count', (req, res) => {
  const user = findUserByToken(req);
  if (!user) return res.status(401).json({ message: 'Token inválido.' });
  const count = notificacoes.filter(n => !n.lida).length;
  return res.json({ count });
});

app.put('/api/notifications/read-all', (req, res) => {
  const user = findUserByToken(req);
  if (!user) return res.status(401).json({ message: 'Token inválido.' });
  notificacoes.forEach(n => { n.lida = true; });
  return res.status(204).send();
});

app.put('/api/notifications/:id/read', (req, res) => {
  const notification = notificacoes.find(n => String(n.id) === req.params.id);
  if (!notification) return res.status(404).json({ message: 'Notificação não encontrada.' });
  notification.lida = true;
  return res.status(204).send();
});

app.delete('/api/notifications/:id', (req, res) => {
  const id = Number(req.params.id);
  const idx = notificacoes.findIndex(n => n.id === id);
  if (idx === -1) return res.status(404).json({ message: 'Notificação não encontrada.' });
  notificacoes.splice(idx, 1);
  return res.status(204).send();
});

app.listen(PORT, () => {
  console.log(`Mock backend a correr em http://localhost:${PORT}`);
});