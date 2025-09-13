import nodemailer from 'nodemailer';
import { config } from '../config.mjs';

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;
  if (!config.smtp.host || !config.smtp.user || !config.smtp.pass) return null;
  transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    auth: { user: config.smtp.user, pass: config.smtp.pass },
  });
  return transporter;
};

export const sendContactEmail = async ({ name, email, message }) => {
  if (!name || !email || !message)
    throw new Error('name, email, message required');
  const tx = getTransporter();
  const subject = `[Synapse] Contact from ${name}`;
  const html = `<p><b>Name:</b> ${escapeHtml(name)}</p><p><b>Email:</b> ${escapeHtml(email)}</p><p>${escapeHtml(message)}</p>`;

  if (!tx) {
    // Fallback: log to server if SMTP not configured
    console.warn('SMTP not configured. Logging email instead.');
    console.log({
      subject,
      to: config.smtp.to,
      from: config.smtp.from || config.smtp.user,
      html,
    });
    return { queued: true, simulated: true };
  }

  const info = await tx.sendMail({
    to: config.smtp.to,
    from: config.smtp.from || config.smtp.user,
    subject,
    html,
  });
  return { queued: true, messageId: info.messageId };
};

const escapeHtml = (s) =>
  String(s).replace(
    /[&<>"]+/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]
  );
