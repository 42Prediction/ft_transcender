# Market Feature — ft_transcender

Branch: `feat/marteket`

---

## Visão Geral

O módulo de Markets transforma o ft_transcender numa plataforma real de prediction markets focada no ecossistema 42. Os utilizadores apostam ₳ (a moeda interna da plataforma) em eventos reais de estudantes da 42 — defesas de projetos, exames, piscines, internships — e o mercado reflete a probabilidade coletiva em tempo real.

---

## Estrutura de Ficheiros

```
ft_transcender/
├── app-backend/
│   └── src/
│       ├── modules/
│       │   ├── auth/                    (existente)
│       │   ├── user/                    (existente)
│       │   ├── bettor/                  (existente)
│       │   ├── wallet/                  (existente)
│       │   └── market/                  ★ NOVO
│       │       ├── entities/
│       │       │   ├── market.entity.ts            — tabela markets
│       │       │   └── market-position.entity.ts   — tabela market_positions
│       │       ├── dto/
│       │       │   ├── create-market.dto.ts        — validação de criação
│       │       │   └── place-bet.dto.ts            — validação de aposta
│       │       ├── market.service.ts               — lógica de negócio
│       │       ├── market.controller.ts            — endpoints REST
│       │       └── market.module.ts                — registo do módulo
│       ├── migrations/
│       │   ├── 1780661972367-migration1.ts         (users, bettors)
│       │   ├── 1781027240999-migration2.ts
│       │   ├── 1782225117523-migration3.ts         (campus column)
│       │   ├── 1782835630775-migration4.ts         (wallet, transactions)
│       │   └── 1783000000000-migration5.ts         ★ NOVO (markets, positions)
│       └── app.module.ts                           ★ ATUALIZADO
│
└── app-frontend/
    └── src/
        ├── api/
        │   ├── api.ts                              (axios base)
        │   ├── auth/auth.api.ts
        │   ├── bettor/
        │   └── market/
        │       └── market.api.ts                   ★ NOVO — cliente + tipos TS
        ├── features/
        │   ├── auth/                               (existente)
        │   ├── admin/                              (existente)
        │   ├── public/
        │   │   ├── components/
        │   │   │   ├── Hero.tsx                    ★ ATUALIZADO — stats reais
        │   │   │   ├── Trending.tsx                ★ ATUALIZADO — dados reais
        │   │   │   ├── MarketCard.tsx              ★ ATUALIZADO — tipos reais
        │   │   │   ├── Navbar.tsx                  ★ ATUALIZADO — links + portfolio
        │   │   │   ├── Footer.tsx
        │   │   │   └── mock/data.ts                (obsoleto — pode ser removido)
        │   │   ├── pages/
        │   │   │   ├── Home.tsx
        │   │   │   ├── Markets.tsx                 ★ NOVO — listagem + filtros
        │   │   │   ├── Leaderboard.tsx             ★ NOVO — ranking + activity
        │   │   │   ├── AuthCallback.tsx
        │   │   │   ├── Privacy.tsx
        │   │   │   └── Terms.tsx
        │   │   └── routes.tsx                      ★ ATUALIZADO — loaders + novas rotas
        │   └── user/
        │       ├── portfolio/
        │       │   └── pages/
        │       │       └── Portfolio.tsx           ★ NOVO — posições abertas
        │       ├── profile/                        (existente)
        │       ├── settings/                       (existente)
        │       └── routes.tsx                      ★ ATUALIZADO — rota /user/portfolio
        └── routes.tsx                              (sem alterações)
```

---

## Base de Dados

### Tabela `markets`

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | uuid PK | Identificador único |
| `subject_login` | varchar | Handle do estudante 42 (ex: `lmoreau`) |
| `subject_name` | varchar | Nome completo (ex: `Léa Moreau`) |
| `subject_avatar` | text nullable | URL do avatar |
| `project` | varchar | Evento previsto (ex: `ft_transcendence — final defense`) |
| `category` | enum | `Common Core`, `Exams`, `Rushes`, `Piscine`, `Projects`, `Internships`, `Peer Evals` |
| `status` | enum | `new`, `live`, `closing`, `resolved` |
| `yes_pool` | decimal | ₳ apostados em YES (inicia em 100) |
| `no_pool` | decimal | ₳ apostados em NO (inicia em 100) |
| `closes_at` | timestamp | Data de fecho do mercado |
| `resolved_at` | timestamp nullable | Quando foi resolvido |
| `resolution` | enum nullable | `YES` ou `NO` |
| `creator_id` | uuid FK → bettors | Quem criou o market |

### Tabela `market_positions`

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | uuid PK | Identificador único |
| `market_id` | uuid FK → markets | Market a que pertence |
| `bettor_id` | uuid FK → bettors | Quem apostou |
| `side` | enum | `YES` ou `NO` |
| `amount` | decimal | ₳ apostados |
| `shares` | decimal | Número de shares recebidos |
| `entry_price` | decimal | Preço no momento da aposta (0.0–1.0) |
| `payout` | decimal nullable | Ganho após resolução (null = posição aberta) |

---

## Modelo de Pricing

Cada market usa um modelo de proporção simples:

```
YES price = yesPool / (yesPool + noPool)
NO  price = noPool  / (yesPool + noPool)
```

- Pools iniciam com **100₳ cada side** (virtual liquidity — não saem de nenhuma wallet).
- Quando alguém aposta X₳ em YES, o `yesPool` cresce X₳ e o preço YES sobe.
- O `shares` recebidos = `amount / entryPrice`.
- Em resolução, os vencedores partilham o `totalPool` proporcional aos seus shares.

**Exemplo:**
```
Estado inicial:  yesPool=100, noPool=100 → YES price = 50%
Aposta 200₳ YES: yesPool=300, noPool=100 → YES price = 75%
Shares recebidos: 200 / 0.50 = 400 shares
```

---

## Endpoints REST

### Públicos (sem autenticação)

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/market` | Listagem com filtros `?category=&status=&search=` |
| `GET` | `/market/trending` | Top N markets por volume `?limit=4` |
| `GET` | `/market/stats` | Stats da plataforma (markets ativos, bettors, volume) |
| `GET` | `/market/leaderboard` | Ranking de bettors por P&L real `?limit=6` |
| `GET` | `/market/activity` | Feed de atividade recente `?limit=10` |
| `GET` | `/market/categories` | Contagem de markets por categoria |
| `GET` | `/market/:id` | Detalhe de um market |

### Autenticados (JWT cookie)

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/market/portfolio` | Posições abertas + P&L do utilizador atual |
| `POST` | `/market` | Criar um novo market |
| `POST` | `/market/:id/bet` | Apostar `{ side: "YES"|"NO", amount: number }` |

### Admin only

| Método | Rota | Descrição |
|---|---|---|
| `PATCH` | `/market/:id/resolve` | Resolver market `{ resolution: "YES"|"NO" }` — paga winners |

---

## Páginas Frontend

### `/` — Home
- **Hero**: mostra stats reais (traders online, volume 30d, markets ativos) + market featured em destaque.
- **Trending**: 3 markets com maior volume. Se não há markets, mostra estado vazio.
- Os dados chegam via **React Router loader** (`homeLoader`) executado antes do render — sem loading states na UI.

### `/markets` — Listagem Completa
- Grid de todos os markets com filtros por **categoria** (tabs dinâmicas com contagens reais) e **search** (filtra por login, nome ou projeto).
- Filtros fazem fetch ao backend em tempo real sem reload de página.

### `/leaderboard` — Ranking
- Tabela dos top bettors ordenados por P&L real (soma dos payouts menos apostas).
- Feed de atividade ao vivo à direita: últimas apostas/resoluções de toda a plataforma.
- Estado vazio quando não há atividade.

### `/user/portfolio` — Portfólio (autenticado)
- 4 stats cards: Balance, Total P&L, Win Rate, Posições Abertas.
- Tabela de posições abertas com Entry price, Current price e P&L individual calculado em tempo real com base nos pools atuais.

### `MarketCard` (componente partilhado)
- Mostra probabilidade atual como barra de progresso.
- Botões YES/NO com preço atual em ¢ (cents).
- Tempo restante calculado dinamicamente (ex: `2d 14h`).
- Avatar fallback para DiceBear se não existir imagem.

---

## Status do Ciclo de Vida de um Market

```
          criação
             │
             ▼
           [new]  ← recém criado (< 48h)
             │
        passam 48h
             │
             ▼
           [live]  ← market normal
             │
        closes_at - 24h
             │
             ▼
         [closing]  ← urgência, fecha em breve
             │
        admin resolve
             │
             ▼
        [resolved]  ← payout feito aos vencedores
```

---

## O que falta / próximos passos

- [ ] Ligar os botões YES/NO no `MarketCard` a um modal de aposta (BetModal)
- [ ] Página de detalhe de market individual (`/market/:id`)
- [ ] Integração com a API da 42 para auto-completar o campo de estudante ao criar um market (busca por login)
- [ ] Sistema de notificações quando um market onde o utilizador tem posição é resolvido
- [ ] Admin dashboard com listagem de markets pendentes de resolução
- [ ] Paginação na listagem de markets
