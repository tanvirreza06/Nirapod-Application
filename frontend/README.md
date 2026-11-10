# Nirapod

An SOS and live location sharing web app for women's safety, built for Bangladesh (emergency number: 999).

One tap sends an alert with a live tracking link to trusted contacts. Contacts open the link and watch her move on a map in real time. No login is needed to view the link.

## Features

- Sign up and login with JWT, passwords and PIN stored as bcrypt hashes
- Trusted contacts (up to 5) with phone, email and Telegram ID
- SOS button: starts an event, sends a unique tracking link to contacts by Telegram and email
- Live GPS: the phone sends its location every 5 seconds, the tracking page updates on the map
- End an SOS only with the safety PIN
- Shake detection: 3 hard shakes start a 10 second countdown, and only the correct PIN cancels it
- Safety timer (dead man's switch): if she does not confirm with her PIN in time, the server alerts her contacts with her last known location
- Heartbeat monitoring: if location signals stop for 60 seconds during an SOS, the server alerts contacts with her last known location
- Tracking links expire after 24 hours

## Tech stack

| Part | Technology |
| --- | --- |
| Frontend | React (Vite), React Router, Leaflet, OpenStreetMap |
| Backend | Node.js, Express, JWT, bcryptjs |
| Database | MySQL 8 |
| Alerts | Telegram Bot API, Nodemailer (Gmail) |
| Testing | Jest, Supertest |
| Code quality | ESLint |
| API docs | Swagger (OpenAPI 3) |
| DevOps | Git, GitHub Actions, Docker, docker-compose |

## Project structure

```
backend/     Express API, routes, middleware, tests, Dockerfile
frontend/    React app, Dockerfile
database/    schema.sql (all tables)
.github/     GitHub Actions workflow (CI)
docker-compose.yml
```

## Run locally

You need Node.js 22, MySQL 8 and Git.

### 1. Database

Open MySQL and run:

```sql
CREATE DATABASE nirapod;
```

Then run `database/schema.sql` to create the tables.

### 2. Backend

```
cd backend
npm install
```

Copy `.env.example` to `.env` and fill in your own values:

- `DB_PASSWORD`: your MySQL password
- `JWT_SECRET`: any long random text
- `TELEGRAM_BOT_TOKEN`: create a bot with BotFather on Telegram
- `EMAIL_USER` and `EMAIL_PASS`: a Gmail address and its App Password

Start the server:

```
npm run dev
```

The API runs on http://localhost:5000.

### 3. Frontend

```
cd frontend
npm install
npm run dev
```

The app runs on http://localhost:5173.

### 4. Telegram alerts

Every contact must open the bot in Telegram and press Start once. Telegram does not allow a bot to message someone who has not started it. Contacts are saved with their numeric Telegram ID, not a username.

## Run with Docker

Create a `.env` file in the main folder (next to `docker-compose.yml`) with:

```
DB_PASSWORD=your_mysql_password
```

Make sure `backend/.env` exists too, then run:

```
docker compose up --build
```

This starts MySQL, the backend (port 5000) and the frontend (port 5173). The database tables are created automatically from `database/schema.sql`.

## Tests and code quality

```
cd backend
npm test
npm run lint
```

GitHub Actions runs lint and tests for the backend, and lint and build for the frontend, on every push to `main`.

## API documentation

With the backend running, open http://localhost:5000/api/docs for the Swagger page. Log in from the page, copy the token, press Authorize, and you can try every endpoint.

## Limitations

- A web app cannot read GPS or motion sensors when the phone is locked or the app is in the background, so shake detection and live tracking need the screen open. An Android version with a foreground service (Capacitor) is planned.
- No app can stop someone from switching off a phone. Nirapod handles this by detecting the lost signal and alerting contacts, not by blocking the power button.
- Phone motion sensors need HTTPS, so real shake testing needs the app deployed.
- Alert messages contain `localhost` links until the app is deployed.
- SMS is not free, so Telegram and email are the alert channels.
- Nirapod supports emergency services and does not replace them. In danger, call 999.

## Privacy

- Passwords and PINs are stored only as bcrypt hashes
- The public tracking API returns only a name, status and locations, never contact details
- Tracking links are random, hard to guess, and expire after 24 hours
- Deleting an account deletes its contacts, SOS events and locations

## Future work

- Android app with background GPS and motion detection
- SMS alerts through a local gateway
- Community map of unsafe areas
- Smartwatch or wearable button

## Team

Add your team names here.