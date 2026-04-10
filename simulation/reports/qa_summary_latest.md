# QA Summary (Latest)

- Timestamp: 2026-04-10T05:42:02.247Z
- Sessions: 1000
- Profiles: casual, active, whale_sim
- Regression pass rate: 50%
- Any exploit sessions: 100%
- Strict mode: true

## Failed Tests
- crop_arbitrage_zero: actual=154 threshold={"eq":0}
- random_event_exploit_zero: actual=9846 threshold={"eq":0}
- first_harvest_within_5min_p50: actual=330 threshold={"lte":300}
- first_harvest_within_3min_p90: actual=99999 threshold={"lte":180}
- automation_within_40min_p50: actual=1667 threshold={"lte":40}
- automation_within_40min_p90: actual=1667 threshold={"lte":40}
- active_prestige_rate_gte70pct: actual=0 threshold={"gte":70}
- high_exploits_zero: actual=2 threshold={"eq":0}
- any_exploit_sessions_lte10pct: actual=100 threshold={"lte":10}

## Top Exploits
- [HIGH] RANDOM_EVENT_EXPLOIT: 984.6% sessions
- [HIGH] CROP_ARBITRAGE: 15.4% sessions

Report JSON: qa_report_2026-04-10T05-42-02-247Z.json
