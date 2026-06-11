import { signinAction } from "./actions/signin.action";
import PublicLayout from "@/pages/PublicLayout";
import { publicLoader } from "@/loader/guards";
import { Home } from "../public/pages/Home";

export const authRouter = [
    {
        Component: PublicLayout,
        loader: publicLoader,
        id: "public",
        children: [
            {
                path: '/signin',
                Component: Home,
                action: signinAction,
            },
            {
                path: '/signup',
                Component: Home,
            },
        ],
    },
];
