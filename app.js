const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const fs = require('fs');
const app = express();
const port = 3000;

// Load user data from users.json
let users = require('./users.json');
let otps = {};

// Middleware setup
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');

// Nodemailer setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'your-email@gmail.com', // Replace with your email
        pass: 'your-password' // Replace with your email password
    }
});

function sendOTP(email, otp) {
    const mailOptions = {
        from: 'your-email@gmail.com',
        to: email,
        subject: 'Your OTP Code',
        text: `Your OTP code is ${otp}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log('Email sent: ' + info.response);
    });
}

function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function saveUsersToFile() {
    fs.writeFileSync('./users.json', JSON.stringify(users, null, 4));
}

app.get('/', (req, res) => {
    res.render('login');
});

app.get('/signup', (req, res) => {
    res.render('signup');
});

app.post('/signup', (req, res) => {
    const { name, phone, email, password } = req.body;

    if (!validateEmail(email)) {
        return res.send('Invalid email format');
    }

    const otp = generateOTP();
    otps[email] = otp;

    sendOTP(email, otp);

    users.push({ name, phone, email, password, verified: false });
    saveUsersToFile();
    res.render('otp_verification', { email });
});

app.post('/verify-otp', (req, res) => {
    const { email, otp } = req.body;

    if (otps[email] === otp) {
        users = users.map(user => user.email === email ? { ...user, verified: true } : user);
        saveUsersToFile();
        res.send('Email verified successfully! You can now log in.');
    } else {
        res.send('Invalid OTP. Please try again.');
    }
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;

    const user = users.find(user => user.email === email);

    if (user) {
        if (!user.verified) {
            return res.send('Email not verified. Please verify your email.');
        }

        if (user.password === password) {
            res.send('Login successful!');
        } else {
            res.send('Incorrect password.');
        }
    } else {
        res.send('User not found. Please sign up.');
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});
