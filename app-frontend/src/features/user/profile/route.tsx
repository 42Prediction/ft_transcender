import ProfilePage from "./pages/Profile";


export interface Bettor {
    nick: string;
    bio: string;
    avatar: string | null;
    isNickSet?: boolean;
}

export const profileRoute = [
    {
        path: ':nick',
        Component: ProfilePage,
    }
];
