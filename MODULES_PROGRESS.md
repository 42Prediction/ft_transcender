# Progresso dos Módulos — ft_transcendence (`feat/marteket`)

> Baseado no `en.subject.pdf` (Chapter IV — Modules) e numa inspeção do código atual em
> `app-backend/src` e `app-frontend/src` a 2026-07-09 (atualizado após fechar os 4 módulos
> parciais mais próximos nesse mesmo dia; e numa 2ª ronda no mesmo dia que endureceu a
> economia da casa e o ciclo automático dos markets de exame — ver nota abaixo).
> Objetivo do subject: **14 pontos** (Major = 2 pts, Minor = 1 pt).

O projeto escolhido é um **prediction market** (não um jogo), pelo que toda a categoria
**"Gaming and user experience"** e os módulos que dependem de um jogo (Game Statistics,
AI Opponent, Torneios, etc.) estão **bloqueados/não aplicáveis** enquanto não existir
nenhum jogo implementado.

---

## Resumo rápido

| Estado | Significado |
|---|---|
| ✅ Feito | Implementado e razoavelmente completo no código atual |
| 🟡 Parcial | Existe código relevante mas não cumpre todos os critérios do subject |
| ❌ Não feito | Sem evidência no código |
| 🚫 N/A | Bloqueado por dependência (ex: precisa de um jogo) |

**Pontos aproximados já cobertos (✅ completos): ~19 pts** (16 core + 3 bónus) — acima da
meta de 14, e no teto de bónus de 5 (Cap. VII), depois de fechar os 4 módulos que estavam
🟡 (pesquisa+paginação, notificações completas, permissões avançadas com role `moderator`,
dashboard de analytics com export+filtros de data) e implementar 3 módulos bónus (GDPR data
export, insights de atividade pessoal, design system documentado).

> ✅ **`README.md` criado** na raiz do repositório, com todas as secções obrigatórias do
> Cap. VI (incluindo a justificação de cada módulo, exigida pelo Cap. VII para o bónus
> contar). **Faltam preencher alguns `[team to confirm]`** — o canal de comunicação e a
> cadência de reuniões (secção "Project Management") e a repartição exata de quem
> implementou cada feature (secção "Features List" e "Individual Contributions") — a
> equipa só tinha dado logins+papéis, não esse detalhe. Preencher antes da entrega.

---

## IV.1 Web

| Módulo | Peso | Estado | Evidência |
|---|---|---|---|
| Framework frontend + backend (Major) | 2 | ✅ | React 19 (`app-frontend`) + NestJS (`app-backend`) |
| Frontend framework (Minor) | 1 | 🚫 | já contabilizado no Major acima (não acumula) |
| Backend framework (Minor) | 1 | 🚫 | idem |
| Real-time via WebSockets (Major) | 2 | ✅ | `market.gateway.ts` (Socket.IO, namespace `/market`, chat + notificações em tempo real) |
| Interação entre users — chat/perfil/amigos (Major) | 2 | ✅ | `MarketChat.tsx` (chat via WS), perfis de bettor, `friend.api.ts` / `FRIENDLIST_RELATIONS.md` (add/remove amigos) |
| API pública documentada com API key + rate limit (Major) | 2 | ❌ | Endpoints REST existem (`market.controller.ts` tem >5 rotas GET/POST/PATCH), mas **não há API key**, **rate limiting** nem documentação formal (Swagger/OpenAPI) |
| ORM (Minor) | 1 | ✅ | TypeORM em todo o backend |
| Sistema de notificações completo (Minor) | 1 | ✅ | `NotificationService.createMany` cobre bet resolved/cancelled, chat mentions, e agora também **pedidos de amizade** (`FRIEND_REQUEST_RECEIVED`/`FRIEND_REQUEST_ACCEPTED`, ligados via `friend.service.ts`) — push em tempo real via `MarketGateway` + inbox persistente |
| Real-time collaborative features (Minor) | 1 | ❌ | Sem evidência |
| SSR (Minor) | 1 | ❌ | Vite SPA puro, sem SSR |
| PWA (Minor) | 1 | ❌ | Sem `manifest.json` nem service worker |
| Design system próprio, ≥10 componentes reutilizáveis (Minor) | 1 | ✅ | Ver secção "Bonus" abaixo — página `/design-system` documenta paleta/tipografia/ícones e um catálogo de 14 componentes, incluindo 6 primitivos reais em `components/ui/` (Button, Dialog, Card, Badge, Input, Avatar), agora **adotados de facto** (não só listados) em 8 ficheiros de features (login admin, users, contas, perfil, auth modal, criação de market, resolução de market) |
| Pesquisa avançada com filtros/sort/paginação (Minor) | 1 | ✅ | `/markets` já filtra por categoria/estado/pesquisa; `Markets.tsx` agora também ordena (Volume/Closing soon/Probability) e pagina (12/página, Prev/Next) sobre o resultado filtrado, sem quebrar o modelo de atualização em tempo real via WebSocket |
| Upload/gestão de ficheiros (Minor) | 1 | 🟡 | `avatar.service.ts` (upload de avatar com `multer`/`sharp`) — cobre imagens, mas não é um sistema genérico multi-tipo (não trabalhado nesta ronda) |

## IV.2 Accessibility and Internationalization

| Módulo | Peso | Estado | Evidência |
|---|---|---|---|
| WCAG 2.1 AA completo (Major) | 2 | ❌ | Sem evidência de auditoria/ARIA sistemática |
| i18n, 3+ idiomas (Minor) | 1 | ❌ | Sem `react-i18next` ou equivalente instalado |
| RTL (Minor) | 1 | ❌ | Sem evidência |
| Browsers adicionais (Minor) | 1 | ❌ | Sem testes cross-browser documentados |

## IV.3 User Management

| Módulo | Peso | Estado | Evidência |
|---|---|---|---|
| User management standard (Major) | 2 | ✅ | Update perfil, upload avatar, friends + online status, página de perfil (`bettor` module + `features/user/profile`) |
| Game stats / match history (Minor) | 1 | 🚫 | Requer um jogo — N/A no conceito atual |
| OAuth 2.0 remoto (Minor) | 1 | ✅ | `google.strategy.ts` + `school42.service.ts` (login 42) |
| Permissões avançadas / CRUD + roles (Major) | 2 | ✅ | 3 roles agora (`admin`, `moderator`, `user`, migração `AddModeratorRole`). Moderator pode ver `/users` (read-only) e resolver/cancelar markets, mas não CRUD de users (admin-only). Frontend admin (`Users.tsx`) esconde o botão de apagar e mostra badge "Moderator" quando o viewer não é admin; guards de login/rota (`singnin.tsx`, `guards.ts`) aceitam ambas as roles |
| Sistema de organizações (Major) | 2 | ❌ | Sem entidade/módulo de "organization" |
| 2FA completo (Minor) | 1 | ❌ | Sem `speakeasy`/otplib nem rotas 2FA |
| Analytics/insights de atividade do user (Minor) | 1 | 🟡 | `WinLossChart.tsx`, portfólio com P&L — é analítica de apostas, não "atividade" genérica |

## IV.4 Artificial Intelligence

| Módulo | Peso | Estado |
|---|---|---|
| AI Opponent (Major) | 2 | 🚫 N/A (precisa de jogo) |
| RAG completo (Major) | 2 | ❌ |
| LLM interface completa (Major) | 2 | ❌ |
| Recommendation system ML (Major) | 2 | ❌ |
| Moderação de conteúdo AI (Minor) | 1 | ❌ |
| Voz/speech (Minor) | 1 | ❌ |
| Sentiment analysis (Minor) | 1 | ❌ |
| Reconhecimento de imagem (Minor) | 1 | ❌ |

Nenhum módulo de IA implementado.

## IV.5 Cybersecurity

| Módulo | Peso | Estado |
|---|---|---|
| WAF/ModSecurity + HashiCorp Vault (Major) | 2 | ❌ — segredos ainda em `.env`/`secrets/db_password.txt`, sem Vault nem WAF |

## IV.6 Gaming and user experience

Todo o bloco depende de **"pelo menos um jogo implementado"**, e este projeto (prediction
market) não tem nenhum jogo. **Toda a categoria está N/A** enquanto isso não mudar — o que
é uma decisão de equipa a rever, já que era originalmente a categoria "esperada" (Pong).

| Módulo | Peso | Estado |
|---|---|---|
| Jogo web completo (Major) | 2 | 🚫 |
| Remote players (Major) | 2 | 🚫 |
| Multiplayer 3+ (Major) | 2 | 🚫 |
| Segundo jogo + matchmaking (Major) | 2 | 🚫 |
| 3D com Three.js/Babylon.js (Major) | 2 | 🚫 |
| Chat avançado (Minor) | 1 | 🟡* | *a base de chat existe (`MarketChat.tsx`), mas os extras (bloquear users, convidar para jogo, histórico persistente) não — e formalmente este módulo também depende da categoria gaming |
| Torneios (Minor) | 1 | 🚫 |
| Customização de jogo (Minor) | 1 | 🚫 |
| Gamificação — achievements/badges/leaderboard/XP (Minor) | 1 | ✅ | Reforçado nesta ronda: economia XP real e ledgerizada — depósito no signup por **level da 42** (`bettor.service.ts`, base 1000 + level×500 `SCHOOL42_REWARD`) e cron diário de level-ups (`bettor-level-sync.service.ts`); **streak diário** com recompensa escalonada + **quests** (`engagement.service.ts`, catálogo first_bet/add_friend/first_win) expostos em `RewardsMenu.tsx`/`useQuests.ts`/`useDailyBonus.ts`; leaderboard de bettors. **Não depende de jogo**, é válido no conceito atual |
| Spectator mode (Minor) | 1 | 🚫 |

## IV.7 Devops

| Módulo | Peso | Estado | Evidência |
|---|---|---|---|
| ELK stack (Major) | 2 | ✅ | Stack completo no `docker-compose.yml`: **Elasticsearch** (indexa/armazena, X-Pack security ligado), **Logstash** (pipeline `observability/logstash/pipeline/logstash.conf` — file input dos logs JSON do backend → transform → ES), **Kibana** (autenticado como `kibana_system`). Backend emite logs JSON estruturados via `nestjs-pino` para `/app/logs/backend.log` (volume partilhado). **Retenção/arquivamento** via política ILM (delete após `LOG_RETENTION_DAYS`, default 7d) aplicada por template de índice em `observability/setup/setup.sh`. **Acesso seguro** a todos os componentes (passwords em `.env`) |
| Prometheus + Grafana (Major) | 2 | ✅ | **Prometheus** (`observability/prometheus/prometheus.yml`) faz scrape do backend + exporters; backend expõe `GET /metrics` via `@willsoto/nestjs-prometheus` (métricas default de processo + `http_requests_total`/`http_request_duration_seconds` custom por método/rota/estado, recolhidas por middleware que cobre **todos** os requests incl. 404/401). **Exporters**: `node-exporter` (host) + `postgres-exporter` (BD). **Regras de alerta** em `observability/prometheus/alert.rules.yml` (BackendDown, PostgresDown, HighHttpErrorRate, HighRequestLatencyP95, HighProcessMemory). **Grafana** com datasource+dashboard provisionados e **acesso seguro** (`GF_SECURITY_ADMIN_PASSWORD`, sign-up desativado) |
| Backend como microserviços (Major) | 2 | ❌ | NestJS monolítico modular, não microserviços |
| Health check + backups automáticos (Minor) | 1 | ❌ | Sem evidência (healthchecks de container existem no compose, mas não um status page + backups/DR completos) |

**Containerização (requisito mandatório de "deploy com 1 comando"): ✅ cumprido.** Novo
`docker-compose.yml` na raiz sobe **os 3 componentes** (Postgres + backend em `app-backend/Dockerfile`
+ frontend em `app-frontend/Dockerfile` servido por nginx) **e** todo o stack de observabilidade
com um único comando: `make up-prod` (ou `docker compose up -d --build`). O antigo
`docker-compose.dev.yml` (só Postgres, apps via `npm`/`make dev`) mantém-se para o fluxo de
desenvolvimento. Migrações correm automaticamente no arranque do container (`RUN_MIGRATIONS=true`,
via `migrationsRun` do TypeORM).

## IV.8 Data and Analytics

| Módulo | Peso | Estado | Evidência |
|---|---|---|---|
| Dashboard de analytics com visualização (Major) | 2 | ✅ | Nova página `/admin/analytics` (`Analytics.tsx`): gráficos interativos de linha (volume/dia), barras (bets/dia) e pizza (volume por categoria), presets 7D/30D/90D + inputs de data customizáveis, export CSV (client-side, sem dependência nova), atualização em tempo real via `useMarketUpdates` (debounced refetch). Backend: `GET /market/analytics?from=&to=` (admin/moderator) em `market.service.ts#getAnalytics` |
| Export/import de dados (Minor) | 1 | ❌ | Sem evidência |
| GDPR compliance (Minor) | 1 | ❌ | Sem evidência |

## IV.9 Blockchain

| Módulo | Peso | Estado |
|---|---|---|
| Scores em blockchain (Avalanche/Solidity) (Major) | 2 | ❌ |
| Backend ICP (Minor) | 1 | ❌ |

## IV.10 Modules of choice

Nenhum módulo custom justificado no README ainda.

---

## Bonus (Chapter VII)

Regras do subject:
- Só conta se os **14 pontos mandatórios já estiverem validados** (✅ já estamos aí).
- Cada módulo extra vale o mesmo que no core: **Major = 2 pts, Minor = 1 pt**.
- **Máximo de 5 pontos de bónus**, façam-se quantos módulos extra forem.
- Cada módulo bónus tem de ser **totalmente funcional**, cumprir os requisitos descritos,
  **acrescentar valor real**, e ter **justificação própria no README** — sem isto último,
  não conta (ver aviso no topo do documento).

**Situação: teto de bónus atingido — 5/5 pontos.** 2 pontos vinham dos módulos Major extra
já acima do mínimo (16 − 14). Os 3 que faltavam foram implementados e validados:

| # | Módulo | Peso | Onde está | Estado |
|---|---|---|---|---|
| 1 | **GDPR compliance features** (IV.8, Minor) | 1 | `GET /bettor/me/export` (`bettor.controller.ts`/`bettor.service.ts`) + botão em Settings → Account (`AccountPanel.tsx`) | ✅ testado (dados corretos, `401` sem sessão) |
| 2 | **Insights de atividade pessoal** (IV.3, Minor) | 1 | `GET /market/portfolio/activity` (`market.service.ts#getMyActivity`) + card "My Activity" no perfil (`ActivityInsights.tsx`) | ✅ testado com dados reais |
| 3 | **Design system documentado, ≥10 componentes reutilizáveis** (IV.1, Minor) | 1 | Página pública `/design-system` (`DesignSystem.tsx`) — paleta lida ao vivo das CSS vars, tipografia, ícones, variantes de Button/Badge, showcase de Input/Card/Avatar, catálogo de 14 componentes. `components/ui/` tem agora 6 primitivos reais (Button, Dialog, Card, Badge, Input, Avatar) — **adotados** em 8 ficheiros reais (não só exibidos na própria página) | ✅ reachable, `tsc`/lint limpos, sem regressões |

**Total: 14 mandatórios + 5 bónus = 19 pontos**, com justificação de cada módulo (core e
bónus) escrita no `README.md` (secção "Modules"), conforme exigido pelo Cap. VII. Ir além
disto não traz benefício adicional — o subject limita o bónus a 5 pontos.

Candidatos descartados por serem mais esforço para o mesmo 1 ponto (não implementados):
export/import de dados em bulk, testes cross-browser, PWA, 2FA — ver histórico da conversa
se algum destes vier a fazer sentido no futuro.

---

## Conclusão

**Módulos claramente ✅ completos e defensáveis hoje:**
1. Web framework frontend + backend (Major, 2pt)
2. Real-time WebSockets (Major, 2pt)
3. Interação entre users — chat/perfil/amigos (Major, 2pt)
4. ORM/TypeORM (Minor, 1pt)
5. Sistema de notificações completo (Minor, 1pt)
6. Pesquisa avançada + ordenação + paginação (Minor, 1pt)
7. OAuth remoto (42 + Google) (Minor, 1pt)
8. User management standard (Major, 2pt)
9. Permissões avançadas com role `moderator` (Major, 2pt)
10. Dashboard de analytics com export + filtros de data (Major, 2pt)
11. Gamificação (Minor, 1pt)

**Módulos bónus ✅ (Cap. VII, teto de 5 pontos atingido):**
12. GDPR — export dos meus dados (Minor, 1pt)
13. Insights de atividade pessoal (Minor, 1pt)
14. Design system documentado (Minor, 1pt)

**Total: 19 pontos** (14 mandatórios + 5 bónus, o máximo possível) — ver secção "Bonus"
acima. `README.md` criado com todas as secções obrigatórias e a justificação de cada um
destes 14 módulos (core + bónus).

**Ainda 🟡:**
- Upload/gestão de ficheiros genérico (Minor, 1pt) — só existe upload de avatar (imagem única); não conta para o bónus, já está no teto de 5

**Nada foi feito ainda em:** Acessibilidade/i18n, Inteligência Artificial, Cybersecurity
(WAF/Vault), Devops (ELK/Prometheus/microserviços), Blockchain, e toda a categoria Gaming
(por não existir jogo). Também falta containerizar backend+frontend no `docker-compose`
para cumprir o requisito mandatório de "deploy com um único comando".

**Migrações novas nesta ronda:** `AddFriendNotificationTypes` (notificações de amizade),
`AddModeratorRole` (novo valor no enum `users_role_enum`) — correr `make migrate-run` (ou
`npm run migration:run` em `app-backend`) antes de testar em qualquer outro ambiente.

---

## Nota — 2ª ronda (mesmo dia): robustez da economia e do motor de markets

Trabalho de **correção/fidedignidade** (não acrescenta pontos de módulo — o bónus já está no
teto de 5 —, mas torna as features existentes defensáveis numa demo):

- **Economia da casa fechada (zero-sum).** Removido o "minting fantasma": o admin (casa)
  **financia** a semente de cada market (200 xp, `MARKET_SEED`) da sua carteira (inicial
  1 000 000 xp) e **cobra 5% de rake** sobre o stake dos perdedores na resolução
  (`market.service.ts#resolveMarket`). Markets auto-gerados também debitam o admin.
- **Markets de exame 100% automáticos e verificados contra a API da 42.** Sync a cada
  15 min cria/cancela+reembolsa consoante inscrições/desinscrições; **fecham** por tempo no
  início do exame (`placeBet` bloqueia após `closesAt`); **auto-resolvem** só quando o exame
  está trancado (`endAt` passou) **e** o cadete está `finished` com nota publicada, derivando
  YES (≥100) / NO da nota real (`exam-market-sync.service.ts`). Testado em dry-run contra o
  Exam Rank 06 real: exame trancado detetado, cadetes avaliados → YES por nota 100, e cadetes
  ainda `in_progress` (mesmo com `finalMark=0`) corretamente **não** resolvidos.
- **Stats e gráfico fidedignos.** Homepage (Active traders / Live markets / Volume) passou a
  refletir dados reais e a **excluir o admin** das contagens de traders/volume
  (`market.service.ts#getStats`); o gráfico do market usa histórico de preços reconstruído das
  posições reais (`getPriceHistory` + `GET /market/:id/history`), substituindo a série falsa.
- **Nomenclatura de moeda.** Moeda da plataforma = **pontos (xp)**; `%` para percentagem
  (substituídos os antigos `₳`/`¢` no frontend).

**Antes de entregar:** preencher os `[team to confirm]` no `README.md` (canal de
comunicação/reuniões, e quem implementou cada feature nas secções "Features List" e
"Individual Contributions") — essa informação não estava disponível ao gerar o documento.

---

## Nota — ronda DevOps (branch `feat/implement_devops`)

Implementados os **2 primeiros Major do IV.7 DevOps** e destravado o requisito mandatório de
deployment containerizado.

- **Log management com ELK (Major).** Backend passou a emitir **logs JSON estruturados**
  (`nestjs-pino`, `src/observability/logger.config.ts`) para stdout + `LOG_FILE`, com redaction
  de cookies/authorization/passwords. **Logstash** faz file-input desse log, transforma (mapeia
  o nível numérico do pino, timestamp) e indexa em **Elasticsearch** (X-Pack security ligado);
  **Kibana** liga-se como `kibana_system` (least-privilege). **Retenção** por política **ILM**
  (delete após `LOG_RETENTION_DAYS`) aplicada via template de índice no `elk-setup` one-shot.
- **Monitoring com Prometheus + Grafana (Major).** Backend expõe **`/metrics`**
  (`src/observability/metrics.module.ts` + `http-metrics.middleware.ts`) com métricas default de
  processo e séries HTTP custom (throughput/latência por método/rota/estado, incluindo 404/401).
  **Prometheus** faz scrape do backend + **node-exporter** + **postgres-exporter**, com
  **regras de alerta**. **Grafana** provisiona datasource + dashboard e tem acesso protegido.
- **Deploy com 1 comando (mandatório).** Novo `docker-compose.yml` + `app-backend/Dockerfile` +
  `app-frontend/Dockerfile` (nginx) sobem tudo com `make up-prod`. Migrações correm no arranque.

**Impacto na pontuação:** estes 2 Major **não somam pontos** — o teto de bónus (5) já estava
atingido antes desta ronda, por isso o total permanece **19**. O valor real é: (1) fechar o
**requisito mandatório** de containerização e (2) robustez/demonstrabilidade da entrega.

**Verificação feita:** imagem do backend construída e testada em container isolado — `/metrics`
responde 200 com métricas default + custom (404 contabilizado), logs JSON escritos no volume
partilhado (fonte do Logstash), headers sensíveis redigidos; imagem do frontend construída com
sucesso; `docker compose config` válido. **Não** foi feito boot end-to-end do stack ELK+Grafana
completo neste ambiente (imagens multi-GB) — validado por config; correr `make up-prod` para o
levantar. **Nota:** o `docker-compose.yml` (projeto `transcendence-prod`) e o
`docker-compose.dev.yml` usam os mesmos portos de host (5432/3000/5173) — não correr os dois em
simultâneo.
