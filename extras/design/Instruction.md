Developer: Contexto: Estou a portar a UI deste Twitter clone (Next.js + Tailwind) 

para Angular com SCSS. Já tenho o _variables.scss gerado.



Analisa este ficheiro React/TSX e:

1. Identifica a estrutura de layout (flex/grid/posicionamento)

2. Converte as classes Tailwind para valores CSS exactos (px, rem, hex)

3. Gera o equivalente Angular:

   - component.html (template)

   - component.scss (usando as CSS vars do _variables.scss)

   - component.ts (apenas o esqueleto com @Input necessários)

Acredito que esta abordagem de tentar traduzir os códigos dart no flutter para o angular do nzolanet gastará muito token e exigirá muito esforço, não é verdade? por isso apaguei a versão do flutter e coloquei uma nova versão em react com typescript para tu analisesares tudo, fonte, cores, espaçamentos, o scss, tailwind, posicionamento, tamanhos, toda UI deste clone do Twitter e fazer com que a UI do Nzolanet seja totalmente igual a do twitter clone que acabo de colocar na pasta design. Como react, typescript é mais fácil de traduzir ou adaptar para Angular, então será fácil para ti.

Fase 1 — Design Tokens
#Ficheiro a darO que extrair1tailwind.config.jsCores customizadas, breakpoints, fontes estendidas2src/styles/globals.scssCSS globals, reset, variáveis base
Output: _variables.scss com todas as CSS custom properties prontas para Angular.

Fase 2 — Layout Shell
#Ficheiro a darO que extrair3src/components/layout/main-layout.tsxGrid de 3 colunas (sidebar + feed + aside)4src/components/sidebar/sidebar.tsxNavegação lateral esquerda + logo5src/components/sidebar/sidebar-link.tsxItem de nav (ícone + label + hover state)

Fase 3 — Componentes Core
#Ficheiro a darO que extrair6src/components/tweet/tweet.tsxCard completo do tweet7src/components/tweet/tweet-stats.tsxLinha de acções (like, retweet, reply, share)8src/components/input/input.tsxComposer do tweet (textarea + toolbar)9src/components/user/user-avatar.tsxAvatar com foto e fallback10src/components/user/user-name.tsxNome + handle + badge verificado

Fase 4 — Páginas
#Ficheiro a darO que extrair11src/pages/index.tsx + src/components/home/Feed/Timeline com header sticky12src/components/aside/aside.tsxColuna direita (trends + who to follow)13src/pages/[user].tsx + src/components/user/Página de perfil14src/pages/explore.tsxPágina de pesquisa

Fase 5 — Secundários
#Ficheiro a darO que extrair15src/components/modal/ (pasta toda)Modais de compose, imagens, confirmação16src/pages/notifications.tsxPágina de notificações17src/components/login/login-main.tsxEcrã de login