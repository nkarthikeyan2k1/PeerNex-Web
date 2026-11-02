# PeerNex

**Chat with strangers instantly: anonymous 1-on-1 video and text chat, matched by shared interests.**

🔗 **Live:** https://peer-nex-web.vercel.app/

PeerNex pairs you with a random person online. If you add a few interests (music, gaming, anime…), it tries to find someone who shares them first. If nobody matches after a moment, it falls back to anyone available. No sign-up, no accounts, and no chat history. Video and audio go directly between the two browsers over WebRTC and never pass through our servers.

This repo is the **web client**. The matchmaking and signaling backend lives in [PeerNex-Server](https://github.com/nkarthikeyan2k1/PeerNex-Server).

---

## Features

- **Video chat:** side-by-side view with the stranger on the left and you on the right. Your camera preview is live before you even click Start.
- **Text chat:** a terminal-style chat for when you'd rather not be on camera.
- **Interest matching:** pick tags on the landing page and get matched with people who share them.
- **Next / End:** skip to a new stranger in one click (or press `Esc` in the message box), or leave the session.
- **Mic and camera indicators:** when you mute or turn your camera off, the stranger sees it, so they don't just see a black screen.
- **Live online count:** shows how many people are connected right now.
- **Mobile-friendly:** stacked video on phones, with floating controls and a chat panel that slides up from the bottom.
- **Survives server cold starts:** reconnects automatically (up to 10 attempts) with a status banner, then offers a reload if the server can't be reached.

## How it works

```
  Browser A                    PeerNex-Server                   Browser B
     │                       (Socket.IO, Render)                    │
     │── findPeer {interests} ──▶│◀── findPeer {interests} ──────────│
     │                           │  match by shared interests        │
     │◀── matched ───────────────│─────────────── matched ──────────▶│
     │                           │                                   │
     │── signal (SDP / ICE) ────▶│──────────────────── signal ──────▶│
     │◀── signal ────────────────│◀─────────────────── signal ───────│
     │                           │                                   │
     │═══════════ WebRTC video/audio, peer-to-peer ═════════════════│
     │                           │                                   │
     │── sendMessage ───────────▶│──────────────── chatMessage ─────▶│
```

1. The browser opens a Socket.IO connection and sends `findPeer` with your interests.
2. The server pairs two people and sends each of them `matched`. Exactly one side is told to create the WebRTC offer.
3. The two browsers exchange connection details (SDP and ICE) through the server, then connect directly. Public STUN servers help them find each other.
4. Text messages are relayed by the server but never stored.

The full event contract is documented in the [server README](https://github.com/nkarthikeyan2k1/PeerNex-Server#readme).

## Tech stack

| | |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router) · React 19 · TypeScript |
| Realtime | [Socket.IO client](https://socket.io) for matchmaking and signaling · WebRTC for media |
| Styling | Component-scoped SCSS · Tailwind CSS v4 · [shadcn/ui](https://ui.shadcn.com) primitives |
| Theming | `next-themes` (light / dark) |
| Icons | `lucide-react` |
| Hosting | Vercel (web) · Render (server) · Docker image available |

## Getting started

### Prerequisites

- Node.js 20+
- A running [PeerNex-Server](https://github.com/nkarthikeyan2k1/PeerNex-Server) (local or remote)

### Setup

```bash
git clone <this-repo-url>
cd peernex-web
npm install
```

Create a `.env.local` file in the project root:

```bash
# Where the browser should connect for Socket.IO
SOCKET_BACKEND_URL=http://localhost:3001
```

Then start the dev server:

```bash
npm run dev
```

Open http://localhost:3000. To test a match on one machine, open `/video` or `/text` in **two tabs** and click **Start** in both.

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server on `:3000` |
| `npm run build` | Production build (`output: "standalone"`) |
| `npm start` | Serve the production build |
| `npm run lint` | Run ESLint (also runs in CI on pushes and PRs to `main`) |
| `npx tsc --noEmit` | Type-check the project |

## Configuration

| Variable | Required | Description |
|---|---|---|
| `SOCKET_BACKEND_URL` | Yes (prod) | URL of the PeerNex-Server instance. If empty, the browser connects to the same origin. |

`SOCKET_BACKEND_URL` is read **at request time**, not at build time. The server injects it into the page as `window.PEER_NEX`, so you can point one built image at a different backend just by changing the environment variable. No rebuild is needed.

> Everything in `window.PEER_NEX` is visible in the browser. Only add values that are safe to make public (see `lib/publicEnv.ts`).

## Project structure

```
app/
  page.tsx              Landing page: hero section and interest tags
  (main)/               Chat routes, wrapped in the socket provider
    text/  video/
features/
  landing/              Hero section and interest-tag picker
  chat/                 Shared chat UI and the matching state machine (useChatSession)
  text-chat/            Text chat screen
  video-chat/           Video screen, camera/mic (useLocalMedia), WebRTC (useWebRTC)
providers/
  SocketProvider.tsx    One shared Socket.IO connection with reconnection handling
lib/                    Runtime config helpers (publicEnv / clientEnv)
Constant/               ICE (STUN) server list
styles/                 SCSS variables and mixins, available in every SCSS file automatically
```

## Deployment

**Vercel:** import the repo and set `SOCKET_BACKEND_URL` in the project's environment variables.

**Docker:**

```bash
docker build -t peernex-web .
docker run -p 3000:3000 -e SOCKET_BACKEND_URL=https://your-server.example.com peernex-web
```

> **Free-tier note:** the backend runs on Render's free tier, which goes to sleep after about 15 minutes without traffic. The first visitor after that may wait a few seconds while it wakes up. The connection banner shows the retry progress during that time.

## Known limitations

- Only STUN servers are configured, with no TURN relay. Two users behind strict corporate or mobile NATs may not be able to connect video.
- Matchmaking state is held in memory on a single server instance.
- Audio rooms (group voice lounges) are in progress.

## Related

- [PeerNex-Server](https://github.com/nkarthikeyan2k1/PeerNex-Server): Socket.IO matchmaking and signaling backend
