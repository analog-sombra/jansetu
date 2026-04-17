const CATEGORY_KEY_BY_NORMALIZED: Record<string, string> = {
  road: "road",
  roads: "road",
  water: "water",
  electricity: "electricity",
  power: "electricity",
  sanitation: "sanitation",
  health: "health",
  publicsafety: "publicSafety",
  safety: "publicSafety",
  other: "other",
};

const SUBCATEGORY_KEY_BY_NORMALIZED: Record<string, string> = {
  pothole: "pothole",
  roaddamage: "roadDamage",
  missingsignage: "missingSignage",
  streetlightnotworking: "streetlightNotWorking",
  roaddebris: "roadDebris",
  accidentsite: "accidentSite",
  nowatersupply: "noWaterSupply",
  lowpressure: "lowPressure",
  waterleakage: "waterLeakage",
  waterqualityissue: "waterQualityIssue",
  pipelinedamage: "pipelineDamage",
  watercontamination: "waterContamination",
  powercut: "powerCut",
  powerfluctuation: "powerFluctuation",
  brokenpole: "brokenPole",
  damagedwire: "damagedWire",
  illegalconnection: "illegalConnection",
  meterissue: "meterIssue",
  garbagenotcollected: "garbageNotCollected",
  opendefecation: "openDefecation",
  dirtypublicarea: "dirtyPublicArea",
  drainclogged: "drainClogged",
  sweepingnotdone: "sweepingNotDone",
  publictoiletissue: "publicToiletIssue",
  diseaseoutbreak: "diseaseOutbreak",
  lackofvaccination: "lackOfVaccination",
  hospitalissue: "hospitalIssue",
  ambulanceservice: "ambulanceService",
  healthcenterissue: "healthCenterIssue",
  medicalstaffissue: "medicalStaffIssue",
  crimereport: "crimeReport",
  unsafearea: "unsafeArea",
  trafficviolation: "trafficViolation",
  policeresponseissue: "policeResponseIssue",
  securityconcern: "securityConcern",
  firerisk: "fireRisk",
  other: "other",
  generalcomplaint: "generalComplaint",
};

function normalizeLabel(value: string) {
  return value.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
}

export function getLocalizedCategory(category: string, t: (key: string) => string) {
  const key = CATEGORY_KEY_BY_NORMALIZED[normalizeLabel(category)];
  return key ? t(`category.${key}`) : category;
}

export function getLocalizedSubcategory(subcategory: string, t: (key: string) => string) {
  const key = SUBCATEGORY_KEY_BY_NORMALIZED[normalizeLabel(subcategory)];
  return key ? t(`subcategory.${key}`) : subcategory;
}

const AREA_KEY_BY_NORMALIZED: Record<string, string> = {
  rajourigarden: "rajouriGarden",
  raghubirnagar: "raghubirNagar",
  tagoregarden: "tagoreGarden",
  vishalenclave: "vishalEnclave",
  subhashnagar: "subhashNagar",
  shivajicnclave: "shivajiEnclave",
  shivajienclave: "shivajiEnclave",
  mansarovargarden: "mansarovarGarden",
  mayapuri: "mayapuri",
  madipur: "madipur",
  punjabibaughwest: "punjabiBaghWest",
  punjababaghwest: "punjabiBaghWest",
  karampura: "karampura",
  motinagar: "motiNagar",
  rameshnagar: "rameshNagar",
  rajagarden: "rajaGarden",
  other: "other",
};

export function getLocalizedArea(area: string, t: (key: string) => string) {
  const key = AREA_KEY_BY_NORMALIZED[normalizeLabel(area)];
  return key ? t(`area.${key}`) : area;
}