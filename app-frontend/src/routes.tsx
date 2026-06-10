import { createBrowserRouter} from "react-router-dom";
import App from "./App";
import Notfound from "./components/NotFound";
import { publicRouter } from "./features/public/routes";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: < Notfound/>,
    children: [
      ...publicRouter,
    ]
  },
])

