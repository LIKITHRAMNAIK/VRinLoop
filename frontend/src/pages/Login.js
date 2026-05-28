import {

  useState

} from 'react';

import authAPI
from '../services/authApi';

import {

  useNavigate,
  Link

} from 'react-router-dom';

export default function Login() {

  const navigate =
    useNavigate();

  const [form, setForm] =
    useState({

      email: '',
      password: ''

    });

  const handleChange = e => {

    setForm({

      ...form,

      [e.target.name]:
        e.target.value

    });

  };

  const handleSubmit =
    async e => {

      e.preventDefault();

      try {

        const res =
  await authAPI.post(

    '/login',

    form

  );

        localStorage.setItem(

          'token',

          res.data.token

        );

        localStorage.setItem(

          'user',

          JSON.stringify(
            res.data.user
          )

        );

        navigate('/');

      } catch (error) {

        alert(

          error.response?.data?.message ||

          'Login failed'

        );

      }

  };

  return (

    <div style={{

      minHeight: '100vh',

      display: 'flex',

      justifyContent: 'center',

      alignItems: 'center',

      background:
        '#f1f5f9'

    }}>

      <form
        onSubmit={handleSubmit}
        style={{

          background: 'white',

          padding: 40,

          borderRadius: 20,

          width: 400,

          boxShadow:
            '0 10px 30px rgba(0,0,0,0.1)'

        }}
      >

        <h1>Login</h1>

        <input
          type="email"
          name="email"
          placeholder="Email"
          onChange={handleChange}
          required
          style={inputStyle}
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          onChange={handleChange}
          required
          style={inputStyle}
        />

        <button
          type="submit"
          style={buttonStyle}
        >
          Login
        </button>

        <p>

          Don't have account?

          <Link to="/signup">
            Signup
          </Link>

        </p>

        <p>

          <Link to="/forgot-password">

            Forgot Password?

          </Link>

        </p>

      </form>

    </div>

  );

}

const inputStyle = {

  width: '100%',

  padding: 14,

  marginTop: 15,

  borderRadius: 10,

  border: '1px solid #cbd5e1'

};

const buttonStyle = {

  width: '100%',

  padding: 14,

  marginTop: 20,

  border: 'none',

  borderRadius: 12,

  background: '#2563eb',

  color: 'white',

  fontWeight: 'bold',

  cursor: 'pointer'

};