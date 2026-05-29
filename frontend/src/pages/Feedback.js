import React, {
  useState
} from 'react';
import feedbackAPI from
  '../services/feedbackApi';

import Sidebar from
  '../components/Sidebar';


export default function Feedback() {
const user =
  JSON.parse(
    localStorage.getItem(
      'user'
    )
  );

    const [rating, setRating] =
  useState(0);

  const [open, setOpen] =
    useState(false);

  const [subject,
    setSubject] =
    useState('');

  const [type,
    setType] =
    useState(
      'Bug Report'
    );

  const [message,
    setMessage] =
    useState('');

  const [image,
    setImage] =
    useState(null);

  const submitFeedback =
    async () => {

      try {

        const formData =
          new FormData();

        formData.append(
          'subject',
          subject
        );

        formData.append(
          'type',
          type
        );

        formData.append(
          'message',
          message
        );

        formData.append(
          'rating',
          rating
        );

        if (image) {

          formData.append(
            'image',
            image
          );

        }


        await feedbackAPI.post(

  '/submit',

  formData

);

        alert(
          'Feedback submitted successfully'
        );

        setSubject('');
        setMessage('');
        setImage(null);

      } catch (error) {

        alert(

  error.response?.data?.message ||

  error.message ||

  'Failed to submit feedback'

);

      }

    };

  return (

    <>

      <Sidebar
        open={open}
        setOpen={setOpen}
      />

      <div
        style={{

          minHeight:
            '100vh',

          padding:
            '40px',

          background:
            'linear-gradient(135deg,#0f172a,#1e293b)',

          color:
            'white'

        }}
      >

        <div
          style={{

            maxWidth:
              1000,

              boxShadow:
'0 20px 50px rgba(0,0,0,0.25)',
border:
'1px solid rgba(255,255,255,0.08)',

            margin:
              '0 auto',

            background:
              'rgba(255,255,255,0.08)',

            borderRadius:
              28,

            padding:
              35,

            backdropFilter:
              'blur(12px)'

          }}
        >

          <div
  style={{
    textAlign: 'center',
    marginBottom: 35
  }}
>

  <div
    style={{
      fontSize: 55,
      marginBottom: 10
    }}
  >
    💡
  </div>

  <h1
    style={{
      margin: 0,
      fontSize: 38,
      fontWeight: '900'
    }}
  >
    Feedback Center
  </h1>

  <p
    style={{
      color: '#cbd5e1',
      marginTop: 12,
      fontSize: 16
    }}
  >
    Help improve VRinLoop
  </p>

  <h3
    style={{
      marginTop: 15,
      color: '#f472b6'
    }}
  >
    Your Money. Your Loop. Your Control.
  </h3>

</div>

          <hr />

          <div
  style={{
    display: 'flex',
    gap: 20,
    marginBottom: 25
  }}
>

  <div
    style={{
      flex: 1,
      background: 'rgba(255,255,255,0.08)',
      padding: 18,
      borderRadius: 16,
      border: '1px solid rgba(255,255,255,0.08)'
    }}
  >

    <p
      style={{
        margin: 0,
        color: '#94a3b8',
        fontSize: 13
      }}
    >
      Name
    </p>

    <h3
      style={{
        margin: '8px 0 0'
      }}
    >
      {user.name}
    </h3>

  </div>

  <div
    style={{
      flex: 1,
      background: 'rgba(255,255,255,0.08)',
      padding: 18,
      borderRadius: 16,
      border: '1px solid rgba(255,255,255,0.08)'
    }}
  >

    <p
      style={{
        margin: 0,
        color: '#94a3b8',
        fontSize: 13
      }}
    >
      Email
    </p>

    <h3
      style={{
        margin: '8px 0 0',
        fontSize: 15
      }}
    >
      {user.email}
    </h3>

  </div>

</div>

          <h4>

            Subject

          </h4>

          <input

            value={subject}

            onChange={(e) =>
              setSubject(
                e.target.value
              )
            }

            style={inputStyle}

          />

          <h4>

            Feedback Type

          </h4>

          <select

            value={type}

            onChange={(e) =>
              setType(
                e.target.value
              )
            }

            style={inputStyle}

          >

            <option>
              Bug Report
            </option>

            <option>
              Feature Request
            </option>

            <option>
              UI Improvement
            </option>

            <option>
              Performance Issue
            </option>

            <option>
              Other
            </option>

          </select>

          <h4>

            Message

          </h4>

          <textarea

            rows={6}

            value={message}

            onChange={(e) =>
              setMessage(
                e.target.value
              )
            }

            style={{
              ...inputStyle,
              resize: 'none'
            }}

          />

          <h4>

            Rating

          </h4>

          <div
  style={{
    display: 'flex',
    gap: 10,
    marginTop: 10,
    marginBottom: 10
  }}
>

  {[1,2,3,4,5].map(star => (

    <span

      key={star}

      onClick={() =>
        setRating(star)
      }

      style={{

        fontSize: 36,

        cursor: 'pointer',

        transition: '0.2s',

        color:

          star <= rating

            ? '#facc15'

            : '#475569'

      }}

    >

      ★

    </span>

  ))}

</div>

<p
  style={{
    color: '#cbd5e1',
    marginTop: 0
  }}
>

  {

    rating > 0

      ? `${rating}/5 Stars`

      : 'Select Rating'

  }

</p>

          <h4>
  Screenshot (Optional)
</h4>

<label
  style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',

    minHeight: 140,

    border:
      '2px dashed rgba(255,255,255,0.2)',

    borderRadius: 20,

    background:
      'rgba(255,255,255,0.04)',

    cursor: 'pointer',

    transition: '0.3s',

    marginBottom: 20
  }}
>

  <div
    style={{
      fontSize: 42,
      marginBottom: 10
    }}
  >
    📎
  </div>

  <div
    style={{
      fontWeight: 'bold',
      fontSize: 16
    }}
  >
    Upload Screenshot
  </div>

  <div
    style={{
      marginTop: 8,
      color: '#94a3b8',
      fontSize: 13
    }}
  >
    PNG, JPG, JPEG, WEBP
  </div>

  {image && (
    <div
      style={{
        marginTop: 10,
        color: '#22c55e',
        fontWeight: 'bold'
      }}
    >
      ✅ {image.name}
    </div>
  )}

  <input
    type="file"
    hidden
    accept="
      image/png,
      image/jpeg,
      image/webp
    "
    onChange={(e) =>
      setImage(
        e.target.files[0]
      )
    }
  />

</label>

          {image && (

  <div
    style={{
      textAlign: 'center',
      marginBottom: 20
    }}
  >

    <img

      src={
        URL.createObjectURL(
          image
        )
      }

      alt="preview"

      style={{

        maxWidth: '100%',

        maxHeight: 250,

        borderRadius: 18,

        border:
          '2px solid rgba(255,255,255,0.1)',

        boxShadow:
          '0 10px 30px rgba(0,0,0,0.3)'

      }}

    />

  </div>

)}

          <button

            onClick={
              submitFeedback
            }

            style={{

              marginTop: 30,

              width: '100%',

              padding: 18,

              border: 'none',

              borderRadius: 18,

              background:
                'linear-gradient(135deg,#8b5cf6,#ec4899)',

              color: 'white',

              fontWeight: 'bold',

              cursor: 'pointer'

            }}

          >

            🚀 Submit Feedback

          </button>

        </div>

      </div>

    </>

  );

}

const inputStyle = {

  width: '100%',

  padding: 14,

  borderRadius: 12,

  border: 'none',

  marginBottom: 15

};