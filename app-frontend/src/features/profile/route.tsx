import {type LoaderFunctionArgs } from "react-router-dom"
import { bettor } from "../../api/bettor/bettor.api";
import ProfilePage from "./pages/Profile";
import { SettingsPage } from "./settings/page/settings";
import UserNotfound from "./components/UserNotFound";


export interface Bettor {
    nick: string;
    bio: string;
    avatar: string | null;
    isNickSet?: boolean;
}

async function privateProfileLoader (): Promise<Bettor> {
    const res = await bettor.getMe();
    return res.data;
}

async function publicProfileLoader ({params}: LoaderFunctionArgs ): Promise<Bettor> {
    try {
        const res = await bettor.getByNick(params.nick!);
        return res.data
    }catch (err: any)
    {
        if (err.response?.status === 404)
            throw new Response("Not Found ", {status: 404});
        throw err;
    }
}


export const profileRoute = [
    { path: '/profile/:nick',
        element: <ProfilePage />,
        loader: publicProfileLoader,
        errorElement: <UserNotfound />
    },
];

export const protectedProfileRoute = [
    { path: '/profile',
        element: <ProfilePage/>,
        loader: privateProfileLoader,
    },
    { path: 'profile/settings',
        element: <SettingsPage />,
        loader: privateProfileLoader
    }
];