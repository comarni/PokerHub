# PokerHub - 3D Poker Analysis Platform

A fully interactive 3D casino environment with AI-powered poker hand analysis.

## Features
- 3D casino lobby with multiple poker tables
- First-person player navigation (WASD + mouse)
- Physical 3D cards and chips
- Real-time Monte Carlo probability simulation
- AI bet recommendations (fold/check/call/raise)
- Hand history database
- Real-time multiplayer via Socket.io
- n8n automation workflows

## Stack
- **Frontend**: Next.js 14, Three.js, React, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL
- **Realtime**: Socket.io
- **Automation**: n8n
- **Infrastructure**: Docker, GitHub Actions

## Quick Start

### With Docker (recommended)
```bash
cp .env.example .env
docker-compose up --build
```

### Manual Setup

**Backend:**
```bash
cd server
npm install
npm run dev
```

**Frontend:**
```bash
cd client
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Auto Deploy To VPS

GitHub Actions can deploy automatically to the VPS on every push to `main`.

Required repository secrets:
- `VPS_HOST`: public IP or hostname of the VPS
- `VPS_USER`: SSH user, for example `root`
- `VPS_SSH_KEY`: private SSH key with access to the VPS
- `VPS_PORT`: optional SSH port, usually `22`

Expected server path:
- `/opt/PokerHub`

Deploy flow:
- GitHub Actions installs dependencies and builds `server` and `client`
- If validation passes, it connects to the VPS through SSH
- The VPS runs `git pull --ff-only origin main`
- The VPS rebuilds and restarts the stack with `docker compose up -d --build`

Before enabling auto deploy, make sure:
- the repository is already cloned on the VPS at `/opt/PokerHub`
- Docker and Docker Compose are installed on the VPS
- the VPS already has the runtime `.env` values it needs

## API Endpoints
- `POST /hand/analyze` - Analyze a poker hand
- `POST /hand/simulate` - Run Monte Carlo simulation
- `POST /bet/recommend` - Get betting recommendation
- `GET /stats/player/:id` - Player statistics
- `GET /stats/table/:id` - Table statistics

## Controls
- **WASD** - Move player
- **Mouse** - Rotate camera
- **Click "SIT DOWN"** - Join a table when near it
- **ESC** - Stand up / unlock mouse
