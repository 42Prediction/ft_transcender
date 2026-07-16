# FQ.md — Guia de Defesa: ft_transcendence / "42 Prediction"

> **v2 — corrigido a partir da grelha de avaliação real** (`evaluation.txt`, fornecida pela
> escola: Preliminaries → General Requirements → Technical Requirements → Modules Verification →
> Code Quality → Functionality → Final Verification → Bonus → Ratings). A v1 deste ficheiro tinha
> sido construída a partir de uma leitura aproximada de um print e de um `evaluation.txt` errado
> (grelha do `push_swap`) — **descartada**. Esta versão segue a grelha real, secção a secção,
> cruzada com o estado atual do código (`README.md`, `MODULES_PROGRESS.md`, inspeção direta de
> `app-backend/src`/`app-frontend/src` em 2026-07-16).
>
> Nota importante desta grelha (diferente do que se assume normalmente do `ft_transcendence`
> clássico): **não há nenhum requisito de jogo/Pong** em lado nenhum do texto — "General
> Requirements → Architecture Components" só pede Frontend + Backend + Database. Isso remove o
> maior risco que a v1 tinha sinalizado. O risco real desta grelha é outro — ver secção 0.

---

## 0. O ponto crítico desta grelha: **o bónus só conta se o mandatório estiver 100% perfeito**

> *"Evaluate the bonus part if, and only if, the mandatory part has been entirely and perfectly
> done, and the error management handles unexpected or bad usage. In case all the mandatory
> points were not passed during the defense, bonus points must be totally ignored."*

Isto muda a leitura da situação: não basta ter ≥14 pts de módulos — **General Requirements** e
**Technical Requirements** (que incluem itens fora dos módulos, tipo HTTPS, validação, README)
também têm de passar **todos**, senão os 5 pontos de bónus são **ignorados por inteiro**, mesmo
que os módulos bónus estejam perfeitos.

### ✅ RESOLVIDO — "Secure Connections" (HTTPS)

> *"Is HTTPS used for all connections to the backend? ... All communication between frontend and
> backend must be encrypted using HTTPS."*

Implementado (2026-07-16): TLS termination no nginx do frontend (`app-frontend/nginx.conf`,
`listen 443 ssl` + redirect automático `80→443`) e HTTPS nativo no backend NestJS
(`app-backend/src/main.ts` — `httpsOptions` quando `SSL_KEY_PATH`/`SSL_CERT_PATH` apontam para
ficheiros reais). Certificado autoassinado (CN=`localhost`, SAN `localhost`+`127.0.0.1`) gerado
automaticamente por `make certs` (encadeado em `make up-prod`, continua "um comando só"),
partilhado entre os dois serviços via `./certs:/certs:ro`. Socket.IO reutiliza o mesmo servidor
HTTPS do Nest (a `SocketIoAdapter` já não especifica porta própria), por isso o chat/preços em
tempo real passam a `wss://` automaticamente, sem alterações. Verificado ao vivo: backend em
`:3000` só responde em HTTPS (HTTP simples dá erro de protocolo), frontend em `:5173` responde
200 em HTTPS, e o handshake do Socket.IO funciona sobre essa ligação TLS. Detalhe técnico
importante: a `env_file: .env` do backend continua com os valores `http://...` para não quebrar
o `make dev` local (host processes, sem certs) — o `docker-compose.yml` sobrepõe explicitamente
`FRONTEND_URL`, `GOOGLE_CALLBACK_URL` e `_42SCHOOL_CALLBACK_URL` para as versões `https://` só
dentro do stack containerizado.

**Ainda por fazer manualmente antes da defesa:**
- O browser mostra aviso "not private" no primeiro acesso (certificado autoassinado) — **isto é
  esperado e deve ser explicado assim ao examinador**, não escondido; aceitar/avançar uma vez por
  browser antes da demo.
- Se o login OAuth (Google/42) for testado contra este stack HTTPS, é preciso adicionar
  `https://localhost:3000/auth/google/callback` e `https://localhost:3000/auth/42luanda/callback`
  como redirect URIs autorizados nas consolas do Google Cloud e da 42 Intra API — ver nota no
  `README.md`.

---

## 1. Scorecard rápido

| Bloco da grelha | Estado | Nota |
|---|---|---|
| Preliminaries | ✅ pronto (depende de todos os 5 estarem presentes e saberem explicar o todo) | ver secção 2 |
| General Requirements | ✅ 4/4 confirmados | Architecture ✅, Deployment ✅, Browser console ✅, Privacy/ToS ✅ |
| Technical Requirements | ✅ 7/7 confirmados | **Secure Connections (HTTPS) ✅ resolvido** — ver secção 0/4.7 |
| Modules — pontos reivindicados | ✅ 18 pts core (README) ≥ 14 mínimo | ver secção 5 |
| Code Quality | ✅ | ESLint, tsc, Jest, e2e, CI |
| Functionality | ✅ (confirmar multi-user e edge cases antes da defesa) | ver secção 7 |
| Bonus | ✅ 5/5 pts possíveis, já sem o bloqueio do item 0 | GDPR export, activity insights, design system + 2 pts core acima do mínimo |

---

## 2. PRELIMINARIES

### Team Presence
> "Verify that ALL team members (4-5 people) are present... If not all members are present, the
> review stops here."

**Ação**: confirmar antes da hora marcada que `ajacinto`, `nfigueir`, `gudos-sa`, `marccarv` e
`almanuel` estão todos disponíveis. Isto é um gate absoluto — sem os 5, a avaliação nem começa.

### Individual Contributions
> "Ask EACH team member individually... their role, specific contributions, at least one feature
> they personally implemented."

| Login | Papel | O que dizer se perguntarem "o que fizeste tu" |
|---|---|---|
| `ajacinto` | Product Owner + Dev | "Defini o conceito de prediction market e a economia interna; construí o motor de markets (aposta, pricing 100/100, gráfico, resolução/cancelamento), o chat por market, as notificações, a pesquisa global, a gamificação e a integração com a API da 42." |
| `nfigueir` | Project Manager + Dev | "Construí a base de auth (JWT em cookie, OAuth Google), o standard `ApiResponse` (200 sempre + `statusCode` no corpo), o pipeline automático de markets de exame e a camada de eventos WebSocket." |
| `gudos-sa` | Tech Lead + Dev | "Construí o módulo de wallet/ledger (saldo, transações imutáveis) e todo o DevOps: `docker-compose.yml` de 12 serviços, pipeline ELK, Prometheus/Grafana, migrações+seed no arranque. Também fiz o passe de responsividade da app toda." |
| `marccarv` (eu) | Developer | "Construí o sistema de amigos (pedidos, aceitar/rejeitar/remover, simetria transacional), a role `moderator`, o dashboard de analytics, e no bónus: export GDPR, insights de atividade pessoal, e a página `/design-system`." |
| `almanuel` | Developer | "Construí o 2FA (TOTP) de ponta a ponta — enrolamento por QR, desafio no login para password e OAuth — e corrigi o Makefile de produção." |

### README Verification
> Secções obrigatórias: nome/descrição, equipa com papéis, gestão de projeto, tecnologias
> justificadas, schema da BD, features + quem as fez, módulos escolhidos com justificação e
> cálculo de pontos, contribuições individuais.

**Estado real do `README.md`** (li o ficheiro inteiro): tem **todas** estas secções —
Description, Team Information, Project Management, Technical Stack (com justificação), Database
Schema, Features List (com autor), Modules (core + bónus, com justificação e pontos), Individual
Contributions (com desafio técnico de cada um). ✅

⚠️ Único ponto em aberto: a secção "Communication channels" tem um `[team to confirm]` por
preencher (canal do dia-a-dia e cadência de reuniões). **Preencher antes da entrega** — um README
"quase completo" ainda conta como completo aqui, mas não vale a pena arriscar.

### Project Coherence
> "Ask at least two different team members... project concept, main technologies, how the team
> coordinated."

**Guião combinado (2 pessoas diferentes, respostas que não se pisam):**
- Pessoa A (ex: `ajacinto`, conceito): "É um prediction market sobre eventos reais da 42 — os
  utilizadores apostam pontos (xp) em YES/NO sobre se um estudante passa um exame, com preço que
  se move em tempo real conforme as apostas."
- Pessoa B (ex: `nfigueir` ou eu, stack + coordenação): "React+NestJS+Postgres, tudo em
  TypeScript. Coordenámos por feature — cada um dono de ponta-a-ponta (backend+frontend) da sua
  fatia, PRs com 1 aprovação para `dev` e 2 para `master`, `MODULES_PROGRESS.md` como checklist
  viva contra o `en.subject.pdf`."

### Git History
> "Commits from all team members, clear messages, distributed work."

```
$ git log --oneline --all | wc -l
$ git shortlog -sn --all
```
> `nfigueir` ~120 commits, `ajacinto` ~71, `gudos-sa` ~53, `marccarv` ~52, `almanuel` ~10 — todos
> com presença real. Mensagens seguem `feat:`/`fix:` obrigatório (enforced por
> `.github/workflows/pr-rules.yml`), branches `feat/<nome>`/`fix/<nome>` → `dev` → `master`.

---

## 3. GENERAL REQUIREMENTS

### Architecture Components (Frontend + Backend + Database)
> "Ask different team members to briefly explain each component."

- **Frontend**: `nfigueir` ou eu — "React 19 + Vite, React Router v7 com data routers, Tailwind
  v4 + shadcn/ui."
- **Backend**: `gudos-sa` ou `nfigueir` — "NestJS 11 sobre Express, módulos por domínio (`auth`,
  `user`, `bettor`, `wallet`, `market`, `school42`), TypeORM."
- **Database**: `gudos-sa` — "PostgreSQL 16, migrações versionadas (`synchronize:false`)."

### Deployment (um comando)
> "Demonstrate the deployment."

```bash
make up-prod    # docker compose -f docker-compose.yml up -d --build
make ps-prod    # confirmar os 12 serviços Up/healthy
```
> Migrações e seed do admin correm automaticamente no arranque do container do backend
> (`RUN_MIGRATIONS=true`). **Testar isto do zero (sem volumes antigos) antes da defesa** — é
> literalmente o item que vão pedir para demonstrar ao vivo.

### Browser Compatibility (consola do Chrome sem erros/avisos)
> "Open Chrome DevTools and verify the console."

Já foi trabalho ativo da equipa (README, secção "How AI was used"): supressão de erros de
consola em códigos 2FA errados, extensão do padrão `ApiResponse` aos endpoints de 2FA, e um
audit de responsividade com Chrome headless a 360/768/1280px. **Antes da defesa**: abrir todas as
páginas principais (`/`, `/markets`, `/leaderboard`, `/user/portfolio`, `/admin/analytics`,
`/design-system`) com o DevTools aberto e confirmar consola limpa — inclui long-poll de
WebSocket a reconectar sem barulho.

### Privacy Policy and Terms of Service
> "Must be accessible (footer), contain relevant content, not placeholder."

`Privacy.tsx` (149 linhas) e `Terms.tsx` (146 linhas) — conteúdo real, não placeholder,
acessíveis a partir do footer (`nfigueir` conteúdo, `marccarv` ligação ao footer). ✅

---

## 4. TECHNICAL REQUIREMENTS

### 4.1 Frontend Responsiveness
Testado a 360/768/1280px (ver acima). Resposta: "sim, testámos em pelo menos desktop e
mobile/tablet width; a settings page teve um bug de scroll horizontal por causa do
`min-width:auto` implícito do CSS grid, corrigido com `min-w-0` depois de medir `scrollWidth`
com Chrome headless."

### 4.2 Styling Solution
Tailwind CSS v4 + shadcn/ui + Radix UI primitives (`components/ui/`). Não é CSS puro.

### 4.3 Environment Variables
> "`.env` exists and is in `.gitignore`; `.env.example` provided; no sensitive credentials in the
> repo outside `.env`. **Any credentials found = immediate project failure.**"

Confirmado:
```
$ cat .gitignore
secrets/
.env
app-backend/node_modules
app-frontend/node_modules
```
`.env.example` existe na raiz com todas as chaves em branco. A password do Postgres vem de
`secrets/db_password.txt` — também no `.gitignore`. **Antes da defesa**: correr
`git log --all --full-history -- .env` e `git log --all --full-history -- secrets/` para provar
que nunca foram commitados (não só que estão ignorados agora).

### 4.4 Database Design
Schema completo no `README.md` (secção "Database Schema"), com tabela de FKs e notas por
coluna. Diagrama simplificado:
```
users ──1:1── bettors ──1:1── wallet ──1:N── transaction
                │  │
                │  └──N:M── bettors (bettor_friends)
                │
                ├──1:N── market_positions ──N:1── markets
                ├──1:N── bettor_quests
                └──1:N── notifications
```

### 4.5 Authentication Security
> "Passwords must never be stored in plain text. Explain hashing/salting."

`bcrypt` (`auth.service.ts`, `user.service.ts`) — hash com salt embutido (`bcrypt.hash`), nunca
guardamos nem devolvemos a password em claro (campo excluído das respostas). Se perguntarem
"salted" especificamente: confirmar que é o salt gerado internamente pelo próprio `bcrypt` (não
um salt fixo/global — isso seria um erro grave a evitar dizer).

### 4.6 Form Validation
> "Both frontend AND backend. Test invalid inputs, SQLi, XSS."

- **Backend**: `ValidationPipe` global (`main.ts`) + DTOs `class-validator`/`class-transformer`
  em todos os endpoints (`create-market.dto.ts`, `place-bet.dto.ts`, etc.) — rejeita payload
  malformado antes da lógica de negócio. Proteção a SQL injection é estrutural: TypeORM
  parametriza tudo, não há SQL concatenado.
- **Frontend**: validação é feita nos componentes de formulário (`Field.tsx` em
  `features/auth`), sem uma lib dedicada tipo `zod`/`react-hook-form` — **preparar esta resposta
  honesta** se perguntarem "que lib usam": "validação manual nos componentes controlados, com
  `required`/checks antes do submit; a validação que realmente protege o sistema é a do
  backend."
- **Testar antes da defesa**: submeter um formulário vazio, um `amount` negativo numa aposta, uma
  mensagem de chat com `<script>alert(1)</script>` (deve aparecer como texto, não executar — o
  React escapa por omissão), e uma pesquisa com `' OR '1'='1` no campo de busca de markets.

### 4.7 Secure Connections (HTTPS) ✅
> "Is HTTPS used for all connections to the backend? ... must be encrypted using HTTPS."

**Implementado.** Resposta pronta:
> "Sim — o `nginx` do frontend faz terminação TLS na porta 443 (com redirect automático de
> 80→443) e o backend NestJS liga com `httpsOptions` diretamente (`main.ts`), usando um
> certificado partilhado entre os dois. Toda a comunicação frontend↔backend, incluindo o
> WebSocket do Socket.IO, passa a ser `https://`/`wss://`. O certificado é autoassinado — gerado
> automaticamente por `make certs` (chamado por `make up-prod`, continua um comando só) — por
> isso o browser mostra um aviso de 'ligação não privada' no primeiro acesso a cada máquina; é
> esperado para um certificado autoassinado local e não indica falta de encriptação."

**Demo ao vivo**: abrir `https://localhost:5173`, mostrar o cadeado/aviso do certificado
autoassinado na barra de endereço (aceitar uma vez), abrir DevTools → Network → confirmar
`https://localhost:3000/...` nos pedidos à API e `wss://` no pedido do Socket.IO.

**Se pedirem para explicar porque é autoassinado e não Let's Encrypt**: "Let's Encrypt exige um
domínio público resolvível por DNS; para uma avaliação local em `localhost` isso não é possível,
por isso um certificado autoassinado é a alternativa padrão — a encriptação em trânsito é a
mesma, só a cadeia de confiança do certificado é que não é validada por uma CA pública."

---

## 5. MODULES VERIFICATION

> "Does the project claim at least 14 points?" → **sim, 18 pts** de módulos core (README). Cada
> um vai ser pedido para demo ao vivo — módulo que não corre ao vivo conta **0**, mesmo que
> reivindicado. Preparar a demo de **cada linha** abaixo.

### Major modules (2 pts cada)

| Módulo | Como demonstrar ao vivo |
|---|---|
| Web framework (frontend+backend) | Mostrar `app-frontend` (React/Vite) e `app-backend` (NestJS) a correr; qualquer página a funcionar já prova isto. |
| Real-time via WebSockets | Abrir 2 abas em `/markets`, apostar numa → preço atualiza na outra sem reload. |
| Interação entre users (chat/perfil/amigos) | Abrir o chat de um market, mandar mensagem com `@menção`; mostrar um perfil de bettor; enviar/aceitar um pedido de amizade. |
| User management standard | Editar perfil, trocar avatar, ver a página de perfil pública. |
| Permissões avançadas / roles | Login como `moderator` → mostrar `/users` sem botão de apagar e badge "Moderator"; mostrar que só `admin` promove/apaga. |
| Analytics dashboard | `/admin/analytics` — mudar range de datas, exportar CSV, ver gráficos a atualizar. |

### Minor modules (1 pt cada)

| Módulo | Como demonstrar ao vivo |
|---|---|
| ORM | Mostrar uma migração em `src/migrations/` e uma entidade TypeORM. |
| Notificações completas | Resolver uma aposta noutra conta → notificação chega sem refresh na primeira. |
| Pesquisa/filtros/sort/paginação | Em `/markets`: filtrar por categoria, ordenar por volume, paginar. |
| OAuth 2.0 remoto | Login com Google e login com 42 Intra, ambos a criar/entrar na conta certa. |
| 2FA | Ativar em Settings, scan do QR, logout/login a pedir código TOTP. |
| Gamificação | Mostrar streak diário, uma quest a completar-se, o leaderboard. |

**Se pedirem para calcular os pontos ao vivo**: 2+2+2+2+2+2 (majors) + 1+1+1+1+1+1 (minors) =
**18 pts**, 4 acima do mínimo de 14.

---

## 6. CODE QUALITY

### Code Structure
> "Clear file/folder structure, understandable, consistent style."
- Backend por domínio: `modules/<domínio>/{*.module,*.controller,*.service,dto/,entities/}.ts`.
- Frontend feature-first: `features/<domínio>/{pages,components,hooks,services,routes.tsx}`.
- ESLint com `--fix` em ambos, `tsc -b` obrigatório no build do frontend.

### Technical Decisions
> "Why this stack, how structured, challenges, trade-offs."
Ver justificações no README (secção Technical Stack) — ex.: "NestJS pelo DI/módulos nativos com
o número crescente de módulos", "TypeORM com `synchronize:false` porque lidamos com dados
tipo-financeiros (wallet)", "pools em vez de odds fixas para a casa nunca 'imprimir' dinheiro".

### Teamwork Evidence
`git shortlog` mostra os 5 a commitar; cada membro sabe explicar as partes dos outros (treinar
isto — é literalmente testado pedindo a 2+ pessoas para explicar o projeto). README distribui o
trabalho claramente por feature com autor.

---

## 7. FUNCTIONALITY

### Stability and Functionality
> "No critical bugs during demo, main features work, basic error handling, **multi-user support
> — multiple users simultaneously**."

**Testar antes da defesa, com 2+ contas abertas ao mesmo tempo em janelas diferentes:**
- Duas contas a apostar no mesmo market ao mesmo tempo → sem corrupção de saldo/pool.
- Chat com 2 utilizadores em simultâneo, mentions cruzadas.
- Uma conta a receber notificação gerada pela ação da outra, em tempo real.

### Overall Quality
> "Goes beyond minimal requirements, learned new tech, creativity."
> "Fomos além do mínimo: 18 pts core (4 acima do necessário) + o teto de bónus completo,
> aprendemos TOTP/2FA de raiz, montámos um stack de observabilidade completo (ELK +
> Prometheus/Grafana) mesmo sem contar pontos extra por isso, e substituímos o conceito
> tradicional por um domínio de produto real (prediction markets) com uma economia fechada
> (zero-sum, a casa não imprime dinheiro)."

---

## 8. FINAL VERIFICATION

### Final Module Count
Recalculado **só com o que realmente correu ao vivo** na demo — por isso o guião da secção 5 é
para treinar antes, não improvisar na hora. Alvo: confirmar os 18 pts core batem certo depois de
cada demo individual.

### Project Success
Pergunta de fecho, resposta directa:
> "Sim — mandatório completo e funcional, os 5 contribuíram de forma visível e distinta,
> conseguimos explicar decisões e trade-offs, e o README está completo. O único risco conhecido
> é o HTTPS (secção 0), que assumimos abertamente em vez de esconder."

---

## 9. BONUS

> ⚠️ Só é avaliado **se** o mandatório estiver **inteiramente e perfeitamente** feito **e** o
> tratamento de erros aguentar uso incorreto/inesperado. Ver secção 0 — resolver o HTTPS antes
> de contar com estes pontos.

| Módulo bónus | Pts | Onde está | Como demonstrar |
|---|---|---|---|
| GDPR — export dos meus dados | 1 | `GET /bettor/me/export` + botão em Settings → Account | Clicar em "Export my data", mostrar o JSON com os dados da própria conta; mostrar que sem sessão dá `401`. |
| Insights de atividade pessoal | 1 | `GET /market/portfolio/activity` + card "My Activity" no perfil | Ir ao perfil próprio, mostrar o card com dados reais agregados por dia. |
| Design system documentado | 1 | `/design-system` | Mostrar a paleta lida ao vivo das CSS vars, catálogo de componentes, e depois apontar um uso real (não só a própria página) — ex. o `Button`/`Dialog` usados no modal de auth ou no admin. |
| +2 módulos core acima do mínimo de 14 | 2 | Quaisquer 2 dos 6 Majors/6 Minors da secção 5 além dos 14 pts base | O examinador escolhe quais contam como "extra" — o total é o que importa (18 core = 4 acima do mínimo, mais os 3 bónus dedicados = 7 pts candidatos a bónus, capados em 5). |

**Testar "error management handles unexpected or bad usage" antes da defesa** (é condição
explícita para o bónus contar): apostar mais xp do que o saldo disponível, apostar num market já
`resolved`/`cancelled`, tentar aceder a `/admin/analytics` sem ser admin/moderator, mandar um
`PATCH /market/:id/resolve` como utilizador normal (deve dar 403, não crash).

---

## 10. RATINGS — o que cada flag significa

| Flag | Quando se aplica aqui |
|---|---|
| `Ok` / `Outstanding project` | Objetivo realista se mandatório + bónus passarem sem surpresas |
| `Incomplete work` | Risco real **só** se HTTPS não resolvido e o examinador ler isso como requisito mandatório em falta |
| `Incomplete group` | Risco só se faltar alguém — ver Team Presence |
| `Can't support / explain code` | Mitigado por treinar a secção 2 (Project Coherence) com 2+ pessoas |
| `Cheat` / `Forbidden function` / `Crash` | Não aplicável a este projeto tal como está |

---

## 11. Esquemas de apoio (para quem pedir para "desenhar o fluxo")

### Autenticação (JWT + OAuth + 2FA)
```
┌────────────┐   1. POST /auth/signin (email+pass)   ┌────────────┐
│  Browser   │ ─────────────────────────────────────▶│  Backend   │
│            │◀── 2. bcrypt.compare() ─────────────── │  (NestJS)  │
│            │  3a. sem 2FA → cookie JWT httpOnly      │            │
│            │  3b. com 2FA → cookie temporário         │            │
│            │  4. POST /auth/2fa/verify {code}        │            │
│            │ ───────────────────────────────────────▶│ otplib     │
│            │◀───── cookie JWT definitivo ──────────── │ TOTP check │
└────────────┘                                         └────────────┘
Fluxo idêntico para OAuth (Google / 42 Intra): callback → auto-provisioning → mesmo 2FA gate.
```

### Ciclo de vida de um market
```
criação (seed 100/100) → [new] (<48h) → [live] → [closing] (últimas 24h)
   → resolve (admin/moderator ou cron de exame) → [resolved] (payout, 5% rake)
                                                 ou [cancelled] (reembolso total)
```

### Pricing (pool-based)
```
YES price = yesPool / (yesPool + noPool)
Aposta 200xp YES: yesPool 100→300, noPool=100 → YES price 50%→75%
shares = amount / entryPrice = 200 / 0.50 = 400
payout = (shares_user / Σ shares_vencedores) × (pool_total − 5% rake)
```

### Pedido de amizade
```
sendFriendRequest ─▶ [PENDING] ──accept──▶ friends[] (2 direções) + notificação
                          ├──reject──▶ apagado
                          └──cancel──▶ apagado
removeFriend ─▶ remove relação nas 2 direções + limpa pedidos residuais
```
> Transação `SERIALIZABLE` no envio evita 2 pedidos em corrida entre os mesmos utilizadores.

### Observabilidade
```
Backend (nestjs-pino JSON) → backend.log → Logstash → Elasticsearch (ILM retention) → Kibana
Backend GET /metrics (prom-client) → Prometheus (+ node/postgres exporters, alert rules) → Grafana
```

---

## 12. Checklist final antes de entrar na sala

- [x] **HTTPS implementado** (secção 0/4.7) — confirmar `make certs`/`make up-prod` correm sem erro na máquina da defesa
- [ ] Todos os 5 confirmados presentes
- [ ] `README.md` sem `[team to confirm]` por preencher
- [ ] `make up-prod` testado do zero (sem volumes/containers antigos) → `make ps-prod` 12/12 Up
- [ ] `git log --all --full-history -- .env secrets/` confirmando que nunca foram commitados
- [ ] Consola do Chrome limpa nas páginas principais
- [ ] 2 contas + 1 admin/moderator prontas, uma com 2FA ativo
- [ ] 1 market `live` com posições dos dois lados (para o gráfico mexer ao vivo)
- [ ] Testados os casos de erro da secção 9 (saldo insuficiente, market resolvido, 403 em rota admin)
- [ ] Cada pessoa treinou explicar o trabalho dos outros, não só o seu
- [ ] Kibana com data view `transcendence-logs-*` e Grafana com dashboard populado
