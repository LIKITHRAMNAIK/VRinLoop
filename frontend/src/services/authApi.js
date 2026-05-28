import axios from 'axios';

const authAPI = axios.create({

  baseURL:
    'http://localhost:5000/api/auth'

});

authAPI.interceptors.request.use(

  (req) => {

    const token =
      localStorage.getItem(
        'token'
      );

    if (token) {

      req.headers.Authorization =
        `Bearer ${token}`;

    }

    return req;

  }

);

export default authAPI;