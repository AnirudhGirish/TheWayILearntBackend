import nodemailer from 'nodemailer'; // emailConfig.js

// Create a transporter object using SMTP transport
const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    secure: true, 
    auth: {
        user: process.env.GMAIL_USER, 
        pass: process.env.GMAIL_PASSWORD, 
    },
});

const verifyTransporter = async () => {
    try {
        await transporter.verify();
        console.log('SMTP Server is ready and up running!!!');
    } catch (error) {
        console.error('Error verifying SMTP server:', error);
    }
};
verifyTransporter();

export { transporter };