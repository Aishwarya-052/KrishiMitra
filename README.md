# 🌾 KrishiMitra — Farming Companion Prototype

**🔗 Live Demo:** [https://vercel.app](https://vercel.app)

A responsive React + TypeScript farming companion prototype. The interface includes a dashboard, Open-Meteo weather and forecast, mandi price board, soil profile, crop ideas, advisory chat, settings, English/Kannada/Hindi language switching with voice read-aloud, offline caching, WhatsApp sharing, and a farmer profile saved in the current browser.

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

For live mandi prices, create a root `.env` file from `.env.example`, replace the placeholder with your data.gov.in API key, and restart Vite. The key is read by the server-side Vite middleware; do not put it in frontend code or commit `.env`.

For a production build, run `npm run build`. To serve that build locally, run `node server.mjs` (or `npm run preview`).

## Try the prototype

- **Live Web App:** Visit [https://vercel.app](https://vercel.app) to test the deployed application directly in any desktop or mobile browser.
- Use the left navigation on desktop or the bottom navigation and **More** menu on a phone to visit all screens.
- Switch between **EN**, **ಕನ್ನಡ**, and **हिंदी** from the top bar or Settings. Hindi is applied to key navigation, weather, Smart Farm, and profit-calculator labels and guidance; legacy screens without Hindi copy fall back to English.
- Open Settings, fill in the farmer profile, and save it. The details persist in this browser using localStorage; use **Clear saved profile** to remove them.
- Try the sample questions in Advisory Chat. Replies are intentionally static demo guidance, not a live expert or AI service.
- Mandi prices are fetched through the server-side data.gov.in API integration. The Mandi screen compares reported prices and shows a **Smart sell or wait** guide for the selected crop. The guide uses historical reported modal prices only, requires at least three reported dates to infer a direction, and never predicts or guarantees future prices. Soil readings and crop suggestions remain demo data.
- On the Mandi screen, select a crop to see the latest and previous reported average prices, percentage change, recent reported-price history, and a cautious recommendation when enough history is available. If fewer than three reported dates are returned, the screen explains that the history is insufficient.
- Open **Profit calculator**, choose a crop, and enter cultivated area, expected yield per acre, selling price, and estimated costs. Results update as you type; the calculator uses only your entries and labels the figures as estimates.
- Use **Listen / Read Aloud** beside Weather advisories, Smart Farm alerts/recommendations, or valid profit results to hear a summary through the browser's built-in speech synthesis. Available voices depend on the browser and installed language voices.
- Open **Smart Farm** to combine the selected crop and profit estimate with your saved soil profile, Open-Meteo forecast, and matching Mandi records. If no matching price history is loaded, the illustrative market values are clearly marked as demo data; risk levels are general weather indicators, not yield-loss predictions.
- Open **Crop Doctor** from navigation, choose Paddy, Ragi, Tomato, Cotton, Maize, or Chilli, then select the visible symptoms. Results are screening possibilities, not diagnoses; confirm locally before treatment and use only crop- and target-labeled products.
- Open **Schemes & Subsidies** to filter official Indian and Karnataka scheme links by landholding, farmer category, and need. Benefit values may depend on the current season, notification, notified crop/district, and approved costs; confirm eligibility and documents on the linked portal.
- Open **Irrigation planner**, select a crop, soil type, growth stage, and your own soil-moisture observation. Set a location on Weather to see the live rain forecast and the scheduler's rain-aware decision. The water volume is an explicitly illustrative stage-based planning estimate, not a crop-specific prescription or sensor reading; confirm irrigation depth with your local KVK/agriculture officer.
- Open **Crop rotation planner**, select the harvested crop, soil type, and next season to compare three general crop-family rotation candidates. The planner explains the assumptions, nitrogen-fixation caveats, and companion-plant limits; confirm local suitability with your KVK/agriculture officer.
- On the Weather screen, search for a Karnataka location such as **Mysuru**, **Bengaluru**, or **Hubballi**. Select the matching geocoding result to load current conditions and a seven-day forecast from Open-Meteo. The selected location is saved in this browser; use **Change location** to pick another one.
- Weather is fetched from Open-Meteo at `://open-meteo.com`; place names are looked up with `geocoding-://open-meteo.com`. No device location permission is requested and no API key is used. Weather failures display an error instead of demo values. The last-updated time and source are shown with the forecast.
- Use **Refresh weather** to fetch updated conditions. The weather advisory uses only the displayed forecast for general rain, heavy-rain, heat, and wind reminders; it does not prescribe treatments.
- **Offline Caching & WhatsApp Share:** Fetched weather, mandi prices, and advisories are cached in `localStorage` with an online/offline status badge in the header for low-network rural conditions, and key summaries can be shared in one click via WhatsApp.

## Scope

This repository contains the Phase 1 UI prototype with Open-Meteo weather and a server-side data.gov.in mandi integration. It has no authentication or external advisory integration. Profile, cached data, and selected weather location remain in the device and browser where they were entered.
