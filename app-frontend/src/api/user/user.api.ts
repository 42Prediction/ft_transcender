import api from "../api";

export interface UserMe {
    id: string;
    email: string;
    role: string
}
export const user = {
    getMe: async () => {
        try {
            const res = await api.get<UserMe>("/users/me");
            return res.data;
        } catch (err: any) {
            if (err.response?.status === 404) {
                return null;
            }
            throw err;
        }
    },

    updateMe: async (dto: Partial<UserMe>) => {
        try {
            const res = await api.patch<UserMe>("/users/me", dto);
            return res.data;
        } catch (err: any) {
            throw err;
        }
    },

    deleteMe: async () => {
        try {
            const res = await api.delete("/users/me");
            return res.data;
        } catch (err: any) {
            throw err;
        }
    },

    getAll: async () => {
        try {
            const { data } = await api.get<any>("/users");
            return data;
        } catch (err: any) {
            if (err.response?.status === 404) {
                return [];
            }
            throw err;
        }
    },
    getById: async (id: string) => {
        try {
            const { data } = await api.get<UserMe>(`/users/${id}`);
            return data;
        } catch (err: any) {
            if (err.response?.status === 404) {
                return null;
            }
            throw err;
        }
    },
    updateById: async (id: string, dto: Partial<UserMe>) => {
        try {
            const { data } = await api.patch<UserMe>(`/users/${id}`, dto);
            return data;
        } catch (err: any) {
            throw err;
        }
    },
    deleteById: async (id: string) => {
        try {
            const { data } = await api.delete(`/users/${id}`);
            return data;
        } catch (err: any) {
            throw err;
        }
    },
}