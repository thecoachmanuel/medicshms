import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

/**
 * Send email using Nodemailer (configured for Google SMTP)
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} text - Plain text body
 * @param {string} html - HTML body
 */
export const sendEmail = async (to: string, subject: string, text: string, html?: string) => {
    // If credentials are not set, log and return (for development)
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.log('SMTP credentials not found. Email mocked:');
        console.log(`To: ${to}`);
        console.log(`Subject: ${subject}`);
        console.log(`Body: ${text}`);
        return { success: true, messageId: 'mock-id' };
    }

    try {
        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM || '"HMS Portal" <noreply@hms-portal.com>',
            to,
            subject,
            text,
            html: html || text,
        });

        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Nodemailer Error:', error);
        throw error;
    }
};
