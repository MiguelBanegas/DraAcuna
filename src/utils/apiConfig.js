const getApiUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) return envUrl;

  if (import.meta.env.PROD) {
    return "/api";
  }
  return "http://localhost:3001/api";
};

const API_URL = getApiUrl();

export default API_URL;
