# THE HIDDEN ORBIT – 3D CELESTIAL ALIGNMENT GAME

An immersive, futuristic, browser-based astronomical puzzle game designed for competitive team-based events.

## 🌌 Overview

The game challenges players to position planets in a heliocentric solar system while adopting **Earth's vantage point** to determine their apparent positions against a twelve-sector celestial zodiac reference.

### Key Features
- **Realistic 3D Solar System**: Built with Three.js featuring procedural textures (atmospheric bands, sunspots, Saturn's rings with Cassini division, Earth clouds, corona glow, 3500-star particle field).
- **Synchronized 2D Positioning Array**: Interactive SVG orbital radar with real-time drag-and-drop and snapping to 12 predefined orbital nodes (0°, 30°, 60° ... 330°).
- **Earth Vantage Point**: Earth remains locked as the reference horizon for all sightline calculations (`atan2(dy, dx)`).
- **Hidden Celestial Boundary**: The outer boundary is initially an unidentified energy field. Players discover the hidden zodiac reference wheel by holding click/touch for 1.8 seconds.
- **Multiple Mission Types**:
  - *Type A*: Single Planet (e.g. Saturn in Pisces)
  - *Type B*: Multi-Planet Conjunction (e.g. Jupiter & Mars in Cancer simultaneously)
  - *Type C*: Multi-Sector Triangulation (Saturn → Pisces, Mars → Leo, Jupiter → Cancer)
  - *Type D*: Reverse Sector Identification
  - *Type E*: System Recovery / Master Clockwork
- **Tactical Intel & Hint System**: 3 progressive non-spoiler hints.
- **Scoring & Timer**: 6-minute mission countdown with 30s emergency warning pulse, attempts tracking, and time bonuses.
- **Procedural Audio Engine**: Real-time sound synthesis via Web Audio API (space drone, laser sightlines, snap clicks, revelation arpeggios, error buzzes, victory fanfares).
- **Cryptographic Launch Codes & Confetti**: Upon alignment victory, authentic launch tokens are generated (e.g., `ORBIT-CONJUNCTION-CANCER-8491`).
- **Administrator Panel**: Configure Earth's astronomical epoch (Vernal Equinox, Summer Solstice, Autumn Equinox, Winter Solstice), inspect authoritative mathematical solutions, configure timer/attempts, and connect Supabase.
- **Leaderboard**: Live tournament standings with offline fallback and optional Supabase PostgreSQL sync.

---

## 🚀 Running the Game

### Prerequisites
- Node.js (v18+)
- npm or pnpm

### Quickstart
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173/` in your browser.

### Production Build
```bash
npm run build
npm run preview
```
