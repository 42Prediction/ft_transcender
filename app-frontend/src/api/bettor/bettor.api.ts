import api from "../api"
import { toFormData } from "./update-bettor.dto"
import type { UpdateBettorDto } from "./update-bettor.dto"

export const bettor = {
    getMe() {
        return api.get('/bettor/me',)
    },

    updateMe(dto: UpdateBettorDto) {
        return api.patch('/bettor/me', toFormData(dto))
    },

    getByNick(nick: string){
        const url = `/bettor/@${nick}`
        return api.get(url)
    }
}