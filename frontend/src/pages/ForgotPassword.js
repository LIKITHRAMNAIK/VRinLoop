import {
  useState
} from 'react';

import authAPI
from '../services/authApi';

import {
  useNavigate
} from 'react-router-dom';

export default function ForgotPassword() {

  const navigate =
    useNavigate();

  const [email, setEmail] =
    useState('');

  const handleSubmit =
    async e => {

      e.preventDefault();

      try {

        await authAPI.post(

          '/forgot-password',

          { email }

        );

        alert(
          'OTP sent to email'
        );

        navigate(
          '/verify-otp',
          {
            state: { email }
          }
        );

      } catch (error) {

        alert(

          error.response?.data?.message ||

          'Something went wrong'

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
          Forgot Password
        </h1>

        <input

          type="email"

          placeholder="Enter Email"

          value={email}

          onChange={e =>
            setEmail(
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
          Send OTP
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

  background: '#2563eb',

  color: 'white',

  fontWeight: 'bold',

  cursor: 'pointer'

};