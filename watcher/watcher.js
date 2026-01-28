require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const fs = require('fs');
const path = require('path');
const { Tail } = require('tail');
const notifier = require('node-notifier');
const nodemailer = require('nodemailer');

const CONFIG = {
    logFile: process.env.NGINX_LOG_PATH,
    predictUrl: process.env.PREDICT_ONE_URL,
    emailFrom: process.env.SENTINNX_MAIL_ID,
    emailPassword: process.env.SENTINNX_MAIL_PASSWORD,
    emailTo: process.env.RECEIVER_MAIL_ID
};

const encoderPath = path.join(__dirname, '..', 'models', 'encoder_mappings.json');
let encoderMappings = {};

try {
    encoderMappings = JSON.parse(fs.readFileSync(encoderPath, 'utf-8'));
    console.log('Loaded encoder mappings');
} catch (err) {
    console.error('Could not load encoder mappings:', err.message);
}

const LOG_PATTERN = /^(?<ip>[\d.:a-fA-F]+)\s+-\s+-\s+\[(?<timestamp>[^\]]+)\]\s+"(?<method>\w+)\s(?<url>\S+)\s(?<httpVersion>[^"]+)"\s(?<status>\d+)\s(?<size>\d+)\s+"[^"]*"\s+"(?<userAgent>[^"]*)"/;

function encodeValue(value, encoderType) {
    const mapping = encoderMappings[encoderType]?.mapping || {};
    return mapping[value] ?? -1;
}

function extractHour(timestamp) {
    const match = timestamp.match(/:(\d{2}):\d{2}:\d{2}/);
    return match ? parseInt(match[1], 10) : 0;
}

function parseLogLine(line) {
    const match = line.match(LOG_PATTERN);
    if (!match || !match.groups) return null;

    const { ip, timestamp, method, url, status, size, userAgent } = match.groups;
    const logPath = url.split('?')[0];

    return {
        raw: { ip, timestamp, method, path: logPath, userAgent },
        features: {
            status: parseInt(status, 10),
            size: parseInt(size, 10),
            method: encodeValue(method, 'method'),
            path: encodeValue(logPath, 'path'),
            user_agent: encodeValue(userAgent, 'user_agent'),
            hour_of_day: extractHour(timestamp)
        }
    };
}

async function sendAlert(logData) {
    const { ip, timestamp, path, userAgent } = logData.raw;

    const message = `Anomaly Detected!

IP Address: ${ip}
Timestamp: ${timestamp}
Path: ${path}
User Agent: ${userAgent}`;

    notifier.notify({
        title: 'SentinNX Anomaly Alert!',
        message: `Suspicious activity from ${ip}`,
        sound: true,
        wait: false
    });

    console.log('\n' + '='.repeat(50));
    console.log(message);
    console.log('='.repeat(50) + '\n');

    if (CONFIG.emailFrom && CONFIG.emailPassword && CONFIG.emailTo) {
        try {
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: CONFIG.emailFrom,
                    pass: CONFIG.emailPassword
                }
            });

            await transporter.sendMail({
                from: CONFIG.emailFrom,
                to: CONFIG.emailTo,
                subject: 'SentinNX Anomaly Detected',
                text: message
            });

            console.log('Email alert sent to:', CONFIG.emailTo);
        } catch (err) {
            console.error('Failed to send email:', err.message);
        }
    }
}

async function checkForAnomaly(logData) {
    try {
        const response = await fetch(CONFIG.predictUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ feature: logData.features })
        });

        const result = await response.json();

        if (result[0]?.anomaly) {
            console.log('ANOMALY DETECTED');
            await sendAlert(logData);
        }
    } catch (err) {
        console.error('Prediction failed:', err.message);
    }
}

function startWatcher() {
    console.log('SentinNX Watcher Starting...');
    console.log(`Log file: ${CONFIG.logFile}`);
    console.log(`ML API: ${CONFIG.predictUrl}`);
    console.log('-'.repeat(50));

    if (!fs.existsSync(CONFIG.logFile)) {
        console.error(`Log file not found: ${CONFIG.logFile}`);
        console.log('Set NGINX_LOG_PATH in .env to specify a different path');
        process.exit(1);
    }

    const tail = new Tail(CONFIG.logFile, {
        follow: true,
        useWatchFile: true
    });

    tail.on('line', async (line) => {
        const logData = parseLogLine(line);

        if (logData) {
            await checkForAnomaly(logData);
        } else {
            console.log('Log line did not match expected format');
        }
    });

    tail.on('error', (err) => {
        console.error('Tail error:', err.message);
    });

    console.log('Watching for anomalies... (Press Ctrl+C to stop)\n');
}

startWatcher();
