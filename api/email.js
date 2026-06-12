import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

function buildEmailHtml({ title, description, image }) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #3b82f6; font-size: 28px; margin: 0;">🎉 New Happening!</h1>
        </div>
        ${image ? `
          <div style="margin-bottom: 25px; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.1);">
            <img src="${image}" alt="${title}" style="width: 100%; height: 300px; object-fit: cover; display: block;">
          </div>
        ` : ''}
        <h2 style="color: #1e293b; font-size: 24px; margin-bottom: 15px; text-align: center;">${title}</h2>
        <div style="background: #ffffff; padding: 25px; border-radius: 12px; border-left: 4px solid #3b82f6; margin-bottom: 25px; line-height: 1.6; color: #334155; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          ${description.replace(/\n/g, '<br>')}
        </div>
        <div style="background: linear-gradient(135deg, #3b82f6, #10b981); color: white; padding: 20px; border-radius: 12px; text-align: center; font-weight: 600;">
          Stay tuned for more updates! 🚀
        </div>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
        <p style="color: #64748b; font-size: 14px; text-align: center;">
          This is an automated notification from Happenings Admin<br>
          <a href="https://btled-ict.vercel.app" style="color: #3b82f6; text-decoration: none;">View all happenings</a>
        </p>
      </div>
    </body>
    </html>
  `;
}

function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { title, description, image, subscribers } = req.body;

    console.log('📩 Received request');
    console.log('   Title:', title);
    console.log('   Raw subscribers:', subscribers);
    console.log('   Subscriber count:', subscribers?.length || 0);

    // Check API key
    if (!process.env.RESEND_API_KEY) {
      console.error('❌ RESEND_API_KEY not configured');
      return res.status(500).json({ error: 'Server configuration error: API key missing' });
    }

    // Validate
    if (!title || !description) {
      return res.status(400).json({ error: 'title and description are required' });
    }

    if (!subscribers || !Array.isArray(subscribers) || subscribers.length === 0) {
      return res.status(400).json({ error: 'No subscribers provided' });
    }

    // Clean and filter emails
    const validEmails = [];
    const invalidEmails = [];

    for (const email of subscribers) {
      const cleanedEmail = String(email).trim().toLowerCase();
      if (isValidEmail(cleanedEmail)) {
        validEmails.push(cleanedEmail);
      } else {
        invalidEmails.push(email);
      }
    }

    console.log('✅ Valid emails:', validEmails.length);
    console.log('❌ Invalid emails:', invalidEmails.length);

    if (validEmails.length === 0) {
      return res.status(400).json({ error: 'No valid email addresses found' });
    }

    // Send emails one by one for reliability
    let successCount = 0;
    const errors = [];
    const delayMs = 400; // Delay between emails to avoid rate limiting

    for (let i = 0; i < validEmails.length; i++) {
      const email = validEmails[i];
      
      try {
        const result = await resend.emails.send({
          from: 'Happenings <onboarding@resend.dev>',
          to: email,
          subject: `🎉 New Happening: ${title}`,
          html: buildEmailHtml({ title, description, image }),
        });

        if (result.error) {
          console.error(`❌ Failed to send to ${email}:`, result.error);
          errors.push(`${email}: ${result.error.message}`);
        } else {
          successCount++;
          console.log(`✅ Sent to ${email} (${successCount}/${validEmails.length})`);
        }
      } catch (emailError) {
        console.error(`❌ Error sending to ${email}:`, emailError);
        errors.push(`${email}: ${emailError.message}`);
      }

      // Add delay between each email (except last)
      if (i < validEmails.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    const result = {
      success: successCount > 0,
      subscribersCount: successCount,
      total: validEmails.length,
      errors: errors.length,
      errorDetails: errors.slice(0, 10)
    };

    console.log('📊 Final result:', result);
    
    res.status(200).json(result);

  } catch (error) {
    console.error('💥 Email API error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Internal server error',
      subscribersCount: 0 
    });
  }
}