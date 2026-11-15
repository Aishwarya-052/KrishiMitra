import { useState, type FormEvent } from "react";

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
    weatherTitle: "Weather outlook", weatherSub: "A calm, clear day in our fictional sample forecast.",
    currentConditions: "CURRENT CONDITIONS", feelsLike: "Feels like", wind: "Wind",
    nextDays: "THE NEXT FEW DAYS", dayToday: "Today", dayTomorrow: "Tomorrow", dayNext: "Wednesday",
    sunny: "Sunny", partlyCloudy: "Partly cloudy", lightShower: "Light showers",
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
    clearProfile: "Clear saved profile", about: "About this prototype", aboutCopy: "KrishiMitra is a Phase 1 UI prototype. Weather and mandi values shown here are fictional demo data, not live feeds.",
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
    weatherTitle: "ಹವಾಮಾನ ಮುನ್ಸೂಚನೆ", weatherSub: "ಕಾಲ್ಪನಿಕ ಮಾದರಿ ಮುನ್ಸೂಚನೆಯಲ್ಲಿ ಶಾಂತ, ಸ್ಪಷ್ಟ ದಿನ.",
    currentConditions: "ಪ್ರಸ್ತುತ ಸ್ಥಿತಿ", feelsLike: "ಅನುಭವದ ತಾಪಮಾನ", wind: "ಗಾಳಿ",
    nextDays: "ಮುಂದಿನ ಕೆಲವು ದಿನಗಳು", dayToday: "ಇಂದು", dayTomorrow: "ನಾಳೆ", dayNext: "ಬುಧವಾರ",
    sunny: "ಬಿಸಿಲು", partlyCloudy: "ಭಾಗಶಃ ಮೋಡ", lightShower: "ಹಗುರ ಮಳೆ",
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
    clearProfile: "ಉಳಿಸಿದ ಪ್ರೊಫೈಲ್ ಅಳಿಸಿ", about: "ಈ ಮಾದರಿಯ ಬಗ್ಗೆ", aboutCopy: "ಕೃಷಿಮಿತ್ರ ಮೊದಲ ಹಂತದ UI ಮಾದರಿ. ಇಲ್ಲಿನ ಹವಾಮಾನ ಮತ್ತು ಮಾರುಕಟ್ಟೆ ದರಗಳು ಕಾಲ್ಪನಿಕ ಡೆಮೋ ಮಾಹಿತಿ; ನೈಜ ಮಾಹಿತಿಯಲ್ಲ.",
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
  const t = (key: keyof typeof text.en) => text[language][key];

  function navigate(next: Screen) {
    setScreen(next);
    setMobileMore(false);
    setNotice("");
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
          {screen === "dashboard" && <Dashboard t={t} profile={profile} navigate={navigate} />}
          {screen === "weather" && <Weather t={t} />}
          {screen === "mandi" && <Mandi t={t} />}
          {screen === "soil" && <Soil t={t} profile={profile} />}
          {screen === "crops" && <Crops t={t} navigate={navigate} />}
          {screen === "advisory" && <Advisory t={t} messages={chatMessages} input={chatInput} setInput={setChatInput} send={sendMessage} />}
          {screen === "settings" && <Settings t={t} language={language} setLanguage={setLanguage} profile={profile} clearProfile={clearProfile} navigate={navigate} />}
          {screen === "settings" && <ProfileForm t={t} profile={profile} saveProfile={saveProfile} />}
        </div>
        <footer className="page-footer"><span>© 2026 KrishiMitra</span><span>{t("demoNote")}</span></footer>
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

function PageHeading({ eyebrow, title, description, t }: PageProps & { eyebrow: string; title: string; description: string }) {
  return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div><span className="demo-badge"><i />{t("demo")}</span></div>;
}

function Dashboard({ t, profile, navigate }: PageProps & { profile: FarmerProfile | null; navigate: (screen: Screen) => void }) {
  return (
    <>
      <section className="welcome-row">
        <div><div className="eyebrow">{t("greeting")}{profile ? `, ${profile.name.split(" ")[0]}` : ""} <span className="sun-small">☀</span></div><h1>{t("welcome")}</h1><p>{profile ? `${profile.village}, ${profile.district}` : t("setupPrompt")}</p></div>
        <div className="welcome-art" aria-hidden="true"><span className="art-sun" /><span className="art-hill hill-one" /><span className="art-hill hill-two" /><span className="art-leaf">✳</span></div>
      </section>
      <div className="section-title"><div><h2>{t("todayAt")}</h2><p>{t("demoNote")}</p></div><span className="demo-badge"><i />{t("demo")}</span></div>
      <div className="overview-grid">
        <article className="overview-card weather-overview">
          <div className="card-topline"><span>{t("weatherCard")}</span><span className="weather-icon">☀</span></div>
          <div className="temperature">28°<small>C</small></div><div className="condition">{t("sunny")} · {t("feelsLike")} 30°</div>
          <div className="mini-stats"><span>☂ {t("rainChance")} <b>10%</b></span><span>◌ {t("humidity")} <b>62%</b></span></div>
          <button className="text-link" onClick={() => navigate("weather")}>{t("viewWeather")} <span>→</span></button>
        </article>
        <article className="overview-card market-overview">
          <div className="card-topline"><span>{t("marketCard")}</span><span className="market-icon">↗</span></div>
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

function Weather({ t }: PageProps) {
  return <>
    <PageHeading eyebrow={t("currentConditions")} title={t("weatherTitle")} description={t("weatherSub")} t={t} />
    <div className="weather-hero">
      <div className="weather-hero-copy"><span className="weather-location">⌖ &nbsp;{t("locationUnset")}</span><div className="hero-temperature">28<span>°</span></div><div className="hero-condition">☀ &nbsp;{t("sunny")}</div><p>{t("demoNote")}</p></div>
      <div className="sun-scene" aria-hidden="true"><span className="big-sun" /><span className="cloud cloud-a" /><span className="cloud cloud-b" /><span className="scene-hill scene-hill-a" /><span className="scene-hill scene-hill-b" /></div>
      <div className="weather-facts"><div><span>◉</span><small>{t("feelsLike")}</small><strong>30°C</strong></div><div><span>☂</span><small>{t("rainChance")}</small><strong>10%</strong></div><div><span>◌</span><small>{t("humidity")}</small><strong>62%</strong></div><div><span>≋</span><small>{t("wind")}</small><strong>12 km/h</strong></div></div>
    </div>
    <section className="panel forecast-panel"><div className="panel-heading"><div><div className="eyebrow">{t("chartLabel")}</div><h2>{t("nextDays")}</h2></div><span className="demo-badge"><i />{t("demo")}</span></div>
      <svg className="rain-chart" viewBox="0 0 760 170" role="img" aria-label={t("chartLabel")}><defs><linearGradient id="rainfill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#92bb83" stopOpacity=".35" /><stop offset="1" stopColor="#92bb83" stopOpacity="0" /></linearGradient></defs><path d="M30 120 C130 102 140 94 230 105 S340 86 420 96 S530 128 610 106 S690 94 730 85 L730 165 L30 165 Z" fill="url(#rainfill)" /><path d="M30 120 C130 102 140 94 230 105 S340 86 420 96 S530 128 610 106 S690 94 730 85" fill="none" stroke="#54805e" strokeWidth="3" strokeLinecap="round" /><circle cx="30" cy="120" r="5" fill="#54805e" /><circle cx="230" cy="105" r="5" fill="#54805e" /><circle cx="420" cy="96" r="5" fill="#54805e" /><circle cx="610" cy="106" r="5" fill="#54805e" /><circle cx="730" cy="85" r="5" fill="#54805e" /></svg>
      <div className="forecast-days">{[[t("dayToday"), "☀", t("sunny"), "28°"], [t("dayTomorrow"), "⛅", t("partlyCloudy"), "27°"], [t("dayNext"), "☂", t("lightShower"), "25°"], [languageOf(t) === "en" ? "Thursday" : "ಗುರುವಾರ", "☀", t("sunny"), "29°"]].map((day) => <div className="forecast-day" key={day[0]}><span>{day[0]}</span><b>{day[1]}</b><small>{day[2]}</small><strong>{day[3]}</strong></div>)}</div>
    </section>
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
