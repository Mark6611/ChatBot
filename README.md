# SAT Question-of-the-Day LINE Bot

Two LINE chatbots (SAT **Math** and SAT **English**) that send followers a daily practice question and grade their answers. Built with Firebase Cloud Functions, Firestore, and the LINE Messaging API.

## How it works

Everything lives in a single file: [`index.js`](index.js). It exports four Firebase Cloud Functions:

| Function | Trigger | What it does |
|---|---|---|
| `MathReplyBot` | LINE webhook | Handles the Math bot's incoming messages |
| `EnglishReplyBot` | LINE webhook | Handles the English bot's incoming messages |
| `MathBroadcast` | HTTP (called daily) | Broadcasts today's Math question image to all followers |
| `EnglishBroadcast` | HTTP (called daily) | Broadcasts today's English question image to all followers |

### User flow

1. A daily broadcast pushes today's question (an image) to every follower. New followers get today's question immediately.
2. The user replies **A / B / C / D** — the bot grades it against Firestore and records the result (one attempt per day).
3. The user can ask for an **explanation** (only after answering) or their running **score** (`correct/total`).

### Firestore layout

- `sat-math-questions` / `sat-english-questions` — one doc per day, keyed `m<YYYYMMDD>` / `e<YYYYMMDD>` (e.g. `m20250527`). Each doc holds the question image URL, per-choice feedback text (`A`–`D`), the `correct_choice`, and the explanation image URL (`answer`).
- `math-users` / `english-users` — one doc per LINE user; each answered day is stored as `<questionId>: true|false`.

## Setup

The LINE channel access tokens are read from Firebase Functions config (never commit them to the repo):

```sh
firebase functions:config:set line.math_token="<MATH_CHANNEL_ACCESS_TOKEN>" line.english_token="<ENGLISH_CHANNEL_ACCESS_TOKEN>"
firebase deploy --only functions
```

Then point each LINE channel's webhook at the deployed `MathReplyBot` / `EnglishReplyBot` function URL, and schedule the two broadcast endpoints to run daily (e.g. Cloud Scheduler).

---

*Self-learning project (Node.js + Firebase + LINE Messaging API) built for educational purposes.*
