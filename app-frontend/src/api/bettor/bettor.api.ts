import api from "../api"
import type { User } from "../auth/auth.api";
import { toFormData } from "./dto/update-bettor.dto"
import type { UpdateBettorDto } from "./dto/update-bettor.dto"

export const bettor = {
    getMe: async  (): Promise<User | null> => {
        try {
            const res = await api.get('/bettor/me',);
            return res.data;
        } catch (error) {
            return null;
        }
    },

    updateMe: async (dto: UpdateBettorDto) => {
        return await api.patch('/bettor/me', toFormData(dto))
    },

    getByNick: async (nick: string) => {
        const url = `/bettor/@${nick}`
        return api.get(url)
    },

    exportMyData: async (): Promise<any> => {
        const res = await api.get('/bettor/me/export');
        return res.data?.data;
    },
}
