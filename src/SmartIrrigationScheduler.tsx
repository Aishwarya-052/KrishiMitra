import { useState } from "react";
import type { WeatherForecast, WeatherLocation } from "./weatherService";

type Language = "en" | "kn";
type Crop = "paddy" | "ragi" | "tomato" | "cotton" | "maize" | "chilli" | "pulses";
type Soil = "red" | "black" | "loamy" | "sandy";
type Stage = "sowing" | "vegetative" | "flowering" | "harvesting";
type Moisture = "dry" | "adequate" | "wet";
type IrrigationStatus = "missing" | "weatherMissing" | "rain" | "adequate" | "wet" | "harvest" | "irrigate";

const copy = {
  en: {
    title: "Smart Irrigation Scheduler",
    subtitle: "Use your field observations and the local forecast to plan today's irrigation.",
    label: "WEATHER-AWARE PLANNING",
    crop: "Selected crop",
    soil: "Soil type",
    stage: "Growth stage",
    moisture: "Your soil moisture check",
    chooseCrop: "Choose a crop",
    chooseSoil: "Choose soil type",
    chooseStage: "Choose growth stage",
    chooseMoisture: "Select what you observe",
    paddy: "Paddy",
    ragi: "Ragi",
    tomato: "Tomato",
    cotton: "Cotton",
    maize: "Maize",
    chilli: "Chilli",
    pulses: "Pulses",
    redSoil: "Red Soil",
    blackSoil: "Black Cotton Soil",
    loamySoil: "Loamy",
    sandySoil: "Sandy",
    sowing: "Sowing",
    vegetative: "Vegetative",
    flowering: "Flowering",
    harvesting: "Harvesting",
    dry: "Dry",
    adequate: "Adequately moist",
    wet: "Wet / waterlogged",
    fieldCheckNote: "This is your own field observation, not a sensor reading. Check soil near the active root zone.",
    weather: "Current weather and today's rain forecast",
    noForecast: "Select a location on the Weather screen to load a live forecast. No rain status is assumed without it.",
    currentTemp: "Current temperature",
    rainChance: "Today's rain chance",
    expectedRain: "Forecast rainfall",
    location: "Forecast location",
    yesIrrigate: "Irrigate today",
    noIrrigate: "Do not irrigate today",
    checkFirst: "Check before deciding",
    cannotDecide: "Decision unavailable",
    result: "Today's irrigation decision",
    quantity: "Planning water volume per acre",
    bestTime: "Best time to water",
    morning: "Early morning (about 6–9 AM), when convenient.",
    noWater: "0 L/acre today",
    depth: "Planning depth",
    rainAlert: "Rain is forecast. Skip or delay irrigation today and reassess soil moisture after the rain; forecast rainfall is not guaranteed.",
    adequateAlert: "You marked the soil as adequately moist. Skip today's irrigation and check again later; this is your observation, not a sensor measurement.",
    wetAlert: "You marked the soil as wet. Do not irrigate now; check drainage and reassess after the field drains.",
    harvestAlert: "Harvesting stage selected. This generic scheduler does not recommend an irrigation event at harvest; follow crop- and harvest-specific local guidance.",
    irrigateAlert: "Your field check is dry and no rain threshold was reached in today's forecast. Use the planning estimate below only as a starting point and verify locally.",
    missingAlert: "Choose a crop, soil type, growth stage, and soil moisture observation to get a decision.",
    weatherMissingAlert: "A live forecast is required for a rain-aware decision. Set a Weather location and try again.",
    soilGuidance: "Soil handling note",
    soilRed: "Red soil can drain quickly; check the root zone again rather than relying on a fixed interval.",
    soilBlack: "Black cotton soil can hold water; avoid repeated irrigation while the root zone remains moist.",
    soilLoamy: "Check root-zone moisture and recent rainfall before repeating irrigation.",
    soilSandy: "Sandy soil drains quickly; consider smaller, more frequent applications instead of one large dose.",
    paddyNote: "Paddy water management often uses field-water-depth practices; this generic volume is not a paddy-specific irrigation prescription.",
    estimateDisclaimer: "Water quantity is an illustrative planning estimate using a generic event depth by growth stage (sowing 10 mm, vegetative 15 mm, flowering 20 mm, harvesting 0 mm). One millimetre over one acre is about 4,047 litres. It is not calculated from crop evapotranspiration, measured soil-water deficit, irrigation efficiency, or a validated local schedule. Confirm with your KVK/agriculture officer.",
    statusRain: "RAIN FORECAST",
    statusLive: "OPEN-METEO FORECAST",
    forecastUnavailable: "FORECAST UNAVAILABLE",
    dailyValuesUnavailable: "Today's rainfall probability and amount are not available in the loaded forecast.",
  },
  kn: {
    title: "ಸ್ಮಾರ್ಟ್ ನೀರಾವರಿ ವೇಳಾಪಟ್ಟಿ",
    subtitle: "ಇಂದಿನ ನೀರಾವರಿ ಯೋಜಿಸಲು ನಿಮ್ಮ ಹೊಲದ ಪರಿಶೀಲನೆ ಮತ್ತು ಸ್ಥಳೀಯ ಮುನ್ಸೂಚನೆ ಬಳಸಿ.",
    label: "ಹವಾಮಾನ ಆಧಾರಿತ ಯೋಜನೆ",
    crop: "ಆಯ್ಕೆ ಮಾಡಿದ ಬೆಳೆ",
    soil: "ಮಣ್ಣಿನ ಪ್ರಕಾರ",
    stage: "ಬೆಳವಣಿಗೆಯ ಹಂತ",
    moisture: "ನಿಮ್ಮ ಮಣ್ಣಿನ ತೇವಾಂಶ ಪರಿಶೀಲನೆ",
    chooseCrop: "ಬೆಳೆ ಆಯ್ಕೆಮಾಡಿ",
    chooseSoil: "ಮಣ್ಣಿನ ಪ್ರಕಾರ ಆಯ್ಕೆಮಾಡಿ",
    chooseStage: "ಬೆಳವಣಿಗೆಯ ಹಂತ ಆಯ್ಕೆಮಾಡಿ",
    chooseMoisture: "ನೀವು ಗಮನಿಸಿದ ಸ್ಥಿತಿ ಆಯ್ಕೆಮಾಡಿ",
    paddy: "ಭತ್ತ",
    ragi: "ರಾಗಿ",
    tomato: "ಟೊಮೇಟೊ",
    cotton: "ಹತ್ತಿ",
    maize: "ಮೆಕ್ಕೆಜೋಳ",
    chilli: "ಮೆಣಸಿನಕಾಯಿ",
    pulses: "ಬೇಳೆಕಾಳು",
    redSoil: "ಕೆಂಪು ಮಣ್ಣು",
    blackSoil: "ಕಪ್ಪು ಹತ್ತಿ ಮಣ್ಣು",
    loamySoil: "ಲೋಮಿ ಮಣ್ಣು",
    sandySoil: "ಮರಳು ಮಣ್ಣು",
    sowing: "ಬಿತ್ತನೆ",
    vegetative: "ಸಸ್ಯ ಬೆಳವಣಿಗೆ",
    flowering: "ಹೂಬಿಡುವ ಹಂತ",
    harvesting: "ಕೊಯ್ಲು",
    dry: "ಒಣ",
    adequate: "ಸಾಕಷ್ಟು ತೇವವಾಗಿದೆ",
    wet: "ತೇವ / ನೀರು ನಿಂತಿದೆ",
    fieldCheckNote: "ಇದು ನಿಮ್ಮ ಹೊಲದ ಸ್ವಂತ ಪರಿಶೀಲನೆ; ಸೆನ್ಸರ್ ಅಳತೆಯಲ್ಲ. ಸಕ್ರಿಯ ಬೇರು ವಲಯದ ಮಣ್ಣನ್ನು ಪರಿಶೀಲಿಸಿ.",
    weather: "ಪ್ರಸ್ತುತ ಹವಾಮಾನ ಮತ್ತು ಇಂದಿನ ಮಳೆ ಮುನ್ಸೂಚನೆ",
    noForecast: "ನೈಜ ಮುನ್ಸೂಚನೆ ಪಡೆಯಲು ಹವಾಮಾನ ಪರದೆಯಲ್ಲಿ ಸ್ಥಳ ಆಯ್ಕೆಮಾಡಿ. ಮುನ್ಸೂಚನೆ ಇಲ್ಲದೆ ಮಳೆಯ ಸ್ಥಿತಿ ಊಹಿಸಲಾಗುವುದಿಲ್ಲ.",
    currentTemp: "ಪ್ರಸ್ತುತ ತಾಪಮಾನ",
    rainChance: "ಇಂದಿನ ಮಳೆಯ ಸಾಧ್ಯತೆ",
    expectedRain: "ಮುನ್ಸೂಚಿತ ಮಳೆ",
    location: "ಮುನ್ಸೂಚನೆ ಸ್ಥಳ",
    yesIrrigate: "ಇಂದು ನೀರಾವರಿ ಮಾಡಿ",
    noIrrigate: "ಇಂದು ನೀರಾವರಿ ಬೇಡ",
    checkFirst: "ಮೊದಲು ಪರಿಶೀಲಿಸಿ",
    cannotDecide: "ನಿರ್ಧಾರ ಲಭ್ಯವಿಲ್ಲ",
    result: "ಇಂದಿನ ನೀರಾವರಿ ನಿರ್ಧಾರ",
    quantity: "ಪ್ರತಿ ಎಕರೆಗೆ ಯೋಜಿತ ನೀರಿನ ಪ್ರಮಾಣ",
    bestTime: "ನೀರುಣಿಸಲು ಸೂಕ್ತ ಸಮಯ",
    morning: "ಅನುಕೂಲವಾದರೆ ಮುಂಜಾನೆ (ಸುಮಾರು 6–9 ಗಂಟೆ).",
    noWater: "ಇಂದು 0 ಲೀಟರ್/ಎಕರೆ",
    depth: "ಯೋಜಿತ ನೀರಿನ ಆಳ",
    rainAlert: "ಮಳೆ ಮುನ್ಸೂಚನೆ ಇದೆ. ಇಂದು ನೀರಾವರಿ ನಿಲ್ಲಿಸಿ ಅಥವಾ ಮುಂದೂಡಿ; ಮಳೆಯ ನಂತರ ಮಣ್ಣಿನ ತೇವಾಂಶ ಮರುಪರಿಶೀಲಿಸಿ. ಮಳೆ ಖಚಿತವಲ್ಲ.",
    adequateAlert: "ಮಣ್ಣು ಸಾಕಷ್ಟು ತೇವವಾಗಿದೆ ಎಂದು ನೀವು ಆಯ್ಕೆಮಾಡಿದ್ದೀರಿ. ಇಂದು ನೀರಾವರಿ ಬೇಡ; ನಂತರ ಮತ್ತೆ ಪರಿಶೀಲಿಸಿ. ಇದು ನಿಮ್ಮ ಗಮನಿಸಿದ ಸ್ಥಿತಿ, ಸೆನ್ಸರ್ ಅಳತೆಯಲ್ಲ.",
    wetAlert: "ಮಣ್ಣು ತೇವವಾಗಿದೆ ಎಂದು ನೀವು ಆಯ್ಕೆಮಾಡಿದ್ದೀರಿ. ಈಗ ನೀರಾವರಿ ಬೇಡ; ಒಳಚರಂಡಿ ಪರಿಶೀಲಿಸಿ, ನೀರು ಇಂಗಿದ ನಂತರ ಮರುಪರಿಶೀಲಿಸಿ.",
    harvestAlert: "ಕೊಯ್ಲು ಹಂತ ಆಯ್ಕೆಮಾಡಲಾಗಿದೆ. ಈ ಸಾಮಾನ್ಯ ವೇಳಾಪಟ್ಟಿ ಕೊಯ್ಲಿನ ಸಮಯದಲ್ಲಿ ನೀರಾವರಿ ಶಿಫಾರಸು ಮಾಡುವುದಿಲ್ಲ; ಬೆಳೆಗೆ ಮತ್ತು ಕೊಯ್ಲಿಗೆ ಸಂಬಂಧಿಸಿದ ಸ್ಥಳೀಯ ಮಾರ್ಗದರ್ಶನ ಪಾಲಿಸಿ.",
    irrigateAlert: "ನಿಮ್ಮ ಹೊಲದ ಪರಿಶೀಲನೆ ಒಣವಾಗಿದೆ ಮತ್ತು ಇಂದಿನ ಮುನ್ಸೂಚನೆಯಲ್ಲಿ ಮಳೆ ಮಿತಿ ತಲುಪಿಲ್ಲ. ಕೆಳಗಿನ ಪ್ರಮಾಣವನ್ನು ಆರಂಭಿಕ ಯೋಜನೆಯಾಗಿ ಮಾತ್ರ ಬಳಸಿ, ಸ್ಥಳೀಯವಾಗಿ ದೃಢಪಡಿಸಿ.",
    missingAlert: "ನಿರ್ಧಾರ ಪಡೆಯಲು ಬೆಳೆ, ಮಣ್ಣು, ಬೆಳವಣಿಗೆಯ ಹಂತ ಮತ್ತು ಮಣ್ಣಿನ ತೇವಾಂಶ ಸ್ಥಿತಿ ಆಯ್ಕೆಮಾಡಿ.",
    weatherMissingAlert: "ಮಳೆ ಆಧಾರಿತ ನಿರ್ಧಾರಕ್ಕೆ ನೈಜ ಮುನ್ಸೂಚನೆ ಅಗತ್ಯ. ಹವಾಮಾನ ಸ್ಥಳ ಸೇರಿಸಿ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
    soilGuidance: "ಮಣ್ಣಿನ ನಿರ್ವಹಣೆಯ ಸೂಚನೆ",
    soilRed: "ಕೆಂಪು ಮಣ್ಣು ಬೇಗ ನೀರು ಬಿಡಬಹುದು; ನಿಗದಿತ ಅವಧಿಗೆ ಮಾತ್ರ ಅವಲಂಬಿಸದೆ ಬೇರು ವಲಯವನ್ನು ಮರುಪರಿಶೀಲಿಸಿ.",
    soilBlack: "ಕಪ್ಪು ಹತ್ತಿ ಮಣ್ಣು ನೀರನ್ನು ಹಿಡಿದಿಡಬಹುದು; ಬೇರು ವಲಯ ತೇವವಾಗಿರುವಾಗ ಮರುಮರು ನೀರಾವರಿ ತಪ್ಪಿಸಿ.",
    soilLoamy: "ಮತ್ತೆ ನೀರಾವರಿ ಮಾಡುವ ಮೊದಲು ಬೇರು ವಲಯದ ತೇವಾಂಶ ಮತ್ತು ಇತ್ತೀಚಿನ ಮಳೆ ಪರಿಶೀಲಿಸಿ.",
    soilSandy: "ಮರಳು ಮಣ್ಣು ಬೇಗ ನೀರು ಬಿಡುತ್ತದೆ; ಒಂದೇ ಬಾರಿ ಹೆಚ್ಚು ನೀರುಣಿಸುವ ಬದಲು ಕಡಿಮೆ ಪ್ರಮಾಣವನ್ನು ಹೆಚ್ಚು ಬಾರಿ ಪರಿಗಣಿಸಿ.",
    paddyNote: "ಭತ್ತದ ನೀರಿನ ನಿರ್ವಹಣೆಯಲ್ಲಿ ಹೊಲದ ನೀರಿನ ಮಟ್ಟ ಮುಖ್ಯವಾಗಿರಬಹುದು; ಈ ಸಾಮಾನ್ಯ ಪ್ರಮಾಣ ಭತ್ತಕ್ಕೆ ನಿರ್ದಿಷ್ಟ ನೀರಾವರಿ ಸಲಹೆಯಲ್ಲ.",
    estimateDisclaimer: "ನೀರಿನ ಪ್ರಮಾಣವು ಬೆಳವಣಿಗೆಯ ಹಂತದ ಸಾಮಾನ್ಯ ನೀರಿನ ಆಳದ ಆಧಾರದ ಪ್ರಾತ್ಯಕ್ಷಿಕೆಯ ಯೋಜನಾ ಅಂದಾಜು (ಬಿತ್ತನೆ 10 ಮಿಮೀ, ಸಸ್ಯ ಬೆಳವಣಿಗೆ 15 ಮಿಮೀ, ಹೂಬಿಡುವ ಹಂತ 20 ಮಿಮೀ, ಕೊಯ್ಲು 0 ಮಿಮೀ). ಒಂದು ಎಕರೆಗೆ 1 ಮಿಮೀ ನೀರು ಸುಮಾರು 4,047 ಲೀಟರ್. ಬೆಳೆ ಬಾಷ್ಪೋತ್ಸರ್ಜನೆ, ಅಳತೆಯ ಮಣ್ಣಿನ ನೀರಿನ ಕೊರತೆ, ನೀರಾವರಿ ದಕ್ಷತೆ ಅಥವಾ ಸ್ಥಳೀಯವಾಗಿ ದೃಢೀಕರಿಸಿದ ವೇಳಾಪಟ್ಟಿಯಿಂದ ಲೆಕ್ಕಿಸಿಲ್ಲ. ಕೃಷಿ ವಿಜ್ಞಾನ ಕೇಂದ್ರ/ಕೃಷಿ ಅಧಿಕಾರಿಯಿಂದ ದೃಢಪಡಿಸಿ.",
    statusRain: "ಮಳೆ ಮುನ್ಸೂಚನೆ",
    statusLive: "ಓಪನ್-ಮೆಟಿಯೊ ಮುನ್ಸೂಚನೆ",
    forecastUnavailable: "ಮುನ್ಸೂಚನೆ ಲಭ್ಯವಿಲ್ಲ",
    dailyValuesUnavailable: "ಲೋಡ್ ಮಾಡಿದ ಮುನ್ಸೂಚನೆಯಲ್ಲಿ ಇಂದಿನ ಮಳೆಯ ಸಾಧ್ಯತೆ ಮತ್ತು ಪ್ರಮಾಣ ಲಭ್ಯವಿಲ್ಲ.",
  },
} as const;

const crops: { value: Crop; label: keyof typeof copy.en }[] = [
  { value: "paddy", label: "paddy" },
  { value: "ragi", label: "ragi" },
  { value: "tomato", label: "tomato" },
  { value: "cotton", label: "cotton" },
  { value: "maize", label: "maize" },
  { value: "chilli", label: "chilli" },
  { value: "pulses", label: "pulses" },
];
const soils: { value: Soil; label: keyof typeof copy.en; profileValues: string[] }[] = [
  { value: "red", label: "redSoil", profileValues: ["Red soil"] },
  { value: "black", label: "blackSoil", profileValues: ["Black soil", "Black Cotton Soil"] },
  { value: "loamy", label: "loamySoil", profileValues: ["Loamy soil", "Loamy"] },
  { value: "sandy", label: "sandySoil", profileValues: ["Sandy soil", "Sandy"] },
];
const stages: { value: Stage; label: keyof typeof copy.en; depthMm: number }[] = [
  { value: "sowing", label: "sowing", depthMm: 10 },
  { value: "vegetative", label: "vegetative", depthMm: 15 },
  { value: "flowering", label: "flowering", depthMm: 20 },
  { value: "harvesting", label: "harvesting", depthMm: 0 },
];
const moistureOptions: { value: Moisture; label: keyof typeof copy.en }[] = [
  { value: "dry", label: "dry" },
  { value: "adequate", label: "adequate" },
  { value: "wet", label: "wet" },
];
const soilGuidance: Record<Soil, keyof typeof copy.en> = {
  red: "soilRed",
  black: "soilBlack",
  loamy: "soilLoamy",
  sandy: "soilSandy",
};

function soilFromProfile(profileSoil: string): Soil | "" {
  return soils.find((soil) => soil.profileValues.includes(profileSoil))?.value ?? "";
}

function formatNumber(value: number, language: Language) {
  return new Intl.NumberFormat(language === "en" ? "en-IN" : "kn-IN", { maximumFractionDigits: 0 }).format(value);
}

type Props = {
  language: Language;
  forecast: WeatherForecast | null;
  location: WeatherLocation | null;
  profileSoil: string;
};

export default function SmartIrrigationScheduler({ language, forecast, location, profileSoil }: Props) {
  const [crop, setCrop] = useState<Crop | "">("");
  const [soil, setSoil] = useState<Soil | "">(() => soilFromProfile(profileSoil));
  const [stage, setStage] = useState<Stage | "">("");
  const [moisture, setMoisture] = useState<Moisture | "">("");
  const t = (key: keyof typeof copy.en) => copy[language][key];
  const today = forecast?.daily[0] ?? null;
  const currentRain = forecast?.current.precipitation ?? null;
  const rainProbability = today?.precipitationProbability ?? null;
  const forecastRain = today?.precipitation ?? null;
  const rainExpected = Boolean(
    (currentRain !== null && currentRain > 0) ||
    (forecastRain !== null && forecastRain > 0) ||
    (rainProbability !== null && rainProbability >= 30),
  );
  const ready = Boolean(crop && soil && stage && moisture);
  const status: IrrigationStatus = !ready
    ? "missing"
    : !forecast || !today
      ? "weatherMissing"
      : rainExpected ? "rain"
        : moisture === "adequate" ? "adequate"
          : moisture === "wet" ? "wet"
            : stage === "harvesting" ? "harvest"
              : "irrigate";
  const activeStage = stages.find((option) => option.value === stage);
  const depthMm = status === "irrigate" ? activeStage?.depthMm ?? 0 : 0;
  const litersPerAcre = Math.round(depthMm * 4046.8564224);
  const statusLabel = status === "irrigate" ? t("yesIrrigate")
    : status === "rain" || status === "adequate" || status === "wet" || status === "harvest" ? t("noIrrigate")
      : status === "missing" ? t("checkFirst")
        : t("cannotDecide");
  const statusMessage = status === "rain" ? t("rainAlert")
    : status === "adequate" ? t("adequateAlert")
      : status === "wet" ? t("wetAlert")
        : status === "harvest" ? t("harvestAlert")
          : status === "irrigate" ? t("irrigateAlert")
            : status === "weatherMissing" ? t("weatherMissingAlert")
              : t("missingAlert");

  function chooseCrop(value: string) {
    setCrop(crops.find((option) => option.value === value)?.value ?? "");
  }

  function chooseSoil(value: string) {
    setSoil(soils.find((option) => option.value === value)?.value ?? "");
  }

  function chooseStage(value: string) {
    setStage(stages.find((option) => option.value === value)?.value ?? "");
  }

  function chooseMoisture(value: string) {
    setMoisture(moistureOptions.find((option) => option.value === value)?.value ?? "");
  }

  return <div className="irrigation-scheduler">
    <div className="page-heading irrigation-page-heading">
      <div><div className="eyebrow">{t("label")}</div><h1>{t("title")}</h1><p>{t("subtitle")}</p></div>
      <span className="demo-badge"><i />{forecast && today ? t("statusLive") : t("forecastUnavailable")}</span>
    </div>

    <section className="panel irrigation-inputs">
      <label htmlFor="irrigation-crop">{t("crop")}<select id="irrigation-crop" value={crop} onChange={(event) => chooseCrop(event.target.value)}>
        <option value="">{t("chooseCrop")}</option>{crops.map((option) => <option value={option.value} key={option.value}>{t(option.label)}</option>)}
      </select></label>
      <label htmlFor="irrigation-soil">{t("soil")}<select id="irrigation-soil" value={soil} onChange={(event) => chooseSoil(event.target.value)}>
        <option value="">{t("chooseSoil")}</option>{soils.map((option) => <option value={option.value} key={option.value}>{t(option.label)}</option>)}
      </select></label>
      <label htmlFor="irrigation-stage">{t("stage")}<select id="irrigation-stage" value={stage} onChange={(event) => chooseStage(event.target.value)}>
        <option value="">{t("chooseStage")}</option>{stages.map((option) => <option value={option.value} key={option.value}>{t(option.label)}</option>)}
      </select></label>
      <label htmlFor="irrigation-moisture">{t("moisture")}<select id="irrigation-moisture" value={moisture} onChange={(event) => chooseMoisture(event.target.value)}>
        <option value="">{t("chooseMoisture")}</option>{moistureOptions.map((option) => <option value={option.value} key={option.value}>{t(option.label)}</option>)}
      </select><small>{t("fieldCheckNote")}</small></label>
    </section>

    <section className="panel irrigation-weather">
      <div className="irrigation-section-heading"><div><div className="eyebrow">{t("label")}</div><h2>{t("weather")}</h2></div>
        {forecast && <span className="live-tag"><i />{t("statusLive")}</span>}
      </div>
      {forecast && today ? <div className="irrigation-weather-facts">
        <div><span>{t("location")}</span><strong>{location?.name ?? "—"}</strong></div>
        <div><span>{t("currentTemp")}</span><strong>{forecast.current.temperature === null ? "—" : `${formatNumber(forecast.current.temperature, language)}°C`}</strong></div>
        <div><span>{t("rainChance")}</span><strong>{rainProbability === null ? "—" : `${formatNumber(rainProbability, language)}%`}</strong></div>
        <div><span>{t("expectedRain")}</span><strong>{forecastRain === null ? "—" : `${formatNumber(forecastRain, language)} mm`}</strong></div>
      </div> : <p className="irrigation-empty">{t("noForecast")}</p>}
      {forecast && !rainExpected && (rainProbability === null && forecastRain === null) && <p className="irrigation-empty">{t("dailyValuesUnavailable")}</p>}
    </section>

    <section className="panel irrigation-result">
      <div className="irrigation-result-heading">
        <div><div className="eyebrow">{t("result")}</div><h2>{statusLabel}</h2></div>
        <span className={`irrigation-status-icon ${status === "irrigate" ? "status-go" : status === "rain" || status === "wet" ? "status-warn" : ""}`}>
          {status === "irrigate" ? "✓" : status === "rain" || status === "wet" ? "!" : status === "weatherMissing" || status === "missing" ? "?" : "–"}
        </span>
      </div>
      <p className="irrigation-result-message">{statusMessage}</p>
      <div className="irrigation-metrics">
        <div><span>{t("quantity")}</span><strong>{status === "irrigate" ? `${formatNumber(litersPerAcre, language)} L` : t("noWater")}</strong>{status === "irrigate" && <small>{t("depth")}: {depthMm} mm</small>}</div>
        <div><span>{t("bestTime")}</span><strong>{status === "irrigate" ? t("morning") : "—"}</strong></div>
      </div>
      {soil && <div className="irrigation-soil-note"><strong>{t("soilGuidance")}</strong><p>{t(soilGuidance[soil])}</p></div>}
      {crop === "paddy" && <p className="irrigation-crop-note">{t("paddyNote")}</p>}
    </section>

    <aside className="irrigation-disclaimer"><span>ⓘ</span><p>{t("estimateDisclaimer")}</p></aside>
  </div>;
}
