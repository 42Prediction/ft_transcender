import { createBrowserRouter, createContext} from "react-router-dom";
import Notfound from "./components/NotFound";
import { publicRouter } from "./features/public/routes";
import App from "./App";
import { authRouter } from "./features/auth/routes";
import { authMiddleware } from "./middleware/auth";
import {rootLoader } from "./loader/root";
import { userRoute } from "./features/user/routes";
import { adminDashboardRoute } from "./features/admin/routes";

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
      ...adminDashboardRoute,
    ]
  },

  {
    path: '*',
    Component: Notfound,
  }
  ]
)

