import { useEffect, useState, type FormEvent } from "react";
import {
  fetchWeatherForecast,
  searchWeatherLocations,
  WeatherServiceError,
  type WeatherForecast,
  type WeatherLocation,
} from "./weatherService";

type Screen = "dashboard" | "weather" | "mandi" | "soil" | "crops" | "advisory" | "settings";
type Language = "en" | "kn";
type FarmerProfile = {
  name: string;
  village: string;
  district: string;
  land: string;
  soil: string;
  irrigation: string;
};
type ChatMessage = { from: "farmer" | "mitra"; text: string };

const PROFILE_KEY = "krishimitra-farmer-profile";
const WEATHER_LOCATION_KEY = "krishimitra-weather-location";

const text = {
  en: {
    dashboard: "Dashboard", weather: "Weather", mandi: "Mandi prices", soil: "Soil profile",
    crops: "Crop suggestions", advisory: "Advisory chat", settings: "Settings",
    greeting: "Good morning", welcome: "Your farm, one step ahead.", demo: "DEMO DATA",
    demoNote: "Sample information for this prototype — not live or location-specific.",
    todayAt: "TODAY AT A GLANCE", weatherCard: "Weather outlook", marketCard: "Market snapshot",
    rainChance: "Chance of rain", humidity: "Humidity", viewWeather: "View weather",
    viewMarket: "Explore prices", yourFarm: "Your farm profile", addFarm: "Add your farm details",
    editProfile: "Edit profile", setupPrompt: "Personalise your suggestions by adding a few farm details.",
    completeProfile: "Set up your profile", quickActions: "Quick actions", askMitra: "Ask KrishiMitra",
    soilCheck: "Check soil guide", cropPlanner: "Explore crop ideas", fieldNote: "A little care today goes a long way.",
    weatherTitle: "Weather outlook", weatherSub: "Search a city, district or village for current conditions and a seven-day forecast.",
    currentConditions: "CURRENT CONDITIONS", feelsLike: "Feels like", wind: "Wind",
    nextDays: "THE NEXT FEW DAYS", dayToday: "Today", dayTomorrow: "Tomorrow", dayNext: "Wednesday",
    sunny: "Sunny", partlyCloudy: "Partly cloudy", lightShower: "Light showers",
    foggy: "Foggy", drizzle: "Drizzle", rainCondition: "Rain", snow: "Snow", thunderstorm: "Thunderstorm",
    dashboardWeatherNote: "Weather is live from Open-Meteo. Mandi prices remain demo data.",
    weatherSource: "OPEN-METEO", live: "LIVE", searchLocation: "Find your location",
    searchPlaceholder: "Search a city, district or village", search: "Search", searching: "Searching…",
    noLocationResults: "No locations found. Try a nearby town or district.",
    selectLocation: "Select the correct location", selectedLocation: "Selected location",
    clearLocation: "Change location", currentTemperature: "Temperature", rainfall: "Rainfall",
    currentRain: "Rain now", todayRainProbability: "Today's rain probability",
    forecastTitle: "Seven-day forecast", high: "High", low: "Low",
    expectedRain: "Expected rain", lastUpdated: "Last updated", dataSource: "Data source",
    refreshWeather: "Refresh weather", refreshing: "Updating…", loadingWeather: "Fetching live weather…",
    chooseWeatherLocation: "Choose a location to see its live weather.",
    noWeatherData: "Weather data is not available right now.",
    weatherSearchHelp: "Search results come from Open-Meteo. Your device location is never requested.",
    farmingAdvisory: "Farming weather advisory", noAdvisories: "No weather-triggered reminders for this forecast.",
    advisoryRain: "Rain is forecast. Check your irrigation requirements.",
    advisoryHeavyRain: "Heavy rainfall is forecast. Check field drainage.",
    advisoryHeat: "High temperatures are forecast. Monitor crop water needs.",
    advisoryWind: "Strong winds are forecast. Check support for vulnerable crops.",
    weatherError: "Weather service error", weatherNetworkError: "Could not connect. Check your internet connection and try again.",
    weatherHttpError: "The weather service is temporarily unavailable. Please try again.",
    weatherApiError: "The weather service could not provide data for this location.",
    weatherInvalidError: "The weather service returned an unexpected response. Please try again.",
    locationSaveError: "Could not save your selected location in this browser.",
    mandiTitle: "Mandi prices", mandiSub: "Sample market board to help you explore the screen.",
    marketBoard: "SAMPLE MARKET BOARD", commodity: "Commodity", market: "Market", price: "Price / quintal",
    change: "Change", sampleTip: "These fictional prices are for demonstration only. Check your local mandi for current rates.",
    soilTitle: "Soil profile", soilSub: "A simple guide to understanding what is beneath your field.",
    soilHealth: "SOIL HEALTH SNAPSHOT", soilType: "Soil type", phLevel: "pH level", organicMatter: "Organic matter",
    nitrogen: "Nitrogen", phosphorus: "Phosphorus", potassium: "Potassium",
    soilTipTitle: "A small soil-care reminder", soilTip: "A soil test from a recognised local lab is the best way to plan nutrients for your own field.",
    cropTitle: "Crop suggestions", cropSub: "Ideas inspired by the sample profile — confirm suitability locally.",
    recommended: "IDEAS TO EXPLORE", season: "Kharif season", duration: "Crop duration", waterNeed: "Water need",
    learnMore: "Why this crop?", cropTip: "Crop ideas are illustrative demo suggestions, not agricultural advice for your location.",
    advisoryTitle: "Ask KrishiMitra", advisorySub: "A friendly place to explore common farming questions.",
    demoChat: "DEMO ADVISORY", chatWelcome: "Namaskara! I’m your demo farming companion. Ask a general question, or choose a prompt below.",
    chatPlaceholder: "Ask a general farming question…", send: "Send", prompts: "TRY A SAMPLE QUESTION",
    reply: "This prototype does not connect to live experts or AI. For decisions about your field, please consult your local agriculture officer or Krishi Vigyan Kendra.",
    settingsTitle: "Settings", settingsSub: "Make KrishiMitra feel more like yours.",
    language: "Language", chooseLanguage: "Choose your preferred language",
    profileSection: "Farmer profile", savedLocally: "Your profile is saved only on this device.",
    clearProfile: "Clear saved profile", about: "About this prototype", aboutCopy: "KrishiMitra started as a Phase 1 UI prototype. Weather now comes from Open-Meteo; mandi prices and other sample screens remain fictional demo data.",
    profileTitle: "Your farmer profile", profileSub: "A few details help make your farming companion feel personal.",
    fullName: "Your name", village: "Village", district: "District", land: "Land size (acres)",
    soilChoice: "Soil type", irrigation: "Irrigation source", chooseOne: "Choose one",
    saveProfile: "Save profile", cancel: "Cancel", saved: "Profile saved on this device.",
    profileMissing: "Add your name, village and district to save your profile.",
    profileCleared: "Saved profile cleared.", storageError: "Could not save your profile in this browser.",
    cropRice: "Paddy", cropRagi: "Ragi", cropMaize: "Maize", cropPulses: "Pulses",
    riceDesc: "A familiar monsoon crop to explore where water is dependable.",
    ragiDesc: "A hardy millet that is often considered in drier growing conditions.",
    maizeDesc: "A versatile crop option; local season and soil guidance matters.",
    pulsesDesc: "A rotation-friendly idea that can support soil diversity.",
    askAbout: "Ask about", saveChanges: "Save changes", profileBadge: "YOUR FARM",
    locationUnset: "Add your location", typeRed: "Red soil", typeBlack: "Black soil",
    typeSandy: "Sandy soil", typeLoamy: "Loamy soil", waterCanal: "Canal", waterBorewell: "Borewell",
    waterRainfed: "Rainfed", waterOther: "Other", clearConfirm: "Clear the farmer profile saved on this device?",
    chartLabel: "Sample rainfall trend", marketItems: "Showing fictional sample prices", noProfile: "No profile saved yet",
    close: "Close", menu: "Open menu", percent: "percent", acres: "acres",
    turDal: "Tur dal", sampleMarket: "Mysuru sample market", nearNeutral: "Near neutral",
    sampleLevel: "Sample level", medium: "Medium", good: "Good", dayUnit: "days",
    waterLowMedium: "Low–medium", waterLow: "Low", waterMedium: "Medium", waterHigh: "High",
  },
  kn: {
    dashboard: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್", weather: "ಹವಾಮಾನ", mandi: "ಮಾರುಕಟ್ಟೆ ದರ", soil: "ಮಣ್ಣಿನ ವಿವರ",
    crops: "ಬೆಳೆ ಸಲಹೆಗಳು", advisory: "ಸಲಹೆ ಚಾಟ್", settings: "ಸೆಟ್ಟಿಂಗ್‌ಗಳು",
    greeting: "ಶುಭೋದಯ", welcome: "ನಿಮ್ಮ ಕೃಷಿ, ಒಂದು ಹೆಜ್ಜೆ ಮುಂದೆ.", demo: "ಡೆಮೋ ಮಾಹಿತಿ",
    demoNote: "ಈ ಮಾದರಿಯ ಮಾಹಿತಿಯು ಪ್ರಾತ್ಯಕ್ಷಿಕೆಗಾಗಿ ಮಾತ್ರ — ನೈಜ ಅಥವಾ ಸ್ಥಳಾಧಾರಿತವಲ್ಲ.",
    todayAt: "ಇಂದಿನ ಮುಖ್ಯಾಂಶಗಳು", weatherCard: "ಹವಾಮಾನ ಮುನ್ಸೂಚನೆ", marketCard: "ಮಾರುಕಟ್ಟೆ ನೋಟ",
    rainChance: "ಮಳೆಯ ಸಾಧ್ಯತೆ", humidity: "ಆರ್ದ್ರತೆ", viewWeather: "ಹವಾಮಾನ ನೋಡಿ",
    viewMarket: "ದರಗಳನ್ನು ನೋಡಿ", yourFarm: "ನಿಮ್ಮ ಕೃಷಿ ಪ್ರೊಫೈಲ್", addFarm: "ನಿಮ್ಮ ಕೃಷಿ ವಿವರ ಸೇರಿಸಿ",
    editProfile: "ಪ್ರೊಫೈಲ್ ತಿದ್ದು", setupPrompt: "ನಿಮ್ಮ ಸಲಹೆಗಳಿಗೆ ಕೆಲವು ಕೃಷಿ ವಿವರಗಳನ್ನು ಸೇರಿಸಿ.",
    completeProfile: "ಪ್ರೊಫೈಲ್ ಸಿದ್ಧಪಡಿಸಿ", quickActions: "ತ್ವರಿತ ಆಯ್ಕೆಗಳು", askMitra: "ಕೃಷಿಮಿತ್ರನನ್ನು ಕೇಳಿ",
    soilCheck: "ಮಣ್ಣಿನ ಮಾರ್ಗದರ್ಶಿ", cropPlanner: "ಬೆಳೆ ಕಲ್ಪನೆಗಳನ್ನು ನೋಡಿ", fieldNote: "ಇಂದಿನ ಚಿಕ್ಕ ಕಾಳಜಿ ನಾಳೆ ಉತ್ತಮ ಫಲ ನೀಡುತ್ತದೆ.",
    weatherTitle: "ಹವಾಮಾನ ಮುನ್ಸೂಚನೆ", weatherSub: "ಪ್ರಸ್ತುತ ಹವಾಮಾನ ಮತ್ತು ಏಳು ದಿನಗಳ ಮುನ್ಸೂಚನೆಗಾಗಿ ನಗರ, ಜಿಲ್ಲೆ ಅಥವಾ ಗ್ರಾಮ ಹುಡುಕಿ.",
    currentConditions: "ಪ್ರಸ್ತುತ ಸ್ಥಿತಿ", feelsLike: "ಅನುಭವದ ತಾಪಮಾನ", wind: "ಗಾಳಿ",
    nextDays: "ಮುಂದಿನ ಕೆಲವು ದಿನಗಳು", dayToday: "ಇಂದು", dayTomorrow: "ನಾಳೆ", dayNext: "ಬುಧವಾರ",
    sunny: "ಬಿಸಿಲು", partlyCloudy: "ಭಾಗಶಃ ಮೋಡ", lightShower: "ಹಗುರ ಮಳೆ",
    foggy: "ಮಂಜು", drizzle: "ತುಂತುರು ಮಳೆ", rainCondition: "ಮಳೆ", snow: "ಹಿಮ", thunderstorm: "ಗುಡುಗು ಸಹಿತ ಮಳೆ",
    dashboardWeatherNote: "ಹವಾಮಾನ Open-Meteo ನಿಂದ ನೈಜವಾಗಿ ಬರುತ್ತದೆ. ಮಾರುಕಟ್ಟೆ ದರಗಳು ಡೆಮೋ ಮಾಹಿತಿಯೇ.",
    weatherSource: "OPEN-METEO", live: "ನೈಜ", searchLocation: "ನಿಮ್ಮ ಸ್ಥಳ ಹುಡುಕಿ",
    searchPlaceholder: "ನಗರ, ಜಿಲ್ಲೆ ಅಥವಾ ಗ್ರಾಮ ಹುಡುಕಿ", search: "ಹುಡುಕಿ", searching: "ಹುಡುಕಲಾಗುತ್ತಿದೆ…",
    noLocationResults: "ಸ್ಥಳಗಳು ಕಂಡುಬಂದಿಲ್ಲ. ಹತ್ತಿರದ ಪಟ್ಟಣ ಅಥವಾ ಜಿಲ್ಲೆಯನ್ನು ಪ್ರಯತ್ನಿಸಿ.",
    selectLocation: "ಸರಿಯಾದ ಸ್ಥಳವನ್ನು ಆಯ್ಕೆಮಾಡಿ", selectedLocation: "ಆಯ್ಕೆ ಮಾಡಿದ ಸ್ಥಳ",
    clearLocation: "ಸ್ಥಳ ಬದಲಿಸಿ", currentTemperature: "ತಾಪಮಾನ", rainfall: "ಮಳೆ ಪ್ರಮಾಣ",
    currentRain: "ಈಗಿನ ಮಳೆ", todayRainProbability: "ಇಂದಿನ ಮಳೆಯ ಸಾಧ್ಯತೆ",
    forecastTitle: "ಏಳು ದಿನಗಳ ಮುನ್ಸೂಚನೆ", high: "ಗರಿಷ್ಠ", low: "ಕನಿಷ್ಠ",
    expectedRain: "ನಿರೀಕ್ಷಿತ ಮಳೆ", lastUpdated: "ಕೊನೆಯ ನವೀಕರಣ", dataSource: "ಮಾಹಿತಿ ಮೂಲ",
    refreshWeather: "ಹವಾಮಾನ ನವೀಕರಿಸಿ", refreshing: "ನವೀಕರಿಸಲಾಗುತ್ತಿದೆ…", loadingWeather: "ನೈಜ ಹವಾಮಾನ ಪಡೆಯಲಾಗುತ್ತಿದೆ…",
    chooseWeatherLocation: "ನೈಜ ಹವಾಮಾನ ನೋಡಲು ಸ್ಥಳ ಆಯ್ಕೆಮಾಡಿ.",
    noWeatherData: "ಈಗ ಹವಾಮಾನ ಮಾಹಿತಿ ಲಭ್ಯವಿಲ್ಲ.",
    weatherSearchHelp: "ಹುಡುಕಾಟ ಫಲಿತಾಂಶಗಳು Open-Meteo ನಿಂದ ಬರುತ್ತವೆ. ನಿಮ್ಮ ಸಾಧನದ ಸ್ಥಳವನ್ನು ಕೇಳುವುದಿಲ್ಲ.",
    farmingAdvisory: "ಕೃಷಿ ಹವಾಮಾನ ಸಲಹೆ", noAdvisories: "ಈ ಮುನ್ಸೂಚನೆಯಲ್ಲಿ ಹವಾಮಾನ ಆಧಾರಿತ ನೆನಪುಗಳಿಲ್ಲ.",
    advisoryRain: "ಮಳೆ ಮುನ್ಸೂಚನೆ ಇದೆ. ನೀರಾವರಿ ಅಗತ್ಯಗಳನ್ನು ಪರಿಶೀಲಿಸಿ.",
    advisoryHeavyRain: "ಭಾರಿ ಮಳೆ ಮುನ್ಸೂಚನೆ ಇದೆ. ಹೊಲದ ಒಳಚರಂಡಿ ಪರಿಶೀಲಿಸಿ.",
    advisoryHeat: "ಹೆಚ್ಚಿನ ತಾಪಮಾನ ಮುನ್ಸೂಚನೆ ಇದೆ. ಬೆಳೆಗಳ ನೀರಿನ ಅಗತ್ಯ ಗಮನಿಸಿ.",
    advisoryWind: "ಬಲವಾದ ಗಾಳಿ ಮುನ್ಸೂಚನೆ ಇದೆ. ದುರ್ಬಲ ಬೆಳೆಗಳ ಆಸರೆ ಪರಿಶೀಲಿಸಿ.",
    weatherError: "ಹವಾಮಾನ ಸೇವೆಯ ದೋಷ", weatherNetworkError: "ಸಂಪರ್ಕ ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ಇಂಟರ್ನೆಟ್ ಪರಿಶೀಲಿಸಿ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
    weatherHttpError: "ಹವಾಮಾನ ಸೇವೆ ತಾತ್ಕಾಲಿಕವಾಗಿ ಲಭ್ಯವಿಲ್ಲ. ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
    weatherApiError: "ಈ ಸ್ಥಳಕ್ಕೆ ಹವಾಮಾನ ಮಾಹಿತಿ ನೀಡಲು ಸೇವೆಗೆ ಸಾಧ್ಯವಾಗಲಿಲ್ಲ.",
    weatherInvalidError: "ಹವಾಮಾನ ಸೇವೆಯಿಂದ ನಿರೀಕ್ಷಿತವಲ್ಲದ ಮಾಹಿತಿ ಬಂದಿದೆ. ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
    locationSaveError: "ಈ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಆಯ್ಕೆ ಮಾಡಿದ ಸ್ಥಳ ಉಳಿಸಲಾಗಲಿಲ್ಲ.",
    mandiTitle: "ಮಾರುಕಟ್ಟೆ ದರಗಳು", mandiSub: "ಪರದೆಯನ್ನು ಪರಿಚಯಿಸಲು ಮಾದರಿ ಮಾರುಕಟ್ಟೆ ಪಟ್ಟಿ.",
    marketBoard: "ಮಾದರಿ ಮಾರುಕಟ್ಟೆ ಪಟ್ಟಿ", commodity: "ಬೆಳೆ", market: "ಮಾರುಕಟ್ಟೆ", price: "ದರ / ಕ್ವಿಂಟಾಲ್",
    change: "ಬದಲಾವಣೆ", sampleTip: "ಈ ಕಾಲ್ಪನಿಕ ದರಗಳು ಪ್ರದರ್ಶನಕ್ಕಾಗಿ ಮಾತ್ರ. ಇಂದಿನ ದರಗಳಿಗಾಗಿ ಸ್ಥಳೀಯ ಮಾರುಕಟ್ಟೆಯನ್ನು ಪರಿಶೀಲಿಸಿ.",
    soilTitle: "ಮಣ್ಣಿನ ವಿವರ", soilSub: "ನಿಮ್ಮ ಹೊಲದ ಮಣ್ಣನ್ನು ಅರ್ಥಮಾಡಿಕೊಳ್ಳಲು ಸರಳ ಮಾರ್ಗದರ್ಶಿ.",
    soilHealth: "ಮಣ್ಣಿನ ಆರೋಗ್ಯ ನೋಟ", soilType: "ಮಣ್ಣಿನ ಪ್ರಕಾರ", phLevel: "ಪಿಎಚ್ ಮಟ್ಟ", organicMatter: "ಸಾವಯವ ಪದಾರ್ಥ",
    nitrogen: "ಸಾರಜನಕ", phosphorus: "ರಂಜಕ", potassium: "ಪೊಟ್ಯಾಸಿಯಂ",
    soilTipTitle: "ಮಣ್ಣಿನ ಆರೈಕೆ ನೆನಪು", soilTip: "ನಿಮ್ಮ ಹೊಲದ ಪೋಷಕಾಂಶ ಯೋಜನೆಗೆ ಸ್ಥಳೀಯ ಮಾನ್ಯ ಪ್ರಯೋಗಾಲಯದ ಮಣ್ಣಿನ ಪರೀಕ್ಷೆಯೇ ಉತ್ತಮ.",
    cropTitle: "ಬೆಳೆ ಸಲಹೆಗಳು", cropSub: "ಮಾದರಿ ಪ್ರೊಫೈಲ್ ಆಧಾರಿತ ಕಲ್ಪನೆಗಳು — ಸ್ಥಳೀಯವಾಗಿ ಸೂಕ್ತತೆ ಪರಿಶೀಲಿಸಿ.",
    recommended: "ಪರಿಶೀಲಿಸಬಹುದಾದ ಕಲ್ಪನೆಗಳು", season: "ಖರೀಫ್ ಹಂಗಾಮು", duration: "ಬೆಳೆ ಅವಧಿ", waterNeed: "ನೀರಿನ ಅಗತ್ಯ",
    learnMore: "ಈ ಬೆಳೆ ಏಕೆ?", cropTip: "ಬೆಳೆ ಕಲ್ಪನೆಗಳು ಉದಾಹರಣೆಯ ಡೆಮೋ ಸಲಹೆಗಳು ಮಾತ್ರ; ನಿಮ್ಮ ಪ್ರದೇಶದ ಕೃಷಿ ಸಲಹೆಯಲ್ಲ.",
    advisoryTitle: "ಕೃಷಿಮಿತ್ರನನ್ನು ಕೇಳಿ", advisorySub: "ಸಾಮಾನ್ಯ ಕೃಷಿ ಪ್ರಶ್ನೆಗಳನ್ನು ತಿಳಿಯಲು ಸ್ನೇಹಪರ ಸ್ಥಳ.",
    demoChat: "ಡೆಮೋ ಸಲಹೆ", chatWelcome: "ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ ಡೆಮೋ ಕೃಷಿ ಸಂಗಾತಿ. ಸಾಮಾನ್ಯ ಪ್ರಶ್ನೆ ಕೇಳಿ ಅಥವಾ ಕೆಳಗಿನ ವಿಷಯ ಆಯ್ಕೆಮಾಡಿ.",
    chatPlaceholder: "ಸಾಮಾನ್ಯ ಕೃಷಿ ಪ್ರಶ್ನೆ ಕೇಳಿ…", send: "ಕಳುಹಿಸಿ", prompts: "ಮಾದರಿ ಪ್ರಶ್ನೆ ಪ್ರಯತ್ನಿಸಿ",
    reply: "ಈ ಮಾದರಿಯು ನೈಜ ತಜ್ಞರು ಅಥವಾ AI ಜೊತೆ ಸಂಪರ್ಕ ಹೊಂದಿಲ್ಲ. ನಿಮ್ಮ ಹೊಲದ ನಿರ್ಧಾರಗಳಿಗೆ ಸ್ಥಳೀಯ ಕೃಷಿ ಅಧಿಕಾರಿ ಅಥವಾ ಕೃಷಿ ವಿಜ್ಞಾನ ಕೇಂದ್ರವನ್ನು ಸಂಪರ್ಕಿಸಿ.",
    settingsTitle: "ಸೆಟ್ಟಿಂಗ್‌ಗಳು", settingsSub: "ಕೃಷಿಮಿತ್ರವನ್ನು ನಿಮ್ಮದಾಗಿಸಿಕೊಳ್ಳಿ.",
    language: "ಭಾಷೆ", chooseLanguage: "ನಿಮ್ಮ ಆದ್ಯತೆಯ ಭಾಷೆ ಆಯ್ಕೆಮಾಡಿ",
    profileSection: "ರೈತರ ಪ್ರೊಫೈಲ್", savedLocally: "ನಿಮ್ಮ ಪ್ರೊಫೈಲ್ ಈ ಸಾಧನದಲ್ಲಿ ಮಾತ್ರ ಉಳಿಯುತ್ತದೆ.",
    clearProfile: "ಉಳಿಸಿದ ಪ್ರೊಫೈಲ್ ಅಳಿಸಿ", about: "ಈ ಮಾದರಿಯ ಬಗ್ಗೆ", aboutCopy: "ಕೃಷಿಮಿತ್ರ ಮೊದಲ ಹಂತದ UI ಮಾದರಿಯಾಗಿ ಪ್ರಾರಂಭವಾಯಿತು. ಹವಾಮಾನ Open-Meteo ನಿಂದ ಬರುತ್ತದೆ; ಮಾರುಕಟ್ಟೆ ದರಗಳು ಮತ್ತು ಇತರ ಮಾದರಿ ಪರದೆಗಳು ಕಾಲ್ಪನಿಕ ಡೆಮೋ ಮಾಹಿತಿಯೇ.",
    profileTitle: "ನಿಮ್ಮ ರೈತ ಪ್ರೊಫೈಲ್", profileSub: "ಕೆಲವು ವಿವರಗಳು ನಿಮ್ಮ ಕೃಷಿ ಸಂಗಾತಿಯನ್ನು ವೈಯಕ್ತಿಕಗೊಳಿಸುತ್ತವೆ.",
    fullName: "ನಿಮ್ಮ ಹೆಸರು", village: "ಗ್ರಾಮ", district: "ಜಿಲ್ಲೆ", land: "ಭೂಮಿ (ಎಕರೆ)",
    soilChoice: "ಮಣ್ಣಿನ ಪ್ರಕಾರ", irrigation: "ನೀರಾವರಿ ಮೂಲ", chooseOne: "ಒಂದನ್ನು ಆಯ್ಕೆಮಾಡಿ",
    saveProfile: "ಪ್ರೊಫೈಲ್ ಉಳಿಸಿ", cancel: "ರದ್ದುಮಾಡಿ", saved: "ಈ ಸಾಧನದಲ್ಲಿ ಪ್ರೊಫೈಲ್ ಉಳಿಸಲಾಗಿದೆ.",
    profileMissing: "ಉಳಿಸಲು ನಿಮ್ಮ ಹೆಸರು, ಗ್ರಾಮ ಮತ್ತು ಜಿಲ್ಲೆ ಸೇರಿಸಿ.",
    profileCleared: "ಉಳಿಸಿದ ಪ್ರೊಫೈಲ್ ಅಳಿಸಲಾಗಿದೆ.", storageError: "ಈ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಪ್ರೊಫೈಲ್ ಉಳಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ.",
    cropRice: "ಭತ್ತ", cropRagi: "ರಾಗಿ", cropMaize: "ಮೆಕ್ಕೆಜೋಳ", cropPulses: "ಬೇಳೆಕಾಳು",
    riceDesc: "ನೀರಿನ ಲಭ್ಯತೆ ಇರುವ ಪ್ರದೇಶಗಳಿಗೆ ಪರಿಚಿತ ಮುಂಗಾರು ಬೆಳೆ.",
    ragiDesc: "ಕಡಿಮೆ ಮಳೆಯ ಪರಿಸ್ಥಿತಿಯಲ್ಲಿ ಪರಿಗಣಿಸುವ ಗಟ್ಟಿಮುಟ್ಟಾದ ಸಿರಿಧಾನ್ಯ.",
    maizeDesc: "ಬಹುಮುಖ ಬೆಳೆ ಆಯ್ಕೆ; ಸ್ಥಳೀಯ ಹಂಗಾಮು ಮತ್ತು ಮಣ್ಣಿನ ಸಲಹೆ ಮುಖ್ಯ.",
    pulsesDesc: "ಮಣ್ಣಿನ ವೈವಿಧ್ಯಕ್ಕೆ ನೆರವಾಗುವ ಬೆಳೆ ಪರಿವರ್ತನೆ ಕಲ್ಪನೆ.",
    askAbout: "ಇದರ ಬಗ್ಗೆ ಕೇಳಿ", saveChanges: "ಬದಲಾವಣೆ ಉಳಿಸಿ", profileBadge: "ನಿಮ್ಮ ಹೊಲ",
    locationUnset: "ಸ್ಥಳ ಸೇರಿಸಿ", typeRed: "ಕೆಂಪು ಮಣ್ಣು", typeBlack: "ಕಪ್ಪು ಮಣ್ಣು",
    typeSandy: "ಮರಳು ಮಣ್ಣು", typeLoamy: "ಲೋಮಿ ಮಣ್ಣು", waterCanal: "ಕಾಲುವೆ", waterBorewell: "ಬೋರ್‌ವೆಲ್",
    waterRainfed: "ಮಳೆ ಆಧಾರಿತ", waterOther: "ಇತರೆ", clearConfirm: "ಈ ಸಾಧನದಲ್ಲಿ ಉಳಿಸಿದ ರೈತರ ಪ್ರೊಫೈಲ್ ಅಳಿಸಬೇಕೆ?",
    chartLabel: "ಮಾದರಿ ಮಳೆಯ ಪ್ರವೃತ್ತಿ", marketItems: "ಕಾಲ್ಪನಿಕ ಮಾದರಿ ದರಗಳು", noProfile: "ಇನ್ನೂ ಪ್ರೊಫೈಲ್ ಉಳಿಸಿಲ್ಲ",
    close: "ಮುಚ್ಚಿ", menu: "ಮೆನು ತೆರೆಯಿರಿ", percent: "ಶೇಕಡಾ", acres: "ಎಕರೆ",
    turDal: "ತೊಗರಿ ಬೇಳೆ", sampleMarket: "ಮೈಸೂರು ಮಾದರಿ ಮಾರುಕಟ್ಟೆ", nearNeutral: "ತಟಸ್ಥದ ಹತ್ತಿರ",
    sampleLevel: "ಮಾದರಿ ಮಟ್ಟ", medium: "ಮಧ್ಯಮ", good: "ಉತ್ತಮ", dayUnit: "ದಿನಗಳು",
    waterLowMedium: "ಕಡಿಮೆ–ಮಧ್ಯಮ", waterLow: "ಕಡಿಮೆ", waterMedium: "ಮಧ್ಯಮ", waterHigh: "ಹೆಚ್ಚು",
  },
} as const;

const navItems: { id: Screen; icon: string; key: keyof typeof text.en }[] = [
  { id: "dashboard", icon: "⌂", key: "dashboard" },
  { id: "weather", icon: "☼", key: "weather" },
  { id: "mandi", icon: "↗", key: "mandi" },
  { id: "soil", icon: "◉", key: "soil" },
  { id: "crops", icon: "❋", key: "crops" },
  { id: "advisory", icon: "✳", key: "advisory" },
  { id: "settings", icon: "⚙", key: "settings" },
];

const samplePrices = [
  { crop: "Paddy", market: "Mysuru", price: "₹2,180", change: "+2.4%", up: true },
  { crop: "Ragi", market: "Mandya", price: "₹3,450", change: "+1.2%", up: true },
  { crop: "Maize", market: "Hassan", price: "₹2,060", change: "−0.8%", up: false },
  { crop: "Tur dal", market: "Kalaburagi", price: "₹7,200", change: "+0.5%", up: true },
];

function readSavedWeatherLocation(): WeatherLocation | null {
  try {
    const saved = localStorage.getItem(WEATHER_LOCATION_KEY);
    if (!saved) return null;
    const value: unknown = JSON.parse(saved);
    if (
      !value ||
      typeof value !== "object" ||
      !("id" in value) ||
      !("name" in value) ||
      !("country" in value) ||
      !("latitude" in value) ||
      !("longitude" in value) ||
      typeof value.id !== "string" ||
      typeof value.name !== "string" ||
      typeof value.country !== "string" ||
      typeof value.latitude !== "number" ||
      typeof value.longitude !== "number"
    ) {
      throw new Error("Saved weather location has an invalid format.");
    }
    return {
      id: value.id,
      name: value.name,
      country: value.country,
      latitude: value.latitude,
      longitude: value.longitude,
      admin1: "admin1" in value && typeof value.admin1 === "string" ? value.admin1 : null,
      admin2: "admin2" in value && typeof value.admin2 === "string" ? value.admin2 : null,
    };
  } catch (error) {
    console.error("Could not read the saved weather location.", error);
    return null;
  }
}

function App() {
  const [language, setLanguage] = useState<Language>("en");
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [profile, setProfile] = useState<FarmerProfile | null>(() => {
    try {
      const saved = localStorage.getItem(PROFILE_KEY);
      return saved ? (JSON.parse(saved) as FarmerProfile) : null;
    } catch (error) {
      console.error("Could not read the saved farmer profile.", error);
      return null;
    }
  });
  const [notice, setNotice] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [mobileMore, setMobileMore] = useState(false);
  const [weatherLocation, setWeatherLocation] = useState<WeatherLocation | null>(readSavedWeatherLocation);
  const [weatherForecast, setWeatherForecast] = useState<WeatherForecast | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState("");
  const [weatherUpdatedAt, setWeatherUpdatedAt] = useState<Date | null>(null);
  const [weatherRefresh, setWeatherRefresh] = useState(0);
  const t = (key: keyof typeof text.en) => text[language][key];

  useEffect(() => {
    if (weatherLocation === null) {
      setWeatherForecast(null);
      setWeatherLoading(false);
      setWeatherError("");
      setWeatherUpdatedAt(null);
      return;
    }

    const selectedLocation = weatherLocation;
    const controller = new AbortController();
    async function loadWeather() {
      setWeatherLoading(true);
      setWeatherError("");
      try {
        const forecast = await fetchWeatherForecast(selectedLocation, controller.signal);
        setWeatherForecast(forecast);
        setWeatherUpdatedAt(new Date());
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("Could not fetch Open-Meteo weather.", error);
        setWeatherError(error instanceof WeatherServiceError ? error.message : "invalid-response");
      } finally {
        if (!controller.signal.aborted) setWeatherLoading(false);
      }
    }
    void loadWeather();
    return () => controller.abort();
  }, [weatherLocation, weatherRefresh]);

  function navigate(next: Screen) {
    setScreen(next);
    setMobileMore(false);
    setNotice("");
  }

  function chooseWeatherLocation(location: WeatherLocation) {
    setWeatherForecast(null);
    setWeatherUpdatedAt(null);
    setWeatherLocation(location);
    try {
      localStorage.setItem(WEATHER_LOCATION_KEY, JSON.stringify(location));
    } catch (error) {
      console.error("Could not save the selected weather location.", error);
      setNotice(t("locationSaveError"));
    }
  }

  function clearWeatherLocation() {
    setWeatherLocation(null);
    setWeatherForecast(null);
    setWeatherUpdatedAt(null);
    try {
      localStorage.removeItem(WEATHER_LOCATION_KEY);
    } catch (error) {
      console.error("Could not clear the selected weather location.", error);
      setNotice(t("locationSaveError"));
    }
  }

  function saveProfile(next: FarmerProfile): boolean {
    if (!next.name.trim() || !next.village.trim() || !next.district.trim()) {
      setNotice(t("profileMissing"));
      return false;
    }
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(next));
      setProfile(next);
      setNotice(t("saved"));
      return true;
    } catch (error) {
      console.error("Could not save the farmer profile.", error);
      setNotice(t("storageError"));
      return false;
    }
  }

  function clearProfile() {
    if (!window.confirm(t("clearConfirm"))) return;
    try {
      localStorage.removeItem(PROFILE_KEY);
      setProfile(null);
      setNotice(t("profileCleared"));
    } catch (error) {
      console.error("Could not clear the farmer profile.", error);
      setNotice(t("storageError"));
    }
  }

  function sendMessage(message = chatInput) {
    const trimmed = message.trim();
    if (!trimmed) return;
    setChatMessages((current) => [...current, { from: "farmer", text: trimmed }, { from: "mitra", text: t("reply") }]);
    setChatInput("");
  }

  const headerTitle = t(navItems.find((item) => item.id === screen)?.key ?? "dashboard");

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button className="brand" onClick={() => navigate("dashboard")} aria-label="KrishiMitra home">
          <span className="brand-mark">K<span>✳</span></span>
          <span><strong>KrishiMitra</strong><small>GROW WITH CONFIDENCE</small></span>
        </button>
        <div className="side-label">{language === "en" ? "YOUR SPACE" : "ನಿಮ್ಮ ಸ್ಥಳ"}</div>
        <nav className="side-nav" aria-label="Main navigation">
          {navItems.map((item) => (
            <button key={item.id} className={`nav-item ${screen === item.id ? "active" : ""}`} onClick={() => navigate(item.id)}>
              <span className="nav-icon">{item.icon}</span><span>{t(item.key)}</span>
              {screen === item.id && <span className="active-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="season-card"><span className="season-icon">☀</span><div><strong>{language === "en" ? "A fresh season" : "ಹೊಸ ಹಂಗಾಮು"}</strong><small>{language === "en" ? "Small steps, good harvests." : "ಸಣ್ಣ ಹೆಜ್ಜೆ, ಉತ್ತಮ ಫಸಲು."}</small></div></div>
          <span className="version">KRISHIMITRA · PHASE 1</span>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="mobile-brand"><span className="brand-mark">K<span>✳</span></span><strong>KrishiMitra</strong></div>
          <div className="breadcrumb"><span>{language === "en" ? "YOUR FARM" : "ನಿಮ್ಮ ಹೊಲ"}</span><b>/</b>{headerTitle}</div>
          <div className="top-actions">
            <span className="offline-pill"><i /> {language === "en" ? "Prototype" : "ಮಾದರಿ"}</span>
            <button className="language-toggle" onClick={() => setLanguage(language === "en" ? "kn" : "en")} aria-label="Switch language">
              <span className={language === "en" ? "selected" : ""}>EN</span><span className={language === "kn" ? "selected" : ""}>ಕನ್ನಡ</span>
            </button>
            <button className="avatar-button" onClick={() => navigate("settings")} aria-label={t("settings")}>
              {profile?.name ? profile.name.charAt(0).toUpperCase() : "☺"}
            </button>
          </div>
        </header>

        <div className="page-content">
          {notice && <div className="toast" role="status"><span>✓</span>{notice}<button onClick={() => setNotice("")} aria-label={t("close")}>×</button></div>}
          {screen === "dashboard" && <Dashboard t={t} profile={profile} navigate={navigate} weatherLocation={weatherLocation} weatherForecast={weatherForecast} weatherLoading={weatherLoading} />}
          {screen === "weather" && <Weather t={t} language={language} location={weatherLocation} forecast={weatherForecast} loading={weatherLoading} error={weatherError} updatedAt={weatherUpdatedAt} onSelectLocation={chooseWeatherLocation} onClearLocation={clearWeatherLocation} onRefresh={() => setWeatherRefresh((count) => count + 1)} />}
          {screen === "mandi" && <Mandi t={t} />}
          {screen === "soil" && <Soil t={t} profile={profile} />}
          {screen === "crops" && <Crops t={t} navigate={navigate} />}
          {screen === "advisory" && <Advisory t={t} messages={chatMessages} input={chatInput} setInput={setChatInput} send={sendMessage} />}
          {screen === "settings" && <Settings t={t} language={language} setLanguage={setLanguage} profile={profile} clearProfile={clearProfile} navigate={navigate} />}
          {screen === "settings" && <ProfileForm t={t} profile={profile} saveProfile={saveProfile} />}
        </div>
        <footer className="page-footer"><span>© 2026 KrishiMitra</span><span>{t("dashboardWeatherNote")}</span></footer>
      </main>

      <nav className="mobile-nav" aria-label="Mobile navigation">
        {navItems.slice(0, 4).map((item) => (
          <button key={item.id} className={screen === item.id ? "selected" : ""} onClick={() => navigate(item.id)}>
            <span>{item.icon}</span><small>{t(item.key)}</small>
          </button>
        ))}
        <button className={mobileMore || navItems.slice(4).some((item) => item.id === screen) ? "selected" : ""} onClick={() => setMobileMore((open) => !open)}>
          <span>•••</span><small>{language === "en" ? "More" : "ಇನ್ನಷ್ಟು"}</small>
        </button>
        {mobileMore && <div className="mobile-more-menu">
          {navItems.slice(4).map((item) => <button key={item.id} onClick={() => navigate(item.id)}><span>{item.icon}</span>{t(item.key)}</button>)}
        </div>}
      </nav>
    </div>
  );
}

type Translate = (key: keyof typeof text.en) => string;
type PageProps = { t: Translate };

function PageHeading({ eyebrow, title, description, t, badge = t("demo"), badgeKind = "demo" }: PageProps & { eyebrow: string; title: string; description: string; badge?: string; badgeKind?: "demo" | "source" }) {
  return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div><span className={`demo-badge ${badgeKind === "source" ? "source-badge" : ""}`}><i />{badge}</span></div>;
}

function Dashboard({ t, profile, navigate, weatherLocation, weatherForecast, weatherLoading }: PageProps & {
  profile: FarmerProfile | null;
  navigate: (screen: Screen) => void;
  weatherLocation: WeatherLocation | null;
  weatherForecast: WeatherForecast | null;
  weatherLoading: boolean;
}) {
  return (
    <>
      <section className="welcome-row">
        <div><div className="eyebrow">{t("greeting")}{profile ? `, ${profile.name.split(" ")[0]}` : ""} <span className="sun-small">☀</span></div><h1>{t("welcome")}</h1><p>{profile ? `${profile.village}, ${profile.district}` : t("setupPrompt")}</p></div>
        <div className="welcome-art" aria-hidden="true"><span className="art-sun" /><span className="art-hill hill-one" /><span className="art-hill hill-two" /><span className="art-leaf">✳</span></div>
      </section>
      <div className="section-title"><div><h2>{t("todayAt")}</h2><p>{t("dashboardWeatherNote")}</p></div></div>
      <div className="overview-grid">
        <article className="overview-card weather-overview">
          <div className="card-topline"><span>{t("weatherCard")}</span>{weatherForecast ? <span className="live-tag"><i />{t("live")}</span> : <span className="weather-icon">☼</span>}</div>
          {weatherForecast ? <>
            <div className="temperature">{weatherForecast.current.temperature ?? "—"}<small>°C</small></div>
            <div className="condition">{weatherIcon(weatherForecast.current.weatherCode)} &nbsp;{weatherCondition(weatherForecast.current.weatherCode, t)} · {weatherLocation?.name}</div>
            <div className="mini-stats"><span>☂ {t("rainChance")} <b>{weatherForecast.daily[0]?.precipitationProbability ?? "—"}%</b></span><span>◌ {t("humidity")} <b>{weatherForecast.current.relativeHumidity ?? "—"}%</b></span></div>
          </> : weatherLoading ? <div className="dashboard-weather-empty"><span className="spinner" />{t("loadingWeather")}</div> : <div className="dashboard-weather-empty">{weatherLocation ? t("noWeatherData") : t("chooseWeatherLocation")}</div>}
          <button className="text-link" onClick={() => navigate("weather")}>{t("viewWeather")} <span>→</span></button>
        </article>
        <article className="overview-card market-overview">
          <div className="card-topline"><span>{t("marketCard")}</span><span className="demo-badge mini-demo"><i />{t("demo")}</span></div>
          <div className="market-crop">{t("cropRice")} <span className="change-up">+2.4%</span></div><div className="market-price">₹2,180 <small>/ quintal</small></div>
          <div className="market-location">{t("sampleMarket")}</div>
          <div className="market-spark" aria-label={t("marketItems")}><span /><span /><span /><span /><span /><span /><span /><span /></div>
          <button className="text-link" onClick={() => navigate("mandi")}>{t("viewMarket")} <span>→</span></button>
        </article>
      </div>
      <div className="dashboard-lower">
        <section className="panel farm-panel">
          <div className="panel-heading"><div><div className="eyebrow">{t("profileBadge")}</div><h2>{t("yourFarm")}</h2></div><span className="profile-illustration">♧</span></div>
          {profile ? <><div className="farm-details"><div><span>{t("village")}</span><strong>{profile.village}</strong></div><div><span>{t("district")}</span><strong>{profile.district}</strong></div><div><span>{t("land")}</span><strong>{profile.land || "—"} {t("acres")}</strong></div></div><button className="button button-outline" onClick={() => navigate("settings")}>{t("editProfile")} <span>→</span></button></> :
            <><p className="panel-copy">{t("setupPrompt")}</p><button className="button button-primary" onClick={() => navigate("settings")}>{t("completeProfile")} <span>→</span></button></>}
        </section>
        <section className="panel actions-panel">
          <div className="panel-heading"><div><div className="eyebrow">{languageOf(t) === "en" ? "HERE TO HELP" : "ನಿಮ್ಮ ನೆರವಿಗೆ"}</div><h2>{t("quickActions")}</h2></div><span className="action-spark">✳</span></div>
          <div className="quick-actions">
            <button onClick={() => navigate("advisory")}><span className="action-icon chat-icon">✳</span><span><strong>{t("askMitra")}</strong><small>{languageOf(t) === "en" ? "A question on your mind?" : "ನಿಮ್ಮ ಪ್ರಶ್ನೆ ಕೇಳಿ"}</small></span><b>→</b></button>
            <button onClick={() => navigate("soil")}><span className="action-icon soil-icon">◉</span><span><strong>{t("soilCheck")}</strong><small>{languageOf(t) === "en" ? "Know your soil better" : "ನಿಮ್ಮ ಮಣ್ಣನ್ನು ತಿಳಿಯಿರಿ"}</small></span><b>→</b></button>
            <button onClick={() => navigate("crops")}><span className="action-icon crop-icon">❋</span><span><strong>{t("cropPlanner")}</strong><small>{languageOf(t) === "en" ? "Ideas for the season" : "ಈ ಹಂಗಾಮಿನ ಕಲ್ಪನೆಗಳು"}</small></span><b>→</b></button>
          </div>
        </section>
      </div>
      <div className="field-note"><span>✿</span><p>{t("fieldNote")}</p><span className="note-sun">☀</span></div>
    </>
  );
}

function languageOf(t: Translate) { return t("dashboard") === "Dashboard" ? "en" : "kn"; }

function weatherConditionKey(code: number | null): keyof typeof text.en {
  if (code === 0 || code === 1) return "sunny";
  if (code === 2 || code === 3) return "partlyCloudy";
  if (code === 45 || code === 48) return "foggy";
  if ([51, 53, 55, 56, 57].includes(code ?? -1)) return "drizzle";
  if ([61, 63, 65, 66, 67].includes(code ?? -1)) return "rainCondition";
  if ([71, 73, 75, 77, 85, 86].includes(code ?? -1)) return "snow";
  if ([80, 81, 82].includes(code ?? -1)) return "lightShower";
  if ([95, 96, 99].includes(code ?? -1)) return "thunderstorm";
  return "partlyCloudy";
}

function weatherCondition(code: number | null, t: Translate) {
  return t(weatherConditionKey(code));
}

function weatherIcon(code: number | null) {
  if (code === 0 || code === 1) return "☀";
  if (code === 2 || code === 3) return "⛅";
  if (code === 45 || code === 48) return "≋";
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code ?? -1)) return "☂";
  if ([71, 73, 75, 77, 85, 86].includes(code ?? -1)) return "❄";
  if ([95, 96, 99].includes(code ?? -1)) return "⚡";
  return "⛅";
}

function locationLabel(location: WeatherLocation) {
  return [location.name, location.admin2, location.admin1, location.country]
    .filter((part, index, parts): part is string => Boolean(part) && parts.indexOf(part) === index)
    .join(", ");
}

function weatherErrorMessage(error: string, t: Translate) {
  const key = error === "network" ? "weatherNetworkError"
    : error === "http" ? "weatherHttpError"
      : error === "api" ? "weatherApiError"
        : "weatherInvalidError";
  return t(key);
}

function weatherAdvisories(forecast: WeatherForecast, t: Translate) {
  const advisories: string[] = [];
  const rainyDays = forecast.daily.filter((day) =>
    (day.precipitation ?? 0) > 0 || (day.precipitationProbability ?? 0) >= 30);
  if (rainyDays.length) advisories.push(t("advisoryRain"));
  if (forecast.daily.some((day) => (day.precipitation ?? 0) >= 20)) advisories.push(t("advisoryHeavyRain"));
  if (forecast.daily.some((day) => (day.temperatureMax ?? 0) >= 35)) advisories.push(t("advisoryHeat"));
  if ((forecast.current.windSpeed ?? 0) >= 35) advisories.push(t("advisoryWind"));
  return advisories;
}

function Weather({ t, language, location, forecast, loading, error, updatedAt, onSelectLocation, onClearLocation, onRefresh }: PageProps & {
  language: Language;
  location: WeatherLocation | null;
  forecast: WeatherForecast | null;
  loading: boolean;
  error: string;
  updatedAt: Date | null;
  onSelectLocation: (location: WeatherLocation) => void;
  onClearLocation: () => void;
  onRefresh: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<WeatherLocation[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [searched, setSearched] = useState(false);

  async function searchLocations(event: FormEvent) {
    event.preventDefault();
    const trimmedQuery = query.trim();
    if (trimmedQuery.length < 2) return;
    setSearching(true);
    setSearchError("");
    setResults([]);
    setSearched(false);
    try {
      const locations = await searchWeatherLocations(trimmedQuery);
      setResults(locations);
      setSearched(true);
    } catch (caught) {
      console.error("Could not search Open-Meteo locations.", caught);
      setSearchError(caught instanceof WeatherServiceError ? caught.message : "invalid-response");
    } finally {
      setSearching(false);
    }
  }

  const advisories = forecast ? weatherAdvisories(forecast, t) : [];
  const locale = language === "en" ? "en-IN" : "kn-IN";
  const updatedLabel = updatedAt ? updatedAt.toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" }) : "";

  return <>
    <PageHeading eyebrow={t("currentConditions")} title={t("weatherTitle")} description={t("weatherSub")} t={t} badge={t("weatherSource")} badgeKind="source" />
    <section className="weather-location-panel panel">
      <form className="weather-search" onSubmit={(event) => void searchLocations(event)}>
        <label htmlFor="weather-location-search">{t("searchLocation")}</label>
        <div className="weather-search-row">
          <span aria-hidden="true">⌕</span>
          <input id="weather-location-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("searchPlaceholder")} minLength={2} required />
          <button type="submit" className="button button-primary" disabled={searching || query.trim().length < 2}>
            {searching ? <><span className="spinner light" />{t("searching")}</> : t("search")}
          </button>
        </div>
      </form>
      <p className="weather-search-help">ⓘ &nbsp;{t("weatherSearchHelp")}</p>
      {searching && <div className="weather-status" role="status"><span className="spinner" />{t("searching")}</div>}
      {searchError && <div className="weather-alert" role="alert">{weatherErrorMessage(searchError, t)}</div>}
      {searched && results.length === 0 && <div className="weather-empty-results">{t("noLocationResults")}</div>}
      {results.length > 0 && <div className="location-results" aria-label={t("selectLocation")}><strong>{t("selectLocation")}</strong>{results.map((result) =>
        <button type="button" className="location-result" key={result.id} onClick={() => { onSelectLocation(result); setResults([]); setSearched(false); }}>
          <span className="result-pin">⌖</span><span>{locationLabel(result)}</span><b>→</b>
        </button>)}</div>}
      {location && <div className="selected-location"><span className="location-pin">⌖</span><div><small>{t("selectedLocation")}</small><strong>{locationLabel(location)}</strong></div><button type="button" onClick={onClearLocation}>{t("clearLocation")}</button></div>}
    </section>

    {error && <div className="weather-alert weather-fetch-alert" role="alert"><strong>{t("weatherError")}</strong><span>{weatherErrorMessage(error, t)}</span></div>}
    {!location && <div className="weather-empty panel"><span>⌖</span><h2>{t("chooseWeatherLocation")}</h2><p>{t("weatherSearchHelp")}</p></div>}
    {location && loading && !forecast && <div className="weather-loading panel" role="status"><span className="spinner" /><strong>{t("loadingWeather")}</strong></div>}
    {location && !forecast && !loading && !error && <div className="weather-empty panel"><span>☁</span><h2>{t("noWeatherData")}</h2><button className="button button-outline" onClick={onRefresh}>{t("refreshWeather")}</button></div>}
    {forecast && location && <>
      <section className="weather-live-hero">
        <div className="weather-live-main">
          <div className="weather-live-location"><span>⌖</span>{location.name}, {location.admin1 ?? location.country}<span className="live-tag"><i />{t("live")}</span></div>
          <div className="live-temperature">{forecast.current.temperature ?? "—"}<span>°C</span></div>
          <div className="live-condition"><span>{weatherIcon(forecast.current.weatherCode)}</span>{weatherCondition(forecast.current.weatherCode, t)}</div>
          <p>{t("currentConditions")} · {forecast.current.time.replace("T", " ")}</p>
        </div>
        <div className="weather-live-scene" aria-hidden="true"><span className="live-sun" /><span className="live-cloud live-cloud-one" /><span className="live-cloud live-cloud-two" /><span className="live-hill live-hill-one" /><span className="live-hill live-hill-two" /></div>
        <div className="weather-live-facts">
          <div><span>◌</span><small>{t("humidity")}</small><strong>{forecast.current.relativeHumidity ?? "—"}%</strong></div>
          <div><span>☂</span><small>{t("rainfall")}</small><strong>{forecast.current.precipitation ?? "—"} mm</strong><em>{t("currentRain")}: {forecast.current.rain ?? "—"} mm</em></div>
          <div><span>☁</span><small>{t("todayRainProbability")}</small><strong>{forecast.daily[0]?.precipitationProbability ?? "—"}%</strong></div>
          <div><span>≋</span><small>{t("wind")}</small><strong>{forecast.current.windSpeed ?? "—"} km/h</strong></div>
        </div>
      </section>
      <div className="weather-data-meta"><span>{t("dataSource")}: <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo</a> · {forecast.timezone}</span><span>{t("lastUpdated")}: {updatedLabel}</span><button className="button button-outline" onClick={onRefresh} disabled={loading}>{loading ? <><span className="spinner" />{t("refreshing")}</> : <>↻ &nbsp;{t("refreshWeather")}</>}</button></div>
      {loading && <div className="weather-refresh-status" role="status"><span className="spinner" />{t("refreshing")}</div>}
      <section className="panel forecast-panel live-forecast-panel">
        <div className="panel-heading"><div><div className="eyebrow">{location.name}</div><h2>{t("forecastTitle")}</h2></div><span className="live-tag"><i />{t("live")}</span></div>
        <div className="seven-day-grid">{forecast.daily.map((day) => {
          const date = new Date(`${day.date}T12:00:00`);
          const dateLabel = date.toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "short" });
          return <article className="forecast-card" key={day.date}>
            <strong className="forecast-date">{dateLabel}</strong>
            <span className="forecast-weather-icon" aria-label={weatherCondition(day.weatherCode, t)}>{weatherIcon(day.weatherCode)}</span>
            <span className="forecast-condition">{weatherCondition(day.weatherCode, t)}</span>
            <div className="forecast-temperatures"><b>{t("high")} {day.temperatureMax ?? "—"}°</b><span>{t("low")} {day.temperatureMin ?? "—"}°</span></div>
            <div className="forecast-rain"><span>☂ {day.precipitationProbability ?? "—"}%</span><span>{day.precipitation ?? "—"} mm</span></div>
          </article>;
        })}</div>
      </section>
      <section className="panel farming-advisory">
        <div className="advisory-heading"><span>✿</span><div><div className="eyebrow">{t("weatherSource")}</div><h2>{t("farmingAdvisory")}</h2></div></div>
        {advisories.length
          ? <ul>{advisories.map((advisory) => <li key={advisory}><span>✓</span>{advisory}</li>)}</ul>
          : <p>{t("noAdvisories")}</p>}
      </section>
    </>}
  </>;
}

function Mandi({ t }: PageProps) {
  const cropNames: Record<string, string> = { Paddy: t("cropRice"), Ragi: t("cropRagi"), Maize: t("cropMaize"), "Tur dal": t("turDal") };
  const marketNames: Record<string, string> = languageOf(t) === "en"
    ? { Mysuru: "Mysuru", Mandya: "Mandya", Hassan: "Hassan", Kalaburagi: "Kalaburagi" }
    : { Mysuru: "ಮೈಸೂರು", Mandya: "ಮಂಡ್ಯ", Hassan: "ಹಾಸನ", Kalaburagi: "ಕಲಬುರಗಿ" };
  return <>
    <PageHeading eyebrow={t("marketBoard")} title={t("mandiTitle")} description={t("mandiSub")} t={t} />
    <div className="market-callout"><span className="callout-icon">↗</span><p>{t("sampleTip")}</p></div>
    <section className="panel table-panel"><div className="table-heading"><div><h2>{languageOf(t) === "en" ? "Nearby market snapshot" : "ಸಮೀಪದ ಮಾರುಕಟ್ಟೆ ನೋಟ"}</h2><p>{t("marketItems")}</p></div><span className="location-chip">⌖ &nbsp;{t("locationUnset")}</span></div>
      <div className="table-scroll"><table><thead><tr><th>{t("commodity")}</th><th>{t("market")}</th><th>{t("price")}</th><th>{t("change")}</th></tr></thead><tbody>{samplePrices.map((row) => <tr key={row.crop}><td><span className={`commodity-dot ${row.up ? "" : "gold"}`} />{cropNames[row.crop]}</td><td>{marketNames[row.market]}</td><td className="price-cell">{row.price}</td><td><span className={row.up ? "change-up" : "change-down"}>{row.change}</span></td></tr>)}</tbody></table></div>
      <div className="table-footnote"><span>ⓘ</span>{t("sampleTip")}</div>
    </section>
  </>;
}

function Soil({ t, profile }: PageProps & { profile: FarmerProfile | null }) {
  const soilName = profile?.soil ? t(({ "Red soil": "typeRed", "Black soil": "typeBlack", "Sandy soil": "typeSandy", "Loamy soil": "typeLoamy" } as const)[profile.soil as "Red soil" | "Black soil" | "Sandy soil" | "Loamy soil"] ?? "typeRed") : t("typeRed");
  return <>
    <PageHeading eyebrow={t("soilHealth")} title={t("soilTitle")} description={t("soilSub")} t={t} />
    <div className="soil-summary panel"><div className="soil-emblem">◉<span>✳</span></div><div className="soil-summary-main"><span className="eyebrow">{t("soilType")}</span><h2>{soilName}</h2><p>{profile ? `${profile.village}, ${profile.district}` : t("demoNote")}</p></div><span className="demo-badge"><i />{t("demo")}</span></div>
    <div className="soil-metrics">
      {[{ key: "phLevel" as const, value: "6.5", status: t("nearNeutral"), fill: 62, color: "green" }, { key: "organicMatter" as const, value: "1.8%", status: t("sampleLevel"), fill: 48, color: "gold" }, { key: "nitrogen" as const, value: t("medium"), status: t("sampleLevel"), fill: 55, color: "green" }, { key: "phosphorus" as const, value: t("good"), status: t("sampleLevel"), fill: 73, color: "green" }, { key: "potassium" as const, value: t("medium"), status: t("sampleLevel"), fill: 58, color: "gold" }].map((metric) => <article className="soil-metric panel" key={metric.key}><span>{t(metric.key)}</span><strong>{metric.value}</strong><div className={`meter ${metric.color}`}><i style={{ width: `${metric.fill}%` }} /></div><small>{metric.status}</small></article>)}
    </div>
    <div className="soil-reminder"><span>✿</span><div><strong>{t("soilTipTitle")}</strong><p>{t("soilTip")}</p></div></div>
  </>;
}

function Crops({ t, navigate }: PageProps & { navigate: (screen: Screen) => void }) {
  const ideas = [
    { key: "cropRagi" as const, desc: "ragiDesc" as const, icon: "❋", color: "ragi", water: t("waterLowMedium"), duration: `100–120 ${t("dayUnit")}`, tag: languageOf(t) === "en" ? "HARDY MILLET" : "ಸಿರಿಧಾನ್ಯ" },
    { key: "cropPulses" as const, desc: "pulsesDesc" as const, icon: "◉", color: "pulse", water: t("waterLow"), duration: `80–100 ${t("dayUnit")}`, tag: languageOf(t) === "en" ? "SOIL FRIENDLY" : "ಮಣ್ಣಿನ ಗೆಳೆಯ" },
    { key: "cropMaize" as const, desc: "maizeDesc" as const, icon: "✺", color: "maize", water: t("waterMedium"), duration: `90–110 ${t("dayUnit")}`, tag: languageOf(t) === "en" ? "VERSATILE" : "ಬಹುಮುಖ" },
    { key: "cropRice" as const, desc: "riceDesc" as const, icon: "♧", color: "rice", water: t("waterHigh"), duration: `120–150 ${t("dayUnit")}`, tag: languageOf(t) === "en" ? "MONSOON CROP" : "ಮುಂಗಾರು ಬೆಳೆ" },
  ];
  return <>
    <PageHeading eyebrow={t("recommended")} title={t("cropTitle")} description={t("cropSub")} t={t} />
    <div className="crop-context"><span className="season-icon">☀</span><div><strong>{t("season")}</strong><small>{t("demoNote")}</small></div><span className="context-arrow">↗</span></div>
    <div className="crop-grid">{ideas.map((crop) => <article className="crop-card panel" key={crop.key}><div className={`crop-art ${crop.color}`}><span>{crop.icon}</span><small>{crop.tag}</small></div><div className="crop-content"><h2>{t(crop.key)}</h2><p>{t(crop.desc)}</p><div className="crop-facts"><span><small>{t("duration")}</small><strong>{crop.duration}</strong></span><span><small>{t("waterNeed")}</small><strong>{crop.water}</strong></span></div><button className="button button-outline" onClick={() => navigate("advisory")}>{t("askAbout")} {t(crop.key)} <span>→</span></button></div></article>)}</div>
    <div className="crop-disclaimer"><span>ⓘ</span>{t("cropTip")}</div>
  </>;
}

function Advisory({ t, messages, input, setInput, send }: PageProps & { messages: ChatMessage[]; input: string; setInput: (value: string) => void; send: (message?: string) => void }) {
  const prompts = languageOf(t) === "en" ? ["How can I care for my soil?", "What should I check before sowing?", "How do I find local mandi rates?"] : ["ಮಣ್ಣಿನ ಆರೈಕೆ ಹೇಗೆ ಮಾಡಲಿ?", "ಬಿತ್ತನೆಗೂ ಮುನ್ನ ಏನು ಪರಿಶೀಲಿಸಲಿ?", "ಸ್ಥಳೀಯ ಮಾರುಕಟ್ಟೆ ದರ ಹೇಗೆ ತಿಳಿಯಲಿ?"];
  return <>
    <PageHeading eyebrow={t("demoChat")} title={t("advisoryTitle")} description={t("advisorySub")} t={t} />
    <div className="chat-layout">
      <section className="chat-window panel"><div className="chat-top"><div className="chat-avatar">✳</div><div><strong>KrishiMitra</strong><small><i /> {languageOf(t) === "en" ? "Demo assistant · offline" : "ಡೆಮೋ ಸಹಾಯಕ · ಆಫ್‌ಲೈನ್"}</small></div><span className="demo-badge"><i />{t("demo")}</span></div>
        <div className="chat-messages"><div className="message mitra-message"><span className="message-avatar">✳</span><p>{t("chatWelcome")}</p></div>{messages.map((message, index) => <div className={`message ${message.from === "farmer" ? "farmer-message" : "mitra-message"}`} key={`${index}-${message.text}`}>{message.from === "mitra" && <span className="message-avatar">✳</span>}<p>{message.text}</p></div>)}</div>
        <div className="chat-prompts"><span>{t("prompts")}</span><div>{prompts.map((prompt) => <button key={prompt} onClick={() => send(prompt)}>{prompt} <b>↗</b></button>)}</div></div>
        <form className="chat-compose" onSubmit={(event: FormEvent) => { event.preventDefault(); send(); }}><input value={input} onChange={(event) => setInput(event.target.value)} placeholder={t("chatPlaceholder")} aria-label={t("chatPlaceholder")} /><button type="submit" disabled={!input.trim()}>{t("send")} <span>↑</span></button></form>
      </section>
      <aside className="chat-side panel"><span className="side-spark">✳</span><div className="eyebrow">{languageOf(t) === "en" ? "A NOTE FROM US" : "ನಮ್ಮಿಂದ ಒಂದು ಮಾತು"}</div><h2>{languageOf(t) === "en" ? "Good advice grows locally." : "ಉತ್ತಮ ಸಲಹೆ ಸ್ಥಳೀಯವಾಗಿ ಬೆಳೆಯುತ್ತದೆ."}</h2><p>{t("reply")}</p><div className="chat-side-bottom"><span>☘</span>{languageOf(t) === "en" ? "Your local experts are your best guide." : "ಸ್ಥಳೀಯ ತಜ್ಞರೇ ನಿಮ್ಮ ಉತ್ತಮ ಮಾರ್ಗದರ್ಶಕರು."}</div></aside>
    </div>
  </>;
}

function Settings({ t, language, setLanguage, profile, clearProfile, navigate }: PageProps & { language: Language; setLanguage: (language: Language) => void; profile: FarmerProfile | null; clearProfile: () => void; navigate: (screen: Screen) => void }) {
  return <>
    <PageHeading eyebrow={t("settingsTitle")} title={t("settingsTitle")} description={t("settingsSub")} t={t} />
    <div className="settings-layout">
      <section className="panel settings-card"><div className="settings-icon">文</div><div className="settings-card-main"><h2>{t("language")}</h2><p>{t("chooseLanguage")}</p><div className="language-options"><button className={language === "en" ? "chosen" : ""} onClick={() => setLanguage("en")}><span>EN</span>English {language === "en" && <b>✓</b>}</button><button className={language === "kn" ? "chosen" : ""} onClick={() => setLanguage("kn")}><span>ಕ</span>ಕನ್ನಡ {language === "kn" && <b>✓</b>}</button></div></div></section>
      <section className="panel settings-card"><div className="settings-icon">♙</div><div className="settings-card-main"><h2>{t("profileSection")}</h2><p>{profile ? `${profile.name} · ${profile.village}, ${profile.district}` : t("noProfile")}</p><small className="muted">{t("savedLocally")}</small><div className="settings-actions"><button className="button button-outline" onClick={() => document.getElementById("profile-form")?.scrollIntoView({ behavior: "smooth" })}>{profile ? t("editProfile") : t("completeProfile")} <span>→</span></button>{profile && <button className="danger-link" onClick={clearProfile}>{t("clearProfile")}</button>}</div></div></section>
      <section className="panel about-card"><div className="about-mark">K✳</div><div><h2>{t("about")}</h2><p>{t("aboutCopy")}</p><button className="text-link" onClick={() => navigate("dashboard")}>{t("dashboard")} <span>→</span></button></div></section>
    </div>
  </>;
}

function ProfileForm({ t, profile, saveProfile }: PageProps & { profile: FarmerProfile | null; saveProfile: (profile: FarmerProfile) => boolean }) {
  const [form, setForm] = useState<FarmerProfile>(profile ?? { name: "", village: "", district: "", land: "", soil: "", irrigation: "" });
  function update(field: keyof FarmerProfile, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }
  const soilOptions = [{ value: "Red soil", label: t("typeRed") }, { value: "Black soil", label: t("typeBlack") }, { value: "Sandy soil", label: t("typeSandy") }, { value: "Loamy soil", label: t("typeLoamy") }];
  const waterOptions = [{ value: "Canal", label: t("waterCanal") }, { value: "Borewell", label: t("waterBorewell") }, { value: "Rainfed", label: t("waterRainfed") }, { value: "Other", label: t("waterOther") }];
  return <section className="panel profile-form-panel" id="profile-form"><div className="profile-form-heading"><div className="profile-icon">♧</div><div><div className="eyebrow">{t("profileBadge")}</div><h2>{t("profileTitle")}</h2><p>{t("profileSub")}</p></div></div>
    <form className="profile-form" onSubmit={(event: FormEvent) => { event.preventDefault(); saveProfile(form); }}>
      <label>{t("fullName")} *<input value={form.name} onChange={(event) => update("name", event.target.value)} placeholder={languageOf(t) === "en" ? "e.g. Lakshmi" : "ಉದಾ. ಲಕ್ಷ್ಮಿ"} required /></label>
      <label>{t("village")} *<input value={form.village} onChange={(event) => update("village", event.target.value)} placeholder={languageOf(t) === "en" ? "Your village" : "ನಿಮ್ಮ ಗ್ರಾಮ"} required /></label>
      <label>{t("district")} *<input value={form.district} onChange={(event) => update("district", event.target.value)} placeholder={languageOf(t) === "en" ? "Your district" : "ನಿಮ್ಮ ಜಿಲ್ಲೆ"} required /></label>
      <label>{t("land")}<input type="number" min="0" step="0.1" value={form.land} onChange={(event) => update("land", event.target.value)} placeholder="e.g. 2.5" /></label>
      <label>{t("soilChoice")}<select value={form.soil} onChange={(event) => update("soil", event.target.value)}><option value="">{t("chooseOne")}</option>{soilOptions.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label>
      <label>{t("irrigation")}<select value={form.irrigation} onChange={(event) => update("irrigation", event.target.value)}><option value="">{t("chooseOne")}</option>{waterOptions.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label>
      <div className="form-footer"><span>🔒 &nbsp;{t("savedLocally")}</span><button type="submit" className="button button-primary">{t("saveProfile")} <span>→</span></button></div>
    </form>
  </section>;
}

export default App;
