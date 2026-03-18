# QA Summary (Latest)

- Timestamp: 2026-03-18T04:24:58.089Z
- Sessions: 1000
- Profiles: casual, active, whale_sim
- Regression pass rate: 61.1%
- Any exploit sessions: 100%
- Strict mode: true

## Failed Tests
- crop_arbitrage_zero: actual=9929 threshold={"eq":0}
- random_event_exploit_zero: actual=71 threshold={"eq":0}
- automation_within_40min_p50: actual=1667 threshold={"lte":40}
- automation_within_40min_p90: actual=13684 threshold={"lte":40}
- active_prestige_rate_gte70pct: actual=0 threshold={"gte":70}
- high_exploits_zero: actual=2 threshold={"eq":0}
- any_exploit_sessions_lte10pct: actual=100 threshold={"lte":10}

## Top Exploits
- [HIGH] CROP_ARBITRAGE: 992.9% sessions
- [HIGH] RANDOM_EVENT_EXPLOIT: 7.1% sessions

Report JSON: qa_report_2026-03-18T04-24-58-090Z.json
