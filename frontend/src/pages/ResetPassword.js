import {
  useState
} from 'react';

import authAPI
from '../services/authApi';

import {
  useNavigate,
  useLocation
} from 'react-router-dom';

export default function ResetPassword() {

  const navigate =
    useNavigate();

  const location =
    useLocation();

  const email =
    location.state?.email;

  const [password, setPassword] =
    useState('');

  const handleSubmit =
    async e => {

      e.preventDefault();

      try {

        await authAPI.post(

          '/reset-password',

          {
            email,
            password
          }

        );

        alert(
          'Password updated'
        );

        navigate('/login');

      } catch (error) {

        alert(

          error.response?.data?.message ||

          'Reset failed'

        );

      }

    };

  return (

    <div style={containerStyle}>

      <form
        onSubmit={handleSubmit}
        style={formStyle}
      >

        <h1>
          Reset Password
        </h1>

        <input

          type="password"

          placeholder="New Password"

          value={password}

          onChange={e =>
            setPassword(
              e.target.value
            )
          }

          required

          style={inputStyle}

        />

        <button
          type="submit"
          style={buttonStyle}
        >
          Update Password
        </button>

      </form>

    </div>

  );

}

const containerStyle = {

  minHeight: '100vh',

  display: 'flex',

  justifyContent: 'center',

  alignItems: 'center',

  background: '#f1f5f9'

};

const formStyle = {

  background: 'white',

  padding: 40,

  borderRadius: 20,

  width: 400,

  boxShadow:
    '0 10px 30px rgba(0,0,0,0.1)'

};

const inputStyle = {

  width: '100%',

  padding: 14,

  marginTop: 20,

  borderRadius: 10,

  border: '1px solid #cbd5e1'

};

const buttonStyle = {

  width: '100%',

  padding: 14,

  marginTop: 20,

  border: 'none',

  borderRadius: 12,

  background: '#dc2626',

  color: 'white',

  fontWeight: 'bold',

  cursor: 'pointer'

};