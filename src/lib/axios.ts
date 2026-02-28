import axios from "axios";

export const axiosInstance = axios.create({
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

export const githubAxios = axios.create({
  baseURL: "https://api.github.com",
  timeout: 30000,
  headers: {
    Accept: "application/vnd.github.v3+json",
  },
  maxRedirects: 5,
  validateStatus: (status) => status >= 200 && status < 300,
});

githubAxios.interceptors.request.use((config) => {
  const token =
    import.meta.env.VITE_GITHUB_TOKEN || import.meta.env.GITHUB_TOKEN;
  if (token) {
    config.headers.Authorization = `token ${token}`;
  }
  return config;
});

githubAxios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error(
        "GitHub API error:",
        error.response.status,
        error.response.data,
      );
    }
    return Promise.reject(error);
  },
);

// for raw GitHub content (no CORS preflight)
export const githubRawAxios = axios.create({
  timeout: 30000,
  maxRedirects: 5,
  validateStatus: (status) => status >= 200 && status < 300,
});

export const gistDBAxios = axios.create({
  baseURL: "https://gist-db.mohammadsadiq4950.workers.dev/api",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
  maxRedirects: 5,
  validateStatus: (status) => status >= 200 && status < 300,
});

gistDBAxios.interceptors.request.use((config) => {
  const token =
    import.meta.env.GITHUB_TOKEN || import.meta.env.VITE_GITHUB_TOKEN;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

gistDBAxios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error(
        "GistDB error:",
        error.response.status,
        error.response.data,
      );
    }
    return Promise.reject(error);
  },
);

export const workerAxios = axios.create({
  baseURL: "https://pimg.mohammadsadiq4950.workers.dev",
  timeout: 60000,
  maxRedirects: 5,
  validateStatus: (status) => status >= 200 && status < 300,
});

workerAxios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error("Worker error:", error.response.status);
    }
    return Promise.reject(error);
  },
);
