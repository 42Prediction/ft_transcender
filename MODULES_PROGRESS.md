# Progresso dos Módulos — ft_transcendence (`feat/marteket`)

> Baseado no `en.subject.pdf` (Chapter IV — Modules) e numa inspeção do código atual em
> `app-backend/src` e `app-frontend/src` a 2026-07-09.
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

**Pontos aproximados já cobertos (✅ completos): ~13–15 pts**, mas atenção — vários itens
"parciais" abaixo ainda não cumprem 100% dos critérios do subject e podem não passar em
avaliação como estão.

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
| Sistema de notificações completo (Minor) | 1 | 🟡 | `notification.service.ts`/`notification.controller.ts`/`entities/notification.entity.ts` existem, ligados ao gateway — confirmar se cobre create/update/delete de todas as entidades ou só markets/bets |
| Real-time collaborative features (Minor) | 1 | ❌ | Sem evidência |
| SSR (Minor) | 1 | ❌ | Vite SPA puro, sem SSR |
| PWA (Minor) | 1 | ❌ | Sem `manifest.json` nem service worker |
| Design system próprio, ≥10 componentes reutilizáveis (Minor) | 1 | 🟡 | shadcn/radix + Tailwind em `components/ui/` — provavelmente já passa das 10 componentes, mas falta confirmar paleta/tipografia documentadas |
| Pesquisa avançada com filtros/sort/paginação (Minor) | 1 | 🟡 | `/market?category=&status=&search=` e `/market/search`, `/market/students/search` existem — mas **sem paginação** visível no controller |
| Upload/gestão de ficheiros (Minor) | 1 | 🟡 | `avatar.service.ts` (upload de avatar com `multer`/`sharp`) — cobre imagens, mas não é um sistema genérico multi-tipo |

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
| Permissões avançadas / CRUD + roles (Major) | 2 | 🟡 | `RolesGuard` + `@Roles('admin')` em `user.controller.ts` (GET/PATCH/DELETE `:id`, list), mas só 2 roles (`admin`, `user`) — falta "guest/moderator" e views diferenciadas mais ricas para cumprir por completo |
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
| Gamificação — achievements/badges/leaderboard/XP (Minor) | 1 | ✅ | `RewardsMenu.tsx`, `useQuests.ts`, `useDailyBonus.ts`, leaderboard de bettors — **não depende de jogo**, é válido no conceito atual |
| Spectator mode (Minor) | 1 | 🚫 |

## IV.7 Devops

| Módulo | Peso | Estado | Evidência |
|---|---|---|---|
| ELK stack (Major) | 2 | ❌ | Sem Elasticsearch/Logstash/Kibana |
| Prometheus + Grafana (Major) | 2 | ❌ | Sem evidência |
| Backend como microserviços (Major) | 2 | ❌ | NestJS monolítico modular, não microserviços |
| Health check + backups automáticos (Minor) | 1 | ❌ | Sem evidência |

`docker-compose.dev.yml` atualmente só sobe o **Postgres** (backend/frontend correm via
`npm`/`make dev`, não em containers) — importante notar que o subject exige deployment
**containerizado com um único comando**, o que ainda não está cumprido para os 3 componentes.

## IV.8 Data and Analytics

| Módulo | Peso | Estado | Evidência |
|---|---|---|---|
| Dashboard de analytics com visualização (Major) | 2 | 🟡 | `recharts` usado em `WinLossChart.tsx` e `MarketDetail.tsx` — falta export (PDF/CSV) e filtros de datas customizáveis para contar como completo |
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

## Conclusão

**Módulos claramente ✅ completos e defensáveis hoje:**
1. Web framework frontend + backend (Major, 2pt)
2. Real-time WebSockets (Major, 2pt)
3. Interação entre users — chat/perfil/amigos (Major, 2pt)
4. ORM/TypeORM (Minor, 1pt)
5. OAuth remoto (42 + Google) (Minor, 1pt)
6. User management standard (Major, 2pt)
7. Gamificação (Minor, 1pt)

**Total sólido: 11 pontos**, ainda abaixo dos 14 exigidos.

**Mais perto de completar (🟡), com trabalho adicional relativamente pequeno:**
- Pesquisa avançada + paginação (Minor, 1pt) — falta só paginação
- Sistema de notificações completo (Minor, 1pt) — confirmar cobertura CRUD total
- Dashboard analytics (Major, 2pt) — falta export + filtros de data
- Permissões avançadas (Major, 2pt) — falta roles extra + CRUD mais explícito

Fechando os 4 itens 🟡 mais próximos dariam **+5 pontos → 16 pontos**, acima da meta.

**Nada foi feito ainda em:** Acessibilidade/i18n, Inteligência Artificial, Cybersecurity
(WAF/Vault), Devops (ELK/Prometheus/microserviços), Blockchain, e toda a categoria Gaming
(por não existir jogo). Também falta containerizar backend+frontend no `docker-compose`
para cumprir o requisito mandatório de "deploy com um único comando".
