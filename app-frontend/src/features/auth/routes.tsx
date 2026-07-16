import { signinAction } from "./actions/signin.action";
import { publicLoader } from "@/loader/guards";
import { Home } from "../public/pages/Home";
import { signupAction } from "./actions/signup.action ";
import { TwoFactorVerify } from "./pages/TwoFactorVerify";

export const authRouter = [
    {
        loader: publicLoader,
        id: "public",
        children: [
            {
                path: "signin",
                Component: Home,
                action: signinAction,
            },
            {
                path: "signup",
                Component: Home,
                action: signupAction,
            },
            {
                path: "verify-2fa",
                Component: TwoFactorVerify,
            },
        ],
    },
];
