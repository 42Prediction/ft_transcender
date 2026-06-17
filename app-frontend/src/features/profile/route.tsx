import { protectedLoader } from "@/loader/guards";
import ProfilePage from "./pages/Profile";
import { SettingsPage } from "./settings/page/settings";


export interface Bettor {
    nick: string;
    bio: string;
    avatar: string | null;
    isNickSet?: boolean;
}

export const profileRoute = [
    {
        id: "profile",
        path: '/profile',
        loader: protectedLoader,
        children:[
            {
                index: true,
                Component: ProfilePage,
            },
             {
                path: 'settings',
                Component: SettingsPage,
            },
        ]
    },
    {
        path: '/profile/@:nick ',
        Component: ProfilePage,
    },
];
