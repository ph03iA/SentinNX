/**
 * parse_logs.js - Parse NGINX access logs into structured JSON
 * 
 * Usage: node parse_logs.js <input_log_file> <output_json_file>
 * Example: node parse_logs.js nginx.log parsed_logs.json
 */

const fs = require('fs');
const readline = require('readline');
const path = require('path');

// NGINX log pattern (Combined Log Format)
const LOG_PATTERN = /^(?<ip>[\d.:a-fA-F]+)\s+-\s+-\s+\[(?<timestamp>[^\]]+)\]\s+"(?<method>\w+)\s(?<url>\S+)\s(?<httpVersion>[^"]+)"\s(?<status>\d+)\s(?<size>\d+)\s+"[^"]*"\s+"(?<userAgent>[^"]*)"/;

async function parseLogs(inputFile, outputFile) {
    const parsedLogs = [];

    const fileStream = fs.createReadStream(inputFile);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    console.log(`📖 Parsing logs from: ${inputFile}`);

    let lineCount = 0;
    let matchCount = 0;

    for await (const line of rl) {
        lineCount++;
        const match = line.match(LOG_PATTERN);

        if (match && match.groups) {
            matchCount++;
            parsedLogs.push({
                ip: match.groups.ip,
                timestamp: match.groups.timestamp,
                method: match.groups.method,
                url: match.groups.url,
                httpVersion: match.groups.httpVersion,
                status: parseInt(match.groups.status, 10),
                size: parseInt(match.groups.size, 10),
                userAgent: match.groups.userAgent
            });
        }
    }

    // Write to JSON file
    fs.writeFileSync(outputFile, JSON.stringify(parsedLogs, null, 2));

    console.log(`✅ Parsed ${matchCount}/${lineCount} lines`);
    console.log(`📁 Output saved to: ${outputFile}`);

    return parsedLogs;
}

// CLI usage
if (require.main === module) {
    const args = process.argv.slice(2);

    if (args.length < 2) {
        console.log('Usage: node parse_logs.js <input_log_file> <output_json_file>');
        console.log('Example: node parse_logs.js nginx.log parsed_logs.json');
        process.exit(1);
    }

    const [inputFile, outputFile] = args;
    parseLogs(inputFile, outputFile).catch(console.error);
}

module.exports = { parseLogs, LOG_PATTERN };
