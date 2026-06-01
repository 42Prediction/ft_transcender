import axios, { type AxiosInstance, type AxiosRequestConfig } from "axios";

const defaultBaseURL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export function createApi(options?: AxiosRequestConfig): AxiosInstance {
    return axios.create({
        baseURL: defaultBaseURL,
        withCredentials: true,
        ...options,
    });
}

export const api = createApi();

export default api;