# Data safety form — exact answers

Play Console → **App content → Data safety**. Answer exactly as below. Inconsistency
between these answers and the privacy policy is the most common rejection reason.

## Section 1 — Data collection and security

| Question | Answer |
| --- | --- |
| Does your app collect or share any of the required user data types? | **Yes** |
| Is all of the user data collected by your app encrypted in transit? | **Yes** (HTTPS only) |
| Do you provide a way for users to request that their data is deleted? | **Yes** |
| Account deletion request URL | `https://habbiters.app/delete-account` |

## Section 2 — Data types

For every row: **Collected = Yes**, **Shared = No**, **Processed ephemerally = No**,
**Required = see column**, **Purpose = App functionality / Account management**.

| Data type | Sub-type | Required? | Notes |
| --- | --- | --- | --- |
| Personal info | Name | Optional | Display name the user types |
| Personal info | Email address | Required | Login and account recovery |
| Personal info | User IDs | Required | Internal account ID |
| Photos | Photos | Optional | Profile avatar uploaded by the user |
| Financial info | Purchase history | Optional | Only if the user buys a plan on the website |
| App activity | In-app actions | Required | Habits, check-ins, streaks, XP, progress |
| App activity | Other user-generated content | Optional | Learning plans, notes, template progress |
| App info and performance | Crash logs | No | Not collected |
| App info and performance | Diagnostics | No | Not collected |
| Device or other IDs | Device or other IDs | No | Not collected |
| Location | — | No | Not collected |
| Contacts | — | No | Not collected |
| Messages | — | No | Not collected |
| Health and fitness | — | No | Habit names are user text, not health data |
| Audio, files, calendar | — | No | Not collected |

### Data sharing

Select **No** for every data type. The app does not sell data and does not send personal
data to advertising or analytics networks.

Processors that host the data (Render, MongoDB Atlas, Brevo for email) are service
providers, not data "sharing" in Play's definition — they act only on your instructions.

## Section 3 — Security practices

| Question | Answer |
| --- | --- |
| Data is encrypted in transit | **Yes** |
| Users can request data deletion | **Yes** |
| Committed to the Play Families Policy | **No** (app is 13+) |
| Independent security review | **No** |

## Permissions explanation (if Play asks)

| Permission | Why the app needs it |
| --- | --- |
| `INTERNET` | Loads the app and syncs habits with the Habbiters API |
| `VIBRATE` | Short haptic feedback when a habit is completed |

The app has **no** camera, location, contacts, SMS, microphone, or storage permissions.

## Ads and payments

- Contains ads: **No**
- In-app purchases: **No** (the app is completely free and sells no digital goods)
- App is free: **Yes**

## Content rating questionnaire — quick answers

| Question | Answer |
| --- | --- |
| Violence, blood, scary content | No |
| Sexuality or nudity | No |
| Profanity | No |
| Controlled substances | No |
| Gambling or simulated gambling | No |
| User-generated content shared with others | No |
| Users can interact online | No |
| Shares location | No |
| Purchases | No |
| Expected rating | Everyone / 3+ |

## Target audience

- Age groups: **13–15, 16–17, 18+**
- Appeals to children: **No**
- Designed for families: **No**
