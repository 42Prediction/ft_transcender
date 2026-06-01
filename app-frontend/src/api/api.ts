import axios, { type AxiosInstance, type AxiosRequestConfig } from "axios";

const defaultBaseURL = import.meta.env.VITE_API_URL ?? import.meta.env.FRONTEND_URL ?? "/";

export function createApi(options?: AxiosRequestConfig): AxiosInstance {
    return axios.create({
        baseURL: defaultBaseURL,
        withCredentials: true,
        ...options,
    });
}

export const api = createApi();

export default api;