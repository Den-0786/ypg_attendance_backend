const BASE_URL =
  process.env.NODE_ENV === 'production'
    ? 'https://ypg-attendance-backend-1.onrender.com'
    : 'http://127.0.0.1:8000';

console.log('Config loaded - NODE_ENV:', process.env.NODE_ENV);
console.log('Config loaded - BASE_URL:', BASE_URL);

export { BASE_URL }; 