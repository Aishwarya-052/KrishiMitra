# KrishiMitra — Phase 1 UI Prototype

A responsive React + TypeScript farming companion prototype. The interface includes a dashboard, weather screen, mandi price board, soil profile, crop ideas, advisory chat, settings, English/Kannada language switching, and a farmer profile saved in the current browser.

## Requirements

- Node.js 20.19+ or 22.12+
- npm

## Run locally

1. Open a terminal in the project folder.
2. Install dependencies:

   ```sh
   npm install
   ```

3. Start the development server:

   ```sh
   npm run dev
   ```

4. Open the local URL printed by Vite (normally `http://localhost:5173`).

For a production build, run `npm run build`. To serve that build locally, run `npm run preview`.

## Try the prototype

- Use the left navigation on desktop or the bottom navigation and **More** menu on a phone to visit all seven screens.
- Switch between **EN** and **ಕನ್ನಡ** from the top bar or Settings.
- Open Settings, fill in the farmer profile, and save it. The details persist in this browser using localStorage; use **Clear saved profile** to remove them.
- Try the sample questions in Advisory Chat. Replies are intentionally static demo guidance, not a live expert or AI service.
- Weather, soil readings, crop suggestions, and mandi prices are clearly marked **Demo Data**. They are fictional examples only; there are no live data integrations or API keys.

## Scope

This repository contains the Phase 1 working UI prototype only. It has no backend, authentication, live weather/market feed, or external advisory integration. Profile details remain on the device and browser where they were entered.
