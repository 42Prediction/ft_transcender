import { dataContext } from "@/routes";
import type { LoaderFunctionArgs } from "react-router-dom";

export async function rootLoader({ context }: LoaderFunctionArgs): Promise<Response | null> {
    const data = context.get(dataContext);
    if (data === undefined){
        return null;
    }
    return data;
}
