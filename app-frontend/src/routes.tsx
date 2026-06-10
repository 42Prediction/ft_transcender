import { createBrowserRouter} from "react-router-dom";
import App from "./App";
import Notfound from "./components/NotFound";
import { publicRouter } from "./features/public/routes";
import { Root } from "./pages/root";
import { LoginPage } from "./features/auth/pages/LoginPage";
import { publicLoader } from "./loader/guards";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    errorElement: < Notfound/>,
    children: [
      ...publicRouter,
    ]
  },
  {
    path: '/login',
    element: <LoginPage/>,
    loader: publicLoader,
  }
])

