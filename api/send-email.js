// api/send-email.js
const { Resend } = require('resend');

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'POST required' });
  }

  try {
    const { to, subject, html, text, fromName } = req.body || {};

    // 🔒 VALIDATION
    if (!to) {
      return res.status(400).json({ success: false, error: '"to" email is required' });
    }

    if (!process.env.RESEND_API_KEY) {
      return res.status(500).json({ success: false, error: 'Missing RESEND_API_KEY' });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    // ✅ SEND EMAIL
    const data = await resend.emails.send({
      from: `${fromName || 'IT Lab System'} <noreply@resend.dev>`,
      to: Array.isArray(to) ? to : [to],
      subject: subject || 'Notification',
      html: html || '<p>No content</p>',
      text: text || 'No content'
    });

    return res.status(200).json({
      success: true,
      id: data.id
    });

  } catch (error) {
    console.error('Email error:', error);

    return res.status(500).json({
      success: false,
      error: error.message || 'Email sending failed'
    });
  }
};