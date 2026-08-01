# SAT Question-of-the-Day LINE Bot

Two LINE chatbots (SAT **Math** and SAT **English**) that send followers a daily practice question and grade their answers. Built with Firebase Cloud Functions, Firestore, and the LINE Messaging API.

![Status](https://img.shields.io/badge/status-archived-lightgrey)
![Node.js](https://img.shields.io/badge/runtime-Node.js-339933?logo=node.js&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-Cloud%20Functions%20%2B%20Firestore-FFCA28?logo=firebase&logoColor=black)
![LINE](https://img.shields.io/badge/LINE-Messaging%20API-00C300?logo=line&logoColor=white)

> **Archived** — kept as a snapshot of a self-learning project (Node.js + Firebase + LINE Messaging API).

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

## Architecture

```
LINE user ──(webhook)──▶ MathReplyBot / EnglishReplyBot ──▶ reply via LINE Messaging API
                               │  read today's doc, record answer
                               ▼
                           Firestore
                               ▲
                               │  read today's question image
Daily scheduler ──(HTTP)──▶ MathBroadcast / EnglishBroadcast ──▶ LINE broadcast API
```

- **Stateless functions.** Every request derives today's question id from the date (`m<YYYYMMDD>` / `e<YYYYMMDD>`) and reads all state from Firestore — nothing is held in the function instance between invocations.
- **Push + pull.** A scheduled HTTP endpoint broadcasts the daily question; the webhook handles grading, explanations, and score lookups interactively.
- **Two bots, one deployable.** The Math and English bots are parallel code paths over their own question and user collections, deployed together from the single `index.js`.

### Firestore layout

- `sat-math-questions` / `sat-english-questions` — one doc per day, keyed `m<YYYYMMDD>` / `e<YYYYMMDD>` (e.g. `m20250527`). Each doc holds the question image URL, per-choice feedback text (`A`–`D`), the `correct_choice`, and the explanation image URL (`answer`).
- `math-users` / `english-users` — one doc per LINE user; each answered day is stored as `<questionId>: true|false`.

## Engineering practice

- **Secrets out of source.** LINE channel access tokens are read from Firebase Functions runtime config (`functions.config().line.*`) — nothing sensitive is hardcoded in the repo.
- **Rules enforced server-side.** One-attempt-per-day grading and explanation-only-after-answering are checked in the function against the user's Firestore doc, not trusted to the client.
- **Webhook hygiene.** LINE verification events (the all-zero reply token) and non-text messages are acknowledged with `200 OK` and ignored, so retries and probes don't corrupt state.

## Setup

The LINE channel access tokens are read from Firebase Functions config (never commit them to the repo):

```sh
firebase functions:config:set line.math_token="<MATH_CHANNEL_ACCESS_TOKEN>" line.english_token="<ENGLISH_CHANNEL_ACCESS_TOKEN>"
firebase deploy --only functions
```

Then point each LINE channel's webhook at the deployed `MathReplyBot` / `EnglishReplyBot` function URL, and schedule the two broadcast endpoints to run daily (e.g. Cloud Scheduler).

## Related projects

- [coffee-brew-log](https://github.com/Mark6611/coffee-brew-log) — local-first coffee brew-log PWA (SvelteKit + Dexie), [live on the App Store](https://apps.apple.com/app/id6786772685)
- [buffy](https://github.com/Mark6611/buffy) — BuffUp workout tracker (SvelteKit + Capacitor), [live on the App Store](https://apps.apple.com/app/id6785999682)
- [chawan](https://github.com/Mark6611/chawan) — matcha brew-log PWA, local-first; App Store review in progress
- [html-brew](https://github.com/Mark6611/html-brew) — Brew Sheet, the Astro blog companion to the coffee app
