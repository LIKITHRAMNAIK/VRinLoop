import {

  useState

} from 'react';

import authAPI
from '../services/authApi';

import {

  useNavigate,
  Link

} from 'react-router-dom';

export default function Signup() {

  const navigate =
    useNavigate();

  const [form, setForm] =
    useState({

      name: '',
      email: '',
      phone: '',
      password: ''

    });

  const [image, setImage] =
    useState(null);

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

        const formData =
          new FormData();

        Object.keys(form)
          .forEach(key => {

            formData.append(
              key,
              form[key]
            );

          });

        if (image) {

          formData.append(
            'profile_image',
            image
          );

        }

        await authAPI.post(

  '/signup',

  formData,
  {
    headers: {
      'Content-Type':
        'multipart/form-data'
    }
  }

);

        alert(
          'Signup successful'
        );

        navigate('/login');

      } catch (error) {

        alert(

          error.response?.data?.message ||

          'Signup failed'

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

          width: 420,

          boxShadow:
            '0 10px 30px rgba(0,0,0,0.1)'

        }}
      >

        <h1>Signup</h1>

        <input
          type="text"
          name="name"
          placeholder="Name"
          onChange={handleChange}
          required
          style={inputStyle}
        />

        <input
          type="email"
          name="email"
          placeholder="Email"
          onChange={handleChange}
          required
          style={inputStyle}
        />

        <input
          type="text"
          name="phone"
          placeholder="Phone"
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

        <input
          type="file"
          onChange={e =>
            setImage(
              e.target.files[0]
            )
          }
          style={inputStyle}
        />

        <button
          type="submit"
          style={buttonStyle}
        >
          Signup
        </button>

        <p>

          Already have account?

          <Link to="/login">
            Login
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

  background: '#16a34a',

  color: 'white',

  fontWeight: 'bold',

  cursor: 'pointer'

};