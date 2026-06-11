import { createBrowserRouter} from "react-router-dom";
import Notfound from "./components/NotFound";
import { publicRouter } from "./features/public/routes";
import App from "./App";
import { authRouter } from "./features/auth/routes";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: App,
    children: [
      ...publicRouter,
      ...authRouter,
    ]
  },
  {
    path: "*",
    Component: Notfound, 
  }
])

