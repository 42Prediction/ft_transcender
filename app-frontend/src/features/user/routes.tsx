import { protectedLoader } from "@/loader/guards";
import { profileRoute } from "./profile/route";
import { settingsRoute } from "./settings/routes";
import { PortfolioPage, portfolioLoader } from "./portfolio/pages/Portfolio";

export const protectedRoute = [
    {
        id: "protected",
        loader: protectedLoader,
        children: [
            ...settingsRoute,
            {
                path: 'portfolio',
                Component: PortfolioPage,
                loader: portfolioLoader,
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
