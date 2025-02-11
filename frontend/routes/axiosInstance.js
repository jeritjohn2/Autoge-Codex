import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:8888', // Your backend base URL
});

export default axiosInstance;
