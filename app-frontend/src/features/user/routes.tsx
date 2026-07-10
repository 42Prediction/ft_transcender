import { protectedLoader } from "@/loader/guards";
import { profileRoute } from "./profile/route";
import { settingsRoute } from "./settings/routes";

export const protectedRoute = [
    {
        id: "protected",
        loader: protectedLoader,
        children: [
            ...settingsRoute,
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
