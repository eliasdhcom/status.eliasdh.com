/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 05/11/2026
**/

const fs = require('node:fs');
const path = require('node:path');
const { loadConfig } = require('./config');
const { probeAll } = require('./probe');
const { loadHistory, saveHistory, applyResult, prune } = require('./history');
const { buildReport } = require('./report');
const { buildDemoHistory, buildDemoResults } = require('./demo');

const USAGE = 'Usage: node src/monitor.js [--config services.json] [--history history.json] [--out status.json] [--demo]';

function parseArgs(argv) {
    const args = { config: path.join(__dirname, '..', 'services.json'), history: null, out: 'status.json', demo: false };
    for (let i = 0; i < argv.length; i++) {
        const flag = argv[i];
        if (flag === '--demo') args.demo = true;
        else if (['--config', '--history', '--out'].includes(flag) && argv[i + 1]) args[flag.slice(2)] = argv[++i];
        else throw new Error(`Unknown or incomplete argument "${flag}". ${USAGE}`);
    }
    return args;
}

function writeJson(filePath, value) {
    fs.mkdirSync(path.dirname(path.resolve(filePath)), { recursive: true });
    fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

async function main(argv = process.argv.slice(2)) {
    const args = parseArgs(argv);
    const config = loadConfig(args.config);
    const now = new Date();

    let history;
    let results;
    if (args.demo) {
        history = buildDemoHistory(config, now);
        results = buildDemoResults(config, now);
    } else {
        history = loadHistory(args.history);
        results = await probeAll(config.services);
        for (const result of results) {
            const detail = result.status === 'skipped' || result.reason ? ` (${result.reason})` : '';
            const time = result.responseTimeMs != null ? ` ${result.responseTimeMs}ms` : '';
            console.log(`[${result.status}] ${result.id}${time}${detail}`);
            applyResult(history, result);
        }
        prune(history, now);
    }

    const report = buildReport(config, history, results, now);
    writeJson(args.out, report);
    if (args.history && !args.demo) saveHistory(args.history, history);
    console.log(`Overall: ${report.overall}. Wrote ${args.out}${args.history && !args.demo ? ` and ${args.history}` : ''}.`);
}

if (require.main === module) {
    main().catch(error => {
        console.error(error.message);
        process.exit(1);
    });
}

module.exports = { main, parseArgs };