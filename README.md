# LifeLink

LifeLink is an educational emergency support app that brings account-based medical details, nearby services, an SOS location log and first-aid guidance into one interface.

> **Emergency notice:** The SOS feature records a location in the signed-in user's account. It does not send SMS or email and does not contact emergency services or responders. Call your local emergency number directly when you need urgent help. First-aid guidance is general information, not medical care.

## Live app

- Frontend: [life-link-ai-three.vercel.app](https://life-link-ai-three.vercel.app)
- Backend: a separately deployed Node.js API. Configure the frontend with its HTTPS URL ending in `/api`.

## Features

- Account registration and sign-in using JWTs
- Medical profile with blood group, allergies, and an emergency contact
- Locally generated QR code for the profile details
- SOS location history stored in MongoDB
- Nearby hospitals and police locations from OpenStreetMap data
- First-aid guidance through the Gemini API

## Technology

| Part | Stack |
| --- | --- |
| Frontend | React, Vite, React Router, Tailwind CSS |
| API | Node.js, Express, Mongoose |
| Database | MongoDB |
| Maps | Leaflet, OpenStreetMap, Overpass API |
| Guidance | Google Gemini API |

## Run locally

### API

```bash
cd server
npm install
```

Create `server/.env`:

```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>/<database>
JWT_SECRET=<long-random-secret>
GEMINI_API_KEY=<your-gemini-api-key>
GEMINI_MODEL=gemini-2.5-flash
GEMINI_API_VERSION=v1
CLIENT_ORIGIN=http://localhost:5173
```

Start the API:

```bash
npm run dev
```

The API waits for MongoDB before accepting requests. Check readiness at `http://localhost:5000/api/health`.

Nearby service searches use `GET /api/places/nearby` on the backend. The API queries OpenStreetMap's Overpass service, retries through alternate providers when needed, and expands the search radius up to 40 km.

### Frontend

```bash
cd client
npm install
```

Create `client/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

Run Vite:

```bash
npm run dev
```

## Deploy

Deploy `client/` as a Vercel project and deploy `server/` as a Node.js service. Set the following on the API host:

- `MONGO_URI`
- `JWT_SECRET`
- `GEMINI_API_KEY`
- `CLIENT_ORIGIN`, set to the exact frontend origin (for example `https://life-link-ai-three.vercel.app`)

Set `VITE_API_URL` on Vercel to the deployed API base URL ending in `/api`, then redeploy the frontend. Do not place database credentials or Gemini keys in `VITE_*` variables.

## Project layout

```text
client/   React application
server/   Express API, MongoDB models and API routes
```

## Author

Saksham Singh — B.Tech Computer Science Engineering, Shri Mata Vaishno Devi University
