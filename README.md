# 📡 cimonitor

> Monitors GitHub Actions workflow run times, failure rates, and bottlenecks across your repos.

[![CI](https://img.shields.io/github/actions/workflow/status/yourusername/cimonitor/ci.yml?style=for-the-badge)](https://github.com/yourusername/cimonitor/actions)
[![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)](./LICENSE)
[![Codespace Ready](https://img.shields.io/badge/Codespace-Ready-green?style=for-the-badge&logo=github)](https://codespaces.new/yourusername/cimonitor)

---

## 🚀 What is cimonitor?

`cimonitor` uses the GitHub API to pull workflow run data across your repos and surfaces slowdowns, flaky tests, and failure patterns — helping you optimise your CI pipelines with real data.

```bash
cimonitor dashboard                    # Live terminal dashboard
cimonitor stats --repo myrepo          # Stats for one repo
cimonitor flaky --days 30              # Detect flaky workflows
cimonitor slowest --top 5              # Slowest workflow steps
cimonitor report --format markdown     # Markdown report
cimonitor demo                         # Run with mock data
```

## ✨ Features
- 📊 Workflow run duration trends (p50/p95)
- 🔴 Failure rate per workflow and branch
- 🎰 Flaky test/step detection
- ⏱️ Step-level bottleneck identification
- 📈 Success rate over time charts
- 🔔 Alert on regression (run time spike)
- 📋 Markdown report for team sharing

## 📊 Sample Dashboard
```
📡 cimonitor — GitHub Actions Dashboard
──────────────────────────────────────────────────
Workflow            Runs  Avg Time  Fail%   Trend
CI — main           142   2m 14s    2.1%    ↑ slower
Deploy — prod        38   4m 52s    0.0%    → stable
Tests — nightly      30   8m 03s    6.7%    ↓ flaky ⚠️
──────────────────────────────────────────────────
```

## 🏆 Achievement Scripts
```bash
bash scripts/setup.sh && bash scripts/unlock-all.sh
```

## 🤝 Contributing
See [CONTRIBUTING.md](./CONTRIBUTING.md)
