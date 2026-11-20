import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:5000/api' });
api.interceptors.request.use(config => {
  const token = localStorage.getItem('campus_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use(v => v, error => {
  if (error.response?.status === 401) {
    localStorage.removeItem('campus_token');
    localStorage.removeItem('campus_user');
  }
  return Promise.reject(error);
});
export default api;
