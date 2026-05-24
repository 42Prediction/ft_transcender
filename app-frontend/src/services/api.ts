const API_URL = 'http://localhost:3000'

function getToken(){
    return localStorage.getItem('access_token');
}

async function authFetch(path: string){
    const response = await fetch(`${API_URL}${path}`,{
        headers: {
            Authorization: `Bearer ${getToken()}`
        },
    });

    if (response.status == 401){
        localStorage.removeItem('access_token');
        window.location.href = '/login';
        throw new Error('Sessão expirada');
    }

    return response.json();
}

export const api = {
    getProfile: () => authFetch('/auth/profile'),
};