# Pulso

Homelab server monitor. FastAPI backend + React frontend.

## Stack

- **Backend**: Python / FastAPI + psutil, SQLite
- **Frontend**: React 18 + Vite
- **Deploy**: Docker (multi-stage build)

## Running with Docker

```bash
docker compose up -d
```

Open [http://localhost:7331](http://localhost:7331)

## Local development

**Backend** (requires Python 3.11+):
```bash
pip install -r requirements.txt
uvicorn app:app --reload --port 7331
```

**Frontend** (requires Node 20+):
```bash
cd frontend
npm install
npm run dev        # dev server on :5173 with API proxy to :7331
npm run build      # builds into ../static/
```

## What it monitors

| Tab | Metrics |
|-----|---------|
| Overview | CPU, RAM, GPU, disks, network, Docker summary |
| CPU | Usage, temperature, frequency, load avg, per-core bars |
| Memory | RAM usage/cache/buffers/swap, area chart, distribution arc |
| Disks | Capacity, I/O, SMART status, temperature per volume |
| Network | Throughput, latency, interface |
| Containers | Docker container states |

Optional features degrade silently when tools are unavailable: `nvidia-smi` (GPU), `smartctl` (SMART/disk temp), `docker` CLI.

## Visual styles

- **Minimal** — light/dark, monochrome charts
- **Tech** — always dark, colored charts per metric
