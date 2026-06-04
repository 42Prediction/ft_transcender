import {type LoaderFunctionArgs } from "react-router-dom"
import { bettor } from "../../api/bettor/bettor.api";
import ProfilePage from "./pages/Profile";

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
    const res = await bettor.getByNick(params.nick!);
    return res.data
}


export const profileRoute = [
    { path: '/profile/:nick',
        element: <ProfilePage />,
        loader: publicProfileLoader
    },
];

export const protectedProfileRoute = [
    { path: '/profile',
        element: <ProfilePage/>,
        loader: privateProfileLoader,
    },
];