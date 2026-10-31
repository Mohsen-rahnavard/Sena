// Vercel serverless function: emails contact-form messages to the site owner through Gmail.
// Needs two environment variables in the Vercel project settings:
//   GMAIL_USER          the Gmail address that sends and receives the messages
//   GMAIL_APP_PASSWORD  a Gmail app password for that account (not the normal password)
const nodemailer = require('nodemailer');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ success: false, message: 'Use POST to send a message.' });
    }

    const body = req.body || {};
    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim();
    const message = String(body.message || '').trim();

    // Hidden spam trap: people never tick it, so quietly accept and drop
    if (body.botcheck) return res.status(200).json({ success: true });

    if (!name || name.length > 100 || !EMAIL_PATTERN.test(email) || email.length > 200 || !message || message.length > 5000) {
        return res.status(400).json({ success: false, message: 'Fill in your name, a valid email and a message.' });
    }

    const { GMAIL_USER, GMAIL_APP_PASSWORD } = process.env;
    if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
        return res.status(500).json({ success: false, message: 'Email sending is not set up yet.' });
    }

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD }
    });

    try {
        await transporter.sendMail({
            from: { name: 'Sena Valiani website', address: GMAIL_USER },
            to: GMAIL_USER,
            replyTo: { name, address: email },
            subject: `New message from ${name}`,
            text: `${message}\n\n${name} <${email}>`
        });
        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Contact form email failed:', error);
        return res.status(502).json({ success: false, message: 'The message could not be sent.' });
    }
};
