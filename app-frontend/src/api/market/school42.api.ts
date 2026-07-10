import api from '../api';

export interface Student42 {
  login: string;
  name: string;
  avatar: string | null;
  campus: string | null;
  level: number;
}

function unwrap<T>(res: any): T {
  return res.data?.data as T;
}

export const school42Api = {
  searchStudents: async (q: string, limit = 10): Promise<Student42[]> => {
    if (q.trim().length < 2) return [];
    const res = await api.get('/market/students/search', { params: { q, limit } });
    return unwrap<Student42[]>(res) ?? [];
  },

  getTopStudents: async (limit = 20): Promise<Student42[]> => {
    const res = await api.get('/market/students/top', { params: { limit } });
    return unwrap<Student42[]>(res) ?? [];
  },
};
