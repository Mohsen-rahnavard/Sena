// Vercel serverless function: emails contact-form messages to the site owner through Gmail.
// Needs two environment variables in the Vercel project settings:
//   GMAIL_USER          the Gmail address that sends and receives the messages
//   GMAIL_APP_PASSWORD  a Gmail app password for that account (not the normal password)
const nodemailer = require('nodemailer');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SITE = 'www.senavaliani.com';

function escapeHtml(text) {
    return text.replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

// A small card in the site's colours; inline styles because email clients ignore stylesheets
function htmlEmail(name, email, message) {
    const label = 'font:600 10px/1.4 monospace;letter-spacing:2px;text-transform:uppercase;color:#8a857c;';
    const value = 'font:14px/1.6 monospace;color:#1d1c1b;';
    return `
<div style="background:#272625;padding:24px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#e4dfd3;border-top:3px solid #c9a96e;">
    <tr><td style="padding:18px 22px;background:#1d1c1b;font:700 11px/1.4 monospace;letter-spacing:3px;text-transform:uppercase;color:#e4e2dd;">
      Message from <a href="https://${SITE}" style="color:#c9a96e;text-decoration:none;">${SITE}</a>
    </td></tr>
    <tr><td style="padding:22px 22px 6px;"><div style="${label}">Name</div><div style="${value}">${escapeHtml(name)}</div></td></tr>
    <tr><td style="padding:12px 22px 6px;"><div style="${label}">Email</div><div style="${value}"><a href="mailto:${escapeHtml(email)}" style="color:#1d1c1b;">${escapeHtml(email)}</a></div></td></tr>
    <tr><td style="padding:12px 22px 24px;"><div style="${label}">Message</div><div style="${value}white-space:pre-wrap;">${escapeHtml(message)}</div></td></tr>
    <tr><td style="padding:14px 22px;border-top:1px dashed #b5afa3;font:10px/1.5 monospace;color:#8a857c;">
      Sent from the contact form on ${SITE}. Press Reply to answer ${escapeHtml(name)}.
    </td></tr>
  </table>
</div>`;
}

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

    // Google shows app passwords in groups with spaces; strip them along with stray whitespace
    const GMAIL_USER = (process.env.GMAIL_USER || '').trim();
    const GMAIL_APP_PASSWORD = (process.env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, '');
    if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
        return res.status(500).json({ success: false, message: 'Email sending is not set up yet.' });
    }

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD }
    });

    try {
        await transporter.sendMail({
            from: { name: SITE, address: GMAIL_USER },
            to: GMAIL_USER,
            replyTo: { name, address: email },
            subject: `${SITE}: new message from ${name}`,
            text: `Message from ${SITE}\n\nName: ${name}\nEmail: ${email}\n\n${message}\n\nSent from the contact form on ${SITE}. Press Reply to answer ${name}.`,
            html: htmlEmail(name, email, message)
        });
        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Contact form email failed:', error);
        // The code (e.g. EAUTH for a rejected login) says why without exposing anything private
        return res.status(502).json({ success: false, message: 'The message could not be sent.', code: error.code || 'UNKNOWN' });
    }
};
