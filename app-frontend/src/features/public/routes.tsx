import { Home } from "./pages/Home";
import { PrivacyPage } from "./pages/Privacy";
import { TermsPage } from "./pages/Terms";

export const publicRouter = ([
  {
    index: true,
    Component: Home,
  },
  {
    path: '/privacy',
    Component: PrivacyPage
  },
  {
    path: '/terms',
    Component: TermsPage
  }
])
