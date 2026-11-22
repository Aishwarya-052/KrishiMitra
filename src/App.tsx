import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  fetchWeatherForecast,
  searchWeatherLocations,
  WeatherServiceError,
  type WeatherForecast,
  type WeatherLocation,
} from "./weatherService";
import {
  createSampleMandiRecords,
  fetchMandiRecords,
  INDIAN_STATES_AND_UTS,
  type MandiRecord,
} from "./mandiService";
import GovtSchemesFinder from "./GovtSchemesFinder";
import SmartIrrigationScheduler from "./SmartIrrigationScheduler";

type Screen = "dashboard" | "weather" | "mandi" | "profit" | "smartFarm" | "irrigation" | "soil" | "crops" | "rotation" | "cropDoctor" | "schemes" | "advisory" | "settings";
type Language = "en" | "kn" | "hi" | "te" | "ta" | "mr";
type LocalizedCopy<T> = Partial<Record<Language, T>> & { en: T };
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
type MandiDataSource = "live" | "cached" | "sample" | "sample-cached";
type MandiSnapshot = { commodity: string; records: MandiRecord[]; fetchedAt: string; dataSource: MandiDataSource };
type ChatMessage = { from: "farmer" | "mitra"; text: string; language?: Language };
type CachedWeather = { locationId: string; forecast: WeatherForecast; timestamp: string };
type CachedMandiPrices = { records: MandiRecord[]; timestamp: string };

const PROFILE_KEY = "krishimitra-farmer-profile";
const WEATHER_LOCATION_KEY = "krishimitra-weather-location";
const WEATHER_CACHE_KEY = "krishimitra-weather-cache";
const MANDI_CACHE_KEY = "krishimitra-mandi-cache";
const CROP_DOCTOR_CACHE_KEY = "krishimitra-crop-doctor-cache";
const FARM_EXPENSE_LEDGER_KEY = "krishimitra-farm-expense-ledger";
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
    dashboard: "Dashboard", weather: "Weather", mandi: "Mandi prices", profit: "Profit calculator", smartFarm: "Smart Farm", irrigationPlanner: "Irrigation planner", soil: "Soil profile",
    cropDoctor: "Crop Doctor", schemes: "Schemes & Subsidies",
    crops: "Crop suggestions", cropRotation: "Crop rotation planner", advisory: "Advisory chat", settings: "Settings",
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
    mandiTitle: "Mandi prices", mandiSub: "Indian & state market prices, with sample records clearly labelled.",
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
    marketApiSource: "Government of India · AGMARKNET", sampleCachedMandiData: "Sample / Cached AGMARKNET Data",
    sampleDataSource: "Illustrative built-in dataset · not live or government-reported",
    mixedDataSource: "Illustrative records plus any saved AGMARKNET cache",
    cachedPriceExplanation: "Previously fetched AGMARKNET records are being shown from this device's cache. They may not reflect current prices.",
    lastUpdatedMandi: "Last updated",
    dataRows: "Records returned", mandiErrorTitle: "Could not load market data",
    missingMandiKey: "Add your data.gov.in API key to the server's .env file, then restart it.",
    rejectedMandiKey: "data.gov.in rejected this API key. Check that it is active and allowed for this resource.",
    mandiNetworkError: "Could not reach the market service. Check your internet connection and try again.",
    mandiUpstreamError: "The data.gov.in service is temporarily unavailable. Please try again later.",
    mandiSchemaError: "The dataset response format is not recognised. No prices are displayed.",
    refreshPrices: "Refresh prices", refreshingPrices: "Refreshing…", compareMarkets: "Compare markets in selected state",
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
    postHarvestEyebrow: "HARVEST & STORAGE",
    postHarvestTitle: "Post-harvest & spoilage risk advisor",
    postHarvestSub: "A rough storage-planning estimate using the current outdoor temperature and humidity.",
    postHarvestCrop: "Harvested crop", postHarvestMethod: "Storage method",
    postHarvestWindow: "Estimated safe storage window", postHarvestRisk: "Spoilage risk",
    postHarvestAction: "Action tip", postHarvestSellImmediately: "Sell Immediately",
    postHarvestSafeToStore: "Safe to Store", postHarvestWeatherUnavailable: "Load current weather with both temperature and humidity to calculate an estimate.",
    postHarvestRiskHigh: "High", postHarvestRiskModerate: "Moderate", postHarvestRiskLow: "Low",
    postHarvestSellTip: "Conditions indicate a short estimated window. Prioritise selling or processing and inspect the lot; do not rely on the estimate.",
    postHarvestStoreTip: "The estimate allows short-term storage. Keep produce dry and ventilated, and inspect it regularly.",
    postHarvestModelNote: "Prototype rule: for open sheds and gunny bags, the baseline window is shortened at 30/35°C and 70/80% humidity; cold storage gets only a small outdoor-weather adjustment.",
    postHarvestEstimateNote: "Illustrative screening only—not a validated shelf-life prediction. Assumes sound harvest, fresh chilli, dry paddy/ragi grain, and cured onion/potato; actual life depends on curing, drying, handling, pests, and conditions inside the store. A cold-storage estimate assumes a functioning facility; outdoor weather does not measure its internal conditions.",
    postHarvestShareMessage: "KrishiMitra post-harvest estimate\nCrop: {crop}\nStorage method: {method}\nCurrent outdoor temperature: {temperature}°C\nCurrent outdoor humidity: {humidity}%\nEstimated safe window: {days} days\nSpoilage risk: {risk}\nAction: {action}\nIllustrative estimate only, not a shelf-life guarantee.",
    postHarvestCropOnion: "Onion", postHarvestCropPotato: "Potato",
    storageOpenShed: "Open Shed", storageGunnyBags: "Gunny Bags", storageColdStorage: "Cold Storage",
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
    selectedRows: "matching records", allKarnataka: "All India",
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
    transportPoolingTitle: "Shared transport & bulk input pooling",
    transportPoolingSub: "Estimate the per-farmer transport saving using the actual vehicle fare for one trip.",
    harvestQuantity: "Your harvest quantity (quintals)", distanceToMandi: "Distance to Mandi (km)",
    neighborFarmers: "Neighboring farmers joining (1–5)", vehicleFare: "Actual vehicle fare per trip (₹)",
    destinationMandi: "Destination Mandi", individualTransportCost: "Individual trip cost",
    pooledTransportCost: "Your pooled share", transportSavings: "Savings per farmer",
    totalSharingFarmers: "{count} farmers total, including you.",
    transportPoolingAssumption: "Assumes each farmer would otherwise pay the same full-trip fare, the fare is split equally across you and the neighbors, and the vehicle has safe capacity for the combined harvest. Confirm fare, capacity and stops with the driver.",
    transportInviteMessage: "Looking for {count} {farmerUnit} near {village} to share a goods vehicle to {mandi} tomorrow. I have {quantity} quintals; the Mandi is about {distance} km away.",
    farmerUnitSingular: "farmer", farmerUnitPlural: "farmers",
    villageForInvite: "Your village", invitePreview: "WhatsApp invite preview",
    transportInviteMissing: "Add the village and destination Mandi to prepare the invite message.",
    soilHealth: "SOIL HEALTH SNAPSHOT", soilType: "Soil type", phLevel: "pH level", organicMatter: "Organic matter",
    nitrogen: "Nitrogen", phosphorus: "Phosphorus", potassium: "Potassium",
    soilTipTitle: "A small soil-care reminder", soilTip: "A soil test from a recognised local lab is the best way to plan nutrients for your own field.",
    cropTitle: "Crop suggestions", cropSub: "Ideas inspired by the sample profile — confirm suitability locally.",
    recommended: "IDEAS TO EXPLORE", season: "Kharif season", duration: "Crop duration", waterNeed: "Water need",
    learnMore: "Why this crop?", cropTip: "Crop ideas are illustrative demo suggestions, not agricultural advice for your location.",
    advisoryTitle: "Ask KrishiMitra", advisorySub: "A friendly place to explore common farming questions.",
    demoChat: "DEMO ADVISORY", chatWelcome: "Namaskara! I’m your demo farming companion. Ask a general question, or choose a prompt below.",
    chatPlaceholder: "Ask a general farming question…", send: "Send", prompts: "TRY A SAMPLE QUESTION",
    reply: "These topic-based suggestions use the information available in your profile and app. They are general guidance, not a confirmed diagnosis or a guaranteed outcome.",
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
    close: "Close", menu: "Open menu", more: "More", prototype: "Prototype", percent: "percent", acres: "acres",
    liveDataStatus: "🟢 Live Data", offlineDataStatus: "🟡 Offline Mode • Cached", cachedData: "CACHED",
    shareWhatsapp: "Share on WhatsApp",
    listenToSummary: "Listen / Read Aloud", stopReading: "Stop reading", speechUnavailable: "Speech is not available in this browser.", speechError: "Speech playback failed. Check browser audio settings and try again.",
    profitSpeechSummary: "{crop}. Total expected yield: {yield} quintals. Revenue: {revenue}. Expenses: {expenses}. Estimated profit: {profit}. Profit per acre: {perAcre}. This is an estimate, not a guaranteed return.",
    profitShareMessage: "KrishiMitra farmer profit estimate\nCrop: {crop}\nExpected yield: {yield} quintals\nExpected revenue: {revenue}\nTotal expenses: {expenses}\nEstimated profit: {profit}\nProfit per acre: {perAcre}\nThis is an estimate based on entered values, not a guaranteed return.",
    mandiShareMessage: "KrishiMitra mandi summary\nCrop: {crop}\nLatest reported modal price: {current}\nPrevious reported modal price: {previous}\nPrice change: {change}\nRecent trend: {trend}\nGuidance: {recommendation}\nPast reported prices are not a forecast or guarantee.",
    cropDoctorShareMessage: "KrishiMitra crop screening\nCrop: {crop}\nObserved symptom: {symptom}\nPossible issue: {diagnosis}\nInitial severity: {severity}\nImmediate action: {organic}\nChemical option: {chemical}\nPrevention: {prevention}\nThis is a screening possibility, not a confirmed diagnosis. Confirm locally before treatment.",
    turDal: "Tur dal", sampleMarket: "Mysuru sample market", nearNeutral: "Near neutral",
    sampleLevel: "Sample level", medium: "Medium", good: "Good", dayUnit: "days",
    waterLowMedium: "Low–medium", waterLow: "Low", waterMedium: "Medium", waterHigh: "High",
    cropDoctorTitle: "Crop Doctor / Symptom Checker",
    cropDoctorSub: "Select a crop and visible symptoms to see cautious possibilities and next steps.",
    cropDoctorGuide: "FIELD SCREENING GUIDE", cropDoctorCrop: "Select crop", cropDoctorSymptoms: "Select visible symptoms",
    cropDoctorChooseCrop: "Choose a crop", cropDoctorChooseSymptoms: "Choose one or more tags that match what you see.",
    cropDoctorPossibleIssue: "Possible issue to inspect", cropDoctorSeverity: "Initial severity",
    cropDoctorOrganic: "Immediate organic remedy / action", cropDoctorChemical: "Chemical option (only if confirmed)",
    cropDoctorPrevention: "Prevention and monitoring", cropDoctorNoSelection: "Select a crop and at least one symptom to see possible causes.",
    cropDoctorClearSymptoms: "Clear symptoms",
    cropDoctorDisclaimer: "This visual screening guide cannot diagnose a crop. Several problems look alike; severity is an initial triage cue, not a measured assessment. Confirm with your local KVK or agriculture officer before treatment.",
    cropDoctorSafety: "Use only products currently registered and labeled for this crop and confirmed target. Follow the label, protective equipment, re-entry and pre-harvest instructions. No dose or brand is provided.",
    cropDoctorYellowing: "Yellowing leaves", cropDoctorBrownSpots: "Brown spots", cropDoctorLeafCurling: "Leaf curling",
    cropDoctorWilting: "Wilting", cropDoctorWhitePowder: "White powder or growth", cropDoctorBorerHoles: "Stem or fruit borer holes",
    cropDoctorTomato: "Tomato", cropDoctorCotton: "Cotton", cropDoctorChilli: "Chilli",
    cropDoctorOrganicYellow: "Check soil moisture, drainage and the leaf underside. Correct nutrients only after checking local conditions; use neem only if sucking pests are visible and the crop label permits it.",
    cropDoctorOrganicSpots: "Remove badly affected leaves and crop residue; avoid wetting foliage. These steps support hygiene but do not guarantee a cure.",
    cropDoctorOrganicCurl: "Inspect leaf undersides and remove badly affected leaves. Neem may help some visible soft-bodied pests when permitted by the crop label, but cannot cure a virus.",
    cropDoctorOrganicWilt: "Check soil moisture and drainage; isolate and remove confirmed wilted plants with roots. Avoid applying unverified mixtures to the soil.",
    cropDoctorOrganicPowder: "Remove affected leaves and improve airflow. Check that the growth is not dust or spray residue before treating.",
    cropDoctorOrganicBorer: "Remove and destroy infested plant parts; use a pheromone trap only when suitable for the identified pest and crop.",
    cropDoctorPreventYellow: "Scout regularly, maintain suitable drainage and use balanced nutrients based on local soil guidance.",
    cropDoctorPreventSpots: "Remove crop residues, allow airflow and avoid prolonged leaf wetness where practical.",
    cropDoctorPreventCurl: "Check leaf undersides for vectors, remove weeds or volunteer hosts and monitor nearby plants.",
    cropDoctorPreventWilt: "Use clean tools, avoid moving contaminated soil and seek local advice on rotation and drainage.",
    cropDoctorPreventPowder: "Space plants for airflow, remove affected residue and scout nearby plants for early symptoms.",
    cropDoctorPreventBorer: "Scout for eggs and fresh entry holes; remove infested parts and use pest-specific monitoring traps where advised.",
    cropDoctorChemicalNone: "No chemical is recommended from this symptom alone. Check water, nutrients and pest presence first; seek confirmation before spraying.",
    cropDoctorChemicalFungicide: "If a fungal disease is confirmed, ask your local KVK or agriculture officer for a product currently registered for this crop and disease. Follow its label.",
    cropDoctorChemicalInsecticide: "If the named insect is confirmed, use only a currently registered product whose label lists this crop and pest; get local advice and follow the label.",
    cropDoctorChemicalVector: "If whiteflies or thrips are confirmed, local advice may identify a registered vector-control product. It cannot cure virus-infected plants; follow the product label.",
    cropDoctorChemicalBorer: "If a borer is confirmed, ask your local KVK or agriculture officer for a product currently registered for this crop and pest. Follow its label.",
  },
  kn: {
    dashboard: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್", weather: "ಹವಾಮಾನ", mandi: "ಮಾರುಕಟ್ಟೆ ದರ", profit: "ಲಾಭದ ಲೆಕ್ಕಾಚಾರ", smartFarm: "ಸ್ಮಾರ್ಟ್ ಕೃಷಿ", irrigationPlanner: "ನೀರಾವರಿ ಯೋಜಕ", soil: "ಮಣ್ಣಿನ ವಿವರ",
    cropDoctor: "ಬೆಳೆ ವೈದ್ಯ", schemes: "ಸರ್ಕಾರಿ ಯೋಜನೆಗಳು",
    crops: "ಬೆಳೆ ಸಲಹೆಗಳು", cropRotation: "ಬೆಳೆ ಪರಿವರ್ತನೆ ಯೋಜಕ", advisory: "ಸಲಹೆ ಚಾಟ್", settings: "ಸೆಟ್ಟಿಂಗ್‌ಗಳು",
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
    mandiTitle: "ಮಾರುಕಟ್ಟೆ ದರಗಳು", mandiSub: "ಭಾರತೀಯ ಮತ್ತು ರಾಜ್ಯದ ಮಾರುಕಟ್ಟೆ ದರಗಳು; ಮಾದರಿ ದಾಖಲೆಗಳನ್ನು ಸ್ಪಷ್ಟವಾಗಿ ಗುರುತಿಸಲಾಗಿದೆ.",
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
    marketApiSource: "ಭಾರತ ಸರ್ಕಾರ · ಅಗ್ಮಾರ್ಕ್‌ನೆಟ್", sampleCachedMandiData: "ಮಾದರಿ / ಸಂಗ್ರಹಿತ AGMARKNET ಮಾಹಿತಿ",
    sampleDataSource: "ಉದಾಹರಣೆಯಾಗಿ ಸೇರಿಸಿದ ಮಾಹಿತಿ · ನೈಜ ಅಥವಾ ಸರ್ಕಾರಿ ವರದಿಯಲ್ಲ",
    mixedDataSource: "ಉದಾಹರಣೆಯ ದಾಖಲೆಗಳು ಮತ್ತು ಉಳಿಸಿದ AGMARKNET ಸಂಗ್ರಹ",
    cachedPriceExplanation: "ಈ ಸಾಧನದಲ್ಲಿ ಉಳಿಸಿದ ಹಿಂದಿನ AGMARKNET ದಾಖಲೆಗಳನ್ನು ತೋರಿಸಲಾಗುತ್ತಿದೆ. ಅವು ಪ್ರಸ್ತುತ ದರಗಳಾಗಿರಬೇಕೆಂದಿಲ್ಲ.",
    lastUpdatedMandi: "ಕೊನೆಯ ನವೀಕರಣ",
    dataRows: "ಪಡೆದ ದಾಖಲೆಗಳು", mandiErrorTitle: "ಮಾರುಕಟ್ಟೆ ಮಾಹಿತಿ ಲೋಡ್ ಆಗಲಿಲ್ಲ",
    missingMandiKey: "ಸರ್ವರ್‌ನ .env ಕಡತಕ್ಕೆ data.gov.in API ಕೀ ಸೇರಿಸಿ, ನಂತರ ಸರ್ವರ್ ಮರುಪ್ರಾರಂಭಿಸಿ.",
    rejectedMandiKey: "data.gov.in ಈ API ಕೀಯನ್ನು ತಿರಸ್ಕರಿಸಿದೆ. ಅದು ಸಕ್ರಿಯವಾಗಿದೆಯೇ ಮತ್ತು ಈ ಮಾಹಿತಿಗೆ ಅನುಮತಿದೆಯೇ ಪರಿಶೀಲಿಸಿ.",
    mandiNetworkError: "ಮಾರುಕಟ್ಟೆ ಸೇವೆಯನ್ನು ತಲುಪಲಾಗಲಿಲ್ಲ. ಇಂಟರ್ನೆಟ್ ಪರಿಶೀಲಿಸಿ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
    mandiUpstreamError: "data.gov.in ಸೇವೆ ತಾತ್ಕಾಲಿಕವಾಗಿ ಲಭ್ಯವಿಲ್ಲ. ಸ್ವಲ್ಪ ಸಮಯದ ನಂತರ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
    mandiSchemaError: "ಮಾಹಿತಿಯ ಪ್ರತಿಕ್ರಿಯೆಯ ರೂಪ ಗುರುತಿಸಲಾಗಲಿಲ್ಲ. ಯಾವುದೇ ದರ ತೋರಿಸಲಾಗುವುದಿಲ್ಲ.",
    refreshPrices: "ದರಗಳನ್ನು ನವೀಕರಿಸಿ", refreshingPrices: "ನವೀಕರಿಸಲಾಗುತ್ತಿದೆ…", compareMarkets: "ಆಯ್ಕೆ ಮಾಡಿದ ರಾಜ್ಯದ ಮಾರುಕಟ್ಟೆಗಳನ್ನು ಹೋಲಿಸಿ",
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
    postHarvestEyebrow: "ಕೊಯ್ಲು ಮತ್ತು ಸಂಗ್ರಹ",
    postHarvestTitle: "ಕೊಯ್ಲಿನ ನಂತರದ ಸಂಗ್ರಹ ಮತ್ತು ಹಾಳಾಗುವ ಅಪಾಯ",
    postHarvestSub: "ಪ್ರಸ್ತುತ ಹೊರಾಂಗಣ ತಾಪಮಾನ ಮತ್ತು ತೇವಾಂಶ ಆಧರಿಸಿದ ಸ್ಥೂಲ ಸಂಗ್ರಹ ಯೋಜನೆ ಅಂದಾಜು.",
    postHarvestCrop: "ಕೊಯ್ಲು ಮಾಡಿದ ಬೆಳೆ", postHarvestMethod: "ಸಂಗ್ರಹ ವಿಧಾನ",
    postHarvestWindow: "ಅಂದಾಜು ಸುರಕ್ಷಿತ ಸಂಗ್ರಹ ಅವಧಿ", postHarvestRisk: "ಹಾಳಾಗುವ ಅಪಾಯ",
    postHarvestAction: "ಕ್ರಮದ ಸಲಹೆ", postHarvestSellImmediately: "ತಕ್ಷಣ ಮಾರಾಟ ಮಾಡಿ",
    postHarvestSafeToStore: "ಸಂಗ್ರಹಿಸಬಹುದು", postHarvestWeatherUnavailable: "ಅಂದಾಜಿಗೆ ತಾಪಮಾನ ಮತ್ತು ತೇವಾಂಶ ಎರಡನ್ನೂ ಹೊಂದಿರುವ ಇಂದಿನ ಹವಾಮಾನ ಲೋಡ್ ಮಾಡಿ.",
    postHarvestRiskHigh: "ಹೆಚ್ಚು", postHarvestRiskModerate: "ಮಧ್ಯಮ", postHarvestRiskLow: "ಕಡಿಮೆ",
    postHarvestSellTip: "ಸ್ಥಿತಿಗಳು ಕಡಿಮೆ ಅಂದಾಜು ಅವಧಿಯನ್ನು ಸೂಚಿಸುತ್ತವೆ. ಬೇಗ ಮಾರಾಟ ಅಥವಾ ಸಂಸ್ಕರಣೆಗೆ ಆದ್ಯತೆ ನೀಡಿ ಮತ್ತು ಸಂಗ್ರಹವನ್ನು ಪರಿಶೀಲಿಸಿ; ಅಂದಾಜಿನ ಮೇಲೆ ಮಾತ್ರ ಅವಲಂಬಿಸಬೇಡಿ.",
    postHarvestStoreTip: "ಅಂದಾಜು ಅಲ್ಪಾವಧಿ ಸಂಗ್ರಹಕ್ಕೆ ಅವಕಾಶ ನೀಡುತ್ತದೆ. ಉತ್ಪನ್ನವನ್ನು ಒಣ ಮತ್ತು ಗಾಳಿಯಾಡುವ ಸ್ಥಿತಿಯಲ್ಲಿ ಇಟ್ಟು ನಿಯಮಿತವಾಗಿ ಪರಿಶೀಲಿಸಿ.",
    postHarvestModelNote: "ಮಾದರಿ ನಿಯಮ: ತೆರೆದ ಶೆಡ್ ಮತ್ತು ಗೋಣಿ ಚೀಲಗಳಿಗೆ 30/35°C ತಾಪಮಾನ ಹಾಗೂ 70/80% ತೇವಾಂಶದಲ್ಲಿ ಮೂಲ ಅವಧಿ ಕಡಿಮೆಯಾಗುತ್ತದೆ; ಶೀತಗೃಹಕ್ಕೆ ಹೊರಾಂಗಣ ಹವಾಮಾನದ ಸಣ್ಣ ಬದಲಾವಣೆ ಮಾತ್ರ ಅನ್ವಯಿಸುತ್ತದೆ.",
    postHarvestEstimateNote: "ಇದು ಉದಾಹರಣೆಯ ಪರಿಶೀಲನೆ ಮಾತ್ರ; ದೃಢೀಕೃತ ಶೆಲ್ಫ್-ಲೈಫ್ ಮುನ್ಸೂಚನೆಯಲ್ಲ. ಉತ್ತಮ ಸ್ಥಿತಿಯ ಕೊಯ್ಲು, ತಾಜಾ ಮೆಣಸಿನಕಾಯಿ, ಒಣ ಭತ್ತ/ರಾಗಿ ಧಾನ್ಯ ಮತ್ತು ಒಣಗಿಸಿದ ಈರುಳ್ಳಿ/ಆಲೂಗಡ್ಡೆ ಎಂದು ಊಹಿಸುತ್ತದೆ; ನಿಜವಾದ ಅವಧಿ ಒಣಗಿಸುವಿಕೆ, ನಿರ್ವಹಣೆ, ಕೀಟಗಳು ಮತ್ತು ಸಂಗ್ರಹದ ಒಳಗಿನ ಸ್ಥಿತಿಗಳ ಮೇಲೆ ಅವಲಂಬಿತ. ಕೋಲ್ಡ್ ಸ್ಟೋರೇಜ್ ಅಂದಾಜು ಸರಿಯಾಗಿ ಕಾರ್ಯನಿರ್ವಹಿಸುವ ಸೌಲಭ್ಯವನ್ನು ಊಹಿಸುತ್ತದೆ; ಹೊರಾಂಗಣ ಹವಾಮಾನವು ಅದರ ಒಳಗಿನ ಸ್ಥಿತಿಯನ್ನು ಅಳೆಯುವುದಿಲ್ಲ.",
    postHarvestShareMessage: "ಕೃಷಿಮಿತ್ರ ಕೊಯ್ಲಿನ ನಂತರದ ಅಂದಾಜು\nಬೆಳೆ: {crop}\nಸಂಗ್ರಹ ವಿಧಾನ: {method}\nಪ್ರಸ್ತುತ ಹೊರಾಂಗಣ ತಾಪಮಾನ: {temperature}°C\nಪ್ರಸ್ತುತ ಹೊರಾಂಗಣ ತೇವಾಂಶ: {humidity}%\nಅಂದಾಜು ಸುರಕ್ಷಿತ ಅವಧಿ: {days} ದಿನಗಳು\nಹಾಳಾಗುವ ಅಪಾಯ: {risk}\nಕ್ರಮ: {action}\nಇದು ಉದಾಹರಣೆಯ ಅಂದಾಜು ಮಾತ್ರ; ಶೆಲ್ಫ್-ಲೈಫ್ ಖಾತರಿಯಲ್ಲ.",
    postHarvestCropOnion: "ಈರುಳ್ಳಿ", postHarvestCropPotato: "ಆಲೂಗಡ್ಡೆ",
    storageOpenShed: "ತೆರೆದ ಶೆಡ್", storageGunnyBags: "ಗೋಣಿ ಚೀಲಗಳು", storageColdStorage: "ಶೀತಗೃಹ",
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
    selectedRows: "ಹೊಂದಿದ ದಾಖಲೆಗಳು", allKarnataka: "ಎಲ್ಲ ಭಾರತ",
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
    transportPoolingTitle: "ಹಂಚಿಕೊಂಡ ಸಾರಿಗೆ ಮತ್ತು ಒಟ್ಟುಗೂಡಿದ ಸಾಗಣೆ",
    transportPoolingSub: "ಒಂದು ಪ್ರಯಾಣದ ನಿಜವಾದ ವಾಹನ ದರದಿಂದ ಪ್ರತಿ ರೈತನ ಸಾರಿಗೆ ಉಳಿತಾಯ ಅಂದಾಜಿಸಿ.",
    harvestQuantity: "ನಿಮ್ಮ ಕೊಯ್ಲಿನ ಪ್ರಮಾಣ (ಕ್ವಿಂಟಾಲ್)", distanceToMandi: "ಮಾರುಕಟ್ಟೆಗೆ ದೂರ (ಕಿಮೀ)",
    neighborFarmers: "ಜೊತೆಯಾಗುವ ನೆರೆಯ ರೈತರು (1–5)", vehicleFare: "ಒಂದು ಪ್ರಯಾಣದ ನಿಜವಾದ ವಾಹನ ದರ (₹)",
    destinationMandi: "ಗಮ್ಯ ಮಾರುಕಟ್ಟೆ", individualTransportCost: "ಒಬ್ಬರ ಪ್ರಯಾಣ ವೆಚ್ಚ",
    pooledTransportCost: "ನಿಮ್ಮ ಹಂಚಿಕೆಯ ವೆಚ್ಚ", transportSavings: "ಪ್ರತಿ ರೈತನ ಉಳಿತಾಯ",
    totalSharingFarmers: "ನಿಮ್ಮನ್ನು ಸೇರಿಸಿ ಒಟ್ಟು {count} ರೈತರು.",
    transportPoolingAssumption: "ಪ್ರತಿಯೊಬ್ಬರೂ ಪ್ರತ್ಯೇಕವಾಗಿ ಅದೇ ಪೂರ್ಣ ಪ್ರಯಾಣದ ದರ ಪಾವತಿಸುತ್ತಿದ್ದರು, ದರವನ್ನು ನಿಮ್ಮೊಂದಿಗೆ ನೆರೆಯವರ ನಡುವೆ ಸಮವಾಗಿ ಹಂಚಲಾಗುತ್ತದೆ ಮತ್ತು ವಾಹನಕ್ಕೆ ಒಟ್ಟುಗೂಡಿದ ಕೊಯ್ಲನ್ನು ಸುರಕ್ಷಿತವಾಗಿ ಸಾಗಿಸುವ ಸಾಮರ್ಥ್ಯವಿದೆ ಎಂದು ಊಹಿಸುತ್ತದೆ. ಚಾಲಕರೊಂದಿಗೆ ದರ, ಸಾಮರ್ಥ್ಯ ಮತ್ತು ನಿಲ್ದಾಣಗಳನ್ನು ದೃಢಪಡಿಸಿ.",
    transportInviteMessage: "{village} ಹತ್ತಿರದ {count} {farmerUnit} ನಾಳೆ {mandi} ಮಾರುಕಟ್ಟೆಗೆ ಸರಕು ವಾಹನವನ್ನು ಹಂಚಿಕೊಳ್ಳಲು ಬೇಕಾಗಿದ್ದಾರೆ. ನನ್ನ ಕೊಯ್ಲು {quantity} ಕ್ವಿಂಟಾಲ್; ಮಾರುಕಟ್ಟೆ ಸುಮಾರು {distance} ಕಿಮೀ ದೂರದಲ್ಲಿದೆ.",
    farmerUnitSingular: "ರೈತ", farmerUnitPlural: "ರೈತರು",
    villageForInvite: "ನಿಮ್ಮ ಗ್ರಾಮ", invitePreview: "WhatsApp ಆಹ್ವಾನದ ಪೂರ್ವವೀಕ್ಷಣೆ",
    transportInviteMissing: "ಆಹ್ವಾನ ಸಂದೇಶ ಸಿದ್ಧಪಡಿಸಲು ಗ್ರಾಮ ಮತ್ತು ಗಮ್ಯ ಮಾರುಕಟ್ಟೆ ಸೇರಿಸಿ.",
    soilHealth: "ಮಣ್ಣಿನ ಆರೋಗ್ಯ ನೋಟ", soilType: "ಮಣ್ಣಿನ ಪ್ರಕಾರ", phLevel: "ಪಿಎಚ್ ಮಟ್ಟ", organicMatter: "ಸಾವಯವ ಪದಾರ್ಥ",
    nitrogen: "ಸಾರಜನಕ", phosphorus: "ರಂಜಕ", potassium: "ಪೊಟ್ಯಾಸಿಯಂ",
    soilTipTitle: "ಮಣ್ಣಿನ ಆರೈಕೆ ನೆನಪು", soilTip: "ನಿಮ್ಮ ಹೊಲದ ಪೋಷಕಾಂಶ ಯೋಜನೆಗೆ ಸ್ಥಳೀಯ ಮಾನ್ಯ ಪ್ರಯೋಗಾಲಯದ ಮಣ್ಣಿನ ಪರೀಕ್ಷೆಯೇ ಉತ್ತಮ.",
    cropTitle: "ಬೆಳೆ ಸಲಹೆಗಳು", cropSub: "ಮಾದರಿ ಪ್ರೊಫೈಲ್ ಆಧಾರಿತ ಕಲ್ಪನೆಗಳು — ಸ್ಥಳೀಯವಾಗಿ ಸೂಕ್ತತೆ ಪರಿಶೀಲಿಸಿ.",
    recommended: "ಪರಿಶೀಲಿಸಬಹುದಾದ ಕಲ್ಪನೆಗಳು", season: "ಖರೀಫ್ ಹಂಗಾಮು", duration: "ಬೆಳೆ ಅವಧಿ", waterNeed: "ನೀರಿನ ಅಗತ್ಯ",
    learnMore: "ಈ ಬೆಳೆ ಏಕೆ?", cropTip: "ಬೆಳೆ ಕಲ್ಪನೆಗಳು ಉದಾಹರಣೆಯ ಡೆಮೋ ಸಲಹೆಗಳು ಮಾತ್ರ; ನಿಮ್ಮ ಪ್ರದೇಶದ ಕೃಷಿ ಸಲಹೆಯಲ್ಲ.",
    advisoryTitle: "ಕೃಷಿಮಿತ್ರನನ್ನು ಕೇಳಿ", advisorySub: "ಸಾಮಾನ್ಯ ಕೃಷಿ ಪ್ರಶ್ನೆಗಳನ್ನು ತಿಳಿಯಲು ಸ್ನೇಹಪರ ಸ್ಥಳ.",
    demoChat: "ಡೆಮೋ ಸಲಹೆ", chatWelcome: "ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ ಡೆಮೋ ಕೃಷಿ ಸಂಗಾತಿ. ಸಾಮಾನ್ಯ ಪ್ರಶ್ನೆ ಕೇಳಿ ಅಥವಾ ಕೆಳಗಿನ ವಿಷಯ ಆಯ್ಕೆಮಾಡಿ.",
    chatPlaceholder: "ಸಾಮಾನ್ಯ ಕೃಷಿ ಪ್ರಶ್ನೆ ಕೇಳಿ…", send: "ಕಳುಹಿಸಿ", prompts: "ಮಾದರಿ ಪ್ರಶ್ನೆ ಪ್ರಯತ್ನಿಸಿ",
    reply: "ಈ ವಿಷಯಾಧಾರಿತ ಸಲಹೆಗಳು ನಿಮ್ಮ ಪ್ರೊಫೈಲ್ ಮತ್ತು ಆ್ಯಪ್‌ನಲ್ಲಿ ಲಭ್ಯವಿರುವ ಮಾಹಿತಿಯನ್ನು ಬಳಸುತ್ತವೆ. ಇವು ಸಾಮಾನ್ಯ ಮಾರ್ಗದರ್ಶನ ಮಾತ್ರ; ಖಚಿತ ರೋಗನಿರ್ಣಯ ಅಥವಾ ಖಾತರಿಯ ಫಲಿತಾಂಶವಲ್ಲ.",
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
    close: "ಮುಚ್ಚಿ", menu: "ಮೆನು ತೆರೆಯಿರಿ", more: "ಇನ್ನಷ್ಟು", prototype: "ಮಾದರಿ", percent: "ಶೇಕಡಾ", acres: "ಎಕರೆ",
    liveDataStatus: "🟢 Live Data", offlineDataStatus: "🟡 Offline Mode • Cached", cachedData: "ಸಂಗ್ರಹಿತ",
    shareWhatsapp: "WhatsApp ನಲ್ಲಿ ಹಂಚಿಕೊಳ್ಳಿ",
    listenToSummary: "ಕೇಳಿ / ಓದಿ", stopReading: "ಓದುವುದನ್ನು ನಿಲ್ಲಿಸಿ", speechUnavailable: "ಈ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಧ್ವನಿ ಸೌಲಭ್ಯ ಲಭ್ಯವಿಲ್ಲ.", speechError: "ಧ್ವನಿ ಪ್ಲೇ ಆಗಲಿಲ್ಲ. ಬ್ರೌಸರ್ ಆಡಿಯೊ ಸೆಟ್ಟಿಂಗ್ ಪರಿಶೀಲಿಸಿ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
    profitSpeechSummary: "{crop}. ಒಟ್ಟು ನಿರೀಕ್ಷಿತ ಇಳುವರಿ: {yield} ಕ್ವಿಂಟಾಲ್. ಆದಾಯ: {revenue}. ವೆಚ್ಚ: {expenses}. ಅಂದಾಜು ಲಾಭ: {profit}. ಪ್ರತಿ ಎಕರೆಗೆ ಲಾಭ: {perAcre}. ಇದು ಅಂದಾಜು ಮಾತ್ರ, ಖಚಿತ ಆದಾಯವಲ್ಲ.",
    profitShareMessage: "ಕೃಷಿಮಿತ್ರ ರೈತರ ಲಾಭದ ಅಂದಾಜು\nಬೆಳೆ: {crop}\nನಿರೀಕ್ಷಿತ ಇಳುವರಿ: {yield} ಕ್ವಿಂಟಾಲ್\nನಿರೀಕ್ಷಿತ ಆದಾಯ: {revenue}\nಒಟ್ಟು ವೆಚ್ಚ: {expenses}\nಅಂದಾಜು ಲಾಭ: {profit}\nಪ್ರತಿ ಎಕರೆಗೆ ಲಾಭ: {perAcre}\nಇದು ನಮೂದಿಸಿದ ಮೌಲ್ಯಗಳ ಅಂದಾಜು ಮಾತ್ರ; ಖಚಿತ ಆದಾಯವಲ್ಲ.",
    mandiShareMessage: "ಕೃಷಿಮಿತ್ರ ಮಾರುಕಟ್ಟೆ ಸಾರಾಂಶ\nಬೆಳೆ: {crop}\nಇತ್ತೀಚಿನ ವರದಿಯಾದ ಮಾದರಿ ಬೆಲೆ: {current}\nಹಿಂದಿನ ವರದಿಯಾದ ಮಾದರಿ ಬೆಲೆ: {previous}\nಬೆಲೆ ಬದಲಾವಣೆ: {change}\nಇತ್ತೀಚಿನ ಪ್ರವೃತ್ತಿ: {trend}\nಮಾರ್ಗದರ್ಶನ: {recommendation}\nಹಿಂದಿನ ವರದಿಯಾದ ಬೆಲೆಗಳು ಮುನ್ಸೂಚನೆ ಅಥವಾ ಖಾತರಿಯಲ್ಲ.",
    cropDoctorShareMessage: "ಕೃಷಿಮಿತ್ರ ಬೆಳೆ ಪರಿಶೀಲನೆ\nಬೆಳೆ: {crop}\nಕಂಡ ಲಕ್ಷಣ: {symptom}\nಸಾಧ್ಯ ಸಮಸ್ಯೆ: {diagnosis}\nಆರಂಭಿಕ ತೀವ್ರತೆ: {severity}\nತಕ್ಷಣದ ಕ್ರಮ: {organic}\nರಾಸಾಯನಿಕ ಆಯ್ಕೆ: {chemical}\nತಡೆಗಟ್ಟುವಿಕೆ: {prevention}\nಇದು ಸಾಧ್ಯತೆಯ ಪರಿಶೀಲನೆ ಮಾತ್ರ, ದೃಢಪಟ್ಟ ರೋಗನಿರ್ಣಯವಲ್ಲ. ಚಿಕಿತ್ಸೆಗೆ ಮೊದಲು ಸ್ಥಳೀಯವಾಗಿ ದೃಢಪಡಿಸಿ.",
    turDal: "ತೊಗರಿ ಬೇಳೆ", sampleMarket: "ಮೈಸೂರು ಮಾದರಿ ಮಾರುಕಟ್ಟೆ", nearNeutral: "ತಟಸ್ಥದ ಹತ್ತಿರ",
    sampleLevel: "ಮಾದರಿ ಮಟ್ಟ", medium: "ಮಧ್ಯಮ", good: "ಉತ್ತಮ", dayUnit: "ದಿನಗಳು",
    waterLowMedium: "ಕಡಿಮೆ–ಮಧ್ಯಮ", waterLow: "ಕಡಿಮೆ", waterMedium: "ಮಧ್ಯಮ", waterHigh: "ಹೆಚ್ಚು",
    cropDoctorTitle: "ಬೆಳೆ ವೈದ್ಯ / ಲಕ್ಷಣ ಪರೀಕ್ಷಕ",
    cropDoctorSub: "ಬೆಳೆ ಮತ್ತು ಕಾಣುವ ಲಕ್ಷಣಗಳನ್ನು ಆಯ್ಕೆಮಾಡಿ; ಸಾಧ್ಯತೆಗಳು ಮತ್ತು ಮುಂದಿನ ಕ್ರಮಗಳನ್ನು ಎಚ್ಚರಿಕೆಯಿಂದ ನೋಡಿ.",
    cropDoctorGuide: "ಹೊಲದ ಪ್ರಾಥಮಿಕ ಪರಿಶೀಲನೆ", cropDoctorCrop: "ಬೆಳೆ ಆಯ್ಕೆಮಾಡಿ", cropDoctorSymptoms: "ಕಾಣುವ ಲಕ್ಷಣಗಳನ್ನು ಆಯ್ಕೆಮಾಡಿ",
    cropDoctorChooseCrop: "ಬೆಳೆ ಆಯ್ಕೆಮಾಡಿ", cropDoctorChooseSymptoms: "ನೀವು ಗಮನಿಸಿದ ಒಂದು ಅಥವಾ ಹೆಚ್ಚು ಲಕ್ಷಣಗಳನ್ನು ಆಯ್ಕೆಮಾಡಿ.",
    cropDoctorPossibleIssue: "ಪರಿಶೀಲಿಸಬಹುದಾದ ಸಾಧ್ಯ ಸಮಸ್ಯೆ", cropDoctorSeverity: "ಆರಂಭಿಕ ತೀವ್ರತೆ",
    cropDoctorOrganic: "ತಕ್ಷಣದ ಸಾವಯವ ಕ್ರಮ / ಉಪಾಯ", cropDoctorChemical: "ರಾಸಾಯನಿಕ ಆಯ್ಕೆ (ದೃಢಪಟ್ಟರೆ ಮಾತ್ರ)",
    cropDoctorPrevention: "ತಡೆಗಟ್ಟುವಿಕೆ ಮತ್ತು ಗಮನ",
    cropDoctorNoSelection: "ಸಾಧ್ಯ ಕಾರಣಗಳನ್ನು ನೋಡಲು ಬೆಳೆ ಮತ್ತು ಕನಿಷ್ಠ ಒಂದು ಲಕ್ಷಣ ಆಯ್ಕೆಮಾಡಿ.",
    cropDoctorClearSymptoms: "ಲಕ್ಷಣಗಳನ್ನು ತೆರವುಗೊಳಿಸಿ",
    cropDoctorDisclaimer: "ಈ ದೃಶ್ಯ ಪರಿಶೀಲನಾ ಮಾರ್ಗದರ್ಶಿ ಬೆಳೆಯ ರೋಗನಿರ್ಣಯ ಮಾಡುವುದಿಲ್ಲ. ಹಲವು ಸಮಸ್ಯೆಗಳು ಒಂದೇ ರೀತಿ ಕಾಣುತ್ತವೆ; ತೀವ್ರತೆ ಆರಂಭಿಕ ಸೂಚನೆ ಮಾತ್ರ, ಅಳತೆಯ ಮೌಲ್ಯಮಾಪನವಲ್ಲ. ಚಿಕಿತ್ಸೆಗೂ ಮೊದಲು ಸ್ಥಳೀಯ ಕೃಷಿ ವಿಜ್ಞಾನ ಕೇಂದ್ರ ಅಥವಾ ಕೃಷಿ ಅಧಿಕಾರಿಯಿಂದ ದೃಢಪಡಿಸಿ.",
    cropDoctorSafety: "ಈ ಬೆಳೆ ಮತ್ತು ದೃಢಪಟ್ಟ ಸಮಸ್ಯೆಗೆ ಪ್ರಸ್ತುತ ನೋಂದಾಯಿತ ಹಾಗೂ ಲೇಬಲ್‌ನಲ್ಲಿ ಸೂಚಿಸಿದ ಉತ್ಪನ್ನವನ್ನಷ್ಟೇ ಬಳಸಿ. ಲೇಬಲ್, ರಕ್ಷಣಾ ಸಾಧನ, ಮರುಪ್ರವೇಶ ಮತ್ತು ಕೊಯ್ಲಿಗೂ ಮುನ್ನದ ಸೂಚನೆಗಳನ್ನು ಪಾಲಿಸಿ. ಪ್ರಮಾಣ ಅಥವಾ ಬ್ರ್ಯಾಂಡ್ ಸೂಚಿಸಿಲ್ಲ.",
    cropDoctorYellowing: "ಎಲೆ ಹಳದಿಯಾಗುವುದು", cropDoctorBrownSpots: "ಕಂದು ಚುಕ್ಕೆಗಳು", cropDoctorLeafCurling: "ಎಲೆ ಮುದುಡುವುದು",
    cropDoctorWilting: "ಬಾಡುವುದು", cropDoctorWhitePowder: "ಬಿಳಿ ಪುಡಿ ಅಥವಾ ಬೆಳವಣಿಗೆ", cropDoctorBorerHoles: "ಕಾಂಡ ಅಥವಾ ಹಣ್ಣಿನಲ್ಲಿ ಕೊರೆಯುವ ರಂಧ್ರಗಳು",
    cropDoctorTomato: "ಟೊಮೇಟೊ", cropDoctorCotton: "ಹತ್ತಿ", cropDoctorChilli: "ಮೆಣಸಿನಕಾಯಿ",
    cropDoctorOrganicYellow: "ಮಣ್ಣಿನ ತೇವಾಂಶ, ಒಳಚರಂಡಿ ಮತ್ತು ಎಲೆಯ ಕೆಳಭಾಗ ಪರಿಶೀಲಿಸಿ. ಸ್ಥಳೀಯ ಸ್ಥಿತಿ ನೋಡಿದ ನಂತರವೇ ಪೋಷಕಾಂಶ ಸರಿಪಡಿಸಿ; ಹೀರುವ ಕೀಟಗಳು ಕಂಡುಬಂದರೆ ಮತ್ತು ಬೆಳೆ ಲೇಬಲ್ ಅನುಮತಿಸಿದರೆ ಮಾತ್ರ ಬೇವಿನ ಉತ್ಪನ್ನ ಬಳಸಿ.",
    cropDoctorOrganicSpots: "ತೀವ್ರವಾಗಿ ಬಾಧಿತ ಎಲೆ ಮತ್ತು ಬೆಳೆ ಅವಶೇಷ ತೆಗೆದುಹಾಕಿ; ಎಲೆಗಳನ್ನು ನೆನೆಸುವುದನ್ನು ತಪ್ಪಿಸಿ. ಇದು ಸ್ವಚ್ಛತೆಗೆ ನೆರವಾಗುತ್ತದೆ, ಆದರೆ ಗುಣಮುಖತೆಯ ಖಾತರಿಯಲ್ಲ.",
    cropDoctorOrganicCurl: "ಎಲೆಯ ಕೆಳಭಾಗ ಪರಿಶೀಲಿಸಿ, ತೀವ್ರವಾಗಿ ಬಾಧಿತ ಎಲೆಗಳನ್ನು ತೆಗೆದುಹಾಕಿ. ಬೆಳೆ ಲೇಬಲ್ ಅನುಮತಿಸಿದರೆ ಮಾತ್ರ ಕಾಣುವ ಮೃದುದೇಹದ ಕೀಟಗಳಿಗೆ ಬೇವಿನ ಉತ್ಪನ್ನ ನೆರವಾಗಬಹುದು; ವೈರಸ್ ಗುಣಪಡಿಸುವುದಿಲ್ಲ.",
    cropDoctorOrganicWilt: "ಮಣ್ಣಿನ ತೇವಾಂಶ ಮತ್ತು ಒಳಚರಂಡಿ ಪರಿಶೀಲಿಸಿ; ದೃಢಪಟ್ಟ ಬಾಡಿದ ಗಿಡವನ್ನು ಬೇರು ಸಮೇತ ಬೇರ್ಪಡಿಸಿ ತೆಗೆದುಹಾಕಿ. ಪರಿಶೀಲಿಸದ ಮಿಶ್ರಣವನ್ನು ಮಣ್ಣಿಗೆ ಹಾಕಬೇಡಿ.",
    cropDoctorOrganicPowder: "ಬಾಧಿತ ಎಲೆಗಳನ್ನು ತೆಗೆದು ಗಾಳಿಯ ಸಂಚಾರ ಹೆಚ್ಚಿಸಿ. ಚಿಕಿತ್ಸೆಗೂ ಮೊದಲು ಅದು ಧೂಳು ಅಥವಾ ಸಿಂಪಡಣೆ ಅವಶೇಷವಲ್ಲವೆಂದು ಪರಿಶೀಲಿಸಿ.",
    cropDoctorOrganicBorer: "ಕೊರೆಯುವ ಕೀಟ ತಗುಲಿದ ಭಾಗಗಳನ್ನು ತೆಗೆದು ನಾಶಮಾಡಿ; ಗುರುತಿಸಿದ ಕೀಟ ಮತ್ತು ಬೆಳೆಗೆ ಸೂಕ್ತವಾದರೆ ಮಾತ್ರ ಫೆರೋಮೋನ್ ಬಲೆ ಬಳಸಿ.",
    cropDoctorPreventYellow: "ನಿಯಮಿತವಾಗಿ ಪರಿಶೀಲಿಸಿ, ಸೂಕ್ತ ಒಳಚರಂಡಿ ಕಾಪಾಡಿ ಮತ್ತು ಸ್ಥಳೀಯ ಮಣ್ಣಿನ ಸಲಹೆಯಂತೆ ಸಮತೋಲಿತ ಪೋಷಕಾಂಶ ಬಳಸಿ.",
    cropDoctorPreventSpots: "ಬೆಳೆ ಅವಶೇಷಗಳನ್ನು ತೆಗೆದುಹಾಕಿ, ಗಾಳಿಯಾಡುವಿಕೆ ಇರಲಿ ಮತ್ತು ಸಾಧ್ಯವಾದಲ್ಲಿ ಎಲೆಗಳು ಹೆಚ್ಚು ಹೊತ್ತು ತೇವವಾಗುವುದನ್ನು ತಪ್ಪಿಸಿ.",
    cropDoctorPreventCurl: "ಎಲೆಯ ಕೆಳಭಾಗದ ಕೀಟ ವಾಹಕಗಳನ್ನು ಪರಿಶೀಲಿಸಿ, ಕಳೆ ಅಥವಾ ಸ್ವಯಂ ಬೆಳೆದ ಆತಿಥೇಯ ಗಿಡ ತೆಗೆದುಹಾಕಿ ಮತ್ತು ಪಕ್ಕದ ಗಿಡಗಳನ್ನೂ ಗಮನಿಸಿ.",
    cropDoctorPreventWilt: "ಸ್ವಚ್ಛ ಸಾಧನ ಬಳಸಿ, ಸೋಂಕಿತ ಮಣ್ಣಿನ ಸಾಗಣೆ ತಪ್ಪಿಸಿ ಮತ್ತು ಬೆಳೆ ಪರಿವರ್ತನೆ ಹಾಗೂ ಒಳಚರಂಡಿಗೆ ಸ್ಥಳೀಯ ಸಲಹೆ ಪಡೆಯಿರಿ.",
    cropDoctorPreventPowder: "ಗಾಳಿಯಾಡಲು ಗಿಡಗಳಿಗೆ ಅಂತರ ನೀಡಿ, ಬಾಧಿತ ಅವಶೇಷ ತೆಗೆದುಹಾಕಿ ಮತ್ತು ಪಕ್ಕದ ಗಿಡಗಳನ್ನು ಬೇಗ ಪರಿಶೀಲಿಸಿ.",
    cropDoctorPreventBorer: "ಮೊಟ್ಟೆ ಮತ್ತು ಹೊಸ ರಂಧ್ರಗಳಿಗಾಗಿ ಪರಿಶೀಲಿಸಿ; ಬಾಧಿತ ಭಾಗಗಳನ್ನು ತೆಗೆದುಹಾಕಿ ಮತ್ತು ಸಲಹೆಯಂತೆ ಕೀಟ-ನಿರ್ದಿಷ್ಟ ನಿಗಾ ಬಲೆ ಬಳಸಿ.",
    cropDoctorChemicalNone: "ಈ ಲಕ್ಷಣದಿಂದ ಮಾತ್ರ ರಾಸಾಯನಿಕ ಶಿಫಾರಸು ಇಲ್ಲ. ಮೊದಲು ನೀರು, ಪೋಷಕಾಂಶ ಮತ್ತು ಕೀಟಗಳ ಇರುವಿಕೆ ಪರಿಶೀಲಿಸಿ; ಸಿಂಪಡಿಸುವ ಮೊದಲು ಕಾರಣ ದೃಢಪಡಿಸಿ.",
    cropDoctorChemicalFungicide: "ಶಿಲೀಂಧ್ರ ರೋಗ ದೃಢಪಟ್ಟರೆ, ಈ ಬೆಳೆ ಮತ್ತು ರೋಗಕ್ಕೆ ಪ್ರಸ್ತುತ ನೋಂದಾಯಿತ ಉತ್ಪನ್ನಕ್ಕಾಗಿ ಸ್ಥಳೀಯ ಕೃಷಿ ವಿಜ್ಞಾನ ಕೇಂದ್ರ ಅಥವಾ ಕೃಷಿ ಅಧಿಕಾರಿಯನ್ನು ಸಂಪರ್ಕಿಸಿ. ಲೇಬಲ್ ಪಾಲಿಸಿ.",
    cropDoctorChemicalInsecticide: "ಹೆಸರಿಸಿದ ಕೀಟ ದೃಢಪಟ್ಟರೆ, ಈ ಬೆಳೆ ಮತ್ತು ಕೀಟವನ್ನು ಲೇಬಲ್‌ನಲ್ಲಿ ಸೂಚಿಸಿರುವ ಪ್ರಸ್ತುತ ನೋಂದಾಯಿತ ಉತ್ಪನ್ನವನ್ನಷ್ಟೇ ಸ್ಥಳೀಯ ಸಲಹೆಯೊಂದಿಗೆ ಬಳಸಿ.",
    cropDoctorChemicalVector: "ಬಿಳಿನೊಣ ಅಥವಾ ಥ್ರಿಪ್ಸ್ ದೃಢಪಟ್ಟರೆ, ಸ್ಥಳೀಯ ಸಲಹೆಯಂತೆ ನೋಂದಾಯಿತ ಕೀಟವಾಹಕ ನಿಯಂತ್ರಣ ಉತ್ಪನ್ನ ಪರಿಗಣಿಸಿ. ವೈರಸ್ ಬಾಧಿತ ಗಿಡವನ್ನು ಇದು ಗುಣಪಡಿಸುವುದಿಲ್ಲ; ಲೇಬಲ್ ಪಾಲಿಸಿ.",
    cropDoctorChemicalBorer: "ಕೊರೆಯುವ ಕೀಟ ದೃಢಪಟ್ಟರೆ, ಈ ಬೆಳೆ ಮತ್ತು ಕೀಟಕ್ಕೆ ಪ್ರಸ್ತುತ ನೋಂದಾಯಿತ ಉತ್ಪನ್ನಕ್ಕಾಗಿ ಸ್ಥಳೀಯ ಕೃಷಿ ವಿಜ್ಞಾನ ಕೇಂದ್ರ ಅಥವಾ ಕೃಷಿ ಅಧಿಕಾರಿಯನ್ನು ಸಂಪರ್ಕಿಸಿ. ಲೇಬಲ್ ಪಾಲಿಸಿ.",
  },
} as const;

const navItems: { id: Screen; icon: string; key: keyof typeof text.en }[] = [
  { id: "dashboard", icon: "⌂", key: "dashboard" },
  { id: "weather", icon: "☼", key: "weather" },
  { id: "mandi", icon: "↗", key: "mandi" },
  { id: "profit", icon: "₹", key: "profit" },
  { id: "smartFarm", icon: "✳", key: "smartFarm" },
  { id: "irrigation", icon: "◌", key: "irrigationPlanner" },
  { id: "soil", icon: "◉", key: "soil" },
  { id: "crops", icon: "❋", key: "crops" },
  { id: "rotation", icon: "↻", key: "cropRotation" },
  { id: "cropDoctor", icon: "✚", key: "cropDoctor" },
  { id: "schemes", icon: "▣", key: "schemes" },
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

function validTimestamp(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function isNullableFiniteNumber(value: unknown): value is number | null {
  return value === null || (typeof value === "number" && Number.isFinite(value));
}

function isWeatherForecast(value: unknown): value is WeatherForecast {
  if (!value || typeof value !== "object" || !("current" in value) || !("daily" in value) || !("timezone" in value)) return false;
  const forecast = value as Record<string, unknown>;
  const current = forecast.current;
  if (!current || typeof current !== "object" || !("time" in current)) return false;
  const currentRecord = current as Record<string, unknown>;
  if (
    typeof currentRecord.time !== "string" ||
    !["temperature", "relativeHumidity", "precipitation", "rain", "weatherCode", "windSpeed"]
      .every((key) => key in currentRecord && isNullableFiniteNumber(currentRecord[key]))
  ) return false;
  return typeof forecast.timezone === "string" &&
    Array.isArray(forecast.daily) &&
    forecast.daily.every((day: unknown) => {
      if (!day || typeof day !== "object") return false;
      const daily = day as Record<string, unknown>;
      return typeof daily.date === "string" &&
        ["weatherCode", "temperatureMax", "temperatureMin", "precipitation", "precipitationProbability"]
          .every((key) => key in daily && isNullableFiniteNumber(daily[key]));
    });
}

function readCachedWeather(locationId: string): CachedWeather | null {
  try {
    const saved = localStorage.getItem(WEATHER_CACHE_KEY);
    if (!saved) return null;
    const value: unknown = JSON.parse(saved);
    if (
      !value || typeof value !== "object" ||
      !("locationId" in value) || !("forecast" in value) || !("timestamp" in value) ||
      typeof value.locationId !== "string" || !validTimestamp(value.timestamp) ||
      !isWeatherForecast(value.forecast)
    ) throw new Error("Cached weather has an invalid format.");
    if (value.locationId !== locationId) return null;
    return { locationId: value.locationId, forecast: value.forecast, timestamp: value.timestamp };
  } catch (error) {
    console.error("Could not read cached weather.", error);
    return null;
  }
}

function writeCachedWeather(locationId: string, forecast: WeatherForecast, timestamp: string) {
  try {
    localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify({ locationId, forecast, timestamp }));
  } catch (error) {
    console.error("Could not cache weather.", error);
  }
}

function isMandiRecord(value: unknown): value is MandiRecord {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return ["state", "district", "market", "commodity", "arrivalDate"].every((key) => typeof record[key] === "string") &&
    (typeof record.variety === "string" || record.variety === null) &&
    ["minPrice", "maxPrice", "modalPrice"].every((key) => isNullableFiniteNumber(record[key]));
}

function readCachedMandiPrices(): CachedMandiPrices | null {
  try {
    const saved = localStorage.getItem(MANDI_CACHE_KEY);
    if (!saved) return null;
    const value: unknown = JSON.parse(saved);
    if (!value || typeof value !== "object" || !("records" in value) || !("timestamp" in value) ||
      !Array.isArray(value.records) || !value.records.every(isMandiRecord) || !validTimestamp(value.timestamp)) {
      throw new Error("Cached mandi prices have an invalid format.");
    }
    return { records: value.records, timestamp: value.timestamp };
  } catch (error) {
    console.error("Could not read cached mandi prices.", error);
    return null;
  }
}

function cacheMandiPrices(records: MandiRecord[]): CachedMandiPrices {
  const previous = readCachedMandiPrices();
  const merged = new Map<string, MandiRecord>();
  for (const record of [...(previous?.records ?? []), ...records]) {
    const key = [record.state, record.district, record.market, record.commodity, record.variety ?? "", record.arrivalDate].join("|");
    merged.set(key, record);
  }
  const cached = { records: Array.from(merged.values()), timestamp: new Date().toISOString() };
  try {
    localStorage.setItem(MANDI_CACHE_KEY, JSON.stringify(cached));
  } catch (error) {
    console.error("Could not cache mandi prices.", error);
  }
  return cached;
}

const hindiText: Partial<Record<keyof typeof text.en, string>> = {
  dashboard: "डैशबोर्ड", weather: "मौसम", mandi: "मंडी भाव", profit: "लाभ कैलकुलेटर",
  smartFarm: "स्मार्ट कृषि", irrigationPlanner: "सिंचाई योजना", soil: "मिट्टी प्रोफ़ाइल",
  cropDoctor: "फसल डॉक्टर", schemes: "सरकारी योजनाएँ", crops: "फसल सुझाव", cropRotation: "फसल चक्र योजनाकार",
  advisory: "कृषि सलाह", settings: "सेटिंग्स",
  greeting: "नमस्कार", welcome: "आपका खेत, एक कदम आगे।", demo: "डेमो जानकारी",
  todayAt: "आज की मुख्य जानकारी", weatherCard: "मौसम का हाल", marketCard: "मंडी का हाल",
  rainChance: "बारिश की संभावना", humidity: "नमी", viewWeather: "मौसम देखें",
  viewMarket: "मंडी भाव देखें", yourFarm: "आपका खेत", quickActions: "त्वरित विकल्प",
  weatherTitle: "मौसम का हाल", weatherSub: "मौजूदा मौसम और सात दिन का पूर्वानुमान देखने के लिए शहर, जिला या गाँव खोजें।",
  currentConditions: "मौजूदा स्थिति", wind: "हवा", forecastTitle: "सात दिन का पूर्वानुमान",
  high: "अधिकतम", low: "न्यूनतम", expectedRain: "अनुमानित बारिश",
  weatherSource: "ओपन-मेटियो", live: "लाइव", searchLocation: "अपना स्थान खोजें",
  searchPlaceholder: "शहर, जिला या गाँव खोजें", search: "खोजें", searching: "खोज रहे हैं…",
  selectLocation: "सही स्थान चुनें", selectedLocation: "चुना गया स्थान",
  clearLocation: "स्थान बदलें", currentTemperature: "तापमान", rainfall: "बारिश",
  todayRainProbability: "आज बारिश की संभावना", lastUpdated: "अंतिम अपडेट",
  refreshWeather: "मौसम अपडेट करें", refreshing: "अपडेट हो रहा है…",
  loadingWeather: "लाइव मौसम प्राप्त हो रहा है…", chooseWeatherLocation: "लाइव मौसम देखने के लिए स्थान चुनें।",
  noWeatherData: "अभी मौसम की जानकारी उपलब्ध नहीं है।",
  farmingAdvisory: "मौसम आधारित कृषि सलाह", noAdvisories: "इस पूर्वानुमान के लिए कोई मौसम चेतावनी नहीं है।",
  advisoryRain: "बारिश का पूर्वानुमान है। सिंचाई से पहले मिट्टी की नमी जाँचें।",
  advisoryHeavyRain: "भारी बारिश का पूर्वानुमान है। खेत की जल-निकासी जाँचें।",
  advisoryHeat: "अधिक तापमान का पूर्वानुमान है। फसल की पानी की जरूरत पर नज़र रखें।",
  advisoryWind: "तेज़ हवा का पूर्वानुमान है। कमजोर फसलों और सहारे की जाँच करें।",
  weatherError: "मौसम सेवा में त्रुटि", weatherNetworkError: "कनेक्शन नहीं हो पाया। इंटरनेट जाँचकर फिर कोशिश करें।",
  weatherHttpError: "मौसम सेवा अभी अस्थायी रूप से उपलब्ध नहीं है। बाद में फिर कोशिश करें।",
  weatherApiError: "इस स्थान के लिए मौसम जानकारी उपलब्ध नहीं हो सकी।",
  weatherInvalidError: "मौसम सेवा से अनपेक्षित जानकारी मिली। फिर कोशिश करें।",
  mandiSub: "भारतीय और राज्य की मंडियों के भाव; नमूना रिकॉर्ड स्पष्ट रूप से चिह्नित हैं।",
  compareMarkets: "चुने गए राज्य की मंडियों की तुलना करें",
  dashboardWeatherNote: "मौसम Open-Meteo से लाइव है। मंडी भाव डेमो जानकारी हैं।",
  alertHeavyRainTitle: "भारी बारिश की संभावना", alertHeavyRainBody: "पूर्वानुमान: {date} को {amount} मिमी। सिंचाई टालने और खेत की जल-निकासी जाँचने पर विचार करें।",
  alertRainTitle: "बारिश की संभावना", alertRainBody: "{date} को बारिश की संभावना {chance}% है। अनावश्यक सिंचाई से बचने के लिए पहले मिट्टी की नमी जाँचें।",
  alertRainAmountBody: "{date} को {amount} मिमी बारिश का पूर्वानुमान है। अनावश्यक सिंचाई से बचने के लिए पहले मिट्टी की नमी जाँचें।",
  alertHeatTitle: "अधिक तापमान की संभावना", alertHeatBody: "{date} को अधिकतम तापमान {temperature}°C रहने का पूर्वानुमान है। फसल की पानी की जरूरत पर नज़र रखें।",
  alertWindTitle: "अभी तेज़ हवा", alertWindBody: "हवा की गति {speed} किमी/घंटा दर्ज हुई। फसल और सहारा संरचनाओं की जाँच करें।",
  generalWeatherAdviceTitle: "सामान्य मौसम सूचना",
  generalWeatherAdviceBody: "सिंचाई, कटाई या खेत के काम से पहले स्थानीय पूर्वानुमान देखें। इस खेत के लिए लाइव पूर्वानुमान उपलब्ध नहीं है।",
  farmAlertsTitle: "मौसम आधारित खेत चेतावनी", forecastVerified: "पूर्वानुमान आधारित",
  generalAdviceLabel: "सामान्य सलाह · आपके स्थान पर सत्यापित नहीं",
  noActiveFarmAlerts: "उपलब्ध पूर्वानुमान में चेतावनी की सीमा पार नहीं हुई। स्थानीय स्थिति देखते रहें।",
  smartFarmTitle: "स्मार्ट कृषि निर्णय केंद्र",
  smartFarmSub: "अपने खेत, मौसम, मंडी भाव और खर्च के अनुमान को एक साथ देखें।",
  smartFarmEyebrow: "आपका कृषि निर्णय केंद्र", smartFarmOverview: "खेत का सार",
  todayForecast: "मौसम का पूर्वानुमान", noForecastForFarm: "लाइव पूर्वानुमान के लिए मौसम स्क्रीन पर स्थान चुनें।",
  soilChoice: "मिट्टी का प्रकार", locationUnset: "स्थान जोड़ें",
  cropRiskTitle: "मौसम से जुड़ा फसल जोखिम", lowRisk: "कम जोखिम", moderateRisk: "मध्यम जोखिम", highRisk: "अधिक जोखिम",
  riskUnavailable: "जोखिम संकेतक उपलब्ध नहीं", riskWeatherUnavailable: "यह संकेतक देखने के लिए फसल चुनें, प्रोफ़ाइल में मिट्टी का प्रकार सहेजें और लाइव पूर्वानुमान लोड करें।",
  riskMethod: "यह सामान्य संकेतक पूर्वानुमान चेतावनी के प्रकार गिनता है: कोई नहीं = कम, एक = मध्यम, दो या अधिक = अधिक। यह उपज या फसल नुकसान का पूर्वानुमान नहीं है।",
  riskContextNote: "इस संकेतक के लिए चुनी गई फसल, सहेजा गया मिट्टी का प्रकार और लाइव पूर्वानुमान जरूरी हैं। यह सामान्य मौसम चेतावनियों पर आधारित है।",
  postHarvestEyebrow: "कटाई और भंडारण",
  postHarvestTitle: "कटाई के बाद भंडारण और खराब होने का जोखिम",
  postHarvestSub: "मौजूदा बाहरी तापमान और नमी पर आधारित एक मोटा भंडारण अनुमान।",
  postHarvestCrop: "कटी हुई फसल", postHarvestMethod: "भंडारण का तरीका",
  postHarvestWindow: "अनुमानित सुरक्षित भंडारण अवधि", postHarvestRisk: "खराब होने का जोखिम",
  postHarvestAction: "कार्रवाई सुझाव", postHarvestSellImmediately: "तुरंत बेचें",
  postHarvestSafeToStore: "भंडारित किया जा सकता है", postHarvestWeatherUnavailable: "अनुमान के लिए तापमान और नमी दोनों वाला मौजूदा मौसम लोड करें।",
  postHarvestRiskHigh: "अधिक", postHarvestRiskModerate: "मध्यम", postHarvestRiskLow: "कम",
  postHarvestSellTip: "स्थितियाँ कम अनुमानित अवधि दिखाती हैं। जल्दी बेचने या प्रसंस्करण को प्राथमिकता दें और उपज जाँचें; अनुमान पर ही निर्भर न रहें।",
  postHarvestStoreTip: "अनुमान अल्पकालिक भंडारण की गुंजाइश देता है। उपज को सूखा और हवादार रखें तथा नियमित जाँचें।",
  postHarvestModelNote: "प्रोटोटाइप नियम: खुले शेड और जूट के बोरों के लिए 30/35°C तापमान और 70/80% नमी पर मूल अवधि घटती है; शीत-भंडारण में बाहरी मौसम का छोटा समायोजन ही होता है।",
  postHarvestEstimateNote: "यह केवल एक उदाहरणात्मक जोखिम-जाँच है, प्रमाणित भंडारण-अवधि का पूर्वानुमान नहीं। इसमें अच्छी उपज, ताज़ी मिर्च, सूखा धान/रागी अनाज और सुखाए प्याज़/आलू माने गए हैं; वास्तविक अवधि सुखाने, संभाल, कीटों और भंडार के अंदर की स्थिति पर निर्भर करती है। शीत-भंडारण अनुमान सही ढंग से चल रहे केंद्र को मानता है; बाहरी मौसम उसकी अंदरूनी स्थिति नहीं मापता।",
  postHarvestShareMessage: "कृषिमित्र कटाई के बाद का अनुमान\nफसल: {crop}\nभंडारण तरीका: {method}\nमौजूदा बाहरी तापमान: {temperature}°C\nमौजूदा बाहरी नमी: {humidity}%\nअनुमानित सुरक्षित अवधि: {days} दिन\nखराब होने का जोखिम: {risk}\nकार्रवाई: {action}\nयह उदाहरणात्मक अनुमान है, भंडारण अवधि की गारंटी नहीं।",
  postHarvestCropOnion: "प्याज़", postHarvestCropPotato: "आलू", dayUnit: "दिन",
  storageOpenShed: "खुला शेड", storageGunnyBags: "जूट के बोरे", storageColdStorage: "शीत भंडारण",
  noFarmSoil: "किसान प्रोफ़ाइल में मिट्टी का प्रकार सहेजा नहीं गया है।",
  profileSoilNote: "सहेजी गई किसान प्रोफ़ाइल का मिट्टी प्रकार; प्रयोगशाला जाँच नहीं।",
  sampleCachedMandiData: "नमूना / कैश किया गया AGMARKNET डेटा",
  sampleDataSource: "उदाहरण के लिए जोड़ा गया डेटा · लाइव या सरकारी रिपोर्ट नहीं",
  mixedDataSource: "उदाहरण डेटा और डिवाइस पर सहेजा AGMARKNET कैश",
  cachedPriceExplanation: "इस डिवाइस के कैश में सहेजे गए पुराने AGMARKNET रिकॉर्ड दिखाए जा रहे हैं। ये मौजूदा भाव नहीं भी हो सकते हैं।",
  farmCostsTitle: "खेती के खर्च का सार", totalInvestment: "कुल निवेश", largestExpense: "सबसे बड़ा खर्च",
  latestMandiAverage: "मंडी भाव का नवीनतम औसत", currentReportedPrice: "नवीनतम रिपोर्ट किया गया औसत",
  previousReportedPrice: "पिछला रिपोर्ट किया गया औसत", priceChange: "पिछली रिपोर्ट से बदलाव",
  trend: "हाल का रिपोर्ट किया गया रुझान", trendIncreasing: "बढ़ रहा है",
  trendDecreasing: "घट रहा है", trendStable: "स्थिर या मिला-जुला",
  reportedPriceHistory: "हाल के रिपोर्ट किए गए भाव",
  typeRed: "लाल मिट्टी", typeBlack: "काली मिट्टी", typeSandy: "रेतीली मिट्टी", typeLoamy: "दोमट मिट्टी",
  expenseBreakdown: "खर्च का विवरण", noExpensesEntered: "खर्च का विवरण देखने के लिए लाभ कैलकुलेटर में अनुमानित खर्च भरें।",
  largestExpenseInsight: "आपके कुल अनुमानित खर्च में {category} सबसे बड़ा खर्च है ({share}%)।",
  personalizedTitle: "आपके लिए कृषि सुझाव", priorityHigh: "उच्च", priorityMedium: "मध्यम", priorityLow: "कम",
  weatherRecommendationTitle: "{crop} के लिए मौसम जाँच", weatherRecommendationBody: "{alert} खेत के काम की योजना बनाने के लिए ऊपर दिया पूर्वानुमान देखें।",
  weatherRecommendationNoAlert: "कोई निर्धारित मौसम चेतावनी सीमा पार नहीं हुई। खेत के काम से पहले नया पूर्वानुमान देखते रहें।",
  weatherRecommendationNoData: "पूर्वानुमान आधारित सलाह पाने के लिए मौसम स्थान जोड़ें।",
  marketRecommendationTitle: "{crop} के लिए मंडी भाव की समीक्षा",
  marketRecommendationBody: "{recommendation}: {reason}",
  marketSampleReason: "यह सुझाव केवल उदाहरण के डेमो भावों से बना है। यह वास्तविक बाजार संकेत या बिक्री सलाह नहीं है।",
  samplePriceExplanation: "केवल प्रदर्शन के लिए उदाहरण भाव। इस फसल के रिपोर्ट किए गए भाव देखने के लिए मंडी भाव खोलें।",
  demoPriceLabel: "डेमो उदाहरण · लाइव मंडी भाव नहीं",
  monitorMarket: "मंडी भाव पर नज़र रखें", sellNow: "अभी बेचने पर विचार करें", waitMarket: "रुककर फिर समीक्षा करें",
  expenseRecommendationTitle: "{category} खर्च की समीक्षा करें",
  expenseRecommendationBody: "आपके दर्ज खर्च में {category} का हिस्सा {share}% है। स्थानीय दरों की तुलना करें और रसीदें रखें।",
  expenseRecommendationNoData: "खर्च की जानकारी पाने के लिए लाभ कैलकुलेटर में क्षेत्रफल, उपज, बिक्री मूल्य और खर्च भरें।",
  expenseRecommendationNoCosts: "सबसे बड़े खर्च की पहचान के लिए लाभ कैलकुलेटर में खर्च जोड़ें।",
  selectCropForSmartFarm: "खेत का सार देखने के लिए फसल चुनें।",
  profitCalculatorEyebrow: "खेती के मौसम की योजना", profitCalculatorTitle: "किसान लाभ कैलकुलेटर",
  profitCalculatorSub: "अपने खेत के अनुमान से फसल की आय, खर्च और लाभ का हिसाब लगाएँ।",
  estimateBadge: "आपका अनुमान", cropSelect: "फसल", chooseCrop: "फसल चुनें",
  cultivatedArea: "खेती का क्षेत्रफल (एकड़)", expectedYieldPerAcre: "प्रति एकड़ अनुमानित उपज (क्विंटल)",
  expectedSellingPrice: "अनुमानित बिक्री मूल्य (₹ / क्विंटल)", estimatedExpenses: "अनुमानित खर्च (₹)",
  calculatorExpenseHelp: "मौसम के अनुमानित खर्च भरें; लागू न होने वाले खर्च ₹0 रख सकते हैं।",
  seedExpense: "बीज", fertilizerExpense: "उर्वरक", labourExpense: "मजदूरी",
  irrigationExpense: "सिंचाई", transportExpense: "परिवहन", otherExpense: "अन्य खर्च",
  calculatorResults: "आपके अनुमानित परिणाम", calculatorPrompt: "अनुमान देखने के लिए फसल चुनें और क्षेत्रफल, उपज व बिक्री मूल्य भरें।",
  totalExpectedYield: "कुल अनुमानित उपज", expectedRevenue: "कुल अनुमानित आय", quintals: "क्विंटल",
  totalExpenses: "कुल खर्च", estimatedProfit: "अनुमानित लाभ", profitPerAcre: "प्रति एकड़ लाभ",
  financialBreakdown: "आय और खर्च की तुलना", revenueLabel: "आय", expensesLabel: "खर्च",
  netProfitLabel: "शुद्ध लाभ", calculatorDisclaimer: "यह आपके इनपुट पर आधारित अनुमान है, निश्चित आय नहीं। वास्तविक उपज, भाव और खर्च अलग हो सकते हैं।",
  transportPoolingTitle: "साझा परिवहन और सामूहिक ढुलाई",
  transportPoolingSub: "एक यात्रा के वास्तविक वाहन किराये से प्रति किसान बचत का अनुमान लगाएँ।",
  harvestQuantity: "आपकी उपज की मात्रा (क्विंटल)", distanceToMandi: "मंडी की दूरी (किमी)",
  neighborFarmers: "साथ जुड़ने वाले पड़ोसी किसान (1–5)", vehicleFare: "एक यात्रा का वास्तविक वाहन किराया (₹)",
  destinationMandi: "गंतव्य मंडी", individualTransportCost: "अकेले यात्रा का खर्च",
  pooledTransportCost: "आपका साझा हिस्सा", transportSavings: "प्रति किसान बचत",
  totalSharingFarmers: "आप सहित कुल {count} किसान।",
  transportPoolingAssumption: "इसमें माना गया है कि हर किसान अलग जाने पर वही पूरा किराया देगा, किराया आप और पड़ोसियों में बराबर बाँटा जाएगा, और वाहन संयुक्त उपज के लिए पर्याप्त व सुरक्षित है। चालक से किराया, क्षमता और ठहराव की पुष्टि करें।",
  transportInviteMessage: "{village} के पास {count} {farmerUnit} कल {mandi} मंडी तक मालवाहक वाहन साझा करने के लिए चाहिए। मेरी उपज {quantity} क्विंटल है; मंडी लगभग {distance} किमी दूर है।",
  farmerUnitSingular: "किसान", farmerUnitPlural: "किसान",
  villageForInvite: "आपका गाँव", invitePreview: "WhatsApp निमंत्रण का पूर्वावलोकन",
  transportInviteMissing: "निमंत्रण संदेश तैयार करने के लिए गाँव और गंतव्य मंडी भरें।",
  cropRice: "धान", cropRagi: "रागी", cropMaize: "मक्का", cropPulses: "दलहन",
  settingsTitle: "सेटिंग्स", settingsSub: "कृषिमित्र को अपनी जरूरत के अनुसार बनाएँ।",
  language: "भाषा", chooseLanguage: "अपनी पसंद की भाषा चुनें",
  prototype: "प्रोटोटाइप", more: "और",
  liveDataStatus: "🟢 Live Data", offlineDataStatus: "🟡 Offline Mode • Cached", cachedData: "कैश किया हुआ",
  shareWhatsapp: "WhatsApp पर साझा करें",
  listenToSummary: "सुनें / पढ़कर सुनाएँ", stopReading: "सुनना रोकें",
  speechUnavailable: "इस ब्राउज़र में वाक् सुविधा उपलब्ध नहीं है।",
  speechError: "आवाज़ नहीं चल सकी। ब्राउज़र की ऑडियो सेटिंग जाँचकर फिर कोशिश करें।",
  profitSpeechSummary: "{crop}. कुल अनुमानित उपज: {yield} क्विंटल। आय: {revenue}। खर्च: {expenses}। अनुमानित लाभ: {profit}। प्रति एकड़ लाभ: {perAcre}। यह अनुमान है, निश्चित आय नहीं।",
  profitShareMessage: "कृषिमित्र किसान लाभ अनुमान\nफसल: {crop}\nअनुमानित उपज: {yield} क्विंटल\nअनुमानित आय: {revenue}\nकुल खर्च: {expenses}\nअनुमानित लाभ: {profit}\nप्रति एकड़ लाभ: {perAcre}\nयह दर्ज मानों पर आधारित अनुमान है, निश्चित आय नहीं।",
  mandiShareMessage: "कृषिमित्र मंडी सारांश\nफसल: {crop}\nनवीनतम रिपोर्ट किया गया मॉडल भाव: {current}\nपिछला रिपोर्ट किया गया मॉडल भाव: {previous}\nभाव में बदलाव: {change}\nहाल का रुझान: {trend}\nमार्गदर्शन: {recommendation}\nपुराने रिपोर्ट किए गए भाव पूर्वानुमान या गारंटी नहीं हैं।",
  cropDoctorShareMessage: "कृषिमित्र फसल जाँच\nफसल: {crop}\nदिखा लक्षण: {symptom}\nसंभावित समस्या: {diagnosis}\nप्रारंभिक गंभीरता: {severity}\nतत्काल कदम: {organic}\nरासायनिक विकल्प: {chemical}\nरोकथाम: {prevention}\nयह केवल प्रारंभिक संभावना है, पुष्टि किया गया निदान नहीं। उपचार से पहले स्थानीय पुष्टि लें।",
  advisoryTitle: "कृषिमित्र से पूछें",
  advisorySub: "खेती के सवाल पूछें और अपनी परिस्थिति के अनुसार व्यावहारिक सुझाव पाएँ।",
  demoChat: "सलाहकार चैट",
  chatPlaceholder: "अपना खेती का सवाल लिखें...",
  send: "भेजें",
  reply: "मिट्टी, मौसम, मंडी और खेती की सामान्य जानकारी शुरुआती मार्गदर्शन है। महत्वपूर्ण फैसले स्थानीय परिस्थितियों के अनुसार जाँचें।",
};

type AppTranslationKey = keyof typeof text.en;
type AppTranslations = Partial<Record<AppTranslationKey, string>>;
type CompleteAppTranslations = Record<AppTranslationKey, string>;

const teluguText: CompleteAppTranslations = {
  dashboard: "డాష్‌బోర్డ్", weather: "వాతావరణం", mandi: "మార్కెట్ ధరలు", profit: "లాభాల లెక్కింపు",
  smartFarm: "స్మార్ట్ వ్యవసాయం", irrigationPlanner: "నీటిపారుదల ప్రణాళిక", soil: "నేల వివరాలు",
  cropDoctor: "పంట వైద్యుడు", schemes: "పథకాలు మరియు సబ్సిడీలు", crops: "పంట సూచనలు",
  cropRotation: "పంట మార్పిడి ప్రణాళిక", advisory: "వ్యవసాయ సలహా", settings: "సెట్టింగ్‌లు",
  greeting: "శుభోదయం", welcome: "మీ వ్యవసాయం — ఒక అడుగు ముందుకు.", demo: "నమూనా సమాచారం",
  demoNote: "ఈ నమూనా ప్రదర్శన కోసం మాత్రమే; ఇది ప్రత్యక్షమైనది లేదా మీ ప్రాంతానికి ప్రత్యేకమైనది కాదు.",
  todayAt: "ఈరోజు ముఖ్యాంశాలు", weatherCard: "వాతావరణ అంచనా", marketCard: "మార్కెట్ పరిస్థితి",
  rainChance: "వర్షం పడే అవకాశం", humidity: "తేమ", viewWeather: "వాతావరణం చూడండి",
  viewMarket: "ధరలు చూడండి", yourFarm: "మీ వ్యవసాయ ప్రొఫైల్", addFarm: "వ్యవసాయ వివరాలు జోడించండి",
  editProfile: "ప్రొఫైల్ సవరించండి", setupPrompt: "వ్యక్తిగత సూచనల కోసం మీ వ్యవసాయ వివరాలు జోడించండి.",
  completeProfile: "ప్రొఫైల్ ఏర్పాటు చేయండి", quickActions: "త్వరిత ఎంపికలు", askMitra: "కృషిమిత్రను అడగండి",
  soilCheck: "నేల మార్గదర్శిని చూడండి", cropPlanner: "పంట సూచనలు చూడండి", fieldNote: "ఈరోజు చిన్న శ్రద్ధ రేపటి మంచి ఫలితానికి తోడ్పడుతుంది.",
  weatherTitle: "వాతావరణ అంచనా", weatherSub: "ప్రస్తుత పరిస్థితులు, ఏడు రోజుల అంచనా కోసం నగరం, జిల్లా లేదా గ్రామాన్ని వెతకండి.",
  currentConditions: "ప్రస్తుత పరిస్థితులు", feelsLike: "అనుభూతి ఉష్ణోగ్రత", wind: "గాలి",
  nextDays: "రాబోయే రోజులు", dayToday: "ఈరోజు", dayTomorrow: "రేపు", sunny: "ఎండగా",
  partlyCloudy: "పాక్షికంగా మేఘావృతం", lightShower: "తేలికపాటి జల్లులు", foggy: "పొగమంచు",
  drizzle: "చిరుజల్లు", rainCondition: "వర్షం", snow: "మంచు", thunderstorm: "ఉరుములతో కూడిన వర్షం",
  dashboardWeatherNote: "వాతావరణ సమాచారం Open-Meteo నుంచి ప్రత్యక్షంగా వస్తుంది. మార్కెట్ ధరలు నమూనా సమాచారం.",
  weatherSource: "OPEN-METEO", live: "ప్రత్యక్షం", searchLocation: "మీ ప్రాంతాన్ని వెతకండి",
  searchPlaceholder: "నగరం, జిల్లా లేదా గ్రామం వెతకండి", search: "వెతకండి", searching: "వెతుకుతోంది…",
  noLocationResults: "ప్రాంతాలు కనబడలేదు. దగ్గరలోని పట్టణం లేదా జిల్లాను ప్రయత్నించండి.",
  selectLocation: "సరైన ప్రాంతాన్ని ఎంచుకోండి", selectedLocation: "ఎంచుకున్న ప్రాంతం", clearLocation: "ప్రాంతం మార్చండి",
  currentTemperature: "ఉష్ణోగ్రత", rainfall: "వర్షపాతం", currentRain: "ప్రస్తుతం వర్షం",
  todayRainProbability: "ఈరోజు వర్షం పడే అవకాశం", forecastTitle: "ఏడు రోజుల అంచనా",
  high: "గరిష్ఠం", low: "కనిష్ఠం", expectedRain: "అంచనా వర్షపాతం", lastUpdated: "చివరిగా నవీకరించిన సమయం",
  dataSource: "సమాచార మూలం", refreshWeather: "వాతావరణాన్ని నవీకరించండి", refreshing: "నవీకరిస్తోంది…",
  loadingWeather: "ప్రత్యక్ష వాతావరణ సమాచారం పొందుతోంది…", chooseWeatherLocation: "ప్రత్యక్ష వాతావరణం కోసం ప్రాంతాన్ని ఎంచుకోండి.",
  noWeatherData: "ప్రస్తుతం వాతావరణ సమాచారం అందుబాటులో లేదు.",
  weatherSearchHelp: "శోధన ఫలితాలు Open-Meteo నుంచి వస్తాయి. మీ పరికరం స్థానాన్ని సేకరించదు.",
  farmingAdvisory: "వ్యవసాయ వాతావరణ సూచన", noAdvisories: "ఈ అంచనాలో వాతావరణ హెచ్చరికలు లేవు.",
  advisoryRain: "వర్షం పడే అవకాశం ఉంది. నీటిపారుదల అవసరాన్ని పరిశీలించండి.",
  advisoryHeavyRain: "భారీ వర్షం పడే అవకాశం ఉంది. పొలంలో నీరు బయటకు వెళ్లే మార్గాలను పరిశీలించండి.",
  advisoryHeat: "అధిక ఉష్ణోగ్రతలు ఉండవచ్చు. పంట నీటి అవసరాన్ని గమనించండి.",
  advisoryWind: "బలమైన గాలులు వీచవచ్చు. సున్నితమైన పంటలకు ఆసరా ఉందో చూడండి.",
  weatherError: "వాతావరణ సేవలో లోపం", weatherNetworkError: "కనెక్షన్ కాలేదు. ఇంటర్నెట్‌ను తనిఖీ చేసి మళ్లీ ప్రయత్నించండి.",
  weatherHttpError: "వాతావరణ సేవ తాత్కాలికంగా అందుబాటులో లేదు. కొద్దిసేపటి తర్వాత ప్రయత్నించండి.",
  weatherApiError: "ఈ ప్రాంతానికి వాతావరణ సమాచారం పొందలేకపోయాం.",
  weatherInvalidError: "వాతావరణ సేవ నుంచి ఊహించని సమాచారం వచ్చింది. మళ్లీ ప్రయత్నించండి.",
  locationSaveError: "ఈ బ్రౌజర్‌లో ఎంచుకున్న ప్రాంతాన్ని భద్రపరచలేకపోయాం.",
  mandiTitle: "మార్కెట్ ధరలు", mandiSub: "భారతదేశం మరియు రాష్ట్ర మార్కెట్ల ధరలు; నమూనా రికార్డులు స్పష్టంగా గుర్తించబడ్డాయి.",
  marketBoard: "AGMARKNET రోజువారీ ధరలు", commodity: "పంట", market: "మార్కెట్", price: "ధర / క్వింటాల్",
  change: "మార్పు", state: "రాష్ట్రం", districtLabel: "జిల్లా", variety: "రకం", arrivalDate: "వచ్చిన తేదీ",
  minPrice: "కనిష్ఠ ధర", maxPrice: "గరిష్ఠ ధర", modalPrice: "మోడల్ ధర",
  selectState: "రాష్ట్రాన్ని ఎంచుకోండి", selectDistrict: "అన్ని జిల్లాలు", selectMarket: "అన్ని మార్కెట్లు",
  searchCrop: "పంటను వెతికి ఎంచుకోండి", cropSearchPlaceholder: "డేటాలోని పంటలను వెతకండి…",
  noCrops: "అందుబాటులో ఉన్న సమాచారంలో సరిపోలే పంటలు లేవు.", loadingMarkets: "ప్రభుత్వ మార్కెట్ సమాచారం లోడ్ అవుతోంది…",
  noMarketData: "ఈ ఎంపికకు మార్కెట్ రికార్డులు లేవు.",
  noDataForFilters: "ఈ వడపోతలకు రికార్డులు లేవు. వేరే పంట, జిల్లా లేదా మార్కెట్‌ను ఎంచుకోండి.",
  chooseCropForCompare: "మార్కెట్ల ధరలను పోల్చడానికి పంటను వెతికి ఎంచుకోండి.",
  marketApiSource: "భారత ప్రభుత్వం · AGMARKNET", sampleCachedMandiData: "నమూనా / క్యాష్ చేసిన AGMARKNET సమాచారం",
  sampleDataSource: "ఉదాహరణ కోసం చేర్చిన డేటా · ప్రత్యక్షం కాదు, ప్రభుత్వ నివేదిక కాదు",
  mixedDataSource: "ఉదాహరణ రికార్డులు మరియు పరికరంలో భద్రపరిచిన AGMARKNET సమాచారం",
  cachedPriceExplanation: "ఈ పరికరంలోని క్యాష్‌లో ఉన్న పాత AGMARKNET రికార్డులు చూపబడుతున్నాయి. ఇవి ప్రస్తుత ధరలు కాకపోవచ్చు.",
  lastUpdatedMandi: "చివరిగా నవీకరించిన సమయం", dataRows: "పొందిన రికార్డులు",
  mandiErrorTitle: "మార్కెట్ సమాచారం లోడ్ కాలేదు", refreshPrices: "ధరలను నవీకరించండి", refreshingPrices: "నవీకరిస్తోంది…",
  compareMarkets: "ఎంచుకున్న రాష్ట్రంలోని మార్కెట్లను పోల్చండి", sortByModal: "మోడల్ ధర ప్రకారం క్రమబద్ధీకరించండి",
  ascending: "తక్కువ ధర ముందుగా", descending: "ఎక్కువ ధర ముందుగా", priceAdvisory: "ధరల పోలిక సూచనలు",
  noCompareData: "మార్కెట్లను పోల్చడానికి సరిపడా నివేదిత ధరలు లేవు.",
  highestReported: "అత్యధికంగా నివేదించిన మోడల్ ధర", lowestReported: "అత్యల్పంగా నివేదించిన మోడల్ ధర",
  transportNote: "నివేదిత ధర ఎక్కువగా ఉన్నంత మాత్రాన ఆదాయం ఎక్కువవుతుందని హామీ లేదు. రవాణా, ఇతర ఖర్చులను పరిగణించండి.",
  priceHistory: "నివేదిత ధరల చరిత్ర", fromDate: "ప్రారంభ తేదీ", toDate: "ముగింపు తేదీ",
  missingDates: "ఈ తేదీలకు రికార్డులు లేవు", noHistory: "ఈ ఎంపికకు గత రికార్డులు అందుబాటులో లేవు.",
  sourceUnitNote: "మూలంలో నివేదించినట్లుగా ధరలు క్వింటాల్‌కు ₹లో చూపబడ్డాయి.",
  sellWaitTitle: "ఇప్పుడే అమ్మాలా, వేచి చూడాలా?", sellWaitSub: "ఎంచుకున్న పంటకు సంబంధించిన గత నివేదిత ధరల ఆధారంగా జాగ్రత్తగా ఇచ్చే సూచన.",
  currentReportedPrice: "ఇటీవలి నివేదిత సగటు ధర", previousReportedPrice: "మునుపటి నివేదిత సగటు ధర",
  priceChange: "మునుపటి నివేదికతో పోల్చిన మార్పు", trend: "ఇటీవలి నివేదిత ధోరణి",
  trendRising: "పెరుగుతోంది", trendFalling: "తగ్గుతోంది", trendMixed: "మిశ్రమంగా లేదా స్థిరంగా ఉంది",
  trendInsufficient: "ధోరణిని చూపడానికి తగినంత సమాచారం లేదు",
  recommendationMonitor: "మార్కెట్‌ను గమనించండి", recommendationSell: "అమ్మకాన్ని పరిశీలించండి",
  recommendationNoSignal: "స్పష్టమైన సూచన లేదు", recommendationInsufficient: "సూచనకు తగినంత గత సమాచారం లేదు",
  reportedPriceHistory: "ఇటీవలి నివేదిత ధరలు",
  smartFarmTitle: "స్మార్ట్ వ్యవసాయ నిర్ణయ కేంద్రం", smartFarmSub: "వ్యవసాయ ప్రొఫైల్, వాతావరణం, మార్కెట్ నివేదికలు, ఖర్చుల అంచనాలను ఒకచోట చూడండి.",
  smartFarmEyebrow: "మీ వ్యవసాయ నిర్ణయ కేంద్రం", smartFarmOverview: "వ్యవసాయ సారాంశం",
  todayForecast: "వాతావరణ అంచనా", noForecastForFarm: "ప్రత్యక్ష అంచనా కోసం వాతావరణ తెరలో ప్రాంతాన్ని ఎంచుకోండి.",
  noFarmSoil: "రైతు ప్రొఫైల్‌లో నేల రకం భద్రపరచలేదు.", profileSoilNote: "మీ ప్రొఫైల్‌లో భద్రపరిచిన నేల రకం; ఇది ప్రయోగశాల పరీక్ష కాదు.",
  latestMandiAverage: "తాజా నివేదిత మార్కెట్ సగటు", demoPriceLabel: "నమూనా ధర · ప్రత్యక్ష మార్కెట్ ధర కాదు",
  samplePriceExplanation: "ప్రదర్శన కోసం మాత్రమే సూచనాత్మక ధరలు. ఈ పంట నివేదిత ధరల కోసం మార్కెట్ ధరల తెరను చూడండి.",
  noMarketHistory: "ఈ పంటకు సరిపోలే నివేదిత మార్కెట్ రికార్డులు ఇంకా లేవు.",
  sellNow: "ఇప్పుడే అమ్మండి", waitMarket: "వేచి మళ్లీ పరిశీలించండి", monitorMarket: "మార్కెట్‌ను గమనించండి",
  openMandi: "మార్కెట్ ధరలు చూడండి",
  farmAlertsTitle: "వాతావరణ ఆధారిత వ్యవసాయ హెచ్చరికలు", forecastVerified: "అంచనా ఆధారితం",
  generalAdviceLabel: "సాధారణ సూచన · మీ ప్రాంతంలో ధృవీకరించబడలేదు",
  noActiveFarmAlerts: "అందుబాటులో ఉన్న అంచనాలో హెచ్చరిక స్థాయులు దాటలేదు. స్థానిక పరిస్థితులను గమనించండి.",
  alertHeavyRainTitle: "భారీ వర్షం పడవచ్చు", alertRainTitle: "వర్షం పడవచ్చు",
  alertRainAmountBody: "{date}న {amount} మి.మీ. వర్షం పడే అవకాశం ఉంది. అనవసర నీటిపారుదల నివారించేందుకు నేల తేమను చూడండి.",
  alertHeatTitle: "అధిక ఉష్ణోగ్రత ఉండవచ్చు", alertWindTitle: "ప్రస్తుతం బలమైన గాలులు",
  generalWeatherAdviceTitle: "సాధారణ వాతావరణ సూచన",
  generalWeatherAdviceBody: "నీటిపారుదల, కోత లేదా పొలం పనులకు ముందు స్థానిక అంచనాను చూడండి. ఈ పొలానికి ప్రత్యక్ష అంచనా లోడ్ కాలేదు.",
  cropRiskTitle: "వాతావరణ సంబంధిత పంట ప్రమాదం", lowRisk: "తక్కువ ప్రమాదం",
  moderateRisk: "మధ్యస్థ ప్రమాదం", highRisk: "అధిక ప్రమాదం", riskUnavailable: "ప్రమాద సూచిక అందుబాటులో లేదు",
  postHarvestEyebrow: "కోత మరియు నిల్వ", postHarvestTitle: "కోత తర్వాత నిల్వ మరియు నష్ట ప్రమాద సూచిక",
  postHarvestSub: "ప్రస్తుత బయటి ఉష్ణోగ్రత, తేమ ఆధారంగా సుమారు నిల్వ అంచనా.",
  postHarvestCrop: "కోత చేసిన పంట", postHarvestMethod: "నిల్వ విధానం",
  postHarvestWindow: "అంచనా సురక్షిత నిల్వ సమయం", postHarvestRisk: "పాడయ్యే ప్రమాదం",
  postHarvestAction: "చర్య సూచన", postHarvestSellImmediately: "వెంటనే అమ్మండి",
  postHarvestSafeToStore: "నిల్వ చేయవచ్చు", postHarvestRiskHigh: "అధికం",
  postHarvestRiskModerate: "మధ్యస్థం", postHarvestRiskLow: "తక్కువ",
  storageOpenShed: "తెరిచిన షెడ్", storageGunnyBags: "గోనె సంచులు", storageColdStorage: "శీతల గిడ్డంగి",
  farmCostsTitle: "వ్యవసాయ ఖర్చుల విశ్లేషణ", totalInvestment: "మొత్తం పెట్టుబడి",
  largestExpense: "అత్యధిక ఖర్చు విభాగం", expenseBreakdown: "ఖర్చుల వివరాలు",
  noExpensesEntered: "ఖర్చుల విభజన చూడటానికి లాభాల లెక్కింపులో అంచనా ఖర్చులు నమోదు చేయండి.",
  personalizedTitle: "మీ కోసం వ్యవసాయ సూచనలు", priorityHigh: "అధికం", priorityMedium: "మధ్యస్థం", priorityLow: "తక్కువ",
  selectCropForSmartFarm: "వ్యవసాయ సారాంశాన్ని వ్యక్తిగతీకరించడానికి పంటను ఎంచుకోండి.",
  soilTitle: "నేల వివరాలు", soilSub: "మీ పొలంలోని నేలను అర్థం చేసుకోవడానికి సరళమైన మార్గదర్శిని.",
  profitCalculatorEyebrow: "మీ వ్యవసాయ సీజన్‌ను ప్రణాళిక చేయండి", profitCalculatorTitle: "రైతు లాభాల లెక్కింపు",
  profitCalculatorSub: "మీ పొలం అంచనాల ఆధారంగా పంట ఆదాయం, ఖర్చులు, లాభాన్ని లెక్కించండి.",
  estimateBadge: "మీ అంచనా", cropSelect: "పంట", chooseCrop: "పంటను ఎంచుకోండి",
  cultivatedArea: "సాగు భూమి (ఎకరాలు)", expectedYieldPerAcre: "ఎకరానికి అంచనా దిగుబడి (క్వింటాళ్లు)",
  expectedSellingPrice: "అంచనా అమ్మకపు ధర (₹ / క్వింటాల్)", estimatedExpenses: "అంచనా ఖర్చులు (₹)",
  calculatorExpenseHelp: "సీజన్‌కు అయ్యే ఖర్చులను నమోదు చేయండి; వర్తించని ఖర్చులకు ₹0 ఉంచండి.",
  seedExpense: "విత్తనాలు", fertilizerExpense: "ఎరువులు", labourExpense: "కూలి", irrigationExpense: "నీటిపారుదల",
  transportExpense: "రవాణా", otherExpense: "ఇతర ఖర్చులు",
  calculatorResults: "మీ అంచనా ఫలితాలు", calculatorPrompt: "అంచనా కోసం పంట, భూమి, దిగుబడి, అమ్మకపు ధర నమోదు చేయండి.",
  totalExpectedYield: "మొత్తం అంచనా దిగుబడి", expectedRevenue: "మొత్తం అంచనా ఆదాయం", quintals: "క్వింటాళ్లు",
  totalExpenses: "మొత్తం ఖర్చులు", estimatedProfit: "అంచనా లాభం", profitPerAcre: "ఎకరానికి లాభం",
  financialBreakdown: "ఆదాయం మరియు ఖర్చుల పోలిక", revenueLabel: "ఆదాయం", expensesLabel: "ఖర్చులు",
  netProfitLabel: "నికర లాభం", calculatorDisclaimer: "ఇది మీరు నమోదు చేసిన వివరాల ఆధారంగా అంచనా మాత్రమే; హామీ ఆదాయం కాదు. నిజమైన దిగుబడి, ధరలు, ఖర్చులు మారవచ్చు.",
  soilHealth: "నేల ఆరోగ్య సారాంశం", soilType: "నేల రకం", phLevel: "pH స్థాయి", organicMatter: "సేంద్రియ పదార్థం",
  nitrogen: "నత్రజని", phosphorus: "భాస్వరం", potassium: "పొటాషియం",
  cropTitle: "పంట సూచనలు", cropSub: "నమూనా ప్రొఫైల్ ఆధారంగా ఆలోచనలు — స్థానికంగా అనుకూలతను నిర్ధారించండి.",
  recommended: "పరిశీలించదగిన సూచనలు", season: "ఖరీఫ్ సీజన్", duration: "పంట కాలం", waterNeed: "నీటి అవసరం",
  advisoryTitle: "కృషిమిత్రను అడగండి", advisorySub: "వ్యవసాయ ప్రశ్నలకు సరళమైన, ఆచరణాత్మక సూచనలు పొందండి.",
  demoChat: "వ్యవసాయ సలహా", chatPlaceholder: "మీ వ్యవసాయ ప్రశ్నను టైప్ చేయండి…", send: "పంపండి",
  settingsTitle: "సెట్టింగ్‌లు", settingsSub: "కృషిమిత్రను మీ అవసరాలకు అనుగుణంగా మార్చుకోండి.",
  language: "భాష", chooseLanguage: "మీకు నచ్చిన భాషను ఎంచుకోండి",
  profileSection: "రైతు ప్రొఫైల్", savedLocally: "మీ ప్రొఫైల్ ఈ పరికరంలో మాత్రమే భద్రపరచబడుతుంది.",
  clearProfile: "భద్రపరిచిన ప్రొఫైల్ తొలగించండి", profileTitle: "మీ రైతు ప్రొఫైల్",
  profileSub: "కొన్ని వివరాలు మీ వ్యవసాయ సహాయకుడిని వ్యక్తిగతీకరించడంలో సహాయపడతాయి.",
  fullName: "మీ పేరు", village: "గ్రామం", district: "జిల్లా", land: "భూమి విస్తీర్ణం (ఎకరాలు)",
  soilChoice: "నేల రకం", irrigation: "నీటిపారుదల వనరు", chooseOne: "ఒకటి ఎంచుకోండి",
  saveProfile: "ప్రొఫైల్ భద్రపరచండి", cancel: "రద్దు చేయండి", saved: "ఈ పరికరంలో ప్రొఫైల్ భద్రపరచబడింది.",
  profileMissing: "ప్రొఫైల్ భద్రపరచడానికి మీ పేరు, గ్రామం, జిల్లా నమోదు చేయండి.",
  profileCleared: "భద్రపరిచిన ప్రొఫైల్ తొలగించబడింది.",
  cropRice: "వరి", cropRagi: "రాగి", cropMaize: "మొక్కజొన్న", cropPulses: "పప్పుధాన్యాలు",
  profileBadge: "మీ వ్యవసాయం", typeRed: "ఎర్ర నేల", typeBlack: "నల్ల నేల",
  typeSandy: "ఇసుక నేల", typeLoamy: "లోమీ నేల", waterCanal: "కాలువ", waterBorewell: "బోర్‌వెల్",
  waterRainfed: "వర్షాధారం", waterOther: "ఇతర", noProfile: "ఇంకా ప్రొఫైల్ భద్రపరచలేదు",
  more: "మరిన్ని", prototype: "నమూనా", acres: "ఎకరాలు", cachedData: "క్యాష్ చేసినది",
  shareWhatsapp: "WhatsAppలో పంచుకోండి", listenToSummary: "వినండి / చదివించండి", stopReading: "చదవడం ఆపండి",
  speechUnavailable: "ఈ బ్రౌజర్‌లో మాటల రూపంలో వినిపించే సౌకర్యం లేదు.",
  turDal: "కందిపప్పు", postHarvestCropOnion: "ఉల్లిపాయ", postHarvestCropPotato: "బంగాళాదుంప",
  close: "మూసివేయండి",


  mandiShareMessage: "కృషిమిత్ర మార్కెట్ ధరల సారాంశం",


  selectCropForAdvisor: "ధరల చరిత్రను సమీక్షించడానికి పై నుంచి పంటను ఎంచుకోండి.",
  noAdvisorPrices: "ఈ పంట, ఫిల్టర్‌లకు సరిపడా ధరలు లేవు; చారిత్రక విశ్లేషణ అందుబాటులో లేదు.",

  reportedPriceMethod: "ఎంచుకున్న పంట, ఫిల్టర్‌లకు అందుబాటులో ఉన్న నివేదిత ధరల సగటు ఇది. ఇవి గత ధరలు మాత్రమే; అంచనా లేదా హామీ కాదు.",
 selectedRows: "ఎంచుకున్న రికార్డులు",
  noVariety: "రకం తెలియదు",

  profitSpeechSummary: "మీ అంచనా దిగుబడి {yield} క్వింటాళ్లు. అంచనా ఆదాయం {revenue}, మొత్తం ఖర్చులు {expenses}, అంచనా లాభం {profit}, ఎకరానికి లాభం {perAcre}.",
  profitShareMessage: "పంట: {crop}; దిగుబడి: {yield} క్వింటాళ్లు; ఆదాయం: {revenue}; ఖర్చులు: {expenses}; అంచనా లాభం: {profit}; ఎకరానికి లాభం: {perAcre}. ఇది హామీ కాదు, అంచనా మాత్రమే.",
  transportInviteMessage: "{village} సమీపంలో {farmers} మంది రైతులు రేపు {mandi}కి సరుకు వాహనాన్ని పంచుకునేందుకు కావాలి.",
  transportPoolingTitle: "సామూహిక రవాణా ఖర్చు గణకం",
  transportPoolingSub: "పంట పరిమాణం, దూరం, వాహనం పంచుకునే రైతుల సంఖ్య ఆధారంగా ఒక్కొక్కరి ఖర్చును అంచనా వేయండి.",
  harvestQuantity: "పంట పరిమాణం (క్వింటాళ్లు)", neighborFarmers: "పక్క రైతులు (మీతో సహా)",
  villageForInvite: "గ్రామం (ఆహ్వానం కోసం)", destinationMandi: "గమ్యస్థాన మార్కెట్",
  totalSharingFarmers: "రవాణా పంచుకునే రైతులు", pooledTransportCost: "పంచుకున్న అంచనా ఖర్చు / రైతు",
  transportPoolingAssumption: "ఇది ప్రణాళిక కోసం ఒక అంచనా మాత్రమే. వాహన ధర, లోడింగ్, రూట్, మార్కెట్ రుసుములు మారవచ్చు; వాహనం అందుబాటును నిర్ధారించండి.",
  transportInviteMissing: "WhatsApp ఆహ్వానాన్ని రూపొందించడానికి గ్రామం, మార్కెట్ నమోదు చేయండి.",
  postHarvestShareMessage: "కృషిమిత్ర పంట నిల్వ సారాంశం: {crop}, నిల్వ పద్ధతి {method}, అంచనా సురక్షిత నిల్వ కాలం {days} రోజులు, ప్రమాద స్థాయి {risk}.",

  postHarvestModelNote: "ఇది ప్రస్తుత బయటి ఉష్ణోగ్రత, తేమ ఆధారంగా చేసిన సుమారు అంచనా మాత్రమే; నిల్వ పరిస్థితులు, పంట నాణ్యత ఆధారంగా ఫలితం మారుతుంది.",
  postHarvestEstimateNote: "ఇవి సాధారణ ప్రణాళిక పరిమితులు మాత్రమే; గాలి ప్రసరణ, పంట తేమ, గాయాలు, స్థానిక పరిస్థితులు నిల్వ కాలాన్ని మార్చవచ్చు.",
  weatherRecommendationTitle: "మీ పొలానికి వాతావరణ సూచన",
  weatherRecommendationNoData: "వ్యక్తిగత వాతావరణ సూచనకు వాతావరణ పేజీలో ప్రాంతాన్ని ఎంచుకోండి.",
  weatherRecommendationNoAlert: "ప్రస్తుతం అంచనాలో ప్రత్యేక సూచన అవసరమైన పరిస్థితి లేదు. స్థానిక వాతావరణాన్ని గమనించండి.",
  marketRecommendationTitle: "మీ పంటకు మార్కెట్ సూచన",
  expenseRecommendationTitle: "పంట ఖర్చుల సమీక్ష",
  expenseRecommendationNoData: "లాభ గణకంలో అంచనా ఖర్చులు నమోదు చేస్తే ఈ సమీక్ష కనిపిస్తుంది.",
  expenseRecommendationNoCosts: "ఇంకా అంచనా ఖర్చులు నమోదు చేయలేదు.",
  marketInsufficientReason: "మూడు ధర తేదీలకంటే తక్కువ సమాచారం ఉంది; మార్కెట్ దిశను విశ్వసనీయంగా అంచనా వేయలేం.",
  locationUnset: "ప్రాంతం ఎంచుకోలేదు",
 marketSampleReason: "ఈ సూచన నమూనా ధరల ఆధారంగా మాత్రమే; ఇది నిజమైన మార్కెట్ సంకేతం లేదా అమ్మకపు సలహా కాదు.",
 riskWeatherUnavailable: "ఉష్ణోగ్రత, తేమ ఉన్న వాతావరణ సమాచారం అందుబాటులో లేదు.",
  riskContextNote: "అంచనా నిల్వ కాలం సాధారణ పరిస్థితులకే వర్తిస్తుంది. పంటను తరచూ తనిఖీ చేసి, తేమ లేదా చెడిపోవడం కనిపిస్తే వెంటనే చర్య తీసుకోండి.",
  largestExpenseInsight: "మీ అంచనాలో అత్యధిక ఖర్చు {category}గా ఉంది: {amount}. కొనుగోలు లేదా పని ఖర్చును స్థానికంగా పోల్చి చూడండి.",
  sampleLevel: "నమూనా", soilTipTitle: "మట్టి ఆరోగ్య సూచన",
  waterLowMedium: "తక్కువ నుండి మధ్యస్థం", askAbout: "ఈ అంశాల గురించి అడగండి",
  cropDoctorGuide: "లక్షణాల ఆధారంగా సాధ్యమైన కారణాలు, జాగ్రత్తలు చూడండి. ఇది వ్యాధి నిర్ధారణ కాదు.",
  cropDoctorTitle: "పంట ఆరోగ్య సహాయకుడు", cropDoctorSub: "పంట, కనిపిస్తున్న లక్షణాలను ఎంచుకుని సాధ్యమైన కారణాలపై మార్గదర్శనం పొందండి.",
  cropDoctorChooseCrop: "పంటను ఎంచుకోండి", cropDoctorClearSymptoms: "ఎంచుకున్న లక్షణాలను తొలగించండి",
  cropDoctorShareMessage: "కృషిమిత్ర పంట పరిశీలన: {crop}; లక్షణం: {symptom}; సాధ్యమైన సమస్య: {diagnosis}; సూచన: {prevention}. రసాయన చికిత్సకు ముందు స్థానిక వ్యవసాయ అధికారిని సంప్రదించండి.",
  cropDoctorPossibleIssue: "పరిశీలించాల్సిన సాధ్యమైన సమస్య", cropDoctorOrganic: "తక్షణ సేంద్రీయ చర్య / పరిష్కారం",
  cropDoctorPrevention: "నివారణ చర్యలు", cropDoctorDisclaimer: "ఇది ప్రాథమిక మార్గదర్శనం మాత్రమే, నిపుణుల నిర్ధారణ కాదు.",
  cropDoctorSafety: "కారణాన్ని నిర్ధారించకుండా మందు పిచికారీ చేయవద్దు. పంటకు అనుమతించిన లేబుల్ సూచనలను పాటించండి.",
 reply: "ముఖ్యమైన పొల నిర్ణయాలను స్థానిక KVK లేదా వ్యవసాయ అధికారితో నిర్ధారించుకోండి.",
 storageError: "ఈ బ్రౌజర్‌లో మీ ప్రొఫైల్‌ను భద్రపరచలేకపోయాం.",
  clearConfirm: "ఈ పరికరంలో భద్రపరిచిన రైతు ప్రొఫైల్‌ను తొలగించాలా?",
  speechError: "ధ్వని ప్లే కాలేదు. బ్రౌజర్ ఆడియో సెట్టింగ్‌లను తనిఖీ చేసి మళ్లీ ప్రయత్నించండి.",
  marketItems: "కల్పిత నమూనా ధరలు చూపబడుతున్నాయి", noPrice: "—",
  searchStateHelp: "ప్రాంతాలు, పంటల ఎంపికలు పొందిన డేటా రికార్డుల నుంచే వస్తాయి.",
  distanceToMandi: "మార్కెట్‌కు దూరం (కి.మీ.)", vehicleFare: "ఒక ప్రయాణానికి వాహన అద్దె (₹)",
  individualTransportCost: "ఒక్క రైతుకు ప్రయాణ ఖర్చు", transportSavings: "ప్రతి రైతుకు ఆదా",
  invitePreview: "WhatsApp ఆహ్వానం ప్రివ్యూ", dayUnit: "రోజులు",
  postHarvestWeatherUnavailable: "అంచనా కోసం ఉష్ణోగ్రత, తేమ రెండూ ఉన్న తాజా వాతావరణ సమాచారాన్ని లోడ్ చేయండి.",
  weatherRecommendationBody: "{alert} పొల పనులను ప్లాన్ చేయడానికి పైనున్న వాతావరణ వివరాలను చూడండి.",
  marketRecommendationBody: "{recommendation}: {reason}",
  expenseRecommendationBody: "మీరు నమోదు చేసిన ఖర్చుల్లో {category} వాటా {share}%. స్థానిక ధరలను పోల్చి రసీదులను భద్రపరచండి.",
  samplePeriodTwo: "నమూనా 2", samplePeriodThree: "నమూనా 3",
  riskMethod: "ఈ సాధారణ సూచిక వాతావరణ హెచ్చరికల రకాలను లెక్కిస్తుంది: ఏదీ లేకపోతే = తక్కువ, ఒకటి = మధ్యస్థం, రెండు లేదా అంతకంటే ఎక్కువ = ఎక్కువ. ఇది దిగుబడి లేదా పంట నష్ట అంచనా కాదు.",
  nearNeutral: "తటస్థానికి దగ్గరగా", medium: "మధ్యస్థం", good: "మంచిది",
  soilTip: "మీ పొలానికి పోషకాలను ప్రణాళిక చేయడానికి గుర్తింపు పొందిన స్థానిక ప్రయోగశాలలో మట్టి పరీక్ష చేయించడం ఉత్తమం.",
  waterLow: "తక్కువ", waterMedium: "మధ్యస్థం", waterHigh: "ఎక్కువ",
  cropTip: "పంట ఆలోచనలు నమూనా సూచనలు మాత్రమే; మీ ప్రాంతానికి సంబంధించిన వ్యవసాయ సలహా కావు.",
  cropDoctorCrop: "పంటను ఎంచుకోండి", cropDoctorSymptoms: "కనిపించే లక్షణాలను ఎంచుకోండి",
  cropDoctorChooseSymptoms: "మీరు గమనించిన ఒకటి లేదా అంతకంటే ఎక్కువ లక్షణాలను ఎంచుకోండి.",
  cropDoctorSeverity: "ప్రాథమిక తీవ్రత", cropDoctorChemical: "రసాయన ఎంపిక (కారణం నిర్ధారించినప్పుడే)",
  cropDoctorNoSelection: "సాధ్యమైన కారణాలను చూడటానికి పంటతో పాటు కనీసం ఒక లక్షణాన్ని ఎంచుకోండి.",
  about: "ఈ నమూనా గురించి",
  aboutCopy: "కృషిమిత్ర మొదట UI నమూనాగా ప్రారంభమైంది. వాతావరణం Open-Meteo నుంచి వస్తుంది; మార్కెట్ ధరలు, ఇతర నమూనా తెరల్లోని సమాచారం ప్రదర్శన కోసం మాత్రమే.",
  dayNext: "బుధవారం",
  sampleTip: "ధరలు మారవచ్చు. రవాణా, ఇతర ఖర్చులు మీ ఆదాయాన్ని ప్రభావితం చేస్తాయి; జాగ్రత్తగా పోల్చండి.",
  missingMandiKey: "సర్వర్ .env ఫైల్‌లో data.gov.in API కీని జోడించి, సర్వర్‌ను మళ్లీ ప్రారంభించండి.",
  rejectedMandiKey: "data.gov.in ఈ API కీని అంగీకరించలేదు. అది చెల్లుబాటులో ఉందో, ఈ వనరుకు అనుమతించబడిందో తనిఖీ చేయండి.",
  mandiNetworkError: "మార్కెట్ సేవను చేరుకోలేకపోయాం. ఇంటర్నెట్‌ను తనిఖీ చేసి మళ్లీ ప్రయత్నించండి.",
  mandiUpstreamError: "data.gov.in సేవ తాత్కాలికంగా అందుబాటులో లేదు. కొద్దిసేపటి తర్వాత మళ్లీ ప్రయత్నించండి.",
  mandiSchemaError: "డేటాసెట్ ప్రతిస్పందనను గుర్తించలేకపోయాం; ధరలు చూపబడవు.",
  adviceMonitor: "చివరి మూడు నివేదిత తేదీల్లో ధరలు క్రమంగా పెరిగాయి. నిర్ణయానికి ముందు తదుపరి నివేదికను గమనించవచ్చు; ఇది భవిష్యత్ ధరల అంచనా కాదు.",
  adviceSell: "చివరి మూడు నివేదిత తేదీల్లో ధరలు క్రమంగా తగ్గాయి. ఈరోజు ఆఫర్ మీ అవసరాలకు సరిపోతే, ధర పెరుగుతుందని మాత్రమే ఆశించి వేచి ఉండకుండా అమ్మడాన్ని పరిశీలించండి.",
  adviceNoSignal: "ఇటీవలి ధరల్లో స్థిరమైన దిశ కనిపించలేదు. నిర్ణయానికి ముందు మీ ఖర్చులు, స్థానిక ఆఫర్‌ను పోల్చండి.",
  adviceInsufficient: "ధరలు నమోదైన తేదీలు మూడుకంటే తక్కువగా ఉన్నాయి; అమ్మాలా వేచి చూడాలా సూచించడానికి చరిత్ర సరిపోదు.",
  trendIncreasing: "పెరుగుతోంది", trendDecreasing: "తగ్గుతోంది", trendStable: "స్థిరంగా ఉంది",
  samplePeriodOne: "నమూనా 1",
  sellNowReason: "చివరి మూడు రోజువారీ సగటు ధరలు వరుసగా తగ్గాయి. ఈరోజు స్థానిక ఆఫర్, మీ ఖర్చులను పరిగణించండి; ఇది భవిష్యత్ ధరల అంచనా కాదు.",
  waitMarketReason: "చివరి మూడు రోజువారీ సగటు ధరలు వరుసగా పెరిగాయి. నిర్ణయానికి ముందు తదుపరి నివేదికను పరిశీలించండి; భవిష్యత్ ధరలకు హామీ లేదు.",
  monitorMarketReason: "ఇటీవలి నివేదికల్లో వరుసగా మూడు తేదీలకు ఒకే దిశ కనిపించలేదు; మార్కెట్‌ను గమనించి స్థానిక ఆఫర్లను పోల్చండి.",
  alertHeavyRainBody: "{date}న {amount} మి.మీ. వర్షం అంచనా. నీటిపారుదలను వాయిదా వేయడం, పొలంలో నీటి పారుదల తనిఖీ చేయడం పరిశీలించండి.",
  alertRainBody: "{date}న వర్షావకాశం {chance}%. అవసరం లేని నీటిపారుదలను నివారించడానికి ముందు మట్టి తేమను తనిఖీ చేయండి.",
  alertHeatBody: "{date}న గరిష్ఠ ఉష్ణోగ్రత {temperature}°Cగా అంచనా. పంట నీటి అవసరాన్ని గమనించండి.",
  alertWindBody: "ప్రస్తుతం బలమైన గాలులు వీచే అవకాశం ఉంది. సున్నితమైన పంటలకు ఆసరా, కట్టుదిట్టతను తనిఖీ చేయండి.",
  riskFactorWeather: "వాతావరణ హెచ్చరిక: {title}",
  postHarvestSellTip: "సురక్షిత నిల్వ కాలం తక్కువగా ఉండవచ్చని అంచనా. వెంటనే అమ్మడం లేదా ప్రాసెసింగ్‌కు ప్రాధాన్యత ఇవ్వండి, పంటను పరిశీలించండి; ఈ అంచనాపైనే ఆధారపడవద్దు.",
  postHarvestStoreTip: "ఈ అంచనా స్వల్పకాలిక నిల్వకు అవకాశం చూపుతోంది. పంటను పొడిగా, గాలి ఆడేలా ఉంచి తరచుగా తనిఖీ చేయండి.",
  noLargestExpense: "ఇంకా ఖర్చులు నమోదు చేయలేదు.", allKarnataka: "భారతదేశం అంతా",
  farmerUnitSingular: "రైతు", farmerUnitPlural: "రైతులు",
  learnMore: "ఈ పంట ఎందుకు?", chatWelcome: "నమస్కారం! నేను మీ నమూనా వ్యవసాయ సహాయకుడిని. సాధారణ ప్రశ్న అడగండి లేదా క్రింది సూచనల్లో ఒకదాన్ని ఎంచుకోండి.",
  prompts: "నమూనా ప్రశ్నను ప్రయత్నించండి",
  riceDesc: "నీటి లభ్యత ఉన్న ప్రాంతాల్లో పండించే సాధారణ వర్షాకాల పంట.",
  ragiDesc: "తక్కువ నుంచి మధ్యస్థ నీటితో పండే పోషకమైన చిరుధాన్యం.",
  maizeDesc: "పంట మార్పిడిలో ఉపయోగపడే బహుళ ప్రయోజన పంట.",
  pulsesDesc: "పప్పుధాన్యాలు పంట వైవిధ్యానికి, నేలలో పోషక చక్రానికి తోడ్పడవచ్చు.",
  saveChanges: "మార్పులను భద్రపరచండి", chartLabel: "నమూనా వర్షపాతం ధోరణి",
  menu: "మెను", percent: "శాతం", liveDataStatus: "🟢 ప్రత్యక్ష డేటా",
  offlineDataStatus: "🟡 ఆఫ్‌లైన్ మోడ్ · క్యాష్ చేసినది", sampleMarket: "మైసూరు నమూనా మార్కెట్",
  cropDoctorYellowing: "ఆకులు పసుపు రంగులోకి మారడం", cropDoctorBrownSpots: "గోధుమ రంగు మచ్చలు",
  cropDoctorLeafCurling: "ఆకులు ముడుచుకోవడం", cropDoctorWilting: "వాడిపోవడం",
  cropDoctorWhitePowder: "తెల్లటి పొడి లేదా పెరుగుదల", cropDoctorBorerHoles: "కాండం లేదా పండులో తొలిచిన రంధ్రాలు",
  cropDoctorTomato: "టమాటా", cropDoctorCotton: "పత్తి", cropDoctorChilli: "మిరప",
  cropDoctorOrganicYellow: "మట్టి తేమ, నీటి పారుదల, ఆకు అడుగు భాగాన్ని తనిఖీ చేయండి. స్థానిక పరిస్థితులను పరిశీలించిన తర్వాతే పోషకాలను సరిచేయండి; పీల్చే పురుగులు కనిపించి, పంట లేబుల్ అనుమతిస్తేనే వేప ఉత్పత్తి వాడండి.",
  cropDoctorOrganicSpots: "తీవ్రంగా ప్రభావితమైన ఆకులు, పంట అవశేషాలను తొలగించండి; ఆకులు తడవకుండా చూడండి. ఇవి పరిశుభ్రతకు తోడ్పడతాయి కానీ నయం చేస్తాయని హామీ లేదు.",
  cropDoctorOrganicCurl: "ఆకుల అడుగు భాగాన్ని పరిశీలించి, తీవ్రంగా ప్రభావితమైన ఆకులను తొలగించండి. పంట లేబుల్ అనుమతిస్తే వేప కొన్ని మృదుశరీర పురుగులకు ఉపయోగపడవచ్చు; వైరస్‌ను నయం చేయదు.",
  cropDoctorOrganicWilt: "మట్టి తేమ, నీటి పారుదలను తనిఖీ చేయండి; వాడిన మొక్కలు నిర్ధారితమైతే వేర్లతో సహా వేరు చేసి తొలగించండి. నిర్ధారించని మిశ్రమాలను మట్టిలో వేయవద్దు.",
  cropDoctorOrganicPowder: "ప్రభావిత ఆకులను తొలగించి గాలి ప్రసరణ మెరుగుపరచండి. చికిత్సకు ముందు అది దుమ్ము లేదా పిచికారీ అవశేషం కాదని నిర్ధారించండి.",
  cropDoctorOrganicBorer: "తొలిచిన మొక్క భాగాలను తొలగించి నాశనం చేయండి; గుర్తించిన పురుగు, పంటకు సరిపోతేనే ఫెరోమోన్ ఉచ్చు వాడండి.",
  cropDoctorPreventYellow: "క్రమం తప్పకుండా పరిశీలించండి, తగిన నీటి పారుదల ఉంచండి, స్థానిక మట్టి సూచనల ఆధారంగా సమతుల్య పోషకాలు వాడండి.",
  cropDoctorPreventSpots: "పంట అవశేషాలను తొలగించండి, గాలి ప్రసరణకు అవకాశం ఇవ్వండి, సాధ్యమైనప్పుడు ఆకులు ఎక్కువసేపు తడిగా ఉండకుండా చూడండి.",
  cropDoctorPreventCurl: "ఆకుల అడుగు భాగంలో పురుగులను పరిశీలించండి, కలుపు లేదా ప్రత్యామ్నాయ ఆశ్రయ మొక్కలను తొలగించి, పక్క మొక్కలను గమనించండి.",
  cropDoctorPreventWilt: "శుభ్రమైన పరికరాలు వాడండి, కలుషిత మట్టిని తరలించవద్దు, పంట మార్పిడి, నీటి పారుదలపై స్థానిక సలహా పొందండి.",
  cropDoctorPreventPowder: "గాలి ప్రసరణ కోసం మొక్కలకు తగినంత దూరం ఇవ్వండి, ప్రభావిత అవశేషాలు తొలగించి పక్క మొక్కలను పరిశీలించండి.",
  cropDoctorPreventBorer: "గుడ్లు, కొత్త రంధ్రాల కోసం పరిశీలించండి; ప్రభావిత భాగాలను తొలగించి, సూచించినప్పుడు ఆ పురుగుకు సరిపోయే ఉచ్చులు వాడండి.",
  cropDoctorChemicalNone: "ఈ ఒక్క లక్షణం ఆధారంగా రసాయనం సూచించబడదు. ముందుగా నీరు, పోషకాలు, పురుగుల ఉనికిని తనిఖీ చేసి, పిచికారీకి ముందు నిర్ధారించండి.",
  cropDoctorChemicalFungicide: "శిలీంధ్ర వ్యాధి నిర్ధారితమైతే, ఈ పంట, వ్యాధికి ప్రస్తుతం నమోదైన ఉత్పత్తి గురించి స్థానిక KVK లేదా వ్యవసాయ అధికారిని అడిగి, లేబుల్ పాటించండి.",
  cropDoctorChemicalInsecticide: "పేర్కొన్న పురుగు నిర్ధారితమైతే, ఈ పంట, పురుగును లేబుల్‌లో పేర్కొన్న ప్రస్తుతం నమోదైన ఉత్పత్తినే వాడండి; స్థానిక సలహా తీసుకుని లేబుల్ పాటించండి.",
  cropDoctorChemicalVector: "తెల్లదోమ లేదా త్రిప్స్ నిర్ధారితమైతే, నమోదైన వాహక నియంత్రణ ఉత్పత్తి గురించి స్థానిక సలహా పొందండి. ఇది వైరస్ సోకిన మొక్కలను నయం చేయదు; లేబుల్ పాటించండి.",
  cropDoctorChemicalBorer: "తొలిచే పురుగు నిర్ధారితమైతే, ఈ పంట, పురుగుకు నమోదైన ఉత్పత్తి గురించి స్థానిక KVK లేదా వ్యవసాయ అధికారిని అడిగి, లేబుల్ పాటించండి.",
};

const tamilText: CompleteAppTranslations = {
  dashboard: "முகப்புப் பலகை", weather: "வானிலை", mandi: "சந்தை விலைகள்", profit: "லாபக் கணக்கீடு",
  smartFarm: "ஸ்மார்ட் விவசாயம்", irrigationPlanner: "நீர்ப்பாசனத் திட்டம்", soil: "மண் விவரம்",
  cropDoctor: "பயிர் மருத்துவர்", schemes: "திட்டங்கள் மற்றும் மானியங்கள்", crops: "பயிர் பரிந்துரைகள்",
  cropRotation: "பயிர் சுழற்சி திட்டம்", advisory: "விவசாய ஆலோசனை", settings: "அமைப்புகள்",
  greeting: "காலை வணக்கம்", welcome: "உங்கள் பண்ணை, ஒரு படி முன்னே.", demo: "மாதிரித் தரவு",
  demoNote: "இந்த மாதிரித் தகவல் விளக்கத்திற்காக மட்டுமே; இது நேரடி அல்லது இடத்திற்கேற்ற தகவல் அல்ல.",
  todayAt: "இன்றைய முக்கியத் தகவல்கள்", weatherCard: "வானிலை முன்னறிவிப்பு", marketCard: "சந்தை நிலவரம்",
  rainChance: "மழை வாய்ப்பு", humidity: "ஈரப்பதம்", viewWeather: "வானிலையைப் பார்க்கவும்",
  viewMarket: "விலைகளைப் பார்க்கவும்", yourFarm: "உங்கள் பண்ணை விவரம்", addFarm: "பண்ணை விவரங்களைச் சேர்க்கவும்",
  editProfile: "விவரத்தைத் திருத்தவும்", setupPrompt: "உங்களுக்கு ஏற்ற பரிந்துரைகளுக்கு பண்ணை விவரங்களைச் சேர்க்கவும்.",
  completeProfile: "விவரத்தை அமைக்கவும்", quickActions: "விரைவு செயல்கள்", askMitra: "கிருஷிமித்ராவிடம் கேளுங்கள்",
  soilCheck: "மண் வழிகாட்டியைப் பார்க்கவும்", cropPlanner: "பயிர் யோசனைகளைப் பார்க்கவும்",
  fieldNote: "இன்றைய சிறு கவனம் நாளைய நல்ல விளைச்சலுக்கு உதவும்.",
  weatherTitle: "வானிலை முன்னறிவிப்பு", weatherSub: "தற்போதைய நிலை மற்றும் ஏழு நாள் முன்னறிவிப்புக்காக நகரம், மாவட்டம் அல்லது கிராமத்தைத் தேடுங்கள்.",
  currentConditions: "தற்போதைய நிலை", feelsLike: "உணரப்படும் வெப்பநிலை", wind: "காற்று",
  nextDays: "அடுத்த சில நாட்கள்", dayToday: "இன்று", dayTomorrow: "நாளை", sunny: "வெயில்",
  partlyCloudy: "ஓரளவு மேகமூட்டம்", lightShower: "லேசான மழை", foggy: "மூடுபனி",
  drizzle: "தூறல்", rainCondition: "மழை", snow: "பனி", thunderstorm: "இடியுடன் கூடிய மழை",
  dashboardWeatherNote: "வானிலை Open-Meteo இலிருந்து நேரடியாகப் பெறப்படுகிறது. சந்தை விலைகள் மாதிரித் தரவு.",
  weatherSource: "OPEN-METEO", live: "நேரடி", searchLocation: "உங்கள் இடத்தைத் தேடுங்கள்",
  searchPlaceholder: "நகரம், மாவட்டம் அல்லது கிராமத்தைத் தேடுங்கள்", search: "தேடு", searching: "தேடுகிறது…",
  noLocationResults: "இடங்கள் கிடைக்கவில்லை. அருகிலுள்ள நகரம் அல்லது மாவட்டத்தை முயற்சிக்கவும்.",
  selectLocation: "சரியான இடத்தைத் தேர்ந்தெடுக்கவும்", selectedLocation: "தேர்ந்தெடுத்த இடம்",
  clearLocation: "இடத்தை மாற்றவும்", currentTemperature: "வெப்பநிலை", rainfall: "மழைப்பொழிவு",
  currentRain: "தற்போதைய மழை", todayRainProbability: "இன்றைய மழை வாய்ப்பு",
  forecastTitle: "ஏழு நாள் முன்னறிவிப்பு", high: "அதிகபட்சம்", low: "குறைந்தபட்சம்",
  expectedRain: "எதிர்பார்க்கப்படும் மழை", lastUpdated: "கடைசியாகப் புதுப்பித்தது",
  dataSource: "தரவு மூலம்", refreshWeather: "வானிலையைப் புதுப்பிக்கவும்", refreshing: "புதுப்பிக்கிறது…",
  loadingWeather: "நேரடி வானிலை பெறப்படுகிறது…", chooseWeatherLocation: "நேரடி வானிலையைப் பார்க்க இடத்தைத் தேர்ந்தெடுக்கவும்.",
  noWeatherData: "தற்போது வானிலைத் தகவல் கிடைக்கவில்லை.",
  weatherSearchHelp: "தேடல் முடிவுகள் Open-Meteo இலிருந்து வருகின்றன. உங்கள் சாதனத்தின் இருப்பிடம் கோரப்படாது.",
  farmingAdvisory: "விவசாய வானிலை ஆலோசனை", noAdvisories: "இந்த முன்னறிவிப்பில் வானிலை எச்சரிக்கைகள் இல்லை.",
  advisoryRain: "மழை பெய்ய வாய்ப்புள்ளது. நீர்ப்பாசனத் தேவையைச் சரிபார்க்கவும்.",
  advisoryHeavyRain: "கனமழை பெய்ய வாய்ப்புள்ளது. வயல் வடிகால்களைச் சரிபார்க்கவும்.",
  advisoryHeat: "அதிக வெப்பநிலை எதிர்பார்க்கப்படுகிறது. பயிரின் நீர்த் தேவையைக் கண்காணிக்கவும்.",
  advisoryWind: "பலத்த காற்று வீசலாம். பாதிக்கப்படக்கூடிய பயிர்களுக்கு ஆதரவு உள்ளதா எனப் பார்க்கவும்.",
  weatherError: "வானிலைச் சேவைப் பிழை", weatherNetworkError: "இணைக்க முடியவில்லை. இணையத்தைச் சரிபார்த்து மீண்டும் முயற்சிக்கவும்.",
  weatherHttpError: "வானிலைச் சேவை தற்காலிகமாகக் கிடைக்கவில்லை. பின்னர் முயற்சிக்கவும்.",
  weatherApiError: "இந்த இடத்திற்கான வானிலைத் தகவலைப் பெற முடியவில்லை.",
  weatherInvalidError: "வானிலைச் சேவையிலிருந்து எதிர்பாராத தகவல் கிடைத்தது. மீண்டும் முயற்சிக்கவும்.",
  locationSaveError: "இந்த உலாவியில் தேர்ந்தெடுத்த இடத்தைச் சேமிக்க முடியவில்லை.",
  mandiTitle: "சந்தை விலைகள்", mandiSub: "இந்திய மற்றும் மாநிலச் சந்தை விலைகள்; மாதிரிப் பதிவுகள் தெளிவாகக் குறிக்கப்பட்டுள்ளன.",
  marketBoard: "AGMARKNET தினசரி விலைகள்", commodity: "பயிர்", market: "சந்தை", price: "விலை / குவிண்டால்",
  change: "மாற்றம்", state: "மாநிலம்", districtLabel: "மாவட்டம்", variety: "வகை", arrivalDate: "வருகை தேதி",
  minPrice: "குறைந்தபட்ச விலை", maxPrice: "அதிகபட்ச விலை", modalPrice: "மாதிரி விலை",
  selectState: "மாநிலத்தைத் தேர்ந்தெடுக்கவும்", selectDistrict: "அனைத்து மாவட்டங்கள்",
  selectMarket: "அனைத்து சந்தைகள்", searchCrop: "பயிரைத் தேடி தேர்ந்தெடுக்கவும்",
  cropSearchPlaceholder: "தரவிலுள்ள பயிர்களைத் தேடுங்கள்…",
  noCrops: "கிடைக்கும் தரவில் பொருந்தும் பயிர்கள் இல்லை.", loadingMarkets: "அரசு சந்தைத் தரவு ஏற்றப்படுகிறது…",
  noMarketData: "இந்தத் தேர்வுக்குச் சந்தைப் பதிவுகள் இல்லை.",
  noDataForFilters: "இந்த வடிகட்டிகளுக்கு பதிவுகள் இல்லை. வேறு பயிர், மாவட்டம் அல்லது சந்தையைத் தேர்ந்தெடுக்கவும்.",
  chooseCropForCompare: "சந்தை விலைகளை ஒப்பிடப் பயிரைத் தேடித் தேர்ந்தெடுக்கவும்.",
  marketApiSource: "இந்திய அரசு · AGMARKNET", sampleCachedMandiData: "மாதிரி / சேமித்த AGMARKNET தரவு",
  sampleDataSource: "விளக்கத்திற்கான மாதிரித் தரவு · நேரடி அல்லது அரசு அறிக்கை அல்ல",
  mixedDataSource: "மாதிரிப் பதிவுகளும் சாதனத்தில் சேமித்த AGMARKNET தரவும்",
  cachedPriceExplanation: "இந்தச் சாதனத்தில் முன்பு பெறப்பட்ட AGMARKNET பதிவுகள் காட்டப்படுகின்றன. அவை தற்போதைய விலையாக இருக்காமல் இருக்கலாம்.",
  lastUpdatedMandi: "கடைசியாகப் புதுப்பித்தது", dataRows: "பெறப்பட்ட பதிவுகள்",
  mandiErrorTitle: "சந்தைத் தரவை ஏற்ற முடியவில்லை", refreshPrices: "விலைகளைப் புதுப்பிக்கவும்",
  refreshingPrices: "புதுப்பிக்கிறது…", compareMarkets: "தேர்ந்தெடுத்த மாநிலச் சந்தைகளை ஒப்பிடவும்",
  sortByModal: "மாதிரி விலையின்படி வரிசைப்படுத்தவும்", ascending: "குறைந்தது முதலில்", descending: "அதிகம் முதலில்",
  priceAdvisory: "விலை ஒப்பீட்டுக் குறிப்புகள்", noCompareData: "சந்தைகளை ஒப்பிடப் போதுமான விலைப் பதிவுகள் இல்லை.",
  highestReported: "அதிகமாகப் பதிவான மாதிரி விலை", lowestReported: "குறைவாகப் பதிவான மாதிரி விலை",
  transportNote: "அதிகப் பதிவான விலை அதிக வருமானத்திற்கு உத்தரவாதமல்ல. போக்குவரத்து உள்ளிட்ட செலவுகளையும் கணக்கிடவும்.",
  priceHistory: "பதிவான விலை வரலாறு", fromDate: "தொடக்க தேதி", toDate: "முடிவு தேதி",
  missingDates: "இந்தத் தேதிகளுக்குப் பதிவுகள் இல்லை", noHistory: "இந்தத் தேர்வுக்குப் பழைய பதிவுகள் இல்லை.",
  sourceUnitNote: "மூலத்தில் உள்ளபடி விலைகள் குவிண்டாலுக்கு ₹ எனக் காட்டப்படுகின்றன.",
  sellWaitTitle: "இப்போது விற்கலாமா, காத்திருக்கலாமா?", sellWaitSub: "தேர்ந்தெடுத்த பயிரின் கடந்த பதிவான விலைகளை மட்டும் சார்ந்த எச்சரிக்கையான வழிகாட்டி.",
  currentReportedPrice: "சமீபத்திய பதிவான சராசரி விலை", previousReportedPrice: "முந்தைய பதிவான சராசரி விலை",
  priceChange: "முந்தைய பதிவிலிருந்து மாற்றம்", trend: "சமீபத்திய பதிவான போக்கு",
  trendRising: "உயர்கிறது", trendFalling: "குறைகிறது", trendMixed: "கலவையாக அல்லது நிலையாக உள்ளது",
  trendInsufficient: "போக்கைக் காட்டப் போதுமான தரவு இல்லை",
  recommendationMonitor: "சந்தையைத் தொடர்ந்து கவனிக்கவும்", recommendationSell: "விற்பதைப் பரிசீலிக்கவும்",
  recommendationNoSignal: "தெளிவான அறிகுறி இல்லை", recommendationInsufficient: "பரிந்துரைக்கப் போதுமான வரலாறு இல்லை",
  reportedPriceHistory: "சமீபத்திய பதிவான விலைகள்",
  smartFarmTitle: "ஸ்மார்ட் பண்ணை முடிவு மையம்",
  smartFarmSub: "உங்கள் பண்ணை விவரம், வானிலை, சந்தை அறிக்கைகள் மற்றும் செலவு மதிப்பீட்டை ஒரே இடத்தில் பாருங்கள்.",
  smartFarmEyebrow: "உங்கள் பண்ணை முடிவு மையம்", smartFarmOverview: "பண்ணைச் சுருக்கம்",
  todayForecast: "வானிலை முன்னறிவிப்பு", noForecastForFarm: "நேரடி முன்னறிவிப்புக்காக வானிலைத் திரையில் இடத்தைத் தேர்ந்தெடுக்கவும்.",
  noFarmSoil: "விவசாயி விவரத்தில் மண் வகை சேமிக்கப்படவில்லை.",
  profileSoilNote: "சேமித்த விவரத்திலுள்ள மண் வகை; ஆய்வக மண் பரிசோதனை அல்ல.",
  latestMandiAverage: "சமீபத்திய பதிவான சந்தை சராசரி", demoPriceLabel: "மாதிரி விலை · நேரடி சந்தை விலை அல்ல",
  samplePriceExplanation: "விளக்கத்திற்கான விலைகள் மட்டுமே. இந்தப் பயிரின் பதிவான விலைகளுக்கு சந்தை விலைகள் திரையைப் பார்க்கவும்.",
  noMarketHistory: "இந்தப் பயிருக்கு பொருந்தும் பதிவான சந்தைத் தரவு இன்னும் இல்லை.",
  sellNow: "இப்போது விற்கவும்", waitMarket: "காத்திருந்து மீண்டும் பார்க்கவும்", monitorMarket: "சந்தையைக் கண்காணிக்கவும்",
  openMandi: "சந்தை விலைகளைப் பார்க்கவும்",
  farmAlertsTitle: "வானிலை சார்ந்த பண்ணை எச்சரிக்கைகள்", forecastVerified: "முன்னறிவிப்பு அடிப்படையில்",
  generalAdviceLabel: "பொதுவான வழிகாட்டி · உங்கள் இடத்தில் சரிபார்க்கப்படவில்லை",
  noActiveFarmAlerts: "கிடைத்த முன்னறிவிப்பில் எச்சரிக்கை வரம்புகள் எட்டப்படவில்லை. உள்ளூர் நிலவரத்தைக் கவனிக்கவும்.",
  alertHeavyRainTitle: "கனமழை எதிர்பார்க்கப்படுகிறது", alertRainTitle: "மழை எதிர்பார்க்கப்படுகிறது",
  alertRainAmountBody: "{date} அன்று {amount} மி.மீ. மழை எதிர்பார்க்கப்படுகிறது. தேவையற்ற நீர்ப்பாசனத்தைத் தவிர்க்க மண் ஈரத்தைச் சரிபார்க்கவும்.",
  alertHeatTitle: "அதிக வெப்பநிலை எதிர்பார்க்கப்படுகிறது", alertWindTitle: "தற்போது பலத்த காற்று",
  generalWeatherAdviceTitle: "பொதுவான வானிலை நினைவூட்டல்",
  generalWeatherAdviceBody: "நீர்ப்பாசனம், அறுவடை அல்லது வயல் பணிக்கு முன் உள்ளூர் முன்னறிவிப்பைப் பாருங்கள். இந்தப் பண்ணைக்கு நேரடி முன்னறிவிப்பு இல்லை.",
  cropRiskTitle: "வானிலையுடன் தொடர்புடைய பயிர் அபாயம்", lowRisk: "குறைந்த அபாயம்",
  moderateRisk: "மிதமான அபாயம்", highRisk: "அதிக அபாயம்", riskUnavailable: "அபாயக் குறியீடு கிடைக்கவில்லை",
  postHarvestEyebrow: "அறுவடை மற்றும் சேமிப்பு", postHarvestTitle: "அறுவடைக்குப் பிந்தைய சேமிப்பு மற்றும் அழுகல் அபாயம்",
  postHarvestSub: "தற்போதைய வெளிப்புற வெப்பநிலை மற்றும் ஈரப்பதத்தைப் பயன்படுத்திய தோராயமான சேமிப்பு மதிப்பீடு.",
  postHarvestCrop: "அறுவடை செய்த பயிர்", postHarvestMethod: "சேமிப்பு முறை",
  postHarvestWindow: "மதிப்பிடப்பட்ட பாதுகாப்பான சேமிப்பு காலம்", postHarvestRisk: "அழுகல் அபாயம்",
  postHarvestAction: "செயல் குறிப்பு", postHarvestSellImmediately: "உடனே விற்கவும்",
  postHarvestSafeToStore: "சேமிக்கலாம்", postHarvestRiskHigh: "அதிகம்", postHarvestRiskModerate: "மிதமானது",
  postHarvestRiskLow: "குறைவு", storageOpenShed: "திறந்த கொட்டகை", storageGunnyBags: "சணல் மூட்டைகள்",
  storageColdStorage: "குளிர்பதனக் கிடங்கு",
  farmCostsTitle: "பண்ணைச் செலவு விவரங்கள்", totalInvestment: "மொத்த முதலீடு",
  largestExpense: "அதிகச் செலவு வகை", expenseBreakdown: "செலவுப் பிரிப்பு",
  noExpensesEntered: "செலவுப் பிரிவைப் பார்க்க லாபக் கணக்கீட்டில் மதிப்பிடப்பட்ட செலவுகளைச் சேர்க்கவும்.",
  personalizedTitle: "உங்களுக்கான விவசாயப் பரிந்துரைகள்", priorityHigh: "அதிகம்",
  priorityMedium: "மிதமானது", priorityLow: "குறைவு",
  selectCropForSmartFarm: "பண்ணைச் சுருக்கத்தைத் தனிப்பயனாக்கப் பயிரைத் தேர்ந்தெடுக்கவும்.",
  soilTitle: "மண் விவரம்", soilSub: "உங்கள் வயல் மண்ணைப் புரிந்துகொள்ள எளிய வழிகாட்டி.",
  profitCalculatorEyebrow: "உங்கள் பருவத்தைத் திட்டமிடுங்கள்", profitCalculatorTitle: "விவசாயி லாபக் கணக்கீடு",
  profitCalculatorSub: "உங்கள் பண்ணை மதிப்பீடுகளைப் பயன்படுத்தி பயிர் வருவாய், செலவு, லாபத்தைக் கணக்கிடுங்கள்.",
  estimateBadge: "உங்கள் மதிப்பீடு", cropSelect: "பயிர்", chooseCrop: "பயிரைத் தேர்ந்தெடுக்கவும்",
  cultivatedArea: "சாகுபடி நிலம் (ஏக்கர்)", expectedYieldPerAcre: "ஏக்கருக்கு எதிர்பார்க்கும் விளைச்சல் (குவிண்டால்)",
  expectedSellingPrice: "எதிர்பார்க்கும் விற்பனை விலை (₹ / குவிண்டால்)", estimatedExpenses: "மதிப்பிடப்பட்ட செலவுகள் (₹)",
  calculatorExpenseHelp: "பருவத்திற்கான செலவுகளை உள்ளிடவும்; பொருந்தாத செலவுகளுக்கு ₹0 என வைக்கலாம்.",
  seedExpense: "விதைகள்", fertilizerExpense: "உரம்", labourExpense: "கூலி",
  irrigationExpense: "நீர்ப்பாசனம்", transportExpense: "போக்குவரத்து", otherExpense: "மற்ற செலவுகள்",
  calculatorResults: "உங்கள் மதிப்பிடப்பட்ட முடிவுகள்",
  calculatorPrompt: "மதிப்பீட்டைப் பெறப் பயிர், நிலம், விளைச்சல், விற்பனை விலையை உள்ளிடவும்.",
  totalExpectedYield: "மொத்த எதிர்பார்க்கும் விளைச்சல்", expectedRevenue: "மொத்த எதிர்பார்க்கும் வருவாய்",
  quintals: "குவிண்டால்", totalExpenses: "மொத்தச் செலவுகள்", estimatedProfit: "மதிப்பிடப்பட்ட லாபம்",
  profitPerAcre: "ஏக்கருக்கான லாபம்", financialBreakdown: "வருவாய் மற்றும் செலவு ஒப்பீடு",
  revenueLabel: "வருவாய்", expensesLabel: "செலவுகள்", netProfitLabel: "நிகர லாபம்",
  calculatorDisclaimer: "இது நீங்கள் உள்ளிட்ட விவரங்களின் அடிப்படையிலான மதிப்பீடு மட்டுமே; உத்தரவாதமான வருவாய் அல்ல. உண்மையான விளைச்சல், விலை, செலவு மாறலாம்.",
  soilHealth: "மண் ஆரோக்கியச் சுருக்கம்", soilType: "மண் வகை", phLevel: "pH அளவு",
  organicMatter: "கரிமப் பொருள்", nitrogen: "நைட்ரஜன்", phosphorus: "பாஸ்பரஸ்", potassium: "பொட்டாசியம்",
  cropTitle: "பயிர் பரிந்துரைகள்", cropSub: "மாதிரி விவரத்தை அடிப்படையாகக் கொண்ட யோசனைகள் — உள்ளூரில் பொருத்தத்தை உறுதிப்படுத்தவும்.",
  recommended: "பரிசீலிக்க வேண்டிய யோசனைகள்", season: "காரீஃப் பருவம்", duration: "பயிர் காலம்", waterNeed: "நீர்த் தேவை",
  advisoryTitle: "கிருஷிமித்ராவிடம் கேளுங்கள்",
  advisorySub: "விவசாயக் கேள்விகளுக்கு எளிய, நடைமுறைப் பரிந்துரைகளைப் பெறுங்கள்.",
  demoChat: "விவசாய ஆலோசனை", chatPlaceholder: "உங்கள் விவசாயக் கேள்வியை எழுதுங்கள்…", send: "அனுப்பு",
  settingsTitle: "அமைப்புகள்", settingsSub: "கிருஷிமித்ராவை உங்கள் தேவைக்கேற்ப அமைக்கவும்.",
  language: "மொழி", chooseLanguage: "விரும்பும் மொழியைத் தேர்ந்தெடுக்கவும்",
  profileSection: "விவசாயி விவரம்", savedLocally: "உங்கள் விவரம் இந்தச் சாதனத்தில் மட்டுமே சேமிக்கப்படும்.",
  clearProfile: "சேமித்த விவரத்தை அழிக்கவும்", profileTitle: "உங்கள் விவசாயி விவரம்",
  profileSub: "சில விவரங்கள் உங்கள் விவசாய உதவியாளரைத் தனிப்பயனாக்க உதவும்.",
  fullName: "உங்கள் பெயர்", village: "கிராமம்", district: "மாவட்டம்", land: "நில அளவு (ஏக்கர்)",
  soilChoice: "மண் வகை", irrigation: "நீர்ப்பாசன மூலம்", chooseOne: "ஒன்றைத் தேர்ந்தெடுக்கவும்",
  saveProfile: "விவரத்தைச் சேமிக்கவும்", cancel: "ரத்துசெய்", saved: "இந்தச் சாதனத்தில் விவரம் சேமிக்கப்பட்டது.",
  profileMissing: "சேமிக்க உங்கள் பெயர், கிராமம், மாவட்டத்தை உள்ளிடவும்.",
  profileCleared: "சேமித்த விவரம் அழிக்கப்பட்டது.",
  cropRice: "நெல்", cropRagi: "கேழ்வரகு", cropMaize: "மக்காச்சோளம்", cropPulses: "பருப்பு வகைகள்",
  profileBadge: "உங்கள் பண்ணை", typeRed: "செம்மண்", typeBlack: "கரிசல் மண்", typeSandy: "மணற்பாங்கான மண்",
  typeLoamy: "வண்டல் மண்", waterCanal: "கால்வாய்", waterBorewell: "ஆழ்துளைக் கிணறு",
  waterRainfed: "மானாவாரி", waterOther: "மற்றவை", noProfile: "இன்னும் விவரம் சேமிக்கப்படவில்லை",
  more: "மேலும்", prototype: "மாதிரி", acres: "ஏக்கர்", cachedData: "சேமித்த தரவு",
  shareWhatsapp: "WhatsApp-இல் பகிரவும்", listenToSummary: "கேளுங்கள் / வாசிக்கவும்", stopReading: "வாசிப்பதை நிறுத்தவும்",
  speechUnavailable: "இந்த உலாவியில் குரல் வசதி இல்லை.",
  turDal: "துவரம் பருப்பு", postHarvestCropOnion: "வெங்காயம்", postHarvestCropPotato: "உருளைக்கிழங்கு",
  close: "மூடவும்",
 mandiShareMessage: "கிருஷிமித்ரா சந்தை விலைச் சுருக்கம்",

  selectCropForAdvisor: "விலை வரலாற்றைப் பார்க்க மேலே ஒரு பயிரைத் தேர்ந்தெடுக்கவும்.",
  noAdvisorPrices: "இந்தப் பயிருக்கும் வடிகட்டலுக்கும் பயன்படுத்தக்கூடிய விலைகள் இல்லை; வரலாற்றுப் பகுப்பாய்வு கிடைக்காது.",

  reportedPriceMethod: "தேர்ந்தெடுத்த பயிருக்கும் வடிகட்டலுக்கும் உள்ள பதிவான விலைகளின் சராசரியே இவை. கடந்த விலைகள் மட்டுமே; முன்னறிவிப்போ உத்தரவாதமோ அல்ல.",

 selectedRows: "தேர்ந்தெடுத்த பதிவுகள்", noVariety: "வகை குறிப்பிடப்படவில்லை",

  profitSpeechSummary: "உங்கள் மதிப்பிடப்பட்ட விளைச்சல் {yield} குவிண்டால். வருவாய் {revenue}, மொத்தச் செலவு {expenses}, மதிப்பிடப்பட்ட லாபம் {profit}, ஏக்கருக்கான லாபம் {perAcre}.",
  profitShareMessage: "பயிர்: {crop}; விளைச்சல்: {yield} குவிண்டால்; வருவாய்: {revenue}; செலவுகள்: {expenses}; மதிப்பிடப்பட்ட லாபம்: {profit}; ஏக்கருக்கான லாபம்: {perAcre}. இது மதிப்பீடு மட்டுமே, உத்தரவாதம் அல்ல.",
  transportInviteMessage: "{village} அருகே உள்ள {farmers} விவசாயிகள் நாளை {mandi}க்கு சரக்கு வாகனத்தைப் பகிரத் தேவை.",
  transportPoolingTitle: "பகிர்ந்த போக்குவரத்துச் செலவுக் கணக்கீடு",
  transportPoolingSub: "விளைச்சல் அளவு, தூரம், வாகனத்தைப் பகிரும் விவசாயிகள் எண்ணிக்கையால் ஒருவருக்கான செலவை மதிப்பிடுங்கள்.",
  harvestQuantity: "விளைச்சல் அளவு (குவிண்டால்)", neighborFarmers: "அருகிலுள்ள விவசாயிகள் (உங்களையும் சேர்த்து)",
  villageForInvite: "கிராமம் (அழைப்புக்காக)", destinationMandi: "செல்லும் சந்தை",
  totalSharingFarmers: "போக்குவரத்தைப் பகிரும் விவசாயிகள்", pooledTransportCost: "மதிப்பிடப்பட்ட பகிர்வு செலவு / விவசாயி",
  transportPoolingAssumption: "இது திட்டமிடலுக்கான மதிப்பீடு. வாகன வாடகை, ஏற்றுதல், பாதை, சந்தைக் கட்டணங்கள் மாறலாம்; வாகனக் கிடைப்பை உறுதிப்படுத்தவும்.",
  transportInviteMissing: "WhatsApp அழைப்பை உருவாக்க கிராமம் மற்றும் சந்தையை உள்ளிடவும்.",
  postHarvestShareMessage: "கிருஷிமித்ரா சேமிப்பு சுருக்கம்: {crop}, சேமிப்பு முறை {method}, மதிப்பிடப்பட்ட பாதுகாப்பான காலம் {days} நாட்கள், அபாயம் {risk}.",

  postHarvestModelNote: "இது தற்போதைய வெளிப்புற வெப்பநிலை, ஈரப்பதத்தைப் பயன்படுத்திய தோராயமான மதிப்பீடு; சேமிப்பு நிலை மற்றும் பயிரின் தரத்தால் மாறலாம்.",
  postHarvestEstimateNote: "இவை பொதுவான திட்டமிடல் வரம்புகள் மட்டுமே. காற்றோட்டம், பயிரின் ஈரம், காயம், உள்ளூர் நிலை ஆகியவை சேமிப்பு காலத்தை மாற்றும்.",
  weatherRecommendationTitle: "உங்கள் பண்ணைக்கான வானிலை ஆலோசனை",
  weatherRecommendationNoData: "தனிப்பட்ட வானிலை ஆலோசனைக்கு வானிலைப் பக்கத்தில் ஓர் இடத்தைத் தேர்ந்தெடுக்கவும்.",
  weatherRecommendationNoAlert: "தற்போதைய முன்னறிவிப்பில் சிறப்பு நடவடிக்கை தேவைப்படும் நிலை இல்லை. உள்ளூர் நிலையைத் தொடர்ந்து கவனிக்கவும்.",
  marketRecommendationTitle: "உங்கள் பயிருக்கான சந்தை ஆலோசனை",
  expenseRecommendationTitle: "பயிர்ச் செலவு மதிப்பாய்வு",
  expenseRecommendationNoData: "லாபக் கணக்கீட்டில் மதிப்பிடப்பட்ட செலவுகளைச் சேர்த்தால் இந்த மதிப்பாய்வு கிடைக்கும்.",
  expenseRecommendationNoCosts: "மதிப்பிடப்பட்ட செலவுகள் எதுவும் இன்னும் உள்ளிடப்படவில்லை.",
  marketInsufficientReason: "மூன்று விலைத் தேதிகளுக்கும் குறைவான பதிவுகள் உள்ளன; சந்தைப் போக்கை நம்பகமாகக் கணிக்க முடியாது.",
  locationUnset: "இடம் தேர்ந்தெடுக்கப்படவில்லை",
 marketSampleReason: "இந்தப் பரிந்துரை மாதிரி விலைகளை மட்டுமே பயன்படுத்துகிறது; இது உண்மையான சந்தை அறிகுறியோ விற்பனை ஆலோசனையோ அல்ல.",
 riskWeatherUnavailable: "வெப்பநிலை மற்றும் ஈரப்பதத்துடன் கூடிய வானிலைத் தரவு கிடைக்கவில்லை.",
  riskContextNote: "மதிப்பிடப்பட்ட சேமிப்பு காலம் பொதுவான நிலைகளுக்கானது. பயிரை அடிக்கடி சோதித்து, ஈரம் அல்லது அழுகல் தெரிந்தால் உடனே நடவடிக்கை எடுக்கவும்.",
  largestExpenseInsight: "உங்கள் மதிப்பீட்டில் {category} அதிகச் செலவாக உள்ளது: {amount}. வாங்கும் விலை அல்லது பணிச்செலவை உள்ளூரில் ஒப்பிடுங்கள்.",
  sampleLevel: "மாதிரி", soilTipTitle: "மண் ஆரோக்கியக் குறிப்பு",
  waterLowMedium: "குறைவு முதல் மிதம் வரை", askAbout: "இந்தத் தலைப்புகளைப் பற்றிக் கேளுங்கள்",
  cropDoctorGuide: "அறிகுறிகளின் அடிப்படையில் சாத்தியமான காரணங்களையும் முன்னெச்சரிக்கைகளையும் பார்க்கவும்; இது நோயறிதல் அல்ல.",
  cropDoctorTitle: "பயிர் மருத்துவர் / அறிகுறி சரிபார்ப்பு",
  cropDoctorSub: "பயிரையும் தென்படும் அறிகுறிகளையும் தேர்ந்தெடுத்து சாத்தியமான காரணங்களையும் அடுத்த படிகளையும் பார்க்கவும்.",
  cropDoctorChooseCrop: "பயிரைத் தேர்ந்தெடுக்கவும்", cropDoctorClearSymptoms: "அறிகுறிகளை அழிக்கவும்",
  cropDoctorShareMessage: "கிருஷிமித்ரா பயிர் ஆய்வு: {crop}; அறிகுறி: {symptom}; சாத்தியமான பிரச்சினை: {diagnosis}; பரிந்துரை: {prevention}. சிகிச்சைக்கு முன் உள்ளூர் வேளாண் அலுவலரிடம் உறுதிப்படுத்தவும்.",
  cropDoctorPossibleIssue: "சரிபார்க்க வேண்டிய சாத்தியமான பிரச்சினை",
  cropDoctorOrganic: "உடனடி இயற்கைத் தீர்வு / நடவடிக்கை", cropDoctorPrevention: "தடுப்பு மற்றும் கண்காணிப்பு",
  cropDoctorDisclaimer: "இந்தப் பார்வை வழிகாட்டி பயிர் நோயை உறுதிப்படுத்தாது. ஒரேபோல் தெரியும் பிரச்சினைகளுக்கு சிகிச்சைக்கு முன் உள்ளூர் வேளாண் நிபுணரை அணுகவும்.",
  cropDoctorSafety: "பயிருக்கும் உறுதிப்படுத்தப்பட்ட பிரச்சினைக்கும் லேபிளில் அனுமதிக்கப்பட்ட பொருளை மட்டுமே பயன்படுத்தவும். பாதுகாப்பு, மீள் நுழைவு, அறுவடைக்கு முந்தைய வழிமுறைகளைப் பின்பற்றவும்.",

  reply: "முக்கியமான வயல் முடிவுகளை உங்கள் உள்ளூர் KVK அல்லது வேளாண் அலுவலரிடம் உறுதிப்படுத்தவும்.",



  storageError: "இந்த உலாவியில் உங்கள் விவரத்தைச் சேமிக்க முடியவில்லை.",
  clearConfirm: "இந்தச் சாதனத்தில் சேமித்த விவசாயி விவரத்தை அழிக்கவா?",
  speechError: "குரலை இயக்க முடியவில்லை. உலாவியின் ஒலி அமைப்புகளைச் சரிபார்த்து மீண்டும் முயற்சிக்கவும்.",
  marketItems: "கற்பனை மாதிரி விலைகள் காட்டப்படுகின்றன", noPrice: "—",
  searchStateHelp: "இடங்களும் பயிர் தேர்வுகளும் பெறப்பட்ட தரவுப் பதிவுகளிலிருந்து வருகின்றன.",
  distanceToMandi: "சந்தைக்கான தூரம் (கி.மீ.)", vehicleFare: "ஒரு பயணத்திற்கான வாகனக் கட்டணம் (₹)",
  individualTransportCost: "தனிப்பட்ட போக்குவரத்துச் செலவு", transportSavings: "ஒவ்வொரு விவசாயிக்கும் சேமிப்பு",
  invitePreview: "WhatsApp அழைப்பு முன்னோட்டம்", dayUnit: "நாட்கள்",
  postHarvestWeatherUnavailable: "மதிப்பீட்டிற்கு வெப்பநிலை மற்றும் ஈரப்பதம் உள்ள தற்போதைய வானிலைத் தரவை ஏற்றவும்.",
  weatherRecommendationBody: "{alert} வயல் பணிகளைத் திட்டமிட மேலுள்ள முன்னறிவிப்பு விவரங்களைப் பயன்படுத்தவும்.",
  marketRecommendationBody: "{recommendation}: {reason}",
  expenseRecommendationBody: "நீங்கள் உள்ளிட்ட செலவுகளில் {category} பங்கு {share}%. உள்ளூர் விலைகளை ஒப்பிட்டு ரசீதுகளை வைத்திருங்கள்.",
  samplePeriodTwo: "மாதிரி 2", samplePeriodThree: "மாதிரி 3",
  riskMethod: "இந்தப் பொதுக் குறியீடு முன்னறிவிப்பு எச்சரிக்கை வகைகளை எண்ணுகிறது: எதுவுமில்லை = குறைவு, ஒன்று = மிதம், இரண்டு அல்லது அதற்கு மேல் = அதிகம். இது விளைச்சல் அல்லது பயிர் இழப்பு முன்னறிவிப்பு அல்ல.",
  nearNeutral: "நடுநிலைக்கு அருகில்", medium: "மிதம்", good: "நல்லது",
  soilTip: "உங்கள் வயலுக்கான ஊட்டச்சத்துகளைத் திட்டமிட அங்கீகரிக்கப்பட்ட உள்ளூர் ஆய்வகத்தில் மண் பரிசோதனை செய்வதே சிறந்தது.",
  waterLow: "குறைவு", waterMedium: "மிதம்", waterHigh: "அதிகம்",
  cropTip: "பயிர் யோசனைகள் மாதிரி பரிந்துரைகள் மட்டுமே; உங்கள் இடத்திற்கான வேளாண் ஆலோசனை அல்ல.",
  cropDoctorCrop: "பயிரைத் தேர்ந்தெடுக்கவும்", cropDoctorSymptoms: "தெரியும் அறிகுறிகளைத் தேர்ந்தெடுக்கவும்",
  cropDoctorChooseSymptoms: "நீங்கள் காணும் ஒன்று அல்லது அதற்கு மேற்பட்ட அறிகுறிகளைத் தேர்ந்தெடுக்கவும்.",
  cropDoctorSeverity: "ஆரம்பத் தீவிரம்", cropDoctorChemical: "ரசாயனத் தேர்வு (காரணம் உறுதியானால் மட்டுமே)",
  cropDoctorNoSelection: "சாத்தியமான காரணங்களைக் காண ஒரு பயிரையும் குறைந்தது ஓர் அறிகுறியையும் தேர்ந்தெடுக்கவும்.",
  about: "இந்த மாதிரியைப் பற்றி",
  aboutCopy: "கிருஷிமித்ரா முதலில் UI மாதிரியாகத் தொடங்கியது. வானிலை Open-Meteo-இலிருந்து வருகிறது; சந்தை விலைகளும் பிற மாதிரித் திரைகளும் விளக்கத்திற்கானவை.",
  dayNext: "புதன்கிழமை",
  sampleTip: "விலைகள் மாறலாம். போக்குவரத்து மற்றும் பிற செலவுகள் உங்கள் வருவாயைப் பாதிக்கும்; கவனமாக ஒப்பிடுங்கள்.",
  missingMandiKey: "சேவையகத்தின் .env கோப்பில் data.gov.in API விசையைச் சேர்த்து, சேவையகத்தை மறுதொடக்கம் செய்யவும்.",
  rejectedMandiKey: "data.gov.in இந்த API விசையை ஏற்கவில்லை. அது செயலிலுள்ளதா, இந்தத் தரவுக்கு அனுமதிக்கப்பட்டதா எனச் சரிபார்க்கவும்.",
  mandiNetworkError: "சந்தைச் சேவையை அணுக முடியவில்லை. இணைய இணைப்பைச் சரிபார்த்து மீண்டும் முயற்சிக்கவும்.",
  mandiUpstreamError: "data.gov.in சேவை தற்காலிகமாகக் கிடைக்கவில்லை. சிறிது நேரம் கழித்து மீண்டும் முயற்சிக்கவும்.",
  mandiSchemaError: "தரவுத் தொகுப்பின் பதில் வடிவத்தை அடையாளம் காண முடியவில்லை; விலைகள் காட்டப்படவில்லை.",
  adviceMonitor: "கடைசி மூன்று பதிவான தேதிகளில் விலைகள் தொடர்ந்து உயர்ந்துள்ளன. முடிவெடுக்கும் முன் அடுத்த பதிவைக் கவனிக்கலாம்; இது எதிர்கால விலை முன்னறிவிப்பு அல்ல.",
  adviceSell: "கடைசி மூன்று பதிவான தேதிகளில் விலைகள் தொடர்ந்து குறைந்துள்ளன. இன்றைய விலை உங்கள் தேவைக்கு ஏற்றால், விலை உயரும் என மட்டும் காத்திருக்காமல் விற்பதைப் பரிசீலிக்கவும்.",
  adviceNoSignal: "சமீபத்திய விலைகளில் ஒரே திசை தென்படவில்லை. முடிவுக்கு முன் உங்கள் செலவுகளையும் உள்ளூர் விலையையும் ஒப்பிடுங்கள்.",
  adviceInsufficient: "மூன்றுக்கும் குறைவான தேதிகளில் விலைப் பதிவுகள் உள்ளன; விற்கவா காத்திருக்கவா பரிந்துரைக்க வரலாறு போதாது.",
  trendIncreasing: "உயர்கிறது", trendDecreasing: "குறைகிறது", trendStable: "நிலையாக உள்ளது",
  samplePeriodOne: "மாதிரி 1",
  sellNowReason: "கடைசி மூன்று தினசரி சராசரிகளும் தொடர்ந்து குறைந்துள்ளன. இன்றைய உள்ளூர் விலையையும் செலவுகளையும் கவனியுங்கள்; இது எதிர்கால விலை முன்னறிவிப்பு அல்ல.",
  waitMarketReason: "கடைசி மூன்று தினசரி சராசரிகளும் தொடர்ந்து உயர்ந்துள்ளன. முடிவுக்கு முன் அடுத்த பதிவைப் பாருங்கள்; எதிர்கால விலைக்கு உத்தரவாதம் இல்லை.",
  monitorMarketReason: "சமீபத்திய மூன்று தேதிகளில் ஒரே திசை இல்லை; சந்தையைக் கவனித்து உள்ளூர் விலைகளை ஒப்பிடுங்கள்.",
  alertHeavyRainBody: "{date} அன்று {amount} மி.மீ. மழை எதிர்பார்க்கப்படுகிறது. நீர்ப்பாசனத்தை ஒத்திவைப்பதையும் வயல் வடிகால்களைச் சரிபார்ப்பதையும் பரிசீலிக்கவும்.",
  alertRainBody: "{date} அன்று மழை வாய்ப்பு {chance}%. தேவையற்ற நீர்ப்பாசனத்தைத் தவிர்க்க மண் ஈரத்தைச் சரிபார்க்கவும்.",
  alertHeatBody: "{date} அன்று அதிகபட்ச வெப்பநிலை {temperature}°C என எதிர்பார்க்கப்படுகிறது. பயிரின் நீர்த் தேவையைக் கவனிக்கவும்.",
  alertWindBody: "தற்போது பலத்த காற்று வீசக்கூடும். எளிதில் பாதிக்கப்படும் பயிர்களுக்கு ஆதரவு உள்ளதா எனச் சரிபார்க்கவும்.",
  riskFactorWeather: "முன்னறிவிப்பு எச்சரிக்கை: {title}",
  postHarvestSellTip: "பாதுகாப்பான சேமிப்பு காலம் குறைவாக இருக்கலாம். விரைவில் விற்பனை அல்லது பதப்படுத்தலுக்கு முன்னுரிமை கொடுத்து விளைச்சலைச் சோதிக்கவும்; இந்த மதிப்பீட்டை மட்டும் நம்பாதீர்கள்.",
  postHarvestStoreTip: "குறுகிய காலச் சேமிப்பு சாத்தியமாக இருக்கலாம். விளைச்சலை உலர்ந்த, காற்றோட்டமான இடத்தில் வைத்து அடிக்கடி சோதிக்கவும்.",
  noLargestExpense: "செலவுகள் எதுவும் இன்னும் உள்ளிடப்படவில்லை.", allKarnataka: "அனைத்து இந்திய மாநிலங்களும்",
  farmerUnitSingular: "விவசாயி", farmerUnitPlural: "விவசாயிகள்",
  learnMore: "இந்தப் பயிர் ஏன்?", chatWelcome: "வணக்கம்! நான் உங்கள் மாதிரி விவசாயத் துணை. பொதுவான கேள்வியைக் கேளுங்கள் அல்லது கீழே உள்ள கேள்வியைத் தேர்ந்தெடுங்கள்.",
  prompts: "மாதிரி கேள்வியை முயற்சிக்கவும்",
  riceDesc: "நீர்வளம் உறுதியாக உள்ள பகுதிகளில் பயிரிடப்படும் வழக்கமான பருவமழைப் பயிர்.",
  ragiDesc: "குறைந்தது முதல் மிதமான நீரில் வளரும் சத்தான சிறுதானியம்.",
  maizeDesc: "பயிர் சுழற்சியில் பயன்படுத்தக்கூடிய பல்துறைப் பயிர்.",
  pulsesDesc: "பருப்பு வகைகள் பயிர் பல்வகைப்படுத்தலுக்கும் மண்ணின் ஊட்டச்சத்து சுழற்சிக்கும் உதவலாம்.",
  saveChanges: "மாற்றங்களைச் சேமிக்கவும்", chartLabel: "மாதிரி மழைப்பொழிவு போக்கு",
  menu: "பட்டி", percent: "சதவீதம்", liveDataStatus: "🟢 நேரடித் தரவு",
  offlineDataStatus: "🟡 இணையமில்லா முறை · சேமித்தது", sampleMarket: "மைசூர் மாதிரி சந்தை",
  cropDoctorYellowing: "இலைகள் மஞ்சளாதல்", cropDoctorBrownSpots: "பழுப்பு நிறப் புள்ளிகள்",
  cropDoctorLeafCurling: "இலை சுருளுதல்", cropDoctorWilting: "வாடுதல்",
  cropDoctorWhitePowder: "வெள்ளைப் பொடி அல்லது வளர்ச்சி", cropDoctorBorerHoles: "தண்டு அல்லது காயில் துளைப்பான் துளைகள்",
  cropDoctorTomato: "தக்காளி", cropDoctorCotton: "பருத்தி", cropDoctorChilli: "மிளகாய்",
  cropDoctorOrganicYellow: "மண் ஈரம், வடிகால், இலையின் அடிப்புறத்தைச் சரிபார்க்கவும். உள்ளூர் நிலையைப் பார்த்த பிறகே ஊட்டச்சத்தைச் சரிசெய்யவும்; சாறு உறிஞ்சும் பூச்சிகள் தெரிந்து பயிர் லேபிள் அனுமதித்தால் மட்டுமே வேப்புப் பொருளைப் பயன்படுத்தவும்.",
  cropDoctorOrganicSpots: "மிகவும் பாதிக்கப்பட்ட இலைகள் மற்றும் பயிர் எச்சங்களை அகற்றவும்; இலைகளை நனைப்பதைத் தவிர்க்கவும். இவை சுகாதாரத்திற்கு உதவும்; குணமாகும் என உறுதி அளிக்காது.",
  cropDoctorOrganicCurl: "இலைகளின் அடிப்புறத்தைச் சரிபார்த்து, கடுமையாகப் பாதிக்கப்பட்ட இலைகளை அகற்றவும். லேபிள் அனுமதித்தால் வேப்புப் பொருள் சில மென்மையான பூச்சிகளுக்கு உதவலாம்; வைரஸைக் குணப்படுத்தாது.",
  cropDoctorOrganicWilt: "மண் ஈரம் மற்றும் வடிகாலைச் சரிபார்க்கவும்; வாடிய செடிகள் உறுதிப்பட்டால் வேருடன் தனியே அகற்றவும். உறுதிப்படுத்தாத கலவைகளை மண்ணில் இடாதீர்கள்.",
  cropDoctorOrganicPowder: "பாதிக்கப்பட்ட இலைகளை அகற்றி காற்றோட்டத்தை மேம்படுத்தவும். சிகிச்சைக்கு முன் அது தூசி அல்லது தெளிப்பு எச்சமல்ல என்பதை உறுதிப்படுத்தவும்.",
  cropDoctorOrganicBorer: "துளைப்பான் பாதித்த செடிப் பகுதிகளை அகற்றி அழிக்கவும்; அடையாளம் கண்ட பூச்சிக்கும் பயிருக்கும் பொருத்தமானால் மட்டுமே பெரோமோன் பொறி பயன்படுத்தவும்.",
  cropDoctorPreventYellow: "தொடர்ந்து கண்காணித்து, வடிகாலைச் சரியாக வைத்து, உள்ளூர் மண் வழிகாட்டுதலின் அடிப்படையில் சமநிலை ஊட்டச்சத்துகளைப் பயன்படுத்தவும்.",
  cropDoctorPreventSpots: "பயிர் எச்சங்களை அகற்றி காற்றோட்டம் அளிக்கவும்; சாத்தியமான இடங்களில் இலைகள் நீண்ட நேரம் ஈரமாக இருப்பதைத் தவிர்க்கவும்.",
  cropDoctorPreventCurl: "இலைகளின் அடிப்புறத்தில் நோய் பரப்பும் பூச்சிகளைச் சரிபார்த்து, களைகள் அல்லது மாற்று வாழிடச் செடிகளை அகற்றி அருகிலுள்ள செடிகளைக் கண்காணிக்கவும்.",
  cropDoctorPreventWilt: "சுத்தமான கருவிகளைப் பயன்படுத்தி, மாசடைந்த மண்ணை நகர்த்தாதீர்கள்; பயிர் சுழற்சி மற்றும் வடிகால் குறித்து உள்ளூர் ஆலோசனை பெறுங்கள்.",
  cropDoctorPreventPowder: "காற்றோட்டத்துக்காக செடிகளுக்கு இடைவெளி விடுங்கள்; பாதிக்கப்பட்ட எச்சங்களை அகற்றி அருகிலுள்ள செடிகளையும் கவனியுங்கள்.",
  cropDoctorPreventBorer: "முட்டைகள் மற்றும் புதிய துளைகளைத் தேடுங்கள்; பாதித்த பகுதிகளை அகற்றி, பரிந்துரைக்கப்பட்டால் பூச்சிக்கேற்ற கண்காணிப்புப் பொறிகளைப் பயன்படுத்தவும்.",
  cropDoctorChemicalNone: "இந்த ஒரு அறிகுறியை மட்டும் வைத்து ரசாயனம் பரிந்துரைக்கப்படவில்லை. முதலில் நீர், ஊட்டச்சத்து, பூச்சி இருப்பைச் சரிபார்த்து, தெளிப்பதற்கு முன் உறுதி செய்யவும்.",
  cropDoctorChemicalFungicide: "பூஞ்சை நோய் உறுதியானால், இந்தப் பயிருக்கும் நோய்க்கும் தற்போது பதிவு செய்யப்பட்ட மருந்தை உள்ளூர் KVK அல்லது வேளாண் அலுவலரிடம் கேட்டுத் தெரிந்து லேபிளைப் பின்பற்றவும்.",
  cropDoctorChemicalInsecticide: "குறிப்பிட்ட பூச்சி உறுதியானால், இந்தப் பயிரையும் பூச்சியையும் லேபிளில் குறிப்பிடும் தற்போது பதிவு செய்யப்பட்ட பொருளை மட்டுமே பயன்படுத்தி, உள்ளூர் ஆலோசனை மற்றும் லேபிளைப் பின்பற்றவும்.",
  cropDoctorChemicalVector: "வெள்ளை ஈ அல்லது த்ரிப்ஸ் உறுதியானால், பதிவு செய்யப்பட்ட நோய் பரப்பி கட்டுப்பாட்டுப் பொருள் பற்றி உள்ளூர் ஆலோசனை பெறவும். வைரஸ் பாதித்த செடிகளை இது குணப்படுத்தாது; லேபிளைப் பின்பற்றவும்.",
  cropDoctorChemicalBorer: "துளைப்பான் உறுதியானால், இந்தப் பயிருக்கும் பூச்சிக்கும் பதிவு செய்யப்பட்ட பொருள் பற்றி உள்ளூர் KVK அல்லது வேளாண் அலுவலரிடம் கேட்டுத் தெரிந்து லேபிளைப் பின்பற்றவும்.",
};

const marathiText: CompleteAppTranslations = {
  dashboard: "डॅशबोर्ड", weather: "हवामान", mandi: "बाजारभाव", profit: "नफा गणक",
  smartFarm: "स्मार्ट शेती", irrigationPlanner: "सिंचन नियोजन", soil: "मातीची माहिती",
  cropDoctor: "पीक डॉक्टर", schemes: "योजना आणि अनुदाने", crops: "पीक सूचना",
  cropRotation: "पीक फेरपालट नियोजक", advisory: "शेतीविषयक सल्ला", settings: "सेटिंग्ज",
  greeting: "शुभ सकाळ", welcome: "तुमची शेती, एक पाऊल पुढे.", demo: "नमुना माहिती",
  demoNote: "ही नमुना माहिती केवळ प्रात्यक्षिकासाठी आहे; ती थेट किंवा स्थानविशिष्ट नाही.",
  todayAt: "आजचा आढावा", weatherCard: "हवामानाचा अंदाज", marketCard: "बाजाराचा आढावा",
  rainChance: "पावसाची शक्यता", humidity: "आर्द्रता", viewWeather: "हवामान पाहा",
  viewMarket: "भाव पाहा", yourFarm: "तुमची शेतकरी माहिती", addFarm: "शेतीची माहिती जोडा",
  editProfile: "माहिती संपादित करा", setupPrompt: "वैयक्तिक सूचना मिळवण्यासाठी शेतीची माहिती जोडा.",
  completeProfile: "माहिती भरा", quickActions: "जलद पर्याय", askMitra: "कृषिमित्रला विचारा",
  soilCheck: "माती मार्गदर्शक पाहा", cropPlanner: "पीक कल्पना पाहा",
  fieldNote: "आजची छोटी काळजी उद्याच्या चांगल्या परिणामाला मदत करते.",
  weatherTitle: "हवामानाचा अंदाज", weatherSub: "सध्याची स्थिती आणि सात दिवसांचा अंदाज पाहण्यासाठी शहर, जिल्हा किंवा गाव शोधा.",
  currentConditions: "सध्याची स्थिती", feelsLike: "जाणवणारे तापमान", wind: "वारा",
  nextDays: "पुढील काही दिवस", dayToday: "आज", dayTomorrow: "उद्या", sunny: "उन्हाळी",
  partlyCloudy: "अंशतः ढगाळ", lightShower: "हलकी सर", foggy: "धुके",
  drizzle: "रिमझिम", rainCondition: "पाऊस", snow: "बर्फ", thunderstorm: "मेघगर्जनेसह पाऊस",
  dashboardWeatherNote: "हवामान Open-Meteo वरून थेट मिळते. बाजारभाव नमुना माहिती आहे.",
  weatherSource: "OPEN-METEO", live: "थेट", searchLocation: "तुमचे ठिकाण शोधा",
  searchPlaceholder: "शहर, जिल्हा किंवा गाव शोधा", search: "शोधा", searching: "शोधत आहे…",
  noLocationResults: "ठिकाणे सापडली नाहीत. जवळचे शहर किंवा जिल्हा वापरून पाहा.",
  selectLocation: "योग्य ठिकाण निवडा", selectedLocation: "निवडलेले ठिकाण", clearLocation: "ठिकाण बदला",
  currentTemperature: "तापमान", rainfall: "पर्जन्यमान", currentRain: "सध्या पाऊस",
  todayRainProbability: "आज पावसाची शक्यता", forecastTitle: "सात दिवसांचा अंदाज",
  high: "कमाल", low: "किमान", expectedRain: "अपेक्षित पाऊस", lastUpdated: "शेवटचे अद्यतन",
  dataSource: "माहितीचा स्रोत", refreshWeather: "हवामान अद्यतनित करा", refreshing: "अद्यतनित होत आहे…",
  loadingWeather: "थेट हवामान मिळवत आहे…", chooseWeatherLocation: "थेट हवामान पाहण्यासाठी ठिकाण निवडा.",
  noWeatherData: "सध्या हवामानाची माहिती उपलब्ध नाही.",
  weatherSearchHelp: "शोध परिणाम Open-Meteo वरून येतात. तुमच्या उपकरणाचे ठिकाण मागितले जात नाही.",
  farmingAdvisory: "हवामानानुसार शेती सूचना", noAdvisories: "या अंदाजात हवामान सूचना नाहीत.",
  advisoryRain: "पावसाची शक्यता आहे. सिंचनाची गरज तपासा.",
  advisoryHeavyRain: "मुसळधार पावसाची शक्यता आहे. शेतातील निचरा तपासा.",
  advisoryHeat: "उच्च तापमानाचा अंदाज आहे. पिकाची पाण्याची गरज पाहा.",
  advisoryWind: "जोरदार वाऱ्याची शक्यता आहे. संवेदनशील पिकांना आधार आहे का तपासा.",
  weatherError: "हवामान सेवेत त्रुटी", weatherNetworkError: "जोडणी झाली नाही. इंटरनेट तपासून पुन्हा प्रयत्न करा.",
  weatherHttpError: "हवामान सेवा तात्पुरती उपलब्ध नाही. नंतर पुन्हा प्रयत्न करा.",
  weatherApiError: "या ठिकाणासाठी हवामान माहिती मिळू शकली नाही.",
  weatherInvalidError: "हवामान सेवेकडून अनपेक्षित माहिती मिळाली. पुन्हा प्रयत्न करा.",
  locationSaveError: "या ब्राउझरमध्ये निवडलेले ठिकाण जतन करता आले नाही.",
  mandiTitle: "बाजारभाव", mandiSub: "भारतीय आणि राज्य बाजारभाव; नमुना नोंदी स्पष्टपणे दर्शवल्या आहेत.",
  marketBoard: "AGMARKNET दैनिक भाव", commodity: "पीक", market: "बाजार", price: "भाव / क्विंटल",
  change: "बदल", state: "राज्य", districtLabel: "जिल्हा", variety: "जात", arrivalDate: "आगमन दिनांक",
  minPrice: "किमान भाव", maxPrice: "कमाल भाव", modalPrice: "मोडल भाव",
  selectState: "राज्य निवडा", selectDistrict: "सर्व जिल्हे", selectMarket: "सर्व बाजार",
  searchCrop: "पीक शोधून निवडा", cropSearchPlaceholder: "माहितीतील पिके शोधा…",
  noCrops: "उपलब्ध माहितीत जुळणारी पिके नाहीत.", loadingMarkets: "सरकारी बाजार माहिती लोड होत आहे…",
  noMarketData: "या निवडीसाठी बाजार नोंदी उपलब्ध नाहीत.",
  noDataForFilters: "या फिल्टरसाठी नोंदी नाहीत. दुसरे पीक, जिल्हा किंवा बाजार निवडा.",
  chooseCropForCompare: "बाजारभावांची तुलना करण्यासाठी पीक शोधून निवडा.",
  marketApiSource: "भारत सरकार · AGMARKNET", sampleCachedMandiData: "नमुना / कॅश केलेली AGMARKNET माहिती",
  sampleDataSource: "उदाहरणासाठी समाविष्ट माहिती · थेट किंवा सरकारी नोंद नाही",
  mixedDataSource: "नमुना नोंदी आणि उपकरणात जतन केलेली AGMARKNET माहिती",
  cachedPriceExplanation: "या उपकरणातील कॅशमधील जुन्या AGMARKNET नोंदी दाखवल्या आहेत. त्या सध्याचे भाव नसू शकतात.",
  lastUpdatedMandi: "शेवटचे अद्यतन", dataRows: "मिळालेल्या नोंदी",
  mandiErrorTitle: "बाजार माहिती लोड करता आली नाही", refreshPrices: "भाव अद्यतनित करा",
  refreshingPrices: "अद्यतनित होत आहे…", compareMarkets: "निवडलेल्या राज्यातील बाजारांची तुलना करा",
  sortByModal: "मोडल भावानुसार क्रमवारी", ascending: "कमी भाव प्रथम", descending: "जास्त भाव प्रथम",
  priceAdvisory: "भाव तुलना सूचना", noCompareData: "बाजार तुलना करण्यासाठी पुरेसे नोंदवलेले भाव नाहीत.",
  highestReported: "सर्वाधिक नोंदवलेला मोडल भाव", lowestReported: "सर्वात कमी नोंदवलेला मोडल भाव",
  transportNote: "जास्त नोंदवलेला भाव म्हणजे जास्त उत्पन्नाची हमी नाही. वाहतूक आणि इतर खर्च लक्षात घ्या.",
  priceHistory: "नोंदवलेल्या भावांचा इतिहास", fromDate: "या तारखेपासून", toDate: "या तारखेपर्यंत",
  missingDates: "या तारखांसाठी नोंदी नाहीत", noHistory: "या निवडीसाठी जुन्या नोंदी उपलब्ध नाहीत.",
  sourceUnitNote: "मूळ स्रोताप्रमाणे भाव ₹ प्रति क्विंटलमध्ये दाखवले आहेत.",
  sellWaitTitle: "आता विकावे की थांबावे?", sellWaitSub: "निवडलेल्या पिकाच्या नोंदवलेल्या मागील भावांवर आधारित सावध मार्गदर्शन.",
  currentReportedPrice: "अलीकडील नोंदवलेला सरासरी भाव", previousReportedPrice: "मागील नोंदवलेला सरासरी भाव",
  priceChange: "मागील नोंदीपासून बदल", trend: "अलीकडील नोंदवलेला कल",
  trendRising: "वाढता", trendFalling: "घटता", trendMixed: "मिश्र किंवा स्थिर",
  trendInsufficient: "कल दाखवण्यासाठी पुरेशी माहिती नाही",
  recommendationMonitor: "बाजारावर लक्ष ठेवा", recommendationSell: "विक्रीचा विचार करा",
  recommendationNoSignal: "स्पष्ट संकेत नाही", recommendationInsufficient: "शिफारसीसाठी पुरेसा इतिहास नाही",
  reportedPriceHistory: "अलीकडील नोंदवलेले भाव",
  smartFarmTitle: "स्मार्ट शेती निर्णय केंद्र",
  smartFarmSub: "शेतकरी माहिती, हवामान, बाजार नोंदी आणि खर्चाचा अंदाज एकत्र पाहा.",
  smartFarmEyebrow: "तुमचे शेती निर्णय केंद्र", smartFarmOverview: "शेतीचा आढावा",
  todayForecast: "हवामान अंदाज", noForecastForFarm: "थेट अंदाजासाठी हवामान स्क्रीनवर ठिकाण निवडा.",
  noFarmSoil: "शेतकरी माहितीमध्ये मातीचा प्रकार जतन केलेला नाही.",
  profileSoilNote: "जतन केलेल्या माहितीतला मातीचा प्रकार; प्रयोगशाळेतील माती परीक्षण नाही.",
  latestMandiAverage: "अलीकडील नोंदवलेली बाजार सरासरी", demoPriceLabel: "नमुना भाव · थेट बाजारभाव नाही",
  samplePriceExplanation: "केवळ प्रात्यक्षिकासाठीचे भाव. या पिकाचे नोंदवलेले भाव पाहण्यासाठी बाजारभाव स्क्रीन उघडा.",
  noMarketHistory: "या पिकासाठी जुळणाऱ्या बाजार नोंदी अद्याप नाहीत.",
  sellNow: "आता विक्री करा", waitMarket: "थांबून पुन्हा पाहा", monitorMarket: "बाजारावर लक्ष ठेवा",
  openMandi: "बाजारभाव पाहा",
  farmAlertsTitle: "हवामानाधारित शेती सूचना", forecastVerified: "अंदाजावर आधारित",
  generalAdviceLabel: "सामान्य मार्गदर्शन · तुमच्या ठिकाणासाठी पडताळलेले नाही",
  noActiveFarmAlerts: "उपलब्ध अंदाजात सूचना मर्यादा ओलांडली नाही. स्थानिक परिस्थिती तपासत राहा.",
  alertHeavyRainTitle: "मुसळधार पावसाची शक्यता", alertRainTitle: "पावसाची शक्यता",
  alertRainAmountBody: "{date} रोजी {amount} मिमी पावसाचा अंदाज आहे. अनावश्यक सिंचन टाळण्यासाठी मातीतील ओलावा तपासा.",
  alertHeatTitle: "उच्च तापमानाची शक्यता", alertWindTitle: "सध्या जोरदार वारा",
  generalWeatherAdviceTitle: "सामान्य हवामान सूचना",
  generalWeatherAdviceBody: "सिंचन, कापणी किंवा शेतकामापूर्वी स्थानिक अंदाज पाहा. या शेतासाठी थेट अंदाज उपलब्ध नाही.",
  cropRiskTitle: "हवामानाशी संबंधित पीक जोखीम", lowRisk: "कमी जोखीम",
  moderateRisk: "मध्यम जोखीम", highRisk: "जास्त जोखीम", riskUnavailable: "जोखीम निर्देशक उपलब्ध नाही",
  postHarvestEyebrow: "कापणी आणि साठवण", postHarvestTitle: "कापणीनंतरची साठवण आणि खराब होण्याचा धोका",
  postHarvestSub: "सध्याचे बाहेरील तापमान आणि आर्द्रतेवर आधारित साधारण साठवण अंदाज.",
  postHarvestCrop: "कापणी केलेले पीक", postHarvestMethod: "साठवण पद्धत",
  postHarvestWindow: "अंदाजे सुरक्षित साठवण कालावधी", postHarvestRisk: "खराब होण्याची जोखीम",
  postHarvestAction: "कृती सूचना", postHarvestSellImmediately: "लगेच विक्री करा",
  postHarvestSafeToStore: "साठवता येईल", postHarvestRiskHigh: "जास्त",
  postHarvestRiskModerate: "मध्यम", postHarvestRiskLow: "कमी",
  storageOpenShed: "उघडे शेड", storageGunnyBags: "गोणी", storageColdStorage: "शीतगृह",
  farmCostsTitle: "शेती खर्चाचा आढावा", totalInvestment: "एकूण गुंतवणूक",
  largestExpense: "सर्वाधिक खर्चाचा प्रकार", expenseBreakdown: "खर्चाचे विभाजन",
  noExpensesEntered: "खर्चाचे विभाजन पाहण्यासाठी नफा गणकात अंदाजे खर्च भरा.",
  personalizedTitle: "तुमच्यासाठी शेती सूचना", priorityHigh: "जास्त", priorityMedium: "मध्यम", priorityLow: "कमी",
  selectCropForSmartFarm: "शेतीचा आढावा वैयक्तिक करण्यासाठी पीक निवडा.",
  soilTitle: "मातीची माहिती", soilSub: "तुमच्या शेतातील माती समजून घेण्यासाठी सोपे मार्गदर्शन.",
  profitCalculatorEyebrow: "हंगामाचे नियोजन करा", profitCalculatorTitle: "शेतकरी नफा गणक",
  profitCalculatorSub: "तुमच्या शेताच्या अंदाजावरून पीक उत्पन्न, खर्च आणि नफा मोजा.",
  estimateBadge: "तुमचा अंदाज", cropSelect: "पीक", chooseCrop: "पीक निवडा",
  cultivatedArea: "लागवडीखालील क्षेत्र (एकर)", expectedYieldPerAcre: "प्रति एकर अपेक्षित उत्पादन (क्विंटल)",
  expectedSellingPrice: "अपेक्षित विक्रीभाव (₹ / क्विंटल)", estimatedExpenses: "अंदाजे खर्च (₹)",
  calculatorExpenseHelp: "हंगामासाठीचे खर्च भरा; लागू नसलेल्या खर्चांसाठी ₹0 ठेवा.",
  seedExpense: "बियाणे", fertilizerExpense: "खते", labourExpense: "मजुरी",
  irrigationExpense: "सिंचन", transportExpense: "वाहतूक", otherExpense: "इतर खर्च",
  calculatorResults: "तुमचे अंदाजे निकाल", calculatorPrompt: "अंदाजासाठी पीक, क्षेत्र, उत्पादन आणि विक्रीभाव भरा.",
  totalExpectedYield: "एकूण अपेक्षित उत्पादन", expectedRevenue: "एकूण अपेक्षित उत्पन्न",
  quintals: "क्विंटल", totalExpenses: "एकूण खर्च", estimatedProfit: "अंदाजे नफा",
  profitPerAcre: "प्रति एकर नफा", financialBreakdown: "उत्पन्न आणि खर्चाची तुलना",
  revenueLabel: "उत्पन्न", expensesLabel: "खर्च", netProfitLabel: "निव्वळ नफा",
  calculatorDisclaimer: "हा तुम्ही भरलेल्या माहितीवर आधारित अंदाज आहे; हमीचे उत्पन्न नाही. प्रत्यक्ष उत्पादन, भाव आणि खर्च बदलू शकतात.",
  soilHealth: "माती आरोग्याचा आढावा", soilType: "मातीचा प्रकार", phLevel: "pH पातळी",
  organicMatter: "सेंद्रिय पदार्थ", nitrogen: "नत्र", phosphorus: "स्फुरद", potassium: "पालाश",
  cropTitle: "पीक सूचना", cropSub: "नमुना माहितीवर आधारित कल्पना — स्थानिक उपयुक्तता तपासा.",
  recommended: "विचार करण्यासारख्या कल्पना", season: "खरीप हंगाम", duration: "पीक कालावधी", waterNeed: "पाण्याची गरज",
  advisoryTitle: "कृषिमित्रला विचारा", advisorySub: "शेतीच्या प्रश्नांसाठी सोपे, उपयोगी मार्गदर्शन मिळवा.",
  demoChat: "शेतीविषयक सल्ला", chatPlaceholder: "तुमचा शेतीचा प्रश्न लिहा…", send: "पाठवा",
  settingsTitle: "सेटिंग्ज", settingsSub: "कृषिमित्रला तुमच्या गरजेनुसार बदला.",
  language: "भाषा", chooseLanguage: "तुमची आवडती भाषा निवडा",
  profileSection: "शेतकरी माहिती", savedLocally: "तुमची माहिती फक्त या उपकरणावर जतन केली जाते.",
  clearProfile: "जतन केलेली माहिती पुसा", profileTitle: "तुमची शेतकरी माहिती",
  profileSub: "काही तपशील तुमच्या शेती सहाय्यकाला वैयक्तिक बनवतील.",
  fullName: "तुमचे नाव", village: "गाव", district: "जिल्हा", land: "जमिनीचे क्षेत्र (एकर)",
  soilChoice: "मातीचा प्रकार", irrigation: "सिंचनाचा स्रोत", chooseOne: "एक निवडा",
  saveProfile: "माहिती जतन करा", cancel: "रद्द करा", saved: "या उपकरणावर माहिती जतन केली.",
  profileMissing: "जतन करण्यासाठी नाव, गाव आणि जिल्हा भरा.",
  profileCleared: "जतन केलेली माहिती पुसली.", cropRice: "भात", cropRagi: "नाचणी",
  cropMaize: "मका", cropPulses: "कडधान्ये", profileBadge: "तुमची शेती",
  typeRed: "लाल माती", typeBlack: "काळी माती", typeSandy: "वाळूमिश्रित माती", typeLoamy: "पोयट्याची माती",
  waterCanal: "कालवा", waterBorewell: "विंधन विहीर", waterRainfed: "पावसावर अवलंबून",
  waterOther: "इतर", noProfile: "अद्याप माहिती जतन केलेली नाही", more: "अधिक",
  prototype: "नमुना", acres: "एकर", cachedData: "कॅश केलेले",
  shareWhatsapp: "WhatsApp वर शेअर करा", listenToSummary: "ऐका / वाचून दाखवा", stopReading: "वाचणे थांबवा",
  speechUnavailable: "या ब्राउझरमध्ये आवाजाची सुविधा उपलब्ध नाही.",
  turDal: "तूर डाळ", postHarvestCropOnion: "कांदा", postHarvestCropPotato: "बटाटा",
  close: "बंद करा",


  mandiShareMessage: "कृषिमित्र बाजारभावाचा सारांश",

  selectCropForAdvisor: "नोंदवलेल्या भावांचा इतिहास पाहण्यासाठी वरील पीक निवडा.",
  noAdvisorPrices: "या पिकासाठी आणि फिल्टरसाठी वापरण्यायोग्य भाव उपलब्ध नाहीत; ऐतिहासिक विश्लेषण शक्य नाही.",

  reportedPriceMethod: "निवडलेले पीक व फिल्टरमधील नोंदवलेल्या भावांची ही सरासरी आहे. हे मागील भाव आहेत, अंदाज किंवा हमी नाही.",
 selectedRows: "निवडलेल्या नोंदी",
  noVariety: "जात नमूद नाही",
  profitSpeechSummary: "तुमचे अंदाजित उत्पादन {yield} क्विंटल आहे. अंदाजित उत्पन्न {revenue}, एकूण खर्च {expenses}, अंदाजित नफा {profit}, आणि प्रति एकर नफा {perAcre}.",
  profitShareMessage: "पीक: {crop}; उत्पादन: {yield} क्विंटल; उत्पन्न: {revenue}; खर्च: {expenses}; अंदाजित नफा: {profit}; प्रति एकर नफा: {perAcre}. हा अंदाज आहे, हमी नाही.",
  transportInviteMessage: "{village} जवळचे {farmers} शेतकरी उद्या {mandi}ला मालवाहू वाहन सामायिक करण्यासाठी हवे आहेत.",
  transportPoolingTitle: "सामायिक वाहतूक खर्च गणक",
  transportPoolingSub: "उत्पादनाचे प्रमाण, अंतर आणि वाहन सामायिक करणाऱ्या शेतकऱ्यांच्या संख्येनुसार प्रति शेतकरी खर्चाचा अंदाज घ्या.",
  harvestQuantity: "उत्पादनाचे प्रमाण (क्विंटल)", neighborFarmers: "शेजारील शेतकरी (तुमच्यासह)",
  villageForInvite: "गाव (आमंत्रणासाठी)", destinationMandi: "गंतव्य बाजार",
  totalSharingFarmers: "वाहतूक सामायिक करणारे शेतकरी", pooledTransportCost: "अंदाजित सामायिक खर्च / शेतकरी",
  transportPoolingAssumption: "हा नियोजनासाठीचा अंदाज आहे. वाहनभाडे, चढवणे, मार्ग आणि बाजार शुल्क बदलू शकतात; वाहनाची उपलब्धता निश्चित करा.",
  transportInviteMissing: "WhatsApp आमंत्रण तयार करण्यासाठी गाव आणि बाजार भरा.",
  postHarvestShareMessage: "कृषिमित्र साठवण सारांश: {crop}, साठवण पद्धत {method}, अंदाजित सुरक्षित कालावधी {days} दिवस, जोखीम {risk}.",

  postHarvestModelNote: "सध्याचे बाहेरील तापमान व आर्द्रतेवर आधारित हा अंदाज आहे; साठवण स्थिती आणि पिकाच्या गुणवत्तेनुसार बदलू शकतो.",
  postHarvestEstimateNote: "या सामान्य नियोजन मर्यादा आहेत. हवेशीरपणा, पिकातील ओलावा, जखमा आणि स्थानिक परिस्थितीमुळे साठवण कालावधी बदलू शकतो.",
  weatherRecommendationTitle: "तुमच्या शेतासाठी हवामान सूचना",
  weatherRecommendationNoData: "वैयक्तिक हवामान सूचनेसाठी हवामान पानावर ठिकाण निवडा.",
  weatherRecommendationNoAlert: "सध्याच्या अंदाजात विशेष सूचना देण्यासारखी परिस्थिती नाही. स्थानिक हवामान तपासत राहा.",
  marketRecommendationTitle: "तुमच्या पिकासाठी बाजार सूचना",
  expenseRecommendationTitle: "पीक खर्चाचा आढावा",
  expenseRecommendationNoData: "नफा गणकात अंदाजित खर्च भरल्यावर हा आढावा दिसेल.",
  expenseRecommendationNoCosts: "अजून अंदाजित खर्च नोंदवलेले नाहीत.",
  marketInsufficientReason: "तीनपेक्षा कमी तारखांचे भाव उपलब्ध आहेत; बाजाराचा कल विश्वासार्हपणे ठरवता येत नाही.",
  locationUnset: "ठिकाण निवडलेले नाही",
 marketSampleReason: "ही सूचना केवळ नमुना भावांवर आधारित आहे; हा खरा बाजार संकेत किंवा विक्री सल्ला नाही.",
 riskWeatherUnavailable: "तापमान आणि आर्द्रतेसह हवामान माहिती उपलब्ध नाही.",
  riskContextNote: "साठवण कालावधीचा अंदाज सामान्य परिस्थितींसाठी आहे. पीक वारंवार तपासा; ओलावा किंवा नासाडी दिसल्यास त्वरित कृती करा.",
  largestExpenseInsight: "तुमच्या अंदाजात {category} हा सर्वाधिक खर्च आहे: {amount}. खरेदीचा किंवा कामाचा खर्च स्थानिक पातळीवर तपासा.",
  sampleLevel: "नमुना", soilTipTitle: "मातीच्या आरोग्याची सूचना",
  waterLowMedium: "कमी ते मध्यम", askAbout: "या विषयांबद्दल विचारा",
  cropDoctorGuide: "लक्षणांवरून संभाव्य कारणे आणि खबरदारी पाहा; हे निदान नाही.",
  cropDoctorTitle: "पीक डॉक्टर / लक्षण तपासणी",
  cropDoctorSub: "पीक आणि दिसणारी लक्षणे निवडून संभाव्य कारणे व पुढील पावले जाणून घ्या.",
  cropDoctorChooseCrop: "पीक निवडा", cropDoctorClearSymptoms: "लक्षणे काढून टाका",
  cropDoctorShareMessage: "कृषिमित्र पीक तपासणी: {crop}; लक्षण: {symptom}; संभाव्य समस्या: {diagnosis}; सूचना: {prevention}. उपचारापूर्वी स्थानिक कृषी अधिकाऱ्यांकडून खात्री करा.",
  cropDoctorPossibleIssue: "तपासण्याजोगी संभाव्य समस्या",
  cropDoctorOrganic: "तातडीचा सेंद्रिय उपाय / कृती", cropDoctorPrevention: "प्रतिबंध आणि निरीक्षण",
  cropDoctorDisclaimer: "हे दृश्य तपासणी मार्गदर्शन पीक रोगाचे निदान करत नाही. अनेक समस्या सारख्या दिसू शकतात; उपचारापूर्वी स्थानिक KVK किंवा कृषी अधिकाऱ्यांचा सल्ला घ्या.",
  cropDoctorSafety: "या पिकासाठी आणि खात्री झालेल्या समस्येसाठी लेबलवर मान्य केलेले उत्पादनच वापरा. लेबल, संरक्षण साधने, पुन्हा प्रवेश आणि काढणीपूर्व सूचनांचे पालन करा.",

  reply: "शेतातील महत्त्वाचे निर्णय स्थानिक KVK किंवा कृषी अधिकाऱ्यांकडून खात्री करून घ्या.",


  storageError: "या ब्राउझरमध्ये तुमची माहिती जतन करता आली नाही.",
  clearConfirm: "या डिव्हाइसवर जतन केलेली शेतकरी माहिती हटवायची का?",
  speechError: "आवाज सुरू होऊ शकला नाही. ब्राउझरची ध्वनी सेटिंग तपासून पुन्हा प्रयत्न करा.",
  marketItems: "काल्पनिक नमुना भाव दाखवत आहे", noPrice: "—",
  searchStateHelp: "ठिकाणे आणि पिकांचे पर्याय मिळालेल्या डेटा नोंदींमधून येतात.",
  distanceToMandi: "बाजारापर्यंतचे अंतर (कि.मी.)", vehicleFare: "एका फेरीचे वाहनभाडे (₹)",
  individualTransportCost: "स्वतंत्र वाहतूक खर्च", transportSavings: "प्रति शेतकरी बचत",
  invitePreview: "WhatsApp आमंत्रणाचे पूर्वावलोकन", dayUnit: "दिवस",
  postHarvestWeatherUnavailable: "अंदाजासाठी तापमान आणि आर्द्रता असलेली सध्याची हवामान माहिती लोड करा.",
  weatherRecommendationBody: "{alert} शेतातील कामाचे नियोजन करण्यासाठी वरील अंदाज तपासा.",
  marketRecommendationBody: "{recommendation}: {reason}",
  expenseRecommendationBody: "तुम्ही नोंदवलेल्या खर्चात {category} चा वाटा {share}% आहे. स्थानिक दरांची तुलना करा आणि पावत्या जतन करा.",
  samplePeriodTwo: "नमुना 2", samplePeriodThree: "नमुना 3",
  riskMethod: "हा सामान्य निर्देशांक अंदाजातील इशाऱ्यांचे प्रकार मोजतो: एकही नाही = कमी, एक = मध्यम, दोन किंवा अधिक = जास्त. हा उत्पादन किंवा पीक नुकसानीचा अंदाज नाही.",
  nearNeutral: "तटस्थाच्या जवळ", medium: "मध्यम", good: "चांगले",
  soilTip: "तुमच्या शेतातील पोषणद्रव्यांचे नियोजन करण्यासाठी मान्यताप्राप्त स्थानिक प्रयोगशाळेत माती तपासणे सर्वोत्तम आहे.",
  waterLow: "कमी", waterMedium: "मध्यम", waterHigh: "जास्त",
  cropTip: "पीक कल्पना या नमुना सूचना आहेत; त्या तुमच्या भागासाठी कृषी सल्ला नाहीत.",
  cropDoctorCrop: "पीक निवडा", cropDoctorSymptoms: "दिसणारी लक्षणे निवडा",
  cropDoctorChooseSymptoms: "तुम्हाला दिसणारी एक किंवा अधिक लक्षणे निवडा.",
  cropDoctorSeverity: "प्राथमिक तीव्रता", cropDoctorChemical: "रासायनिक पर्याय (कारण निश्चित झाल्यासच)",
  cropDoctorNoSelection: "संभाव्य कारणे पाहण्यासाठी पीक आणि किमान एक लक्षण निवडा.",
  about: "या नमुन्याबद्दल",
  aboutCopy: "कृषिमित्रची सुरुवात UI नमुना म्हणून झाली. हवामान Open-Meteo वरून येते; बाजारभाव आणि इतर नमुना स्क्रीनवरील माहिती केवळ प्रात्यक्षिकासाठी आहे.",
  dayNext: "बुधवार",
  sampleTip: "भाव बदलू शकतात. वाहतूक आणि इतर खर्च तुमच्या उत्पन्नावर परिणाम करतात; काळजीपूर्वक तुलना करा.",
  missingMandiKey: "सर्व्हरच्या .env फाइलमध्ये data.gov.in API की जोडा आणि सर्व्हर पुन्हा सुरू करा.",
  rejectedMandiKey: "data.gov.in ने ही API की स्वीकारली नाही. ती सक्रिय आहे आणि या स्रोतासाठी मान्य आहे का ते तपासा.",
  mandiNetworkError: "बाजार सेवेपर्यंत पोहोचता आले नाही. इंटरनेट तपासून पुन्हा प्रयत्न करा.",
  mandiUpstreamError: "data.gov.in सेवा तात्पुरती उपलब्ध नाही. थोड्या वेळाने पुन्हा प्रयत्न करा.",
  mandiSchemaError: "डेटासेट प्रतिसादाचा नमुना ओळखता आला नाही; भाव दाखवले जाणार नाहीत.",
  adviceMonitor: "शेवटच्या तीन नोंदवलेल्या तारखांमध्ये भाव सातत्याने वाढले. निर्णयापूर्वी पुढील नोंद पाहू शकता; हा भविष्यातील भावाचा अंदाज नाही.",
  adviceSell: "शेवटच्या तीन नोंदवलेल्या तारखांमध्ये भाव सातत्याने घसरले. आजचा भाव गरजेला योग्य असल्यास, भाव वाढेल म्हणूनच थांबण्याऐवजी विक्रीचा विचार करा.",
  adviceNoSignal: "अलीकडील भावांमध्ये ठोस दिशा दिसत नाही. निर्णयापूर्वी तुमचे खर्च आणि स्थानिक भाव तपासा.",
  adviceInsufficient: "तीनपेक्षा कमी तारखांचे भाव उपलब्ध आहेत; विक्री किंवा प्रतीक्षेबाबत शिफारस करण्याइतकी माहिती नाही.",
  trendIncreasing: "वाढत आहे", trendDecreasing: "घसरत आहे", trendStable: "स्थिर आहे",
  samplePeriodOne: "नमुना 1",
  sellNowReason: "शेवटच्या तीन दैनिक सरासरी भावांत सलग घट झाली. आजचा स्थानिक भाव आणि खर्च विचारात घ्या; हा भावाचा अंदाज नाही.",
  waitMarketReason: "शेवटच्या तीन दैनिक सरासरी भावांत सलग वाढ झाली. निर्णयापूर्वी पुढील नोंद पाहा; भविष्यातील भावाची हमी नाही.",
  monitorMarketReason: "अलीकडील तीन तारखांमध्ये एकसारखी दिशा नाही; बाजार पाहत राहा आणि स्थानिक भावांची तुलना करा.",
  alertHeavyRainBody: "{date} रोजी {amount} मिमी पावसाचा अंदाज आहे. सिंचन पुढे ढकलण्याचा विचार करा आणि शेतातील पाण्याचा निचरा तपासा.",
  alertRainBody: "{date} रोजी पावसाची शक्यता {chance}%. अनावश्यक पाणी देणे टाळण्यासाठी आधी जमिनीतील ओलावा तपासा.",
  alertHeatBody: "{date} रोजी कमाल तापमान {temperature}°C अपेक्षित आहे. पिकाची पाण्याची गरज पाहत राहा.",
  alertWindBody: "सध्या जोरदार वारे असू शकतात. नाजूक पिकांना आधार आहे का ते तपासा.",
  riskFactorWeather: "हवामानाचा इशारा: {title}",
  postHarvestSellTip: "सुरक्षित साठवण कालावधी कमी असू शकतो. लवकर विक्री किंवा प्रक्रिया करण्यास प्राधान्य द्या आणि माल तपासा; केवळ या अंदाजावर अवलंबून राहू नका.",
  postHarvestStoreTip: "अल्पकालीन साठवण शक्य असू शकते. माल कोरडा आणि हवेशीर ठेवा व नियमित तपासा.",
  noLargestExpense: "अद्याप कोणताही खर्च नोंदवलेला नाही.", allKarnataka: "संपूर्ण भारत",
  farmerUnitSingular: "शेतकरी", farmerUnitPlural: "शेतकरी",
  learnMore: "हे पीक का?", chatWelcome: "नमस्कार! मी तुमचा नमुना शेती-सहाय्यक आहे. सामान्य प्रश्न विचारा किंवा खालील प्रश्नांपैकी एक निवडा.",
  prompts: "नमुना प्रश्न वापरून पाहा",
  riceDesc: "पाण्याची खात्रीशीर उपलब्धता असलेल्या भागातील परिचित पावसाळी पीक.",
  ragiDesc: "कमी ते मध्यम पाण्यात येणारे पौष्टिक भरडधान्य.",
  maizeDesc: "पीक फेरपालटीसाठी उपयोगी ठरू शकणारे बहुउपयोगी पीक.",
  pulsesDesc: "कडधान्ये पीक विविधता आणि जमिनीतील पोषणचक्राला मदत करू शकतात.",
  saveChanges: "बदल जतन करा", chartLabel: "नमुना पावसाचा कल",
  menu: "मेनू", percent: "टक्के", liveDataStatus: "🟢 थेट माहिती",
  offlineDataStatus: "🟡 ऑफलाइन मोड · जतन केलेली माहिती", sampleMarket: "म्हैसूर नमुना बाजार",
  cropDoctorYellowing: "पाने पिवळी पडणे", cropDoctorBrownSpots: "तपकिरी डाग",
  cropDoctorLeafCurling: "पाने गुंडाळणे", cropDoctorWilting: "कोमेजणे",
  cropDoctorWhitePowder: "पांढरी पावडर किंवा वाढ", cropDoctorBorerHoles: "खोड किंवा फळ पोखरणाऱ्या किडीची छिद्रे",
  cropDoctorTomato: "टोमॅटो", cropDoctorCotton: "कापूस", cropDoctorChilli: "मिरची",
  cropDoctorOrganicYellow: "जमिनीतील ओलावा, निचरा आणि पानांची खालची बाजू तपासा. स्थानिक परिस्थिती पाहिल्यानंतरच पोषकद्रव्ये दुरुस्त करा; रसशोषक कीड दिसल्यास आणि पीक-लेबल परवानगी देत असल्यासच कडुनिंब उत्पादन वापरा.",
  cropDoctorOrganicSpots: "खूप बाधित पाने आणि पीक अवशेष काढा; पानांवर पाणी पडणे टाळा. यामुळे स्वच्छता राखण्यास मदत होते, पण रोग बरा होण्याची हमी नाही.",
  cropDoctorOrganicCurl: "पानांची खालची बाजू तपासा आणि खूप बाधित पाने काढा. पीक-लेबल परवानगी देत असल्यास कडुनिंब काही मऊ शरीराच्या किडींवर उपयोगी ठरू शकतो; विषाणू बरा करू शकत नाही.",
  cropDoctorOrganicWilt: "जमिनीतील ओलावा आणि निचरा तपासा; कोमेजलेली झाडे निश्चित झाल्यास मुळांसह वेगळी काढा. खात्री नसलेली मिश्रणे जमिनीत टाकू नका.",
  cropDoctorOrganicPowder: "बाधित पाने काढून हवा खेळती ठेवा. उपचारापूर्वी ती धूळ किंवा फवारणीचा अवशेष नाही याची खात्री करा.",
  cropDoctorOrganicBorer: "कीड लागलेले झाडाचे भाग काढून नष्ट करा; ओळखलेल्या किडीसाठी आणि पिकासाठी योग्य असल्यासच फेरोमोन सापळा वापरा.",
  cropDoctorPreventYellow: "नियमित पाहणी करा, योग्य निचरा ठेवा आणि स्थानिक माती मार्गदर्शनानुसार संतुलित पोषकद्रव्ये वापरा.",
  cropDoctorPreventSpots: "पीक अवशेष काढा, हवा खेळती ठेवा आणि शक्य असल्यास पाने दीर्घकाळ ओली राहू देऊ नका.",
  cropDoctorPreventCurl: "पानांच्या खालच्या बाजूला वाहक कीड तपासा, तण किंवा पर्यायी आश्रयदाते काढा आणि शेजारच्या झाडांवर लक्ष ठेवा.",
  cropDoctorPreventWilt: "स्वच्छ साधने वापरा, दूषित माती हलवू नका आणि फेरपालट व निचऱ्यासाठी स्थानिक सल्ला घ्या.",
  cropDoctorPreventPowder: "हवेसाठी झाडांमध्ये अंतर ठेवा, बाधित अवशेष काढा आणि जवळची झाडे लक्षणांसाठी तपासा.",
  cropDoctorPreventBorer: "अंडी आणि नवीन छिद्रे तपासा; बाधित भाग काढा आणि सल्ला असल्यास किडीनुसार देखरेखीचे सापळे वापरा.",
  cropDoctorChemicalNone: "या एका लक्षणावरून रासायनिक औषध सुचवलेले नाही. आधी पाणी, पोषकद्रव्ये आणि कीड तपासा; फवारणीपूर्वी खात्री करा.",
  cropDoctorChemicalFungicide: "बुरशीजन्य रोग निश्चित झाल्यास या पिकासाठी आणि रोगासाठी सध्या नोंदणीकृत औषधाबद्दल स्थानिक KVK किंवा कृषी अधिकाऱ्यांना विचारा आणि लेबल पाळा.",
  cropDoctorChemicalInsecticide: "नमूद केलेली कीड निश्चित झाल्यास, या पिकासाठी व किडीसाठी लेबलवर नमूद असलेले सध्या नोंदणीकृत उत्पादनच वापरा; स्थानिक सल्ला आणि लेबल पाळा.",
  cropDoctorChemicalVector: "पांढरी माशी किंवा थ्रिप्स निश्चित झाल्यास नोंदणीकृत वाहक-नियंत्रण उत्पादनासाठी स्थानिक सल्ला घ्या. विषाणूग्रस्त झाडे बरी होत नाहीत; लेबल पाळा.",
  cropDoctorChemicalBorer: "खोड पोखरणारी कीड निश्चित झाल्यास या पिकासाठी व किडीसाठी नोंदणीकृत औषधाबद्दल स्थानिक KVK किंवा कृषी अधिकाऱ्यांना विचारा आणि लेबल पाळा.",
};

const languageText: Record<Language, AppTranslations> = {
  en: text.en,
  kn: text.kn,
  hi: hindiText,
  te: teluguText,
  ta: tamilText,
  mr: marathiText,
};

type AdvisoryIntent =
  | "soil"
  | "bioInput"
  | "weather"
  | "irrigation"
  | "mandi"
  | "pest"
  | "schemes"
  | "rotation"
  | "profit";

type AdvisoryLanguageCopy = {
  introduction: string;
  greeting: string;
  promptsLabel: string;
  prompts: readonly string[];
  unmatched: string;
  safetyNote: string;
  answers: Record<AdvisoryIntent, string>;
  context: {
    crop: string;
    soil: string;
    farm: string;
    irrigation: string;
    weather: string;
    noLocation: string;
    noForecast: string;
    market: string;
    noCrop: string;
    noMarketSnapshot: string;
    samplePriceNote: string;
    reportedPriceNote: string;
    trendIncreasing: string;
    trendDecreasing: string;
    trendStable: string;
    insufficientHistory: string;
    unavailable: string;
    acres: string;
  };
};

const advisoryCopy: LocalizedCopy<AdvisoryLanguageCopy> = {
  en: {
    introduction: "Namaskara! I'm KrishiMitra. I can help you think through soil and fertilizer, organic inputs, weather, irrigation, mandi prices, crop symptoms, schemes and loans, crop rotation, and farm costs.",
    greeting: "Hello! I'm KrishiMitra, your farming companion. Ask about soil and pH, fertilizer, bio-inputs, weather and irrigation, mandi prices, pests and diseases, schemes or KCC loans, crop rotation, sowing, or profit and expenses.",
    promptsLabel: "QUICK ASK",
    prompts: [
      "How do I improve soil pH and fertilizer use?",
      "How can I prepare and use Jeevamrutha?",
      "Will rain or heat affect my farm work?",
      "Should I irrigate today?",
      "How do I compare mandi prices before selling?",
      "What should I check if leaves are yellow or spotted?",
      "Where can I check KCC or farmer scheme eligibility?",
      "How do I plan crop rotation after this crop and estimate profit?",
    ],
    unmatched: "I can help with soil/pH and fertilizer, bio-inputs, weather, irrigation, mandi prices, crop symptoms, schemes/KCC, rotation/sowing, or profit/costs. Tell me the crop or question you want to focus on.",
    safetyNote: "Please confirm critical field decisions with your local KVK or agriculture officer.",
    answers: {
      soil: "For nutrients, first use a recent soil test for pH, organic carbon and available NPK. Match recommendations to the crop and season; avoid adding lime, gypsum or extra fertilizer based on symptoms alone. Split applications and timing should follow the local crop package and product label.",
      bioInput: "Use clean, mature compost or a locally verified bio-input recipe, prepared and applied as directed for the crop and stage. Jeevamrutha may support soil biological activity, but it does not guarantee nutrient needs or replace a soil-test-based fertilizer plan. Keep containers clean and try a small area first.",
      weather: "Use a location-specific forecast to plan spraying, drying, harvest and field work. If rain is expected, protect harvested produce and avoid spraying just before rain; in hot conditions, check crop moisture early and protect workers from heat. Forecasts are not guarantees, so verify local conditions.",
      irrigation: "Check moisture in the root zone and the crop's growth stage before irrigating. If rain is forecast or the soil is still moist, delay and recheck; when irrigation is needed, cooler morning hours can reduce evaporation and runoff. The right amount depends on crop, soil, method and stage, so I won't guess a fixed quantity.",
      mandi: "Compare recent modal prices for the same crop across several markets and dates, then subtract transport, loading, labour and fees. Confirm a local buyer's quote before deciding; past price movement does not predict the next price. Sample or cached records may not be current.",
      pest: "Yellowing, spots, curling or wilting can have several causes—not only pests. Check both leaf sides, new growth, soil moisture and nearby plants; note when symptoms began and take clear photos. Use Crop Doctor as a screening aid, not a diagnosis, and do not spray until the cause is confirmed and the product label fits the crop and target.",
      schemes: "Check the latest official portal or notification for eligibility, season, deadlines and documents. PM-KISAN, crop insurance and KCC have different rules; land size alone may not establish eligibility. Apply through official channels and never share an OTP or pay an unofficial agent.",
      rotation: "Plan the next crop around season, irrigation, soil and a locally recommended sowing window. After a cereal, a suitable pulse may diversify the rotation; choose it only if water, market and local guidance support it. Avoid repeating the same crop family without checking pest and disease history; the rotation planner gives ideas, not a prescription.",
      profit: "Enter realistic area, yield and a verified local selling price in Profit Calculator, then include seeds, fertilizer, labour, irrigation, transport and other costs. Record bills in Farm Ledger and compare revenue minus all expenses; this is an estimate, not guaranteed profit.",
    },
    context: {
      crop: "Selected crop",
      soil: "Saved soil profile",
      farm: "Saved farm details",
      irrigation: "Saved irrigation source",
      weather: "Weather at {location}: currently {temperature}, humidity {humidity}; forecast for {date}: rain {rain}, chance {chance}.",
      noLocation: "No weather location is saved yet; choose a location in Weather for a local forecast.",
      noForecast: "No forecast is loaded for {location}; check the Weather page before making weather-sensitive plans.",
      market: "Recent reported mandi prices for {crop}: {current} on {currentDate}; previous: {previous}; change: {change} ({trend}). {sourceNote}",
      noCrop: "Select a crop in the Profit Calculator to connect this advice to your crop.",
      noMarketSnapshot: "No matching mandi price history is loaded for {crop}. Check Mandi Prices for current nearby market records before deciding.",
      samplePriceNote: "These are sample or cached records; verify today's price with the market or buyer.",
      reportedPriceNote: "These are reported records, not a quote or a forecast; verify today's price locally.",
      trendIncreasing: "increasing",
      trendDecreasing: "decreasing",
      trendStable: "roughly stable",
      insufficientHistory: "not enough history to assess a trend",
      unavailable: "not available",
      acres: "acres",
    },
  },
  kn: {
    introduction: "ನಮಸ್ಕಾರ! ನಾನು ಕೃಷಿಮಿತ್ರ. ಮಣ್ಣು ಮತ್ತು ಗೊಬ್ಬರ, ಸಾವಯವ ಒಳಾಂಶಗಳು, ಹವಾಮಾನ, ನೀರಾವರಿ, ಮಾರುಕಟ್ಟೆ ಬೆಲೆ, ಬೆಳೆ ಲಕ್ಷಣಗಳು, ಯೋಜನೆ ಮತ್ತು ಸಾಲ, ಬೆಳೆ ಪರಿವರ್ತನೆ ಹಾಗೂ ಕೃಷಿ ವೆಚ್ಚಗಳ ಬಗ್ಗೆ ಸಹಾಯ ಮಾಡುತ್ತೇನೆ.",
    greeting: "ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ ಕೃಷಿ ಸಹಾಯಕ ಕೃಷಿಮಿತ್ರ. ಮಣ್ಣು ಮತ್ತು pH, ಗೊಬ್ಬರ, ಜೈವಿಕ ಒಳಾಂಶ, ಹವಾಮಾನ ಮತ್ತು ನೀರಾವರಿ, ಮಾರುಕಟ್ಟೆ ಬೆಲೆ, ಕೀಟ ಅಥವಾ ರೋಗ ಲಕ್ಷಣ, ಯೋಜನೆ ಅಥವಾ KCC ಸಾಲ, ಬೆಳೆ ಪರಿವರ್ತನೆ, ಬಿತ್ತನೆ, ಲಾಭ ಮತ್ತು ವೆಚ್ಚಗಳ ಬಗ್ಗೆ ಕೇಳಿ.",
    promptsLabel: "ತ್ವರಿತವಾಗಿ ಕೇಳಿ",
    prompts: [
      "ಮಣ್ಣಿನ pH ಮತ್ತು ಗೊಬ್ಬರ ಬಳಕೆಯನ್ನು ಹೇಗೆ ಸುಧಾರಿಸಲಿ?",
      "ಜೀವಾಮೃತವನ್ನು ಹೇಗೆ ತಯಾರಿಸಿ ಬಳಸಬಹುದು?",
      "ಮಳೆ ಅಥವಾ ಬಿಸಿಲು ಕೃಷಿ ಕೆಲಸದ ಮೇಲೆ ಪರಿಣಾಮ ಬೀರುತ್ತದೆಯೇ?",
      "ಇಂದು ನೀರಾವರಿ ಮಾಡಬೇಕೇ?",
      "ಮಾರಾಟಕ್ಕೂ ಮೊದಲು ಮಾರುಕಟ್ಟೆ ಬೆಲೆಗಳನ್ನು ಹೇಗೆ ಹೋಲಿಸಲಿ?",
      "ಎಲೆ ಹಳದಿಯಾದರೆ ಅಥವಾ ಚುಕ್ಕೆಗಳಿದ್ದರೆ ಏನು ಪರಿಶೀಲಿಸಲಿ?",
      "KCC ಅಥವಾ ರೈತ ಯೋಜನೆಗಳ ಅರ್ಹತೆಯನ್ನು ಎಲ್ಲಿ ಪರಿಶೀಲಿಸಲಿ?",
      "ಈ ಬೆಳೆಯ ನಂತರ ಬೆಳೆ ಪರಿವರ್ತನೆ ಮತ್ತು ಲಾಭವನ್ನು ಹೇಗೆ ಯೋಜಿಸಲಿ?",
    ],
    unmatched: "ಮಣ್ಣು/pH ಮತ್ತು ಗೊಬ್ಬರ, ಜೈವಿಕ ಒಳಾಂಶ, ಹವಾಮಾನ, ನೀರಾವರಿ, ಮಾರುಕಟ್ಟೆ ಬೆಲೆ, ಬೆಳೆ ಲಕ್ಷಣ, ಯೋಜನೆ/KCC, ಬೆಳೆ ಪರಿವರ್ತನೆ/ಬಿತ್ತನೆ ಅಥವಾ ಲಾಭ/ವೆಚ್ಚಗಳ ಬಗ್ಗೆ ಕೇಳಬಹುದು. ಯಾವ ಬೆಳೆ ಅಥವಾ ವಿಷಯದ ಬಗ್ಗೆ ತಿಳಿಯಬೇಕೆಂದು ಹೇಳಿ.",
    safetyNote: "ಮುಖ್ಯ ಹೊಲದ ನಿರ್ಧಾರಗಳನ್ನು ನಿಮ್ಮ ಸ್ಥಳೀಯ ಕೃಷಿ ವಿಜ್ಞಾನ ಕೇಂದ್ರ (KVK) ಅಥವಾ ಕೃಷಿ ಅಧಿಕಾರಿಯಿಂದ ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಿ.",
    answers: {
      soil: "ಪೋಷಕಾಂಶ ನಿರ್ಧರಿಸುವ ಮೊದಲು pH, ಸಾವಯವ ಇಂಗಾಲ ಮತ್ತು ಲಭ್ಯ NPK ಒಳಗೊಂಡ ಇತ್ತೀಚಿನ ಮಣ್ಣಿನ ಪರೀಕ್ಷೆ ಮಾಡಿಸಿ. ಶಿಫಾರಸನ್ನು ಬೆಳೆ ಮತ್ತು ಋತುವಿಗೆ ಹೊಂದಿಸಿ; ಲಕ್ಷಣಗಳನ್ನು ಮಾತ್ರ ನೋಡಿ ಸುಣ್ಣ, ಜಿಪ್ಸಂ ಅಥವಾ ಹೆಚ್ಚುವರಿ ಗೊಬ್ಬರ ಹಾಕಬೇಡಿ. ಗೊಬ್ಬರದ ಪ್ರಮಾಣ ಮತ್ತು ಸಮಯಕ್ಕೆ ಸ್ಥಳೀಯ ಬೆಳೆ ಮಾರ್ಗಸೂಚಿ ಹಾಗೂ ಉತ್ಪನ್ನದ ಲೇಬಲ್ ಅನುಸರಿಸಿ.",
      bioInput: "ಬೆಳೆ ಮತ್ತು ಹಂತಕ್ಕೆ ಸೂಚಿಸಿದಂತೆ ಸ್ವಚ್ಛ, ಚೆನ್ನಾಗಿ ಕೊಳೆತ ಕಾಂಪೋಸ್ಟ್ ಅಥವಾ ಸ್ಥಳೀಯವಾಗಿ ಪರಿಶೀಲಿಸಿದ ಜೈವಿಕ ಒಳಾಂಶವನ್ನು ತಯಾರಿಸಿ ಬಳಸಿ. ಜೀವಾಮೃತವು ಮಣ್ಣಿನ ಜೈವಿಕ ಚಟುವಟಿಕೆಗೆ ನೆರವಾಗಬಹುದು; ಆದರೆ ಪೋಷಕಾಂಶದ ಅಗತ್ಯವನ್ನು ಖಚಿತಪಡಿಸುವುದಿಲ್ಲ ಅಥವಾ ಮಣ್ಣಿನ ಪರೀಕ್ಷೆ ಆಧಾರಿತ ಗೊಬ್ಬರ ಯೋಜನೆಗೆ ಬದಲಿಯಲ್ಲ. ಪಾತ್ರೆಗಳನ್ನು ಸ್ವಚ್ಛವಾಗಿಡಿ ಮತ್ತು ಮೊದಲು ಸಣ್ಣ ಪ್ರದೇಶದಲ್ಲಿ ಪ್ರಯೋಗಿಸಿ.",
      weather: "ಸಿಂಪಡಣೆ, ಒಣಗಿಸುವಿಕೆ, ಕೊಯ್ಲು ಮತ್ತು ಹೊಲದ ಕೆಲಸವನ್ನು ಯೋಜಿಸಲು ನಿಮ್ಮ ಸ್ಥಳದ ಹವಾಮಾನ ಮುನ್ಸೂಚನೆ ಬಳಸಿ. ಮಳೆ ನಿರೀಕ್ಷೆಯಿದ್ದರೆ ಕೊಯ್ಲಿನ ಉತ್ಪನ್ನವನ್ನು ರಕ್ಷಿಸಿ ಮತ್ತು ಮಳೆಯ ಮುನ್ನ ಸಿಂಪಡಿಸಬೇಡಿ; ಬಿಸಿಲಿನಲ್ಲಿ ಬೆಳೆ ತೇವಾಂಶವನ್ನು ಬೇಗ ಪರಿಶೀಲಿಸಿ, ಕಾರ್ಮಿಕರನ್ನು ಬಿಸಿಯಿಂದ ಕಾಪಾಡಿ. ಮುನ್ಸೂಚನೆ ಖಚಿತವಲ್ಲ—ಸ್ಥಳೀಯ ಸ್ಥಿತಿಯನ್ನೂ ಪರಿಶೀಲಿಸಿ.",
      irrigation: "ನೀರಾವರಿಗೂ ಮೊದಲು ಬೇರು ವಲಯದ ತೇವಾಂಶ ಮತ್ತು ಬೆಳೆಯ ಹಂತ ಪರಿಶೀಲಿಸಿ. ಮಳೆ ಮುನ್ಸೂಚನೆ ಇದ್ದರೆ ಅಥವಾ ಮಣ್ಣು ತೇವವಾಗಿದ್ದರೆ ನೀರು ಹಾಕುವುದನ್ನು ಮುಂದೂಡಿ ಮತ್ತೆ ಪರಿಶೀಲಿಸಿ; ಅಗತ್ಯವಿದ್ದಾಗ ತಂಪಾದ ಬೆಳಗಿನ ಸಮಯ ಆಯ್ಕೆಮಾಡಿ, ನೀರು ಹರಿದುಹೋಗದಂತೆ ನೋಡಿ. ಸರಿಯಾದ ಪ್ರಮಾಣ ಬೆಳೆ, ಮಣ್ಣು, ವಿಧಾನ ಮತ್ತು ಹಂತದ ಮೇಲೆ ಅವಲಂಬಿತವಾಗಿರುವುದರಿಂದ ಊಹೆಯ ಪ್ರಮಾಣ ನೀಡುವುದಿಲ್ಲ.",
      mandi: "ಒಂದೇ ಬೆಳೆಯ ಇತ್ತೀಚಿನ ಮಾದರಿ ಬೆಲೆಗಳನ್ನು ಹಲವು ಮಾರುಕಟ್ಟೆ ಮತ್ತು ದಿನಾಂಕಗಳಲ್ಲಿ ಹೋಲಿಸಿ; ನಂತರ ಸಾಗಣೆ, ಲೋಡಿಂಗ್, ಕೂಲಿ ಮತ್ತು ಶುಲ್ಕಗಳನ್ನು ಲೆಕ್ಕಿಸಿ. ಮಾರಾಟಕ್ಕೂ ಮೊದಲು ಸ್ಥಳೀಯ ಖರೀದಿದಾರರ ಬೆಲೆಯನ್ನು ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಿ; ಹಿಂದಿನ ಬೆಲೆ ಏರಿಳಿತ ಮುಂದಿನ ಬೆಲೆಯ ಮುನ್ಸೂಚನೆಯಲ್ಲ. ಮಾದರಿ ಅಥವಾ ಕ್ಯಾಶ್ ಮಾಡಿದ ದಾಖಲೆಗಳು ಇಂದಿನದಾಗಿರದೇ ಇರಬಹುದು.",
      pest: "ಎಲೆ ಹಳದಿಯಾಗುವುದು, ಚುಕ್ಕೆ, ಮುದುಡುವಿಕೆ ಅಥವಾ ಬಾಡುವಿಕೆಗೆ ಕೀಟ ಮಾತ್ರವಲ್ಲದೆ ಹಲವು ಕಾರಣಗಳಿರಬಹುದು. ಎಲೆಯ ಎರಡೂ ಬದಿ, ಹೊಸ ಬೆಳವಣಿಗೆ, ಮಣ್ಣಿನ ತೇವಾಂಶ ಮತ್ತು ಪಕ್ಕದ ಗಿಡಗಳನ್ನು ಪರಿಶೀಲಿಸಿ; ಲಕ್ಷಣ ಆರಂಭವಾದ ಸಮಯ ದಾಖಲಿಸಿ, ಸ್ಪಷ್ಟ ಚಿತ್ರ ತೆಗೆದುಕೊಳ್ಳಿ. ಬೆಳೆ ವೈದ್ಯವನ್ನು ಪ್ರಾಥಮಿಕ ಪರಿಶೀಲನೆಗೆ ಮಾತ್ರ ಬಳಸಿ; ಕಾರಣ ಖಚಿತಪಡಿಸಿ, ಬೆಳೆ ಮತ್ತು ಸಮಸ್ಯೆಗೆ ಲೇಬಲ್ ಹೊಂದಿರುವುದನ್ನು ಪರಿಶೀಲಿಸದೆ ಸಿಂಪಡಿಸಬೇಡಿ.",
      schemes: "ಅರ್ಹತೆ, ಋತು, ಕೊನೆಯ ದಿನಾಂಕ ಮತ್ತು ದಾಖಲೆಗಳಿಗೆ ಇತ್ತೀಚಿನ ಅಧಿಕೃತ ಪೋರ್ಟಲ್ ಅಥವಾ ಅಧಿಸೂಚನೆ ಪರಿಶೀಲಿಸಿ. PM-KISAN, ಬೆಳೆ ವಿಮೆ ಮತ್ತು KCC ನಿಯಮಗಳು ಬೇರೆಬೇರೆ; ಭೂಮಿಯ ವಿಸ್ತೀರ್ಣ ಮಾತ್ರ ಅರ್ಹತೆಯನ್ನು ನಿರ್ಧರಿಸುವುದಿಲ್ಲ. ಅಧಿಕೃತ ಮಾರ್ಗದಲ್ಲೇ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ; OTP ಹಂಚಿಕೊಳ್ಳಬೇಡಿ ಅಥವಾ ಅನಧಿಕೃತ ಏಜೆಂಟ್‌ಗೆ ಹಣ ಕೊಡಬೇಡಿ.",
      rotation: "ಮುಂದಿನ ಬೆಳೆಯನ್ನು ಋತು, ನೀರಾವರಿ, ಮಣ್ಣು ಮತ್ತು ಸ್ಥಳೀಯವಾಗಿ ಶಿಫಾರಸಾದ ಬಿತ್ತನೆ ಅವಧಿಗೆ ಹೊಂದಿಸಿ. ಧಾನ್ಯ ಬೆಳೆಯ ನಂತರ ಸೂಕ್ತ ಬೇಳೆ ಬೆಳೆ ಬೆಳೆ ಪರಿವರ್ತನೆಗೆ ವೈವಿಧ್ಯ ನೀಡಬಹುದು; ನೀರು, ಮಾರುಕಟ್ಟೆ ಮತ್ತು ಸ್ಥಳೀಯ ಸಲಹೆ ಬೆಂಬಲಿಸಿದರೆ ಮಾತ್ರ ಆಯ್ಕೆಮಾಡಿ. ಕೀಟ ಮತ್ತು ರೋಗದ ಹಿಂದಿನ ಸ್ಥಿತಿ ಪರಿಶೀಲಿಸದೆ ಒಂದೇ ಬೆಳೆ ಕುಟುಂಬವನ್ನು ಮರುಮರು ಬೆಳೆಸಬೇಡಿ; ಪರಿವರ್ತನೆ ಯೋಜನೆ ಸಲಹೆ ಮಾತ್ರ, ನಿಶ್ಚಿತ ಸೂಚನೆಯಲ್ಲ.",
      profit: "ಲಾಭ ಕ್ಯಾಲ್ಕುಲೇಟರ್‌ನಲ್ಲಿ ವಾಸ್ತವಿಕ ವಿಸ್ತೀರ್ಣ, ಇಳುವರಿ ಮತ್ತು ಸ್ಥಳೀಯವಾಗಿ ಖಚಿತಪಡಿಸಿದ ಮಾರಾಟ ಬೆಲೆ ನಮೂದಿಸಿ; ಬೀಜ, ಗೊಬ್ಬರ, ಕೂಲಿ, ನೀರಾವರಿ, ಸಾಗಣೆ ಮತ್ತು ಇತರ ವೆಚ್ಚಗಳನ್ನೂ ಸೇರಿಸಿ. ಕೃಷಿ ಖಾತೆಯಲ್ಲಿ ಬಿಲ್ ದಾಖಲಿಸಿ, ಒಟ್ಟು ವೆಚ್ಚವನ್ನು ಆದಾಯದಿಂದ ಕಳೆಯಿರಿ. ಇದು ಅಂದಾಜು ಮಾತ್ರ, ಖಚಿತ ಲಾಭವಲ್ಲ.",
    },
    context: {
      crop: "ಆಯ್ಕೆ ಮಾಡಿದ ಬೆಳೆ",
      soil: "ಉಳಿಸಿದ ಮಣ್ಣಿನ ವಿವರ",
      farm: "ಉಳಿಸಿದ ಕೃಷಿ ವಿವರ",
      irrigation: "ಉಳಿಸಿದ ನೀರಾವರಿ ಮೂಲ",
      weather: "{location} ಹವಾಮಾನ: ಈಗ {temperature}, ತೇವಾಂಶ {humidity}; {date} ಮುನ್ಸೂಚನೆ: ಮಳೆ {rain}, ಸಾಧ್ಯತೆ {chance}.",
      noLocation: "ಹವಾಮಾನ ಸ್ಥಳ ಇನ್ನೂ ಉಳಿಸಿಲ್ಲ; ಸ್ಥಳೀಯ ಮುನ್ಸೂಚನೆಗಾಗಿ ಹವಾಮಾನ ವಿಭಾಗದಲ್ಲಿ ಸ್ಥಳ ಆಯ್ಕೆಮಾಡಿ.",
      noForecast: "{location}ಗೆ ಮುನ್ಸೂಚನೆ ಲಭ್ಯವಿಲ್ಲ; ಹವಾಮಾನಕ್ಕೆ ಸಂಬಂಧಿಸಿದ ಕೆಲಸಕ್ಕೂ ಮೊದಲು ಹವಾಮಾನ ಪುಟ ಪರಿಶೀಲಿಸಿ.",
      market: "{crop}ಗೆ ಇತ್ತೀಚಿನ ವರದಿಯಾದ ಮಾರುಕಟ್ಟೆ ಬೆಲೆ: {current} ({currentDate}); ಹಿಂದಿನದು: {previous}; ಬದಲಾವಣೆ: {change} ({trend}). {sourceNote}",
      noCrop: "ಈ ಸಲಹೆಯನ್ನು ನಿಮ್ಮ ಬೆಳೆಗೆ ಹೊಂದಿಸಲು ಲಾಭ ಕ್ಯಾಲ್ಕುಲೇಟರ್‌ನಲ್ಲಿ ಬೆಳೆ ಆಯ್ಕೆಮಾಡಿ.",
      noMarketSnapshot: "{crop}ಗೆ ಹೊಂದುವ ಮಾರುಕಟ್ಟೆ ಬೆಲೆ ಇತಿಹಾಸ ಲಭ್ಯವಿಲ್ಲ. ನಿರ್ಧಾರಕ್ಕೂ ಮೊದಲು ಮಾರುಕಟ್ಟೆ ವಿಭಾಗದಲ್ಲಿ ಇಂದಿನ ಹತ್ತಿರದ ಬೆಲೆ ಪರಿಶೀಲಿಸಿ.",
      samplePriceNote: "ಇವು ಮಾದರಿ ಅಥವಾ ಕ್ಯಾಶ್ ಮಾಡಿದ ದಾಖಲೆಗಳು; ಇಂದಿನ ಬೆಲೆಯನ್ನು ಮಾರುಕಟ್ಟೆ ಅಥವಾ ಖರೀದಿದಾರರಿಂದ ಖಚಿತಪಡಿಸಿ.",
      reportedPriceNote: "ಇವು ವರದಿಯಾದ ದಾಖಲೆಗಳು ಮಾತ್ರ; ಖರೀದಿ ಬೆಲೆ ಅಥವಾ ಮುನ್ಸೂಚನೆಯಲ್ಲ. ಇಂದಿನ ಬೆಲೆಯನ್ನು ಸ್ಥಳೀಯವಾಗಿ ಖಚಿತಪಡಿಸಿ.",
      trendIncreasing: "ಏರಿಕೆ",
      trendDecreasing: "ಇಳಿಕೆ",
      trendStable: "ಸುಮಾರು ಸ್ಥಿರ",
      insufficientHistory: "ಪ್ರವೃತ್ತಿ ಅಂದಾಜಿಸಲು ಸಾಕಷ್ಟು ಇತಿಹಾಸವಿಲ್ಲ",
      unavailable: "ಲಭ್ಯವಿಲ್ಲ",
      acres: "ಎಕರೆ",
    },
  },
  hi: {
    introduction: "नमस्कार! मैं कृषिमित्र हूँ। मैं मिट्टी और खाद, जैविक इनपुट, मौसम, सिंचाई, मंडी भाव, फसल के लक्षण, योजनाएँ और ऋण, फसल चक्र तथा खेती के खर्चों पर मदद कर सकता हूँ।",
    greeting: "नमस्कार! मैं आपका कृषि सहायक कृषिमित्र हूँ। मिट्टी और pH, खाद, जैविक इनपुट, मौसम और सिंचाई, मंडी भाव, कीट या रोग के लक्षण, योजनाएँ या KCC ऋण, फसल चक्र, बुवाई, लाभ और खर्चों के बारे में पूछें।",
    promptsLabel: "जल्दी पूछें",
    prompts: [
      "मिट्टी का pH और खाद का उपयोग कैसे सुधारूँ?",
      "जीवामृत कैसे तैयार और उपयोग करूँ?",
      "क्या बारिश या गर्मी से खेत के काम पर असर होगा?",
      "क्या आज सिंचाई करनी चाहिए?",
      "बेचने से पहले मंडी भाव की तुलना कैसे करूँ?",
      "पत्तियाँ पीली हों या धब्बे हों तो क्या जाँचूँ?",
      "KCC या किसान योजना की पात्रता कहाँ जाँचूँ?",
      "इस फसल के बाद फसल चक्र कैसे बनाऊँ और लाभ कैसे आँकूँ?",
    ],
    unmatched: "मैं मिट्टी/pH और खाद, जैविक इनपुट, मौसम, सिंचाई, मंडी भाव, फसल के लक्षण, योजनाएँ/KCC, फसल चक्र/बुवाई या लाभ/खर्चों पर मदद कर सकता हूँ। बताइए किस फसल या विषय पर ध्यान देना है।",
    safetyNote: "खेत के महत्वपूर्ण फैसलों की पुष्टि अपने स्थानीय कृषि विज्ञान केंद्र (KVK) या कृषि अधिकारी से करें।",
    answers: {
      soil: "पोषक तत्व तय करने से पहले pH, जैविक कार्बन और उपलब्ध NPK की हाल की मिट्टी जाँच कराएँ। सलाह फसल और मौसम के अनुसार लें; केवल लक्षण देखकर चूना, जिप्सम या अतिरिक्त खाद न डालें। खाद की मात्रा और समय के लिए स्थानीय फसल मार्गदर्शिका और उत्पाद का लेबल मानें।",
      bioInput: "फसल और अवस्था के निर्देशों के अनुसार साफ, अच्छी तरह पकी खाद या स्थानीय रूप से सत्यापित जैविक इनपुट तैयार और उपयोग करें। जीवामृत मिट्टी की जैविक गतिविधि में मदद कर सकता है, लेकिन पोषण की जरूरत की गारंटी या मिट्टी जाँच आधारित खाद योजना का विकल्प नहीं है। बर्तन साफ रखें और पहले छोटे हिस्से में आजमाएँ।",
      weather: "छिड़काव, सुखाने, कटाई और खेत के काम की योजना के लिए अपने स्थान का मौसम पूर्वानुमान देखें। बारिश की संभावना हो तो कटी उपज को ढकें और बारिश से ठीक पहले छिड़काव न करें; गर्मी में फसल की नमी जल्दी जाँचें और मजदूरों को गर्मी से बचाएँ। पूर्वानुमान निश्चित नहीं होता, स्थानीय स्थिति भी देखें।",
      irrigation: "सिंचाई से पहले जड़ क्षेत्र की नमी और फसल की अवस्था जाँचें। बारिश का पूर्वानुमान हो या मिट्टी नम हो तो सिंचाई टालकर फिर जाँचें; जरूरत होने पर ठंडे सुबह के समय पानी दें और बहाव रोकें। सही मात्रा फसल, मिट्टी, विधि और अवस्था पर निर्भर करती है, इसलिए मैं तय मात्रा का अनुमान नहीं दूँगा।",
      mandi: "एक ही फसल के हाल के मॉडल भाव कई मंडियों और तारीखों में तुलना करें, फिर ढुलाई, लोडिंग, मजदूरी और शुल्क घटाएँ। फैसला करने से पहले स्थानीय खरीदार का भाव पक्का करें; पुराने भावों का उतार-चढ़ाव अगले भाव की भविष्यवाणी नहीं है। नमूना या कैश किए गए रिकॉर्ड आज के नहीं हो सकते।",
      pest: "पीलापन, धब्बे, मुड़ना या मुरझाना कई कारणों से हो सकता है, केवल कीट से नहीं। पत्तियों के दोनों ओर, नई वृद्धि, मिट्टी की नमी और पास के पौधे देखें; लक्षण कब शुरू हुए लिखें और साफ तस्वीर लें। Crop Doctor को शुरुआती जाँच मानें, निदान नहीं; कारण और फसल के लिए लेबल की पुष्टि किए बिना छिड़काव न करें।",
      schemes: "पात्रता, मौसम, अंतिम तारीख और दस्तावेजों के लिए नवीनतम आधिकारिक पोर्टल या सूचना देखें। PM-KISAN, फसल बीमा और KCC के नियम अलग हैं; केवल जमीन का क्षेत्र पात्रता तय नहीं करता। आधिकारिक माध्यम से आवेदन करें; OTP साझा न करें और अनधिकृत एजेंट को पैसे न दें।",
      rotation: "अगली फसल को मौसम, सिंचाई, मिट्टी और स्थानीय अनुशंसित बुवाई समय के अनुसार चुनें। अनाज के बाद उपयुक्त दलहन फसल चक्र में विविधता ला सकती है; तभी चुनें जब पानी, बाजार और स्थानीय सलाह अनुकूल हों। कीट और रोग का इतिहास देखे बिना एक ही फसल परिवार बार-बार न लें; रोटेशन प्लानर सुझाव देता है, पक्का निर्देश नहीं।",
      profit: "लाभ कैलकुलेटर में वास्तविक क्षेत्र, उपज और स्थानीय रूप से पक्का बिक्री भाव डालें; बीज, खाद, मजदूरी, सिंचाई, ढुलाई और अन्य खर्च भी जोड़ें। Farm Ledger में बिल दर्ज करें और कुल खर्च को आय से घटाएँ। यह अनुमान है, निश्चित लाभ नहीं।",
    },
    context: {
      crop: "चुनी गई फसल",
      soil: "सहेजी गई मिट्टी",
      farm: "सहेजा गया खेत विवरण",
      irrigation: "सहेजा गया सिंचाई स्रोत",
      weather: "{location} का मौसम: अभी {temperature}, नमी {humidity}; {date} का पूर्वानुमान: बारिश {rain}, संभावना {chance}.",
      noLocation: "अभी मौसम का स्थान सहेजा नहीं है; स्थानीय पूर्वानुमान के लिए मौसम पृष्ठ पर स्थान चुनें।",
      noForecast: "{location} का पूर्वानुमान उपलब्ध नहीं है; मौसम पर निर्भर काम से पहले मौसम पृष्ठ देखें।",
      market: "{crop} के हाल के रिपोर्टेड मंडी भाव: {current} ({currentDate}); पिछला: {previous}; बदलाव: {change} ({trend}). {sourceNote}",
      noCrop: "इस सलाह को आपकी फसल से जोड़ने के लिए लाभ कैलकुलेटर में फसल चुनें।",
      noMarketSnapshot: "{crop} के लिए मिलते-जुलते मंडी भाव का इतिहास उपलब्ध नहीं है। निर्णय से पहले मंडी पृष्ठ पर आज के नजदीकी भाव देखें।",
      samplePriceNote: "ये नमूना या कैश किए गए रिकॉर्ड हैं; आज का भाव मंडी या खरीदार से पक्का करें।",
      reportedPriceNote: "ये रिपोर्टेड रिकॉर्ड हैं, खरीदार का भाव या पूर्वानुमान नहीं; आज का भाव स्थानीय रूप से पक्का करें।",
      trendIncreasing: "बढ़ रहा है",
      trendDecreasing: "घट रहा है",
      trendStable: "लगभग स्थिर है",
      insufficientHistory: "रुझान आँकने के लिए पर्याप्त इतिहास नहीं है",
      unavailable: "उपलब्ध नहीं",
      acres: "एकड़",
    },
  },
};

function App() {
  const [language, setLanguage] = useState<Language>("en");
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
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
  const [weatherCacheUsed, setWeatherCacheUsed] = useState(false);
  const [weatherRefresh, setWeatherRefresh] = useState(0);
  const [profitInputs, setProfitInputs] = useState<ProfitInputs>(initialProfitInputs);
  const [mandiSnapshot, setMandiSnapshot] = useState<MandiSnapshot | null>(null);
  const [bioInputRecipe, setBioInputRecipe] = useState<BioRecipeId>("jeevamrutha");
  const [bioInputArea, setBioInputArea] = useState(profile?.land ?? "");
  const [bioInputSeedBatch, setBioInputSeedBatch] = useState("");
  const t = (key: keyof typeof text.en) => languageText[language][key] ?? text.en[key];

  useEffect(() => {
    const updateConnection = () => setIsOnline(navigator.onLine);
    window.addEventListener("online", updateConnection);
    window.addEventListener("offline", updateConnection);
    return () => {
      window.removeEventListener("online", updateConnection);
      window.removeEventListener("offline", updateConnection);
    };
  }, []);

  useEffect(() => {
    if (weatherLocation === null) {
      setWeatherForecast(null);
      setWeatherLoading(false);
      setWeatherError("");
      setWeatherUpdatedAt(null);
      setWeatherCacheUsed(false);
      return;
    }

    const selectedLocation = weatherLocation;
    const cached = readCachedWeather(selectedLocation.id);
    if (cached) {
      setWeatherForecast(cached.forecast);
      setWeatherUpdatedAt(new Date(cached.timestamp));
      setWeatherCacheUsed(true);
    } else {
      setWeatherForecast(null);
      setWeatherUpdatedAt(null);
      setWeatherCacheUsed(false);
    }
    if (!isOnline) {
      setWeatherError(cached ? "" : "network");
      setWeatherLoading(false);
      return;
    }

    const controller = new AbortController();
    async function loadWeather() {
      setWeatherLoading(true);
      setWeatherError("");
      try {
        const forecast = await fetchWeatherForecast(selectedLocation, controller.signal);
        const updatedAt = new Date();
        setWeatherForecast(forecast);
        setWeatherUpdatedAt(updatedAt);
        setWeatherCacheUsed(false);
        writeCachedWeather(selectedLocation.id, forecast, updatedAt.toISOString());
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("Could not fetch Open-Meteo weather.", error);
        const fallback = readCachedWeather(selectedLocation.id);
        if (fallback) {
          setWeatherForecast(fallback.forecast);
          setWeatherUpdatedAt(new Date(fallback.timestamp));
          setWeatherCacheUsed(true);
          setWeatherError("");
        } else {
          setWeatherError(error instanceof WeatherServiceError ? error.message : "invalid-response");
        }
      } finally {
        if (!controller.signal.aborted) setWeatherLoading(false);
      }
    }
    void loadWeather();
    return () => controller.abort();
  }, [weatherLocation, weatherRefresh, isOnline]);

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
      setBioInputArea((currentArea) => currentArea === (profile?.land ?? "") ? next.land : currentArea);
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
      setBioInputArea((currentArea) => currentArea === (profile?.land ?? "") ? "" : currentArea);
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
    const response = buildAdvisoryResponse(trimmed, {
      language,
      profile,
      weatherLocation,
      weatherForecast,
      profitInputs,
      mandiSnapshot,
    }, t);
    setChatMessages((current) => [
      ...current,
      { from: "farmer", text: trimmed, language },
      { from: "mitra", text: response, language },
    ]);
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
        <div className="side-label">{t("yourFarm")}</div>
        <nav className="side-nav" aria-label="Main navigation">
          {navItems.map((item) => (
            <button key={item.id} className={`nav-item ${screen === item.id ? "active" : ""}`} onClick={() => navigate(item.id)}>
              <span className="nav-icon">{item.icon}</span><span>{t(item.key)}</span>
              {screen === item.id && <span className="active-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="season-card"><span className="season-icon">☀</span><div><strong>{t("season")}</strong><small>{t("fieldNote")}</small></div></div>
          <span className="version">KRISHIMITRA · PHASE 1</span>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="mobile-brand"><span className="brand-mark">K<span>✳</span></span><strong>KrishiMitra</strong></div>
          <div className="breadcrumb"><span>{t("yourFarm")}</span><b>/</b>{headerTitle}</div>
          <div className="top-actions">
            <span className={`offline-pill ${isOnline ? "connection-online" : "connection-offline"}`} role="status" aria-live="polite">
              {t(isOnline ? "liveDataStatus" : "offlineDataStatus")}
            </span>
            <div className="language-toggle" role="group" aria-label={t("chooseLanguage")}>
              <button type="button" className={language === "en" ? "selected" : ""} onClick={() => setLanguage("en")} aria-pressed={language === "en"} aria-label="English">EN</button>
              <button type="button" className={language === "kn" ? "selected" : ""} onClick={() => setLanguage("kn")} aria-pressed={language === "kn"} aria-label="ಕನ್ನಡ">ಕನ್ನಡ</button>
              <button type="button" className={language === "hi" ? "selected" : ""} onClick={() => setLanguage("hi")} aria-pressed={language === "hi"} aria-label="हिंदी">हिंदी</button>
              <button type="button" className={language === "te" ? "selected" : ""} onClick={() => setLanguage("te")} aria-pressed={language === "te"} aria-label="తెలుగు">తెలుగు</button>
              <button type="button" className={language === "ta" ? "selected" : ""} onClick={() => setLanguage("ta")} aria-pressed={language === "ta"} aria-label="தமிழ்">தமிழ்</button>
              <button type="button" className={language === "mr" ? "selected" : ""} onClick={() => setLanguage("mr")} aria-pressed={language === "mr"} aria-label="मराठी">मराठी</button>
            </div>
            <button className="avatar-button" onClick={() => navigate("settings")} aria-label={t("settings")}>
              {profile?.name ? profile.name.charAt(0).toUpperCase() : "☺"}
            </button>
          </div>
        </header>

        <div className="page-content">
          {notice && <div className="toast" role="status"><span>✓</span>{notice}<button onClick={() => setNotice("")} aria-label={t("close")}>×</button></div>}
          {screen === "dashboard" && <Dashboard t={t} profile={profile} navigate={navigate} weatherLocation={weatherLocation} weatherForecast={weatherForecast} weatherLoading={weatherLoading} />}
          {screen === "weather" && <Weather t={t} language={language} location={weatherLocation} forecast={weatherForecast} loading={weatherLoading} error={weatherError} updatedAt={weatherUpdatedAt} isCached={weatherCacheUsed} onSelectLocation={chooseWeatherLocation} onClearLocation={clearWeatherLocation} onRefresh={() => setWeatherRefresh((count) => count + 1)} />}
          {screen === "mandi" && <Mandi t={t} isOnline={isOnline} onSnapshot={setMandiSnapshot} />}
          {screen === "profit" && <ProfitCalculator t={t} language={language} form={profitInputs} onChange={updateProfitInput} profileVillage={profile?.village ?? ""} />}
          {screen === "smartFarm" && <SmartFarm t={t} language={language} profile={profile} location={weatherLocation} forecast={weatherForecast} profitInputs={profitInputs} onProfitInputChange={updateProfitInput} mandiSnapshot={mandiSnapshot} bioInputPlan={{ recipe: bioInputRecipe, area: bioInputArea, seedBatch: bioInputSeedBatch }} navigate={navigate} />}
          {screen === "irrigation" && <SmartIrrigationScheduler language={language === "kn" ? "kn" : "en"} forecast={weatherForecast} location={weatherLocation} profileSoil={profile?.soil ?? ""} />}
          {screen === "soil" && <><Soil t={t} profile={profile} /><OrganicBioInputCalculator t={t} language={language} recipe={bioInputRecipe} onRecipeChange={setBioInputRecipe} area={bioInputArea} onAreaChange={setBioInputArea} seedBatch={bioInputSeedBatch} onSeedBatchChange={setBioInputSeedBatch} /></>}
          {screen === "crops" && <Crops t={t} navigate={navigate} />}
          {screen === "rotation" && <CropRotationPlanner language={language} profileSoil={profile?.soil ?? ""} />}
          {screen === "cropDoctor" && <CropDoctor t={t} />}
          {screen === "schemes" && <GovtSchemesFinder language={language === "kn" ? "kn" : "en"} />}
          {screen === "advisory" && <Advisory t={t} language={language} messages={chatMessages} input={chatInput} setInput={setChatInput} send={sendMessage} />}
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
          <span>•••</span><small>{t("more")}</small>
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

function SpeakButton({ textToSpeak, language, t }: PageProps & { textToSpeak: string; language: Language }) {
  const [speaking, setSpeaking] = useState(false);
  const [failed, setFailed] = useState(false);
  const supported = typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    typeof SpeechSynthesisUtterance !== "undefined";

  useEffect(() => () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  function toggleSpeech() {
    if (!supported) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    setFailed(false);
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = localeForLanguage(language);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = (event) => {
      setSpeaking(false);
      if (event.error !== "canceled" && event.error !== "interrupted") setFailed(true);
    };
    setSpeaking(true);
    try {
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error("Could not start browser speech synthesis.", error);
      setSpeaking(false);
      setFailed(true);
    }
  }

  return <div className="speech-control">
    <button type="button" className="speech-button" onClick={toggleSpeech} disabled={!supported || !textToSpeak.trim()} aria-pressed={speaking}>
      <span aria-hidden="true">{speaking ? "■" : "🔊"}</span>{speaking ? t("stopReading") : t("listenToSummary")}
    </button>
    {!supported && <small role="status">{t("speechUnavailable")}</small>}
    {failed && <small role="status">{t("speechError")}</small>}
  </div>;
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
  const [marketIndex, setMarketIndex] = useState(0);
  useEffect(() => {
    if (dashboardMarketSnapshots.length < 2) return;
    const interval = window.setInterval(() => {
      setMarketIndex((current) => (current + 1) % dashboardMarketSnapshots.length);
    }, 5000);
    return () => window.clearInterval(interval);
  }, []);

  const marketSnapshot = dashboardMarketSnapshots[marketIndex % dashboardMarketSnapshots.length];
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
          {marketSnapshot && <div className="market-snapshot-content" key={marketSnapshot.commodity}>
            <div className="market-crop">{marketSnapshot.cropLabel ? t(marketSnapshot.cropLabel) : marketSnapshot.commodity} <span className={marketSnapshot.percentageChange === null ? "change-neutral" : marketSnapshot.percentageChange >= 0 ? "change-up" : "change-down"}>
              {marketSnapshot.percentageChange === null
                ? "—"
                : `${marketSnapshot.percentageChange > 0 ? "+" : ""}${marketSnapshot.percentageChange.toFixed(1)}%`}
            </span></div>
            <div className="market-price">{formatPrice(marketSnapshot.modalPrice)} <small>/ quintal</small></div>
            <div className="market-location">{marketSnapshot.market}</div>
          </div>}
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
          <div className="panel-heading"><div><div className="eyebrow">{languageOf(t) === "kn" ? "ನಿಮ್ಮ ನೆರವಿಗೆ" : "HERE TO HELP"}</div><h2>{t("quickActions")}</h2></div><span className="action-spark">✳</span></div>
          <div className="quick-actions">
            <button onClick={() => navigate("advisory")}><span className="action-icon chat-icon">✳</span><span><strong>{t("askMitra")}</strong><small>{languageOf(t) === "kn" ? "ನಿಮ್ಮ ಪ್ರಶ್ನೆ ಕೇಳಿ" : "A question on your mind?"}</small></span><b>→</b></button>
            <button onClick={() => navigate("soil")}><span className="action-icon soil-icon">◉</span><span><strong>{t("soilCheck")}</strong><small>{languageOf(t) === "kn" ? "ನಿಮ್ಮ ಮಣ್ಣನ್ನು ತಿಳಿಯಿರಿ" : "Know your soil better"}</small></span><b>→</b></button>
            <button onClick={() => navigate("crops")}><span className="action-icon crop-icon">❋</span><span><strong>{t("cropPlanner")}</strong><small>{languageOf(t) === "kn" ? "ಈ ಹಂಗಾಮಿನ ಕಲ್ಪನೆಗಳು" : "Ideas for the season"}</small></span><b>→</b></button>
          </div>
        </section>
      </div>
      <CropMilestoneTimeline t={t} language={languageOf(t)} />
      <div className="field-note"><span>✿</span><p>{t("fieldNote")}</p><span className="note-sun">☀</span></div>
    </>
  );
}

type TimelineCrop = "paddy" | "ragi" | "maize" | "tomato" | "cotton" | "groundnut";
type DayWindow = { start: number; end: number };
type CropTimelineSchedule = {
  germination: DayWindow;
  topDress: DayWindow;
  flowering: DayWindow;
  harvest: DayWindow;
};
type TimelineStageId = "basal" | "topDress" | "flowering" | "harvest";

const cropTimelineSchedules: Record<TimelineCrop, CropTimelineSchedule> = {
  paddy: { germination: { start: 0, end: 7 }, topDress: { start: 20, end: 30 }, flowering: { start: 55, end: 70 }, harvest: { start: 120, end: 150 } },
  ragi: { germination: { start: 0, end: 7 }, topDress: { start: 20, end: 30 }, flowering: { start: 45, end: 60 }, harvest: { start: 100, end: 120 } },
  maize: { germination: { start: 0, end: 7 }, topDress: { start: 20, end: 30 }, flowering: { start: 45, end: 60 }, harvest: { start: 90, end: 110 } },
  tomato: { germination: { start: 0, end: 10 }, topDress: { start: 35, end: 50 }, flowering: { start: 55, end: 75 }, harvest: { start: 100, end: 130 } },
  cotton: { germination: { start: 0, end: 10 }, topDress: { start: 30, end: 45 }, flowering: { start: 60, end: 90 }, harvest: { start: 150, end: 180 } },
  groundnut: { germination: { start: 0, end: 10 }, topDress: { start: 20, end: 30 }, flowering: { start: 25, end: 45 }, harvest: { start: 100, end: 120 } },
};

const cropTimelineCopy: LocalizedCopy<{
  title: string;
  description: string;
  crop: string;
  sowingDate: string;
  chooseCrop: string;
  daysAfterSowing: string;
  stageTitles: Record<TimelineStageId, string>;
  stageDescriptions: Record<TimelineStageId, string>;
  datePrompt: string;
  scheduleNote: string;
  tomatoNote: string;
  cottonNote: string;
  shareTitle: string;
}> = {
  en: {
    title: "Interactive Crop Milestone & Harvest Timeline",
    description: "See estimated calendar dates for key crop milestones, calculated from your sowing date.",
    crop: "Crop",
    sowingDate: "Sowing date",
    chooseCrop: "Choose a crop",
    daysAfterSowing: "days after sowing",
    stageTitles: {
      basal: "Basal Fertilizer & Germination",
      topDress: "First Top-Dressing & Weeding",
      flowering: "Flowering & Critical Irrigation Stage",
      harvest: "Expected Harvest Window",
    },
    stageDescriptions: {
      basal: "Basal application is generally planned at sowing; germination timing is an estimate.",
      topDress: "A planning checkpoint only. Confirm fertilizer and weed-control timing for your crop and field.",
      flowering: "Monitor crop stage and soil moisture. Irrigation needs depend on rainfall, soil and field conditions.",
      harvest: "An indicative maturity window, not a prediction. Check crop maturity and local guidance before harvest.",
    },
    datePrompt: "Choose a crop and sowing date to calculate milestone dates.",
    scheduleNote: "Calendar dates are calculated from illustrative day-after-sowing windows, not a local prescription. Variety, season, establishment method, weather and field conditions can shift timing. Confirm fertilizer, irrigation and harvest decisions with your local KVK or agriculture officer.",
    tomatoNote: "For tomato, the estimate starts at the entered sowing date; nursery duration and transplanting date can shift field-stage milestones.",
    cottonNote: "Cotton is usually picked in multiple rounds; this range is an indicative start-of-harvest window.",
    shareTitle: "KrishiMitra crop milestone timeline",
  },
  kn: {
    title: "ಬೆಳೆ ಮೈಲಿಗಲ್ಲು ಮತ್ತು ಕೊಯ್ಲು ಸಮಯರೇಖೆ",
    description: "ನೀವು ನೀಡಿದ ಬಿತ್ತನೆ ದಿನಾಂಕದಿಂದ ಪ್ರಮುಖ ಹಂತಗಳ ಅಂದಾಜು ಕ್ಯಾಲೆಂಡರ್ ದಿನಾಂಕಗಳನ್ನು ನೋಡಿ.",
    crop: "ಬೆಳೆ",
    sowingDate: "ಬಿತ್ತನೆ ದಿನಾಂಕ",
    chooseCrop: "ಬೆಳೆ ಆಯ್ಕೆಮಾಡಿ",
    daysAfterSowing: "ಬಿತ್ತನೆಯ ನಂತರದ ದಿನಗಳು",
    stageTitles: {
      basal: "ಮೂಲ ಗೊಬ್ಬರ ಮತ್ತು ಮೊಳಕೆ",
      topDress: "ಮೊದಲ ಮೇಲ್ಗೊಬ್ಬರ ಮತ್ತು ಕಳೆ ತೆಗೆಯುವಿಕೆ",
      flowering: "ಹೂಬಿಡುವಿಕೆ ಮತ್ತು ನಿರ್ಣಾಯಕ ನೀರಾವರಿ ಹಂತ",
      harvest: "ನಿರೀಕ್ಷಿತ ಕೊಯ್ಲು ಅವಧಿ",
    },
    stageDescriptions: {
      basal: "ಮೂಲ ಗೊಬ್ಬರವನ್ನು ಸಾಮಾನ್ಯವಾಗಿ ಬಿತ್ತನೆ ಸಮಯದಲ್ಲಿ ಹಾಕಲಾಗುತ್ತದೆ; ಮೊಳಕೆಯ ಸಮಯ ಅಂದಾಜು.",
      topDress: "ಇದು ಯೋಜನಾ ನೆನಪು ಮಾತ್ರ. ನಿಮ್ಮ ಬೆಳೆ ಮತ್ತು ಹೊಲಕ್ಕೆ ಗೊಬ್ಬರ ಹಾಗೂ ಕಳೆ ನಿಯಂತ್ರಣ ಸಮಯ ದೃಢಪಡಿಸಿ.",
      flowering: "ಬೆಳೆ ಹಂತ ಮತ್ತು ಮಣ್ಣಿನ ತೇವಾಂಶ ಗಮನಿಸಿ. ನೀರಾವರಿ ಮಳೆ, ಮಣ್ಣು ಮತ್ತು ಹೊಲದ ಸ್ಥಿತಿಯನ್ನು ಅವಲಂಬಿಸುತ್ತದೆ.",
      harvest: "ಇದು ಸೂಚಕ ಪಕ್ವತಾ ಅವಧಿ ಮಾತ್ರ, ಮುನ್ಸೂಚನೆಯಲ್ಲ. ಕೊಯ್ಲಿಗೂ ಮೊದಲು ಪಕ್ವತೆ ಮತ್ತು ಸ್ಥಳೀಯ ಸಲಹೆ ಪರಿಶೀಲಿಸಿ.",
    },
    datePrompt: "ದಿನಾಂಕಗಳನ್ನು ಲೆಕ್ಕಿಸಲು ಬೆಳೆ ಮತ್ತು ಬಿತ್ತನೆ ದಿನಾಂಕ ಆಯ್ಕೆಮಾಡಿ.",
    scheduleNote: "ಕ್ಯಾಲೆಂಡರ್ ದಿನಾಂಕಗಳು ಉದಾಹರಣಾತ್ಮಕ ಬಿತ್ತನೆಯ ನಂತರದ ದಿನಗಳ ಅವಧಿಯಿಂದ ಲೆಕ್ಕಿಸಿದವು; ಸ್ಥಳೀಯ ಶಿಫಾರಸುಗಳಲ್ಲ. ತಳಿ, ಹಂಗಾಮು, ನೆಡುವ ವಿಧಾನ, ಹವಾಮಾನ ಮತ್ತು ಹೊಲದ ಸ್ಥಿತಿಯಿಂದ ಸಮಯ ಬದಲಾಗಬಹುದು. ಗೊಬ್ಬರ, ನೀರಾವರಿ ಮತ್ತು ಕೊಯ್ಲಿನ ನಿರ್ಧಾರಕ್ಕೆ ಸ್ಥಳೀಯ ಕೃಷಿ ವಿಜ್ಞಾನ ಕೇಂದ್ರ ಅಥವಾ ಕೃಷಿ ಅಧಿಕಾರಿಯನ್ನು ಸಂಪರ್ಕಿಸಿ.",
    tomatoNote: "ಟೊಮೇಟೊ ಅಂದಾಜು ನಮೂದಿಸಿದ ಬಿತ್ತನೆ ದಿನದಿಂದ ಪ್ರಾರಂಭವಾಗುತ್ತದೆ; ನರ್ಸರಿ ಅವಧಿ ಮತ್ತು ನಾಟಿ ದಿನಾಂಕದಿಂದ ಹೊಲದ ಹಂತಗಳು ಬದಲಾಗಬಹುದು.",
    cottonNote: "ಹತ್ತಿಯನ್ನು ಸಾಮಾನ್ಯವಾಗಿ ಹಲವು ಬಾರಿ ಆರಿಸಲಾಗುತ್ತದೆ; ಈ ಅವಧಿ ಮೊದಲ ಕೊಯ್ಲಿನ ಸೂಚಕ ಆರಂಭ ಮಾತ್ರ.",
    shareTitle: "ಕೃಷಿಮಿತ್ರ ಬೆಳೆ ಹಂತಗಳ ಸಮಯರೇಖೆ",
  },
  hi: {
    title: "फसल चरण और कटाई समयरेखा",
    description: "आपकी बुवाई की तारीख से प्रमुख चरणों की अनुमानित कैलेंडर तिथियाँ देखें।",
    crop: "फसल",
    sowingDate: "बुवाई की तारीख",
    chooseCrop: "फसल चुनें",
    daysAfterSowing: "बुवाई के बाद दिन",
    stageTitles: {
      basal: "आधार खाद और अंकुरण",
      topDress: "पहली टॉप-ड्रेसिंग और निराई",
      flowering: "फूल आना और महत्वपूर्ण सिंचाई चरण",
      harvest: "अनुमानित कटाई अवधि",
    },
    stageDescriptions: {
      basal: "आधार खाद सामान्यतः बुवाई के समय दी जाती है; अंकुरण का समय अनुमान है।",
      topDress: "यह केवल योजना हेतु संकेत है। अपनी फसल और खेत के लिए खाद व निराई का समय स्थानीय रूप से जाँचें।",
      flowering: "फसल की अवस्था और मिट्टी की नमी देखें। सिंचाई की जरूरत बारिश, मिट्टी और खेत की स्थिति पर निर्भर करती है।",
      harvest: "यह केवल अनुमानित परिपक्वता अवधि है, भविष्यवाणी नहीं। कटाई से पहले फसल की परिपक्वता और स्थानीय सलाह देखें।",
    },
    datePrompt: "तिथियाँ निकालने के लिए फसल और बुवाई की तारीख चुनें।",
    scheduleNote: "कैलेंडर तिथियाँ उदाहरणात्मक बुवाई-पश्चात दिनों की अवधि से निकाली गई हैं, स्थानीय निर्देश नहीं हैं। किस्म, मौसम, स्थापना विधि, वर्षा और खेत की स्थिति से समय बदल सकता है। खाद, सिंचाई और कटाई के निर्णय स्थानीय KVK या कृषि अधिकारी से पुष्टि करें।",
    tomatoNote: "टमाटर का अनुमान दर्ज बुवाई तिथि से शुरू होता है; नर्सरी अवधि और रोपाई की तारीख खेत के चरणों को बदल सकती है।",
    cottonNote: "कपास की तुड़ाई आमतौर पर कई बार होती है; यह अवधि पहली तुड़ाई की अनुमानित शुरुआत है।",
    shareTitle: "कृषिमित्र फसल चरण समयरेखा",
  },
};

function parseLocalDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null;
}

function addCalendarDays(date: Date, days: number) {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  result.setDate(result.getDate() + days);
  return result;
}

function CropMilestoneTimeline({ t, language }: PageProps & { language: Language }) {
  const copy = cropTimelineCopy[language] ?? cropTimelineCopy.en;
  const [crop, setCrop] = useState<TimelineCrop | "">("");
  const [sowingDate, setSowingDate] = useState("");
  const crops: { id: TimelineCrop; label: string }[] = [
    { id: "paddy", label: t("cropRice") },
    { id: "ragi", label: t("cropRagi") },
    { id: "maize", label: t("cropMaize") },
    { id: "tomato", label: language === "kn" ? "ಟೊಮೇಟೊ" : language === "hi" ? "टमाटर" : "Tomato" },
    { id: "cotton", label: language === "kn" ? "ಹತ್ತಿ" : language === "hi" ? "कपास" : "Cotton" },
    { id: "groundnut", label: language === "kn" ? "ಶೇಂಗಾ" : language === "hi" ? "मूँगफली" : "Groundnut" },
  ];
  const baseDate = parseLocalDate(sowingDate);
  const schedule = crop ? cropTimelineSchedules[crop] : null;
  const stages = schedule && baseDate ? ([
    { id: "basal", window: { start: 0, end: schedule.germination.end } },
    { id: "topDress", window: schedule.topDress },
    { id: "flowering", window: schedule.flowering },
    { id: "harvest", window: schedule.harvest },
  ] satisfies { id: TimelineStageId; window: DayWindow }[]).map((stage) => ({
    ...stage,
    startDate: addCalendarDays(baseDate, stage.window.start),
    endDate: addCalendarDays(baseDate, stage.window.end),
  })) : [];
  const formatDate = (date: Date) => new Intl.DateTimeFormat(localeForLanguage(language), {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
  const selectedCropName = crops.find((item) => item.id === crop)?.label ?? "";
  const shareSummary = stages.length === 4
    ? [
      copy.shareTitle,
      `${copy.crop}: ${selectedCropName}`,
      `${copy.sowingDate}: ${baseDate ? formatDate(baseDate) : ""}`,
      ...stages.map((stage, index) => `${index + 1}. ${copy.stageTitles[stage.id]}: ${formatDate(stage.startDate)} – ${formatDate(stage.endDate)} (${stage.window.start}–${stage.window.end} ${copy.daysAfterSowing})`),
      copy.scheduleNote,
      ...(crop === "tomato" ? [copy.tomatoNote] : []),
      ...(crop === "cotton" ? [copy.cottonNote] : []),
    ].join("\n")
    : "";
  const speechSummary = stages.length === 4
    ? `${selectedCropName}. ${copy.sowingDate}: ${baseDate ? formatDate(baseDate) : ""}. ${stages.map((stage, index) => `${index + 1}. ${copy.stageTitles[stage.id]}, ${formatDate(stage.startDate)} to ${formatDate(stage.endDate)}.`).join(" ")} ${copy.scheduleNote}`
    : "";

  return <section className="panel crop-milestone-widget">
    <div className="crop-milestone-heading">
      <div><div className="eyebrow">{language === "kn" ? "ಬೆಳೆ ಯೋಜನೆ" : language === "hi" ? "फसल योजना" : "CROP PLANNING"}</div><h2>{copy.title}</h2><p>{copy.description}</p></div>
      <span className="profit-result-icon" aria-hidden="true">◷</span>
    </div>
    <div className="crop-milestone-inputs">
      <label htmlFor="milestone-crop">{copy.crop}<select id="milestone-crop" value={crop} onChange={(event) => {
        const value = event.target.value;
        if (value === "paddy" || value === "ragi" || value === "maize" || value === "tomato" || value === "cotton" || value === "groundnut") setCrop(value);
        else setCrop("");
      }}>
        <option value="">{copy.chooseCrop}</option>
        {crops.map((item) => <option value={item.id} key={item.id}>{item.label}</option>)}
      </select></label>
      <label htmlFor="milestone-sowing-date">{copy.sowingDate}<input id="milestone-sowing-date" type="date" value={sowingDate} onChange={(event) => setSowingDate(event.target.value)} /></label>
    </div>
    {stages.length === 4 ? <ol className="crop-milestone-timeline">
      {stages.map((stage, index) => <li key={stage.id}>
        <span className="crop-milestone-marker">{index + 1}</span>
        <article className="crop-milestone-card">
          <div className="eyebrow">{language === "kn" ? `ಹಂತ ${index + 1}` : language === "hi" ? `चरण ${index + 1}` : `STAGE ${index + 1}`}</div>
          <h3>{copy.stageTitles[stage.id]}</h3>
          <strong className="crop-milestone-dates">{formatDate(stage.startDate)} – {formatDate(stage.endDate)}</strong>
          <span className="crop-milestone-days">{stage.window.start}–{stage.window.end} {copy.daysAfterSowing}</span>
          <p>{copy.stageDescriptions[stage.id]}</p>
        </article>
      </li>)}
    </ol> : <p className="crop-milestone-prompt">{copy.datePrompt}</p>}
    {crop === "tomato" && <p className="crop-milestone-special-note">{copy.tomatoNote}</p>}
    {crop === "cotton" && <p className="crop-milestone-special-note">{copy.cottonNote}</p>}
    <div className="crop-milestone-footer">
      <p className="crop-milestone-disclaimer">{copy.scheduleNote}</p>
      {stages.length === 4 && <div className="crop-milestone-actions">
        <SpeakButton textToSpeak={speechSummary} language={language} t={t} />
        <button type="button" className="button button-outline whatsapp-share" onClick={() => shareOnWhatsApp(shareSummary)}><span aria-hidden="true">◉</span>{t("shareWhatsapp")}</button>
      </div>}
    </div>
  </section>;
}

function languageOf(t: Translate): Language {
  const dashboardLabel = t("dashboard");
  return (Object.keys(languageText) as Language[]).find((language) =>
    languageText[language].dashboard === dashboardLabel,
  ) ?? "en";
}

function localeForLanguage(language: Language) {
  const locales: Record<Language, string> = {
    en: "en-IN",
    kn: "kn-IN",
    hi: "hi-IN",
    te: "te-IN",
    ta: "ta-IN",
    mr: "mr-IN",
  };
  return locales[language];
}

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
  const value = new Intl.NumberFormat(localeForLanguage(language), { maximumFractionDigits: 1 }).format(alert.value);
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

function SevenDayWeatherChart({ days, locale, t }: {
  days: WeatherForecast["daily"];
  locale: string;
  t: Translate;
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const width = 760;
  const left = 58;
  const right = 702;
  const top = 28;
  const temperatureBottom = 154;
  const rainTop = 174;
  const rainBottom = 211;
  const dateY = 245;
  const temperatureValues = days.flatMap((day) =>
    [day.temperatureMax, day.temperatureMin].filter((value): value is number => value !== null),
  );
  const minimum = temperatureValues.length ? Math.min(...temperatureValues) : 0;
  const maximum = temperatureValues.length ? Math.max(...temperatureValues) : 4;
  const temperatureMin = Math.floor((minimum - 2) / 2) * 2;
  const temperatureMax = Math.max(temperatureMin + 4, Math.ceil((maximum + 2) / 2) * 2);
  const xFor = (index: number) => days.length < 2
    ? (left + right) / 2
    : left + index * (right - left) / (days.length - 1);
  const yForTemperature = (value: number) =>
    top + (temperatureMax - value) / (temperatureMax - temperatureMin) * (temperatureBottom - top);
  const formatValue = (value: number | null, maximumFractionDigits = 0) =>
    value === null ? "—" : new Intl.NumberFormat(locale, { maximumFractionDigits }).format(value);
  const dateLabels = days.map((day) =>
    new Date(`${day.date}T12:00:00`).toLocaleDateString(locale, { weekday: "short", day: "numeric" }),
  );

  function makeLinePath(getValue: (index: number) => number | null) {
    const segments: { x: number; y: number }[][] = [];
    let segment: { x: number; y: number }[] = [];
    days.forEach((_, index) => {
      const value = getValue(index);
      if (value === null) {
        if (segment.length) segments.push(segment);
        segment = [];
      } else {
        segment.push({ x: xFor(index), y: yForTemperature(value) });
      }
    });
    if (segment.length) segments.push(segment);
    return segments.map((points) => points.map((point, index) =>
      `${index === 0 ? "M" : "L"}${point.x},${point.y}`,
    ).join(" ")).join(" ");
  }

  const pairedSegments: { x: number; highY: number; lowY: number }[][] = [];
  let pairedSegment: { x: number; highY: number; lowY: number }[] = [];
  days.forEach((day, index) => {
    if (day.temperatureMax === null || day.temperatureMin === null) {
      if (pairedSegment.length) pairedSegments.push(pairedSegment);
      pairedSegment = [];
    } else {
      pairedSegment.push({
        x: xFor(index),
        highY: yForTemperature(day.temperatureMax),
        lowY: yForTemperature(day.temperatureMin),
      });
    }
  });
  if (pairedSegment.length) pairedSegments.push(pairedSegment);

  const areaPath = pairedSegments.map((points) => {
    const highPath = points.map((point, index) =>
      `${index === 0 ? "M" : "L"}${point.x},${point.highY}`,
    ).join(" ");
    const lowPath = [...points].reverse().map((point) => `L${point.x},${point.lowY}`).join(" ");
    return `${highPath} ${lowPath} Z`;
  }).join(" ");
  const highPath = makeLinePath((index) => days[index]?.temperatureMax ?? null);
  const lowPath = makeLinePath((index) => days[index]?.temperatureMin ?? null);
  const activeDay = activeIndex === null ? null : days[activeIndex] ?? null;
  const activeX = activeIndex === null ? null : xFor(activeIndex);
  const tooltipLeft = activeX === null ? null : Math.max(12, Math.min(88, activeX / width * 100));

  return <div className="seven-day-chart">
    <div className="seven-day-chart-legend" aria-hidden="true">
      <span><i className="chart-legend-high" />{t("high")} (°C)</span>
      <span><i className="chart-legend-low" />{t("low")} (°C)</span>
      <span><i className="chart-legend-rain" />{t("rainChance")} (%)</span>
    </div>
    <div className="seven-day-chart-plot">
    <svg viewBox={`0 0 ${width} 265`} role="group" aria-label={`${t("high")} and ${t("low")} temperatures in °C, with ${t("rainChance")}`}>
      <defs>
        <linearGradient id="weather-temperature-band" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#88aa7b" stopOpacity=".33" />
          <stop offset="100%" stopColor="#dfead8" stopOpacity=".42" />
        </linearGradient>
      </defs>
      {[0, 1, 2, 3].map((step) => {
        const value = temperatureMax - step * (temperatureMax - temperatureMin) / 3;
        const y = top + step * (temperatureBottom - top) / 3;
        return <g key={`temp-grid-${step}`}>
          <line className="weather-chart-grid" x1={left} x2={right} y1={y} y2={y} />
          <text className="weather-chart-axis-label" x={left - 10} y={y + 3} textAnchor="end">{formatValue(value)}°</text>
        </g>;
      })}
      {[0, 50, 100].map((chance) => {
        const y = rainBottom - chance / 100 * (rainBottom - rainTop);
        return <g key={`rain-grid-${chance}`}>
          <line className="weather-chart-rain-grid" x1={left} x2={right} y1={y} y2={y} />
          <text className="weather-chart-axis-label" x={right + 10} y={y + 3}>{chance}%</text>
        </g>;
      })}
      <path d={areaPath} fill="url(#weather-temperature-band)" />
      {days.map((day, index) => {
        const x = xFor(index);
        const probability = day.precipitationProbability;
        const barHeight = probability === null ? 0 : probability / 100 * (rainBottom - rainTop);
        return probability === null ? null : <rect
          key={`rain-bar-${day.date}`}
          className="weather-chart-rain-bar"
          x={x - 14}
          y={rainBottom - barHeight}
          width="28"
          height={barHeight}
          rx="4"
        />;
      })}
      <path className="weather-chart-high-line" d={highPath} />
      <path className="weather-chart-low-line" d={lowPath} />
      {days.map((day, index) => {
        const x = xFor(index);
        const highY = day.temperatureMax === null ? null : yForTemperature(day.temperatureMax);
        const lowY = day.temperatureMin === null ? null : yForTemperature(day.temperatureMin);
        const dateLabel = dateLabels[index] ?? day.date;
        const accessibleLabel = `${dateLabel}: ${t("high")} ${formatValue(day.temperatureMax, 1)}°C, ${t("low")} ${formatValue(day.temperatureMin, 1)}°C, ${t("rainChance")} ${formatValue(day.precipitationProbability)}%`;
        return <g key={`weather-point-${day.date}`}>
          {highY !== null && <circle className="weather-chart-high-point" cx={x} cy={highY} r="4" />}
          {lowY !== null && <circle className="weather-chart-low-point" cx={x} cy={lowY} r="4" />}
          <text className="weather-chart-date" x={x} y={dateY} textAnchor="middle">{dateLabel}</text>
          <rect
            className="weather-chart-hit-area"
            x={x - (right - left) / Math.max(days.length - 1, 1) / 2}
            y={top - 12}
            width={(right - left) / Math.max(days.length - 1, 1)}
            height={dateY - top + 18}
            role="button"
            tabIndex={0}
            aria-label={accessibleLabel}
            onPointerEnter={() => setActiveIndex(index)}
            onPointerLeave={() => setActiveIndex(null)}
            onFocus={() => setActiveIndex(index)}
            onBlur={() => setActiveIndex(null)}
          />
        </g>;
      })}
    </svg>
    {activeDay && activeIndex !== null && tooltipLeft !== null && <div
      className="weather-chart-tooltip"
      style={{ left: `${tooltipLeft}%` }}
      role="status"
      aria-live="polite"
    >
      <strong>{dateLabels[activeIndex] ?? activeDay.date}</strong>
      <span>{t("high")}: {formatValue(activeDay.temperatureMax, 1)}°C</span>
      <span>{t("low")}: {formatValue(activeDay.temperatureMin, 1)}°C</span>
      <span>{t("rainChance")}: {formatValue(activeDay.precipitationProbability)}%</span>
    </div>}
    </div>
  </div>;
}

function Weather({ t, language, location, forecast, loading, error, updatedAt, isCached, onSelectLocation, onClearLocation, onRefresh }: PageProps & {
  language: Language;
  location: WeatherLocation | null;
  forecast: WeatherForecast | null;
  loading: boolean;
  error: string;
  updatedAt: Date | null;
  isCached: boolean;
  onSelectLocation: (location: WeatherLocation) => void;
  onClearLocation: () => void;
  onRefresh: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<WeatherLocation[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [searched, setSearched] = useState(false);
  const searchController = useRef<AbortController | null>(null);
  const searchDebounce = useRef<number | null>(null);

  useEffect(() => {
    const trimmedQuery = query.trim();
    if (trimmedQuery.length < 2) {
      searchController.current?.abort();
      setResults([]);
      setSearchError("");
      setSearching(false);
      setSearched(false);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      searchDebounce.current = null;
      searchController.current?.abort();
      searchController.current = controller;
      setSearching(true);
      setSearchError("");
      setSearched(false);
      void searchWeatherLocations(trimmedQuery, controller.signal)
        .then((locations) => {
          if (controller.signal.aborted) return;
          setResults(locations);
          setSearched(true);
        })
        .catch((caught: unknown) => {
          if (controller.signal.aborted) return;
          console.error("Could not search Open-Meteo locations.", caught);
          setSearchError(caught instanceof WeatherServiceError ? caught.message : "invalid-response");
          setResults([]);
          setSearched(true);
        })
        .finally(() => {
          if (!controller.signal.aborted) setSearching(false);
        });
    }, 300);
    searchDebounce.current = timeout;

    return () => {
      window.clearTimeout(timeout);
      if (searchDebounce.current === timeout) searchDebounce.current = null;
      controller.abort();
    };
  }, [query]);

  async function searchLocations(event: FormEvent) {
    event.preventDefault();
    const trimmedQuery = query.trim();
    if (trimmedQuery.length < 2) return;
    if (searchDebounce.current !== null) {
      window.clearTimeout(searchDebounce.current);
      searchDebounce.current = null;
    }
    searchController.current?.abort();
    const controller = new AbortController();
    searchController.current = controller;
    setSearching(true);
    setSearchError("");
    setSearched(false);
    try {
      const locations = await searchWeatherLocations(trimmedQuery, controller.signal);
      if (controller.signal.aborted) return;
      setResults(locations);
      setSearched(true);
    } catch (caught) {
      if (controller.signal.aborted) return;
      console.error("Could not search Open-Meteo locations.", caught);
      setSearchError(caught instanceof WeatherServiceError ? caught.message : "invalid-response");
      setResults([]);
    } finally {
      if (!controller.signal.aborted) setSearching(false);
    }
  }

  function chooseLocation(result: WeatherLocation) {
    if (searchDebounce.current !== null) {
      window.clearTimeout(searchDebounce.current);
      searchDebounce.current = null;
    }
    searchController.current?.abort();
    setQuery("");
    setResults([]);
    setSearchError("");
    setSearched(false);
    onSelectLocation(result);
  }

  const advisories = forecast ? weatherAdvisories(forecast, t) : [];
  const locale = localeForLanguage(language);
  const updatedLabel = updatedAt ? updatedAt.toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" }) : "";

  return <>
    <PageHeading eyebrow={t("currentConditions")} title={t("weatherTitle")} description={t("weatherSub")} t={t} badge={t("weatherSource")} badgeKind="source" />
    <section className="weather-location-panel panel">
      <form className="weather-search" onSubmit={(event) => void searchLocations(event)}>
        <label htmlFor="weather-location-search">{t("searchLocation")}</label>
        <div className="weather-search-row">
          <span aria-hidden="true">⌕</span>
          <input
            id="weather-location-search"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={results.length > 0}
            aria-controls="weather-location-suggestions"
            value={query}
            onChange={(event) => {
              searchController.current?.abort();
              setResults([]);
              setSearchError("");
              setSearched(false);
              setQuery(event.target.value);
            }}
            placeholder={t("searchPlaceholder")}
            minLength={2}
            required
          />
          <button type="submit" className="button button-primary" disabled={searching || query.trim().length < 2}>
            {searching ? <><span className="spinner light" />{t("searching")}</> : t("search")}
          </button>
          {results.length > 0 && <div className="location-results weather-location-suggestions" id="weather-location-suggestions" role="listbox" aria-label={t("selectLocation")}>
            <strong>{t("selectLocation")}</strong>
            {results.map((result) =>
              <button type="button" className="location-result" role="option" aria-selected={false} key={result.id} onClick={() => chooseLocation(result)}>
                <span className="result-pin" aria-hidden="true">⌖</span><span>{locationLabel(result)}</span><b aria-hidden="true">→</b>
              </button>)}
          </div>}
        </div>
      </form>
      <p className="weather-search-help">ⓘ &nbsp;{t("weatherSearchHelp")}</p>
      {searching && <div className="weather-status" role="status"><span className="spinner" />{t("searching")}</div>}
      {searchError && <div className="weather-alert" role="alert">{weatherErrorMessage(searchError, t)}</div>}
      {searched && !searchError && results.length === 0 && <div className="weather-empty-results">{t("noLocationResults")}</div>}
      {location && <div className="selected-location"><span className="location-pin">⌖</span><div><small>{t("selectedLocation")}</small><strong>{locationLabel(location)}</strong></div><button type="button" onClick={onClearLocation}>{t("clearLocation")}</button></div>}
    </section>

    {error && <div className="weather-alert weather-fetch-alert" role="alert"><strong>{t("weatherError")}</strong><span>{weatherErrorMessage(error, t)}</span></div>}
    {!location && <div className="weather-empty panel"><span>⌖</span><h2>{t("chooseWeatherLocation")}</h2><p>{t("weatherSearchHelp")}</p></div>}
    {location && loading && !forecast && <div className="weather-loading panel" role="status"><span className="spinner" /><strong>{t("loadingWeather")}</strong></div>}
    {location && !forecast && !loading && !error && <div className="weather-empty panel"><span>☁</span><h2>{t("noWeatherData")}</h2><button className="button button-outline" onClick={onRefresh}>{t("refreshWeather")}</button></div>}
    {forecast && location && <>
      <section className="weather-live-hero">
        <div className="weather-live-main">
          <div className="weather-live-location"><span>⌖</span>{location.name}, {location.admin1 ?? location.country}<span className={isCached ? "offline-tag" : "live-tag"}><i />{isCached ? t("cachedData") : t("live")}</span></div>
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
        <div className="panel-heading"><div><div className="eyebrow">{location.name}</div><h2>{t("forecastTitle")}</h2></div><span className={isCached ? "offline-tag" : "live-tag"}><i />{isCached ? t("cachedData") : t("live")}</span></div>
        <SevenDayWeatherChart days={forecast.daily} locale={locale} t={t} />
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
        <div className="advisory-heading"><span>✿</span><div><div className="eyebrow">{t("weatherSource")}</div><h2>{t("farmingAdvisory")}</h2></div>
          <SpeakButton textToSpeak={advisories.length ? advisories.join(". ") : t("noAdvisories")} language={language} t={t} />
        </div>
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
  return date.toLocaleDateString(localeForLanguage(language), {
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

type DashboardMarketSnapshot = {
  commodity: string;
  cropLabel: keyof typeof text.en | null;
  modalPrice: number;
  percentageChange: number | null;
  market: string;
};

const dashboardMarketCropLabels: Record<string, keyof typeof text.en> = {
  Paddy: "cropRice",
  Ragi: "cropRagi",
  Maize: "cropMaize",
  Tomato: "cropDoctorTomato",
  Chilli: "cropDoctorChilli",
};

const dashboardMarketRecords = createSampleMandiRecords().filter(
  (record) => record.state === "Karnataka" && record.district === "Mysuru",
);

const dashboardMarketSnapshots: DashboardMarketSnapshot[] = uniqueSorted(
  dashboardMarketRecords.map((record) => record.commodity),
).flatMap((commodity) => {
  const analysis = analyzeFarmPrices(dailyModalPrices(dashboardMarketRecords, commodity));
  if (!analysis.current) return [];
  const latestMarket = dashboardMarketRecords.find((record) =>
    record.commodity === commodity &&
    record.arrivalDate === analysis.current?.date &&
    record.modalPrice !== null,
  );
  if (!latestMarket || latestMarket.modalPrice === null) return [];
  return [{
    commodity,
    cropLabel: dashboardMarketCropLabels[commodity] ?? null,
    modalPrice: latestMarket.modalPrice,
    percentageChange: analysis.percentageChange,
    market: latestMarket.market,
  }];
});

type AdvisoryResponseContext = {
  language: Language;
  profile: FarmerProfile | null;
  weatherLocation: WeatherLocation | null;
  weatherForecast: WeatherForecast | null;
  profitInputs: ProfitInputs;
  mandiSnapshot: MandiSnapshot | null;
};

const advisoryKeywords: Record<AdvisoryIntent, readonly string[]> = {
  soil: ["soil", "pH", "fertilizer", "fertiliser", "nutrient", "मिट्टी", "मृदा", "खाद", "उर्वरक", "ಮಣ್ಣು", "ಮಣ್ಣಿನ", "ಗೊಬ್ಬರ", "ಪೋಷಕಾಂಶ"],
  bioInput: ["bio-input", "bio input", "jeevamrutha", "jeevamrut", "organic", "compost", "जीवामृत", "जैविक", "कम्पोस्ट", "ಜೀವಾಮೃತ", "ಜೈವಿಕ", "ಸಾವಯವ", "ಕಾಂಪೋಸ್ಟ್"],
  weather: ["weather", "rain", "rainfall", "heat", "hot", "temperature", "forecast", "मौसम", "बारिश", "गर्मी", "तापमान", "ಹವಾಮಾನ", "ಮಳೆ", "ಬಿಸಿಲು", "ತಾಪಮಾನ"],
  irrigation: ["irrigation", "irrigate", "water", "सिंचाई", "पानी", "ನೀರಾವರಿ", "ನೀರು"],
  mandi: ["mandi", "price", "prices", "rate", "rates", "sell", "selling", "market", "मंडी", "भाव", "कीमत", "बेच", "ಮಾರುಕಟ್ಟೆ", "ಬೆಲೆ", "ಮಾರಾಟ"],
  pest: ["pest", "pests", "disease", "diseases", "yellow leaves", "yellowing", "spot", "spots", "crop doctor", "insect", "symptom", "कीट", "रोग", "पीली", "धब्बे", "बीमारी", "ಕೀಟ", "ರೋಗ", "ಹಳದಿ", "ಚುಕ್ಕೆ", "ಬೆಳೆ ವೈದ್ಯ"],
  schemes: ["scheme", "schemes", "subsidy", "subsidies", "pm-kisan", "pm kisan", "loan", "kcc", "योजना", "सब्सिडी", "कर्ज", "ऋण", "ಸಹಾಯಧನ", "ಯೋಜನೆ", "ಸಾಲ"],
  rotation: ["rotation", "next crop", "sowing", "sow", "planting", "next season", "फसल चक्र", "अगली फसल", "बुवाई", "अगला मौसम", "ಬೆಳೆ ಪರಿವರ್ತನೆ", "ಮುಂದಿನ ಬೆಳೆ", "ಬಿತ್ತನೆ"],
  profit: ["profit", "cost", "costs", "expense", "expenses", "khata", "revenue", "income", "लाभ", "खर्च", "लागत", "खाता", "आय", "ಲಾಭ", "ವೆಚ್ಚ", "ಖರ್ಚು", "ಖಾತೆ", "ಆದಾಯ"],
};

const advisoryIntents = Object.keys(advisoryKeywords) as AdvisoryIntent[];

function matchesAdvisoryKeyword(message: string, keyword: string) {
  const normalizedMessage = message.normalize("NFKC").toLocaleLowerCase();
  const normalizedKeyword = keyword.normalize("NFKC").toLocaleLowerCase();
  if (/^[a-z0-9][a-z0-9 -]*$/i.test(normalizedKeyword)) {
    const escapedKeyword = normalizedKeyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(^|[^a-z0-9])${escapedKeyword}($|[^a-z0-9])`, "i").test(normalizedMessage);
  }
  return normalizedMessage.includes(normalizedKeyword);
}

function selectedCropLabel(crop: string, t: Translate) {
  const cropKeys: Record<string, keyof typeof text.en> = {
    cropRice: "cropRice",
    cropRagi: "cropRagi",
    cropMaize: "cropMaize",
    cropPulses: "cropPulses",
  };
  const key = cropKeys[crop];
  return key ? t(key) : "";
}

function selectedSoilLabel(soil: string, t: Translate) {
  const soilKeys: Record<string, keyof typeof text.en> = {
    "red soil": "typeRed",
    "black soil": "typeBlack",
    "sandy soil": "typeSandy",
    "loamy soil": "typeLoamy",
  };
  const key = soilKeys[soil.trim().toLocaleLowerCase()];
  return key ? t(key) : soil.trim();
}

function advisoryWeatherSummary(context: AdvisoryResponseContext, copy: AdvisoryLanguageCopy) {
  if (!context.weatherLocation) return copy.context.noLocation;
  const location = locationLabel(context.weatherLocation);
  const forecast = context.weatherForecast;
  if (!forecast) return fillTemplate(copy.context.noForecast, { location });

  const currentTemperature = forecast.current.temperature === null
    ? copy.context.unavailable
    : `${forecast.current.temperature}°C`;
  const humidity = forecast.current.relativeHumidity === null
    ? copy.context.unavailable
    : `${forecast.current.relativeHumidity}%`;
  const nextDay = forecast.daily[0];
  const date = nextDay
    ? formatMandiDate(nextDay.date, context.language)
    : copy.context.unavailable;
  const rain = nextDay?.precipitation === null || nextDay?.precipitation === undefined
    ? copy.context.unavailable
    : `${nextDay.precipitation} mm`;
  const chance = nextDay?.precipitationProbability === null || nextDay?.precipitationProbability === undefined
    ? copy.context.unavailable
    : `${nextDay.precipitationProbability}%`;
  return fillTemplate(copy.context.weather, {
    location,
    temperature: currentTemperature,
    humidity,
    date,
    rain,
    chance,
  });
}

function advisoryMarketSummary(context: AdvisoryResponseContext, copy: AdvisoryLanguageCopy, crop: string) {
  if (!crop) return copy.context.noCrop;
  const snapshot = context.mandiSnapshot;
  if (!snapshot || !farmCropMatchesCommodity(context.profitInputs.crop, snapshot.commodity)) {
    return fillTemplate(copy.context.noMarketSnapshot, { crop });
  }
  const history = dailyModalPrices(snapshot.records, snapshot.commodity);
  const analysis = analyzeFarmPrices(history);
  const latest = analysis.current;
  const previous = analysis.previous;
  if (!latest) return fillTemplate(copy.context.noMarketSnapshot, { crop });
  const trend = analysis.trend === "trendIncreasing"
    ? copy.context.trendIncreasing
    : analysis.trend === "trendDecreasing"
      ? copy.context.trendDecreasing
      : analysis.trend === "trendStable"
        ? copy.context.trendStable
        : copy.context.insufficientHistory;
  const change = analysis.percentageChange === null
    ? copy.context.insufficientHistory
    : `${analysis.percentageChange > 0 ? "+" : ""}${new Intl.NumberFormat(localeForLanguage(context.language), { maximumFractionDigits: 1 }).format(analysis.percentageChange)}%`;
  const sourceNote = snapshot.dataSource === "sample" || snapshot.dataSource === "sample-cached" || snapshot.dataSource === "cached"
    ? copy.context.samplePriceNote
    : copy.context.reportedPriceNote;
  return fillTemplate(copy.context.market, {
    crop,
    current: formatPrice(latest.modalPrice),
    currentDate: formatMandiDate(latest.date, context.language),
    previous: previous ? formatPrice(previous.modalPrice) : copy.context.unavailable,
    change,
    trend,
    sourceNote,
  });
}

function advisoryContextLines(
  intents: AdvisoryIntent[],
  context: AdvisoryResponseContext,
  copy: AdvisoryLanguageCopy,
  t: Translate,
) {
  const lines: string[] = [];
  const crop = selectedCropLabel(context.profitInputs.crop, t);
  if (crop) lines.push(`${copy.context.crop}: ${crop}`);
  const profile = context.profile;
  if (profile) {
    const farmDetails = [profile.village.trim(), profile.district.trim()]
      .filter(Boolean);
    if (profile.land.trim()) farmDetails.push(`${profile.land.trim()} ${copy.context.acres}`);
    if (farmDetails.length > 0) lines.push(`${copy.context.farm}: ${farmDetails.join(", ")}`);
    if (profile.soil.trim()) lines.push(`${copy.context.soil}: ${selectedSoilLabel(profile.soil, t)}`);
    const irrigationKeys: Record<string, keyof typeof text.en> = {
      canal: "waterCanal",
      borewell: "waterBorewell",
      rainfed: "waterRainfed",
      other: "waterOther",
    };
    const irrigationKey = irrigationKeys[profile.irrigation.trim().toLocaleLowerCase()];
    if (irrigationKey) lines.push(`${copy.context.irrigation}: ${t(irrigationKey)}`);
  }
  if (intents.includes("weather") || intents.includes("irrigation")) {
    lines.push(advisoryWeatherSummary(context, copy));
  }
  if (intents.includes("mandi")) {
    lines.push(advisoryMarketSummary(context, copy, crop));
  }
  return Array.from(new Set(lines));
}

function buildAdvisoryResponse(message: string, context: AdvisoryResponseContext, t: Translate) {
  const copy = advisoryCopy[context.language] ?? advisoryCopy.en;
  const matchedIntents = advisoryIntents.filter((intent) =>
    advisoryKeywords[intent].some((keyword) => matchesAdvisoryKeyword(message, keyword)),
  );
  const normalizedMessage = message.normalize("NFKC").toLocaleLowerCase();
  const greetingKeywords = ["hi", "hello", "namaskara", "namaste", "ನಮಸ್ಕಾರ", "नमस्ते", "नमस्कार", "help", "ಸಹಾಯ", "मदद"];
  const isGreeting = greetingKeywords.some((keyword) => matchesAdvisoryKeyword(normalizedMessage, keyword));
  const response = matchedIntents.length > 0
    ? matchedIntents.slice(0, 3).map((intent) => copy.answers[intent]).join("\n\n")
    : isGreeting ? copy.greeting : copy.unmatched;
  const contextLines = advisoryContextLines(matchedIntents, context, copy, t);
  return [response, ...contextLines, copy.safetyNote].join("\n\n");
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
  const locale = localeForLanguage(languageOf(t));
  const changeLabel = change === null
    ? t("noPrice")
    : `${new Intl.NumberFormat(locale, { signDisplay: "exceptZero", minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(change)}%`;
  const visibleHistory = history.slice(-5);
  const maximumPrice = Math.max(1, ...visibleHistory.map((point) => point.modalPrice));
  const shareMessage = history.length ? fillTemplate(t("mandiShareMessage"), {
    "{crop}": commodity,
    "{current}": formatPrice(current?.modalPrice ?? null),
    "{previous}": formatPrice(previous?.modalPrice ?? null),
    "{change}": changeLabel,
    "{trend}": t(trend),
    "{recommendation}": t(recommendation),
  }) : "";

  return <section className="panel sell-wait-advisor">
    <div className="sell-wait-heading">
      <div><div className="eyebrow">{t("priceAdvisory")}</div><h2>{t("sellWaitTitle")}{commodity ? ` · ${commodity}` : ""}</h2><p>{t("sellWaitSub")}</p></div>
      <div className="sell-wait-heading-actions">{shareMessage && <button type="button" className="button button-outline whatsapp-share" onClick={() => shareOnWhatsApp(shareMessage)}><span aria-hidden="true">◉</span>{t("shareWhatsapp")}</button>}<span className="sell-wait-icon" aria-hidden="true">↗</span></div>
    </div>
    {!commodity
      ? <p className="sell-wait-message">{t("selectCropForAdvisor")}</p>
      : !history.length
        ? <p className="sell-wait-message">{t("noAdvisorPrices")}</p>
        : <>
          <div className="sell-wait-metrics">
            <div><span>{t("currentReportedPrice")}</span><strong>{formatPrice(current?.modalPrice ?? null)}</strong>{current && <small>{formatMandiDate(current.date, languageOf(t))}</small>}</div>
            <div><span>{t("previousReportedPrice")}</span><strong>{formatPrice(previous?.modalPrice ?? null)}</strong>{previous && <small>{formatMandiDate(previous.date, languageOf(t))}</small>}</div>
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
                <small>{formatMandiDate(point.date, languageOf(t))}</small>
              </div>)}
            </div>
          </div>
        </>}
    <p className="sell-wait-disclaimer">{t("reportedPriceMethod")}</p>
  </section>;
}

function preferredMandiState(records: MandiRecord[]) {
  return records.find((record) => record.state.toLocaleLowerCase() === "karnataka")?.state ??
    uniqueSorted(records.map((record) => record.state))[0] ?? "";
}

function filterCachedMandiRecords(records: MandiRecord[], state: string, district: string, market: string, commodity: string) {
  return records.filter((record) =>
    record.state === state &&
    (!district || record.district === district) &&
    (!market || record.market === market) &&
    (!commodity || record.commodity === commodity),
  );
}

function mergeSampleMandiRecords(records: readonly MandiRecord[]) {
  const merged = new Map<string, MandiRecord>();
  for (const record of [...createSampleMandiRecords(), ...records]) {
    const key = [record.state, record.district, record.market, record.commodity, record.variety ?? "", record.arrivalDate].join("|");
    merged.set(key, record);
  }
  return Array.from(merged.values());
}

function Mandi({ t, isOnline, onSnapshot }: PageProps & { isOnline: boolean; onSnapshot: (snapshot: MandiSnapshot | null) => void }) {
  const [cachedPrices] = useState(readCachedMandiPrices);
  const [dataSource, setDataSource] = useState<MandiDataSource>(cachedPrices ? "cached" : "sample");
  const [records, setRecords] = useState<MandiRecord[]>(cachedPrices?.records ?? []);
  const [catalogRecords, setCatalogRecords] = useState<MandiRecord[]>(cachedPrices?.records ?? []);
  const [stateOptions, setStateOptions] = useState<string[]>([...INDIAN_STATES_AND_UTS]);
  const [selectedState, setSelectedState] = useState(() => preferredMandiState(cachedPrices?.records ?? []));
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
  const [fetchedAt, setFetchedAt] = useState(cachedPrices?.timestamp ?? "");
  const [refreshCount, setRefreshCount] = useState(0);

  useEffect(() => {
    if (!isOnline) {
      const cached = readCachedMandiPrices() ?? cachedPrices;
      const cachedRecords = cached?.records ?? [];
      const fallbackRecords = mergeSampleMandiRecords(cachedRecords);
      if (cached) {
        setFetchedAt(cached.timestamp);
      } else {
        setFetchedAt(new Date().toISOString());
      }
      setRecords(fallbackRecords);
      setCatalogRecords(fallbackRecords);
      setStateOptions([...INDIAN_STATES_AND_UTS]);
      setSelectedState((current) => current || preferredMandiState(fallbackRecords));
      setTotal(fallbackRecords.length);
      setDataSource(cachedRecords.length ? "sample-cached" : "sample");
      setError("");
      setLoading(false);
      setLoaded(true);
      return;
    }

    const controller = new AbortController();
    async function loadRecords() {
      setLoading(true);
      setError("");
      try {
        const response = await fetchMandiRecords({}, controller.signal);
        if (controller.signal.aborted) return;
        if (!response.records.length) {
          const cached = readCachedMandiPrices() ?? cachedPrices;
          const cachedRecords = cached?.records ?? [];
          const fallbackRecords = mergeSampleMandiRecords(cachedRecords);
          setRecords(fallbackRecords);
          setCatalogRecords(fallbackRecords);
          setStateOptions([...INDIAN_STATES_AND_UTS]);
          setTotal(fallbackRecords.length);
          setFetchedAt(cached?.timestamp ?? new Date().toISOString());
          setDataSource(cachedRecords.length ? "sample-cached" : "sample");
          setSelectedState(preferredMandiState(fallbackRecords));
          setError("");
          return;
        }
        const cached = cacheMandiPrices(response.records);
        setRecords(cached.records);
        setCatalogRecords(cached.records);
        setStateOptions([...INDIAN_STATES_AND_UTS]);
        setTotal(response.total);
        setFetchedAt(cached.timestamp);
        setDataSource("live");
        setSelectedState(preferredMandiState(cached.records));
      } catch (caught) {
        if (controller.signal.aborted) return;
        console.warn("Could not load AGMARKNET market options; using cached or sample data.", caught);
        const cached = readCachedMandiPrices() ?? cachedPrices;
        const cachedRecords = cached?.records ?? [];
        const fallbackRecords = mergeSampleMandiRecords(cachedRecords);
        setRecords(fallbackRecords);
        setCatalogRecords(fallbackRecords);
        setStateOptions([...INDIAN_STATES_AND_UTS]);
        setTotal(fallbackRecords.length);
        setFetchedAt(cached?.timestamp ?? new Date().toISOString());
        setDataSource(cachedRecords.length ? "sample-cached" : "sample");
        setSelectedState(preferredMandiState(fallbackRecords));
        setError("");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          setLoaded(true);
        }
      }
    }
    void loadRecords();
    return () => controller.abort();
  }, [isOnline, cachedPrices]);

  useEffect(() => {
    if (!loaded) return;
    if (!selectedState) {
      setLoading(false);
      return;
    }
    onSnapshot(null);
    if (!isOnline) {
      const cached = readCachedMandiPrices() ?? cachedPrices;
      const cachedRecords = cached?.records.length
        ? cached.records
        : catalogRecords.length && dataSource !== "sample" ? catalogRecords : [];
      const fallbackRecords = mergeSampleMandiRecords(cachedRecords);
      const fallbackSource: MandiDataSource = cachedRecords.length ? "sample-cached" : "sample";
      const offlineRecords = filterCachedMandiRecords(fallbackRecords, selectedState, selectedDistrict, selectedMarket, selectedCommodity);
      const fallbackTimestamp = (cached?.timestamp ?? fetchedAt) || new Date().toISOString();
      setRecords(offlineRecords);
      setStateOptions([...INDIAN_STATES_AND_UTS]);
      setTotal(offlineRecords.length);
      setFetchedAt(fallbackTimestamp);
      setDataSource(fallbackSource);
      setError("");
      if (selectedCommodity) onSnapshot({ commodity: selectedCommodity, records: offlineRecords, fetchedAt: fallbackTimestamp, dataSource: fallbackSource });
      setLoading(false);
      return;
    }
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
        if (!response.records.length) {
          const cached = readCachedMandiPrices() ?? cachedPrices;
          const cachedRecords = cached?.records.length
            ? cached.records
            : catalogRecords.length && dataSource !== "sample" ? catalogRecords : [];
          const fallbackRecords = mergeSampleMandiRecords(cachedRecords);
          const fallbackSource: MandiDataSource = cachedRecords.length ? "sample-cached" : "sample";
          const offlineRecords = filterCachedMandiRecords(fallbackRecords, selectedState, selectedDistrict, selectedMarket, selectedCommodity);
          const fallbackTimestamp = (cached?.timestamp ?? fetchedAt) || new Date().toISOString();
          setRecords(offlineRecords);
          setCatalogRecords(fallbackRecords);
          setStateOptions([...INDIAN_STATES_AND_UTS]);
          setTotal(offlineRecords.length);
          setFetchedAt(fallbackTimestamp);
          setDataSource(fallbackSource);
          setError("");
          if (selectedCommodity) onSnapshot({ commodity: selectedCommodity, records: offlineRecords, fetchedAt: fallbackTimestamp, dataSource: fallbackSource });
          return;
        }
        setRecords(response.records);
        setTotal(response.total);
        const cached = cacheMandiPrices(response.records);
        setFetchedAt(cached.timestamp);
        setCatalogRecords(cached.records);
        setDataSource("live");
        if (selectedCommodity) onSnapshot({ commodity: selectedCommodity, records: response.records, fetchedAt: response.fetchedAt, dataSource: "live" });
      } catch (caught) {
        if (controller.signal.aborted) return;
        console.warn("Could not load filtered AGMARKNET prices; using cached or sample data.", caught);
        const cached = readCachedMandiPrices() ?? cachedPrices;
        const cachedRecords = cached?.records.length
          ? cached.records
          : catalogRecords.length && dataSource !== "sample" ? catalogRecords : [];
        const fallbackRecords = mergeSampleMandiRecords(cachedRecords);
        const fallbackSource: MandiDataSource = cachedRecords.length ? "sample-cached" : "sample";
        const offlineRecords = filterCachedMandiRecords(fallbackRecords, selectedState, selectedDistrict, selectedMarket, selectedCommodity);
        const fallbackTimestamp = (cached?.timestamp ?? fetchedAt) || new Date().toISOString();
        setRecords(offlineRecords);
        setStateOptions([...INDIAN_STATES_AND_UTS]);
        setTotal(offlineRecords.length);
        setFetchedAt(fallbackTimestamp);
        setDataSource(fallbackSource);
        setError("");
        if (selectedCommodity) onSnapshot({ commodity: selectedCommodity, records: offlineRecords, fetchedAt: fallbackTimestamp, dataSource: fallbackSource });
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void loadFilteredRecords();
    return () => controller.abort();
  }, [loaded, selectedState, selectedDistrict, selectedMarket, selectedCommodity, refreshCount, onSnapshot, isOnline, cachedPrices]);

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
    ? new Date(fetchedAt).toLocaleString(localeForLanguage(languageOf(t)), { dateStyle: "medium", timeStyle: "short" })
    : "";

  function chooseCommodity(value: string) {
    setSelectedCommodity(value);
    setCommodityQuery(value);
    setCommodityMenuOpen(false);
    setDateFrom("");
    setDateTo("");
  }

  return <>
    <PageHeading eyebrow={t("marketBoard")} title={t("mandiTitle")} description={t("mandiSub")} t={t}
      badge={dataSource === "live" ? "Live AGMARKNET Data" : t("sampleCachedMandiData")}
      badgeKind={dataSource === "live" ? "source" : "demo"} />
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
    <div className="mandi-source-line">
      <span>◉ &nbsp;{dataSource === "sample" ? t("sampleDataSource") : dataSource === "sample-cached" ? t("mixedDataSource") : t("marketApiSource")}</span>
      {dataSource !== "live" && <span className="demo-badge mandi-fallback-badge"><i />{t("sampleCachedMandiData")}</span>}
      {updatedLabel && <span>{t("lastUpdatedMandi")}: {updatedLabel}</span>}
      {total > 0 && <span>{total.toLocaleString()} {t("selectedRows")}</span>}
    </div>
    {error && <div className="mandi-error" role="alert"><strong>{t("mandiErrorTitle")}</strong><p>{mandiErrorMessage(error, t)}</p>{error === "missing_credentials" && <code>DATA_GOV_IN_API_KEY</code>}</div>}
    {!loading && !error && <SellWaitAdvisor t={t} records={records} commodity={selectedCommodity} />}
    {loading && <div className="mandi-loading panel" role="status"><span className="spinner" />{t("loadingMarkets")}</div>}
    {!loading && !error && !records.length && <div className="mandi-empty panel"><span>⌕</span><h2>{loaded ? t("noDataForFilters") : t("noMarketData")}</h2></div>}
    {!loading && !error && records.length > 0 && <>
      <section className="panel table-panel mandi-table-panel"><div className="table-heading"><div><h2>{selectedCommodity || t("mandiTitle")}</h2><p>{records.length} {t("selectedRows")}</p></div><span className={`demo-badge ${dataSource === "live" ? "source-badge" : ""}`}><i />{dataSource === "live" ? "Live AGMARKNET Data" : t("sampleCachedMandiData")}</span></div>
        <div className="table-scroll"><table><thead><tr><th>{t("commodity")}</th><th>{t("market")}</th><th>{t("districtLabel")}</th><th>{t("variety")}</th><th>{t("arrivalDate")}</th><th>{t("minPrice")}</th><th>{t("maxPrice")}</th><th>{t("modalPrice")}</th></tr></thead><tbody>{sortedRecords.slice(0, 250).map((record, index) => <tr key={`${record.arrivalDate}-${record.market}-${record.commodity}-${record.variety}-${index}`}><td>{record.commodity}</td><td>{record.market}</td><td>{record.district}</td><td>{record.variety || t("noVariety")}</td><td>{formatMandiDate(record.arrivalDate, languageOf(t))}</td><td>{formatPrice(record.minPrice)}</td><td>{formatPrice(record.maxPrice)}</td><td className="price-cell">{formatPrice(record.modalPrice)}</td></tr>)}</tbody></table></div>
        <div className="table-footnote"><span>ⓘ</span>{t("sourceUnitNote")}</div>
      </section>
      <section className="panel mandi-comparison"><div className="mandi-section-heading"><div><div className="eyebrow">{selectedState}</div><h2>{t("compareMarkets")}{selectedCommodity ? ` · ${selectedCommodity}` : ""}</h2></div><button className="button button-outline" onClick={() => setSortAscending((ascending) => !ascending)}>{t("sortByModal")}: {t(sortAscending ? "ascending" : "descending")}</button></div>
        {comparisons.length > 0 ? <div className="comparison-grid">{comparisons.map((record, index) => <article className="comparison-card" key={`${record.market}-${record.arrivalDate}`}><div><strong>{record.market}</strong><small>{record.district}</small></div><b className={index === 0 ? "comparison-low" : index === comparisons.length - 1 ? "comparison-high" : ""}>{formatPrice(record.modalPrice)}</b><span>{t("minPrice")}: {formatPrice(record.minPrice)} · {t("maxPrice")}: {formatPrice(record.maxPrice)}</span><small>{t("arrivalDate")}: {formatMandiDate(record.arrivalDate, languageOf(t))}</small></article>)}</div> : <p className="mandi-history-empty">{selectedCommodity ? t("noCompareData") : t("chooseCropForCompare")}</p>}
        {highestPrice && lowestPrice && highestPrice.market !== lowestPrice.market && <div className="price-advisory"><div><strong>{t("highestReported")}</strong><span>{highestPrice.market} · {formatPrice(highestPrice.modalPrice)}</span></div><div><strong>{t("lowestReported")}</strong><span>{lowestPrice.market} · {formatPrice(lowestPrice.modalPrice)}</span></div></div>}
        <p className="transport-warning">{t("transportNote")}</p>
      </section>
      <section className="panel mandi-history"><div className="mandi-section-heading"><div><div className="eyebrow">{selectedCommodity || t("commodity")}</div><h2>{t("priceHistory")}</h2></div><div className="date-filters"><label>{t("fromDate")}<input type="date" min={availableDates[0]} max={defaultTo} value={dateFrom || defaultFrom} onChange={(event) => setDateFrom(event.target.value)} /></label><label>{t("toDate")}<input type="date" min={availableDates[0]} max={defaultTo} value={dateTo || defaultTo} onChange={(event) => setDateTo(event.target.value)} /></label></div></div>
        {historyValues.length > 0 ? <div className="history-bars" role="img" aria-label={t("priceHistory")}>{historyValues.map((entry) => <div className="history-point" key={entry.date}><strong>{formatPrice(entry.modalPrice)}</strong><span><i style={{ height: `${Math.max(8, entry.modalPrice / maximumHistoryPrice * 100)}%` }} /></span><small>{formatMandiDate(entry.date, languageOf(t))}</small></div>)}</div> : <p className="mandi-history-empty">{t("noHistory")}</p>}
        {missingDates.length > 0 && <div className="missing-date-note"><strong>{t("missingDates")}:</strong> {missingDates.map((date) => formatMandiDate(date, languageOf(t))).join(", ")}{missingDates.length > 31 ? "…" : ""}</div>}
        <p className="history-method">{t("sourceUnitNote")}</p>
      </section>
    </>}
  </>;
}

function formatRupees(value: number) {
  return `₹${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(value)}`;
}

function shareOnWhatsApp(message: string) {
  const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank", "noopener,noreferrer");
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

function ProfitCalculator({ t, language, form, onChange, profileVillage }: PageProps & {
  language: Language;
  form: ProfitInputs;
  onChange: (field: keyof ProfitInputs, value: string) => void;
  profileVillage: string;
}) {
  const [harvestQuantity, setHarvestQuantity] = useState("");
  const [mandiDistance, setMandiDistance] = useState("");
  const [neighborCount, setNeighborCount] = useState(1);
  const [vehicleFare, setVehicleFare] = useState("");
  const [inviteVillage, setInviteVillage] = useState(profileVillage);
  const [destinationMandi, setDestinationMandi] = useState("");
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
    { label: "totalExpectedYield" as const, value: validInputs ? new Intl.NumberFormat(localeForLanguage(language), { maximumFractionDigits: 2 }).format(totalYield) : "—", unit: validInputs ? t("quintals") : "", negative: false },
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
  const profitSpeech = validInputs ? fillTemplate(t("profitSpeechSummary"), {
    "{crop}": cropOptions.find((crop) => crop.value === form.crop)?.label ?? t("chooseCrop"),
    "{yield}": new Intl.NumberFormat(localeForLanguage(language), { maximumFractionDigits: 2 }).format(totalYield),
    "{revenue}": formatRupees(revenue),
    "{expenses}": formatRupees(expenses),
    "{profit}": formatRupees(profit),
    "{perAcre}": formatRupees(perAcreProfit),
  }) : "";
  const profitShare = validInputs ? fillTemplate(t("profitShareMessage"), {
    "{crop}": cropOptions.find((crop) => crop.value === form.crop)?.label ?? t("chooseCrop"),
    "{yield}": new Intl.NumberFormat(localeForLanguage(language), { maximumFractionDigits: 2 }).format(totalYield),
    "{revenue}": formatRupees(revenue),
    "{expenses}": formatRupees(expenses),
    "{profit}": formatRupees(profit),
    "{perAcre}": formatRupees(perAcreProfit),
  }) : "";
  const harvestAmount = Number(harvestQuantity);
  const distanceAmount = Number(mandiDistance);
  const fareAmount = Number(vehicleFare);
  const validPoolingInputs = harvestQuantity.trim() !== "" && mandiDistance.trim() !== "" && vehicleFare.trim() !== "" &&
    Number.isFinite(harvestAmount) && harvestAmount > 0 &&
    Number.isFinite(distanceAmount) && distanceAmount > 0 &&
    Number.isInteger(neighborCount) && neighborCount >= 1 && neighborCount <= 5 &&
    Number.isFinite(fareAmount) && fareAmount > 0;
  const totalFarmers = neighborCount + 1;
  const pooledFare = validPoolingInputs ? fareAmount / totalFarmers : 0;
  const savingsPerFarmer = validPoolingInputs ? fareAmount - pooledFare : 0;
  const inviteReady = validPoolingInputs && inviteVillage.trim() !== "" && destinationMandi.trim() !== "";
  const transportInvite = inviteReady ? fillTemplate(t("transportInviteMessage"), {
    "{count}": String(neighborCount),
    "{farmerUnit}": t(neighborCount === 1 ? "farmerUnitSingular" : "farmerUnitPlural"),
    "{village}": inviteVillage.trim(),
    "{mandi}": destinationMandi.trim(),
    "{quantity}": new Intl.NumberFormat(localeForLanguage(language), { maximumFractionDigits: 2 }).format(harvestAmount),
    "{distance}": new Intl.NumberFormat(localeForLanguage(language), { maximumFractionDigits: 1 }).format(distanceAmount),
  }) : "";

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
        <div className="panel-heading"><div><div className="eyebrow">{t("estimateBadge")}</div><h2>{t("calculatorResults")}</h2></div><div className="profit-results-actions">{validInputs && <><SpeakButton textToSpeak={profitSpeech} language={language} t={t} /><button type="button" className="button button-outline whatsapp-share" onClick={() => shareOnWhatsApp(profitShare)}><span aria-hidden="true">◉</span>{t("shareWhatsapp")}</button></>}<span className="profit-result-icon">✳</span></div></div>
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
    <section className="panel transport-pooling-card">
      <div className="transport-pooling-heading">
        <div><div className="eyebrow">{t("transportPoolingTitle")}</div><h2>{t("transportPoolingSub")}</h2></div>
        <span className="profit-result-icon" aria-hidden="true">↗</span>
      </div>
      <div className="transport-pooling-inputs">
        <label htmlFor="pooling-harvest">{t("harvestQuantity")}<input id="pooling-harvest" type="number" min="0.01" step="any" value={harvestQuantity} onChange={(event) => setHarvestQuantity(event.target.value)} /></label>
        <label htmlFor="pooling-distance">{t("distanceToMandi")}<input id="pooling-distance" type="number" min="0.1" step="any" value={mandiDistance} onChange={(event) => setMandiDistance(event.target.value)} /></label>
        <label htmlFor="pooling-neighbors">{t("neighborFarmers")}<select id="pooling-neighbors" value={neighborCount} onChange={(event) => setNeighborCount(Number(event.target.value))}>
          {[1, 2, 3, 4, 5].map((count) => <option value={count} key={count}>{count}</option>)}
        </select></label>
        <label htmlFor="pooling-fare">{t("vehicleFare")}<input id="pooling-fare" type="number" min="0.01" step="any" value={vehicleFare} onChange={(event) => setVehicleFare(event.target.value)} /></label>
        <label htmlFor="pooling-village">{t("villageForInvite")}<input id="pooling-village" value={inviteVillage} onChange={(event) => setInviteVillage(event.target.value)} /></label>
        <label htmlFor="pooling-mandi">{t("destinationMandi")}<input id="pooling-mandi" value={destinationMandi} onChange={(event) => setDestinationMandi(event.target.value)} /></label>
      </div>
      {validPoolingInputs ? <>
        <p className="pooling-farmer-count">{fillTemplate(t("totalSharingFarmers"), { "{count}": String(totalFarmers) })}</p>
        <div className="transport-pooling-results">
          <article><span>{t("individualTransportCost")}</span><strong>{formatRupees(fareAmount)}</strong></article>
          <article><span>{t("pooledTransportCost")}</span><strong>{formatRupees(pooledFare)}</strong></article>
          <article className="pooling-savings"><span>{t("transportSavings")}</span><strong>{formatRupees(savingsPerFarmer)}</strong></article>
        </div>
      </> : <p className="pooling-prompt">{t("transportPoolingSub")}</p>}
      <p className="transport-pooling-note">{t("transportPoolingAssumption")}</p>
      <div className="transport-invite">
        <div><div className="eyebrow">{t("invitePreview")}</div>{transportInvite
          ? <p>{transportInvite}</p>
          : <p>{t("transportInviteMissing")}</p>}</div>
        {inviteReady && <button type="button" className="button button-outline whatsapp-share" onClick={() => shareOnWhatsApp(transportInvite)}><span aria-hidden="true">◉</span>{t("shareWhatsapp")}</button>}
      </div>
    </section>
    <KccLoanInterestSaver language={language} />
    <SeasonExpenseLedger
      language={language}
      onApplyTotals={(totals) => {
        update("seedExpense", totals.seedExpense.toFixed(2));
        update("fertilizerExpense", totals.fertilizerExpense.toFixed(2));
        update("labourExpense", totals.labourExpense.toFixed(2));
        update("irrigationExpense", totals.irrigationExpense.toFixed(2));
        update("transportExpense", totals.transportExpense.toFixed(2));
        update("otherExpense", "0");
      }}
    />
  </>;
}

type LoanOptionId = "kcc" | "cropLoan" | "moneylender";
type LoanOption = { id: LoanOptionId; rate: number };
type LoanComparisonCopy = {
  title: string;
  description: string;
  amount: string;
  tenure: string;
  months: string;
  interest: string;
  repayment: string;
  savings: string;
  savedVs: string;
  invalid: string;
  kcc: string;
  cropLoan: string;
  moneylender: string;
  kccCondition: string;
  assumption: string;
  shareButton: string;
  shareTitle: string;
};

const loanComparisonCopy: LocalizedCopy<LoanComparisonCopy> = {
  en: {
    title: "KCC & Crop Loan Interest Saver",
    description: "Compare estimated simple interest over your crop tenure. The 4% KCC rate assumes eligibility and timely repayment.",
    amount: "Loan amount (₹)",
    tenure: "Crop tenure",
    months: "months",
    interest: "Interest payable",
    repayment: "Total repayment",
    savings: "Saved with KCC",
    savedVs: "Saved with KCC vs.",
    invalid: "Enter a loan amount above ₹0 and choose a tenure from 3 to 12 whole months.",
    kcc: "Kisan Credit Card (KCC)",
    cropLoan: "Cooperative / Bank Crop Loan",
    moneylender: "Local Moneylender",
    kccCondition: "4% effective annual rate, only when eligible and repaid on time (assumed rate).",
    assumption: "Estimate uses simple interest prorated by months (annual rate × loan × months ÷ 12), with interest rounded to paise. Assumes no fees, penalties, compounding, subsidy delays, or other charges. Actual KCC terms, eligibility, interest subvention, and rates can change; confirm with your bank. Not a loan offer or financial advice.",
    shareButton: "Share loan comparison",
    shareTitle: "KrishiMitra loan interest comparison",
  },
  kn: {
    title: "KCC ಮತ್ತು ಬೆಳೆ ಸಾಲ ಬಡ್ಡಿ ಉಳಿತಾಯ",
    description: "ಬೆಳೆ ಅವಧಿಯ ಅಂದಾಜು ಸರಳ ಬಡ್ಡಿಯನ್ನು ಹೋಲಿಸಿ. 4% KCC ದರಕ್ಕೆ ಅರ್ಹತೆ ಮತ್ತು ಸಮಯಕ್ಕೆ ಮರುಪಾವತಿ ಅಗತ್ಯವೆಂದು ಊಹಿಸಲಾಗಿದೆ.",
    amount: "ಸಾಲದ ಮೊತ್ತ (₹)",
    tenure: "ಬೆಳೆ ಅವಧಿ",
    months: "ತಿಂಗಳು",
    interest: "ಪಾವತಿಸಬೇಕಾದ ಬಡ್ಡಿ",
    repayment: "ಒಟ್ಟು ಮರುಪಾವತಿ",
    savings: "KCC ಮೂಲಕ ಉಳಿತಾಯ",
    savedVs: "ಇದಕ್ಕೆ ಹೋಲಿಸಿದ KCC ಉಳಿತಾಯ:",
    invalid: "₹0 ಕ್ಕಿಂತ ಹೆಚ್ಚಿನ ಸಾಲದ ಮೊತ್ತ ನಮೂದಿಸಿ ಮತ್ತು 3–12 ಪೂರ್ಣ ತಿಂಗಳು ಆಯ್ಕೆಮಾಡಿ.",
    kcc: "ಕಿಸಾನ್ ಕ್ರೆಡಿಟ್ ಕಾರ್ಡ್ (KCC)",
    cropLoan: "ಸಹಕಾರಿ / ಬ್ಯಾಂಕ್ ಬೆಳೆ ಸಾಲ",
    moneylender: "ಸ್ಥಳೀಯ ಸಾಲದಾತ",
    kccCondition: "ಅರ್ಹತೆ ಮತ್ತು ಸಮಯಕ್ಕೆ ಮರುಪಾವತಿ ಇದ್ದಾಗ ಮಾತ್ರ 4% ಪರಿಣಾಮಕಾರಿ ವಾರ್ಷಿಕ ದರ (ಊಹಿತ ದರ).",
    assumption: "ಅಂದಾಜು ತಿಂಗಳಿಗೆ ಹಂಚಿದ ಸರಳ ಬಡ್ಡಿಯನ್ನು ಬಳಸುತ್ತದೆ (ವಾರ್ಷಿಕ ದರ × ಸಾಲ × ತಿಂಗಳು ÷ 12); ಬಡ್ಡಿಯನ್ನು ಪೈಸೆಗೆ ಪೂರ್ಣಗೊಳಿಸಲಾಗಿದೆ. ಶುಲ್ಕ, ದಂಡ, ಚಕ್ರಬಡ್ಡಿ, ಸಹಾಯಧನ ವಿಳಂಬ ಅಥವಾ ಇತರ ವೆಚ್ಚಗಳಿಲ್ಲವೆಂದು ಊಹಿಸಲಾಗಿದೆ. ನೈಜ KCC ನಿಯಮಗಳು, ಅರ್ಹತೆ, ಬಡ್ಡಿ ರಿಯಾಯಿತಿ ಮತ್ತು ದರಗಳು ಬದಲಾಗಬಹುದು; ಬ್ಯಾಂಕ್‌ನಲ್ಲಿ ದೃಢಪಡಿಸಿ. ಇದು ಸಾಲದ ಆಫರ್ ಅಥವಾ ಹಣಕಾಸು ಸಲಹೆಯಲ್ಲ.",
    shareButton: "ಸಾಲ ಹೋಲಿಕೆ ಹಂಚಿಕೊಳ್ಳಿ",
    shareTitle: "ಕೃಷಿಮಿತ್ರ ಸಾಲ ಬಡ್ಡಿ ಹೋಲಿಕೆ",
  },
  hi: {
    title: "KCC और फसल ऋण ब्याज बचत",
    description: "फसल अवधि में अनुमानित साधारण ब्याज की तुलना करें। 4% KCC दर पात्रता और समय पर भुगतान मानती है।",
    amount: "ऋण राशि (₹)",
    tenure: "फसल अवधि",
    months: "महीने",
    interest: "देय ब्याज",
    repayment: "कुल भुगतान",
    savings: "KCC से बचत",
    savedVs: "की तुलना में KCC बचत:",
    invalid: "₹0 से अधिक ऋण राशि दर्ज करें और 3 से 12 पूरे महीने चुनें।",
    kcc: "किसान क्रेडिट कार्ड (KCC)",
    cropLoan: "सहकारी / बैंक फसल ऋण",
    moneylender: "स्थानीय साहूकार",
    kccCondition: "केवल पात्रता और समय पर भुगतान पर 4% प्रभावी वार्षिक दर (मान्य दर)।",
    assumption: "अनुमान महीनों के अनुपात में साधारण ब्याज उपयोग करता है (वार्षिक दर × ऋण × महीने ÷ 12); ब्याज को पैसे तक पूर्णांकित किया जाता है। इसमें शुल्क, दंड, चक्रवृद्धि, सब्सिडी में देरी या अन्य लागत शामिल नहीं हैं। वास्तविक KCC शर्तें, पात्रता, ब्याज सहायता और दरें बदल सकती हैं; बैंक से पुष्टि करें। यह ऋण प्रस्ताव या वित्तीय सलाह नहीं है।",
    shareButton: "ऋण तुलना साझा करें",
    shareTitle: "कृषिमित्र ऋण ब्याज तुलना",
  },
};

const loanOptions: LoanOption[] = [
  { id: "kcc", rate: 4 },
  { id: "cropLoan", rate: 7 },
  { id: "moneylender", rate: 18 },
];

function KccLoanInterestSaver({ language }: { language: Language }) {
  const copy = loanComparisonCopy[language] ?? loanComparisonCopy.en;
  const [loanAmount, setLoanAmount] = useState("");
  const [tenureMonths, setTenureMonths] = useState("6");
  const principal = Number(loanAmount);
  const months = Number(tenureMonths);
  const valid = loanAmount.trim() !== "" && Number.isFinite(principal) && principal > 0 &&
    Number.isInteger(months) && months >= 3 && months <= 12;
  const currency = new Intl.NumberFormat(localeForLanguage(language), {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const results = loanOptions.map((option) => {
    const rawInterest = valid ? principal * (option.rate / 100) * (months / 12) : 0;
    const interest = Math.round(rawInterest * 100) / 100;
    const repayment = valid ? Math.round((principal + interest) * 100) / 100 : 0;
    const savedVsKcc = valid ? Math.round((interest - (Math.round(principal * 0.04 * (months / 12) * 100) / 100)) * 100) / 100 : 0;
    const label = option.id === "kcc" ? copy.kcc : option.id === "cropLoan" ? copy.cropLoan : copy.moneylender;
    return { ...option, label, interest, repayment, savedVsKcc };
  });
  const kccResult = results.find((result) => result.id === "kcc");
  const shareSummary = valid && kccResult
    ? [
      copy.shareTitle,
      `${copy.amount}: ${currency.format(principal)}`,
      `${copy.tenure}: ${months} ${copy.months}`,
      ...results.map((result) => `${result.label} (${result.rate}% p.a.) — ${copy.interest}: ${currency.format(result.interest)}; ${copy.repayment}: ${currency.format(result.repayment)}`),
      `${copy.savedVs} ${copy.moneylender}: ${currency.format(results[2].interest - kccResult.interest)}`,
      `${copy.savedVs} ${copy.cropLoan}: ${currency.format(results[1].interest - kccResult.interest)}`,
      copy.assumption,
    ].join("\n")
    : "";
  const optionNames: Record<LoanOptionId, string> = {
    kcc: copy.kcc,
    cropLoan: copy.cropLoan,
    moneylender: copy.moneylender,
  };

  return <section className="panel loan-saver">
    <div className="loan-saver-heading">
      <div><div className="eyebrow">{language === "kn" ? "ಸಾಲದ ಆಯ್ಕೆಗಳು" : language === "hi" ? "ऋण विकल्प" : "LOAN OPTIONS"}</div><h2>{copy.title}</h2><p>{copy.description}</p></div>
      <span className="profit-result-icon" aria-hidden="true">₹</span>
    </div>
    <div className="loan-saver-inputs">
      <label htmlFor="loan-saver-amount">{copy.amount}<input id="loan-saver-amount" type="number" min="0.01" step="any" value={loanAmount} onChange={(event) => setLoanAmount(event.target.value)} placeholder="e.g. 100000" /></label>
      <label htmlFor="loan-saver-tenure">{copy.tenure}
        <select id="loan-saver-tenure" value={tenureMonths} onChange={(event) => setTenureMonths(event.target.value)}>
          {Array.from({ length: 10 }, (_, index) => index + 3).map((month) => <option value={month} key={month}>{month} {copy.months}</option>)}
        </select>
      </label>
    </div>
    {!valid && <p className="loan-saver-prompt">{copy.invalid}</p>}
    <div className="loan-option-grid">
      {results.map((result) => <article className={`loan-option-card${result.id === "kcc" ? " loan-option-kcc" : ""}`} key={result.id}>
        <div className="loan-option-title"><h3>{optionNames[result.id]}</h3><span>{result.rate}% p.a.</span></div>
        <div className="loan-option-metric"><span>{copy.interest}</span><strong>{valid ? currency.format(result.interest) : "—"}</strong></div>
        <div className="loan-option-metric"><span>{copy.repayment}</span><strong>{valid ? currency.format(result.repayment) : "—"}</strong></div>
        {valid && result.id !== "kcc" && <div className="loan-option-saving"><span>{copy.savedVs} {result.label}</span><strong>{currency.format(result.savedVsKcc)}</strong></div>}
        {result.id === "kcc" && <p className="loan-kcc-condition">{copy.kccCondition}</p>}
      </article>)}
    </div>
    <p className="loan-saver-assumption">{copy.assumption}</p>
    {valid && <div className="loan-saver-share"><button type="button" className="button button-outline whatsapp-share" onClick={() => shareOnWhatsApp(shareSummary)}><span aria-hidden="true">◉</span>{copy.shareButton}</button></div>}
  </section>;
}

type LedgerCategory = "seeds" | "fertilizersBioInputs" | "labor" | "irrigationDiesel" | "transport";
type LedgerExpenseField = "seedExpense" | "fertilizerExpense" | "labourExpense" | "irrigationExpense" | "transportExpense";
type LedgerExpenseTotals = Record<LedgerExpenseField, number>;
type SeasonExpenseEntry = { id: string; category: LedgerCategory; amount: number; date: string };
type LedgerStorageError = "read" | "write" | "";
type ExpenseLedgerCopy = {
  title: string;
  description: string;
  category: string;
  amount: string;
  date: string;
  add: string;
  total: string;
  entries: string;
  empty: string;
  delete: string;
  apply: string;
  applyNote: string;
  share: string;
  shareTitle: string;
  readError: string;
  writeError: string;
  invalidEntry: string;
  categoryLabels: Record<LedgerCategory, string>;
  shareTotal: string;
};

const expenseLedgerCopy: LocalizedCopy<ExpenseLedgerCopy> = {
  en: {
    title: "Season Expense Khata (Farm Ledger)",
    description: "Record dated farm expenses on this device and see how spending adds up by category.",
    category: "Expense category",
    amount: "Amount (₹)",
    date: "Expense date",
    add: "Add expense",
    total: "Season total",
    entries: "Recent entries",
    empty: "No expenses recorded yet. Add a cost to start your season ledger.",
    delete: "Delete",
    apply: "Use Total Cost in Profit Calculator",
    applyNote: "Applying replaces the Profit Calculator's expense fields with these category totals.",
    share: "Share ledger summary",
    shareTitle: "KrishiMitra season expense khata",
    readError: "Could not load the saved farm ledger. It was left unchanged; check browser storage before continuing.",
    writeError: "Could not save this ledger in browser storage. Your latest changes may not persist after closing this page.",
    invalidEntry: "Enter a positive amount up to paise precision and a valid date.",
    categoryLabels: {
      seeds: "Seeds",
      fertilizersBioInputs: "Fertilizers / Bio-Inputs",
      labor: "Labor",
      irrigationDiesel: "Irrigation / Diesel",
      transport: "Transport",
    },
    shareTotal: "Season total",
  },
  kn: {
    title: "ಋತು ವೆಚ್ಚ ಖಾತೆ (ಕೃಷಿ ಲೆಡ್ಜರ್)",
    description: "ಈ ಸಾಧನದಲ್ಲಿ ದಿನಾಂಕದೊಂದಿಗೆ ಕೃಷಿ ವೆಚ್ಚ ದಾಖಲಿಸಿ; ವಿಭಾಗವಾರು ವೆಚ್ಚ ನೋಡಿ.",
    category: "ವೆಚ್ಚದ ವಿಭಾಗ",
    amount: "ಮೊತ್ತ (₹)",
    date: "ವೆಚ್ಚದ ದಿನಾಂಕ",
    add: "ವೆಚ್ಚ ಸೇರಿಸಿ",
    total: "ಋತುವಿನ ಒಟ್ಟು",
    entries: "ಇತ್ತೀಚಿನ ದಾಖಲೆಗಳು",
    empty: "ಇನ್ನೂ ವೆಚ್ಚ ದಾಖಲಿಸಿಲ್ಲ. ಋತು ಖಾತೆ ಪ್ರಾರಂಭಿಸಲು ವೆಚ್ಚ ಸೇರಿಸಿ.",
    delete: "ಅಳಿಸಿ",
    apply: "ಲಾಭ ಲೆಕ್ಕಾಚಾರಕ್ಕೆ ಒಟ್ಟು ವೆಚ್ಚ ಬಳಸಿ",
    applyNote: "ಬಳಸಿದಾಗ ಲಾಭ ಲೆಕ್ಕಾಚಾರದ ವೆಚ್ಚದ ಜಾಗಗಳು ಈ ವಿಭಾಗಗಳ ಮೊತ್ತದಿಂದ ಬದಲಾಗುತ್ತವೆ.",
    share: "ಖಾತೆ ಸಾರಾಂಶ ಹಂಚಿಕೊಳ್ಳಿ",
    shareTitle: "ಕೃಷಿಮಿತ್ರ ಋತು ವೆಚ್ಚ ಖಾತೆ",
    readError: "ಉಳಿಸಿದ ಕೃಷಿ ಖಾತೆಯನ್ನು ಓದಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ಅದನ್ನು ಬದಲಾಯಿಸಿಲ್ಲ; ಮುಂದುವರಿಯುವ ಮೊದಲು ಬ್ರೌಸರ್ ಸಂಗ್ರಹ ಪರಿಶೀಲಿಸಿ.",
    writeError: "ಬ್ರೌಸರ್ ಸಂಗ್ರಹದಲ್ಲಿ ಈ ಖಾತೆಯನ್ನು ಉಳಿಸಲಾಗಲಿಲ್ಲ. ಪುಟ ಮುಚ್ಚಿದ ನಂತರ ಇತ್ತೀಚಿನ ಬದಲಾವಣೆಗಳು ಉಳಿಯದೇ ಇರಬಹುದು.",
    invalidEntry: "ಪೈಸೆ ನಿಖರತೆಯವರೆಗೆ ಶೂನ್ಯಕ್ಕಿಂತ ಹೆಚ್ಚಿನ ಮೊತ್ತ ಮತ್ತು ಸರಿಯಾದ ದಿನಾಂಕ ನಮೂದಿಸಿ.",
    categoryLabels: {
      seeds: "ಬೀಜಗಳು",
      fertilizersBioInputs: "ಗೊಬ್ಬರ / ಜೈವಿಕ ಒಳಸುರಿಗಳು",
      labor: "ಕಾರ್ಮಿಕರು",
      irrigationDiesel: "ನೀರಾವರಿ / ಡೀಸೆಲ್",
      transport: "ಸಾಗಣೆ",
    },
    shareTotal: "ಋತುವಿನ ಒಟ್ಟು",
  },
  hi: {
    title: "मौसम खर्चा खाता (फार्म लेजर)",
    description: "इस डिवाइस पर तारीख सहित खेती का खर्च दर्ज करें और श्रेणी के अनुसार कुल देखें।",
    category: "खर्च की श्रेणी",
    amount: "राशि (₹)",
    date: "खर्च की तारीख",
    add: "खर्च जोड़ें",
    total: "मौसम का कुल खर्च",
    entries: "हाल की प्रविष्टियाँ",
    empty: "अभी कोई खर्च दर्ज नहीं है। मौसम का खाता शुरू करने के लिए खर्च जोड़ें।",
    delete: "हटाएँ",
    apply: "लाभ कैलकुलेटर में कुल खर्च इस्तेमाल करें",
    applyNote: "इस्तेमाल करने पर लाभ कैलकुलेटर के खर्च वाले फ़ील्ड इन श्रेणी योगों से बदलेंगे।",
    share: "खाते का सार साझा करें",
    shareTitle: "कृषिमित्र मौसम खर्च खाता",
    readError: "सहेजा गया फार्म खाता पढ़ा नहीं जा सका। इसे बदला नहीं गया; आगे बढ़ने से पहले ब्राउज़र स्टोरेज जाँचें।",
    writeError: "यह खाता ब्राउज़र स्टोरेज में सहेजा नहीं जा सका। पेज बंद करने के बाद हाल के बदलाव सुरक्षित न रहें।",
    invalidEntry: "पैसे तक की सटीकता वाली सकारात्मक राशि और सही तारीख दर्ज करें।",
    categoryLabels: {
      seeds: "बीज",
      fertilizersBioInputs: "खाद / जैव-इनपुट",
      labor: "मजदूरी",
      irrigationDiesel: "सिंचाई / डीज़ल",
      transport: "परिवहन",
    },
    shareTotal: "मौसम का कुल खर्च",
  },
};

const expenseLedgerCategories: { id: LedgerCategory; expenseField: LedgerExpenseField }[] = [
  { id: "seeds", expenseField: "seedExpense" },
  { id: "fertilizersBioInputs", expenseField: "fertilizerExpense" },
  { id: "labor", expenseField: "labourExpense" },
  { id: "irrigationDiesel", expenseField: "irrigationExpense" },
  { id: "transport", expenseField: "transportExpense" },
];

function isSeasonExpenseEntry(value: unknown): value is SeasonExpenseEntry {
  if (!value || typeof value !== "object") return false;
  const entry = value as Record<string, unknown>;
  const categories: LedgerCategory[] = ["seeds", "fertilizersBioInputs", "labor", "irrigationDiesel", "transport"];
  return typeof entry.id === "string" && entry.id.length > 0 &&
    typeof entry.category === "string" && categories.includes(entry.category as LedgerCategory) &&
    typeof entry.amount === "number" && Number.isFinite(entry.amount) && entry.amount > 0 &&
    Number.isSafeInteger(Math.round(entry.amount * 100)) &&
    typeof entry.date === "string" && parseLocalDate(entry.date) !== null;
}

function currentLocalDateInput() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function newExpenseEntryId() {
  return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function SeasonExpenseLedger({ language, onApplyTotals }: {
  language: Language;
  onApplyTotals: (totals: LedgerExpenseTotals) => void;
}) {
  const copy = expenseLedgerCopy[language] ?? expenseLedgerCopy.en;
  const [entries, setEntries] = useState<SeasonExpenseEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [storageError, setStorageError] = useState<LedgerStorageError>("");
  const [category, setCategory] = useState<LedgerCategory>("seeds");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(currentLocalDateInput);
  const [entryError, setEntryError] = useState("");
  const locale = localeForLanguage(language);
  const currency = new Intl.NumberFormat(locale, { style: "currency", currency: "INR", minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const totals: LedgerExpenseTotals = {
    seedExpense: 0,
    fertilizerExpense: 0,
    labourExpense: 0,
    irrigationExpense: 0,
    transportExpense: 0,
  };
  for (const entry of entries) {
    const categoryInfo = expenseLedgerCategories.find((item) => item.id === entry.category);
    if (categoryInfo) totals[categoryInfo.expenseField] += entry.amount;
  }
  const totalCost = Object.values(totals).reduce((sum, value) => sum + value, 0);
  const sortedEntries = [...entries].sort((first, second) =>
    second.date.localeCompare(first.date) || second.id.localeCompare(first.id));

  useEffect(() => {
    try {
      const saved = localStorage.getItem(FARM_EXPENSE_LEDGER_KEY);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (!Array.isArray(parsed) || !parsed.every(isSeasonExpenseEntry)) {
          throw new Error("Saved farm expense ledger has an invalid format.");
        }
        setEntries(parsed);
      }
    } catch (error) {
      console.error("Could not read the farm expense ledger from local storage.", error);
      setStorageError("read");
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!loaded || storageError) return;
    try {
      localStorage.setItem(FARM_EXPENSE_LEDGER_KEY, JSON.stringify(entries));
    } catch (error) {
      console.error("Could not persist the farm expense ledger to local storage.", error);
      setStorageError("write");
    }
  }, [entries, loaded, storageError]);

  function addExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedAmount = Number(amount);
    const cents = Math.round(parsedAmount * 100);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0 ||
      !Number.isSafeInteger(cents) || parseLocalDate(date) === null) {
      setEntryError(copy.invalidEntry);
      return;
    }
    if (!loaded || storageError) return;
    setEntryError("");
    setEntries((current) => [...current, {
      id: newExpenseEntryId(),
      category,
      amount: cents / 100,
      date,
    }]);
    setAmount("");
  }

  function removeEntry(id: string) {
    setEntries((current) => current.filter((entry) => entry.id !== id));
  }

  const shareSummary = [
    copy.shareTitle,
    `${copy.total}: ${currency.format(totalCost)}`,
    ...expenseLedgerCategories.map((item) => `${copy.categoryLabels[item.id]}: ${currency.format(totals[item.expenseField])}`),
    `${copy.entries}: ${entries.length}`,
  ].join("\n");
  const categoryLabelById: Record<LedgerCategory, string> = copy.categoryLabels;

  return <section className="panel expense-ledger">
    <div className="expense-ledger-heading">
      <div><div className="eyebrow">{language === "kn" ? "ವೆಚ್ಚ ದಾಖಲೆ" : language === "hi" ? "खर्च रिकॉर्ड" : "FARM EXPENSE RECORD"}</div><h2>{copy.title}</h2><p>{copy.description}</p></div>
      <span className="profit-result-icon" aria-hidden="true">₹</span>
    </div>
    <form className="expense-ledger-form" onSubmit={addExpense}>
      <label htmlFor="ledger-category">{copy.category}<select id="ledger-category" value={category} onChange={(event) => {
        const value = event.target.value;
        if (value === "seeds" || value === "fertilizersBioInputs" || value === "labor" || value === "irrigationDiesel" || value === "transport") setCategory(value);
      }}>
        {expenseLedgerCategories.map((item) => <option value={item.id} key={item.id}>{copy.categoryLabels[item.id]}</option>)}
      </select></label>
      <label htmlFor="ledger-amount">{copy.amount}<input id="ledger-amount" type="number" min="0.01" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} required /></label>
      <label htmlFor="ledger-date">{copy.date}<input id="ledger-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} required /></label>
      <button type="submit" className="button button-primary" disabled={!loaded || Boolean(storageError)}>{copy.add}</button>
    </form>
    {entryError && <p className="expense-ledger-error" role="alert">{entryError}</p>}
    {storageError && <p className="expense-ledger-error" role="alert">{storageError === "read" ? copy.readError : copy.writeError}</p>}
    <div className="expense-ledger-summary">
      <article className="expense-ledger-total"><span>{copy.total}</span><strong>{currency.format(totalCost)}</strong><small>{entries.length} {copy.entries.toLocaleLowerCase(locale)}</small></article>
      <div className="expense-ledger-breakdown" aria-label={copy.title}>
        {expenseLedgerCategories.map((item) => {
          const value = totals[item.expenseField];
          const width = totalCost > 0 ? value / totalCost * 100 : 0;
          return <div className="expense-ledger-category" key={item.id}>
            <div className="expense-ledger-category-label"><span>{copy.categoryLabels[item.id]}</span><strong>{currency.format(value)}</strong></div>
            <div className="expense-ledger-track" role="img" aria-label={`${copy.categoryLabels[item.id]}: ${currency.format(value)}`}><i style={{ width: `${width}%` }} /></div>
          </div>;
        })}
      </div>
    </div>
    <div className="expense-ledger-list-heading"><h3>{copy.entries}</h3>
      {entries.length > 0 && <button type="button" className="button button-outline whatsapp-share" onClick={() => shareOnWhatsApp(shareSummary)}><span aria-hidden="true">◉</span>{copy.share}</button>}
    </div>
    {sortedEntries.length > 0 ? <ul className="expense-ledger-list">
      {sortedEntries.map((entry) => <li key={entry.id}>
        <div className="expense-ledger-entry-icon" aria-hidden="true">₹</div>
        <div className="expense-ledger-entry-copy"><strong>{categoryLabelById[entry.category]}</strong><small>{new Date(`${entry.date}T12:00:00`).toLocaleDateString(locale, { year: "numeric", month: "short", day: "numeric" })}</small></div>
        <strong className="expense-ledger-entry-amount">{currency.format(entry.amount)}</strong>
        <button type="button" className="expense-ledger-delete" onClick={() => removeEntry(entry.id)} aria-label={`${copy.delete} ${categoryLabelById[entry.category]} ${currency.format(entry.amount)}`}>×</button>
      </li>)}
    </ul> : <p className="expense-ledger-empty">{copy.empty}</p>}
    <div className="expense-ledger-apply">
      <p>{copy.applyNote}</p>
      <button type="button" className="button button-primary" disabled={!entries.length || totalCost <= 0 || !loaded || Boolean(storageError)} onClick={() => onApplyTotals(totals)}>{copy.apply}</button>
    </div>
  </section>;
}

type HarvestCrop = "tomato" | "onion" | "potato" | "paddy" | "ragi" | "chilli";
type StorageMethod = "openShed" | "gunnyBags" | "coldStorage";
type PostHarvestRisk = "postHarvestRiskLow" | "postHarvestRiskModerate" | "postHarvestRiskHigh";

const postHarvestCrops: { id: HarvestCrop; label: keyof typeof text.en }[] = [
  { id: "tomato", label: "cropDoctorTomato" },
  { id: "onion", label: "postHarvestCropOnion" },
  { id: "potato", label: "postHarvestCropPotato" },
  { id: "paddy", label: "cropRice" },
  { id: "ragi", label: "cropRagi" },
  { id: "chilli", label: "cropDoctorChilli" },
];

const postHarvestMethods: { id: StorageMethod; label: keyof typeof text.en }[] = [
  { id: "openShed", label: "storageOpenShed" },
  { id: "gunnyBags", label: "storageGunnyBags" },
  { id: "coldStorage", label: "storageColdStorage" },
];

const illustrativeStorageWindows: Record<HarvestCrop, Record<StorageMethod, number>> = {
  tomato: { openShed: 2, gunnyBags: 1, coldStorage: 7 },
  onion: { openShed: 7, gunnyBags: 14, coldStorage: 30 },
  potato: { openShed: 7, gunnyBags: 14, coldStorage: 30 },
  paddy: { openShed: 3, gunnyBags: 30, coldStorage: 45 },
  ragi: { openShed: 3, gunnyBags: 30, coldStorage: 45 },
  chilli: { openShed: 2, gunnyBags: 3, coldStorage: 7 },
};

function estimatePostHarvestRisk(crop: HarvestCrop, method: StorageMethod, temperature: number, humidity: number) {
  const coldStorage = method === "coldStorage";
  const heatAdjustment = coldStorage
    ? temperature >= 35 ? 0.9 : 1
    : temperature >= 35 ? 0.5 : temperature >= 30 ? 0.75 : 1;
  const humidityAdjustment = coldStorage
    ? humidity >= 80 ? 0.9 : 1
    : humidity >= 80 ? 0.5 : humidity >= 70 ? 0.75 : 1;
  const days = Math.max(1, Math.floor(illustrativeStorageWindows[crop][method] * heatAdjustment * humidityAdjustment));
  const risk: PostHarvestRisk = days <= 2 || (temperature >= 35 && humidity >= 80)
    ? "postHarvestRiskHigh"
    : days <= 7 || temperature >= 30 || humidity >= 70
      ? "postHarvestRiskModerate"
      : "postHarvestRiskLow";
  return { days, risk, action: risk === "postHarvestRiskHigh" ? "postHarvestSellImmediately" as const : "postHarvestSafeToStore" as const };
}

function PostHarvestAdvisor({ t, language, forecast }: PageProps & {
  language: Language;
  forecast: WeatherForecast | null;
}) {
  const [crop, setCrop] = useState<HarvestCrop>("tomato");
  const [method, setMethod] = useState<StorageMethod>("openShed");
  const temperature = forecast?.current.temperature ?? null;
  const humidity = forecast?.current.relativeHumidity ?? null;
  const estimate = temperature !== null && humidity !== null
    ? estimatePostHarvestRisk(crop, method, temperature, humidity)
    : null;
  const cropLabel = t(postHarvestCrops.find((option) => option.id === crop)?.label ?? "cropDoctorTomato");
  const methodLabel = t(postHarvestMethods.find((option) => option.id === method)?.label ?? "storageOpenShed");
  const dayLabel = estimate ? new Intl.NumberFormat(localeForLanguage(language)).format(estimate.days) : "";
  const actionLabel = estimate ? t(estimate.action) : "";
  const shareMessage = estimate && temperature !== null && humidity !== null ? fillTemplate(t("postHarvestShareMessage"), {
    "{crop}": cropLabel,
    "{method}": methodLabel,
    "{temperature}": new Intl.NumberFormat(localeForLanguage(language), { maximumFractionDigits: 1 }).format(temperature),
    "{humidity}": new Intl.NumberFormat(localeForLanguage(language), { maximumFractionDigits: 0 }).format(humidity),
    "{days}": dayLabel,
    "{risk}": t(estimate.risk),
    "{action}": actionLabel,
  }) : "";

  return <section className="panel post-harvest-advisor">
    <div className="smart-farm-panel-heading">
      <div><div className="eyebrow">{t("postHarvestEyebrow")}</div><h2>{t("postHarvestTitle")}</h2><p className="post-harvest-subtitle">{t("postHarvestSub")}</p></div>
      {forecast && <span className="live-tag"><i />{t("live")}</span>}
    </div>
    <div className="post-harvest-layout">
      <div className="post-harvest-inputs">
        <label>{t("postHarvestCrop")}<select value={crop} onChange={(event) => {
          const selected = postHarvestCrops.find((option) => option.id === event.target.value);
          if (selected) setCrop(selected.id);
        }}>{postHarvestCrops.map((option) => <option value={option.id} key={option.id}>{t(option.label)}</option>)}</select></label>
        <label>{t("postHarvestMethod")}<select value={method} onChange={(event) => {
          const selected = postHarvestMethods.find((option) => option.id === event.target.value);
          if (selected) setMethod(selected.id);
        }}>{postHarvestMethods.map((option) => <option value={option.id} key={option.id}>{t(option.label)}</option>)}</select></label>
        <div className="post-harvest-weather">
          <div><span>{t("currentTemperature")}</span><strong>{temperature === null ? "—" : `${temperature}°C`}</strong></div>
          <div><span>{t("humidity")}</span><strong>{humidity === null ? "—" : `${humidity}%`}</strong></div>
        </div>
      </div>
      <div className="post-harvest-result" aria-live="polite">
        {estimate ? <>
          <div className="post-harvest-metrics">
            <div><span>{t("postHarvestWindow")}</span><strong>{dayLabel} {t("dayUnit")}</strong></div>
            <div><span>{t("postHarvestRisk")}</span><strong className={`post-harvest-risk ${estimate.risk}`}>{t(estimate.risk)}</strong></div>
          </div>
          <div className={`post-harvest-action ${estimate.action === "postHarvestSellImmediately" ? "action-sell" : "action-store"}`}>
            <strong>{t("postHarvestAction")}: {actionLabel}</strong>
            <p>{t(estimate.action === "postHarvestSellImmediately" ? "postHarvestSellTip" : "postHarvestStoreTip")}</p>
          </div>
          <button type="button" className="button button-outline whatsapp-share" onClick={() => shareOnWhatsApp(shareMessage)}><span aria-hidden="true">◉</span>{t("shareWhatsapp")}</button>
        </> : <p className="smart-farm-empty">{t("postHarvestWeatherUnavailable")}</p>}
      </div>
    </div>
    <p className="post-harvest-note">{t("postHarvestModelNote")} {t("postHarvestEstimateNote")}</p>
  </section>;
}

type FarmerReportCopy = {
  generate: string;
  title: string;
  subtitle: string;
  profile: string;
  crop: string;
  weather: string;
  soilPlan: string;
  profit: string;
  noProfile: string;
  noCrop: string;
  noForecast: string;
  noAlerts: string;
  noSoil: string;
  selectedBioInput: string;
  areaBasis: string;
  seedBasis: string;
  missingBasis: string;
  noEstimate: string;
  name: string;
  village: string;
  district: string;
  land: string;
  soil: string;
  irrigation: string;
  cropName: string;
  activeAlerts: string;
  noAlertLabel: string;
  estimatedYield: string;
  revenue: string;
  expenses: string;
  estimatedProfit: string;
  profitPerAcre: string;
  print: string;
  share: string;
  close: string;
  reportDisclaimer: string;
};

const farmerReportCopy: LocalizedCopy<FarmerReportCopy> = {
  en: {
    generate: "Generate Farmer Smart Report",
    title: "Farmer Smart Report",
    subtitle: "A snapshot of your saved farm details and current app estimates.",
    profile: "Farmer profile",
    crop: "Selected crop",
    weather: "Weather alert",
    soilPlan: "Soil & bio-input plan",
    profit: "Latest Profit Calculator estimate",
    noProfile: "No farmer profile saved.",
    noCrop: "No crop selected in Smart Farm.",
    noForecast: "No live forecast is loaded; weather alerts cannot be assessed.",
    noAlerts: "No configured weather alert is active in the available forecast.",
    noSoil: "No soil type is saved in the farmer profile.",
    selectedBioInput: "Selected bio-input",
    areaBasis: "planned for {area} acres",
    seedBasis: "seed treatment for {quantity} kg of seed",
    missingBasis: "No valid acreage or seed-batch quantity is entered in the Bio-Input Calculator.",
    noEstimate: "Complete crop, area, yield and selling price in Profit Calculator to generate an estimate.",
    name: "Farmer",
    village: "Village",
    district: "District",
    land: "Saved land area",
    soil: "Saved soil type",
    irrigation: "Irrigation source",
    cropName: "Crop",
    activeAlerts: "Active forecast-based alerts",
    noAlertLabel: "Status",
    estimatedYield: "Expected yield",
    revenue: "Expected revenue",
    expenses: "Total expenses",
    estimatedProfit: "Estimated profit",
    profitPerAcre: "Profit per acre",
    print: "Print / Save as PDF",
    share: "Share Report on WhatsApp",
    close: "Close report",
    reportDisclaimer: "This is a summary of saved profile details, available forecast alerts, and estimates entered in KrishiMitra. It is not a verified agronomic, financial, or yield prediction.",
  },
  kn: {
    generate: "ರೈತರ ಸ್ಮಾರ್ಟ್ ವರದಿ ರಚಿಸಿ",
    title: "ರೈತರ ಸ್ಮಾರ್ಟ್ ವರದಿ",
    subtitle: "ಉಳಿಸಿದ ಕೃಷಿ ವಿವರಗಳು ಮತ್ತು ಪ್ರಸ್ತುತ ಅಪ್ಲಿಕೇಶನ್ ಅಂದಾಜುಗಳ ಸಾರಾಂಶ.",
    profile: "ರೈತರ ಪ್ರೊಫೈಲ್",
    crop: "ಆಯ್ಕೆ ಮಾಡಿದ ಬೆಳೆ",
    weather: "ಹವಾಮಾನ ಎಚ್ಚರಿಕೆ",
    soilPlan: "ಮಣ್ಣು ಮತ್ತು ಜೈವಿಕ ಒಳಸುರಿ ಯೋಜನೆ",
    profit: "ಲಾಭ ಲೆಕ್ಕಾಚಾರದ ಇತ್ತೀಚಿನ ಅಂದಾಜು",
    noProfile: "ರೈತರ ಪ್ರೊಫೈಲ್ ಉಳಿಸಿಲ್ಲ.",
    noCrop: "ಸ್ಮಾರ್ಟ್ ಕೃಷಿಯಲ್ಲಿ ಬೆಳೆ ಆಯ್ಕೆಮಾಡಿಲ್ಲ.",
    noForecast: "ನೈಜ ಮುನ್ಸೂಚನೆ ಲೋಡ್ ಆಗಿಲ್ಲ; ಹವಾಮಾನ ಎಚ್ಚರಿಕೆ ಅಳೆಯಲು ಸಾಧ್ಯವಿಲ್ಲ.",
    noAlerts: "ಲಭ್ಯ ಮುನ್ಸೂಚನೆಯಲ್ಲಿ ಯಾವುದೇ ನಿಗದಿತ ಹವಾಮಾನ ಎಚ್ಚರಿಕೆ ಸಕ್ರಿಯವಿಲ್ಲ.",
    noSoil: "ರೈತರ ಪ್ರೊಫೈಲ್‌ನಲ್ಲಿ ಮಣ್ಣಿನ ಪ್ರಕಾರ ಉಳಿಸಿಲ್ಲ.",
    selectedBioInput: "ಆಯ್ಕೆ ಮಾಡಿದ ಜೈವಿಕ ಒಳಸುರಿ",
    areaBasis: "{area} ಎಕರೆಗೆ ಯೋಜಿಸಲಾಗಿದೆ",
    seedBasis: "{quantity} ಕೆಜಿ ಬೀಜಕ್ಕೆ ಬೀಜ ಸಂಸ್ಕರಣೆ",
    missingBasis: "ಜೈವಿಕ ಒಳಸುರಿ ಲೆಕ್ಕಾಚಾರದಲ್ಲಿ ಮಾನ್ಯ ಭೂಮಿ ಅಥವಾ ಬೀಜದ ಪ್ರಮಾಣ ನಮೂದಿಸಿಲ್ಲ.",
    noEstimate: "ಅಂದಾಜು ಪಡೆಯಲು ಲಾಭ ಲೆಕ್ಕಾಚಾರದಲ್ಲಿ ಬೆಳೆ, ಭೂಮಿ, ಇಳುವರಿ ಮತ್ತು ಮಾರಾಟದ ಬೆಲೆ ನಮೂದಿಸಿ.",
    name: "ರೈತ",
    village: "ಗ್ರಾಮ",
    district: "ಜಿಲ್ಲೆ",
    land: "ಉಳಿಸಿದ ಭೂಮಿ",
    soil: "ಉಳಿಸಿದ ಮಣ್ಣಿನ ಪ್ರಕಾರ",
    irrigation: "ನೀರಾವರಿ ಮೂಲ",
    cropName: "ಬೆಳೆ",
    activeAlerts: "ಮುನ್ಸೂಚನೆ ಆಧಾರಿತ ಸಕ್ರಿಯ ಎಚ್ಚರಿಕೆಗಳು",
    noAlertLabel: "ಸ್ಥಿತಿ",
    estimatedYield: "ನಿರೀಕ್ಷಿತ ಇಳುವರಿ",
    revenue: "ನಿರೀಕ್ಷಿತ ಆದಾಯ",
    expenses: "ಒಟ್ಟು ವೆಚ್ಚ",
    estimatedProfit: "ಅಂದಾಜು ಲಾಭ",
    profitPerAcre: "ಪ್ರತಿ ಎಕರೆಗೆ ಲಾಭ",
    print: "ಮುದ್ರಿಸಿ / PDF ಆಗಿ ಉಳಿಸಿ",
    share: "ವರದಿಯನ್ನು WhatsApp ನಲ್ಲಿ ಹಂಚಿಕೊಳ್ಳಿ",
    close: "ವರದಿ ಮುಚ್ಚಿ",
    reportDisclaimer: "ಇದು ಉಳಿಸಿದ ಪ್ರೊಫೈಲ್ ವಿವರಗಳು, ಲಭ್ಯ ಮುನ್ಸೂಚನೆ ಎಚ್ಚರಿಕೆಗಳು ಮತ್ತು ಕೃಷಿಮಿತ್ರದಲ್ಲಿ ನಮೂದಿಸಿದ ಅಂದಾಜುಗಳ ಸಾರಾಂಶ ಮಾತ್ರ. ಇದು ದೃಢಪಟ್ಟ ಕೃಷಿ, ಹಣಕಾಸು ಅಥವಾ ಇಳುವರಿ ಮುನ್ಸೂಚನೆಯಲ್ಲ.",
  },
  hi: {
    generate: "किसान स्मार्ट रिपोर्ट बनाएँ",
    title: "किसान स्मार्ट रिपोर्ट",
    subtitle: "सहेजे गए खेत के विवरण और ऐप के मौजूदा अनुमानों का सारांश।",
    profile: "किसान प्रोफ़ाइल",
    crop: "चुनी गई फसल",
    weather: "मौसम चेतावनी",
    soilPlan: "मृदा और जैव-इनपुट योजना",
    profit: "लाभ कैलकुलेटर का नवीनतम अनुमान",
    noProfile: "किसान प्रोफ़ाइल सहेजी नहीं गई है।",
    noCrop: "स्मार्ट कृषि में कोई फसल नहीं चुनी गई है।",
    noForecast: "लाइव पूर्वानुमान लोड नहीं है; मौसम चेतावनियों का आकलन नहीं किया जा सकता।",
    noAlerts: "उपलब्ध पूर्वानुमान में कोई निर्धारित मौसम चेतावनी सक्रिय नहीं है।",
    noSoil: "किसान प्रोफ़ाइल में मिट्टी का प्रकार सहेजा नहीं है।",
    selectedBioInput: "चुना गया जैव-इनपुट",
    areaBasis: "{area} एकड़ के लिए योजना",
    seedBasis: "{quantity} किग्रा बीज के लिए बीज उपचार",
    missingBasis: "बायो-इनपुट कैलकुलेटर में मान्य क्षेत्र या बीज मात्रा दर्ज नहीं है।",
    noEstimate: "अनुमान पाने के लिए लाभ कैलकुलेटर में फसल, क्षेत्र, उपज और बिक्री मूल्य भरें।",
    name: "किसान",
    village: "गाँव",
    district: "ज़िला",
    land: "सहेजा गया भूमि क्षेत्र",
    soil: "सहेजी गई मिट्टी",
    irrigation: "सिंचाई स्रोत",
    cropName: "फसल",
    activeAlerts: "पूर्वानुमान आधारित सक्रिय चेतावनियाँ",
    noAlertLabel: "स्थिति",
    estimatedYield: "अनुमानित उपज",
    revenue: "अनुमानित आय",
    expenses: "कुल खर्च",
    estimatedProfit: "अनुमानित लाभ",
    profitPerAcre: "प्रति एकड़ लाभ",
    print: "प्रिंट / PDF में सहेजें",
    share: "रिपोर्ट WhatsApp पर साझा करें",
    close: "रिपोर्ट बंद करें",
    reportDisclaimer: "यह सहेजी गई प्रोफ़ाइल, उपलब्ध पूर्वानुमान चेतावनियों और कृषिमित्र में दर्ज अनुमानों का सारांश है। यह सत्यापित कृषि, वित्तीय या उपज पूर्वानुमान नहीं है।",
  },
};

function SmartFarm({ t, language, profile, location, forecast, profitInputs, onProfitInputChange, mandiSnapshot, bioInputPlan, navigate }: PageProps & {
  language: Language;
  profile: FarmerProfile | null;
  location: WeatherLocation | null;
  forecast: WeatherForecast | null;
  profitInputs: ProfitInputs;
  onProfitInputChange: (field: keyof ProfitInputs, value: string) => void;
  mandiSnapshot: MandiSnapshot | null;
  bioInputPlan: BioInputPlan;
  navigate: (screen: Screen) => void;
}) {
  const [showFarmerReport, setShowFarmerReport] = useState(false);
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
  const isSampleMarket = isMatchingMarketSnapshot && (mandiSnapshot?.dataSource === "sample" || mandiSnapshot?.dataSource === "sample-cached");
  const isCachedMarket = isMatchingMarketSnapshot && mandiSnapshot?.dataSource === "cached";
  const isDemoMarket = isSampleMarket || realPriceHistory.length === 0;
  const priceHistory = realPriceHistory.length ? realPriceHistory : selectedCrop ? demoFarmPriceHistory : [];
  const marketAnalysis = analyzeFarmPrices(priceHistory);
  const priceChangeLabel = marketAnalysis.percentageChange === null
    ? t("noPrice")
    : `${new Intl.NumberFormat(localeForLanguage(language), {
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
            "{share}": new Intl.NumberFormat(localeForLanguage(language), { maximumFractionDigits: 1 }).format(largestExpenseShare),
          })
          : t("expenseRecommendationNoCosts"),
      priority: largestExpenseShare >= 50 ? "priorityMedium" as const : "priorityLow" as const,
    },
  ];
  const recommendationSpeech = recommendations.map((recommendation) =>
    `${recommendation.title}. ${recommendation.body}`,
  ).join(". ");
  const farmProfitSpeech = calculation.valid ? fillTemplate(t("profitSpeechSummary"), {
    "{crop}": cropName,
    "{yield}": new Intl.NumberFormat(localeForLanguage(language), { maximumFractionDigits: 2 }).format(calculation.totalYield),
    "{revenue}": formatRupees(calculation.revenue),
    "{expenses}": formatRupees(calculation.totalExpenses),
    "{profit}": formatRupees(calculation.profit),
    "{perAcre}": formatRupees(calculation.profitPerAcre),
  }) : "";
  const marketRecommendationReason = !selectedCrop ? t("selectCropForSmartFarm")
    : isDemoMarket ? t("samplePriceExplanation")
      : isCachedMarket ? t("cachedPriceExplanation")
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
    <section className="panel smart-report-launch">
      <div><div className="eyebrow">{language === "kn" ? "ನಿಮ್ಮ ಕೃಷಿ ಸಾರಾಂಶ" : language === "hi" ? "आपके खेत का सार" : "YOUR FARM SUMMARY"}</div><p>{(farmerReportCopy[language] ?? farmerReportCopy.en).subtitle}</p></div>
      <button type="button" className="button button-primary" onClick={() => setShowFarmerReport(true)}>{(farmerReportCopy[language] ?? farmerReportCopy.en).generate}</button>
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
          <span className={`demo-badge ${isDemoMarket ? "" : "source-badge"}`}><i />{isDemoMarket ? t("demoPriceLabel") : isCachedMarket ? `${t("cachedData")} · AGMARKNET` : "Live AGMARKNET Data"}</span>
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
        <div className="smart-farm-panel-heading"><div><div className="eyebrow">{t("farmAlertsTitle")}</div><h2>{t("todayForecast")}</h2></div><div className="farm-alert-actions"><SpeakButton textToSpeak={weatherAlertCopy.length ? weatherAlertCopy.map(({ title, body }) => `${title}. ${body}`).join(". ") : t(forecast ? "noActiveFarmAlerts" : "generalWeatherAdviceBody")} language={language} t={t} /><span className={`demo-badge ${forecast ? "source-badge" : ""}`}><i />{forecast ? t("forecastVerified") : t("generalAdviceLabel")}</span></div></div>
        {forecast && alerts.length
          ? <ul className="farm-alert-list">{weatherAlertCopy.map(({ alert, title, body }) => <li key={`${alert.kind}-${alert.date ?? "current"}`}><span className="farm-alert-icon">!</span><div><strong>{title}</strong><p>{body}</p></div><b>{t(alert.kind === "heavyRain" ? "priorityHigh" : "priorityMedium")}</b></li>)}</ul>
          : <div className="general-weather-note"><strong>{t(forecast ? "noActiveFarmAlerts" : "generalWeatherAdviceTitle")}</strong><p>{t(forecast ? "noActiveFarmAlerts" : "generalWeatherAdviceBody")}</p></div>}
      </section>

      <PostHarvestAdvisor t={t} language={language} forecast={forecast} />

      <section className="panel smart-farm-expenses">
        <div className="smart-farm-panel-heading"><div><div className="eyebrow">{t("farmCostsTitle")}</div><h2>{t("calculatorResults")}</h2></div><div className="farm-finance-actions">{calculation.valid && <SpeakButton textToSpeak={farmProfitSpeech} language={language} t={t} />}<button className="button button-outline" onClick={() => navigate("profit")}>{t("profit")} <span>→</span></button></div></div>
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
            "{share}": new Intl.NumberFormat(localeForLanguage(language), { maximumFractionDigits: 1 }).format(largestExpenseShare),
          })}</p>}
          <div className="farm-expense-breakdown">{calculation.expenseBreakdown.map((expense) => <div key={expense.field}>
            <div><span>{t(expense.label)}</span><strong>{formatRupees(expense.amount)}</strong></div>
            <i><b style={{ width: `${expense.amount / maximumExpense * 100}%` }} /></i>
          </div>)}</div>
          {!largestExpense && <p className="smart-farm-empty">{t("noExpensesEntered")}</p>}
        </> : <p className="smart-farm-empty">{t("expenseRecommendationNoData")}</p>}
      </section>

      <section className="panel smart-farm-recommendations">
        <div className="smart-farm-panel-heading"><div><div className="eyebrow">{t("smartFarmEyebrow")}</div><h2>{t("personalizedTitle")}</h2></div><div className="farm-finance-actions"><SpeakButton textToSpeak={recommendationSpeech} language={language} t={t} /><span className="profile-illustration">✳</span></div></div>
        <div className="farm-recommendation-list">{recommendations.map((recommendation, index) => <article key={index}>
          <span className="farm-rec-icon">{recommendation.icon}</span>
          <div><div className="farm-rec-heading"><strong>{recommendation.title}</strong><small className={`priority-label ${recommendation.priority}`}>{t(recommendation.priority)}</small></div><p>{recommendation.body}</p></div>
        </article>)}</div>
      </section>
    </div>
    {showFarmerReport && <FarmerSmartReport
      t={t}
      language={language}
      profile={profile}
      cropName={selectedCrop?.label ?? null}
      weatherLocation={location ? locationLabel(location) : ""}
      hasForecast={Boolean(forecast)}
      alerts={weatherAlertCopy.map(({ title, body }) => ({ title, body }))}
      soilName={profile?.soil ? soilName : null}
      bioInputPlan={bioInputPlan}
      calculation={calculation}
      onClose={() => setShowFarmerReport(false)}
    />}
  </>;
}

function FarmerSmartReport({ t, language, profile, cropName, weatherLocation, hasForecast, alerts, soilName, bioInputPlan, calculation, onClose }: PageProps & {
  language: Language;
  profile: FarmerProfile | null;
  cropName: string | null;
  weatherLocation: string;
  hasForecast: boolean;
  alerts: { title: string; body: string }[];
  soilName: string | null;
  bioInputPlan: BioInputPlan;
  calculation: ReturnType<typeof calculateFarmProfit>;
  onClose: () => void;
}) {
  const copy = farmerReportCopy[language] ?? farmerReportCopy.en;
  const locale = localeForLanguage(language);
  const formatMoney = (value: number) => new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
  const formatNumber = (value: number) => new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value);
  const bioArea = Number(bioInputPlan.area);
  const seedBatch = Number(bioInputPlan.seedBatch);
  const bioBasis = bioInputPlan.recipe === "beejamrutha"
    ? bioInputPlan.seedBatch.trim() && Number.isFinite(seedBatch) && seedBatch > 0
      ? fillTemplate(copy.seedBasis, { "{quantity}": formatNumber(seedBatch) })
      : copy.missingBasis
    : bioInputPlan.area.trim() && Number.isFinite(bioArea) && bioArea > 0
      ? fillTemplate(copy.areaBasis, { "{area}": formatNumber(bioArea) })
      : copy.missingBasis;
  const sections: { title: string; rows: { label: string; value: string }[] }[] = [
    {
      title: copy.profile,
      rows: profile ? [
        { label: copy.name, value: profile.name || "—" },
        { label: copy.village, value: profile.village || "—" },
        { label: copy.district, value: profile.district || "—" },
        { label: copy.land, value: profile.land ? `${profile.land} ${t("acres")}` : "—" },
        { label: copy.soil, value: soilName ?? copy.noSoil },
        { label: copy.irrigation, value: profile.irrigation || "—" },
      ] : [{ label: copy.profile, value: copy.noProfile }],
    },
    {
      title: copy.crop,
      rows: [{ label: copy.cropName, value: cropName ?? copy.noCrop }],
    },
    {
      title: copy.weather,
      rows: [
        ...(weatherLocation ? [{ label: t("locationUnset"), value: weatherLocation }] : []),
        ...(hasForecast
          ? alerts.length
            ? alerts.map((alert, index) => ({ label: `${copy.activeAlerts} ${index + 1}`, value: `${alert.title}\n${alert.body}` }))
            : [{ label: copy.noAlertLabel, value: copy.noAlerts }]
          : [{ label: copy.noAlertLabel, value: copy.noForecast }]),
      ],
    },
    {
      title: copy.soilPlan,
      rows: [
        { label: copy.soil, value: soilName ?? copy.noSoil },
        { label: copy.selectedBioInput, value: `${localizedBioRecipeName(bioInputPlan.recipe, language)} — ${bioBasis}` },
      ],
    },
    {
      title: copy.profit,
      rows: calculation.valid ? [
        { label: copy.estimatedYield, value: `${formatNumber(calculation.totalYield)} ${t("quintals")}` },
        { label: copy.revenue, value: formatMoney(calculation.revenue) },
        { label: copy.expenses, value: formatMoney(calculation.totalExpenses) },
        { label: copy.estimatedProfit, value: formatMoney(calculation.profit) },
        { label: copy.profitPerAcre, value: formatMoney(calculation.profitPerAcre) },
      ] : [{ label: copy.profit, value: copy.noEstimate }],
    },
  ];
  const shareSummary = [
    copy.title,
    ...sections.flatMap((section) => [
      `\n${section.title}`,
      ...section.rows.map((row) => `${row.label}: ${row.value}`),
    ]),
    `\n${copy.reportDisclaimer}`,
  ].join("\n");

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return <div className="farmer-report-overlay" onClick={(event) => {
    if (event.target === event.currentTarget) onClose();
  }}>
    <section className="farmer-report-dialog" role="dialog" aria-modal="true" aria-labelledby="farmer-report-title">
      <header className="farmer-report-header">
        <div><div className="eyebrow">{language === "kn" ? "ಕೃಷಿ ಸಾರಾಂಶ" : language === "hi" ? "खेत का सार" : "FARM SUMMARY"}</div><h2 id="farmer-report-title">{copy.title}</h2><p>{copy.subtitle}</p></div>
        <button type="button" className="farmer-report-close" onClick={onClose} aria-label={copy.close}>×</button>
      </header>
      <div className="farmer-report-sections">
        {sections.map((section) => <section key={section.title} className="farmer-report-section">
          <h3>{section.title}</h3>
          <dl>{section.rows.map((row, index) => <div key={`${row.label}-${index}`}><dt>{row.label}</dt><dd>{row.value}</dd></div>)}</dl>
        </section>)}
      </div>
      <p className="farmer-report-disclaimer">{copy.reportDisclaimer}</p>
      <footer className="farmer-report-actions">
        <button type="button" className="button button-outline" onClick={() => window.print()}><span aria-hidden="true">▣</span>{copy.print}</button>
        <button type="button" className="button button-outline whatsapp-share" onClick={() => shareOnWhatsApp(shareSummary)}><span aria-hidden="true">◉</span>{copy.share}</button>
        <button type="button" className="button button-primary" onClick={onClose}>{copy.close}</button>
      </footer>
    </section>
  </div>;
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

type BioRecipeId = "jeevamrutha" | "beejamrutha" | "neemastra" | "vermicompost";
type BioInputPlan = { recipe: BioRecipeId; area: string; seedBatch: string };

function localizedBioRecipeName(id: BioRecipeId, language: Language) {
  return ({
    jeevamrutha: language === "kn" ? "ಜೀವಾಮೃತ" : language === "hi" ? "जीवामृत" : "Jeevamrutha",
    beejamrutha: language === "kn" ? "ಬೀಜಾಮೃತ" : language === "hi" ? "बीजामृत" : "Beejamrutha",
    neemastra: language === "kn" ? "ನೀಮಾಸ್ತ್ರ" : language === "hi" ? "नीमास्त्र" : "Neemastra",
    vermicompost: language === "kn" ? "ಎರೆಹುಳು ಗೊಬ್ಬರ" : language === "hi" ? "वर्मीकम्पೋस्ट" : "Vermicompost",
  }[id]);
}

type BioRecipeCopy = {
  title: string;
  subtitle: string;
  areaLabel: string;
  seedBatchLabel: string;
  preparation: string;
  application: string;
  water: string;
  cowDung: string;
  cowUrine: string;
  agedCowUrine: string;
  jaggery: string;
  pulseFlour: string;
  bundSoil: string;
  lime: string;
  neem: string;
  vermicompost: string;
  organicCost: string;
  npkCost: string;
  costResult: string;
  lowerCost: string;
  higherCost: string;
  noCostResult: string;
  source: string;
  disclaimer: string;
  notReplacement: string;
  shareTitle: string;
};

const bioRecipeCopy: LocalizedCopy<BioRecipeCopy> = {
  en: {
    title: "Organic Bio-Input & Fertilizer Recipe Calculator",
    subtitle: "Scale extension-style recipes to your field or seed batch. Quantities are illustrative; confirm crop-specific use locally.",
    areaLabel: "Land area (acres)",
    seedBatchLabel: "Seeds to treat (kg)",
    preparation: "Preparation",
    application: "Application",
    water: "Water",
    cowDung: "Fresh cow dung",
    cowUrine: "Cow urine",
    agedCowUrine: "Aged cow urine",
    jaggery: "Jaggery",
    pulseFlour: "Pulse flour (besan)",
    bundSoil: "Fertile bund soil",
    lime: "Slaked lime",
    neem: "Crushed neem leaves / kernel paste",
    vermicompost: "Finished vermicompost",
    organicCost: "Estimated total bio-input preparation cost (₹)",
    npkCost: "Your NPK fertilizer spend for the same area (₹)",
    costResult: "Entered expense difference",
    lowerCost: "Entered bio-input cost is lower by",
    higherCost: "Entered bio-input cost is higher by",
    noCostResult: "Enter a valid area and both costs to compare your expenses.",
    source: "Source basis: user-provided ICAR / NCOF and Karnataka State Department of Agriculture / UAS Bengaluru extension formulations.",
    disclaimer: "Illustrative extension guidance only. Formulations and rates vary by source and crop. Confirm preparation, crop-specific dosage, and application method with your local KVK or agriculture officer before use.",
    notReplacement: "The cost comparison is only between the amounts you enter. It does not show nutrient equivalence, prove that a bio-input replaces NPK, or guarantee savings. Neemastra is a pest-management preparation and Beejamrutha is for seed treatment, not fertilizer substitutes.",
    shareTitle: "KrishiMitra organic bio-input plan",
  },
  kn: {
    title: "ಸಾವಯವ ಜೈವಿಕ ಒಳಸುರಿ ಮತ್ತು ಗೊಬ್ಬರ ಪಾಕವಿಧಾನ ಲೆಕ್ಕಾಚಾರ",
    subtitle: "ನಿಮ್ಮ ಹೊಲ ಅಥವಾ ಬೀಜದ ಪ್ರಮಾಣಕ್ಕೆ ವಿಸ್ತರಣಾ ಮಾದರಿಯ ಪಾಕವಿಧಾನಗಳನ್ನು ಹೊಂದಿಸಿ. ಪ್ರಮಾಣಗಳು ಉದಾಹರಣಾತ್ಮಕ; ಬೆಳೆಗೆ ತಕ್ಕ ಬಳಕೆಯನ್ನು ಸ್ಥಳೀಯವಾಗಿ ದೃಢಪಡಿಸಿ.",
    areaLabel: "ಭೂಮಿ (ಎಕರೆ)",
    seedBatchLabel: "ಸಂಸ್ಕರಿಸಬೇಕಾದ ಬೀಜ (ಕೆಜಿ)",
    preparation: "ತಯಾರಿಕೆ",
    application: "ಬಳಕೆ ವಿಧಾನ",
    water: "ನೀರು",
    cowDung: "ತಾಜಾ ಹಸುವಿನ ಸಗಣಿ",
    cowUrine: "ಹಸುವಿನ ಮೂತ್ರ",
    agedCowUrine: "ಹಳೆಯ ಹಸುವಿನ ಮೂತ್ರ",
    jaggery: "ಬೆಲ್ಲ",
    pulseFlour: "ಬೇಳೆ ಹಿಟ್ಟು (ಬೇಸನ್)",
    bundSoil: "ಫಲವತ್ತಾದ ದಿಬ್ಬದ ಮಣ್ಣು",
    lime: "ಸುಣ್ಣ",
    neem: "ಜಜ್ಜಿದ ಬೇವಿನ ಎಲೆ / ಬೀಜದ ಪೇಸ್ಟ್",
    vermicompost: "ಸಿದ್ಧ ಎರೆಹುಳು ಗೊಬ್ಬರ",
    organicCost: "ಅಂದಾಜು ಒಟ್ಟು ಜೈವಿಕ ಒಳಸುರಿ ತಯಾರಿಕೆ ವೆಚ್ಚ (₹)",
    npkCost: "ಅದೇ ಭೂಮಿಗೆ ನಿಮ್ಮ NPK ಗೊಬ್ಬರ ವೆಚ್ಚ (₹)",
    costResult: "ನಮೂದಿಸಿದ ವೆಚ್ಚದ ವ್ಯತ್ಯಾಸ",
    lowerCost: "ನಮೂದಿಸಿದ ಜೈವಿಕ ಒಳಸುರಿ ವೆಚ್ಚ ಕಡಿಮೆ:",
    higherCost: "ನಮೂದಿಸಿದ ಜೈವಿಕ ಒಳಸುರಿ ವೆಚ್ಚ ಹೆಚ್ಚು:",
    noCostResult: "ವೆಚ್ಚ ಹೋಲಿಸಲು ಮಾನ್ಯ ಭೂಮಿ ಮತ್ತು ಎರಡೂ ಮೊತ್ತಗಳನ್ನು ನಮೂದಿಸಿ.",
    source: "ಮೂಲ ಆಧಾರ: ಬಳಕೆದಾರರು ನೀಡಿದ ICAR / NCOF ಮತ್ತು ಕರ್ನಾಟಕ ಕೃಷಿ ಇಲಾಖೆ / UAS ಬೆಂಗಳೂರು ವಿಸ್ತರಣಾ ಸೂತ್ರಗಳು.",
    disclaimer: "ಇದು ಉದಾಹರಣಾತ್ಮಕ ವಿಸ್ತರಣಾ ಮಾರ್ಗದರ್ಶನ ಮಾತ್ರ. ಸೂತ್ರ ಮತ್ತು ಪ್ರಮಾಣಗಳು ಮೂಲ ಹಾಗೂ ಬೆಳೆಗೆ ಅನುಗುಣವಾಗಿ ಬದಲಾಗುತ್ತವೆ. ಬಳಕೆಗೆ ಮೊದಲು ಸ್ಥಳೀಯ ಕೃಷಿ ವಿಜ್ಞಾನ ಕೇಂದ್ರ ಅಥವಾ ಕೃಷಿ ಅಧಿಕಾರಿಯಿಂದ ತಯಾರಿಕೆ, ಬೆಳೆ-ನಿರ್ದಿಷ್ಟ ಪ್ರಮಾಣ ಮತ್ತು ವಿಧಾನ ದೃಢಪಡಿಸಿ.",
    notReplacement: "ವೆಚ್ಚ ಹೋಲಿಕೆ ನೀವು ನಮೂದಿಸಿದ ಮೊತ್ತಗಳಷ್ಟೇ. ಇದು ಪೋಷಕಾಂಶ ಸಮಾನತೆ, ಜೈವಿಕ ಒಳಸುರಿ NPKಗೆ ಬದಲಿಯೆಂಬುದನ್ನು ಅಥವಾ ಖಚಿತ ಉಳಿತಾಯವನ್ನು ತೋರಿಸುವುದಿಲ್ಲ. ನೀಮಾಸ್ತ್ರ ಕೀಟ ನಿರ್ವಹಣೆಗೆ ಮತ್ತು ಬೀಜಾಮೃತ ಬೀಜ ಸಂಸ್ಕರಣೆಗೆ; ಇವು NPK ಗೊಬ್ಬರದ ಬದಲಿಗಳಲ್ಲ.",
    shareTitle: "ಕೃಷಿಮಿತ್ರ ಸಾವಯವ ಜೈವಿಕ ಒಳಸುರಿ ಯೋಜನೆ",
  },
  hi: {
    title: "जैविक बायो-इनपुट और खाद नुस्खा कैलकुलेटर",
    subtitle: "अपने खेत या बीज की मात्रा के अनुसार विस्तार-आधारित नुस्खे मापें। मात्राएँ उदाहरणार्थ हैं; फसल के अनुसार स्थानीय पुष्टि करें।",
    areaLabel: "भूमि क्षेत्र (एकड़)",
    seedBatchLabel: "उपचार के लिए बीज (किग्रा)",
    preparation: "तैयारी",
    application: "प्रयोग विधि",
    water: "पानी",
    cowDung: "ताज़ा गोबर",
    cowUrine: "गोमूत्र",
    agedCowUrine: "पुराना गोमूत्र",
    jaggery: "गुड़",
    pulseFlour: "दाल का आटा (बेसन)",
    bundSoil: "उपजाऊ मेड़ की मिट्टी",
    lime: "बुझा हुआ चूना",
    neem: "कुचली नीम की पत्तियाँ / बीज का पेस्ट",
    vermicompost: "तैयार वर्मीकम्पोस्ट",
    organicCost: "अनुमानित कुल जैव-इनपुट तैयारी लागत (₹)",
    npkCost: "इसी क्षेत्र के लिए आपका NPK खाद खर्च (₹)",
    costResult: "दर्ज खर्च का अंतर",
    lowerCost: "दर्ज जैव-इनपुट लागत कम है:",
    higherCost: "दर्ज जैव-इनपुट लागत अधिक है:",
    noCostResult: "खर्च की तुलना के लिए मान्य क्षेत्र और दोनों लागत दर्ज करें।",
    source: "स्रोत आधार: उपयोगकर्ता द्वारा दिए गए ICAR / NCOF और कर्नाटक कृषि विभाग / UAS बेंगलुरु के विस्तार सूत्र।",
    disclaimer: "केवल उदाहरणात्मक विस्तार मार्गदर्शन। नुस्खे और दरें स्रोत तथा फसल के अनुसार बदलती हैं। उपयोग से पहले तैयारी, फसल-विशिष्ट मात्रा और विधि की पुष्टि अपने स्थानीय KVK या कृषि अधिकारी से करें।",
    notReplacement: "खर्च तुलना केवल आपके दर्ज खर्चों की है। यह पोषक-तत्व समानता, NPK के स्थान पर जैव-इनपुट के उपयोग, या सुनिश्चित बचत को प्रमाणित नहीं करती। नीमास्त्र कीट प्रबंधन के लिए और बीजामृत बीज उपचार के लिए है, NPK का विकल्प नहीं।",
    shareTitle: "कृषिमित्र जैविक बायो-इनपुट योजना",
  },
};

type BioIngredient = { name: string; quantity: string; unit: string };

function OrganicBioInputCalculator({ t, language, recipe, onRecipeChange, area, onAreaChange, seedBatch, onSeedBatchChange }: PageProps & {
  language: Language;
  recipe: BioRecipeId;
  onRecipeChange: (recipe: BioRecipeId) => void;
  area: string;
  onAreaChange: (area: string) => void;
  seedBatch: string;
  onSeedBatchChange: (seedBatch: string) => void;
}) {
  const copy = bioRecipeCopy[language] ?? bioRecipeCopy.en;
  const [organicCost, setOrganicCost] = useState("");
  const [npkCost, setNpkCost] = useState("");
  const locale = localeForLanguage(language);
  const areaAmount = Number(area);
  const seedAmount = Number(seedBatch);
  const validArea = area.trim() !== "" && Number.isFinite(areaAmount) && areaAmount > 0;
  const validSeeds = seedBatch.trim() !== "" && Number.isFinite(seedAmount) && seedAmount > 0;
  const formatAmount = (value: number) => new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value);
  const range = (minimum: number, maximum: number, factor: number) =>
    `${formatAmount(minimum * factor)}–${formatAmount(maximum * factor)}`;
  const litre = language === "kn" ? "ಲೀ" : language === "hi" ? "लीटर" : "L";
  const kilogram = language === "kn" ? "ಕೆಜಿ" : language === "hi" ? "किग्रा" : "kg";
  const gram = language === "kn" ? "ಗ್ರಾಂ" : language === "hi" ? "ग्राम" : "g";
  const handful = language === "kn" ? "ಹಿಡಿ" : language === "hi" ? "मुट्ठी" : "handful";
  const ingredients: BioIngredient[] = (() => {
    switch (recipe) {
      case "jeevamrutha":
        if (!validArea) return [];
        return [
          { name: copy.water, quantity: formatAmount(200 * areaAmount), unit: litre },
          { name: copy.cowDung, quantity: formatAmount(10 * areaAmount), unit: kilogram },
          { name: copy.agedCowUrine, quantity: range(5, 10, areaAmount), unit: litre },
          { name: copy.jaggery, quantity: formatAmount(2 * areaAmount), unit: kilogram },
          { name: copy.pulseFlour, quantity: formatAmount(2 * areaAmount), unit: kilogram },
          { name: copy.bundSoil, quantity: formatAmount(areaAmount), unit: handful },
        ];
      case "beejamrutha":
        if (!validSeeds) return [];
        return [
          { name: copy.water, quantity: formatAmount(20 * seedAmount / 100), unit: litre },
          { name: copy.cowDung, quantity: formatAmount(5 * seedAmount / 100), unit: kilogram },
          { name: copy.cowUrine, quantity: formatAmount(5 * seedAmount / 100), unit: litre },
          { name: copy.lime, quantity: formatAmount(50 * seedAmount / 100), unit: gram },
          { name: copy.bundSoil, quantity: formatAmount(seedAmount / 100), unit: handful },
        ];
      case "neemastra":
        if (!validArea) return [];
        return [
          { name: copy.water, quantity: formatAmount(100 * areaAmount), unit: litre },
          { name: copy.cowUrine, quantity: formatAmount(5 * areaAmount), unit: litre },
          { name: copy.cowDung, quantity: range(1, 2, areaAmount), unit: kilogram },
          { name: copy.neem, quantity: formatAmount(5 * areaAmount), unit: kilogram },
        ];
      case "vermicompost":
        if (!validArea) return [];
        return [
          { name: copy.vermicompost, quantity: range(1000, 2000, areaAmount), unit: kilogram },
        ];
    }
  })();
  const organicAmount = Number(organicCost);
  const npkAmount = Number(npkCost);
  const validCosts = validArea && organicCost.trim() !== "" && npkCost.trim() !== "" &&
    Number.isFinite(organicAmount) && organicAmount >= 0 &&
    Number.isFinite(npkAmount) && npkAmount >= 0;
  const costDifference = validCosts ? Math.abs(npkAmount - organicAmount) : 0;
  const equalCosts = language === "kn" ? "ಎರಡೂ ನಮೂದಿಸಿದ ವೆಚ್ಚಗಳು ಸಮಾನವಾಗಿವೆ." : language === "hi" ? "दोनों दर्ज खर्च समान हैं।" : "Both entered costs are equal.";
  const costResult = !validCosts
    ? copy.noCostResult
    : npkAmount === organicAmount
      ? equalCosts
      : `${npkAmount > organicAmount ? copy.lowerCost : copy.higherCost} ${formatRupees(costDifference)}`;
  const details = {
    jeevamrutha: {
      preparation: language === "kn" ? "ನೆರಳಿನಲ್ಲಿ 48–72 ಗಂಟೆ ಹುದುಗಿಸಿ; ಪ್ರತಿದಿನ ಕಲಸಿ." : language === "hi" ? "छाया में 48–72 घंटे किण्वित करें; प्रतिदिन हिलाएँ।" : "Ferment in shade for 48–72 hours; stir daily.",
      application: language === "kn" ? "ನೀರಾವರಿ ಮೂಲಕ ಅಥವಾ ಎಲೆಗಳ ಮೇಲೆ ಸಿಂಪಡಿಸಿ." : language === "hi" ? "सिंचाई के साथ या पत्तियों पर छिड़कें।" : "Apply through irrigation or as a foliar spray.",
    },
    beejamrutha: {
      preparation: language === "kn" ? "24 ಗಂಟೆ ಸಿದ್ಧಪಡಿಸಿ. ಬೀಜಗಳಿಗೆ ಲೇಪಿಸಿ, ಬಿತ್ತುವ ಮೊದಲು ನೆರಳಿನಲ್ಲಿ ಒಣಗಿಸಿ." : language === "hi" ? "24 घंटे तैयार करें। बीजों पर लेप लगाकर बुवाई से पहले छाया में सुखाएँ।" : "Prepare for 24 hours. Coat the seeds and shade-dry before sowing.",
      application: language === "kn" ? "ನಮೂದಿಸಿದ ಬೀಜದ ಪ್ರಮಾಣಕ್ಕೆ ಲೇಪಿಸಿ; ಎಕರೆ ಆಧಾರದಲ್ಲಿ ಲೆಕ್ಕಿಸುವುದಿಲ್ಲ." : language === "hi" ? "दर्ज बीज मात्रा पर लेप करें; यह क्षेत्रफल के आधार पर नहीं मापा जाता।" : "Coat the entered seed batch; this recipe is not scaled by acreage.",
    },
    neemastra: {
      preparation: language === "kn" ? "ನೆರಳಿನಲ್ಲಿ 48 ಗಂಟೆ ಹುದುಗಿಸಿ; ಶೋಧಿಸಿ." : language === "hi" ? "छाया में 48 घंटे किण्वित करें; छान लें।" : "Ferment in shade for 48 hours; filter before use.",
      application: language === "kn" ? "ಬೆಳೆ ಮತ್ತು ಕೀಟಕ್ಕೆ ತಕ್ಕ ಬಳಕೆಯನ್ನು ಸ್ಥಳೀಯವಾಗಿ ದೃಢಪಡಿಸಿ ಸಿಂಪಡಿಸಿ." : language === "hi" ? "फसल और कीट के अनुसार उपयोग की स्थानीय पुष्टि के बाद छिड़कें।" : "Spray only after locally confirming suitability for the crop and pest.",
    },
    vermicompost: {
      preparation: language === "kn" ? "ಈ ಮಾರ್ಗದರ್ಶಿ ಸಿದ್ಧ ಗೊಬ್ಬರದ ಪ್ರಮಾಣವನ್ನು ಮಾತ್ರ ನೀಡುತ್ತದೆ; ತಯಾರಿಕೆಯ ಅವಧಿಯನ್ನು ನಿರ್ಧರಿಸುವುದಿಲ್ಲ." : language === "hi" ? "यह मार्गदर्शिका केवल तैयार खाद की मात्रा देती है; खाद बनाने की अवधि निर्धारित नहीं करती।" : "This guide gives a finished-product rate; it does not prescribe a preparation duration.",
      application: language === "kn" ? "ಬೆಳೆ ಮತ್ತು ಮಣ್ಣಿಗೆ ತಕ್ಕ ಪ್ರಮಾಣ ದೃಢಪಡಿಸಿ, ಬಿತ್ತನೆಗೂ ಮೊದಲು ಮಣ್ಣಿಗೆ ಹಾಕಿ." : language === "hi" ? "फसल और मिट्टी के अनुसार मात्रा की पुष्टि करें और बुवाई से पहले मिट्टी में मिलाएँ।" : "Confirm the crop- and soil-specific rate, then incorporate before sowing.",
    },
  }[recipe];
  const seedNote = language === "kn"
    ? "ಬೀಜಾಮೃತದ ಪ್ರಮಾಣ ಬೀಜದ ತೂಕದ ಮೇಲೆ ಅವಲಂಬಿತ; ಭೂಮಿ ವಿಸ್ತೀರ್ಣದಿಂದ ಬೀಜದ ಪ್ರಮಾಣವನ್ನು ಊಹಿಸಲಾಗಿಲ್ಲ."
    : language === "hi"
      ? "बीजामृत की मात्रा बीज के वजन पर निर्भर है; क्षेत्रफल से बीज की मात्रा का अनुमान नहीं लगाया गया।"
      : "Beejamrutha is scaled by seed weight; seed quantity is not inferred from acreage.";
  const recipeName = localizedBioRecipeName(recipe, language);
  const quantitySummary = ingredients.map((item) => `${item.name}: ${item.quantity} ${item.unit}`).join("\n");
  const shareMessage = [
    copy.shareTitle,
    `${copy.areaLabel}: ${validArea ? formatAmount(areaAmount) : "—"}`,
    recipe === "beejamrutha" ? `${copy.seedBatchLabel}: ${validSeeds ? formatAmount(seedAmount) : "—"}` : "",
    `${recipeName}\n${quantitySummary}`,
    `${copy.preparation}: ${details.preparation}`,
    `${copy.application}: ${details.application}`,
    validCosts ? `${copy.costResult}: ${costResult}` : "",
    copy.disclaimer,
  ].filter(Boolean).join("\n");

  return <section className="panel bio-recipe-panel">
    <div className="panel-heading bio-recipe-heading">
      <div><div className="eyebrow">{language === "kn" ? "ಮಣ್ಣಿನ ಆರೋಗ್ಯ" : language === "hi" ? "मृदा स्वास्थ्य" : "SOIL HEALTH"}</div><h2>{copy.title}</h2><p>{copy.subtitle}</p></div>
      <span className="profit-result-icon" aria-hidden="true">♧</span>
    </div>
    <div className="bio-recipe-controls">
      <label htmlFor="bio-recipe-select">{language === "kn" ? "ಸಾವಯವ ತಯಾರಿ" : language === "hi" ? "जैविक तैयारी" : "Organic preparation"}
        <select id="bio-recipe-select" value={recipe} onChange={(event) => {
          const value = event.target.value;
          if (value === "jeevamrutha" || value === "beejamrutha" || value === "neemastra" || value === "vermicompost") onRecipeChange(value);
        }}>
          {(["jeevamrutha", "beejamrutha", "neemastra", "vermicompost"] as const).map((id) => <option value={id} key={id}>{localizedBioRecipeName(id, language)}</option>)}
        </select>
      </label>
      <label htmlFor="bio-area">{copy.areaLabel}<input id="bio-area" type="number" min="0.01" step="any" value={area} onChange={(event) => onAreaChange(event.target.value)} /></label>
      {recipe === "beejamrutha" && <label htmlFor="bio-seed-batch">{copy.seedBatchLabel}<input id="bio-seed-batch" type="number" min="0.01" step="any" value={seedBatch} onChange={(event) => onSeedBatchChange(event.target.value)} placeholder="100" /></label>}
    </div>
    <div className="bio-recipe-results" aria-live="polite">
      <section className="bio-recipe-ingredients">
        <div className="bio-recipe-section-title"><h3>{recipeName}</h3><span>{language === "kn" ? "ಅಗತ್ಯ ಪ್ರಮಾಣ" : language === "hi" ? "आवश्यक मात्रा" : "Required quantities"}</span></div>
        {ingredients.length > 0 ? <ul>{ingredients.map((item) => <li key={item.name}><span>{item.name}</span><strong>{item.quantity} {item.unit}</strong></li>)}</ul> : <p>{language === "kn" ? "ಪಾಕವಿಧಾನದ ಪ್ರಮಾಣ ನೋಡಲು ಮಾನ್ಯ ಭೂಮಿ ಅಥವಾ ಬೀಜದ ಪ್ರಮಾಣ ನಮೂದಿಸಿ." : language === "hi" ? "नुस्खे की मात्रा देखने के लिए मान्य भूमि या बीज मात्रा दर्ज करें।" : "Enter a valid area or seed batch to see scaled quantities."}</p>}
        {recipe === "beejamrutha" && <p className="bio-recipe-note">{seedNote}</p>}
      </section>
      <section className="bio-recipe-guidance">
        <article><h3>◷ {copy.preparation}</h3><p>{details.preparation}</p></article>
        <article><h3>✿ {copy.application}</h3><p>{details.application}</p></article>
      </section>
    </div>
    <div className="bio-cost-panel">
      <div className="bio-recipe-section-title"><h3>{language === "kn" ? "ವೆಚ್ಚ ಹೋಲಿಕೆ" : language === "hi" ? "खर्च तुलना" : "Cost comparison"}</h3><span>{language === "kn" ? "ನಿಮ್ಮದೇ ಅಂದಾಜು" : language === "hi" ? "आपका अनुमान" : "Your own estimate"}</span></div>
      <div className="bio-recipe-controls">
        <label htmlFor="bio-organic-cost">{copy.organicCost}<input id="bio-organic-cost" type="number" min="0" step="any" value={organicCost} onChange={(event) => setOrganicCost(event.target.value)} /></label>
        <label htmlFor="bio-npk-cost">{copy.npkCost}<input id="bio-npk-cost" type="number" min="0" step="any" value={npkCost} onChange={(event) => setNpkCost(event.target.value)} /></label>
      </div>
      <p className="bio-cost-result"><strong>{copy.costResult}</strong><span>{costResult}</span></p>
    </div>
    <div className="bio-recipe-disclaimer"><strong>{copy.source}</strong><p>{copy.disclaimer} {copy.notReplacement}</p></div>
    <div className="bio-recipe-actions">
      {ingredients.length > 0 && <SpeakButton textToSpeak={`${recipeName}. ${quantitySummary}. ${details.preparation} ${details.application} ${copy.disclaimer}`} language={language} t={t} />}
      {ingredients.length > 0 && <button type="button" className="button button-outline whatsapp-share" onClick={() => shareOnWhatsApp(shareMessage)}><span aria-hidden="true">◉</span>{language === "kn" ? "WhatsApp ನಲ್ಲಿ ಹಂಚಿಕೊಳ್ಳಿ" : language === "hi" ? "WhatsApp पर साझा करें" : "Share on WhatsApp"}</button>}
    </div>
  </section>;
}

type RotationSeason = "kharif" | "rabi" | "zaid";
type RotationSoil = "red" | "black" | "loamy" | "sandy";
type RotationFamily = "cereal" | "legume" | "oilseed" | "fiber" | "solanaceous";
type RotationCropId = "paddy" | "ragi" | "maize" | "cotton" | "pulses" | "tomato" | "chilli";
type CandidateCropId = "greenGram" | "cowpea" | "groundnut" | "chickpea" | "horseGram" | "sunflower" | "rotationMaize" | "rotationRagi";

const rotationCopy = {
  en: {
    title: "Crop Rotation & Soil Health Planner",
    subtitle: "Explore general next-season crop options that diversify rotations and support soil nutrient cycling.",
    label: "GENERAL SOIL-HEALTH GUIDE",
    currentCrop: "Current / harvested crop",
    soilType: "Soil type",
    nextSeason: "Next season",
    chooseCrop: "Choose the crop you just harvested",
    chooseSoil: "Choose soil type",
    kharif: "Kharif",
    rabi: "Rabi",
    zaid: "Zaid / summer",
    paddy: "Paddy",
    ragi: "Ragi",
    maize: "Maize",
    cotton: "Cotton",
    pulses: "Pulses",
    tomato: "Tomato",
    chilli: "Chilli",
    red: "Red soil",
    black: "Black soil",
    loamy: "Loamy soil",
    sandy: "Sandy soil",
    greenGram: "Green gram",
    cowpea: "Cowpea",
    groundnut: "Groundnut",
    chickpea: "Chickpea",
    horseGram: "Horse gram",
    sunflower: "Sunflower",
    rotationMaize: "Maize",
    rotationRagi: "Ragi",
    familyCereal: "Cereal",
    familyLegume: "Pulse / legume",
    familyOilseed: "Oilseed",
    familyFiber: "Fibre crop",
    familySolanaceous: "Vegetable family",
    recommendationTitle: "Suggested next-season crops",
    recommendationIntro: "Ranked for crop-family rotation and broad soil compatibility, not as a guaranteed yield or local variety recommendation.",
    soilMatch: "Broad soil match",
    soilCheck: "Check local suitability",
    legumeReason: "As a legume after {crop}, it can fix atmospheric nitrogen when compatible root bacteria form effective nodules. Keeping healthy residues in the field can return nutrients to the soil.",
    otherLegumeReason: "A pulse can diversify the rotation, but avoid repeating the same pulse family if local pest or disease pressure is high. Nitrogen fixation depends on effective nodulation.",
    diversityReason: "This crop belongs to a different plant family than {crop}; rotation diversity and returning suitable residues can support soil structure and nutrient cycling.",
    soilMatchNote: "This crop is broadly listed for the selected soil type; local variety, drainage, rainfall, and irrigation still determine suitability.",
    soilCheckNote: "Soil match is less direct in this general guide. Check variety and field suitability with local agriculture staff before sowing.",
    selectInputs: "Choose the harvested crop and soil type to view three candidates for the selected season.",
    companionTitle: "Companion plants to consider",
    companionIntro: "These examples may support pest management or beneficial insects in some systems; they do not reliably repel all pests and are not a substitute for scouting or integrated pest management.",
    marigold: "Marigold (Tagetes)",
    marigoldNote: "Used in some vegetable systems for nematode suppression when the right Tagetes type and planting method are used; simple interplanting is not a guaranteed treatment.",
    coriander: "Coriander",
    corianderNote: "Allowing some plants to flower may attract beneficial insects; this supports biodiversity rather than guaranteeing pest control.",
    allium: "Onion or garlic",
    alliumNote: "Aromatic Allium borders may deter some pests in certain settings, but results vary and they can compete for water and nutrients.",
    soilBasisTitle: "How the soil-health ranking works",
    soilBasis: "Legumes can fix atmospheric nitrogen only when suitable rhizobia nodulate their roots; the amount varies. Crop rotation does not replace soil testing, balanced nutrient management, or locally recommended fertilizer rates.",
    localNote: "These are educational candidates, not location-specific prescriptions. Confirm season, variety, water availability, and rotation risks with your local KVK or agriculture officer.",
  },
  kn: {
    title: "ಬೆಳೆ ಪರಿವರ್ತನೆ ಮತ್ತು ಮಣ್ಣಿನ ಆರೋಗ್ಯ ಯೋಜಕ",
    subtitle: "ಬೆಳೆ ವೈವಿಧ್ಯ ಮತ್ತು ಮಣ್ಣಿನ ಪೋಷಕಾಂಶ ಚಕ್ರಕ್ಕೆ ನೆರವಾಗುವ ಮುಂದಿನ ಹಂಗಾಮಿನ ಸಾಮಾನ್ಯ ಆಯ್ಕೆಗಳನ್ನು ನೋಡಿ.",
    label: "ಮಣ್ಣಿನ ಆರೋಗ್ಯದ ಸಾಮಾನ್ಯ ಮಾರ್ಗದರ್ಶಿ",
    currentCrop: "ಪ್ರಸ್ತುತ / ಕೊಯ್ಲು ಮಾಡಿದ ಬೆಳೆ",
    soilType: "ಮಣ್ಣಿನ ಪ್ರಕಾರ",
    nextSeason: "ಮುಂದಿನ ಹಂಗಾಮು",
    chooseCrop: "ಈಗಷ್ಟೇ ಕೊಯ್ಲು ಮಾಡಿದ ಬೆಳೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ",
    chooseSoil: "ಮಣ್ಣಿನ ಪ್ರಕಾರ ಆಯ್ಕೆಮಾಡಿ",
    kharif: "ಖರೀಫ್",
    rabi: "ರಬಿ",
    zaid: "ಜೈದ್ / ಬೇಸಿಗೆ",
    paddy: "ಭತ್ತ",
    ragi: "ರಾಗಿ",
    maize: "ಮೆಕ್ಕೆಜೋಳ",
    cotton: "ಹತ್ತಿ",
    pulses: "ಬೇಳೆಕಾಳು",
    tomato: "ಟೊಮೇಟೊ",
    chilli: "ಮೆಣಸಿನಕಾಯಿ",
    red: "ಕೆಂಪು ಮಣ್ಣು",
    black: "ಕಪ್ಪು ಮಣ್ಣು",
    loamy: "ಲೋಮಿ ಮಣ್ಣು",
    sandy: "ಮರಳು ಮಣ್ಣು",
    greenGram: "ಹೆಸರುಕಾಳು",
    cowpea: "ಅಲಸಂದೆ",
    groundnut: "ಶೇಂಗಾ",
    chickpea: "ಕಡಲೆ",
    horseGram: "ಹುರಳಿ",
    sunflower: "ಸೂರ್ಯಕಾಂತಿ",
    rotationMaize: "ಮೆಕ್ಕೆಜೋಳ",
    rotationRagi: "ರಾಗಿ",
    familyCereal: "ಧಾನ್ಯ",
    familyLegume: "ಬೇಳೆ / ದ್ವಿದಳ",
    familyOilseed: "ಎಣ್ಣೆಕಾಳು",
    familyFiber: "ನಾರಿನ ಬೆಳೆ",
    familySolanaceous: "ತರಕಾರಿ ಕುಟುಂಬ",
    recommendationTitle: "ಮುಂದಿನ ಹಂಗಾಮಿಗೆ ಸೂಚಿಸಿದ ಬೆಳೆಗಳು",
    recommendationIntro: "ಬೆಳೆ ಕುಟುಂಬ ಪರಿವರ್ತನೆ ಮತ್ತು ಮಣ್ಣಿನ ಸಾಮಾನ್ಯ ಹೊಂದಾಣಿಕೆಯ ಆಧಾರದ ಕ್ರಮ; ಖಚಿತ ಇಳುವರಿ ಅಥವಾ ಸ್ಥಳೀಯ ತಳಿ ಸಲಹೆಯಲ್ಲ.",
    soilMatch: "ಮಣ್ಣಿಗೆ ಸಾಮಾನ್ಯ ಹೊಂದಾಣಿಕೆ",
    soilCheck: "ಸ್ಥಳೀಯ ಹೊಂದಾಣಿಕೆ ಪರಿಶೀಲಿಸಿ",
    legumeReason: "{crop} ನಂತರ ಬೇಳೆ ಬೆಳೆ ಮಾಡಿದರೆ, ಹೊಂದುವ ಬೇರು ಬ್ಯಾಕ್ಟೀರಿಯಾಗಳು ಪರಿಣಾಮಕಾರಿ ಗಂಟುಗಳನ್ನು ರಚಿಸಿದಾಗ ವಾತಾವರಣದ ಸಾರಜನಕ ಸ್ಥಿರೀಕರಿಸಬಹುದು. ಆರೋಗ್ಯಕರ ಅವಶೇಷಗಳನ್ನು ಹೊಲದಲ್ಲಿ ಉಳಿಸುವುದರಿಂದ ಪೋಷಕಾಂಶಗಳು ಮರಳಬಹುದು.",
    otherLegumeReason: "ಬೇಳೆ ಬೆಳೆ ಪರಿವರ್ತನೆಯಲ್ಲಿ ವೈವಿಧ್ಯ ತರಬಹುದು; ಆದರೆ ಸ್ಥಳೀಯ ಕೀಟ ಅಥವಾ ರೋಗದ ಒತ್ತಡ ಹೆಚ್ಚಿದ್ದರೆ ಅದೇ ಬೇಳೆ ಕುಟುಂಬವನ್ನು ಮರುಮರು ಬೆಳೆಯಬೇಡಿ. ಸಾರಜನಕ ಸ್ಥಿರೀಕರಣ ಪರಿಣಾಮಕಾರಿ ಗಂಟುಗಳ ಮೇಲೆ ಅವಲಂಬಿತ.",
    diversityReason: "ಈ ಬೆಳೆ {crop} ಗಿಂತ ಬೇರೆ ಸಸ್ಯ ಕುಟುಂಬಕ್ಕೆ ಸೇರಿದೆ; ಪರಿವರ್ತನೆ ವೈವಿಧ್ಯ ಮತ್ತು ಸೂಕ್ತ ಅವಶೇಷಗಳನ್ನು ಮಣ್ಣಿಗೆ ಮರಳಿಸುವುದು ಮಣ್ಣಿನ ರಚನೆ ಹಾಗೂ ಪೋಷಕಾಂಶ ಚಕ್ರಕ್ಕೆ ನೆರವಾಗಬಹುದು.",
    soilMatchNote: "ಆಯ್ಕೆ ಮಾಡಿದ ಮಣ್ಣಿಗೆ ಈ ಬೆಳೆ ಸಾಮಾನ್ಯವಾಗಿ ಹೊಂದುವ ಆಯ್ಕೆಯಾಗಿದೆ; ತಳಿ, ಒಳಚರಂಡಿ, ಮಳೆ ಮತ್ತು ನೀರಾವರಿ ಸೂಕ್ತತೆಯನ್ನು ನಿರ್ಧರಿಸುತ್ತವೆ.",
    soilCheckNote: "ಈ ಸಾಮಾನ್ಯ ಮಾರ್ಗದರ್ಶಿಯಲ್ಲಿ ಮಣ್ಣಿನ ಹೊಂದಾಣಿಕೆ ಕಡಿಮೆ ಸ್ಪಷ್ಟವಾಗಿದೆ. ಬಿತ್ತುವ ಮೊದಲು ಸ್ಥಳೀಯ ಕೃಷಿ ಸಿಬ್ಬಂದಿಯಿಂದ ತಳಿ ಮತ್ತು ಹೊಲದ ಹೊಂದಾಣಿಕೆ ಪರಿಶೀಲಿಸಿ.",
    selectInputs: "ಆಯ್ಕೆ ಮಾಡಿದ ಹಂಗಾಮಿಗೆ ಮೂರು ಬೆಳೆಗಳನ್ನು ನೋಡಲು ಕೊಯ್ಲು ಮಾಡಿದ ಬೆಳೆ ಮತ್ತು ಮಣ್ಣಿನ ಪ್ರಕಾರ ಆಯ್ಕೆಮಾಡಿ.",
    companionTitle: "ಪರಿಗಣಿಸಬಹುದಾದ ಸಹಬೆಳೆಗಳು",
    companionIntro: "ಈ ಉದಾಹರಣೆಗಳು ಕೆಲವು ಪದ್ಧತಿಗಳಲ್ಲಿ ಕೀಟ ನಿರ್ವಹಣೆ ಅಥವಾ ಉಪಕಾರಿ ಕೀಟಗಳಿಗೆ ನೆರವಾಗಬಹುದು; ಎಲ್ಲ ಕೀಟಗಳನ್ನು ಖಚಿತವಾಗಿ ಓಡಿಸುವುದಿಲ್ಲ, ಹೊಲ ಪರಿಶೀಲನೆ ಅಥವಾ ಸಮಗ್ರ ಕೀಟ ನಿರ್ವಹಣೆಗೆ ಪರ್ಯಾಯವಲ್ಲ.",
    marigold: "ಚೆಂಡು ಹೂವು (ಟ್ಯಾಜೆಟಿಸ್)",
    marigoldNote: "ಸರಿಯಾದ ಟ್ಯಾಜೆಟಿಸ್ ಪ್ರಭೇದ ಮತ್ತು ನೆಡುವ ವಿಧಾನ ಬಳಸಿದಾಗ ಕೆಲವು ತರಕಾರಿ ಪದ್ಧತಿಗಳಲ್ಲಿ ನೆಮಟೋಡ್ ನಿಯಂತ್ರಣಕ್ಕೆ ಬಳಸುತ್ತಾರೆ; ಜೊತೆಯಲ್ಲಿ ನೆಡುವುದರಿಂದ ಖಚಿತ ಚಿಕಿತ್ಸೆ ಸಿಗುವುದಿಲ್ಲ.",
    coriander: "ಕೊತ್ತಂಬರಿ",
    corianderNote: "ಕೆಲವು ಗಿಡಗಳನ್ನು ಹೂಬಿಡಲು ಬಿಡುವುದರಿಂದ ಉಪಕಾರಿ ಕೀಟಗಳು ಆಕರ್ಷಿತವಾಗಬಹುದು; ಇದು ಜೀವವೈವಿಧ್ಯಕ್ಕೆ ನೆರವು, ಖಚಿತ ಕೀಟ ನಿಯಂತ್ರಣವಲ್ಲ.",
    allium: "ಈರುಳ್ಳಿ ಅಥವಾ ಬೆಳ್ಳುಳ್ಳಿ",
    alliumNote: "ಕೆಲವು ಪರಿಸ್ಥಿತಿಯಲ್ಲಿ ಸುವಾಸನೆಯ ಅಲಿಯಂ ಗಿಡಗಳು ಕೆಲವು ಕೀಟಗಳನ್ನು ತಡೆಯಬಹುದು; ಫಲಿತಾಂಶ ಬದಲಾಗುತ್ತದೆ ಮತ್ತು ನೀರು/ಪೋಷಕಾಂಶಕ್ಕೆ ಸ್ಪರ್ಧಿಸಬಹುದು.",
    soilBasisTitle: "ಮಣ್ಣಿನ ಆರೋಗ್ಯದ ಕ್ರಮ ಹೇಗೆ ನಿರ್ಧರಿಸಲಾಗುತ್ತದೆ",
    soilBasis: "ಸೂಕ್ತ ರೈಜೋಬಿಯಾ ಬೇರುಗಳಲ್ಲಿ ಗಂಟು ರಚಿಸಿದಾಗ ಮಾತ್ರ ಬೇಳೆ ಬೆಳೆಗಳು ವಾತಾವರಣದ ಸಾರಜನಕ ಸ್ಥಿರೀಕರಿಸಬಹುದು; ಪ್ರಮಾಣ ಬದಲಾಗುತ್ತದೆ. ಬೆಳೆ ಪರಿವರ್ತನೆ ಮಣ್ಣಿನ ಪರೀಕ್ಷೆ, ಸಮತೋಲಿತ ಪೋಷಕಾಂಶ ನಿರ್ವಹಣೆ ಅಥವಾ ಸ್ಥಳೀಯ ಗೊಬ್ಬರ ಪ್ರಮಾಣಕ್ಕೆ ಪರ್ಯಾಯವಲ್ಲ.",
    localNote: "ಇವು ಶಿಕ್ಷಣದ ಉದ್ದೇಶದ ಆಯ್ಕೆಗಳು, ಸ್ಥಳ ನಿರ್ದಿಷ್ಟ ಸಲಹೆಯಲ್ಲ. ಹಂಗಾಮು, ತಳಿ, ನೀರಿನ ಲಭ್ಯತೆ ಮತ್ತು ಪರಿವರ್ತನೆ ಅಪಾಯವನ್ನು ಸ್ಥಳೀಯ ಕೃಷಿ ವಿಜ್ಞಾನ ಕೇಂದ್ರ ಅಥವಾ ಕೃಷಿ ಅಧಿಕಾರಿಯಿಂದ ದೃಢಪಡಿಸಿ.",
  },
  hi: {
    title: "फसल चक्र और मृदा स्वास्थ्य योजनाकार",
    subtitle: "फसल विविधता और मिट्टी में पोषक तत्वों के चक्र को सहारा देने वाले अगले मौसम के सामान्य विकल्प देखें।",
    label: "मृदा स्वास्थ्य की सामान्य मार्गदर्शिका",
    currentCrop: "वर्तमान / काटी गई फसल",
    soilType: "मिट्टी का प्रकार",
    nextSeason: "अगला मौसम",
    chooseCrop: "अभी काटी गई फसल चुनें",
    chooseSoil: "मिट्टी का प्रकार चुनें",
    kharif: "खरीफ",
    rabi: "रबी",
    zaid: "ज़ायद / गर्मी",
    paddy: "धान",
    ragi: "रागी",
    maize: "मक्का",
    cotton: "कपास",
    pulses: "दलहन",
    tomato: "टमाटर",
    chilli: "मिर्च",
    red: "लाल मिट्टी",
    black: "काली मिट्टी",
    loamy: "दोमट मिट्टी",
    sandy: "रेतीली मिट्टी",
    greenGram: "मूंग",
    cowpea: "लोबिया",
    groundnut: "मूंगफली",
    chickpea: "चना",
    horseGram: "कुल्थी",
    sunflower: "सूरजमुखी",
    rotationMaize: "मक्का",
    rotationRagi: "रागी",
    familyCereal: "अनाज",
    familyLegume: "दलहन",
    familyOilseed: "तिलहन",
    familyFiber: "रेशे वाली फसल",
    familySolanaceous: "सब्ज़ी परिवार",
    recommendationTitle: "अगले मौसम के लिए सुझाई गई फसलें",
    recommendationIntro: "फसल परिवार के चक्र और मिट्टी की सामान्य अनुकूलता के आधार पर क्रम; यह निश्चित उपज या स्थानीय किस्म की सलाह नहीं है।",
    soilMatch: "मिट्टी से सामान्य मेल",
    soilCheck: "स्थानीय अनुकूलता जाँचें",
    legumeReason: "{crop} के बाद दलहन लगाने से, उपयुक्त जड़ जीवाणुओं द्वारा प्रभावी गांठें बनने पर, वायुमंडलीय नाइट्रोजन स्थिर हो सकती है। स्वस्थ अवशेष खेत में रखने से पोषक तत्व वापस मिट्टी में जा सकते हैं।",
    otherLegumeReason: "दलहन फसल चक्र में विविधता ला सकती है; लेकिन स्थानीय कीट या रोग का दबाव अधिक हो तो लगातार उसी दलहन परिवार को न लगाएँ। नाइट्रोजन स्थिरीकरण प्रभावी गांठों पर निर्भर करता है।",
    diversityReason: "यह फसल {crop} से अलग पौधा परिवार की है; फसल चक्र में विविधता और उपयुक्त अवशेष मिट्टी की संरचना व पोषक तत्वों के चक्र को सहारा दे सकते हैं।",
    soilMatchNote: "चुनी गई मिट्टी के लिए इस फसल को सामान्य विकल्प के रूप में सूचीबद्ध किया गया है; उपयुक्तता किस्म, जल-निकासी, बारिश और सिंचाई पर भी निर्भर है।",
    soilCheckNote: "इस सामान्य मार्गदर्शिका में मिट्टी का मेल कम स्पष्ट है। बुवाई से पहले स्थानीय कृषि कर्मचारियों से किस्म और खेत की उपयुक्तता जाँचें।",
    selectInputs: "चुने हुए मौसम के लिए तीन विकल्प देखने हेतु काटी गई फसल और मिट्टी का प्रकार चुनें।",
    companionTitle: "साथ में उगाने योग्य पौधे",
    companionIntro: "ये उदाहरण कुछ प्रणालियों में कीट प्रबंधन या लाभकारी कीटों को सहारा दे सकते हैं; ये सभी कीटों को भरोसेमंद ढंग से नहीं भगाते और निगरानी या समेकित कीट प्रबंधन का विकल्प नहीं हैं।",
    marigold: "गेंदा (Tagetes)",
    marigoldNote: "सही Tagetes प्रकार और रोपण विधि के साथ कुछ सब्ज़ी प्रणालियों में सूत्रकृमि दबाव घटाने के लिए उपयोग होता है; केवल साथ लगाने से उपचार की गारंटी नहीं होती।",
    coriander: "धनिया",
    corianderNote: "कुछ पौधों को फूलने देने से लाभकारी कीट आकर्षित हो सकते हैं; यह जैव विविधता को सहारा देता है, कीट नियंत्रण की गारंटी नहीं।",
    allium: "प्याज़ या लहसुन",
    alliumNote: "कुछ परिस्थितियों में सुगंधित Allium पौधे कुछ कीटों को हतोत्साहित कर सकते हैं; परिणाम अलग-अलग होते हैं और पानी/पोषक तत्वों के लिए प्रतिस्पर्धा हो सकती है।",
    soilBasisTitle: "मृदा स्वास्थ्य के लिए क्रम कैसे तय होता है",
    soilBasis: "दलहन तभी वायुमंडलीय नाइट्रोजन स्थिर कर सकती है जब उपयुक्त राइज़ोबिया जड़ों पर गांठें बनाए; इसकी मात्रा बदलती है। फसल चक्र मिट्टी परीक्षण, संतुलित पोषण प्रबंधन या स्थानीय उर्वरक दरों का विकल्प नहीं है।",
    localNote: "ये शैक्षिक विकल्प हैं, स्थान-विशिष्ट निर्देश नहीं। मौसम, किस्म, पानी की उपलब्धता और फसल चक्र के जोखिम की पुष्टि स्थानीय कृषि विज्ञान केंद्र या कृषि अधिकारी से करें।",
  },
} as const;

const rotationCrops: { id: RotationCropId; family: RotationFamily }[] = [
  { id: "paddy", family: "cereal" },
  { id: "ragi", family: "cereal" },
  { id: "maize", family: "cereal" },
  { id: "cotton", family: "fiber" },
  { id: "pulses", family: "legume" },
  { id: "tomato", family: "solanaceous" },
  { id: "chilli", family: "solanaceous" },
];

const rotationFamilyLabels: Record<RotationFamily, keyof typeof rotationCopy.en> = {
  cereal: "familyCereal",
  legume: "familyLegume",
  oilseed: "familyOilseed",
  fiber: "familyFiber",
  solanaceous: "familySolanaceous",
};

const rotationCandidateData: {
  id: CandidateCropId;
  family: RotationFamily;
  seasons: RotationSeason[];
  soils: RotationSoil[];
}[] = [
  { id: "greenGram", family: "legume", seasons: ["kharif", "zaid"], soils: ["red", "black", "loamy", "sandy"] },
  { id: "cowpea", family: "legume", seasons: ["kharif", "zaid", "rabi"], soils: ["red", "black", "loamy", "sandy"] },
  { id: "groundnut", family: "legume", seasons: ["kharif"], soils: ["red", "loamy", "sandy"] },
  { id: "chickpea", family: "legume", seasons: ["rabi"], soils: ["red", "black", "loamy"] },
  { id: "horseGram", family: "legume", seasons: ["rabi"], soils: ["red", "black", "sandy", "loamy"] },
  { id: "sunflower", family: "oilseed", seasons: ["kharif", "rabi", "zaid"], soils: ["red", "black", "loamy"] },
  { id: "rotationMaize", family: "cereal", seasons: ["kharif", "rabi", "zaid"], soils: ["red", "black", "loamy"] },
  { id: "rotationRagi", family: "cereal", seasons: ["kharif"], soils: ["red", "loamy", "sandy"] },
];

function soilFromRotationProfile(profileSoil: string): RotationSoil | "" {
  if (profileSoil === "Red soil") return "red";
  if (profileSoil === "Black soil") return "black";
  if (profileSoil === "Loamy soil") return "loamy";
  if (profileSoil === "Sandy soil") return "sandy";
  return "";
}

function rankRotationCandidates(currentFamily: RotationFamily, soil: RotationSoil, season: RotationSeason) {
  const ranked = rotationCandidateData
    .filter((crop) => crop.seasons.includes(season))
    .map((crop) => ({
      ...crop,
      soilMatch: crop.soils.includes(soil),
      score: (crop.soils.includes(soil) ? 2 : 0) +
        (crop.family === "legume" && currentFamily !== "legume" ? 4 : 0) +
        (crop.family !== currentFamily ? 2 : 0) -
        (crop.family === "legume" && currentFamily === "legume" ? 3 : 0),
    }))
    .sort((a, b) => b.score - a.score);
  const selected: typeof ranked = [];
  for (const candidate of ranked) {
    if (selected.length === 3) break;
    if (selected.filter((item) => item.family === candidate.family).length >= 2) continue;
    selected.push(candidate);
  }
  return selected;
}

function CropRotationPlanner({ language, profileSoil }: { language: Language; profileSoil: string }) {
  const [currentCrop, setCurrentCrop] = useState<RotationCropId | "">("");
  const [soil, setSoil] = useState<RotationSoil | "">(() => soilFromRotationProfile(profileSoil));
  const [season, setSeason] = useState<RotationSeason>("kharif");
  const rotationLanguage = language === "kn" ? "kn" : "en";
  const t = (key: keyof typeof rotationCopy.en) => rotationCopy[rotationLanguage][key];
  const selectedCrop = rotationCrops.find((crop) => crop.id === currentCrop);
  const recommendations = selectedCrop && soil
    ? rankRotationCandidates(selectedCrop.family, soil, season)
    : [];
  const currentCropLabel = selectedCrop ? t(selectedCrop.id) : "";

  function chooseCrop(value: string) {
    setCurrentCrop(rotationCrops.find((crop) => crop.id === value)?.id ?? "");
  }

  function chooseSoil(value: string) {
    setSoil(value === "red" || value === "black" || value === "loamy" || value === "sandy" ? value : "");
  }

  function chooseSeason(value: string) {
    setSeason(value === "rabi" || value === "zaid" ? value : "kharif");
  }

  return <div className="rotation-planner">
    <div className="page-heading rotation-page-heading">
      <div><div className="eyebrow">{t("label")}</div><h1>{t("title")}</h1><p>{t("subtitle")}</p></div>
      <span className="demo-badge"><i />{t("label")}</span>
    </div>
    <section className="panel rotation-inputs">
      <label htmlFor="rotation-current-crop">{t("currentCrop")}<select id="rotation-current-crop" value={currentCrop} onChange={(event) => chooseCrop(event.target.value)}>
        <option value="">{t("chooseCrop")}</option>{rotationCrops.map((crop) => <option value={crop.id} key={crop.id}>{t(crop.id)}</option>)}
      </select></label>
      <label htmlFor="rotation-soil">{t("soilType")}<select id="rotation-soil" value={soil} onChange={(event) => chooseSoil(event.target.value)}>
        <option value="">{t("chooseSoil")}</option>{(["red", "black", "loamy", "sandy"] as const).map((soilType) => <option value={soilType} key={soilType}>{t(soilType)}</option>)}
      </select></label>
      <label htmlFor="rotation-season">{t("nextSeason")}<select id="rotation-season" value={season} onChange={(event) => chooseSeason(event.target.value)}>
        {(["kharif", "rabi", "zaid"] as const).map((seasonOption) => <option value={seasonOption} key={seasonOption}>{t(seasonOption)}</option>)}
      </select></label>
    </section>

    {recommendations.length > 0 ? <section className="rotation-recommendations">
      <div className="rotation-section-heading"><div><div className="eyebrow">{t("nextSeason")}: {t(season)}</div><h2>{t("recommendationTitle")}</h2><p>{t("recommendationIntro")}</p></div></div>
      <div className="rotation-crop-grid">{recommendations.map((crop, index) => {
        const isLegume = crop.family === "legume";
        const reason = isLegume && selectedCrop?.family !== "legume"
          ? fillTemplate(t("legumeReason"), { "{crop}": currentCropLabel })
          : isLegume
            ? t("otherLegumeReason")
            : fillTemplate(t("diversityReason"), { "{crop}": currentCropLabel });
        return <article className="panel rotation-crop-card" key={crop.id}>
          <div className="rotation-crop-card-top"><span className="rotation-rank">{index + 1}</span><span className={`rotation-family family-${crop.family}`}>{t(rotationFamilyLabels[crop.family])}</span></div>
          <h3>{t(crop.id)}</h3>
          <p>{reason}</p>
          <div className={`rotation-soil-fit ${crop.soilMatch ? "fit-match" : "fit-check"}`}>
            <strong>{crop.soilMatch ? t("soilMatch") : t("soilCheck")}</strong>
            <span>{crop.soilMatch ? t("soilMatchNote") : t("soilCheckNote")}</span>
          </div>
        </article>;
      })}</div>
    </section> : <p className="rotation-empty panel">{t("selectInputs")}</p>}

    <section className="panel rotation-companions">
      <div className="rotation-section-heading"><div><div className="eyebrow">{t("label")}</div><h2>{t("companionTitle")}</h2><p>{t("companionIntro")}</p></div></div>
      <div className="rotation-companion-grid">
        <article><span>✿</span><div><h3>{t("marigold")}</h3><p>{t("marigoldNote")}</p></div></article>
        <article><span>❋</span><div><h3>{t("coriander")}</h3><p>{t("corianderNote")}</p></div></article>
        <article><span>♧</span><div><h3>{t("allium")}</h3><p>{t("alliumNote")}</p></div></article>
      </div>
    </section>
    <aside className="rotation-disclaimer"><span>ⓘ</span><div><strong>{t("soilBasisTitle")}</strong><p>{t("soilBasis")}</p><p>{t("localNote")}</p></div></aside>
  </div>;
}

function Crops({ t, navigate }: PageProps & { navigate: (screen: Screen) => void }) {
  const ideas = [
    { key: "cropRagi" as const, desc: "ragiDesc" as const, icon: "❋", color: "ragi", water: t("waterLowMedium"), duration: `100–120 ${t("dayUnit")}`, tag: languageOf(t) === "kn" ? "ಸಿರಿಧಾನ್ಯ" : languageOf(t) === "hi" ? "मोटा अनाज" : "HARDY MILLET" },
    { key: "cropPulses" as const, desc: "pulsesDesc" as const, icon: "◉", color: "pulse", water: t("waterLow"), duration: `80–100 ${t("dayUnit")}`, tag: languageOf(t) === "kn" ? "ಮಣ್ಣಿನ ಗೆಳೆಯ" : languageOf(t) === "hi" ? "मिट्टी के लिए उपयोगी" : "SOIL FRIENDLY" },
    { key: "cropMaize" as const, desc: "maizeDesc" as const, icon: "✺", color: "maize", water: t("waterMedium"), duration: `90–110 ${t("dayUnit")}`, tag: languageOf(t) === "kn" ? "ಬಹುಮುಖ" : languageOf(t) === "hi" ? "बहुउपयोगी" : "VERSATILE" },
    { key: "cropRice" as const, desc: "riceDesc" as const, icon: "♧", color: "rice", water: t("waterHigh"), duration: `120–150 ${t("dayUnit")}`, tag: languageOf(t) === "kn" ? "ಮುಂಗಾರು ಬೆಳೆ" : languageOf(t) === "hi" ? "खरीफ फसल" : "MONSOON CROP" },
  ];
  return <>
    <PageHeading eyebrow={t("recommended")} title={t("cropTitle")} description={t("cropSub")} t={t} />
    <div className="crop-context"><span className="season-icon">☀</span><div><strong>{t("season")}</strong><small>{t("demoNote")}</small></div><span className="context-arrow">↗</span></div>
    <div className="crop-grid">{ideas.map((crop) => <article className="crop-card panel" key={crop.key}><div className={`crop-art ${crop.color}`}><span>{crop.icon}</span><small>{crop.tag}</small></div><div className="crop-content"><h2>{t(crop.key)}</h2><p>{t(crop.desc)}</p><div className="crop-facts"><span><small>{t("duration")}</small><strong>{crop.duration}</strong></span><span><small>{t("waterNeed")}</small><strong>{crop.water}</strong></span></div><button className="button button-outline" onClick={() => navigate("advisory")}>{t("askAbout")} {t(crop.key)} <span>→</span></button></div></article>)}</div>
    <div className="crop-disclaimer"><span>ⓘ</span>{t("cropTip")}</div>
  </>;
}

type CropDoctorCrop = "paddy" | "ragi" | "tomato" | "cotton" | "maize" | "chilli";
type CropDoctorSymptom = "yellowing" | "brownSpots" | "leafCurling" | "wilting" | "whitePowder" | "borerHoles";
type CropDoctorSeverity = "lowRisk" | "moderateRisk" | "highRisk";
type CropDoctorTreatment = "none" | "fungicide" | "insecticide" | "vector" | "borer";
type ExistingTranslationLanguage = "en" | "kn";
type CachedCropDoctorSelection = { crop: CropDoctorCrop; symptoms: CropDoctorSymptom[]; timestamp: string };
type CropDoctorCondition = {
  name: Record<ExistingTranslationLanguage, string>;
  severity: CropDoctorSeverity;
  treatment: CropDoctorTreatment;
};

function readCachedCropDoctorSelection(): CachedCropDoctorSelection | null {
  try {
    const saved = localStorage.getItem(CROP_DOCTOR_CACHE_KEY);
    if (!saved) return null;
    const value: unknown = JSON.parse(saved);
    const cropIds: CropDoctorCrop[] = ["paddy", "ragi", "tomato", "cotton", "maize", "chilli"];
    const symptomIds: CropDoctorSymptom[] = ["yellowing", "brownSpots", "leafCurling", "wilting", "whitePowder", "borerHoles"];
    if (
      !value || typeof value !== "object" || !("crop" in value) || !("symptoms" in value) || !("timestamp" in value) ||
      typeof value.crop !== "string" || !cropIds.includes(value.crop as CropDoctorCrop) ||
      !Array.isArray(value.symptoms) || !value.symptoms.length ||
      !value.symptoms.every((symptom: unknown) => typeof symptom === "string" && symptomIds.includes(symptom as CropDoctorSymptom)) ||
      !validTimestamp(value.timestamp)
    ) throw new Error("Cached crop advisory has an invalid format.");
    return { crop: value.crop as CropDoctorCrop, symptoms: value.symptoms as CropDoctorSymptom[], timestamp: value.timestamp };
  } catch (error) {
    console.error("Could not read the cached crop advisory.", error);
    return null;
  }
}

const cropDoctorCrops: { id: CropDoctorCrop; label: keyof typeof text.en }[] = [
  { id: "paddy", label: "cropRice" },
  { id: "ragi", label: "cropRagi" },
  { id: "tomato", label: "cropDoctorTomato" },
  { id: "cotton", label: "cropDoctorCotton" },
  { id: "maize", label: "cropMaize" },
  { id: "chilli", label: "cropDoctorChilli" },
];

const cropDoctorSymptoms: { id: CropDoctorSymptom; label: keyof typeof text.en; icon: string }[] = [
  { id: "yellowing", label: "cropDoctorYellowing", icon: "🍃" },
  { id: "brownSpots", label: "cropDoctorBrownSpots", icon: "◉" },
  { id: "leafCurling", label: "cropDoctorLeafCurling", icon: "〰" },
  { id: "wilting", label: "cropDoctorWilting", icon: "🥀" },
  { id: "whitePowder", label: "cropDoctorWhitePowder", icon: "☁" },
  { id: "borerHoles", label: "cropDoctorBorerHoles", icon: "⊙" },
];

const cropDoctorAdvice: Record<CropDoctorSymptom, { organic: keyof typeof text.en; prevention: keyof typeof text.en }> = {
  yellowing: { organic: "cropDoctorOrganicYellow", prevention: "cropDoctorPreventYellow" },
  brownSpots: { organic: "cropDoctorOrganicSpots", prevention: "cropDoctorPreventSpots" },
  leafCurling: { organic: "cropDoctorOrganicCurl", prevention: "cropDoctorPreventCurl" },
  wilting: { organic: "cropDoctorOrganicWilt", prevention: "cropDoctorPreventWilt" },
  whitePowder: { organic: "cropDoctorOrganicPowder", prevention: "cropDoctorPreventPowder" },
  borerHoles: { organic: "cropDoctorOrganicBorer", prevention: "cropDoctorPreventBorer" },
};

function cropDoctorCondition(
  en: string,
  kn: string,
  severity: CropDoctorSeverity,
  treatment: CropDoctorTreatment,
): CropDoctorCondition {
  return { name: { en, kn }, severity, treatment };
}

const cropDoctorConditions: Record<CropDoctorCrop, Record<CropDoctorSymptom, CropDoctorCondition>> = {
  paddy: {
    yellowing: cropDoctorCondition("Nutrient or water stress (cause not confirmed)", "ಪೋಷಕಾಂಶ ಅಥವಾ ನೀರಿನ ಒತ್ತಡ (ಕಾರಣ ದೃಢಪಟ್ಟಿಲ್ಲ)", "moderateRisk", "none"),
    brownSpots: cropDoctorCondition("Rice brown spot (possible)", "ಭತ್ತದ ಕಂದು ಚುಕ್ಕೆ ರೋಗ (ಸಾಧ್ಯತೆ)", "moderateRisk", "fungicide"),
    leafCurling: cropDoctorCondition("Possible leaf-folder feeding if leaves are folded and scraped", "ಎಲೆ ಮಡಚಿ ಕೆರೆತವಿದ್ದರೆ ಎಲೆ ಸುರುಳಿ ಕೀಟದ ಹಾನಿ ಸಾಧ್ಯ", "moderateRisk", "insecticide"),
    wilting: cropDoctorCondition("Water stress or a root problem (needs field check)", "ನೀರಿನ ಒತ್ತಡ ಅಥವಾ ಬೇರು ಸಮಸ್ಯೆ (ಹೊಲ ಪರಿಶೀಲನೆ ಅಗತ್ಯ)", "highRisk", "none"),
    whitePowder: cropDoctorCondition("White growth not identified; powdery disease is not typical from this sign alone", "ಬಿಳಿ ಬೆಳವಣಿಗೆ ಗುರುತಿಸಲಾಗಿಲ್ಲ; ಈ ಲಕ್ಷಣದಿಂದ ಮಾತ್ರ ಪುಡಿ ರೋಗವೆಂದು ಹೇಳಲಾಗದು", "lowRisk", "none"),
    borerHoles: cropDoctorCondition("Rice stem-borer damage (check for dead hearts or white ears)", "ಭತ್ತದ ಕಾಂಡ ಕೊರೆಯುವ ಕೀಟದ ಹಾನಿ (ಒಣಗಿದ ಮಧ್ಯ ಚಿಗುರು ಅಥವಾ ಬಿಳಿ ತೆನೆ ಪರಿಶೀಲಿಸಿ)", "highRisk", "borer"),
  },
  ragi: {
    yellowing: cropDoctorCondition("Nutrient or water stress (cause not confirmed)", "ಪೋಷಕಾಂಶ ಅಥವಾ ನೀರಿನ ಒತ್ತಡ (ಕಾರಣ ದೃಢಪಟ್ಟಿಲ್ಲ)", "moderateRisk", "none"),
    brownSpots: cropDoctorCondition("Finger-millet blast or another leaf spot (possible)", "ರಾಗಿ ಬೆಂಕಿ ರೋಗ ಅಥವಾ ಇತರೆ ಎಲೆ ಚುಕ್ಕೆ ರೋಗ (ಸಾಧ್ಯತೆ)", "highRisk", "fungicide"),
    leafCurling: cropDoctorCondition("Possible aphid or mite injury if pests are visible", "ಕೀಟಗಳು ಕಂಡುಬಂದರೆ ಹೇನು ಅಥವಾ ಮೈಟ್ ಹಾನಿ ಸಾಧ್ಯ", "moderateRisk", "insecticide"),
    wilting: cropDoctorCondition("Water stress or a root problem (needs field check)", "ನೀರಿನ ಒತ್ತಡ ಅಥವಾ ಬೇರು ಸಮಸ್ಯೆ (ಹೊಲ ಪರಿಶೀಲನೆ ಅಗತ್ಯ)", "highRisk", "none"),
    whitePowder: cropDoctorCondition("Powdery mildew (possible)", "ಪುಡಿ ಶಿಲೀಂಧ್ರ ರೋಗ (ಸಾಧ್ಯತೆ)", "moderateRisk", "fungicide"),
    borerHoles: cropDoctorCondition("Stem-borer damage (confirm the insect)", "ಕಾಂಡ ಕೊರೆಯುವ ಕೀಟದ ಹಾನಿ (ಕೀಟ ದೃಢಪಡಿಸಿ)", "highRisk", "borer"),
  },
  tomato: {
    yellowing: cropDoctorCondition("Nutrient or water stress; also inspect for whiteflies", "ಪೋಷಕಾಂಶ ಅಥವಾ ನೀರಿನ ಒತ್ತಡ; ಬಿಳಿನೊಣಗಳನ್ನೂ ಪರಿಶೀಲಿಸಿ", "moderateRisk", "none"),
    brownSpots: cropDoctorCondition("Early blight or another tomato leaf spot (possible)", "ಆರಂಭಿಕ ಅಂಗಮಾರಿ ಅಥವಾ ಇತರೆ ಟೊಮೇಟೊ ಎಲೆ ಚುಕ್ಕೆ ರೋಗ (ಸಾಧ್ಯತೆ)", "moderateRisk", "fungicide"),
    leafCurling: cropDoctorCondition("Tomato leaf-curl virus is possible, often associated with whiteflies", "ಬಿಳಿನೊಣಗಳೊಂದಿಗೆ ಸಂಬಂಧಿಸಿದ ಟೊಮೇಟೊ ಎಲೆ ಮುದುಡು ವೈರಸ್ ಸಾಧ್ಯತೆ", "highRisk", "vector"),
    wilting: cropDoctorCondition("Bacterial wilt, another root disease, or water stress", "ಬ್ಯಾಕ್ಟೀರಿಯಾ ಬಾಡುವಿಕೆ, ಬೇರು ರೋಗ ಅಥವಾ ನೀರಿನ ಒತ್ತಡ", "highRisk", "none"),
    whitePowder: cropDoctorCondition("Powdery mildew (possible)", "ಪುಡಿ ಶಿಲೀಂಧ್ರ ರೋಗ (ಸಾಧ್ಯತೆ)", "moderateRisk", "fungicide"),
    borerHoles: cropDoctorCondition("Fruit-borer injury if holes are on fruit; stem holes need confirmation", "ಹಣ್ಣಿನಲ್ಲಿ ರಂಧ್ರವಿದ್ದರೆ ಹಣ್ಣು ಕೊರೆಯುವ ಕೀಟ ಸಾಧ್ಯ; ಕಾಂಡದ ರಂಧ್ರ ದೃಢಪಡಿಸಿ", "highRisk", "borer"),
  },
  cotton: {
    yellowing: cropDoctorCondition("Nutrient stress or sucking-pest injury (inspect leaf undersides)", "ಪೋಷಕಾಂಶದ ಒತ್ತಡ ಅಥವಾ ಹೀರುವ ಕೀಟದ ಹಾನಿ (ಎಲೆಯ ಕೆಳಭಾಗ ನೋಡಿ)", "moderateRisk", "none"),
    brownSpots: cropDoctorCondition("Alternaria or another cotton leaf spot (possible)", "ಆಲ್ಟರ್ನೇರಿಯಾ ಅಥವಾ ಇತರೆ ಹತ್ತಿ ಎಲೆ ಚುಕ್ಕೆ ರೋಗ (ಸಾಧ್ಯತೆ)", "moderateRisk", "fungicide"),
    leafCurling: cropDoctorCondition("Cotton leaf-curl disease is possible; check for whiteflies", "ಹತ್ತಿ ಎಲೆ ಮುದುಡು ರೋಗ ಸಾಧ್ಯತೆ; ಬಿಳಿನೊಣ ಪರಿಶೀಲಿಸಿ", "highRisk", "vector"),
    wilting: cropDoctorCondition("Fusarium wilt, root disease, or water stress", "ಫ್ಯುಸೇರಿಯಂ ಬಾಡುವಿಕೆ, ಬೇರು ರೋಗ ಅಥವಾ ನೀರಿನ ಒತ್ತಡ", "highRisk", "none"),
    whitePowder: cropDoctorCondition("Powdery mildew (possible)", "ಪುಡಿ ಶಿಲೀಂಧ್ರ ರೋಗ (ಸಾಧ್ಯತೆ)", "moderateRisk", "fungicide"),
    borerHoles: cropDoctorCondition("Bollworm injury if holes are on bolls; stem damage needs confirmation", "ಕಾಯಿಯಲ್ಲಿ ರಂಧ್ರವಿದ್ದರೆ ಕಾಯಿಕೊರಕ ಕೀಟದ ಹಾನಿ ಸಾಧ್ಯ; ಕಾಂಡದ ಹಾನಿ ದೃಢಪಡಿಸಿ", "highRisk", "borer"),
  },
  maize: {
    yellowing: cropDoctorCondition("Nutrient or water stress (cause not confirmed)", "ಪೋಷಕಾಂಶ ಅಥವಾ ನೀರಿನ ಒತ್ತಡ (ಕಾರಣ ದೃಢಪಟ್ಟಿಲ್ಲ)", "moderateRisk", "none"),
    brownSpots: cropDoctorCondition("Turcicum leaf blight or another leaf spot (possible)", "ಟರ್ಸಿಕಂ ಎಲೆ ಅಂಗಮಾರಿ ಅಥವಾ ಇತರೆ ಎಲೆ ಚುಕ್ಕೆ ರೋಗ (ಸಾಧ್ಯತೆ)", "highRisk", "fungicide"),
    leafCurling: cropDoctorCondition("Fall-armyworm feeding is possible if windowing or frass is present", "ಎಲೆ ಕಿಟಕಿ ಗುರುತು ಅಥವಾ ಮಲ ಕಂಡರೆ ಸೈನಿಕ ಹುಳುವಿನ ಹಾನಿ ಸಾಧ್ಯ", "highRisk", "insecticide"),
    wilting: cropDoctorCondition("Stalk or root rot, or water stress (needs field check)", "ಕಾಂಡ ಅಥವಾ ಬೇರು ಕೊಳೆ, ಅಥವಾ ನೀರಿನ ಒತ್ತಡ (ಹೊಲ ಪರಿಶೀಲನೆ ಅಗತ್ಯ)", "highRisk", "none"),
    whitePowder: cropDoctorCondition("Downy mildew is possible if pale growth is on leaf undersides", "ಎಲೆಯ ಕೆಳಭಾಗದಲ್ಲಿ ಬಿಳಿ ಬೆಳವಣಿಗೆಯಿದ್ದರೆ ಶಿಲೀಂಧ್ರ ರೋಗ ಸಾಧ್ಯ", "highRisk", "fungicide"),
    borerHoles: cropDoctorCondition("Maize stem-borer damage (confirm the insect)", "ಮೆಕ್ಕೆಜೋಳದ ಕಾಂಡ ಕೊರೆಯುವ ಕೀಟದ ಹಾನಿ (ಕೀಟ ದೃಢಪಡಿಸಿ)", "highRisk", "borer"),
  },
  chilli: {
    yellowing: cropDoctorCondition("Nutrient stress or thrips/mites (inspect leaf undersides)", "ಪೋಷಕಾಂಶದ ಒತ್ತಡ ಅಥವಾ ಥ್ರಿಪ್ಸ್/ಮೈಟ್ (ಎಲೆಯ ಕೆಳಭಾಗ ನೋಡಿ)", "moderateRisk", "none"),
    brownSpots: cropDoctorCondition("Leaf spot or anthracnose (possible; check whether fruit is affected)", "ಎಲೆ ಚುಕ್ಕೆ ಅಥವಾ ಆಂಥ್ರಾಕ್ನೋಸ್ ರೋಗ (ಸಾಧ್ಯತೆ; ಹಣ್ಣು ಬಾಧಿತವೇ ನೋಡಿ)", "moderateRisk", "fungicide"),
    leafCurling: cropDoctorCondition("Thrips/mites or viral leaf-curl disease (inspect for pests)", "ಥ್ರಿಪ್ಸ್/ಮೈಟ್ ಅಥವಾ ವೈರಸ್ ಎಲೆ ಮುದುಡು ರೋಗ (ಕೀಟ ಪರಿಶೀಲಿಸಿ)", "highRisk", "vector"),
    wilting: cropDoctorCondition("Bacterial wilt, root disease, or water stress", "ಬ್ಯಾಕ್ಟೀರಿಯಾ ಬಾಡುವಿಕೆ, ಬೇರು ರೋಗ ಅಥವಾ ನೀರಿನ ಒತ್ತಡ", "highRisk", "none"),
    whitePowder: cropDoctorCondition("Powdery mildew (possible)", "ಪುಡಿ ಶಿಲೀಂಧ್ರ ರೋಗ (ಸಾಧ್ಯತೆ)", "moderateRisk", "fungicide"),
    borerHoles: cropDoctorCondition("Fruit-borer injury if holes are on fruit; stem holes need confirmation", "ಹಣ್ಣಿನಲ್ಲಿ ರಂಧ್ರವಿದ್ದರೆ ಹಣ್ಣು ಕೊರೆಯುವ ಕೀಟದ ಹಾನಿ ಸಾಧ್ಯ; ಕಾಂಡದ ರಂಧ್ರ ದೃಢಪಡಿಸಿ", "highRisk", "borer"),
  },
};

const cropDoctorTreatmentLabels: Record<CropDoctorTreatment, keyof typeof text.en> = {
  none: "cropDoctorChemicalNone",
  fungicide: "cropDoctorChemicalFungicide",
  insecticide: "cropDoctorChemicalInsecticide",
  vector: "cropDoctorChemicalVector",
  borer: "cropDoctorChemicalBorer",
};

function CropDoctor({ t }: PageProps) {
  const [cachedSelection] = useState(readCachedCropDoctorSelection);
  const [crop, setCrop] = useState<CropDoctorCrop | "">(cachedSelection?.crop ?? "");
  const [symptoms, setSymptoms] = useState<CropDoctorSymptom[]>(cachedSelection?.symptoms ?? []);
  const selectedLanguage = languageOf(t);
  const language = selectedLanguage === "hi" ? "en" : selectedLanguage;

  useEffect(() => {
    try {
      if (crop && symptoms.length) {
        localStorage.setItem(CROP_DOCTOR_CACHE_KEY, JSON.stringify({ crop, symptoms, timestamp: new Date().toISOString() }));
      } else {
        localStorage.removeItem(CROP_DOCTOR_CACHE_KEY);
      }
    } catch (error) {
      console.error("Could not cache the active crop advisory.", error);
    }
  }, [crop, symptoms]);

  function toggleSymptom(symptom: CropDoctorSymptom) {
    setSymptoms((current) => current.includes(symptom)
      ? current.filter((selected) => selected !== symptom)
      : [...current, symptom]);
  }

  return <>
    <PageHeading eyebrow={t("cropDoctorGuide")} title={t("cropDoctorTitle")} description={t("cropDoctorSub")} t={t} badge={t("demo")} />
    <section className="crop-doctor-intro panel">
      <label htmlFor="crop-doctor-crop">{t("cropDoctorCrop")}
        <select id="crop-doctor-crop" value={crop} onChange={(event) => {
          setCrop(cropDoctorCrops.find((option) => option.id === event.target.value)?.id ?? "");
          setSymptoms([]);
        }}>
          <option value="">{t("cropDoctorChooseCrop")}</option>
          {cropDoctorCrops.map((option) => <option value={option.id} key={option.id}>{t(option.label)}</option>)}
        </select>
      </label>
      <div className="crop-doctor-symptom-area">
        <div className="crop-doctor-symptom-heading"><strong>{t("cropDoctorSymptoms")}</strong><span>{t("cropDoctorChooseSymptoms")}</span></div>
        <div className="crop-doctor-tags">{cropDoctorSymptoms.map((symptom) =>
          <button type="button" className={`crop-doctor-tag ${symptoms.includes(symptom.id) ? "selected" : ""}`}
            key={symptom.id} disabled={!crop} aria-pressed={symptoms.includes(symptom.id)}
            onClick={() => toggleSymptom(symptom.id)}>
            <span aria-hidden="true">{symptom.icon}</span>{t(symptom.label)}
          </button>)}</div>
      </div>
      {symptoms.length > 0 && <button className="text-link crop-doctor-clear" onClick={() => setSymptoms([])}>{t("cropDoctorClearSymptoms")}</button>}
    </section>

    {crop && symptoms.length > 0
      ? <section className="crop-doctor-results" aria-live="polite">
        {symptoms.map((symptom) => {
          const diagnosis = cropDoctorConditions[crop][symptom];
          const advice = cropDoctorAdvice[symptom];
          const cropLabel = t(cropDoctorCrops.find((option) => option.id === crop)?.label ?? "cropDoctorCrop");
          const symptomLabel = t(cropDoctorSymptoms.find((option) => option.id === symptom)?.label ?? "cropDoctorSymptoms");
          const organic = t(advice.organic);
          const chemical = t(cropDoctorTreatmentLabels[diagnosis.treatment]);
          const prevention = t(advice.prevention);
          const shareMessage = fillTemplate(t("cropDoctorShareMessage"), {
            "{crop}": cropLabel,
            "{symptom}": symptomLabel,
            "{diagnosis}": diagnosis.name[language === "kn" ? "kn" : "en"],
            "{severity}": t(diagnosis.severity),
            "{organic}": organic,
            "{chemical}": chemical,
            "{prevention}": prevention,
          });
          return <article className="panel crop-doctor-result" key={`${crop}-${symptom}`}>
            <div className="crop-doctor-result-heading">
              <span className="crop-doctor-result-icon">{cropDoctorSymptoms.find((option) => option.id === symptom)?.icon}</span>
              <div><div className="eyebrow">{t("cropDoctorPossibleIssue")}</div><h2>{diagnosis.name[language === "kn" ? "kn" : "en"]}</h2></div>
              <span className={`crop-doctor-severity severity-${diagnosis.severity}`}><small>{t("cropDoctorSeverity")}</small><strong>{t(diagnosis.severity)}</strong></span>
            </div>
            <div className="crop-doctor-advice-grid">
              <section><h3><span>✿</span>{t("cropDoctorOrganic")}</h3><p>{organic}</p></section>
              <section><h3><span>⚕</span>{t("cropDoctorChemical")}</h3><p>{chemical}</p></section>
              <section><h3><span>✓</span>{t("cropDoctorPrevention")}</h3><p>{prevention}</p></section>
            </div>
            <div className="crop-doctor-share-row"><button type="button" className="button button-outline whatsapp-share" onClick={() => shareOnWhatsApp(shareMessage)}><span aria-hidden="true">◉</span>{t("shareWhatsapp")}</button></div>
          </article>;
        })}
      </section>
      : <p className="crop-doctor-empty panel">{t("cropDoctorNoSelection")}</p>}

    <aside className="crop-doctor-disclaimer"><span>ⓘ</span><div><strong>{t("cropDoctorDisclaimer")}</strong><p>{t("cropDoctorSafety")}</p></div></aside>
  </>;
}

function Advisory({ t, language, messages, input, setInput, send }: PageProps & { language: Language; messages: ChatMessage[]; input: string; setInput: (value: string) => void; send: (message?: string) => void }) {
  const copy = advisoryCopy[language] ?? advisoryCopy.en;
  const welcomeText = `${copy.introduction}\n\n${copy.safetyNote}`;
  return <>
    <PageHeading eyebrow={t("demoChat")} title={t("advisoryTitle")} description={t("advisorySub")} t={t} />
    <div className="chat-layout">
      <section className="chat-window panel"><div className="chat-top"><div className="chat-avatar">✳</div><div><strong>KrishiMitra</strong><small><i /> {language === "kn" ? "ಡೆಮೋ ಸಹಾಯಕ · ಆಫ್‌ಲೈನ್" : language === "hi" ? "डेमो सहायक · ऑफ़लाइन" : "Topic-based farm guide"}</small></div><span className="demo-badge"><i />{t("demo")}</span></div>
        <div className="chat-messages">
          <div className="message mitra-message"><span className="message-avatar">✳</span><div className="message-content"><p>{welcomeText}</p><SpeakButton t={t} textToSpeak={welcomeText} language={language} /></div></div>
          {messages.map((message, index) => <div className={`message ${message.from === "farmer" ? "farmer-message" : "mitra-message"}`} key={`${index}-${message.text}`}>
            {message.from === "mitra" && <span className="message-avatar">✳</span>}
            <div className="message-content"><p>{message.text}</p>{message.from === "mitra" && <SpeakButton t={t} textToSpeak={message.text} language={message.language ?? language} />}</div>
          </div>)}
        </div>
        <div className="chat-prompts"><span>{copy.promptsLabel}</span><div>{copy.prompts.map((prompt) => <button type="button" key={prompt} onClick={() => send(prompt)}>{prompt} <b>↗</b></button>)}</div></div>
        <form className="chat-compose" onSubmit={(event: FormEvent) => { event.preventDefault(); send(); }}><input value={input} onChange={(event) => setInput(event.target.value)} placeholder={t("chatPlaceholder")} aria-label={t("chatPlaceholder")} /><button type="submit" disabled={!input.trim()}>{t("send")} <span>↑</span></button></form>
      </section>
      <aside className="chat-side panel"><span className="side-spark">✳</span><div className="eyebrow">{language === "kn" ? "ನಮ್ಮಿಂದ ಒಂದು ಮಾತು" : language === "hi" ? "हमारी ओर से एक बात" : "A NOTE FROM US"}</div><h2>{language === "kn" ? "ಉತ್ತಮ ಸಲಹೆ ಸ್ಥಳೀಯವಾಗಿ ಬೆಳೆಯುತ್ತದೆ." : language === "hi" ? "अच्छी सलाह स्थानीय अनुभव से मिलती है।" : "Good advice grows locally."}</h2><p>{t("reply")}</p><div className="chat-side-bottom"><span>☘</span>{language === "kn" ? "ಸ್ಥಳೀಯ ತಜ್ಞರೇ ನಿಮ್ಮ ಉತ್ತಮ ಮಾರ್ಗದರ್ಶಕರು." : language === "hi" ? "स्थानीय कृषि विशेषज्ञ आपके सबसे अच्छे मार्गदर्शक हैं।" : "Your local experts are your best guide."}</div></aside>
    </div>
  </>;
}

function Settings({ t, language, setLanguage, profile, clearProfile, navigate }: PageProps & { language: Language; setLanguage: (language: Language) => void; profile: FarmerProfile | null; clearProfile: () => void; navigate: (screen: Screen) => void }) {
  return <>
    <PageHeading eyebrow={t("settingsTitle")} title={t("settingsTitle")} description={t("settingsSub")} t={t} />
    <div className="settings-layout">
      <section className="panel settings-card"><div className="settings-icon">文</div><div className="settings-card-main"><h2>{t("language")}</h2><p>{t("chooseLanguage")}</p><div className="language-options">
        <button className={language === "en" ? "chosen" : ""} onClick={() => setLanguage("en")}><span>EN</span>English {language === "en" && <b>✓</b>}</button>
        <button className={language === "kn" ? "chosen" : ""} onClick={() => setLanguage("kn")}><span>ಕ</span>ಕನ್ನಡ {language === "kn" && <b>✓</b>}</button>
        <button className={language === "hi" ? "chosen" : ""} onClick={() => setLanguage("hi")}><span>हि</span>हिंदी {language === "hi" && <b>✓</b>}</button>
        <button className={language === "te" ? "chosen" : ""} onClick={() => setLanguage("te")}><span>తె</span>తెలుగు {language === "te" && <b>✓</b>}</button>
        <button className={language === "ta" ? "chosen" : ""} onClick={() => setLanguage("ta")}><span>த</span>தமிழ் {language === "ta" && <b>✓</b>}</button>
        <button className={language === "mr" ? "chosen" : ""} onClick={() => setLanguage("mr")}><span>म</span>मराठी {language === "mr" && <b>✓</b>}</button>
      </div></div></section>
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
      <label>{t("fullName")} *<input value={form.name} onChange={(event) => update("name", event.target.value)} placeholder={languageOf(t) === "kn" ? "ಉದಾ. ಲಕ್ಷ್ಮಿ" : languageOf(t) === "hi" ? "उदा. लक्ष्मी" : "e.g. Lakshmi"} required /></label>
      <label>{t("village")} *<input value={form.village} onChange={(event) => update("village", event.target.value)} placeholder={languageOf(t) === "kn" ? "ನಿಮ್ಮ ಗ್ರಾಮ" : languageOf(t) === "hi" ? "आपका गाँव" : "Your village"} required /></label>
      <label>{t("district")} *<input value={form.district} onChange={(event) => update("district", event.target.value)} placeholder={languageOf(t) === "kn" ? "ನಿಮ್ಮ ಜಿಲ್ಲೆ" : languageOf(t) === "hi" ? "आपका जिला" : "Your district"} required /></label>
      <label>{t("land")}<input type="number" min="0" step="0.1" value={form.land} onChange={(event) => update("land", event.target.value)} placeholder="e.g. 2.5" /></label>
      <label>{t("soilChoice")}<select value={form.soil} onChange={(event) => update("soil", event.target.value)}><option value="">{t("chooseOne")}</option>{soilOptions.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label>
      <label>{t("irrigation")}<select value={form.irrigation} onChange={(event) => update("irrigation", event.target.value)}><option value="">{t("chooseOne")}</option>{waterOptions.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label>
      <div className="form-footer"><span>🔒 &nbsp;{t("savedLocally")}</span><button type="submit" className="button button-primary">{t("saveProfile")} <span>→</span></button></div>
    </form>
  </section>;
}

export default App;
