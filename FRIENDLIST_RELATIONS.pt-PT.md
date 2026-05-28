# Modelo de dados e fluxo da lista de amigos

Este documento explica o modelo de dados da Lista de Amigos (amizade + pedidos de amizade) e o fluxo de pedidos, com base em app-backend/src e app-frontend/src.

## Visao geral

Existem dois conceitos separados:

1. Pedidos de amizade (pendente/aceite/recusado)
2. Amizades confirmadas (a lista de amigos)

Os pedidos de amizade sao guardados na entidade FriendRequest. As amizades confirmadas sao guardadas numa tabela de associacao criada pela relacao ManyToMany da entidade User.

## Modelo de dados (tabelas e relacoes)

### users

- Nome da tabela: users
- Colunas (relevantes): id, username, email, avatar_url, is_online, created_at, update_at
- Relacoes:
  - friends: ManyToMany consigo propria atraves da tabela de associacao user_friends
  - sentRequests: OneToMany para FriendRequest (remetente)
  - receivedRequests: OneToMany para FriendRequest (destinatario)

Porque esta estruturado desta forma:

- Users e a entidade principal.
- A lista de amigos e uma relacao ManyToMany consigo propria porque um utilizador pode ter muitos amigos e cada amigo tambem e um utilizador.
- Os pedidos de amizade sao modelados como uma entidade separada para manter historico/estado do pedido e permitir estados pendente/recusado sem adicionar imediatamente a lista de amigos.

### friend_request (nome da entidade: FriendRequest)

- Nome da tabela: gerado pelo TypeORM a partir do nome da entidade (o nome por defeito depende da configuracao)
- Colunas:
  - id (PK)
  - sender (FK para users)
  - receiver (FK para users)
  - status (enum: PENDING, ACCEPTED, DECLINED)
  - created_at

Porque esta estruturado desta forma:

- Mantem um registo de quem enviou o pedido a quem e o respetivo estado.
- Impede adicionar utilizadores a lista de amigos antes da aceitacao.
- Suporta a pesquisa de pedidos pendentes para um determinado destinatario.

### user_friends (tabela de associacao)

- Nome da tabela: user_friends
- Colunas:
  - user_id (FK para users.id)
  - friend_id (FK para users.id)

Porque esta estruturado desta forma:

- Representa amizades confirmadas como um mapeamento ManyToMany.
- Separa a amizade do fluxo de pedidos, para que se possa ter amizades aceites sem guardar campos extra na tabela de associacao.

Nota importante de comportamento:

- A implementacao atual de addFriend apenas insere uma direcao (user_id -> friend_id). Se quiseres que as amizades sejam simetricas (ambos veem um ao outro), e necessario adicionar tambem a relacao inversa.

## Fluxo backend (pedido de amizade)

### Enviar pedido

Endpoint:

- POST /friend-requests

Logica do servico:

1. Encontrar remetente por senderId.
2. Encontrar destinatario por id ou username.
3. Bloquear pedidos a si proprio.
4. Verificar se ja existe um pedido em qualquer direcao.
5. Criar um novo FriendRequest com status PENDING.

### Listar pedidos pendentes

Endpoint:

- GET /friend-requests/pending/:userId

Logica do servico:

- Encontra entradas FriendRequest onde receiver.id = userId e status = PENDING.
- Carrega a relacao sender para que a UI mostre sender.username.

### Aceitar pedido

Endpoint:

- PATCH /friend-requests/:id/accept

Logica do servico:

- Carrega o pedido e define status = ACCEPTED.
- Nao cria nenhuma linha em user_friends.

### Rejeitar pedido

Endpoint:

- DELETE /friend-requests/:id/reject

Logica do servico:

- Apaga a linha de FriendRequest completamente.

## Fluxo frontend (FriendsList)

Componente:

- app-frontend/src/components/FriendsList.tsx

1. No carregamento, vai buscar os amigos atuais com GET /api/users/:userId/friends.
2. Vai buscar os pedidos pendentes com GET /api/friend-requests/pending/:userId.
3. Para enviar pedido, chama POST /api/friend-requests com senderId e receiverId (string ou number).
4. Para aceitar pedido, chama PATCH /api/friend-requests/:id/accept.
5. Para rejeitar pedido, chama DELETE /api/friend-requests/:id/reject.
6. Para remover um amigo, chama DELETE /api/users/:userId/friends/:friendUsername.

## Porque esta construido desta forma

- A tabela friend_request trata o fluxo pendente/aceite/recusado sem modificar a lista de amigos prematuramente.
- A tabela de associacao user_friends representa apenas amizades confirmadas.
- Esta separacao mantem a consulta da lista de amigos rapida e simples (apenas carrega amigos confirmados).

## Lacunas / inconsistencias atuais a ter em conta

- Aceitar um pedido apenas altera o status para ACCEPTED; nao adiciona uma amizade a user_friends. Se esperas que um pedido aceite apareca na lista de amigos, e necessario um passo adicional (na acceptRequest ou no frontend apos a aceitacao).
- O endpoint de remover amigo no backend espera um username no parametro de path do utilizador. O frontend atualmente envia userId nessa posicao, o que nao corresponde a pesquisa no backend.

## Resumo visual (estrutura de dados)

### Mapa de relacoes (tabela)

| Entidade / Tabela | Colunas chave                                                     | Relacao                                        | Notas                                  |
| ----------------- | ----------------------------------------------------------------- | ---------------------------------------------- | -------------------------------------- |
| users             | id, username, email, avatar_url, is_online, created_at, update_at | ManyToMany consigo propria via user_friends    | Apenas amigos confirmados              |
| friend_request    | id, sender_id, receiver_id, status, created_at                    | ManyToOne para users (remetente, destinatario) | Fluxo pendente/aceite/recusado         |
| user_friends      | user_id, friend_id                                                | Tabela de associacao para users.friends        | Implementacao atual insere uma direcao |

### Fluxo de dados (tree)

```
users
|-- id (PK)
|-- username
|-- email
|-- avatar_url
|-- is_online
|-- created_at
|-- update_at
|-- friends (ManyToMany)
|   `-- user_friends
|       |-- user_id (FK -> users.id)
|       `-- friend_id (FK -> users.id)
|-- sentRequests (OneToMany)
|   `-- friend_request
|       |-- id (PK)
|       |-- sender_id (FK -> users.id)
|       |-- receiver_id (FK -> users.id)
|       |-- status (PENDING | ACCEPTED | DECLINED)
|       `-- created_at
`-- receivedRequests (OneToMany)
  `-- friend_request (mesma tabela, receiver_id aponta para users.id)
```

## Resumo visual (resultado aceitar / rejeitar)

```
Pedido pendente (friend_request.status = PENDING)
        |
        |-- Aceitar (PATCH /friend-requests/:id/accept)
        |     |
        |     |-- Atualizar friend_request.status -> ACCEPTED
        |     `-- (Por defeito nao adiciona linha a user_friends)
        |
        `-- Rejeitar (DELETE /friend-requests/:id/reject)
              |
              `-- Apagar linha de friend_request
```
