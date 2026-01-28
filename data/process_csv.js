const fs = require('fs');
const path = require('path');

function extractHour(timestamp) {
    const match = timestamp.match(/:(\d{2}):\d{2}:\d{2}/);
    return match ? parseInt(match[1], 10) : 0;
}

function extractPath(url) {
    return url.split('?')[0];
}

function createEncoders(logs) {
    const methods = [...new Set(logs.map(l => l.method))].sort();
    const paths = [...new Set(logs.map(l => extractPath(l.url)))].sort();
    const userAgents = [...new Set(logs.map(l => l.userAgent))].sort();

    return {
        method: {
            classes: methods,
            mapping: Object.fromEntries(methods.map((m, i) => [m, i]))
        },
        path: {
            classes: paths,
            mapping: Object.fromEntries(paths.map((p, i) => [p, i]))
        },
        user_agent: {
            classes: userAgents,
            mapping: Object.fromEntries(userAgents.map((ua, i) => [ua, i]))
        }
    };
}

function processLogs(inputFile) {
    console.log(`Processing: ${inputFile}`);

    const logs = JSON.parse(fs.readFileSync(inputFile, 'utf-8'));
    const encoders = createEncoders(logs);

    const features = logs.map(log => {
        const logPath = extractPath(log.url);
        return {
            status: log.status,
            size: log.size,
            method: encoders.method.mapping[log.method] ?? -1,
            path: encoders.path.mapping[logPath] ?? -1,
            user_agent: encoders.user_agent.mapping[log.userAgent] ?? -1,
            hour_of_day: extractHour(log.timestamp)
        };
    });

    const encoderPath = path.join(path.dirname(inputFile), 'encoder_mappings.json');
    fs.writeFileSync(encoderPath, JSON.stringify(encoders, null, 2));
    console.log(`Encoders saved to: ${encoderPath}`);

    const featuresPath = path.join(path.dirname(inputFile), 'features.json');
    fs.writeFileSync(featuresPath, JSON.stringify(features, null, 2));
    console.log(`Features saved to: ${featuresPath}`);

    const stats = calculateStats(features);
    const statsPath = path.join(path.dirname(inputFile), 'baseline_stats.json');
    fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2));
    console.log(`Baseline stats saved to: ${statsPath}`);

    return { features, encoders, stats };
}

function calculateStats(features) {
    const numericFields = ['status', 'size', 'method', 'path', 'user_agent', 'hour_of_day'];
    const stats = {};

    for (const field of numericFields) {
        const values = features.map(f => f[field]).filter(v => v >= 0);
        const n = values.length;

        if (n === 0) {
            stats[field] = { mean: 0, std: 1, min: 0, max: 0 };
            continue;
        }

        const mean = values.reduce((a, b) => a + b, 0) / n;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
        const std = Math.sqrt(variance) || 1;

        stats[field] = {
            mean: Math.round(mean * 100) / 100,
            std: Math.round(std * 100) / 100,
            min: Math.min(...values),
            max: Math.max(...values)
        };
    }

    return stats;
}

if (require.main === module) {
    const args = process.argv.slice(2);

    if (args.length < 1) {
        console.log('Usage: node process_csv.js <input_json_file>');
        process.exit(1);
    }

    processLogs(args[0]);
}

module.exports = { processLogs, createEncoders, calculateStats, extractHour, extractPath };
