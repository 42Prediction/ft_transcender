import Signin from "./pages/Signin";
import Signup from "./pages/Signup";
import { signinAction } from "./actions/signin.action";
import PublicLayout from "@/pages/PublicLayout";
import { publicLoader } from "@/loader/guards";

export const authRouter = [
    {
        Component: PublicLayout,
        loader: publicLoader,
        id: "public",
        children: [
            {
                path: '/signin',
                Component: Signin,
                action: signinAction,
            },
            {
                path: '/signup',
                Component: Signup,
            },
        ],
    },
];