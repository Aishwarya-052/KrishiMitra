import { useEffect, useState, type FormEvent } from "react";
import {
  fetchWeatherForecast,
  searchWeatherLocations,
  WeatherServiceError,
  type WeatherForecast,
  type WeatherLocation,
} from "./weatherService";
import {
  fetchMandiRecords,
  MandiServiceError,
  type MandiRecord,
} from "./mandiService";

type Screen = "dashboard" | "weather" | "mandi" | "profit" | "smartFarm" | "soil" | "crops" | "advisory" | "settings";
type Language = "en" | "kn";
type FarmerProfile = {
  name: string;
  village: string;
  district: string;
  land: string;
  soil: string;
  irrigation: string;
};
type ProfitInputs = {
  crop: string;
  area: string;
  yieldPerAcre: string;
  salePrice: string;
  seedExpense: string;
  fertilizerExpense: string;
  labourExpense: string;
  irrigationExpense: string;
  transportExpense: string;
  otherExpense: string;
};
type MandiSnapshot = { commodity: string; records: MandiRecord[]; fetchedAt: string };
type ChatMessage = { from: "farmer" | "mitra"; text: string };

const PROFILE_KEY = "krishimitra-farmer-profile";
const WEATHER_LOCATION_KEY = "krishimitra-weather-location";
const initialProfitInputs: ProfitInputs = {
  crop: "",
  area: "",
  yieldPerAcre: "",
  salePrice: "",
  seedExpense: "0",
  fertilizerExpense: "0",
  labourExpense: "0",
  irrigationExpense: "0",
  transportExpense: "0",
  otherExpense: "0",
};

const text = {
  en: {
    dashboard: "Dashboard", weather: "Weather", mandi: "Mandi prices", profit: "Profit calculator", smartFarm: "Smart Farm", soil: "Soil profile",
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
    mandiTitle: "Mandi prices", mandiSub: "Government-reported daily prices from Karnataka markets.",
    marketBoard: "AGMARKNET DAILY PRICES", commodity: "Commodity", market: "Market", price: "Price / quintal",
    change: "Change", sampleTip: "Prices can change. Transport and other costs affect what you earn; compare carefully.",
    state: "State", districtLabel: "District", variety: "Variety", arrivalDate: "Arrival date",
    minPrice: "Minimum price", maxPrice: "Maximum price", modalPrice: "Modal price",
    selectState: "Select state", selectDistrict: "All districts", selectMarket: "All markets",
    searchCrop: "Search and select a crop", cropSearchPlaceholder: "Search dataset commodities…",
    noCrops: "No matching commodities in the available data.", loadingMarkets: "Loading government market data…",
    noMarketData: "No market records are available for this selection.",
    noDataForFilters: "No records match these filters. Try another crop, district or market.",
    chooseCropForCompare: "Search and select a crop to compare prices across markets.",
    marketApiSource: "Government of India · AGMARKNET", lastUpdatedMandi: "Last updated",
    dataRows: "Records returned", mandiErrorTitle: "Could not load market data",
    missingMandiKey: "Add your data.gov.in API key to the server's .env file, then restart it.",
    rejectedMandiKey: "data.gov.in rejected this API key. Check that it is active and allowed for this resource.",
    mandiNetworkError: "Could not reach the market service. Check your internet connection and try again.",
    mandiUpstreamError: "The data.gov.in service is temporarily unavailable. Please try again later.",
    mandiSchemaError: "The dataset response format is not recognised. No prices are displayed.",
    refreshPrices: "Refresh prices", refreshingPrices: "Refreshing…", compareMarkets: "Compare Karnataka markets",
    sortByModal: "Sort by modal price", ascending: "Lowest first", descending: "Highest first",
    priceAdvisory: "Price comparison notes", noCompareData: "Not enough reported prices to compare markets.",
    highestReported: "Highest reported modal price", lowestReported: "Lowest reported modal price",
    transportNote: "A higher reported price does not guarantee higher earnings. Transport and other costs matter.",
    priceHistory: "Reported price history", fromDate: "From date", toDate: "To date",
    missingDates: "No records for these dates", noHistory: "No historical records are available for this selection.",
    sourceUnitNote: "Prices are shown in ₹ per quintal as reported in the source.",
    sellWaitTitle: "Smart sell or wait",
    sellWaitSub: "A cautious guide based only on reported prices for your selected crop and filters.",
    currentReportedPrice: "Latest reported average",
    previousReportedPrice: "Previous reported average",
    priceChange: "Change since previous report",
    trend: "Recent reported trend",
    trendRising: "Rising",
    trendFalling: "Falling",
    trendMixed: "Mixed or steady",
    trendInsufficient: "Not enough data to show a trend",
    recommendationMonitor: "Consider monitoring",
    recommendationSell: "Consider selling",
    recommendationNoSignal: "No clear signal",
    recommendationInsufficient: "Not enough history for a recommendation",
    adviceMonitor: "The latest three reported dates show a steady rise. You may monitor another update before deciding; this does not predict future prices.",
    adviceSell: "The latest three reported dates show a steady decline. If today's offer meets your needs, consider selling rather than waiting solely for a price increase.",
    adviceNoSignal: "The latest reported prices do not show a consistent direction. Compare your costs and local offer before deciding.",
    adviceInsufficient: "Fewer than three dates with reported prices are available, so there is not enough history for a sell-or-wait recommendation.",
    selectCropForAdvisor: "Select a crop above to review its reported price history.",
    noAdvisorPrices: "No usable modal prices are available for this crop and filter selection, so historical analysis is not available.",
    reportedPriceHistory: "Recent reported prices",
    reportedPriceMethod: "Daily values are the average of available modal prices for the selected crop and filters. These are past reports, not a forecast or a guarantee.",
    smartFarmTitle: "Smart Farm Decision Center", smartFarmSub: "A practical snapshot that brings your farm profile, forecast, market reports, and cost estimate together.",
    smartFarmEyebrow: "YOUR FARM DECISION CENTER", smartFarmOverview: "Farm snapshot", todayForecast: "Forecast outlook",
    noForecastForFarm: "Choose a location on the Weather screen to load a live forecast.",
    noFarmSoil: "No soil type saved in your farmer profile.", profileSoilNote: "Soil type from your saved farmer profile; not a laboratory soil test.",
    latestMandiAverage: "Latest reported mandi average", demoPriceLabel: "DEMO SAMPLE · NOT A LIVE MARKET PRICE",
    samplePriceExplanation: "Illustrative values for demonstration only. Visit Mandi prices to load reported records for this crop.",
    noMarketHistory: "No matching reported market records are available for this crop yet.",
    trendIncreasing: "Increasing", trendDecreasing: "Decreasing", trendStable: "Stable",
    samplePeriodOne: "Sample 1", samplePeriodTwo: "Sample 2", samplePeriodThree: "Sample 3",
    sellNow: "Sell now", waitMarket: "Wait and review", monitorMarket: "Monitor market",
    sellNowReason: "The last three reported daily averages decreased consecutively. Consider today's local offer and your costs; this does not predict future prices.",
    waitMarketReason: "The last three reported daily averages increased consecutively. Review the next report before deciding; future prices are not guaranteed.",
    monitorMarketReason: "The recent reports do not show a consistent three-date direction, so monitor the market and compare local offers.",
    marketSampleReason: "This recommendation is generated from illustrative demo prices only. It is not a real market signal or selling advice.",
    marketInsufficientReason: "Fewer than three reported dates are available. Monitor current local offers; a reliable direction cannot be inferred.",
    openMandi: "Explore mandi prices",
    farmAlertsTitle: "Weather-based farm alerts", forecastVerified: "FORECAST BASED",
    generalAdviceLabel: "GENERAL GUIDANCE · NOT VERIFIED FOR YOUR LOCATION",
    noActiveFarmAlerts: "No alert thresholds were reached in the available forecast. Continue checking local conditions.",
    alertHeavyRainTitle: "Heavy rainfall expected", alertHeavyRainBody: "Forecast: {amount} mm on {date}. Consider postponing irrigation and check field drainage.",
    alertRainTitle: "Rain expected", alertRainBody: "Rain chance: {chance}% on {date}. Check soil moisture before irrigation to avoid unnecessary watering.",
    alertRainAmountBody: "Forecast: {amount} mm on {date}. Check soil moisture before irrigation to avoid unnecessary watering.",
    alertHeatTitle: "High temperature expected", alertHeatBody: "Forecast high: {temperature}°C on {date}. Monitor the crop's water needs.",
    alertWindTitle: "Strong winds now", alertWindBody: "Reported wind: {speed} km/h. Inspect crops and support structures.",
    generalWeatherAdviceTitle: "General weather reminder",
    generalWeatherAdviceBody: "Check local forecasts before irrigation, harvest, or field work. No live forecast is loaded for this farm.",
    cropRiskTitle: "Weather-linked crop risk", lowRisk: "Low risk", moderateRisk: "Moderate risk", highRisk: "High risk",
    riskUnavailable: "Risk indicator unavailable", riskMethod: "This general indicator counts forecast alert types: none = low, one = moderate, two or more = high. It is not a yield or crop-loss prediction.",
    riskContextNote: "The indicator requires a selected crop, saved soil type, and live forecast. Its level counts general weather alerts; no validated crop-specific or soil-test thresholds are available for additional weighting.",
    riskWeatherUnavailable: "Select a crop, save a soil type in your profile, and load a live forecast to calculate this indicator.",
    riskFactorWeather: "Forecast alert: {title}",
    farmCostsTitle: "Farm expense insights", totalInvestment: "Total investment", largestExpense: "Largest expense category",
    expenseBreakdown: "Expense breakdown", noExpensesEntered: "Add estimated expenses in Profit calculator to see the cost breakdown.",
    largestExpenseInsight: "{category} is the largest estimated expense at {share}% of your total costs.",
    noLargestExpense: "No expenses have been entered yet.",
    personalizedTitle: "Personalized recommendations", priorityHigh: "High", priorityMedium: "Medium", priorityLow: "Low",
    weatherRecommendationTitle: "Weather check for {crop}", weatherRecommendationBody: "{alert} Use the forecast details above to plan field work.",
    weatherRecommendationNoAlert: "No configured weather alert was reached. Keep checking updated forecasts before field work.",
    weatherRecommendationNoData: "Add a weather location to receive forecast-based guidance.",
    marketRecommendationTitle: "Market review for {crop}", marketRecommendationBody: "{recommendation}: {reason}",
    expenseRecommendationTitle: "Review {category} costs", expenseRecommendationBody: "{category} is {share}% of your entered costs. Compare local rates and keep receipts.",
    expenseRecommendationNoData: "Enter area, yield, selling price, and expenses in Profit calculator to get a farm-specific cost insight.",
    expenseRecommendationNoCosts: "Add expense estimates in Profit calculator to identify the largest cost category.",
    selectCropForSmartFarm: "Choose a crop to personalize the farm snapshot.",
    noVariety: "Not reported", noPrice: "—", searchStateHelp: "Locations and crop choices come from returned dataset records.",
    selectedRows: "matching records", allKarnataka: "All Karnataka",
    soilTitle: "Soil profile", soilSub: "A simple guide to understanding what is beneath your field.",
    profitCalculatorEyebrow: "PLAN YOUR FARM SEASON", profitCalculatorTitle: "Farmer profit calculator",
    profitCalculatorSub: "Estimate crop revenue, expenses, and profit using your own farm figures.",
    estimateBadge: "YOUR ESTIMATE", cropSelect: "Crop", chooseCrop: "Choose a crop",
    cultivatedArea: "Cultivated land area (acres)", expectedYieldPerAcre: "Expected yield per acre (quintals)",
    expectedSellingPrice: "Expected selling price (₹ / quintal)", estimatedExpenses: "Estimated expenses (₹)",
    calculatorExpenseHelp: "Enter your estimated costs for the season; unused items can stay at ₹0.",
    seedExpense: "Seeds", fertilizerExpense: "Fertilizer", labourExpense: "Labour",
    irrigationExpense: "Irrigation", transportExpense: "Transportation", otherExpense: "Other costs",
    calculatorResults: "Your estimated results", calculatorPrompt: "Choose a crop and enter area, yield, and selling price to see your estimate.",
    totalExpectedYield: "Total expected yield", expectedRevenue: "Total expected revenue",
    quintals: "quintals",
    totalExpenses: "Total expenses", estimatedProfit: "Estimated profit", profitPerAcre: "Profit per acre",
    financialBreakdown: "Revenue and cost comparison", revenueLabel: "Revenue", expensesLabel: "Expenses",
    netProfitLabel: "Net profit", calculatorDisclaimer: "This is an estimate based on your inputs, not a guaranteed return. Actual yield, prices, and costs may differ.",
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
    dashboard: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್", weather: "ಹವಾಮಾನ", mandi: "ಮಾರುಕಟ್ಟೆ ದರ", profit: "ಲಾಭದ ಲೆಕ್ಕಾಚಾರ", smartFarm: "ಸ್ಮಾರ್ಟ್ ಕೃಷಿ", soil: "ಮಣ್ಣಿನ ವಿವರ",
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
    mandiTitle: "ಮಾರುಕಟ್ಟೆ ದರಗಳು", mandiSub: "ಕರ್ನಾಟಕ ಮಾರುಕಟ್ಟೆಗಳ ಸರ್ಕಾರಿ ದೈನಂದಿನ ವರದಿ ದರಗಳು.",
    marketBoard: "ಅಗ್ಮಾರ್ಕ್‌ನೆಟ್ ದೈನಂದಿನ ದರಗಳು", commodity: "ಬೆಳೆ", market: "ಮಾರುಕಟ್ಟೆ", price: "ದರ / ಕ್ವಿಂಟಾಲ್",
    change: "ಬದಲಾವಣೆ", sampleTip: "ದರಗಳು ಬದಲಾಗಬಹುದು. ಸಾಗಣೆ ಮತ್ತು ಇತರ ವೆಚ್ಚಗಳು ನಿಮ್ಮ ಗಳಿಕೆಗೆ ಪರಿಣಾಮ ಬೀರುತ್ತವೆ; ಎಚ್ಚರಿಕೆಯಿಂದ ಹೋಲಿಸಿ.",
    state: "ರಾಜ್ಯ", districtLabel: "ಜಿಲ್ಲೆ", variety: "ತಳಿ", arrivalDate: "ಆಗಮನ ದಿನಾಂಕ",
    minPrice: "ಕನಿಷ್ಠ ದರ", maxPrice: "ಗರಿಷ್ಠ ದರ", modalPrice: "ಮಾದರಿ ದರ",
    selectState: "ರಾಜ್ಯ ಆಯ್ಕೆಮಾಡಿ", selectDistrict: "ಎಲ್ಲ ಜಿಲ್ಲೆಗಳು", selectMarket: "ಎಲ್ಲ ಮಾರುಕಟ್ಟೆಗಳು",
    searchCrop: "ಬೆಳೆ ಹುಡುಕಿ ಆಯ್ಕೆಮಾಡಿ", cropSearchPlaceholder: "ಮಾಹಿತಿಯಲ್ಲಿನ ಬೆಳೆಗಳನ್ನು ಹುಡುಕಿ…",
    noCrops: "ಲಭ್ಯ ಮಾಹಿತಿಯಲ್ಲಿ ಹೊಂದುವ ಬೆಳೆಗಳಿಲ್ಲ.", loadingMarkets: "ಸರ್ಕಾರಿ ಮಾರುಕಟ್ಟೆ ಮಾಹಿತಿ ಲೋಡ್ ಆಗುತ್ತಿದೆ…",
    noMarketData: "ಈ ಆಯ್ಕೆಗೆ ಮಾರುಕಟ್ಟೆ ದಾಖಲೆಗಳಿಲ್ಲ.",
    noDataForFilters: "ಈ ಫಿಲ್ಟರ್‌ಗಳಿಗೆ ದಾಖಲೆಗಳಿಲ್ಲ. ಬೇರೆ ಬೆಳೆ, ಜಿಲ್ಲೆ ಅಥವಾ ಮಾರುಕಟ್ಟೆ ಆಯ್ಕೆಮಾಡಿ.",
    chooseCropForCompare: "ಮಾರುಕಟ್ಟೆಗಳ ದರ ಹೋಲಿಸಲು ಬೆಳೆ ಹುಡುಕಿ ಆಯ್ಕೆಮಾಡಿ.",
    marketApiSource: "ಭಾರತ ಸರ್ಕಾರ · ಅಗ್ಮಾರ್ಕ್‌ನೆಟ್", lastUpdatedMandi: "ಕೊನೆಯ ನವೀಕರಣ",
    dataRows: "ಪಡೆದ ದಾಖಲೆಗಳು", mandiErrorTitle: "ಮಾರುಕಟ್ಟೆ ಮಾಹಿತಿ ಲೋಡ್ ಆಗಲಿಲ್ಲ",
    missingMandiKey: "ಸರ್ವರ್‌ನ .env ಕಡತಕ್ಕೆ data.gov.in API ಕೀ ಸೇರಿಸಿ, ನಂತರ ಸರ್ವರ್ ಮರುಪ್ರಾರಂಭಿಸಿ.",
    rejectedMandiKey: "data.gov.in ಈ API ಕೀಯನ್ನು ತಿರಸ್ಕರಿಸಿದೆ. ಅದು ಸಕ್ರಿಯವಾಗಿದೆಯೇ ಮತ್ತು ಈ ಮಾಹಿತಿಗೆ ಅನುಮತಿದೆಯೇ ಪರಿಶೀಲಿಸಿ.",
    mandiNetworkError: "ಮಾರುಕಟ್ಟೆ ಸೇವೆಯನ್ನು ತಲುಪಲಾಗಲಿಲ್ಲ. ಇಂಟರ್ನೆಟ್ ಪರಿಶೀಲಿಸಿ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
    mandiUpstreamError: "data.gov.in ಸೇವೆ ತಾತ್ಕಾಲಿಕವಾಗಿ ಲಭ್ಯವಿಲ್ಲ. ಸ್ವಲ್ಪ ಸಮಯದ ನಂತರ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
    mandiSchemaError: "ಮಾಹಿತಿಯ ಪ್ರತಿಕ್ರಿಯೆಯ ರೂಪ ಗುರುತಿಸಲಾಗಲಿಲ್ಲ. ಯಾವುದೇ ದರ ತೋರಿಸಲಾಗುವುದಿಲ್ಲ.",
    refreshPrices: "ದರಗಳನ್ನು ನವೀಕರಿಸಿ", refreshingPrices: "ನವೀಕರಿಸಲಾಗುತ್ತಿದೆ…", compareMarkets: "ಕರ್ನಾಟಕ ಮಾರುಕಟ್ಟೆಗಳನ್ನು ಹೋಲಿಸಿ",
    sortByModal: "ಮಾದರಿ ದರದಂತೆ ವಿಂಗಡಿಸಿ", ascending: "ಕಡಿಮೆಯಿಂದ ಹೆಚ್ಚು", descending: "ಹೆಚ್ಚಿನಿಂದ ಕಡಿಮೆ",
    priceAdvisory: "ದರ ಹೋಲಿಕೆ ಸೂಚನೆಗಳು", noCompareData: "ಮಾರುಕಟ್ಟೆ ಹೋಲಿಕೆಗೆ ಸಾಕಷ್ಟು ವರದಿಯಾದ ದರಗಳಿಲ್ಲ.",
    highestReported: "ವರದಿಯಾದ ಅತ್ಯಧಿಕ ಮಾದರಿ ದರ", lowestReported: "ವರದಿಯಾದ ಕನಿಷ್ಠ ಮಾದರಿ ದರ",
    transportNote: "ಹೆಚ್ಚಿನ ವರದಿಯಾದ ದರ ಎಂದರೆ ಹೆಚ್ಚಿನ ಗಳಿಕೆ ಖಚಿತವಲ್ಲ. ಸಾಗಣೆ ಮತ್ತು ಇತರ ವೆಚ್ಚಗಳು ಮುಖ್ಯ.",
    priceHistory: "ವರದಿಯಾದ ದರದ ಇತಿಹಾಸ", fromDate: "ದಿನಾಂಕದಿಂದ", toDate: "ದಿನಾಂಕದವರೆಗೆ",
    missingDates: "ಈ ದಿನಾಂಕಗಳಿಗೆ ದಾಖಲೆಗಳಿಲ್ಲ", noHistory: "ಈ ಆಯ್ಕೆಗೆ ಹಿಂದಿನ ದಾಖಲೆಗಳು ಲಭ್ಯವಿಲ್ಲ.",
    sourceUnitNote: "ಮೂಲದಲ್ಲಿ ವರದಿಯಾದಂತೆ ದರಗಳನ್ನು ₹ ಪ್ರತಿ ಕ್ವಿಂಟಾಲ್‌ನಲ್ಲಿ ತೋರಿಸಲಾಗಿದೆ.",
    sellWaitTitle: "ಮಾರಬೇಕೇ ಅಥವಾ ಕಾಯಬೇಕೇ?",
    sellWaitSub: "ಆಯ್ಕೆ ಮಾಡಿದ ಬೆಳೆ ಮತ್ತು ಫಿಲ್ಟರ್‌ಗಳ ವರದಿಯಾದ ದರಗಳ ಆಧಾರದ ಎಚ್ಚರಿಕೆಯ ಮಾರ್ಗದರ್ಶಿ.",
    currentReportedPrice: "ಇತ್ತೀಚಿನ ವರದಿಯಾದ ಸರಾಸರಿ",
    previousReportedPrice: "ಹಿಂದಿನ ವರದಿಯಾದ ಸರಾಸರಿ",
    priceChange: "ಹಿಂದಿನ ವರದಿಯಿಂದ ಬದಲಾವಣೆ",
    trend: "ಇತ್ತೀಚಿನ ವರದಿಯಾದ ಪ್ರವೃತ್ತಿ",
    trendRising: "ಏರಿಕೆ",
    trendFalling: "ಇಳಿಕೆ",
    trendMixed: "ಮಿಶ್ರ ಅಥವಾ ಸ್ಥಿರ",
    trendInsufficient: "ಪ್ರವೃತ್ತಿ ತೋರಿಸಲು ಸಾಕಷ್ಟು ಮಾಹಿತಿ ಇಲ್ಲ",
    recommendationMonitor: "ದರ ಗಮನಿಸುವುದನ್ನು ಪರಿಗಣಿಸಿ",
    recommendationSell: "ಮಾರಾಟವನ್ನು ಪರಿಗಣಿಸಿ",
    recommendationNoSignal: "ಸ್ಪಷ್ಟ ಸೂಚನೆ ಇಲ್ಲ",
    recommendationInsufficient: "ಸಲಹೆಗೆ ಸಾಕಷ್ಟು ಇತಿಹಾಸವಿಲ್ಲ",
    adviceMonitor: "ಇತ್ತೀಚಿನ ಮೂರು ವರದಿಯಾದ ದಿನಗಳಲ್ಲಿ ಸ್ಥಿರ ಏರಿಕೆ ಕಂಡಿದೆ. ನಿರ್ಧಾರಕ್ಕೂ ಮೊದಲು ಮುಂದಿನ ವರದಿಯನ್ನು ಗಮನಿಸಬಹುದು; ಇದು ಭವಿಷ್ಯದ ದರದ ಮುನ್ಸೂಚನೆಯಲ್ಲ.",
    adviceSell: "ಇತ್ತೀಚಿನ ಮೂರು ವರದಿಯಾದ ದಿನಗಳಲ್ಲಿ ಸ್ಥಿರ ಇಳಿಕೆ ಕಂಡಿದೆ. ಇಂದಿನ ದರ ನಿಮಗೆ ಒಪ್ಪಿಗೆಯಾದರೆ, ಏರಿಕೆಯಾಗುತ್ತದೆ ಎಂದು ಮಾತ್ರ ಕಾಯುವ ಬದಲು ಮಾರಾಟವನ್ನು ಪರಿಗಣಿಸಿ.",
    adviceNoSignal: "ಇತ್ತೀಚಿನ ವರದಿಯಾದ ದರಗಳಲ್ಲಿ ಸ್ಥಿರ ದಿಕ್ಕು ಕಂಡುಬಂದಿಲ್ಲ. ನಿರ್ಧಾರಕ್ಕೂ ಮೊದಲು ನಿಮ್ಮ ವೆಚ್ಚ ಮತ್ತು ಸ್ಥಳೀಯ ದರವನ್ನು ಹೋಲಿಸಿ.",
    adviceInsufficient: "ವರದಿಯಾದ ದರಗಳಿರುವ ಮೂರು ದಿನಗಳಿಗಿಂತ ಕಡಿಮೆ ಮಾಹಿತಿ ಇದೆ; ಆದ್ದರಿಂದ ಮಾರಾಟ ಅಥವಾ ಕಾಯುವ ಸಲಹೆಗೆ ಸಾಕಷ್ಟು ಇತಿಹಾಸವಿಲ್ಲ.",
    selectCropForAdvisor: "ವರದಿಯಾದ ದರದ ಇತಿಹಾಸ ನೋಡಲು ಮೇಲಿನಿಂದ ಬೆಳೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ.",
    noAdvisorPrices: "ಈ ಬೆಳೆ ಮತ್ತು ಫಿಲ್ಟರ್‌ಗಳಿಗೆ ಬಳಸಬಹುದಾದ ಮಾದರಿ ದರಗಳು ಲಭ್ಯವಿಲ್ಲ; ಆದ್ದರಿಂದ ಹಿಂದಿನ ದರದ ವಿಶ್ಲೇಷಣೆ ಲಭ್ಯವಿಲ್ಲ.",
    reportedPriceHistory: "ಇತ್ತೀಚಿನ ವರದಿಯಾದ ದರಗಳು",
    reportedPriceMethod: "ದೈನಂದಿನ ದರವು ಆಯ್ಕೆ ಮಾಡಿದ ಬೆಳೆ ಮತ್ತು ಫಿಲ್ಟರ್‌ಗಳಿಗೆ ಲಭ್ಯವಿರುವ ಮಾದರಿ ದರಗಳ ಸರಾಸರಿ. ಇವು ಹಿಂದಿನ ವರದಿಗಳು ಮಾತ್ರ; ಮುನ್ಸೂಚನೆ ಅಥವಾ ಖಾತರಿಯಲ್ಲ.",
    smartFarmTitle: "ಸ್ಮಾರ್ಟ್ ಕೃಷಿ ನಿರ್ಧಾರ ಕೇಂದ್ರ", smartFarmSub: "ನಿಮ್ಮ ಕೃಷಿ ವಿವರ, ಮುನ್ಸೂಚನೆ, ಮಾರುಕಟ್ಟೆ ವರದಿ ಮತ್ತು ವೆಚ್ಚದ ಅಂದಾಜನ್ನು ಒಟ್ಟಿಗೆ ತೋರಿಸುವ ಪ್ರಾಯೋಗಿಕ ನೋಟ.",
    smartFarmEyebrow: "ನಿಮ್ಮ ಕೃಷಿ ನಿರ್ಧಾರ ಕೇಂದ್ರ", smartFarmOverview: "ಕೃಷಿ ಸಾರಾಂಶ", todayForecast: "ಹವಾಮಾನ ಮುನ್ಸೂಚನೆ",
    noForecastForFarm: "ನೈಜ ಮುನ್ಸೂಚನೆ ಪಡೆಯಲು ಹವಾಮಾನ ಪರದೆಯಲ್ಲಿ ಸ್ಥಳ ಆಯ್ಕೆಮಾಡಿ.",
    noFarmSoil: "ರೈತರ ಪ್ರೊಫೈಲ್‌ನಲ್ಲಿ ಮಣ್ಣಿನ ಪ್ರಕಾರ ಉಳಿಸಿಲ್ಲ.", profileSoilNote: "ನಿಮ್ಮ ರೈತರ ಪ್ರೊಫೈಲ್‌ನ ಮಣ್ಣಿನ ಪ್ರಕಾರ; ಪ್ರಯೋಗಾಲಯದ ಮಣ್ಣಿನ ಪರೀಕ್ಷೆಯಲ್ಲ.",
    latestMandiAverage: "ಇತ್ತೀಚಿನ ವರದಿಯಾದ ಮಾರುಕಟ್ಟೆ ಸರಾಸರಿ", demoPriceLabel: "ಡೆಮೋ ಮಾದರಿ · ನೈಜ ಮಾರುಕಟ್ಟೆ ದರವಲ್ಲ",
    samplePriceExplanation: "ಪ್ರಾತ್ಯಕ್ಷಿಕೆಗಾಗಿ ಮಾತ್ರದ ಉದಾಹರಣೆ ದರಗಳು. ಈ ಬೆಳೆಯ ವರದಿಯಾದ ದರಗಳಿಗಾಗಿ ಮಾರುಕಟ್ಟೆ ದರ ಪರದೆ ನೋಡಿ.",
    noMarketHistory: "ಈ ಬೆಳೆಗೆ ಹೊಂದುವ ವರದಿಯಾದ ಮಾರುಕಟ್ಟೆ ದಾಖಲೆಗಳು ಇನ್ನೂ ಲಭ್ಯವಿಲ್ಲ.",
    trendIncreasing: "ಏರಿಕೆ", trendDecreasing: "ಇಳಿಕೆ", trendStable: "ಸ್ಥಿರ",
    samplePeriodOne: "ಮಾದರಿ 1", samplePeriodTwo: "ಮಾದರಿ 2", samplePeriodThree: "ಮಾದರಿ 3",
    sellNow: "ಈಗ ಮಾರಾಟ ಪರಿಗಣಿಸಿ", waitMarket: "ಕಾಯ್ದು ಪರಿಶೀಲಿಸಿ", monitorMarket: "ಮಾರುಕಟ್ಟೆ ಗಮನಿಸಿ",
    sellNowReason: "ಕೊನೆಯ ಮೂರು ವರದಿಯಾದ ದೈನಂದಿನ ಸರಾಸರಿಗಳು ಸತತವಾಗಿ ಇಳಿದಿವೆ. ಇಂದಿನ ಸ್ಥಳೀಯ ದರ ಮತ್ತು ವೆಚ್ಚಗಳನ್ನು ಪರಿಗಣಿಸಿ; ಇದು ಭವಿಷ್ಯದ ದರದ ಮುನ್ಸೂಚನೆಯಲ್ಲ.",
    waitMarketReason: "ಕೊನೆಯ ಮೂರು ವರದಿಯಾದ ದೈನಂದಿನ ಸರಾಸರಿಗಳು ಸತತವಾಗಿ ಏರಿವೆ. ನಿರ್ಧಾರಕ್ಕೂ ಮೊದಲು ಮುಂದಿನ ವರದಿ ಪರಿಶೀಲಿಸಿ; ಭವಿಷ್ಯದ ದರ ಖಚಿತವಲ್ಲ.",
    monitorMarketReason: "ಇತ್ತೀಚಿನ ವರದಿಗಳಲ್ಲಿ ಸತತ ಮೂರು ದಿನಗಳ ಸ್ಪಷ್ಟ ದಿಕ್ಕಿಲ್ಲ. ಮಾರುಕಟ್ಟೆ ಗಮನಿಸಿ ಸ್ಥಳೀಯ ದರಗಳನ್ನು ಹೋಲಿಸಿ.",
    marketSampleReason: "ಈ ಸಲಹೆ ಉದಾಹರಣೆಯ ಡೆಮೋ ದರಗಳಿಂದ ಮಾತ್ರ ಬಂದಿದೆ. ಇದು ನೈಜ ಮಾರುಕಟ್ಟೆ ಸೂಚನೆ ಅಥವಾ ಮಾರಾಟ ಸಲಹೆಯಲ್ಲ.",
    marketInsufficientReason: "ಮೂರುಗಿಂತ ಕಡಿಮೆ ವರದಿಯಾದ ದಿನಗಳಿವೆ. ಸ್ಥಳೀಯ ದರಗಳನ್ನು ಗಮನಿಸಿ; ವಿಶ್ವಾಸಾರ್ಹ ಪ್ರವೃತ್ತಿ ನಿರ್ಧರಿಸಲಾಗುವುದಿಲ್ಲ.",
    openMandi: "ಮಾರುಕಟ್ಟೆ ದರಗಳನ್ನು ನೋಡಿ",
    farmAlertsTitle: "ಹವಾಮಾನ ಆಧಾರಿತ ಕೃಷಿ ಎಚ್ಚರಿಕೆಗಳು", forecastVerified: "ಮುನ್ಸೂಚನೆ ಆಧಾರಿತ",
    generalAdviceLabel: "ಸಾಮಾನ್ಯ ಮಾರ್ಗದರ್ಶನ · ನಿಮ್ಮ ಸ್ಥಳಕ್ಕೆ ಪರಿಶೀಲಿತವಲ್ಲ",
    noActiveFarmAlerts: "ಲಭ್ಯ ಮುನ್ಸೂಚನೆಯಲ್ಲಿ ಎಚ್ಚರಿಕೆ ಮಿತಿ ತಲುಪಿಲ್ಲ. ಸ್ಥಳೀಯ ಸ್ಥಿತಿಗಳನ್ನು ಗಮನಿಸುತ್ತಿರಿ.",
    alertHeavyRainTitle: "ಭಾರಿ ಮಳೆ ನಿರೀಕ್ಷೆ", alertHeavyRainBody: "ಮುನ್ಸೂಚನೆ: {date}ರಂದು {amount} ಮಿಮೀ. ನೀರಾವರಿ ಮುಂದೂಡುವುದನ್ನು ಪರಿಗಣಿಸಿ ಮತ್ತು ಹೊಲದ ಒಳಚರಂಡಿ ಪರಿಶೀಲಿಸಿ.",
    alertRainTitle: "ಮಳೆ ನಿರೀಕ್ಷೆ", alertRainBody: "{date}ರಂದು ಮಳೆಯ ಸಾಧ್ಯತೆ {chance}%. ಅನಗತ್ಯ ನೀರಾವರಿ ತಪ್ಪಿಸಲು ಮೊದಲು ಮಣ್ಣಿನ ತೇವಾಂಶ ಪರಿಶೀಲಿಸಿ.",
    alertRainAmountBody: "{date}ರಂದು ಮುನ್ಸೂಚನೆ: {amount} ಮಿಮೀ. ಅನಗತ್ಯ ನೀರಾವರಿ ತಪ್ಪಿಸಲು ಮೊದಲು ಮಣ್ಣಿನ ತೇವಾಂಶ ಪರಿಶೀಲಿಸಿ.",
    alertHeatTitle: "ಹೆಚ್ಚಿನ ತಾಪಮಾನ ನಿರೀಕ್ಷೆ", alertHeatBody: "{date}ರಂದು ಗರಿಷ್ಠ ತಾಪಮಾನ {temperature}°C. ಬೆಳೆಯ ನೀರಿನ ಅಗತ್ಯ ಗಮನಿಸಿ.",
    alertWindTitle: "ಈಗ ಬಲವಾದ ಗಾಳಿ", alertWindBody: "ವರದಿಯಾದ ಗಾಳಿ {speed} ಕಿಮೀ/ಗಂ. ಬೆಳೆ ಮತ್ತು ಆಸರೆ ರಚನೆಗಳನ್ನು ಪರಿಶೀಲಿಸಿ.",
    generalWeatherAdviceTitle: "ಸಾಮಾನ್ಯ ಹವಾಮಾನ ನೆನಪು",
    generalWeatherAdviceBody: "ನೀರಾವರಿ, ಕೊಯ್ಲು ಅಥವಾ ಹೊಲದ ಕೆಲಸಕ್ಕೂ ಮೊದಲು ಸ್ಥಳೀಯ ಮುನ್ಸೂಚನೆ ಪರಿಶೀಲಿಸಿ. ಈ ಕೃಷಿಗೆ ನೈಜ ಮುನ್ಸೂಚನೆ ಲೋಡ್ ಆಗಿಲ್ಲ.",
    cropRiskTitle: "ಹವಾಮಾನ ಆಧಾರಿತ ಬೆಳೆ ಅಪಾಯ", lowRisk: "ಕಡಿಮೆ ಅಪಾಯ", moderateRisk: "ಮಧ್ಯಮ ಅಪಾಯ", highRisk: "ಹೆಚ್ಚಿನ ಅಪಾಯ",
    riskUnavailable: "ಅಪಾಯ ಸೂಚಕ ಲಭ್ಯವಿಲ್ಲ", riskMethod: "ಈ ಸಾಮಾನ್ಯ ಸೂಚಕವು ಮುನ್ಸೂಚನೆ ಎಚ್ಚರಿಕೆಗಳ ಪ್ರಕಾರಗಳನ್ನು ಎಣಿಸುತ್ತದೆ: ಯಾವುದೂ ಇಲ್ಲ = ಕಡಿಮೆ, ಒಂದು = ಮಧ್ಯಮ, ಎರಡು ಅಥವಾ ಹೆಚ್ಚು = ಹೆಚ್ಚು. ಇದು ಇಳುವರಿ ಅಥವಾ ಬೆಳೆ ನಷ್ಟದ ಮುನ್ಸೂಚನೆಯಲ್ಲ.",
    riskContextNote: "ಸೂಚಕಕ್ಕೆ ಆಯ್ಕೆ ಮಾಡಿದ ಬೆಳೆ, ಉಳಿಸಿದ ಮಣ್ಣಿನ ಪ್ರಕಾರ ಮತ್ತು ನೈಜ ಮುನ್ಸೂಚನೆ ಅಗತ್ಯ. ಇದರ ಮಟ್ಟವು ಸಾಮಾನ್ಯ ಹವಾಮಾನ ಎಚ್ಚರಿಕೆಗಳನ್ನು ಎಣಿಸುತ್ತದೆ; ಹೆಚ್ಚುವರಿ ತೂಕಕ್ಕೆ ಮಾನ್ಯ ಬೆಳೆ-ನಿರ್ದಿಷ್ಟ ಅಥವಾ ಮಣ್ಣಿನ ಪರೀಕ್ಷೆಯ ಮಿತಿಗಳಿಲ್ಲ.",
    riskWeatherUnavailable: "ಈ ಸೂಚಕ ಲೆಕ್ಕಿಸಲು ಬೆಳೆ ಆಯ್ಕೆಮಾಡಿ, ಪ್ರೊಫೈಲ್‌ನಲ್ಲಿ ಮಣ್ಣಿನ ಪ್ರಕಾರ ಉಳಿಸಿ ಮತ್ತು ನೈಜ ಮುನ್ಸೂಚನೆ ಲೋಡ್ ಮಾಡಿ.",
    riskFactorWeather: "ಮುನ್ಸೂಚನೆ ಎಚ್ಚರಿಕೆ: {title}",
    farmCostsTitle: "ಕೃಷಿ ವೆಚ್ಚದ ವಿಶ್ಲೇಷಣೆ", totalInvestment: "ಒಟ್ಟು ಹೂಡಿಕೆ", largestExpense: "ಅತಿದೊಡ್ಡ ವೆಚ್ಚದ ವಿಭಾಗ",
    expenseBreakdown: "ವೆಚ್ಚದ ವಿಭಜನೆ", noExpensesEntered: "ವೆಚ್ಚದ ವಿಭಜನೆ ನೋಡಲು ಲಾಭದ ಲೆಕ್ಕಾಚಾರದಲ್ಲಿ ಅಂದಾಜು ವೆಚ್ಚ ಸೇರಿಸಿ.",
    largestExpenseInsight: "ಒಟ್ಟು ವೆಚ್ಚದಲ್ಲಿ {category} ಅತಿದೊಡ್ಡದು ({share}%).",
    noLargestExpense: "ಇನ್ನೂ ವೆಚ್ಚ ನಮೂದಿಸಿಲ್ಲ.",
    personalizedTitle: "ವೈಯಕ್ತಿಕ ಸಲಹೆಗಳು", priorityHigh: "ಹೆಚ್ಚು", priorityMedium: "ಮಧ್ಯಮ", priorityLow: "ಕಡಿಮೆ",
    weatherRecommendationTitle: "{crop} ಬೆಳೆಗೆ ಹವಾಮಾನ ಪರಿಶೀಲನೆ", weatherRecommendationBody: "{alert} ಹೊಲದ ಕೆಲಸ ಯೋಜಿಸಲು ಮೇಲಿನ ಮುನ್ಸೂಚನೆ ವಿವರ ಬಳಸಿ.",
    weatherRecommendationNoAlert: "ನಿಗದಿತ ಹವಾಮಾನ ಎಚ್ಚರಿಕೆ ಮಿತಿ ತಲುಪಿಲ್ಲ. ಹೊಲದ ಕೆಲಸಕ್ಕೂ ಮೊದಲು ನವೀಕರಿಸಿದ ಮುನ್ಸೂಚನೆ ಗಮನಿಸಿ.",
    weatherRecommendationNoData: "ಮುನ್ಸೂಚನೆ ಆಧಾರಿತ ಮಾರ್ಗದರ್ಶನಕ್ಕಾಗಿ ಹವಾಮಾನ ಸ್ಥಳ ಸೇರಿಸಿ.",
    marketRecommendationTitle: "{crop} ಮಾರುಕಟ್ಟೆ ಪರಿಶೀಲನೆ", marketRecommendationBody: "{recommendation}: {reason}",
    expenseRecommendationTitle: "{category} ವೆಚ್ಚ ಪರಿಶೀಲಿಸಿ", expenseRecommendationBody: "ನಮೂದಿಸಿದ ವೆಚ್ಚದಲ್ಲಿ {category} {share}%. ಸ್ಥಳೀಯ ದರ ಹೋಲಿಸಿ ರಸೀದಿಗಳನ್ನು ಉಳಿಸಿ.",
    expenseRecommendationNoData: "ಕೃಷಿ ವೆಚ್ಚದ ಸಲಹೆಗಾಗಿ ಲಾಭದ ಲೆಕ್ಕಾಚಾರದಲ್ಲಿ ಭೂಮಿ, ಇಳುವರಿ, ಮಾರಾಟ ದರ ಮತ್ತು ವೆಚ್ಚ ನಮೂದಿಸಿ.",
    expenseRecommendationNoCosts: "ಅತಿದೊಡ್ಡ ವೆಚ್ಚ ಗುರುತಿಸಲು ಲಾಭದ ಲೆಕ್ಕಾಚಾರದಲ್ಲಿ ವೆಚ್ಚ ಸೇರಿಸಿ.",
    selectCropForSmartFarm: "ಕೃಷಿ ಸಾರಾಂಶವನ್ನು ವೈಯಕ್ತಿಕಗೊಳಿಸಲು ಬೆಳೆ ಆಯ್ಕೆಮಾಡಿ.",
    noVariety: "ವರದಿಯಾಗಿಲ್ಲ", noPrice: "—", searchStateHelp: "ಸ್ಥಳ ಮತ್ತು ಬೆಳೆ ಆಯ್ಕೆಗಳು ಪಡೆದ ದಾಖಲೆಗಳಿಂದ ಬರುತ್ತವೆ.",
    selectedRows: "ಹೊಂದಿದ ದಾಖಲೆಗಳು", allKarnataka: "ಎಲ್ಲ ಕರ್ನಾಟಕ",
    soilTitle: "ಮಣ್ಣಿನ ವಿವರ", soilSub: "ನಿಮ್ಮ ಹೊಲದ ಮಣ್ಣನ್ನು ಅರ್ಥಮಾಡಿಕೊಳ್ಳಲು ಸರಳ ಮಾರ್ಗದರ್ಶಿ.",
    profitCalculatorEyebrow: "ನಿಮ್ಮ ಕೃಷಿ ಹಂಗಾಮಿನ ಯೋಜನೆ", profitCalculatorTitle: "ರೈತರ ಲಾಭದ ಲೆಕ್ಕಾಚಾರ",
    profitCalculatorSub: "ನಿಮ್ಮ ಹೊಲದ ಅಂದಾಜುಗಳ ಆಧಾರದ ಮೇಲೆ ಬೆಳೆ ಆದಾಯ, ವೆಚ್ಚ ಮತ್ತು ಲಾಭ ಲೆಕ್ಕಿಸಿ.",
    estimateBadge: "ನಿಮ್ಮ ಅಂದಾಜು", cropSelect: "ಬೆಳೆ", chooseCrop: "ಬೆಳೆ ಆಯ್ಕೆಮಾಡಿ",
    cultivatedArea: "ಬೆಳೆದ ಭೂಮಿ (ಎಕರೆ)", expectedYieldPerAcre: "ಎಕರೆಗೆ ನಿರೀಕ್ಷಿತ ಇಳುವರಿ (ಕ್ವಿಂಟಾಲ್)",
    expectedSellingPrice: "ನಿರೀಕ್ಷಿತ ಮಾರಾಟ ದರ (₹ / ಕ್ವಿಂಟಾಲ್)", estimatedExpenses: "ಅಂದಾಜು ವೆಚ್ಚಗಳು (₹)",
    calculatorExpenseHelp: "ಹಂಗಾಮಿನ ಅಂದಾಜು ವೆಚ್ಚಗಳನ್ನು ನಮೂದಿಸಿ; ಬಳಸದ ವೆಚ್ಚಗಳನ್ನು ₹0 ಆಗಿರಿಸಬಹುದು.",
    seedExpense: "ಬೀಜ", fertilizerExpense: "ಗೊಬ್ಬರ", labourExpense: "ಕಾರ್ಮಿಕರು",
    irrigationExpense: "ನೀರಾವರಿ", transportExpense: "ಸಾಗಣೆ", otherExpense: "ಇತರೆ ವೆಚ್ಚಗಳು",
    calculatorResults: "ನಿಮ್ಮ ಅಂದಾಜು ಫಲಿತಾಂಶಗಳು", calculatorPrompt: "ಅಂದಾಜು ನೋಡಲು ಬೆಳೆ ಆಯ್ಕೆಮಾಡಿ ಮತ್ತು ಭೂಮಿ, ಇಳುವರಿ ಹಾಗೂ ಮಾರಾಟ ದರ ನಮೂದಿಸಿ.",
    totalExpectedYield: "ಒಟ್ಟು ನಿರೀಕ್ಷಿತ ಇಳುವರಿ", expectedRevenue: "ಒಟ್ಟು ನಿರೀಕ್ಷಿತ ಆದಾಯ",
    quintals: "ಕ್ವಿಂಟಾಲ್",
    totalExpenses: "ಒಟ್ಟು ವೆಚ್ಚ", estimatedProfit: "ಅಂದಾಜು ಲಾಭ", profitPerAcre: "ಎಕರೆಗೆ ಲಾಭ",
    financialBreakdown: "ಆದಾಯ ಮತ್ತು ವೆಚ್ಚ ಹೋಲಿಕೆ", revenueLabel: "ಆದಾಯ", expensesLabel: "ವೆಚ್ಚಗಳು",
    netProfitLabel: "ನಿವ್ವಳ ಲಾಭ", calculatorDisclaimer: "ಇದು ನಿಮ್ಮ ಅಂದಾಜುಗಳ ಆಧಾರದ ಲೆಕ್ಕ ಮಾತ್ರ; ಖಚಿತ ಆದಾಯವಲ್ಲ. ನಿಜವಾದ ಇಳುವರಿ, ದರ ಮತ್ತು ವೆಚ್ಚಗಳು ಬದಲಾಗಬಹುದು.",
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
  { id: "profit", icon: "₹", key: "profit" },
  { id: "smartFarm", icon: "✳", key: "smartFarm" },
  { id: "soil", icon: "◉", key: "soil" },
  { id: "crops", icon: "❋", key: "crops" },
  { id: "advisory", icon: "✳", key: "advisory" },
  { id: "settings", icon: "⚙", key: "settings" },
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
  const [profitInputs, setProfitInputs] = useState<ProfitInputs>(initialProfitInputs);
  const [mandiSnapshot, setMandiSnapshot] = useState<MandiSnapshot | null>(null);
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

  function updateProfitInput(field: keyof ProfitInputs, value: string) {
    setProfitInputs((current) => ({ ...current, [field]: value }));
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
          {screen === "mandi" && <Mandi t={t} onSnapshot={setMandiSnapshot} />}
          {screen === "profit" && <ProfitCalculator t={t} form={profitInputs} onChange={updateProfitInput} />}
          {screen === "smartFarm" && <SmartFarm t={t} language={language} profile={profile} location={weatherLocation} forecast={weatherForecast} profitInputs={profitInputs} onProfitInputChange={updateProfitInput} mandiSnapshot={mandiSnapshot} navigate={navigate} />}
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

function fillTemplate(template: string, values: Record<string, string>) {
  return Object.entries(values).reduce((message, [key, value]) => message.replace(key, value), template);
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

type FarmWeatherAlert = {
  kind: "heavyRain" | "rain" | "heat" | "wind";
  date: string | null;
  value: number;
  metric: "amount" | "chance" | "temperature" | "speed";
};

function farmWeatherAlerts(forecast: WeatherForecast): FarmWeatherAlert[] {
  const alerts: FarmWeatherAlert[] = [];
  const heavyRainDay = forecast.daily.find((day) => day.precipitation !== null && day.precipitation >= 20);
  if (heavyRainDay?.precipitation !== null && heavyRainDay?.precipitation !== undefined) {
    alerts.push({ kind: "heavyRain", date: heavyRainDay.date, value: heavyRainDay.precipitation, metric: "amount" });
  } else {
    const rainyDay = forecast.daily.find((day) =>
      (day.precipitationProbability ?? 0) >= 30 || (day.precipitation ?? 0) > 0);
    if (rainyDay) {
      const hasRainProbability = rainyDay.precipitationProbability !== null && rainyDay.precipitationProbability >= 30;
      const amount = rainyDay.precipitation ?? 0;
      alerts.push({
        kind: "rain",
        date: rainyDay.date,
        value: hasRainProbability ? rainyDay.precipitationProbability ?? 0 : amount,
        metric: hasRainProbability ? "chance" : "amount",
      });
    }
  }
  const hotDay = forecast.daily.find((day) => day.temperatureMax !== null && day.temperatureMax >= 35);
  if (hotDay?.temperatureMax !== null && hotDay?.temperatureMax !== undefined) {
    alerts.push({ kind: "heat", date: hotDay.date, value: hotDay.temperatureMax, metric: "temperature" });
  }
  if (forecast.current.windSpeed !== null && forecast.current.windSpeed >= 35) {
    alerts.push({ kind: "wind", date: null, value: forecast.current.windSpeed, metric: "speed" });
  }
  return alerts;
}

function farmWeatherAlertCopy(alert: FarmWeatherAlert, t: Translate, language: Language) {
  const titleKey = {
    heavyRain: "alertHeavyRainTitle",
    rain: "alertRainTitle",
    heat: "alertHeatTitle",
    wind: "alertWindTitle",
  } as const;
  const bodyKey: Record<FarmWeatherAlert["kind"], keyof typeof text.en> = {
    heavyRain: "alertHeavyRainBody",
    rain: "alertRainBody",
    heat: "alertHeatBody",
    wind: "alertWindBody",
  } as const;
  const value = new Intl.NumberFormat(language === "en" ? "en-IN" : "kn-IN", { maximumFractionDigits: 1 }).format(alert.value);
  const date = alert.date ? formatMandiDate(alert.date, language) : "";
  const selectedBodyKey = alert.kind === "rain" && alert.metric === "amount"
    ? "alertRainAmountBody"
    : bodyKey[alert.kind];
  const replacements = {
    "{amount}": value,
    "{chance}": value,
    "{temperature}": value,
    "{speed}": value,
    "{date}": date,
  };
  const body = fillTemplate(t(selectedBodyKey), replacements);
  return { title: t(titleKey[alert.kind]), body };
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

function mandiErrorMessage(error: string, t: Translate) {
  const key = error === "missing_credentials" ? "missingMandiKey"
    : error === "credentials_rejected" ? "rejectedMandiKey"
      : error === "network_error" || error === "upstream_unavailable" ? "mandiNetworkError"
        : error === "invalid_upstream_response" || error === "unrecognized_upstream_fields" || error === "invalid_response" ? "mandiSchemaError"
          : "mandiUpstreamError";
  return t(key);
}

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

function formatMandiDate(value: string, language: Language) {
  const date = new Date(`${value}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(language === "en" ? "en-IN" : "kn-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatPrice(value: number | null) {
  return value === null ? "—" : `₹${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(value)}`;
}

function dailyModalPrices(records: MandiRecord[], commodity: string) {
  const pricesByDate = new Map<string, { total: number; count: number }>();
  for (const record of records) {
    if (record.commodity !== commodity || record.modalPrice === null || !Number.isFinite(record.modalPrice) || record.modalPrice < 0) continue;
    const daily = pricesByDate.get(record.arrivalDate) ?? { total: 0, count: 0 };
    daily.total += record.modalPrice;
    daily.count += 1;
    pricesByDate.set(record.arrivalDate, daily);
  }
  return Array.from(pricesByDate, ([date, daily]) => ({
    date,
    modalPrice: daily.total / daily.count,
  })).sort((a, b) => a.date.localeCompare(b.date));
}

type FarmPricePoint = { date: string; modalPrice: number };
type FarmPriceAnalysis = {
  current: FarmPricePoint | null;
  previous: FarmPricePoint | null;
  percentageChange: number | null;
  trend: "trendInsufficient" | "trendIncreasing" | "trendDecreasing" | "trendStable";
  recommendation: "monitorMarket" | "waitMarket" | "sellNow";
  reason: "marketInsufficientReason" | "waitMarketReason" | "sellNowReason" | "monitorMarketReason";
};

function farmCropMatchesCommodity(crop: string, commodity: string) {
  const aliases: Record<string, string[]> = {
    cropRice: ["paddy", "rice"],
    cropRagi: ["ragi"],
    cropMaize: ["maize"],
    cropPulses: ["pulses"],
  };
  const normalizedCommodity = commodity.toLocaleLowerCase();
  return (aliases[crop] ?? []).some((alias) => normalizedCommodity.includes(alias));
}

function analyzeFarmPrices(history: FarmPricePoint[]): FarmPriceAnalysis {
  const current = history.at(-1) ?? null;
  const previous = history.at(-2) ?? null;
  const percentageChange = current && previous && previous.modalPrice !== 0
    ? ((current.modalPrice - previous.modalPrice) / previous.modalPrice) * 100
    : null;
  const trend = percentageChange === null
    ? "trendInsufficient"
    : percentageChange > 1 ? "trendIncreasing"
      : percentageChange < -1 ? "trendDecreasing"
        : "trendStable";
  const latestThree = history.slice(-3);
  const consistentlyIncreasing = latestThree.length === 3 &&
    latestThree[0].modalPrice < latestThree[1].modalPrice &&
    latestThree[1].modalPrice < latestThree[2].modalPrice;
  const consistentlyDecreasing = latestThree.length === 3 &&
    latestThree[0].modalPrice > latestThree[1].modalPrice &&
    latestThree[1].modalPrice > latestThree[2].modalPrice;
  const recommendation = history.length < 3
    ? "monitorMarket"
    : consistentlyIncreasing ? "waitMarket"
      : consistentlyDecreasing ? "sellNow"
        : "monitorMarket";
  const reason = history.length < 3
    ? "marketInsufficientReason"
    : consistentlyIncreasing ? "waitMarketReason"
      : consistentlyDecreasing ? "sellNowReason"
        : "monitorMarketReason";
  return { current, previous, percentageChange, trend, recommendation, reason };
}

const demoFarmPriceHistory: FarmPricePoint[] = [
  { date: "demo-1", modalPrice: 2050 },
  { date: "demo-2", modalPrice: 2115 },
  { date: "demo-3", modalPrice: 2180 },
];

function SellWaitAdvisor({ t, records, commodity }: PageProps & { records: MandiRecord[]; commodity: string }) {
  const history = commodity ? dailyModalPrices(records, commodity) : [];
  const current = history.at(-1);
  const previous = history.at(-2);
  const recentThree = history.slice(-3);
  const isRising = recentThree.length === 3 && recentThree[0].modalPrice < recentThree[1].modalPrice && recentThree[1].modalPrice < recentThree[2].modalPrice;
  const isFalling = recentThree.length === 3 && recentThree[0].modalPrice > recentThree[1].modalPrice && recentThree[1].modalPrice > recentThree[2].modalPrice;
  const recommendation = history.length < 3
    ? "recommendationInsufficient"
    : isRising ? "recommendationMonitor"
      : isFalling ? "recommendationSell"
        : "recommendationNoSignal";
  const trend = history.length < 2
    ? "trendInsufficient"
    : history.length < 3 && current && previous && current.modalPrice > previous.modalPrice
      ? "trendRising"
      : history.length < 3 && current && previous && current.modalPrice < previous.modalPrice
        ? "trendFalling"
        : isRising ? "trendRising"
          : isFalling ? "trendFalling"
            : "trendMixed";
  const explanation = history.length < 3
    ? "adviceInsufficient"
    : isRising ? "adviceMonitor"
      : isFalling ? "adviceSell"
        : "adviceNoSignal";
  const change = current && previous && previous.modalPrice !== 0
    ? ((current.modalPrice - previous.modalPrice) / previous.modalPrice) * 100
    : null;
  const locale = languageOf(t) === "en" ? "en-IN" : "kn-IN";
  const changeLabel = change === null
    ? t("noPrice")
    : `${new Intl.NumberFormat(locale, { signDisplay: "exceptZero", minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(change)}%`;
  const visibleHistory = history.slice(-5);
  const maximumPrice = Math.max(1, ...visibleHistory.map((point) => point.modalPrice));

  return <section className="panel sell-wait-advisor">
    <div className="sell-wait-heading">
      <div><div className="eyebrow">{t("priceAdvisory")}</div><h2>{t("sellWaitTitle")}{commodity ? ` · ${commodity}` : ""}</h2><p>{t("sellWaitSub")}</p></div>
      <span className="sell-wait-icon" aria-hidden="true">↗</span>
    </div>
    {!commodity
      ? <p className="sell-wait-message">{t("selectCropForAdvisor")}</p>
      : !history.length
        ? <p className="sell-wait-message">{t("noAdvisorPrices")}</p>
        : <>
          <div className="sell-wait-metrics">
            <div><span>{t("currentReportedPrice")}</span><strong>{formatPrice(current?.modalPrice ?? null)}</strong>{current && <small>{formatMandiDate(current.date, languageOf(t) === "en" ? "en" : "kn")}</small>}</div>
            <div><span>{t("previousReportedPrice")}</span><strong>{formatPrice(previous?.modalPrice ?? null)}</strong>{previous && <small>{formatMandiDate(previous.date, languageOf(t) === "en" ? "en" : "kn")}</small>}</div>
            <div><span>{t("priceChange")}</span><strong className={change === null ? "" : change > 0 ? "advisor-up" : change < 0 ? "advisor-down" : ""}>{changeLabel}</strong></div>
          </div>
          <div className="sell-wait-result">
            <div className="sell-wait-result-heading"><span className={`trend-indicator ${isRising ? "rising" : isFalling ? "falling" : ""}`}>{isRising ? "↑" : isFalling ? "↓" : "→"}</span><div><small>{t("trend")}: {t(trend)}</small><strong>{t(recommendation)}</strong></div></div>
            <p>{t(explanation)}</p>
          </div>
          <div className="sell-wait-history">
            <strong>{t("reportedPriceHistory")}</strong>
            <div className="sell-wait-bars" role="img" aria-label={t("reportedPriceHistory")}>
              {visibleHistory.map((point) => <div className="sell-wait-bar" key={point.date}>
                <span>{formatPrice(point.modalPrice)}</span>
                <i style={{ height: `${Math.max(8, point.modalPrice / maximumPrice * 100)}%` }} />
                <small>{formatMandiDate(point.date, languageOf(t) === "en" ? "en" : "kn")}</small>
              </div>)}
            </div>
          </div>
        </>}
    <p className="sell-wait-disclaimer">{t("reportedPriceMethod")}</p>
  </section>;
}

function Mandi({ t, onSnapshot }: PageProps & { onSnapshot: (snapshot: MandiSnapshot | null) => void }) {
  const [records, setRecords] = useState<MandiRecord[]>([]);
  const [catalogRecords, setCatalogRecords] = useState<MandiRecord[]>([]);
  const [stateOptions, setStateOptions] = useState<string[]>([]);
  const [selectedState, setSelectedState] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedMarket, setSelectedMarket] = useState("");
  const [selectedCommodity, setSelectedCommodity] = useState("");
  const [commodityQuery, setCommodityQuery] = useState("");
  const [commodityMenuOpen, setCommodityMenuOpen] = useState(false);
  const [sortAscending, setSortAscending] = useState(true);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [total, setTotal] = useState(0);
  const [fetchedAt, setFetchedAt] = useState("");
  const [refreshCount, setRefreshCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function loadRecords() {
      setLoading(true);
      setError("");
      try {
        const response = await fetchMandiRecords({}, controller.signal);
        if (controller.signal.aborted) return;
        setRecords(response.records);
        setCatalogRecords(response.records);
        setStateOptions(uniqueSorted(response.records.map((record) => record.state)));
        setTotal(response.total);
        setFetchedAt(response.fetchedAt);
        const preferredState = response.records.some((record) => record.state.toLocaleLowerCase() === "karnataka")
          ? response.records.find((record) => record.state.toLocaleLowerCase() === "karnataka")?.state ?? ""
          : uniqueSorted(response.records.map((record) => record.state))[0] ?? "";
        setSelectedState(preferredState);
      } catch (caught) {
        if (controller.signal.aborted) return;
        console.error("Could not load AGMARKNET market options.", caught);
        setError(caught instanceof MandiServiceError ? caught.code : "invalid_response");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          setLoaded(true);
        }
      }
    }
    void loadRecords();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!loaded || !selectedState) return;
    onSnapshot(null);
    const controller = new AbortController();
    async function loadFilteredRecords() {
      setLoading(true);
      setError("");
      setRecords([]);
      try {
        const response = await fetchMandiRecords({
          state: selectedState,
          district: selectedDistrict || undefined,
          market: selectedMarket || undefined,
          commodity: selectedCommodity || undefined,
        }, controller.signal);
        if (controller.signal.aborted) return;
        setRecords(response.records);
        setTotal(response.total);
        setFetchedAt(response.fetchedAt);
        setCatalogRecords((current) => [...current, ...response.records]);
        if (selectedCommodity) onSnapshot({ commodity: selectedCommodity, records: response.records, fetchedAt: response.fetchedAt });
      } catch (caught) {
        if (controller.signal.aborted) return;
        console.error("Could not load filtered AGMARKNET prices.", caught);
        setError(caught instanceof MandiServiceError ? caught.code : "invalid_response");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void loadFilteredRecords();
    return () => controller.abort();
  }, [loaded, selectedState, selectedDistrict, selectedMarket, selectedCommodity, refreshCount, onSnapshot]);

  const knownRecords = [...catalogRecords, ...records];
  const districts = uniqueSorted(knownRecords.filter((record) => record.state === selectedState).map((record) => record.district));
  const markets = uniqueSorted(knownRecords.filter((record) =>
    record.state === selectedState && (!selectedDistrict || record.district === selectedDistrict),
  ).map((record) => record.market));
  const commodities = uniqueSorted(knownRecords.filter((record) =>
    record.state === selectedState &&
    (!selectedDistrict || record.district === selectedDistrict) &&
    (!selectedMarket || record.market === selectedMarket),
  ).map((record) => record.commodity));
  const matchingCommodities = commodities.filter((commodity) => commodity.toLocaleLowerCase().includes(commodityQuery.trim().toLocaleLowerCase()));
  const sortedRecords = [...records].sort((a, b) => b.arrivalDate.localeCompare(a.arrivalDate));

  const comparisonByMarket = new Map<string, MandiRecord>();
  for (const record of sortedRecords) {
    if (!selectedCommodity || record.commodity !== selectedCommodity) continue;
    if (record.modalPrice !== null && !comparisonByMarket.has(record.market)) comparisonByMarket.set(record.market, record);
  }
  const comparisons = Array.from(comparisonByMarket.values()).sort((a, b) => {
    if (sortAscending) return (a.modalPrice ?? 0) - (b.modalPrice ?? 0);
    return (b.modalPrice ?? 0) - (a.modalPrice ?? 0);
  });
  const highestPrice = comparisons.reduce<MandiRecord | null>((highest, record) =>
    record.modalPrice !== null && (highest?.modalPrice === null || highest?.modalPrice === undefined || record.modalPrice > highest.modalPrice) ? record : highest,
  null);
  const lowestPrice = comparisons.reduce<MandiRecord | null>((lowest, record) =>
    record.modalPrice !== null && (lowest?.modalPrice === null || lowest?.modalPrice === undefined || record.modalPrice < lowest.modalPrice) ? record : lowest,
  null);

  const availableDates = uniqueSorted(records.map((record) => record.arrivalDate)).sort();
  const defaultTo = availableDates.at(-1) ?? "";
  const defaultFrom = availableDates[Math.max(0, availableDates.length - 7)] ?? "";
  const activeFrom = dateFrom || defaultFrom;
  const activeTo = dateTo || defaultTo;
  const historyByDate = new Map<string, { sum: number; count: number }>();
  for (const record of records) {
    if (!selectedCommodity || record.commodity !== selectedCommodity || record.modalPrice === null || record.arrivalDate < activeFrom || record.arrivalDate > activeTo) continue;
    const current = historyByDate.get(record.arrivalDate) ?? { sum: 0, count: 0 };
    current.sum += record.modalPrice;
    current.count += 1;
    historyByDate.set(record.arrivalDate, current);
  }
  const historyValues = Array.from(historyByDate.entries()).map(([date, value]) => ({ date, modalPrice: value.sum / value.count }));
  const maximumHistoryPrice = Math.max(1, ...historyValues.map((entry) => entry.modalPrice));
  const missingDates: string[] = [];
  if (activeFrom && activeTo && activeFrom <= activeTo) {
    const cursor = new Date(`${activeFrom}T12:00:00Z`);
    const end = new Date(`${activeTo}T12:00:00Z`);
    while (cursor <= end && missingDates.length <= 31) {
      const current = cursor.toISOString().slice(0, 10);
      if (!historyByDate.has(current)) missingDates.push(current);
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
  }
  const updatedLabel = fetchedAt
    ? new Date(fetchedAt).toLocaleString(languageOf(t) === "en" ? "en-IN" : "kn-IN", { dateStyle: "medium", timeStyle: "short" })
    : "";

  function chooseCommodity(value: string) {
    setSelectedCommodity(value);
    setCommodityQuery(value);
    setCommodityMenuOpen(false);
    setDateFrom("");
    setDateTo("");
  }

  return <>
    <PageHeading eyebrow={t("marketBoard")} title={t("mandiTitle")} description={t("mandiSub")} t={t} badge="AGMARKNET" badgeKind="source" />
    <section className="panel mandi-filter-panel">
      <div className="mandi-filters">
        <label>{t("state")}<select value={selectedState} disabled={loading && stateOptions.length === 0} onChange={(event) => {
          setSelectedState(event.target.value); setSelectedDistrict(""); setSelectedMarket(""); chooseCommodity("");
        }}><option value="">{t("selectState")}</option>{stateOptions.map((state) => <option value={state} key={state}>{state}</option>)}</select></label>
        <label>{t("districtLabel")}<select value={selectedDistrict} disabled={!selectedState} onChange={(event) => {
          setSelectedDistrict(event.target.value); setSelectedMarket(""); chooseCommodity("");
        }}><option value="">{t("selectDistrict")}</option>{districts.map((district) => <option value={district} key={district}>{district}</option>)}</select></label>
        <label>{t("market")}<select value={selectedMarket} disabled={!selectedState} onChange={(event) => {
          setSelectedMarket(event.target.value); chooseCommodity("");
        }}><option value="">{t("selectMarket")}</option>{markets.map((market) => <option value={market} key={market}>{market}</option>)}</select></label>
        <div className="commodity-picker"><label htmlFor="commodity-search">{t("searchCrop")}</label><input id="commodity-search" role="combobox" aria-expanded={commodityMenuOpen} aria-controls="commodity-options" aria-autocomplete="list" value={commodityQuery} placeholder={t("cropSearchPlaceholder")} onFocus={() => setCommodityMenuOpen(true)} onChange={(event) => {
          setCommodityQuery(event.target.value); setSelectedCommodity(""); setCommodityMenuOpen(true);
        }} onKeyDown={(event) => {
          if (event.key === "Escape") setCommodityMenuOpen(false);
          if (event.key === "Enter" && matchingCommodities.length) { event.preventDefault(); chooseCommodity(matchingCommodities[0]); }
        }} />
          {commodityMenuOpen && <div className="commodity-options" id="commodity-options" role="listbox">{matchingCommodities.length
            ? matchingCommodities.slice(0, 30).map((commodity) => <button type="button" role="option" aria-selected={selectedCommodity === commodity} key={commodity} onMouseDown={(event) => event.preventDefault()} onClick={() => chooseCommodity(commodity)}>{commodity}</button>)
            : <span>{t("noCrops")}</span>}</div>}
        </div>
      </div>
      <div className="mandi-filter-foot"><span>ⓘ &nbsp;{t("searchStateHelp")}</span><button className="button button-outline" onClick={() => setRefreshCount((count) => count + 1)} disabled={loading}>{loading ? <><span className="spinner" />{t("refreshingPrices")}</> : <>↻ &nbsp;{t("refreshPrices")}</>}</button></div>
    </section>
    <div className="mandi-source-line"><span>◉ &nbsp;{t("marketApiSource")}</span>{updatedLabel && <span>{t("lastUpdatedMandi")}: {updatedLabel}</span>}{total > 0 && <span>{total.toLocaleString()} {t("selectedRows")}</span>}</div>
    {error && <div className="mandi-error" role="alert"><strong>{t("mandiErrorTitle")}</strong><p>{mandiErrorMessage(error, t)}</p>{error === "missing_credentials" && <code>DATA_GOV_IN_API_KEY</code>}</div>}
    {!loading && !error && <SellWaitAdvisor t={t} records={records} commodity={selectedCommodity} />}
    {loading && <div className="mandi-loading panel" role="status"><span className="spinner" />{t("loadingMarkets")}</div>}
    {!loading && !error && !records.length && <div className="mandi-empty panel"><span>⌕</span><h2>{loaded ? t("noDataForFilters") : t("noMarketData")}</h2></div>}
    {!loading && !error && records.length > 0 && <>
      <section className="panel table-panel mandi-table-panel"><div className="table-heading"><div><h2>{selectedCommodity || t("mandiTitle")}</h2><p>{records.length} {t("selectedRows")}</p></div><span className="source-badge demo-badge">AGMARKNET</span></div>
        <div className="table-scroll"><table><thead><tr><th>{t("commodity")}</th><th>{t("market")}</th><th>{t("districtLabel")}</th><th>{t("variety")}</th><th>{t("arrivalDate")}</th><th>{t("minPrice")}</th><th>{t("maxPrice")}</th><th>{t("modalPrice")}</th></tr></thead><tbody>{sortedRecords.slice(0, 250).map((record, index) => <tr key={`${record.arrivalDate}-${record.market}-${record.commodity}-${record.variety}-${index}`}><td>{record.commodity}</td><td>{record.market}</td><td>{record.district}</td><td>{record.variety || t("noVariety")}</td><td>{formatMandiDate(record.arrivalDate, languageOf(t) === "en" ? "en" : "kn")}</td><td>{formatPrice(record.minPrice)}</td><td>{formatPrice(record.maxPrice)}</td><td className="price-cell">{formatPrice(record.modalPrice)}</td></tr>)}</tbody></table></div>
        <div className="table-footnote"><span>ⓘ</span>{t("sourceUnitNote")}</div>
      </section>
      <section className="panel mandi-comparison"><div className="mandi-section-heading"><div><div className="eyebrow">{selectedState}</div><h2>{t("compareMarkets")}{selectedCommodity ? ` · ${selectedCommodity}` : ""}</h2></div><button className="button button-outline" onClick={() => setSortAscending((ascending) => !ascending)}>{t("sortByModal")}: {t(sortAscending ? "ascending" : "descending")}</button></div>
        {comparisons.length > 0 ? <div className="comparison-grid">{comparisons.map((record, index) => <article className="comparison-card" key={`${record.market}-${record.arrivalDate}`}><div><strong>{record.market}</strong><small>{record.district}</small></div><b className={index === 0 ? "comparison-low" : index === comparisons.length - 1 ? "comparison-high" : ""}>{formatPrice(record.modalPrice)}</b><span>{t("minPrice")}: {formatPrice(record.minPrice)} · {t("maxPrice")}: {formatPrice(record.maxPrice)}</span><small>{t("arrivalDate")}: {formatMandiDate(record.arrivalDate, languageOf(t) === "en" ? "en" : "kn")}</small></article>)}</div> : <p className="mandi-history-empty">{selectedCommodity ? t("noCompareData") : t("chooseCropForCompare")}</p>}
        {highestPrice && lowestPrice && highestPrice.market !== lowestPrice.market && <div className="price-advisory"><div><strong>{t("highestReported")}</strong><span>{highestPrice.market} · {formatPrice(highestPrice.modalPrice)}</span></div><div><strong>{t("lowestReported")}</strong><span>{lowestPrice.market} · {formatPrice(lowestPrice.modalPrice)}</span></div></div>}
        <p className="transport-warning">{t("transportNote")}</p>
      </section>
      <section className="panel mandi-history"><div className="mandi-section-heading"><div><div className="eyebrow">{selectedCommodity || t("commodity")}</div><h2>{t("priceHistory")}</h2></div><div className="date-filters"><label>{t("fromDate")}<input type="date" min={availableDates[0]} max={defaultTo} value={dateFrom || defaultFrom} onChange={(event) => setDateFrom(event.target.value)} /></label><label>{t("toDate")}<input type="date" min={availableDates[0]} max={defaultTo} value={dateTo || defaultTo} onChange={(event) => setDateTo(event.target.value)} /></label></div></div>
        {historyValues.length > 0 ? <div className="history-bars" role="img" aria-label={t("priceHistory")}>{historyValues.map((entry) => <div className="history-point" key={entry.date}><strong>{formatPrice(entry.modalPrice)}</strong><span><i style={{ height: `${Math.max(8, entry.modalPrice / maximumHistoryPrice * 100)}%` }} /></span><small>{formatMandiDate(entry.date, languageOf(t) === "en" ? "en" : "kn")}</small></div>)}</div> : <p className="mandi-history-empty">{t("noHistory")}</p>}
        {missingDates.length > 0 && <div className="missing-date-note"><strong>{t("missingDates")}:</strong> {missingDates.map((date) => formatMandiDate(date, languageOf(t) === "en" ? "en" : "kn")).join(", ")}{missingDates.length > 31 ? "…" : ""}</div>}
        <p className="history-method">{t("sourceUnitNote")}</p>
      </section>
    </>}
  </>;
}

function formatRupees(value: number) {
  return `₹${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(value)}`;
}

const expenseFields: { field: Exclude<keyof ProfitInputs, "crop" | "area" | "yieldPerAcre" | "salePrice">; label: keyof typeof text.en }[] = [
  { field: "seedExpense", label: "seedExpense" },
  { field: "fertilizerExpense", label: "fertilizerExpense" },
  { field: "labourExpense", label: "labourExpense" },
  { field: "irrigationExpense", label: "irrigationExpense" },
  { field: "transportExpense", label: "transportExpense" },
  { field: "otherExpense", label: "otherExpense" },
];

function calculateFarmProfit(inputs: ProfitInputs) {
  const area = Number(inputs.area);
  const yieldPerAcre = Number(inputs.yieldPerAcre);
  const salePrice = Number(inputs.salePrice);
  const expenseValues = expenseFields.map(({ field }) => {
    const value = inputs[field].trim();
    return value ? Number(value) : 0;
  });
  const inputsPresent = Boolean(inputs.crop && inputs.area.trim() && inputs.yieldPerAcre.trim() && inputs.salePrice.trim());
  const expenseTotal = expenseValues.reduce((total, value) => total + value, 0);
  const totalYield = area * yieldPerAcre;
  const revenue = totalYield * salePrice;
  const profit = revenue - expenseTotal;
  const perAcreProfit = profit / area;
  const valid = inputsPresent &&
    Number.isFinite(area) && area > 0 &&
    [yieldPerAcre, salePrice, ...expenseValues].every((value) => Number.isFinite(value) && value >= 0) &&
    [expenseTotal, totalYield, revenue, profit, perAcreProfit].every(Number.isFinite);
  return {
    valid,
    totalYield: valid ? totalYield : 0,
    revenue: valid ? revenue : 0,
    totalExpenses: valid ? expenseTotal : 0,
    profit: valid ? profit : 0,
    profitPerAcre: valid ? perAcreProfit : 0,
    expenseBreakdown: expenseFields.map((expense, index) => ({
      ...expense,
      amount: valid ? expenseValues[index] : 0,
    })),
  };
}

function ProfitCalculator({ t, form, onChange }: PageProps & {
  form: ProfitInputs;
  onChange: (field: keyof ProfitInputs, value: string) => void;
}) {
  const cropOptions = [
    { value: "cropRice", label: t("cropRice") },
    { value: "cropRagi", label: t("cropRagi") },
    { value: "cropMaize", label: t("cropMaize") },
    { value: "cropPulses", label: t("cropPulses") },
  ];

  function update(field: keyof ProfitInputs, value: string) {
    onChange(field, value);
  }

  const calculation = calculateFarmProfit(form);
  const validInputs = calculation.valid;
  const { totalYield, revenue, totalExpenses: expenses, profit, profitPerAcre: perAcreProfit } = calculation;
  const chartMaximum = Math.max(revenue, expenses, Math.abs(profit), 1);
  const metrics = [
    { label: "totalExpectedYield" as const, value: validInputs ? new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(totalYield) : "—", unit: validInputs ? t("quintals") : "", negative: false },
    { label: "expectedRevenue" as const, value: validInputs ? formatRupees(revenue) : "—", unit: "", negative: false },
    { label: "totalExpenses" as const, value: validInputs ? formatRupees(expenses) : "—", unit: "", negative: false },
    { label: "estimatedProfit" as const, value: validInputs ? formatRupees(profit) : "—", unit: "", negative: profit < 0 },
    { label: "profitPerAcre" as const, value: validInputs ? formatRupees(perAcreProfit) : "—", unit: "", negative: perAcreProfit < 0 },
  ];
  const chartItems = [
    { label: "revenueLabel" as const, value: revenue, className: "revenue" },
    { label: "expensesLabel" as const, value: expenses, className: "expenses" },
    { label: "netProfitLabel" as const, value: profit, className: "net-profit", negative: profit < 0 },
  ];

  return <>
    <PageHeading eyebrow={t("profitCalculatorEyebrow")} title={t("profitCalculatorTitle")} description={t("profitCalculatorSub")} t={t} badge={t("estimateBadge")} badgeKind="source" />
    <div className="profit-layout">
      <section className="panel profit-input-panel">
        <div className="panel-heading"><div><div className="eyebrow">{t("cropSelect")}</div><h2>{t("profitCalculatorTitle")}</h2></div><span className="profile-illustration">₹</span></div>
        <div className="profit-input-grid">
          <label className="profit-crop-field" htmlFor="profit-crop">{t("cropSelect")}<select id="profit-crop" value={form.crop} onChange={(event) => update("crop", event.target.value)} required>
            <option value="">{t("chooseCrop")}</option>{cropOptions.map((crop) => <option value={crop.value} key={crop.value}>{crop.label}</option>)}
          </select></label>
          <label htmlFor="profit-area">{t("cultivatedArea")}<input id="profit-area" type="number" min="0.01" step="any" value={form.area} onChange={(event) => update("area", event.target.value)} placeholder="e.g. 2.5" required /></label>
          <label htmlFor="profit-yield">{t("expectedYieldPerAcre")}<input id="profit-yield" type="number" min="0" step="any" value={form.yieldPerAcre} onChange={(event) => update("yieldPerAcre", event.target.value)} placeholder="e.g. 12" required /></label>
          <label htmlFor="profit-price">{t("expectedSellingPrice")}<input id="profit-price" type="number" min="0" step="any" value={form.salePrice} onChange={(event) => update("salePrice", event.target.value)} placeholder="e.g. 2500" required /></label>
        </div>
        <div className="profit-expenses-heading"><div><h3>{t("estimatedExpenses")}</h3><p>{t("calculatorExpenseHelp")}</p></div></div>
        <div className="profit-input-grid profit-expenses-grid">{expenseFields.map(({ field, label }) => <label htmlFor={`profit-${field}`} key={field}>{t(label)}<input id={`profit-${field}`} type="number" min="0" step="any" value={form[field]} onChange={(event) => update(field, event.target.value)} /></label>)}</div>
      </section>

      <section className="panel profit-results-panel">
        <div className="panel-heading"><div><div className="eyebrow">{t("estimateBadge")}</div><h2>{t("calculatorResults")}</h2></div><span className="profit-result-icon">✳</span></div>
        {!validInputs && <p className="profit-prompt">{t("calculatorPrompt")}</p>}
        <div className="profit-metrics">{metrics.map((metric) => <article className="profit-metric" key={metric.label}>
          <span>{t(metric.label)}</span><strong className={metric.negative ? "profit-negative" : ""}>{metric.value}</strong>{metric.unit && <small>{metric.unit}</small>}
        </article>)}</div>
        {validInputs && <div className="profit-chart">
          <h3>{t("financialBreakdown")}</h3>
          {chartItems.map((item) => <div className="profit-chart-row" key={item.label}>
            <div className="profit-chart-label"><span>{t(item.label)}</span><strong className={item.negative ? "profit-negative" : ""}>{formatRupees(item.value)}</strong></div>
            <div className="profit-chart-track" role="img" aria-label={`${t(item.label)}: ${formatRupees(item.value)}`}><i className={`${item.className}${item.negative ? " negative" : ""}`} style={{ width: `${Math.abs(item.value) / chartMaximum * 100}%` }} /></div>
          </div>)}
        </div>}
        <p className="profit-disclaimer">{t("calculatorDisclaimer")}</p>
      </section>
    </div>
  </>;
}

function SmartFarm({ t, language, profile, location, forecast, profitInputs, onProfitInputChange, mandiSnapshot, navigate }: PageProps & {
  language: Language;
  profile: FarmerProfile | null;
  location: WeatherLocation | null;
  forecast: WeatherForecast | null;
  profitInputs: ProfitInputs;
  onProfitInputChange: (field: keyof ProfitInputs, value: string) => void;
  mandiSnapshot: MandiSnapshot | null;
  navigate: (screen: Screen) => void;
}) {
  const cropOptions = [
    { value: "cropRice", label: t("cropRice") },
    { value: "cropRagi", label: t("cropRagi") },
    { value: "cropMaize", label: t("cropMaize") },
    { value: "cropPulses", label: t("cropPulses") },
  ];
  const selectedCrop = cropOptions.find((crop) => crop.value === profitInputs.crop);
  const cropName = selectedCrop?.label ?? t("chooseCrop");
  const soilLabels: Record<string, keyof typeof text.en> = {
    "Red soil": "typeRed",
    "Black soil": "typeBlack",
    "Sandy soil": "typeSandy",
    "Loamy soil": "typeLoamy",
  };
  const soilName = profile?.soil && soilLabels[profile.soil] ? t(soilLabels[profile.soil]) : t("noFarmSoil");
  const isMatchingMarketSnapshot = Boolean(
    selectedCrop && mandiSnapshot && farmCropMatchesCommodity(selectedCrop.value, mandiSnapshot.commodity),
  );
  const realPriceHistory = isMatchingMarketSnapshot && mandiSnapshot
    ? dailyModalPrices(mandiSnapshot.records, mandiSnapshot.commodity)
    : [];
  const isDemoMarket = realPriceHistory.length === 0;
  const priceHistory = isDemoMarket && selectedCrop ? demoFarmPriceHistory : realPriceHistory;
  const marketAnalysis = analyzeFarmPrices(priceHistory);
  const priceChangeLabel = marketAnalysis.percentageChange === null
    ? t("noPrice")
    : `${new Intl.NumberFormat(language === "en" ? "en-IN" : "kn-IN", {
      signDisplay: "exceptZero",
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(marketAnalysis.percentageChange)}%`;
  const recentPrices = priceHistory.slice(-5);
  const maximumMarketPrice = Math.max(1, ...recentPrices.map((point) => point.modalPrice));
  const alerts = forecast ? farmWeatherAlerts(forecast) : [];
  const availableWeatherValues = Boolean(forecast && (
    forecast.current.windSpeed !== null ||
    forecast.daily.some((day) => day.precipitation !== null || day.precipitationProbability !== null || day.temperatureMax !== null)
  ));
  const riskKey = !selectedCrop || !profile?.soil || !availableWeatherValues
    ? "riskUnavailable"
    : alerts.length === 0 ? "lowRisk"
      : alerts.length === 1 ? "moderateRisk"
        : "highRisk";
  const riskWidth = riskKey === "lowRisk" ? "24%" : riskKey === "moderateRisk" ? "60%" : riskKey === "highRisk" ? "100%" : "0%";
  const calculation = calculateFarmProfit(profitInputs);
  const largestExpense = calculation.expenseBreakdown.reduce<typeof calculation.expenseBreakdown[number] | null>(
    (largest, expense) => expense.amount > (largest?.amount ?? 0) ? expense : largest,
    null,
  );
  const largestExpenseShare = largestExpense && calculation.totalExpenses > 0
    ? largestExpense.amount / calculation.totalExpenses * 100
    : 0;
  const maximumExpense = Math.max(1, ...calculation.expenseBreakdown.map((expense) => expense.amount));
  const weatherAlertCopy = alerts.map((alert) => ({ alert, ...farmWeatherAlertCopy(alert, t, language) }));
  const samplePeriodKeys = ["samplePeriodOne", "samplePeriodTwo", "samplePeriodThree"] as const;
  const recommendations = [
    {
      icon: "☁",
      title: fillTemplate(t("weatherRecommendationTitle"), { "{crop}": cropName }),
      body: !forecast
        ? t("weatherRecommendationNoData")
        : weatherAlertCopy.length
          ? fillTemplate(t("weatherRecommendationBody"), { "{alert}": `${weatherAlertCopy[0].title}: ${weatherAlertCopy[0].body}` })
          : t("weatherRecommendationNoAlert"),
      priority: !forecast || !weatherAlertCopy.length ? "priorityLow" as const : alerts[0].kind === "heavyRain" ? "priorityHigh" as const : "priorityMedium" as const,
    },
    {
      icon: "↗",
      title: fillTemplate(t("marketRecommendationTitle"), { "{crop}": cropName }),
      body: !selectedCrop
        ? t("selectCropForSmartFarm")
        : fillTemplate(t("marketRecommendationBody"), {
          "{recommendation}": t(isDemoMarket ? "monitorMarket" : marketAnalysis.recommendation),
          "{reason}": t(isDemoMarket ? "marketSampleReason" : marketAnalysis.reason),
        }),
      priority: !selectedCrop || isDemoMarket || priceHistory.length < 3 ? "priorityLow" as const : "priorityMedium" as const,
    },
    {
      icon: "₹",
      title: largestExpense
        ? fillTemplate(t("expenseRecommendationTitle"), { "{category}": t(largestExpense.label) })
        : t("farmCostsTitle"),
      body: !calculation.valid
        ? t("expenseRecommendationNoData")
        : largestExpense && calculation.totalExpenses > 0
          ? fillTemplate(t("expenseRecommendationBody"), {
            "{category}": t(largestExpense.label),
            "{share}": new Intl.NumberFormat(language === "en" ? "en-IN" : "kn-IN", { maximumFractionDigits: 1 }).format(largestExpenseShare),
          })
          : t("expenseRecommendationNoCosts"),
      priority: largestExpenseShare >= 50 ? "priorityMedium" as const : "priorityLow" as const,
    },
  ];
  const marketRecommendationReason = !selectedCrop ? t("selectCropForSmartFarm")
    : isDemoMarket ? t("samplePriceExplanation")
      : marketAnalysis.reason === "marketInsufficientReason" ? t("marketInsufficientReason")
        : t("reportedPriceMethod");

  return <>
    <PageHeading eyebrow={t("smartFarmEyebrow")} title={t("smartFarmTitle")} description={t("smartFarmSub")} t={t} badge={t("smartFarmOverview")} badgeKind="source" />
    <section className="panel smart-farm-context">
      <label htmlFor="smart-farm-crop">{t("cropSelect")}<select id="smart-farm-crop" value={profitInputs.crop} onChange={(event) => onProfitInputChange("crop", event.target.value)}>
        <option value="">{t("chooseCrop")}</option>{cropOptions.map((crop) => <option value={crop.value} key={crop.value}>{crop.label}</option>)}
      </select></label>
      <div><span>{t("soilChoice")}</span><strong>{soilName}</strong><small>{profile?.soil ? t("profileSoilNote") : t("noProfile")}</small></div>
      <div><span>{t("locationUnset")}</span><strong>{profile ? `${profile.village}, ${profile.district}` : location?.name ?? t("noProfile")}</strong><small>{location ? locationLabel(location) : t("noForecastForFarm")}</small></div>
    </section>

    <div className="smart-farm-grid">
      <section className="panel smart-farm-weather">
        <div className="smart-farm-panel-heading"><div><div className="eyebrow">{t("weatherTitle")}</div><h2>{t("todayForecast")}</h2></div>{forecast && <span className="live-tag"><i />{t("live")}</span>}</div>
        {forecast ? <>
          <div className="smart-current-weather">
            <div><span>{t("currentTemperature")}</span><strong>{forecast.current.temperature ?? "—"}°C</strong></div>
            <div><span>{t("rainfall")}</span><strong>{forecast.current.precipitation ?? "—"} mm</strong></div>
            <div><span>{t("wind")}</span><strong>{forecast.current.windSpeed ?? "—"} km/h</strong></div>
          </div>
          <div className="smart-forecast-days">{forecast.daily.slice(0, 3).map((day) => <div key={day.date}>
            <strong>{formatMandiDate(day.date, language)}</strong><span>{t("high")} {day.temperatureMax ?? "—"}° · {t("low")} {day.temperatureMin ?? "—"}°</span>
            <small>{t("expectedRain")}: {day.precipitation ?? "—"} mm · {t("rainChance")}: {day.precipitationProbability ?? "—"}%</small>
          </div>)}</div>
        </> : <p className="smart-farm-empty">{t("noForecastForFarm")}</p>}
      </section>

      <section className="panel smart-farm-market">
        <div className="smart-farm-panel-heading"><div><div className="eyebrow">{t("marketCard")}</div><h2>{t("latestMandiAverage")}</h2></div>
          <span className={`demo-badge ${isDemoMarket ? "" : "source-badge"}`}><i />{isDemoMarket ? t("demoPriceLabel") : "AGMARKNET"}</span>
        </div>
        {!selectedCrop
          ? <p className="smart-farm-empty">{t("selectCropForSmartFarm")}</p>
          : <>
            <div className="smart-market-prices">
              <div><span>{t("currentReportedPrice")}</span><strong>{formatPrice(marketAnalysis.current?.modalPrice ?? null)}</strong>{marketAnalysis.current && <small>{isDemoMarket ? t("samplePeriodThree") : formatMandiDate(marketAnalysis.current.date, language)}</small>}</div>
              <div><span>{t("previousReportedPrice")}</span><strong>{formatPrice(marketAnalysis.previous?.modalPrice ?? null)}</strong>{marketAnalysis.previous && <small>{isDemoMarket ? t("samplePeriodTwo") : formatMandiDate(marketAnalysis.previous.date, language)}</small>}</div>
              <div><span>{t("priceChange")}</span><strong>{priceChangeLabel}</strong></div>
            </div>
            <div className="smart-market-trend"><span>{t("trend")}: <strong>{t(marketAnalysis.trend)}</strong></span>
              <strong>{t(isDemoMarket ? "monitorMarket" : marketAnalysis.recommendation)}</strong></div>
            <p className="smart-market-reason">{isDemoMarket ? t("marketSampleReason") : t(marketAnalysis.reason)}</p>
            <div className="smart-price-history" aria-label={t("reportedPriceHistory")}>{recentPrices.map((point, index) => <div key={`${point.date}-${index}`}>
              <span>{formatPrice(point.modalPrice)}</span>
              <i style={{ height: `${Math.max(8, point.modalPrice / maximumMarketPrice * 100)}%` }} />
              <small>{isDemoMarket ? t(samplePeriodKeys[index] ?? "samplePeriodThree") : formatMandiDate(point.date, language)}</small>
            </div>)}</div>
            {isDemoMarket ? <p className="smart-market-demo-note">{t("demoPriceLabel")}. {t("samplePriceExplanation")}</p> : <p className="smart-market-demo-note">{mandiSnapshot?.commodity} · {marketRecommendationReason}</p>}
            <button className="text-link" onClick={() => navigate("mandi")}>{t("openMandi")} <span>→</span></button>
          </>}
      </section>

      <section className="panel smart-farm-risk">
        <div className="smart-farm-panel-heading"><div><div className="eyebrow">{t("cropRiskTitle")}</div><h2>{t(riskKey)}</h2></div><span className={`risk-mark ${riskKey === "highRisk" ? "risk-high" : riskKey === "moderateRisk" ? "risk-moderate" : riskKey === "lowRisk" ? "risk-low" : ""}`}>{riskKey === "riskUnavailable" ? "—" : riskKey === "highRisk" || riskKey === "moderateRisk" ? "!" : "✓"}</span></div>
        <div className="risk-meter"><i className={riskKey === "highRisk" ? "risk-high" : riskKey === "moderateRisk" ? "risk-moderate" : "risk-low"} style={{ width: riskWidth }} /></div>
        <ul className="risk-factors">{riskKey === "riskUnavailable"
          ? <li><span>i</span><div><strong>{t("riskUnavailable")}</strong><small>{t("riskWeatherUnavailable")}</small></div></li>
          : alerts.length
          ? weatherAlertCopy.map(({ alert, title, body }) => <li key={`${alert.kind}-${alert.date ?? "current"}`}><span>!</span><div><strong>{title}</strong><small>{body}</small></div></li>)
          : <li><span>i</span><div><strong>{t("lowRisk")}</strong><small>{t("noActiveFarmAlerts")}</small></div></li>}
        </ul>
        <p className="risk-method-note">{t("riskContextNote")} {t("riskMethod")}</p>
      </section>

      <section className="panel smart-farm-alerts">
        <div className="smart-farm-panel-heading"><div><div className="eyebrow">{t("farmAlertsTitle")}</div><h2>{t("todayForecast")}</h2></div><span className={`demo-badge ${forecast ? "source-badge" : ""}`}><i />{forecast ? t("forecastVerified") : t("generalAdviceLabel")}</span></div>
        {forecast && alerts.length
          ? <ul className="farm-alert-list">{weatherAlertCopy.map(({ alert, title, body }) => <li key={`${alert.kind}-${alert.date ?? "current"}`}><span className="farm-alert-icon">!</span><div><strong>{title}</strong><p>{body}</p></div><b>{t(alert.kind === "heavyRain" ? "priorityHigh" : "priorityMedium")}</b></li>)}</ul>
          : <div className="general-weather-note"><strong>{t(forecast ? "noActiveFarmAlerts" : "generalWeatherAdviceTitle")}</strong><p>{t(forecast ? "noActiveFarmAlerts" : "generalWeatherAdviceBody")}</p></div>}
      </section>

      <section className="panel smart-farm-expenses">
        <div className="smart-farm-panel-heading"><div><div className="eyebrow">{t("farmCostsTitle")}</div><h2>{t("calculatorResults")}</h2></div><button className="button button-outline" onClick={() => navigate("profit")}>{t("profit")} <span>→</span></button></div>
        <div className="farm-finance-metrics">
          {[{ label: "totalInvestment" as const, value: calculation.valid ? formatRupees(calculation.totalExpenses) : "—" },
            { label: "expectedRevenue" as const, value: calculation.valid ? formatRupees(calculation.revenue) : "—" },
            { label: "estimatedProfit" as const, value: calculation.valid ? formatRupees(calculation.profit) : "—", negative: calculation.profit < 0 },
            { label: "profitPerAcre" as const, value: calculation.valid ? formatRupees(calculation.profitPerAcre) : "—", negative: calculation.profitPerAcre < 0 }].map((metric) =>
            <div key={metric.label}><span>{t(metric.label)}</span><strong className={metric.negative ? "profit-negative" : ""}>{metric.value}</strong></div>)}
        </div>
        {calculation.valid ? <>
          {largestExpense && largestExpenseShare > 0 && <p className="largest-expense-insight">{fillTemplate(t("largestExpenseInsight"), {
            "{category}": t(largestExpense.label),
            "{share}": new Intl.NumberFormat(language === "en" ? "en-IN" : "kn-IN", { maximumFractionDigits: 1 }).format(largestExpenseShare),
          })}</p>}
          <div className="farm-expense-breakdown">{calculation.expenseBreakdown.map((expense) => <div key={expense.field}>
            <div><span>{t(expense.label)}</span><strong>{formatRupees(expense.amount)}</strong></div>
            <i><b style={{ width: `${expense.amount / maximumExpense * 100}%` }} /></i>
          </div>)}</div>
          {!largestExpense && <p className="smart-farm-empty">{t("noExpensesEntered")}</p>}
        </> : <p className="smart-farm-empty">{t("expenseRecommendationNoData")}</p>}
      </section>

      <section className="panel smart-farm-recommendations">
        <div className="smart-farm-panel-heading"><div><div className="eyebrow">{t("smartFarmEyebrow")}</div><h2>{t("personalizedTitle")}</h2></div><span className="profile-illustration">✳</span></div>
        <div className="farm-recommendation-list">{recommendations.map((recommendation, index) => <article key={index}>
          <span className="farm-rec-icon">{recommendation.icon}</span>
          <div><div className="farm-rec-heading"><strong>{recommendation.title}</strong><small className={`priority-label ${recommendation.priority}`}>{t(recommendation.priority)}</small></div><p>{recommendation.body}</p></div>
        </article>)}</div>
      </section>
    </div>
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
