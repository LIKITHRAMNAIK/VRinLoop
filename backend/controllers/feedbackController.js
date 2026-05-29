const Feedback =
  require(
    '../models/Feedback'
  );

const User =
  require(
    '../models/User'
  );

const sendMail =
  require(
    '../utils/sendMail'
  );

exports.submitFeedback =
  async (req, res) => {

    try {
        if (

  !req.body.subject ||

  !req.body.type ||

  !req.body.message

) {

  return res.status(400).json({

    success: false,

    message:
      'Please fill all required fields'

  });

}

      const user =
        await User.findById(
          req.user.id
        );

      const feedback =
        await Feedback.create({

          user: user._id,

          name: user.name,

          email: user.email,

          subject:
            req.body.subject,

          type:
            req.body.type,

          message:
            req.body.message,

          rating:
            req.body.rating,

          image:
            req.file
              ? req.file.filename
              : ''

        });

      const html = `

<h2>💡 New VRinLoop Feedback</h2>

<hr>

<p><b>Name:</b> ${user.name}</p>

<p><b>Email:</b> ${user.email}</p>

<p><b>Subject:</b> ${req.body.subject}</p>

<p><b>Type:</b> ${req.body.type}</p>

<p><b>${'⭐'.repeat(Number(req.body.rating))}</p>

<p><b>Message:</b></p>

<div
  style="
    padding:12px;
    background:#f8fafc;
    border-radius:8px;
  "
>
  ${req.body.message}
</div>

<br>

<p>
  Submitted from
  <b>VRinLoop</b>
</p>

`;

await sendMail(

  'likithramnaik123@gmail.com',

  `💡 VRinLoop Feedback - ${req.body.type}`,

  html,

  req.file

);

      res.status(200).json({

        success: true,

        message:
          'Feedback submitted successfully'

      });

    } catch (error) {

      res.status(500).json({

        success: false,

        message:
          error.message

      });

    }

  };