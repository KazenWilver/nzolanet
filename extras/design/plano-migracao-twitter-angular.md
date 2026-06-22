# Plano de Migração UI — ccrsxx/twitter-clone → Angular 17

> **Como usar:** Para cada passo, abre o ficheiro indicado no repositório, copia o conteúdo,
> cola no final do prompt e envia ao modelo. Guarda o output antes de avançar para o próximo.

---

## FASE 1 — Design Tokens (base de tudo)

---

### Passo 1 — Cores, fontes e espaçamentos

**Ficheiro:** `tailwind.config.js` (raiz do repositório)

**Prompt:**
```
Estou a migrar a UI do ccrsxx/twitter-clone (Next.js + Tailwind) para Angular 17 com SCSS.
Este é o tailwind.config.js do projecto.

Faz o seguinte:
1. Extrai TODAS as cores customizadas com os seus valores hex exactos
2. Extrai as fontes definidas (font-family, pesos usados)
3. Extrai qualquer espaçamento, border-radius ou shadow customizados
4. Gera um ficheiro _variables.scss completo com CSS custom properties
   no formato: --cor-primary: #1D9BF0;
5. Inclui também as cores de dark mode se existirem (prefixo --dark-)

Output esperado: apenas o ficheiro _variables.scss pronto a usar em Angular.

[COLA O CONTEÚDO DO tailwind.config.js AQUI]
```

**Guarda como:** `src/styles/_variables.scss`

---

### Passo 2 — Estilos globais e reset

**Ficheiro:** `src/styles/globals.scss`

**Prompt:**
```
Contexto: Migração ccrsxx/twitter-clone → Angular 17 com SCSS.
Já tenho o _variables.scss com todas as CSS custom properties.

Este é o globals.scss do projecto original.

Faz o seguinte:
1. Identifica o reset CSS usado (normalize, custom, etc.)
2. Extrai estilos globais de tipografia (body, headings, links)
3. Extrai estilos de scrollbar customizados se existirem
4. Extrai animações e keyframes globais
5. Gera o equivalente para Angular em styles.scss
   - Usa as CSS vars do _variables.scss em vez de valores hardcoded
   - Adapta a sintaxe para Angular (sem o :root do Next.js se necessário)

Output esperado: apenas o ficheiro styles.scss pronto a usar.

[COLA O CONTEÚDO DO globals.scss AQUI]
```

**Guarda como:** `src/styles/styles.scss`

---

## FASE 2 — Layout Shell

---

### Passo 3 — Grid principal da aplicação

**Ficheiro:** `src/components/layout/main-layout.tsx`

**Prompt:**
```
Contexto: Migração ccrsxx/twitter-clone → Angular 17 com SCSS.
Já tenho _variables.scss e styles.scss prontos.

Este é o componente de layout principal (main-layout.tsx).

Faz o seguinte:
1. Identifica a estrutura de grid (3 colunas: sidebar + feed + aside)
2. Extrai larguras, max-width e breakpoints responsivos exactos (em px/rem)
3. Identifica o comportamento sticky de cada coluna
4. Gera o equivalente Angular:
   - layout.component.html com a estrutura de grid CSS
   - layout.component.scss usando CSS Grid ou Flexbox (o mesmo que o original)
     e usando as vars do _variables.scss
   - layout.component.ts com o esqueleto básico (sem lógica, só o @Component)
5. Nota: no Angular o equivalente ao children do React é <ng-content>

Output esperado: os 3 ficheiros do componente Angular.

[COLA O CONTEÚDO DO main-layout.tsx AQUI]
```

**Guarda como:** `src/app/components/layout/`

---

### Passo 4 — Barra de navegação lateral esquerda

**Ficheiro:** `src/components/sidebar/sidebar.tsx`

**Prompt:**
```
Contexto: Migração ccrsxx/twitter-clone → Angular 17 com SCSS.
Já tenho o layout principal criado.

Este é o componente sidebar.tsx (navegação lateral esquerda).

Faz o seguinte:
1. Identifica todos os itens de navegação e os seus ícones
2. Extrai o posicionamento do logo no topo
3. Extrai o botão "Tweet/Post" (cor, tamanho, forma)
4. Extrai a secção de perfil no fundo (avatar + nome + handle + menu)
5. Gera o equivalente Angular:
   - sidebar.component.html
   - sidebar.component.scss (com vars do _variables.scss)
   - sidebar.component.ts (com RouterLink e propriedades necessárias)
6. Substitui os imports de ícones React por classes CSS ou
   indica qual biblioteca de ícones equivalente usar (ex: Heroicons via CDN)

Output esperado: os 3 ficheiros do componente Angular.

[COLA O CONTEÚDO DO sidebar.tsx AQUI]
```

**Guarda como:** `src/app/components/sidebar/`

---

### Passo 5 — Item de navegação da sidebar

**Ficheiro:** `src/components/sidebar/sidebar-link.tsx`

**Prompt:**
```
Contexto: Migração ccrsxx/twitter-clone → Angular 17 com SCSS.

Este é o componente sidebar-link.tsx (item individual de nav da sidebar).

Faz o seguinte:
1. Identifica o layout do item (ícone + label, espaçamentos exactos)
2. Extrai o estado activo (active route styling)
3. Extrai o estado hover (background, transição)
4. Extrai como o label desaparece em ecrãs mais pequenos (só ícone)
5. Gera o equivalente Angular:
   - sidebar-link.component.html
   - sidebar-link.component.scss
   - sidebar-link.component.ts com @Input() para: label, icon, route
     e usando RouterLinkActive para o estado activo

Output esperado: os 3 ficheiros do componente Angular.

[COLA O CONTEÚDO DO sidebar-link.tsx AQUI]
```

**Guarda como:** `src/app/components/sidebar/sidebar-link/`

---

## FASE 3 — Componentes Core

---

### Passo 6 — Card do Tweet/Post

**Ficheiro:** `src/components/tweet/tweet.tsx`

**Prompt:**
```
Contexto: Migração ccrsxx/twitter-clone → Angular 17 com SCSS.
Este é o componente mais importante do projecto.

Este é o componente tweet.tsx (card individual de tweet).

Faz o seguinte:
1. Mapeia a estrutura completa:
   - Avatar à esquerda
   - Área de conteúdo à direita (header + texto + media + acções)
2. Extrai espaçamentos exactos (padding, gap, margin) em px/rem
3. Extrai estilos do texto do tweet (tamanho, cor, line-height)
4. Extrai o separador entre tweets (border-bottom)
5. Extrai o comportamento hover do card inteiro
6. Gera o equivalente Angular:
   - tweet.component.html
   - tweet.component.scss
   - tweet.component.ts com interface Tweet para os @Input():
     id, text, user (name, handle, avatar), createdAt,
     likes, retweets, replies, images[]

Output esperado: os 3 ficheiros + a interface Tweet em TypeScript.

[COLA O CONTEÚDO DO tweet.tsx AQUI]
```

**Guarda como:** `src/app/components/tweet/`

---

### Passo 7 — Barra de acções do Tweet

**Ficheiro:** `src/components/tweet/tweet-stats.tsx`

**Prompt:**
```
Contexto: Migração ccrsxx/twitter-clone → Angular 17 com SCSS.

Este é o componente tweet-stats.tsx (barra de acções: reply, retweet, like, share).

Faz o seguinte:
1. Extrai o layout da barra (justify-between? gap exacto?)
2. Para cada botão (reply, retweet, like, share, bookmark):
   - Cor do ícone no estado normal
   - Cor no estado activo (like = vermelho, retweet = verde, etc.)
   - Cor e background no hover
   - Formato do contador (1.2K, 999, etc.)
3. Extrai as transições/animações dos botões
4. Gera o equivalente Angular:
   - tweet-actions.component.html
   - tweet-actions.component.scss com os estados :hover e .active
   - tweet-actions.component.ts com @Input() para counts e estados,
     e @Output() para os eventos (liked, retweeted, replied, shared)

Output esperado: os 3 ficheiros do componente Angular.

[COLA O CONTEÚDO DO tweet-stats.tsx AQUI]
```

**Guarda como:** `src/app/components/tweet/tweet-actions/`

---

### Passo 8 — Composer de Tweet (caixa de escrita)

**Ficheiro:** `src/components/input/input.tsx`

**Prompt:**
```
Contexto: Migração ccrsxx/twitter-clone → Angular 17 com SCSS.

Este é o componente input.tsx (caixa para escrever um novo tweet).

Faz o seguinte:
1. Identifica o layout (avatar + área de texto + toolbar + botão submit)
2. Extrai o estilo do textarea (sem border, placeholder, auto-resize)
3. Extrai a toolbar de baixo (ícones: imagem, gif, emoji, poll, localização)
   - Cor dos ícones, tamanho, hover
4. Extrai o botão "Post/Tweet" (cor, border-radius, padding, disabled state)
5. Extrai o contador de caracteres (quando aparece, como muda de cor)
6. Gera o equivalente Angular:
   - tweet-composer.component.html
   - tweet-composer.component.scss
   - tweet-composer.component.ts com:
     - [(ngModel)] para o texto
     - @Output() submitted com o texto
     - lógica de contagem de caracteres (280)
     - auto-resize do textarea via HostListener

Output esperado: os 3 ficheiros do componente Angular.

[COLA O CONTEÚDO DO input.tsx AQUI]
```

**Guarda como:** `src/app/components/tweet-composer/`

---

### Passo 9 — Avatar de utilizador

**Ficheiro:** `src/components/user/user-avatar.tsx`

**Prompt:**
```
Contexto: Migração ccrsxx/twitter-clone → Angular 17 com SCSS.

Este é o componente user-avatar.tsx.

Faz o seguinte:
1. Identifica todos os tamanhos de avatar usados (small, medium, large com px exactos)
2. Extrai o estilo da imagem circular (border-radius, object-fit, border se houver)
3. Extrai o fallback quando não há foto (inicial do nome? cor de fundo?)
4. Extrai o hover state se existir (anel, opacity, etc.)
5. Gera o equivalente Angular:
   - user-avatar.component.html
   - user-avatar.component.scss com variantes de tamanho via @Input
   - user-avatar.component.ts com @Input(): src, alt, size ('sm'|'md'|'lg')
     e lógica de fallback para imagem quebrada (error handler)

Output esperado: os 3 ficheiros do componente Angular.

[COLA O CONTEÚDO DO user-avatar.tsx AQUI]
```

**Guarda como:** `src/app/components/shared/user-avatar/`

---

### Passo 10 — Nome e handle do utilizador

**Ficheiro:** `src/components/user/user-name.tsx`

**Prompt:**
```
Contexto: Migração ccrsxx/twitter-clone → Angular 17 com SCSS.

Este é o componente user-name.tsx (nome + @handle + badge verificado).

Faz o seguinte:
1. Identifica o layout (inline? flex? gap entre elementos?)
2. Extrai estilo do nome (font-weight, font-size, cor)
3. Extrai estilo do handle (cor, font-size — normalmente mais claro)
4. Extrai o badge de verificado (tamanho do SVG, cor, posicionamento)
5. Extrai o comportamento de truncate para textos longos
6. Gera o equivalente Angular:
   - user-name.component.html
   - user-name.component.scss
   - user-name.component.ts com @Input(): name, handle, verified (boolean)

Output esperado: os 3 ficheiros do componente Angular.

[COLA O CONTEÚDO DO user-name.tsx AQUI]
```

**Guarda como:** `src/app/components/shared/user-name/`

---

## FASE 4 — Páginas

---

### Passo 11 — Feed / Timeline (página Home)

**Ficheiros:** `src/pages/index.tsx` + ficheiros em `src/components/home/`
*(dá os 2 ou 3 ficheiros juntos no mesmo prompt)*

**Prompt:**
```
Contexto: Migração ccrsxx/twitter-clone → Angular 17 com SCSS.
Já tenho o TweetComponent e o TweetComposerComponent criados.

Estes são os ficheiros da página Home (feed/timeline).

Faz o seguinte:
1. Identifica o header sticky (título "Home", tabs "For You"/"Following")
   - Extrai o efeito de blur/transparência do header ao fazer scroll
   - Extrai o estilo das tabs e o indicador activo (underline azul)
2. Identifica a lista de tweets (scroll infinito? paginação?)
3. Extrai o separador entre o composer e o feed
4. Gera o equivalente Angular:
   - home.component.html (usando <app-tweet-composer> e <app-tweet> já criados)
   - home.component.scss
   - home.component.ts com:
     - lista de tweets mockada (interface Tweet[])
     - lógica de tab activa
     - scroll listener para o efeito do header

Output esperado: os 3 ficheiros do componente Angular.

[COLA O CONTEÚDO DOS FICHEIROS DA HOME AQUI]
```

**Guarda como:** `src/app/pages/home/`

---

### Passo 12 — Coluna direita (Aside)

**Ficheiro:** `src/components/aside/aside.tsx`
*(inclui também os sub-componentes: trends, who-to-follow se existirem separados)*

**Prompt:**
```
Contexto: Migração ccrsxx/twitter-clone → Angular 17 com SCSS.

Este é o componente aside.tsx (coluna direita com search, trends e who to follow).

Faz o seguinte:
1. Identifica o layout geral da coluna (largura fixa, sticky, padding)
2. Extrai o campo de pesquisa:
   - Shape (rounded-full?), cor de fundo, ícone de search, placeholder
   - Focus state (border, cor)
3. Extrai a secção "What's happening" / Trends:
   - Card container (border-radius, background, padding)
   - Item de trend (layout, tipografia, contagem)
   - Hover state do item
4. Extrai a secção "Who to follow":
   - Layout do item (avatar + nome/handle + botão Follow)
   - Estilo do botão Follow (outline vs filled, hover)
5. Gera o equivalente Angular:
   - aside.component.html
   - aside.component.scss
   - aside.component.ts com dados mockados de trends e sugestões

Output esperado: os 3 ficheiros do componente Angular.

[COLA O CONTEÚDO DO aside.tsx E SUB-COMPONENTES AQUI]
```

**Guarda como:** `src/app/components/aside/`

---

### Passo 13 — Página de Perfil

**Ficheiros:** `src/pages/[user].tsx` + componentes em `src/components/user/`

**Prompt:**
```
Contexto: Migração ccrsxx/twitter-clone → Angular 17 com SCSS.

Estes são os ficheiros da página de perfil do utilizador.

Faz o seguinte:
1. Extrai o header da página:
   - Botão back + nome do utilizador + contagem de tweets
2. Extrai a cover image (altura, object-fit, fallback de cor)
3. Extrai o avatar sobre a cover (posicionamento absoluto, tamanho, border branca)
4. Extrai os botões de acção (Edit Profile / Follow):
   - Estilos do estado Follow vs Following (outlined → filled)
5. Extrai as stats do perfil (Tweets, Following, Followers — layout e tipografia)
6. Extrai as tabs de conteúdo (Tweets, Replies, Media, Likes)
7. Gera o equivalente Angular:
   - profile.component.html
   - profile.component.scss
   - profile.component.ts com interface UserProfile e dados mockados

Output esperado: os 3 ficheiros do componente Angular.

[COLA O CONTEÚDO DOS FICHEIROS DE PERFIL AQUI]
```

**Guarda como:** `src/app/pages/profile/`

---

### Passo 14 — Página de Explore / Pesquisa

**Ficheiro:** `src/pages/explore.tsx`

**Prompt:**
```
Contexto: Migração ccrsxx/twitter-clone → Angular 17 com SCSS.

Este é o ficheiro da página Explore/Search.

Faz o seguinte:
1. Extrai o campo de pesquisa do topo (igual ao do aside ou diferente?)
2. Extrai as tabs de categorias (For you, Trending, News, Sports, etc.)
3. Extrai o layout dos resultados de trending (card ou lista?)
4. Extrai qualquer estado vazio (empty state) se existir
5. Gera o equivalente Angular:
   - explore.component.html
   - explore.component.scss
   - explore.component.ts com lista de trending mockada e lógica de tabs

Output esperado: os 3 ficheiros do componente Angular.

[COLA O CONTEÚDO DO explore.tsx AQUI]
```

**Guarda como:** `src/app/pages/explore/`

---

## FASE 5 — Secundários

---

### Passo 15 — Sistema de Modais

**Ficheiros:** pasta `src/components/modal/` (todos os ficheiros)

**Prompt:**
```
Contexto: Migração ccrsxx/twitter-clone → Angular 17 com SCSS.

Estes são os componentes de modal do projecto.

Faz o seguinte:
1. Identifica o overlay (backdrop):
   - Cor, opacity, blur se houver
   - Animação de entrada/saída
2. Identifica o container do modal:
   - Border-radius, shadow, background, max-width
   - Botão de fechar (posição, tamanho, hover)
3. Para cada tipo de modal (compose, imagem, confirmação):
   - Estrutura interna específica
4. Gera o equivalente Angular:
   - modal.component.html (base reutilizável com <ng-content>)
   - modal.component.scss com as animações
   - modal.component.ts com @Input() isOpen e @Output() closed
   - modal.service.ts para abrir/fechar modais programaticamente

Output esperado: os 4 ficheiros do sistema de modais Angular.

[COLA O CONTEÚDO DA PASTA MODAL AQUI]
```

**Guarda como:** `src/app/components/modal/`

---

### Passo 16 — Notificações

**Ficheiro:** `src/pages/notifications.tsx`

**Prompt:**
```
Contexto: Migração ccrsxx/twitter-clone → Angular 17 com SCSS.

Este é o ficheiro da página de notificações.

Faz o seguinte:
1. Extrai as tabs (All / Mentions)
2. Extrai o item de notificação:
   - Ícone por tipo (like = coração vermelho, follow = pessoa azul, retweet = verde)
   - Layout (ícone + avatar + texto)
   - Estado lido vs não lido (fundo diferente?)
   - Hover state
3. Extrai o texto da notificação (bold no nome, normal na acção)
4. Gera o equivalente Angular:
   - notifications.component.html
   - notifications.component.scss
   - notifications.component.ts com enum NotificationType
     e lista de notificações mockada

Output esperado: os 3 ficheiros do componente Angular.

[COLA O CONTEÚDO DO notifications.tsx AQUI]
```

**Guarda como:** `src/app/pages/notifications/`

---

### Passo 17 — Ecrã de Login

**Ficheiro:** `src/components/login/login-main.tsx`

**Prompt:**
```
Contexto: Migração ccrsxx/twitter-clone → Angular 17 com SCSS.

Este é o componente de login (ecrã inicial).

Faz o seguinte:
1. Identifica o layout do ecrã (split? centrado? duas colunas?)
2. Extrai o logo do Twitter/X (tamanho, posição)
3. Extrai os botões de autenticação:
   - Botão "Sign in with Google" (ícone, cor, border, hover)
   - Separador "or" se existir
   - Campos de email/password se existirem
4. Extrai textos legais (Terms, Privacy Policy — tipografia, links)
5. Gera o equivalente Angular:
   - login.component.html
   - login.component.scss
   - login.component.ts com @Output() loginRequested
     (a lógica real de auth já está no teu ASP.NET)

Output esperado: os 3 ficheiros do componente Angular.

[COLA O CONTEÚDO DO login-main.tsx AQUI]
```

**Guarda como:** `src/app/pages/login/`

---

## Resumo da ordem de execução

```
Fase 1:  1 → 2
Fase 2:  3 → 4 → 5
Fase 3:  6 → 7 → 8 → 9 → 10
Fase 4:  11 → 12 → 13 → 14
Fase 5:  15 → 16 → 17
```

> Não avances para a Fase 2 sem ter o _variables.scss da Fase 1 confirmado.
> Não avances para a Fase 3 sem ter o layout e sidebar funcionais.
> Os passos dentro da mesma fase podem ser feitos em qualquer ordem entre si.
