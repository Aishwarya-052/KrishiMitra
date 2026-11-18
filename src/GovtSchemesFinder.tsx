import { useMemo, useState } from "react";

type Language = "en" | "kn";
type Landholding = "marginal" | "small" | "mediumLarge";
type FarmerCategory = "general" | "scst" | "women";
type SchemeNeed = "incomeSupport" | "cropInsurance" | "irrigationEquipment" | "seedsFertilizer";

type Scheme = {
  id: string;
  name: Record<Language, string>;
  region: "india" | "karnataka";
  need: SchemeNeed;
  landholdings: Landholding[];
  categories: FarmerCategory[];
  summary: Record<Language, string>;
  benefit: Record<Language, string>;
  eligibility: Record<Language, string>;
  documentsNote: Record<Language, string>;
  url: string;
};

const copy = {
  en: {
    title: "Government Schemes & Subsidies",
    subtitle: "Find Indian and Karnataka agriculture support that may fit your farm.",
    label: "SCHEME FINDER",
    filters: "Filter schemes",
    landholding: "Landholding size",
    farmerCategory: "Farmer category",
    need: "What do you need?",
    allLandholdings: "All landholding sizes",
    allCategories: "All categories",
    allNeeds: "All needs",
    marginal: "Marginal (<1 ha)",
    small: "Small (1–2 ha)",
    mediumLarge: "Medium/Large (>2 ha)",
    general: "General",
    scst: "SC/ST",
    women: "Women farmer",
    incomeSupport: "Income Support",
    cropInsurance: "Crop Insurance",
    irrigationEquipment: "Irrigation / Equipment",
    seedsFertilizer: "Seeds / Fertilizer",
    india: "Government of India",
    karnataka: "Karnataka",
    benefit: "Benefit / assistance",
    eligibility: "Eligibility notes",
    documents: "Common documents to keep ready",
    documentsNote: "Document lists are indicative; confirm the current checklist with the portal or local agriculture office.",
    aadhaar: "Aadhaar / eKYC",
    rtc: "RTC / Pahani",
    bank: "Bank passbook",
    officialPortal: "Open official portal",
    officialSources: "Official scheme portals",
    results: "matching schemes",
    noResults: "No schemes match all selected filters. Try broadening one or more filters.",
    categoryNote: "The category filter shows schemes whose published rules include this group; special rates, if any, depend on the current component and notification.",
    landNote: "For schemes without a land-size ceiling, all three size filters may match. Small/marginal classifications and assistance rates can differ by scheme.",
    pmkisanName: "PM-KISAN Samman Nidhi",
    pmkisanSummary: "Direct income support for eligible landholding farmer families, subject to scheme exclusions and mandatory eKYC.",
    pmkisanBenefit: "₹6,000 per eligible farmer family per year, paid in three equal installments. Eligibility and installment status must be checked on the portal.",
    pmkisanEligibility: "Landholding size alone does not determine eligibility. Exclusion rules apply; eKYC is mandatory.",
    pmkisanDocs: "Aadhaar/eKYC, land record (RTC/Pahani), and bank account details are commonly needed.",
    pmfbyName: "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
    pmfbySummary: "Seasonal crop insurance for notified crops and areas; enrolment windows and notified crops vary.",
    pmfbyBenefit: "Insurance cover is based on the notified sum insured and assessed losses; there is no fixed payout. Farmer premium share is capped at 2% for Kharif food/oilseeds, 1.5% for Rabi food/oilseeds, and 5% for annual commercial/horticultural crops.",
    pmfbyEligibility: "Only notified crops and areas are covered for the season. Check the current notification and application deadline.",
    pmfbyDocs: "Aadhaar, RTC/Pahani, bank passbook, and crop/sowing details; tenancy or other land-use proof may be needed where applicable.",
    pdmcName: "PMKSY — Per Drop More Crop",
    pdmcSummary: "Support for eligible micro-irrigation systems such as drip and sprinkler to improve on-farm water-use efficiency.",
    pdmcBenefit: "Guideline assistance is 55% of approved unit cost for small/marginal farmers and 45% for other farmers, within scheme limits. The payable amount depends on system, area, and current state guidelines.",
    pdmcEligibility: "Assistance rates depend on the scheme's small/marginal classification, approved unit costs, and state implementation.",
    pdmcDocs: "Aadhaar, RTC/Pahani, bank passbook, land and water-source details, and quotations/application documents as requested.",
    smamName: "Agriculture Mechanization DBT (SMAM)",
    smamSummary: "Apply for assistance on eligible farm machinery or implements through the Government of India's mechanization DBT portal.",
    smamBenefit: "Subsidy amount varies by implement, beneficiary category, state allocation, and current guidelines; there is no single fixed benefit amount.",
    smamEligibility: "Availability is component- and state-specific. SC/ST and women applicants may have category-specific provisions; confirm the current rate before purchase.",
    smamDocs: "Aadhaar, RTC/Pahani, bank passbook, and implement quotation or application details as requested.",
    nfsmName: "National Food Security & Nutrition Mission (NFSNM)",
    nfsmSummary: "State-delivered demonstrations, certified seed distribution, seed minikits, and integrated nutrient-management support for notified crops and districts.",
    nfsmBenefit: "Seed or input assistance is set by crop, district, and season; no universal cash amount applies. Check the current state allocation and notification.",
    nfsmEligibility: "Notified crops, districts, and seasonal targets apply. Pulses and cotton are now under their dedicated missions.",
    nfsmDocs: "Aadhaar, RTC/Pahani, bank passbook, and crop/season application details where required by the state.",
    karnatakaPmfbyName: "Karnataka Raitha Suraksha — PMFBY",
    karnatakaPmfbySummary: "Karnataka's crop-insurance implementation and enrolment information for PMFBY through the Samrakshane portal.",
    karnatakaPmfbyBenefit: "Claim amount depends on the notified crop, insured area, sum insured, and assessed loss. Farmer premium caps follow PMFBY season/crop rules; there is no guaranteed payout.",
    karnatakaPmfbyEligibility: "Check Karnataka's current season, notified crop/area, enrolment dates, and claim process on Samrakshane.",
    karnatakaPmfbyDocs: "Aadhaar, RTC/Pahani, bank passbook, and crop/sowing details; check the current Karnataka checklist.",
    raitaSiriName: "Karnataka Raitha Siri",
    raitaSiriSummary: "State millet-promotion programme. The agriculture department publishes season-specific scheme guidelines and updates.",
    raitaSiriBenefit: "Benefit amount and availability depend on the active year's government order, crop, and district. The portal lists Raitha Siri guidelines; verify the current season before applying.",
    raitaSiriEligibility: "For eligible millet growers under a current notification; do not assume past-season eligibility or amounts continue.",
    raitaSiriDocs: "Aadhaar, RTC/Pahani, bank passbook, and crop/season proof specified in the current notification.",
    oilseedsName: "Karnataka National Mission on Edible Oils — Oilseeds",
    oilseedsSummary: "Karnataka's current oilseeds mission guidelines include district action plans and season-specific interventions.",
    oilseedsBenefit: "Support, input rates, and availability are set in the 2026–27 district action plan; there is no single statewide amount.",
    oilseedsEligibility: "For eligible oilseed growers in notified districts/components. Check the current district action plan before applying.",
    oilseedsDocs: "Aadhaar, RTC/Pahani, bank passbook, and oilseed crop/season proof specified by the district.",
  },
  kn: {
    title: "ಸರ್ಕಾರಿ ಯೋಜನೆಗಳು ಮತ್ತು ಸಬ್ಸಿಡಿಗಳು",
    subtitle: "ನಿಮ್ಮ ಕೃಷಿಗೆ ಹೊಂದಬಹುದಾದ ಭಾರತ ಮತ್ತು ಕರ್ನಾಟಕದ ಕೃಷಿ ನೆರವನ್ನು ಹುಡುಕಿ.",
    label: "ಯೋಜನೆ ಹುಡುಕಾಟ",
    filters: "ಯೋಜನೆಗಳನ್ನು ಫಿಲ್ಟರ್ ಮಾಡಿ",
    landholding: "ಭೂ ಹಿಡುವಳಿ ಗಾತ್ರ",
    farmerCategory: "ರೈತರ ವರ್ಗ",
    need: "ನಿಮಗೆ ಬೇಕಾದ ನೆರವು",
    allLandholdings: "ಎಲ್ಲ ಭೂ ಹಿಡುವಳಿ ಗಾತ್ರಗಳು",
    allCategories: "ಎಲ್ಲ ವರ್ಗಗಳು",
    allNeeds: "ಎಲ್ಲ ಅಗತ್ಯಗಳು",
    marginal: "ಅತಿಸಣ್ಣ (<1 ಹೆಕ್ಟೇರ್)",
    small: "ಸಣ್ಣ (1–2 ಹೆಕ್ಟೇರ್)",
    mediumLarge: "ಮಧ್ಯಮ / ದೊಡ್ಡ (>2 ಹೆಕ್ಟೇರ್)",
    general: "ಸಾಮಾನ್ಯ",
    scst: "ಪರಿಶಿಷ್ಟ ಜಾತಿ / ಪಂಗಡ",
    women: "ಮಹಿಳಾ ರೈತರು",
    incomeSupport: "ಆದಾಯ ನೆರವು",
    cropInsurance: "ಬೆಳೆ ವಿಮೆ",
    irrigationEquipment: "ನೀರಾವರಿ / ಉಪಕರಣ",
    seedsFertilizer: "ಬೀಜ / ಗೊಬ್ಬರ",
    india: "ಭಾರತ ಸರ್ಕಾರ",
    karnataka: "ಕರ್ನಾಟಕ",
    benefit: "ಲಾಭ / ನೆರವು",
    eligibility: "ಅರ್ಹತೆ ಮಾಹಿತಿ",
    documents: "ಸಿದ್ಧವಾಗಿರಿಸಬೇಕಾದ ಸಾಮಾನ್ಯ ದಾಖಲೆಗಳು",
    documentsNote: "ದಾಖಲೆಗಳ ಪಟ್ಟಿ ಸೂಚನೆಗಾಗಿ ಮಾತ್ರ; ಪ್ರಸ್ತುತ ಪಟ್ಟಿಯನ್ನು ಪೋರ್ಟಲ್ ಅಥವಾ ಸ್ಥಳೀಯ ಕೃಷಿ ಕಚೇರಿಯಲ್ಲಿ ದೃಢಪಡಿಸಿ.",
    aadhaar: "ಆಧಾರ್ / ಇ-ಕೆವೈಸಿ",
    rtc: "ಆರ್‌ಟಿಸಿ / ಪಹಣಿ",
    bank: "ಬ್ಯಾಂಕ್ ಪಾಸ್‌ಬುಕ್",
    officialPortal: "ಅಧಿಕೃತ ಪೋರ್ಟಲ್ ತೆರೆಯಿರಿ",
    officialSources: "ಅಧಿಕೃತ ಯೋಜನೆ ಪೋರ್ಟಲ್‌ಗಳು",
    results: "ಹೊಂದಿದ ಯೋಜನೆಗಳು",
    noResults: "ಆಯ್ಕೆ ಮಾಡಿದ ಎಲ್ಲ ಫಿಲ್ಟರ್‌ಗಳಿಗೆ ಯೋಜನೆ ಹೊಂದಲಿಲ್ಲ. ಒಂದು ಅಥವಾ ಹೆಚ್ಚು ಫಿಲ್ಟರ್ ಸಡಿಲಿಸಿ.",
    categoryNote: "ವರ್ಗ ಫಿಲ್ಟರ್ ಈ ಗುಂಪನ್ನು ಒಳಗೊಂಡ ಪ್ರಕಟಿತ ನಿಯಮಗಳ ಯೋಜನೆಗಳನ್ನು ತೋರಿಸುತ್ತದೆ; ವಿಶೇಷ ದರಗಳಿದ್ದರೆ ಅವು ಪ್ರಸ್ತುತ ಘಟಕ ಮತ್ತು ಅಧಿಸೂಚನೆಗೆ ಅವಲಂಬಿತ.",
    landNote: "ಭೂಮಿಯ ಗಾತ್ರದ ಮಿತಿ ಇಲ್ಲದ ಯೋಜನೆಗಳು ಮೂರು ಗಾತ್ರಗಳಲ್ಲೂ ಹೊಂದಬಹುದು. ಸಣ್ಣ/ಅತಿಸಣ್ಣ ವರ್ಗೀಕರಣ ಮತ್ತು ನೆರವು ದರ ಯೋಜನೆಗನುಸಾರ ಬದಲಾಗಬಹುದು.",
    pmkisanName: "ಪಿಎಂ-ಕಿಸಾನ್ ಸಮ್ಮಾನ್ ನಿಧಿ",
    pmkisanSummary: "ಅರ್ಹ ಭೂಮಿಯುಳ್ಳ ರೈತ ಕುಟುಂಬಗಳಿಗೆ ನೇರ ಆದಾಯ ನೆರವು; ಯೋಜನೆಯ ಹೊರತಾಗುವ ನಿಯಮಗಳು ಮತ್ತು ಕಡ್ಡಾಯ ಇ-ಕೆವೈಸಿ ಅನ್ವಯಿಸುತ್ತವೆ.",
    pmkisanBenefit: "ಅರ್ಹ ರೈತ ಕುಟುಂಬಕ್ಕೆ ವರ್ಷಕ್ಕೆ ₹6,000, ಮೂರು ಸಮಾನ ಕಂತುಗಳಲ್ಲಿ. ಅರ್ಹತೆ ಮತ್ತು ಕಂತಿನ ಸ್ಥಿತಿಯನ್ನು ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ಪರಿಶೀಲಿಸಿ.",
    pmkisanEligibility: "ಭೂ ಹಿಡುವಳಿ ಗಾತ್ರ ಮಾತ್ರ ಅರ್ಹತೆಯನ್ನು ನಿರ್ಧರಿಸುವುದಿಲ್ಲ. ಹೊರತಾಗುವ ನಿಯಮಗಳಿವೆ; ಇ-ಕೆವೈಸಿ ಕಡ್ಡಾಯ.",
    pmkisanDocs: "ಆಧಾರ್/ಇ-ಕೆವೈಸಿ, ಭೂ ದಾಖಲೆ (ಆರ್‌ಟಿಸಿ/ಪಹಣಿ) ಮತ್ತು ಬ್ಯಾಂಕ್ ವಿವರಗಳು ಸಾಮಾನ್ಯವಾಗಿ ಬೇಕಾಗುತ್ತವೆ.",
    pmfbyName: "ಪ್ರಧಾನಮಂತ್ರಿ ಫಸಲ್ ಬಿಮಾ ಯೋಜನೆ (ಪಿಎಂಎಫ್‌ಬಿವೈ)",
    pmfbySummary: "ಅಧಿಸೂಚಿತ ಬೆಳೆ ಮತ್ತು ಪ್ರದೇಶಗಳಿಗೆ ಋತುಮಾನಿಕ ಬೆಳೆ ವಿಮೆ; ನೋಂದಣಿ ಅವಧಿ ಮತ್ತು ಬೆಳೆಗಳು ಬದಲಾಗುತ್ತವೆ.",
    pmfbyBenefit: "ವಿಮಾ ಮೊತ್ತವು ಅಧಿಸೂಚಿತ ವಿಮಾ ಮೊತ್ತ ಮತ್ತು ಮೌಲ್ಯಮಾಪಿತ ನಷ್ಟದ ಮೇಲೆ ಅವಲಂಬಿತ; ನಿಗದಿತ ಪಾವತಿ ಇಲ್ಲ. ರೈತರ ಪ್ರೀಮಿಯಂ ಪಾಲು ಖಾರಿಫ್ ಆಹಾರ/ಎಣ್ಣೆಬೀಜಕ್ಕೆ 2%, ರಬಿ ಆಹಾರ/ಎಣ್ಣೆಬೀಜಕ್ಕೆ 1.5%, ವಾರ್ಷಿಕ ವಾಣಿಜ್ಯ/ತೋಟಗಾರಿಕೆ ಬೆಳೆಗಳಿಗೆ 5% ಮಿತಿಯಲ್ಲಿರುತ್ತದೆ.",
    pmfbyEligibility: "ಆ ಋತುವಿನ ಅಧಿಸೂಚಿತ ಬೆಳೆ ಮತ್ತು ಪ್ರದೇಶಗಳಿಗಷ್ಟೇ ರಕ್ಷಣೆ. ಪ್ರಸ್ತುತ ಅಧಿಸೂಚನೆ ಮತ್ತು ಅರ್ಜಿ ಕೊನೆಯ ದಿನ ಪರಿಶೀಲಿಸಿ.",
    pmfbyDocs: "ಆಧಾರ್, ಆರ್‌ಟಿಸಿ/ಪಹಣಿ, ಬ್ಯಾಂಕ್ ಪಾಸ್‌ಬುಕ್ ಮತ್ತು ಬೆಳೆ/ಬಿತ್ತನೆ ವಿವರಗಳು; ಅನ್ವಯಿಸಿದರೆ ಗೇಣಿ ಅಥವಾ ಭೂಬಳಕೆ ಪುರಾವೆ ಬೇಕಾಗಬಹುದು.",
    pdmcName: "ಪಿಎಂಕೆಎಸ್‌ವೈ — ಪ್ರತಿ ಹನಿಗೆ ಹೆಚ್ಚು ಬೆಳೆ",
    pdmcSummary: "ಹೊಲದ ನೀರು ಬಳಕೆ ದಕ್ಷತೆ ಹೆಚ್ಚಿಸಲು ಹನಿ ಮತ್ತು ತುಂತುರು ನೀರಾವರಿಯಂತಹ ಅರ್ಹ ಸೂಕ್ಷ್ಮ ನೀರಾವರಿ ವ್ಯವಸ್ಥೆಗಳಿಗೆ ನೆರವು.",
    pdmcBenefit: "ಮಾರ್ಗಸೂಚಿ ಪ್ರಕಾರ ಸಣ್ಣ/ಅತಿಸಣ್ಣ ರೈತರಿಗೆ ಅನುಮೋದಿತ ಘಟಕ ವೆಚ್ಚದ 55%, ಇತರ ರೈತರಿಗೆ 45% ನೆರವು; ಯೋಜನಾ ಮಿತಿಗಳು ಅನ್ವಯಿಸುತ್ತವೆ. ಪಾವತಿ ವ್ಯವಸ್ಥೆ, ವಿಸ್ತೀರ್ಣ ಮತ್ತು ಪ್ರಸ್ತುತ ರಾಜ್ಯ ಮಾರ್ಗಸೂಚಿಗಳ ಮೇಲೆ ಅವಲಂಬಿತ.",
    pdmcEligibility: "ಸಣ್ಣ/ಅತಿಸಣ್ಣ ವರ್ಗೀಕರಣ, ಅನುಮೋದಿತ ಘಟಕ ವೆಚ್ಚ ಮತ್ತು ರಾಜ್ಯದ ಅನುಷ್ಠಾನದ ಮೇಲೆ ನೆರವು ದರ ಅವಲಂಬಿತ.",
    pdmcDocs: "ಆಧಾರ್, ಆರ್‌ಟಿಸಿ/ಪಹಣಿ, ಬ್ಯಾಂಕ್ ಪಾಸ್‌ಬುಕ್, ಭೂಮಿ ಮತ್ತು ನೀರಿನ ಮೂಲದ ವಿವರ, ಅಗತ್ಯವಿದ್ದರೆ ದರಪಟ್ಟಿ/ಅರ್ಜಿ ದಾಖಲೆಗಳು.",
    smamName: "ಕೃಷಿ ಯಾಂತ್ರೀಕರಣ ಡಿಬಿಟಿ (ಎಸ್‌ಎಂಎಎಂ)",
    smamSummary: "ಭಾರತ ಸರ್ಕಾರದ ಯಾಂತ್ರೀಕರಣ ಡಿಬಿಟಿ ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ಅರ್ಹ ಕೃಷಿ ಯಂತ್ರ ಅಥವಾ ಉಪಕರಣಕ್ಕೆ ನೆರವಿಗಾಗಿ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ.",
    smamBenefit: "ಸಬ್ಸಿಡಿ ಮೊತ್ತವು ಉಪಕರಣ, ಫಲಾನುಭವಿ ವರ್ಗ, ರಾಜ್ಯದ ಹಂಚಿಕೆ ಮತ್ತು ಪ್ರಸ್ತುತ ಮಾರ್ಗಸೂಚಿಗಳ ಮೇಲೆ ಅವಲಂಬಿತ; ಒಂದೇ ನಿಗದಿತ ಮೊತ್ತವಿಲ್ಲ.",
    smamEligibility: "ಲಭ್ಯತೆ ಘಟಕ ಮತ್ತು ರಾಜ್ಯಕ್ಕೆ ಅನುಗುಣ. ಎಸ್ಸಿ/ಎಸ್ಟಿ ಮತ್ತು ಮಹಿಳಾ ಅರ್ಜಿದಾರರಿಗೆ ವರ್ಗ-ನಿರ್ದಿಷ್ಟ ನಿಯಮಗಳಿರಬಹುದು; ಖರೀದಿಗೂ ಮೊದಲು ಪ್ರಸ್ತುತ ದರ ದೃಢಪಡಿಸಿ.",
    smamDocs: "ಆಧಾರ್, ಆರ್‌ಟಿಸಿ/ಪಹಣಿ, ಬ್ಯಾಂಕ್ ಪಾಸ್‌ಬುಕ್ ಮತ್ತು ಅಗತ್ಯವಿದ್ದರೆ ಉಪಕರಣದ ದರಪಟ್ಟಿ/ಅರ್ಜಿ ವಿವರಗಳು.",
    nfsmName: "ರಾಷ್ಟ್ರೀಯ ಆಹಾರ ಭದ್ರತೆ ಮತ್ತು ಪೌಷ್ಟಿಕತೆ ಮಿಷನ್ (ಎನ್‌ಎಫ್‌ಎಸ್‌ಎನ್‌ಎಂ)",
    nfsmSummary: "ಅಧಿಸೂಚಿತ ಬೆಳೆ ಮತ್ತು ಜಿಲ್ಲೆಗಳಲ್ಲಿ ರಾಜ್ಯದ ಮೂಲಕ ಪ್ರದರ್ಶನ, ಪ್ರಮಾಣಿತ ಬೀಜ ವಿತರಣೆ, ಬೀಜ ಕಿಟ್ ಮತ್ತು ಸಮಗ್ರ ಪೋಷಕಾಂಶ ನಿರ್ವಹಣೆಗೆ ನೆರವು.",
    nfsmBenefit: "ಬೀಜ ಅಥವಾ ಒಳಾಂಶದ ನೆರವು ಬೆಳೆ, ಜಿಲ್ಲೆ ಮತ್ತು ಋತುವಿಗೆ ಅನುಗುಣ; ಎಲ್ಲರಿಗೂ ಅನ್ವಯಿಸುವ ನಗದು ಮೊತ್ತವಿಲ್ಲ. ಪ್ರಸ್ತುತ ರಾಜ್ಯ ಹಂಚಿಕೆ ಮತ್ತು ಅಧಿಸೂಚನೆ ಪರಿಶೀಲಿಸಿ.",
    nfsmEligibility: "ಅಧಿಸೂಚಿತ ಬೆಳೆ, ಜಿಲ್ಲೆ ಮತ್ತು ಋತು ಗುರಿಗಳು ಅನ್ವಯಿಸುತ್ತವೆ. ಬೇಳೆಕಾಳು ಮತ್ತು ಹತ್ತಿ ಈಗ ಪ್ರತ್ಯೇಕ ಮಿಷನ್‌ಗಳಡಿ ಬರುತ್ತವೆ.",
    nfsmDocs: "ಆಧಾರ್, ಆರ್‌ಟಿಸಿ/ಪಹಣಿ, ಬ್ಯಾಂಕ್ ಪಾಸ್‌ಬುಕ್ ಮತ್ತು ರಾಜ್ಯ ಕೇಳಿದರೆ ಬೆಳೆ/ಋತು ಅರ್ಜಿ ವಿವರಗಳು.",
    karnatakaPmfbyName: "ಕರ್ನಾಟಕ ರೈತ ಸುರಕ್ಷಾ — ಪಿಎಂಎಫ್‌ಬಿವೈ",
    karnatakaPmfbySummary: "ಸಂರಕ್ಷಣೆ ಪೋರ್ಟಲ್ ಮೂಲಕ ಕರ್ನಾಟಕದ ಪಿಎಂಎಫ್‌ಬಿವೈ ಬೆಳೆ ವಿಮೆ ಅನುಷ್ಠಾನ ಮತ್ತು ನೋಂದಣಿ ಮಾಹಿತಿ.",
    karnatakaPmfbyBenefit: "ಹಕ್ಕು ಮೊತ್ತವು ಅಧಿಸೂಚಿತ ಬೆಳೆ, ವಿಮೆ ಮಾಡಿದ ವಿಸ್ತೀರ್ಣ, ವಿಮಾ ಮೊತ್ತ ಮತ್ತು ಮೌಲ್ಯಮಾಪಿತ ನಷ್ಟದ ಮೇಲೆ ಅವಲಂಬಿತ. ರೈತರ ಪ್ರೀಮಿಯಂ ಮಿತಿ ಪಿಎಂಎಫ್‌ಬಿವೈ ನಿಯಮದಂತೆ; ಪಾವತಿ ಖಚಿತವಲ್ಲ.",
    karnatakaPmfbyEligibility: "ಸಂರಕ್ಷಣೆ ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ಕರ್ನಾಟಕದ ಪ್ರಸ್ತುತ ಋತು, ಅಧಿಸೂಚಿತ ಬೆಳೆ/ಪ್ರದೇಶ, ನೋಂದಣಿ ದಿನಾಂಕ ಮತ್ತು ಹಕ್ಕು ಪ್ರಕ್ರಿಯೆ ಪರಿಶೀಲಿಸಿ.",
    karnatakaPmfbyDocs: "ಆಧಾರ್, ಆರ್‌ಟಿಸಿ/ಪಹಣಿ, ಬ್ಯಾಂಕ್ ಪಾಸ್‌ಬುಕ್ ಮತ್ತು ಬೆಳೆ/ಬಿತ್ತನೆ ವಿವರಗಳು; ಪ್ರಸ್ತುತ ಕರ್ನಾಟಕದ ಪಟ್ಟಿಯನ್ನು ಪರಿಶೀಲಿಸಿ.",
    raitaSiriName: "ಕರ್ನಾಟಕ ರೈತ ಸಿರಿ",
    raitaSiriSummary: "ರಾಜ್ಯದ ಸಿರಿಧಾನ್ಯ ಉತ್ತೇಜನ ಕಾರ್ಯಕ್ರಮ. ಕೃಷಿ ಇಲಾಖೆ ಋತು-ನಿರ್ದಿಷ್ಟ ಮಾರ್ಗಸೂಚಿ ಮತ್ತು ನವೀಕರಣ ಪ್ರಕಟಿಸುತ್ತದೆ.",
    raitaSiriBenefit: "ನೆರವು ಮೊತ್ತ ಮತ್ತು ಲಭ್ಯತೆ ಸಕ್ರಿಯ ವರ್ಷದ ಸರ್ಕಾರಿ ಆದೇಶ, ಬೆಳೆ ಮತ್ತು ಜಿಲ್ಲೆಯ ಮೇಲೆ ಅವಲಂಬಿತ. ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ರೈತ ಸಿರಿ ಮಾರ್ಗಸೂಚಿಗಳಿವೆ; ಅರ್ಜಿ ಮೊದಲು ಪ್ರಸ್ತುತ ಋತು ಪರಿಶೀಲಿಸಿ.",
    raitaSiriEligibility: "ಪ್ರಸ್ತುತ ಅಧಿಸೂಚನೆಯಡಿ ಅರ್ಹ ಸಿರಿಧಾನ್ಯ ಬೆಳೆಗಾರರಿಗೆ. ಹಿಂದಿನ ಋತುವಿನ ಅರ್ಹತೆ ಅಥವಾ ಮೊತ್ತ ಮುಂದುವರಿಯುತ್ತದೆಂದು ಭಾವಿಸಬೇಡಿ.",
    raitaSiriDocs: "ಆಧಾರ್, ಆರ್‌ಟಿಸಿ/ಪಹಣಿ, ಬ್ಯಾಂಕ್ ಪಾಸ್‌ಬುಕ್ ಮತ್ತು ಪ್ರಸ್ತುತ ಅಧಿಸೂಚನೆಯಲ್ಲಿ ಕೇಳಿದ ಬೆಳೆ/ಋತು ಪುರಾವೆ.",
    oilseedsName: "ಕರ್ನಾಟಕ ರಾಷ್ಟ್ರೀಯ ಆಹಾರ ತೈಲ ಮಿಷನ್ — ಎಣ್ಣೆಬೀಜಗಳು",
    oilseedsSummary: "ಕರ್ನಾಟಕದ ಪ್ರಸ್ತುತ ಎಣ್ಣೆಬೀಜ ಮಿಷನ್ ಮಾರ್ಗಸೂಚಿಗಳಲ್ಲಿ ಜಿಲ್ಲಾ ಕಾರ್ಯಯೋಜನೆ ಮತ್ತು ಋತು-ನಿರ್ದಿಷ್ಟ ಕ್ರಮಗಳಿವೆ.",
    oilseedsBenefit: "ನೆರವು, ಒಳಾಂಶದ ದರ ಮತ್ತು ಲಭ್ಯತೆ 2026–27ರ ಜಿಲ್ಲಾ ಕಾರ್ಯಯೋಜನೆಯಲ್ಲಿ ನಿಗದಿಯಾಗುತ್ತದೆ; ರಾಜ್ಯದಾದ್ಯಂತ ಒಂದೇ ಮೊತ್ತವಿಲ್ಲ.",
    oilseedsEligibility: "ಅಧಿಸೂಚಿತ ಜಿಲ್ಲೆ/ಘಟಕಗಳ ಅರ್ಹ ಎಣ್ಣೆಬೀಜ ಬೆಳೆಗಾರರಿಗೆ. ಅರ್ಜಿ ಮೊದಲು ಜಿಲ್ಲಾ ಕಾರ್ಯಯೋಜನೆ ಪರಿಶೀಲಿಸಿ.",
    oilseedsDocs: "ಆಧಾರ್, ಆರ್‌ಟಿಸಿ/ಪಹಣಿ, ಬ್ಯಾಂಕ್ ಪಾಸ್‌ಬುಕ್ ಮತ್ತು ಜಿಲ್ಲೆ ಸೂಚಿಸಿದ ಎಣ್ಣೆಬೀಜ ಬೆಳೆ/ಋತು ಪುರಾವೆ.",
  },
} as const;

const landholdingOptions: { value: Landholding; label: keyof typeof copy.en }[] = [
  { value: "marginal", label: "marginal" },
  { value: "small", label: "small" },
  { value: "mediumLarge", label: "mediumLarge" },
];
const categoryOptions: { value: FarmerCategory; label: keyof typeof copy.en }[] = [
  { value: "general", label: "general" },
  { value: "scst", label: "scst" },
  { value: "women", label: "women" },
];
const needOptions: { value: SchemeNeed; label: keyof typeof copy.en }[] = [
  { value: "incomeSupport", label: "incomeSupport" },
  { value: "cropInsurance", label: "cropInsurance" },
  { value: "irrigationEquipment", label: "irrigationEquipment" },
  { value: "seedsFertilizer", label: "seedsFertilizer" },
];
const commonDocuments: (keyof typeof copy.en)[] = ["aadhaar", "rtc", "bank"];

const schemes: Scheme[] = [
  {
    id: "pmkisan",
    name: { en: copy.en.pmkisanName, kn: copy.kn.pmkisanName },
    region: "india",
    need: "incomeSupport",
    landholdings: ["marginal", "small", "mediumLarge"],
    categories: ["general", "scst", "women"],
    summary: { en: copy.en.pmkisanSummary, kn: copy.kn.pmkisanSummary },
    benefit: { en: copy.en.pmkisanBenefit, kn: copy.kn.pmkisanBenefit },
    eligibility: { en: copy.en.pmkisanEligibility, kn: copy.kn.pmkisanEligibility },
    documentsNote: { en: copy.en.pmkisanDocs, kn: copy.kn.pmkisanDocs },
    url: "https://pmkisan.gov.in/",
  },
  {
    id: "pmfby",
    name: { en: copy.en.pmfbyName, kn: copy.kn.pmfbyName },
    region: "india",
    need: "cropInsurance",
    landholdings: ["marginal", "small", "mediumLarge"],
    categories: ["general", "scst", "women"],
    summary: { en: copy.en.pmfbySummary, kn: copy.kn.pmfbySummary },
    benefit: { en: copy.en.pmfbyBenefit, kn: copy.kn.pmfbyBenefit },
    eligibility: { en: copy.en.pmfbyEligibility, kn: copy.kn.pmfbyEligibility },
    documentsNote: { en: copy.en.pmfbyDocs, kn: copy.kn.pmfbyDocs },
    url: "https://pmfby.gov.in/",
  },
  {
    id: "pdmc",
    name: { en: copy.en.pdmcName, kn: copy.kn.pdmcName },
    region: "india",
    need: "irrigationEquipment",
    landholdings: ["marginal", "small", "mediumLarge"],
    categories: ["general", "scst", "women"],
    summary: { en: copy.en.pdmcSummary, kn: copy.kn.pdmcSummary },
    benefit: { en: copy.en.pdmcBenefit, kn: copy.kn.pdmcBenefit },
    eligibility: { en: copy.en.pdmcEligibility, kn: copy.kn.pdmcEligibility },
    documentsNote: { en: copy.en.pdmcDocs, kn: copy.kn.pdmcDocs },
    url: "https://pmksy.gov.in/",
  },
  {
    id: "smam",
    name: { en: copy.en.smamName, kn: copy.kn.smamName },
    region: "india",
    need: "irrigationEquipment",
    landholdings: ["marginal", "small", "mediumLarge"],
    categories: ["general", "scst", "women"],
    summary: { en: copy.en.smamSummary, kn: copy.kn.smamSummary },
    benefit: { en: copy.en.smamBenefit, kn: copy.kn.smamBenefit },
    eligibility: { en: copy.en.smamEligibility, kn: copy.kn.smamEligibility },
    documentsNote: { en: copy.en.smamDocs, kn: copy.kn.smamDocs },
    url: "https://agrimachinery.nic.in/",
  },
  {
    id: "nfsm",
    name: { en: copy.en.nfsmName, kn: copy.kn.nfsmName },
    region: "india",
    need: "seedsFertilizer",
    landholdings: ["marginal", "small", "mediumLarge"],
    categories: ["general", "scst", "women"],
    summary: { en: copy.en.nfsmSummary, kn: copy.kn.nfsmSummary },
    benefit: { en: copy.en.nfsmBenefit, kn: copy.kn.nfsmBenefit },
    eligibility: { en: copy.en.nfsmEligibility, kn: copy.kn.nfsmEligibility },
    documentsNote: { en: copy.en.nfsmDocs, kn: copy.kn.nfsmDocs },
    url: "https://nfsm.gov.in/",
  },
  {
    id: "karnataka-pmfby",
    name: { en: copy.en.karnatakaPmfbyName, kn: copy.kn.karnatakaPmfbyName },
    region: "karnataka",
    need: "cropInsurance",
    landholdings: ["marginal", "small", "mediumLarge"],
    categories: ["general", "scst", "women"],
    summary: { en: copy.en.karnatakaPmfbySummary, kn: copy.kn.karnatakaPmfbySummary },
    benefit: { en: copy.en.karnatakaPmfbyBenefit, kn: copy.kn.karnatakaPmfbyBenefit },
    eligibility: { en: copy.en.karnatakaPmfbyEligibility, kn: copy.kn.karnatakaPmfbyEligibility },
    documentsNote: { en: copy.en.karnatakaPmfbyDocs, kn: copy.kn.karnatakaPmfbyDocs },
    url: "https://raitamitra.karnataka.gov.in/88/karnataka-raitha-suraksha-pradhana-mantri-fasal-bima-yojana/en",
  },
  {
    id: "raita-siri",
    name: { en: copy.en.raitaSiriName, kn: copy.kn.raitaSiriName },
    region: "karnataka",
    need: "incomeSupport",
    landholdings: ["marginal", "small", "mediumLarge"],
    categories: ["general", "scst", "women"],
    summary: { en: copy.en.raitaSiriSummary, kn: copy.kn.raitaSiriSummary },
    benefit: { en: copy.en.raitaSiriBenefit, kn: copy.kn.raitaSiriBenefit },
    eligibility: { en: copy.en.raitaSiriEligibility, kn: copy.kn.raitaSiriEligibility },
    documentsNote: { en: copy.en.raitaSiriDocs, kn: copy.kn.raitaSiriDocs },
    url: "https://raitamitra.karnataka.gov.in/90/raita-siri/en",
  },
  {
    id: "karnataka-oilseeds",
    name: { en: copy.en.oilseedsName, kn: copy.kn.oilseedsName },
    region: "karnataka",
    need: "seedsFertilizer",
    landholdings: ["marginal", "small", "mediumLarge"],
    categories: ["general", "scst", "women"],
    summary: { en: copy.en.oilseedsSummary, kn: copy.kn.oilseedsSummary },
    benefit: { en: copy.en.oilseedsBenefit, kn: copy.kn.oilseedsBenefit },
    eligibility: { en: copy.en.oilseedsEligibility, kn: copy.kn.oilseedsEligibility },
    documentsNote: { en: copy.en.oilseedsDocs, kn: copy.kn.oilseedsDocs },
    url: "https://raitamitra.karnataka.gov.in/61/nmeo-oil-seeds/en",
  },
];

type GovtSchemesFinderProps = { language: Language };

export default function GovtSchemesFinder({ language }: GovtSchemesFinderProps) {
  const [landholding, setLandholding] = useState<Landholding | "">("");
  const [category, setCategory] = useState<FarmerCategory | "">("");
  const [need, setNeed] = useState<SchemeNeed | "">("");
  const t = (key: keyof typeof copy.en) => copy[language][key];
  const matchingSchemes = useMemo(() => schemes.filter((scheme) =>
    (!landholding || scheme.landholdings.includes(landholding)) &&
    (!category || scheme.categories.includes(category)) &&
    (!need || scheme.need === need),
  ), [category, landholding, need]);

  function getBenefit(scheme: Scheme) {
    if (scheme.id === "pdmc" && landholding) {
      if (language === "en") {
        return landholding === "mediumLarge"
          ? "45% of approved unit cost for other farmers, within scheme limits. Actual amount depends on system, area, and current state guidelines."
          : "55% of approved unit cost for small/marginal farmers, within scheme limits. Actual amount depends on system, area, and current state guidelines.";
      }
      return landholding === "mediumLarge"
        ? "ಇತರ ರೈತರಿಗೆ ಅನುಮೋದಿತ ಘಟಕ ವೆಚ್ಚದ 45%, ಯೋಜನಾ ಮಿತಿಯೊಳಗೆ. ನಿಜವಾದ ಮೊತ್ತ ವ್ಯವಸ್ಥೆ, ವಿಸ್ತೀರ್ಣ ಮತ್ತು ರಾಜ್ಯ ಮಾರ್ಗಸೂಚಿಗಳ ಮೇಲೆ ಅವಲಂಬಿತ."
        : "ಸಣ್ಣ/ಅತಿಸಣ್ಣ ರೈತರಿಗೆ ಅನುಮೋದಿತ ಘಟಕ ವೆಚ್ಚದ 55%, ಯೋಜನಾ ಮಿತಿಯೊಳಗೆ. ನಿಜವಾದ ಮೊತ್ತ ವ್ಯವಸ್ಥೆ, ವಿಸ್ತೀರ್ಣ ಮತ್ತು ರಾಜ್ಯ ಮಾರ್ಗಸೂಚಿಗಳ ಮೇಲೆ ಅವಲಂಬಿತ.";
    }
    return scheme.benefit[language];
  }

  return <div className="schemes-finder">
    <div className="page-heading schemes-page-heading">
      <div><div className="eyebrow">{t("label")}</div><h1>{t("title")}</h1><p>{t("subtitle")}</p></div>
      <span className="source-badge demo-badge"><i />{t("officialSources")}</span>
    </div>
    <section className="panel schemes-filters" aria-label={t("filters")}>
      <div className="schemes-filters-heading"><h2>{t("filters")}</h2><span>{matchingSchemes.length} {t("results")}</span></div>
      <div className="schemes-filter-grid">
        <label htmlFor="scheme-landholding">{t("landholding")}<select id="scheme-landholding" value={landholding} onChange={(event) => {
          setLandholding(landholdingOptions.find((option) => option.value === event.target.value)?.value ?? "");
        }}><option value="">{t("allLandholdings")}</option>{landholdingOptions.map((option) => <option value={option.value} key={option.value}>{t(option.label)}</option>)}</select></label>
        <label htmlFor="scheme-category">{t("farmerCategory")}<select id="scheme-category" value={category} onChange={(event) => {
          setCategory(categoryOptions.find((option) => option.value === event.target.value)?.value ?? "");
        }}><option value="">{t("allCategories")}</option>{categoryOptions.map((option) => <option value={option.value} key={option.value}>{t(option.label)}</option>)}</select></label>
        <label htmlFor="scheme-need">{t("need")}<select id="scheme-need" value={need} onChange={(event) => {
          setNeed(needOptions.find((option) => option.value === event.target.value)?.value ?? "");
        }}><option value="">{t("allNeeds")}</option>{needOptions.map((option) => <option value={option.value} key={option.value}>{t(option.label)}</option>)}</select></label>
      </div>
      <p className="schemes-filter-note">{t("categoryNote")} {t("landNote")}</p>
    </section>

    {matchingSchemes.length
      ? <div className="schemes-grid">{matchingSchemes.map((scheme) => <article className="panel scheme-card" key={scheme.id}>
        <div className="scheme-card-meta"><span className={`scheme-region ${scheme.region}`}>{t(scheme.region)}</span><span className="scheme-need">{t(scheme.need)}</span></div>
        <h2>{scheme.name[language]}</h2>
        <p className="scheme-summary">{scheme.summary[language]}</p>
        <section className="scheme-benefit"><strong>{t("benefit")}</strong><p>{getBenefit(scheme)}</p></section>
        <section className="scheme-detail"><h3>{t("eligibility")}</h3><p>{scheme.eligibility[language]}</p></section>
        <section className="scheme-detail"><h3>{t("documents")}</h3><ul>{commonDocuments.map((document) => <li key={document}>{t(document)}</li>)}</ul><p>{scheme.documentsNote[language]}</p><small>{t("documentsNote")}</small></section>
        <a className="button button-outline scheme-link" href={scheme.url} target="_blank" rel="noreferrer">{t("officialPortal")} <span>↗</span></a>
      </article>)}</div>
      : <p className="schemes-empty panel">{t("noResults")}</p>}
  </div>;
}
