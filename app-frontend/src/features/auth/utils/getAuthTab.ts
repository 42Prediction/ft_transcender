export function getAuthTab(pathname: string) {
  switch (pathname) {
    case "/signin":
      return "signin";

    case "/signup":
      return "signup";

    default:
      return null;
  }
}
