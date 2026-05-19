#!/usr/bin/env node
// 📡 cimonitor — GitHub Actions Workflow Monitor

const https  = require('https');
const { execSync } = require('child_process');

const GREEN  = '\x1b[32m'; const RED    = '\x1b[31m';
const YELLOW = '\x1b[33m'; const CYAN   = '\x1b[36m';
const BOLD   = '\x1b[1m';  const DIM    = '\x1b[2m';
const NC     = '\x1b[0m';

function ghAPI(endpoint, token) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: 'api.github.com',
      path:     endpoint,
      headers:  { 'User-Agent': 'cimonitor/1.0', 'Accept': 'application/vnd.github.v3+json',
                  ...(token ? { Authorization: `token ${token}` } : {}) },
    };
    https.get(opts, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch { resolve({}); } });
    }).on('error', reject);
  });
}

function getToken() {
  try { return execSync('gh auth token 2>/dev/null', { encoding: 'utf8' }).trim(); }
  catch { return null; }
}

function formatDuration(ms) {
  if (!ms) return 'N/A';
  const s = Math.round(ms / 1000);
  return s < 60 ? `${s}s` : `${Math.floor(s/60)}m ${s%60}s`;
}

function barChart(pct, width = 15) {
  const filled = Math.round((pct / 100) * width);
  const color  = pct >= 95 ? GREEN : pct >= 80 ? YELLOW : RED;
  return color + '█'.repeat(filled) + NC + DIM + '░'.repeat(width - filled) + NC;
}

function getMockData() {
  return [
    { name: 'CI — main',       runs: 142, avgMs: 134000, p95Ms: 201000, failRate: 2.1,  trend: '↑' },
    { name: 'Deploy — prod',   runs:  38, avgMs: 292000, p95Ms: 341000, failRate: 0.0,  trend: '→' },
    { name: 'Tests — nightly', runs:  30, avgMs: 483000, p95Ms: 612000, failRate: 6.7,  trend: '↓' },
    { name: 'Lint',            runs: 201, avgMs:  28000, p95Ms:  45000, failRate: 0.5,  trend: '→' },
    { name: 'Security Scan',   runs:  28, avgMs: 167000, p95Ms: 198000, failRate: 3.6,  trend: '↑' },
  ];
}

function printDashboard(workflows, repo = 'your-repo') {
  console.clear();
  console.log(`\n${CYAN}${BOLD}📡 cimonitor — GitHub Actions Dashboard${NC}`);
  console.log(`${DIM}Repo: ${repo}  │  Updated: ${new Date().toLocaleTimeString()}${NC}\n`);
  console.log('─'.repeat(72));
  console.log(`${BOLD}${'Workflow'.padEnd(22)} ${'Runs'.padEnd(6)} ${'Avg'.padEnd(9)} ${'p95'.padEnd(9)} ${'Fail%'.padEnd(7)} Success  Trend${NC}`);
  console.log('─'.repeat(72));

  workflows.forEach(w => {
    const successRate = 100 - w.failRate;
    const bar         = barChart(successRate, 10);
    const failColor   = w.failRate > 5 ? RED : w.failRate > 1 ? YELLOW : GREEN;
    const trendColor  = w.trend === '↑' ? YELLOW : w.trend === '↓' ? RED : DIM;
    console.log(
      `${w.name.slice(0, 21).padEnd(22)} ` +
      `${String(w.runs).padEnd(6)} ` +
      `${formatDuration(w.avgMs).padEnd(9)} ` +
      `${formatDuration(w.p95Ms).padEnd(9)} ` +
      `${failColor}${String(w.failRate.toFixed(1)+'%').padEnd(7)}${NC} ` +
      `${bar} ` +
      `${trendColor}${w.trend}${NC}`
    );
  });

  console.log('─'.repeat(72));
  const flaky = workflows.filter(w => w.failRate > 5);
  if (flaky.length) {
    console.log(`\n${YELLOW}${BOLD}⚠️  Flaky workflows:${NC} ${flaky.map(w => w.name).join(', ')}`);
  }
  const slowest = [...workflows].sort((a,b) => b.p95Ms - a.p95Ms)[0];
  console.log(`${DIM}Slowest (p95): ${slowest?.name} at ${formatDuration(slowest?.p95Ms)}${NC}\n`);
}

async function liveData(repo, token) {
  const runs = await ghAPI(`/repos/${repo}/actions/runs?per_page=100`, token);
  if (!runs.workflow_runs) return getMockData();

  const grouped = {};
  runs.workflow_runs.forEach(run => {
    const name = run.name || run.workflow_id;
    if (!grouped[name]) grouped[name] = [];
    const durationMs = run.updated_at && run.created_at
      ? new Date(run.updated_at) - new Date(run.created_at) : null;
    grouped[name].push({ success: run.conclusion === 'success', durationMs });
  });

  return Object.entries(grouped).map(([name, items]) => {
    const durations = items.map(i => i.durationMs).filter(Boolean).sort((a,b) => a-b);
    const avgMs     = durations.length ? durations.reduce((a,b) => a+b,0) / durations.length : 0;
    const p95Ms     = durations[Math.floor(durations.length * 0.95)] || avgMs;
    const failRate  = items.length ? (items.filter(i => !i.success).length / items.length) * 100 : 0;
    return { name, runs: items.length, avgMs, p95Ms, failRate, trend: '→' };
  });
}

const args  = process.argv.slice(2);
const cmd   = args[0] || 'demo';
const repo  = args[args.indexOf('--repo') + 1] || null;
const token = getToken();

console.log(`\n${CYAN}${BOLD}📡 cimonitor${NC}\n`);

(async () => {
  if (cmd === 'demo') {
    printDashboard(getMockData(), 'demo/repo');
  } else if (cmd === 'dashboard' || cmd === 'stats') {
    if (!repo && !token) {
      console.log(`${YELLOW}No repo specified and no gh auth found. Running demo...${NC}\n`);
      printDashboard(getMockData(), 'demo/repo');
    } else {
      const targetRepo = repo || (token ? execSync('gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null', { encoding: 'utf8' }).trim() : null);
      console.log(`${DIM}Fetching data for ${targetRepo}...${NC}\n`);
      const data = await liveData(targetRepo, token).catch(() => getMockData());
      printDashboard(data, targetRepo);
    }
  } else if (cmd === 'flaky') {
    const data = getMockData().filter(w => w.failRate > 3);
    console.log(`${BOLD}🎰 Flaky Workflows (fail rate > 3%):${NC}\n`);
    data.forEach(w => console.log(`  ${RED}❌${NC} ${w.name.padEnd(25)} ${RED}${w.failRate.toFixed(1)}% failure rate${NC}`));
    console.log();
  } else {
    console.log(`Usage:`);
    console.log(`  node src/monitor.js demo`);
    console.log(`  node src/monitor.js dashboard`);
    console.log(`  node src/monitor.js dashboard --repo owner/repo`);
    console.log(`  node src/monitor.js flaky\n`);
  }
})();
