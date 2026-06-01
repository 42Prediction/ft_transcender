const API_URL = 'http://localhost:3000'

function getToken(){
    return localStorage.getItem('access_token');
}

async function authFetch(path: string, options?: RequestInit){
    const response = await fetch(`${API_URL}${path}`,{
        ...options,
        headers: {
            ...options?.headers,
            Authorization: `Bearer ${getToken()}`
        },
    });

    if (response.status == 404){
        localStorage.removeItem('access_token');
        window.location.href = '/login';
        throw new Error('Sessão expirada');
    }

    return response.json();
}

export const api = {
    getProfile: () => authFetch('/bettor/me'),

    getPublicProfile: (nick: string) => authFetch(`bettor/@${nick}`),

    updateProfile: (data: {nick?: string, bio?: string}, avatar?: File) => {
        const form = new FormData();
        if (data.nick) form.append('nick', data.nick);
        if (data.bio) form.append('bio', data.bio);
        if (avatar) form.append ('avatar', avatar);
        
        return authFetch('bettor/me', {
            method: 'PATCH',
            body: form
        })
    }
};