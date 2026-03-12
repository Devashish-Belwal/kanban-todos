import axios from 'axios';
import { toast } from 'sonner';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = '/';
      return Promise.reject(error);
    }

    // Show error toast for all other failures
    const message = error.response?.data?.error || 'Something went wrong';
    toast.error(message);

    return Promise.reject(error);
  }
);

export default api;