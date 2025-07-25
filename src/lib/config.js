const BASE_URL =
  process.env.NODE_ENV === 'production'
    ? 'https://ypg-attendance-backend-1.onrender.com'
    : 'http://127.0.0.1:8000';

export { BASE_URL }; 