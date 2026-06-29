import { createBrowserRouter, createContext } from "react-router-dom";
import Notfound from "./components/NotFound";
import { publicRouter } from "./features/public/routes";
import App from "./App";
import { authRouter } from "./features/auth/routes";
import { adminAuthMiddleware, authMiddleware } from "./middleware/auth";
import { rootLoader } from "./loader/root";
import { userRoute } from "./features/user/routes";
import { adminDashboardRoute } from "./features/admin/routes";
import AdminLayout from "./features/admin/pages/AdminLayout";

export const dataContext = createContext<any | null>(null)

export const router = createBrowserRouter([
  {
    path: '/',
    id: 'root',
    Component: App,
    middleware: [authMiddleware],
    loader: rootLoader,
    HydrateFallback: () => <div>...</div>,
    children: [
      ...publicRouter,
      ...authRouter,
      ...userRoute,
    ]
  },
  {
    path: '/admin',
    id: 'admin-root',
    Component: AdminLayout,
    middleware: [adminAuthMiddleware],
    loader: rootLoader,
    HydrateFallback: () => <div>...</div>,
    children: [
      ...adminDashboardRoute,
    ]
  },
  {
    path: '*',
    Component: Notfound,
  }
]
)

