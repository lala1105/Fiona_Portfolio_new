const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer');
const fetch = require('node-fetch');
const formidable = require('express-formidable'); // ✅ Use formidable to handle FormData
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Parse multipart/form-data (from FormData in frontend)
app.use(formidable());

// Serve static files (frontend in /public)
app.use(express.static(path.join(__dirname, 'public')));

// Routes for static pages
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'home.html')));
app.get('/about', (req, res) => res.sendFile(path.join(__dirname, 'public', 'about.html')));
app.get('/contact', (req, res) => res.sendFile(path.join(__dirname, 'public', 'contact.html')));
app.get('/resume', (req, res) => res.sendFile(path.join(__dirname, 'public', 'resume.html')));
app.get('/skills', (req, res) => res.sendFile(path.join(__dirname, 'public', 'skills.html')));
app.get('/portfolio', (req, res) => res.sendFile(path.join(__dirname, 'public', 'portfolio.html')));

// POST /send handler
app.post('/send', async (req, res) => {
  const { name, email, message, 'g-recaptcha-response': token } = req.fields;

  if (!token) {
    return res.status(400).send('Missing CAPTCHA token');
  }

  try {
    // Verify reCAPTCHA
    const captchaRes = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: process.env.RECAPTCHA_SECRET,
        response: token
      }),
    });

    const captchaData = await captchaRes.json();
    if (!captchaData.success) {
      return res.status(400).send('CAPTCHA verification failed');
    }

    // Send email using Nodemailer
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: `Portfolio Message from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
      replyTo: email
    };

    await transporter.sendMail(mailOptions);
    res.status(200).send('Success');
  } catch (err) {
    console.error('Error sending message:', err);
    res.status(500).send('Failed to send message');
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
