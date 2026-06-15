import { createBrowserRouter, createContext} from "react-router-dom";
import Notfound from "./components/NotFound";
import { publicRouter } from "./features/public/routes";
import App from "./App";
import { authRouter } from "./features/auth/routes";
import { authMiddleware } from "./middleware/auth";

export const dataContext = createContext<any | null>(null)

export const router = createBrowserRouter([
  {
    path: '/',
    id: 'root',
    Component: App,
    middleware: [authMiddleware],
    children: [
      ...publicRouter,
      ...authRouter,
    ]
  },
  {
    path: '*',
    Component: Notfound,
  }
  ]
)

