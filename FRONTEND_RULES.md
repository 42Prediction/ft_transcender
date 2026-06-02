# Regras Front End

Este documento define a estrutura do frontend (React + Vite) e as regras de organizacao de arquivos e rotas.

O projeto e organizado por feature/dominio (assunto do negocio), nao por tipo de arquivo.
Dominio e um conjunto de funcionalidades do mesmo tema, com dados e regras de negocio em comum.

## Estrutura de pastas e arquivos

```
src/
  app/
    App.tsx
    router.tsx
    providers.tsx
  features/
    auth/
      pages/
      components/
      hooks/
      services/
      routes.tsx
    profile/
      pages/
      components/
      routes.tsx
  shared/
    components/
    hooks/
    utils/
    services/
  assets/
  styles/
  main.tsx
```

## Proposito de cada pasta/arquivo

- src/main.tsx
  - Ponto de entrada da aplicacao. Renderiza o React e injeta os providers globais (ex: router, context, query client).

- src/app/App.tsx
  - Componente raiz. Conecta o router e define o layout base da aplicacao.

- src/app/router.tsx
  - Declaracao central das rotas usando data routes (createBrowserRouter).
  - Agrega as rotas exportadas pelas features.

- src/app/providers.tsx
  - Encapsula providers globais (ex: AuthProvider, QueryClientProvider, ThemeProvider).

- src/features/
  - Cada subpasta representa um dominio (assunto do negocio).

- src/features/auth/
  - Funcionalidades relacionadas a autenticacao.
  - pages/: telas do dominio auth.
  - components/: componentes especificos do dominio auth.
  - hooks/: hooks especificos do dominio auth.
  - services/: chamadas e regras de acesso para auth.
  - routes.tsx: rotas do dominio auth.

- src/features/profile/
  - Funcionalidades relacionadas a perfil do usuario.
  - pages/: telas do dominio profile.
  - components/: componentes especificos do dominio profile.
  - routes.tsx: rotas do dominio profile.

- src/shared/
  - Codigo reutilizavel por varios dominios.
  - components/: UI generico (Button, Modal, Navbar, etc.).
  - hooks/: hooks genericos (useDebounce, useToggle, etc.).
  - utils/: helpers puros (formatDate, parseQuery, etc.).
  - services/: clientes e funcoes genericas de acesso a API (ex: Axios em src/shared/services/api.ts).

- src/assets/
  - Imagens, icons, fonts locais.

- src/styles/
  - Estilos globais e tokens (reset, variables, themes).

## Regras de organizacao

- O frontend e organizado por feature/dominio (assunto do negocio), nao por tipo de arquivo.
- Componentes que so fazem sentido dentro de um dominio ficam em features/<dominio>.
- Componentes usados em mais de um dominio ficam em shared.
- Nao criar pastas do tipo (pages/components) fora de features.

## Definicao de dominio

Dominio (assunto do negocio) e um conjunto de funcionalidades que tratam do mesmo tema,
compartilham dados e regras de negocio.

Exemplos de dominio: auth, profile, friends, chat, bettor.

## Fluxo do sistema de rotas

1) Cada dominio exposta suas rotas em features/<dominio>/routes.tsx.
2) app/router.tsx agrega todas as rotas e cria o router.
3) main.tsx injeta o RouterProvider e os providers globais.

## Forma de declaracao das rotas

- As rotas devem ser declaradas no formato data routes.
- Nao usar a forma declarativa com <Routes> e <Route> espalhados na UI.
- Exemplo de uso: createBrowserRouter + RouterProvider.

### Exemplo: forma declarativa (nao usar)

```tsx
import { Routes, Route } from "react-router-dom";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
    </Routes>
  );
}
```

### Exemplo: data routes (usar)

```tsx
import { createBrowserRouter, RouterProvider } from "react-router-dom";

const router = createBrowserRouter([
  { path: "/", element: <Home /> },
  { path: "/login", element: <Login /> }
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
```
