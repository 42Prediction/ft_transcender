import { redirect, type LoaderFunctionArgs } from "react-router-dom";
import { protectedLoader } from "@/loader/guards";
import { profileRoute } from "./profile/route";
import { settingsRoute } from "./settings/routes";
import { dataContext } from "@/routes";

export const protectedRoute = [
    {
        id: "protected",
        loader: protectedLoader,
        children: [
            ...settingsRoute,
            {
                path: 'portfolio',
                loader: ({ context }: LoaderFunctionArgs) => {
                    const me = context.get(dataContext);
                    const nick = me?.data?.nick;
                    return redirect(nick ? `/user/${nick}` : '/');
                },
            },
        ]
    }
]


export const userRoute = [
    {
        id: 'user',
        path: '/user',
        children:[
            ...profileRoute,
            ...protectedRoute,
        ]
    }
];
