import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// If an access token exists on load, set it as default so requests include it immediately
const existingToken = localStorage.getItem('access_token');
if (existingToken) {
  api.defaults.headers.common['Authorization'] = `Bearer ${existingToken}`;
}

// Helper: decode JWT payload safely  
function decodeJWT(token) {
  try {
    const payload = token.split('.')[1];
    const base = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(atob(base).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
    return JSON.parse(json);
  } catch (err) {
    return null;
  }
}

const REFRESH_THRESHOLD = 60 * 1000; // refresh if token will expire within 60s

// Refresh coordination primitives
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

async function refreshToken() {
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) throw new Error('No refresh token');

  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      failedQueue.push({ resolve, reject });
    });
  }

  isRefreshing = true;
  try {
    const res = await api.post('/token/refresh/', { refresh: refreshToken });
    const newAccess = res.data.access;
    localStorage.setItem('access_token', newAccess);
    api.defaults.headers.common['Authorization'] = 'Bearer ' + newAccess;
    processQueue(null, newAccess);
    return newAccess;
  } catch (err) {
    processQueue(err, null);
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('username');
    window.location.reload();
    throw err;
  } finally {
    isRefreshing = false;
  }
}

async function ensureValidAccessToken() {
  const token = localStorage.getItem('access_token');
  if (!token) return;
  const payload = decodeJWT(token);
  if (!payload || !payload.exp) return;
  const expMs = payload.exp * 1000;
  const now = Date.now();
  if (expMs - now < REFRESH_THRESHOLD) {
    try {
      await refreshToken();
    } catch (err) {
      // refreshToken handles logout/reload
    }
  }
}

// Add JWT token to all requests (async to allow proactive refresh)
api.interceptors.request.use(async (config) => {
  await ensureValidAccessToken();
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Diagnostic logging for requests
  try {
    // eslint-disable-next-line no-console
    console.debug('[API] Request', config.method?.toUpperCase(), config.url, 'Auth:', !!config.headers?.Authorization);
  } catch (err) {}
  return config;
}, (error) => Promise.reject(error));

// Response interceptor to handle 401s by attempting token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const newToken = await refreshToken();
        originalRequest.headers.Authorization = 'Bearer ' + newToken;
        return api(originalRequest);
      } catch (err) {
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

// Posts API
export const getPosts = () => api.get('/posts/');
export const getPost = (id) => api.get(`/posts/${id}/`);
export const createPost = (content) => api.post('/posts/', { content });
export const likePost = (id) => api.post(`/posts/${id}/like/`);
export const unlikePost = (id) => api.post(`/posts/${id}/unlike/`);

// User registration (supports either object or (username, password) signature)
export const register = async (usernameOrObj, password) => {
  const payload = typeof usernameOrObj === 'object'
    ? usernameOrObj
    : { username: usernameOrObj, password };

  // Try common registration endpoints and provide helpful error when unavailable
  try {
    return await api.post('/users/', payload);
  } catch (err) {
    // If 404, try a common alternative path before giving up
    if (err.response && err.response.status === 404) {
      try {
        return await api.post('/register/', payload);
      } catch (err2) {
        // rethrow original error for more context
        throw err;
      }
    }
    throw err;
  }
};

// Comments API
export const getComments = () => api.get('/comments/');
export const createComment = (postId, content, parentId = null) => 
  api.post('/comments/', { post: postId, content, parent: parentId });
export const likeComment = (id) => api.post(`/comments/${id}/like/`);
export const unlikeComment = (id) => api.post(`/comments/${id}/unlike/`);

// Leaderboard API
export const getLeaderboard = () => api.get('/leaderboard/top_users/');

// Auth API
export const login = (username, password) => 
  api.post('/token/', { username, password });

export default api;
