import type { LoaderFunctionArgs } from "react-router-dom";
import ProfilePage from "./pages/Profile";
import { bettor } from "@/api/bettor/bettor.api";


export interface Bettor {
  nick: string;
  bio: string;
  avatar: string | null;
  isNickSet?: boolean;
  campus: string;
  createdAt: string;
}

export async function publicProfileLoader({
  params,
}: LoaderFunctionArgs): Promise<Bettor> {
  try {
    const res = await bettor.getByNick(params.nick!);

    return res.data;
  } catch (err: any) {
    if (err.response?.status === 404) {
      throw new Response("User not found", {
        status: 404,
      });
    }

    throw err;
  }
}

export const profileRoute = [
  {
    path: ':nick',
    Component: ProfilePage,
    loader: publicProfileLoader,
  }
];
