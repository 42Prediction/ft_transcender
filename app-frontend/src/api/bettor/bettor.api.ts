import api from "../api"
import { toFormData } from "./update-bettor.dto"
import type { UpdateBettorDto } from "./update-bettor.dto"

export const bettor = {
    getMe() {
        return api({
            method: 'GET',
            url: '/bettor/me',
        })
    },

    updateMe(dto: UpdateBettorDto) {
        return api({
            method: 'PATCH',
            url: '/bettor/me',
            data: toFormData(dto),
        })
    },

    getByNick(nick: string){
        const url = `/bettor/@${nick}`
        return api({
            method: 'GET',
            url,
        })
    }
}