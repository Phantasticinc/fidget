# Fidget app research & design brief (Oct 24, 2026)

## What leads the market
- **Antistress – relaxation toys (JindoBlu)** — 100M+ installs, 4.7★, 100+ toys, offline. Complaints: interstitial ads *when switching toys* (the core action), loud ads, $2/week to remove, "amateur animation", awkward drag controls (Rubik's cube), laggy touch/gyro on budget phones, too many notifications.
- **Fidgetable (iOS)** — 4.9★, no ads, ~11 fidgets. Wins on *tuned haptics per interaction*, minimal design, customization. Complaints: wants a reset on bubble wrap, small bugs.
- **FidgetDrop (Android)** — 54 haptic fidgets, distinct vibration per interaction, sound packs. Tiny install base.
- **Pop It / Antistress Simulator clones** — 3.5–4.1★. Complaints: ads, can't turn vibration off, coin gates, cheap visuals.

## What users love
Instant response, distinct haptic per action, crisp material sounds (wood, water, click), no timers/pressure, offline, endless loops (it never "ends").

## What users hate
Ads/interruptions, lag on budget phones, cheap-looking art, shallow toys, no way to tune vibration/sound, notifications, paywalls.

## How we beat them (the "10x" bets)
1. **Zero interruption**: no ads, no accounts, no notifications, no network after first load. Switching toys is instant (one swipe, no loading).
2. **Performance as a feature**: zero dependencies, no WASM, Canvas2D with hand-written physics. ~40 KB of JS total. Fixed-step physics @120 Hz, render @ display rate, DPR capped at 2. Runs on budget Android.
3. **Physics-driven feedback**: every sound and vibration is *generated from the physics event* (impact velocity → loudness/pitch; spinner bearing ticks scale with RPM; key switch has tactile bump at real actuation point). Not canned clips.
4. **Few toys, done deeply**, each with an endless loop + payoff:
   - **Pop** – bubble sheet with pressure-sensitive bubbles (deform under finger, snap at threshold), sheet auto-refills row by row (answers the #1 Fidgetable request: reset).
   - **Spin** – a precision flywheel: flick for momentum, real angular inertia/bearing friction, haptic detents scaled to speed, RPM readout.
   - **Click** – mechanical switches (tactile / clicky / linear) with real force curve & sound per switch type.
   - **Squish** – a palm-sized soft-body (pressure-based PBD) you can poke, pinch, fling; jiggles and settles.
5. **Purpose modes**: *Ride it out* 3-minute craving timer (urges peak and pass in ~3–5 min) with breathing pacer overlay you can use while fidgeting; *Calm* mode (muted palette, no sudden sounds, softer haptics) for sensory sensitivity; every sound/haptic independently toggleable.
6. **Premium minimal visuals**: dark neutral studio, one soft key light, physically-motivated shading (highlights, contact shadows), restrained palette, one-hand bottom navigation.
