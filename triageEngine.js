const db = require('./database');

// Severe red-flag keywords and patterns
const SEVERE_PATTERNS = [
  /chest\s*(pain|pressure|tightness|heaviness)/i,
  /heart\s*(attack|pain)/i,
  /shortness\s*of\s*breath|cannot\s*breathe|difficulty\s*breathing|gasping|saans\s*(phool|nahi)/i,
  /cough(ing)?\s*(up\s*)?blood|khoon\s*ki\s*ulti|vomit(ing)?\s*blood/i,
  /blood\s*(in\s*)?stool|black\s*stool/i,
  /unconscious(ness)?|faint(ed|ing)?|seizure|fit|chakkara.*behosh/i,
  /paralysis|slurred\s*speech|face\s*droop|numbness\s*on\s*one\s*side/i,
  /severe\s*(abdominal|stomach)\s*pain|acute\s*belly\s*pain|pet\s*me\s*tez\s*dard/i,
  /high\s*fever\s*(103|104|105)|fever\s*(for|>)?\s*(3|4|5|6|7)\s*days/i,
  /head\s*injury|concussion|accident|bleeding\s*heavily/i,
  /suicid(al|e)|poison(ing)?/i
];

// Calculate Haversine distance in KM
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
}

// Find nearby doctors by coordinates or city
function findNearbyDoctors(userLat, userLng, userCity = "") {
  const allDocs = db.getDoctors();

  if (userLat && userLng) {
    const docsWithDistance = allDocs.map(doc => {
      const distance = calculateDistance(userLat, userLng, doc.lat, doc.lng);
      return { ...doc, distanceKm: distance };
    });
    docsWithDistance.sort((a, b) => a.distanceKm - b.distanceKm);
    return docsWithDistance.slice(0, 4);
  } else if (userCity) {
    const cityClean = userCity.toLowerCase().trim();
    const cityMatches = allDocs.filter(d => d.city.toLowerCase().includes(cityClean));
    if (cityMatches.length > 0) {
      return cityMatches.map(d => ({ ...d, distanceKm: "In your city" }));
    }
  }

  return allDocs.slice(0, 4).map(d => ({ ...d, distanceKm: "Nearby Region" }));
}

// Main Interactive Triage Analyzer
function analyzeSymptoms(query, userLocation = {}, language = "en", clinicalProfile = {}) {
  const queryLower = query.toLowerCase();
  let isSevere = false;
  let severeMatches = [];

  // Check severe red-flags immediately
  for (const pattern of SEVERE_PATTERNS) {
    if (pattern.test(queryLower)) {
      isSevere = true;
      severeMatches.push(query.match(pattern)[0]);
    }
  }

  const nearbyDoctors = findNearbyDoctors(userLocation.lat, userLocation.lng, userLocation.city);

  if (isSevere) {
    return {
      triageLevel: "SEVERE",
      isEmergency: true,
      needsClarification: false,
      detectedSymptoms: severeMatches,
      message: "⚠️ CRITICAL MEDICAL ALERT: Your reported symptoms indicate a potentially severe condition that requires immediate professional medical evaluation. Please DO NOT take self-medication tablets. Visit the nearest emergency room or consult a specialist doctor immediately.",
      medicines: [],
      dosageSchedule: null,
      doctors: nearbyDoctors,
      followupRecommended: true,
      actionRequired: "IMMEDIATE_DOCTOR_CONSULTATION"
    };
  }

  // Detect Symptoms
  const allMedicines = db.getMedicines();
  const matchedMeds = [];
  const detectedSymptoms = [];

  for (const med of allMedicines) {
    for (const sym of med.symptoms) {
      if (queryLower.includes(sym.toLowerCase())) {
        if (!matchedMeds.some(m => m.id === med.id)) {
          matchedMeds.push(med);
        }
        if (!detectedSymptoms.includes(sym)) {
          detectedSymptoms.push(sym);
        }
      }
    }
  }

  // Extract age if mentioned in query (e.g. "age 25", "25 years old", "30yo", "child", "elderly")
  const ageMatch = queryLower.match(/(?:age|aged|i am|years old|yr old)\s*[:=]?\s*(\d{1,2})/i);
  let patientAge = clinicalProfile.age || (ageMatch ? parseInt(ageMatch[1], 10) : null);
  const isChild = queryLower.includes("child") || queryLower.includes("baby") || queryLower.includes("kid") || (patientAge !== null && patientAge < 12);
  const isElderly = queryLower.includes("elderly") || queryLower.includes("senior") || queryLower.includes("old age") || (patientAge !== null && patientAge >= 65);

  // Check if clinical details have been provided
  const hasHistory = (clinicalProfile.medicalHistory && clinicalProfile.medicalHistory !== "None reported" && clinicalProfile.medicalHistory !== "None") ||
                     queryLower.includes("no other meds") ||
                     queryLower.includes("no meds") ||
                     queryLower.includes("no medication") ||
                     queryLower.includes("no other medication") ||
                     queryLower.includes("no health issue") ||
                     queryLower.includes("no health issues") ||
                     queryLower.includes("no issues") ||
                     queryLower.includes("none") ||
                     queryLower.includes("healthy") ||
                     queryLower.includes("mild") ||
                     queryLower.includes("diabetes") ||
                     queryLower.includes("sugar") ||
                     queryLower.includes("bp") ||
                     queryLower.includes("hypertension") ||
                     queryLower.includes("asthma") ||
                     queryLower.includes("ulcer") ||
                     queryLower.includes("skip");

  // If symptoms are detected but age or health conditions are completely unknown, ask first!
  const hasAgeInfo = patientAge !== null || isChild || isElderly || queryLower.includes("adult") || queryLower.includes("skip");

  if (matchedMeds.length > 0 && (!hasAgeInfo || !hasHistory) && !queryLower.includes("skip")) {
    return {
      triageLevel: "INQUIRY_REQUIRED",
      isEmergency: false,
      needsClarification: true,
      detectedSymptoms: detectedSymptoms,
      message: `I hear you regarding your symptoms (${detectedSymptoms.join(', ')}), and I want to help you get safe relief.\n\nTo ensure I recommend the correct tablet dosage and avoid dangerous drug interactions, could you please confirm:\n• **Patient Age**: (Adult, child, or senior citizen?)\n• **Current Medications**: Any daily medicines you are currently taking?\n• **Medical Conditions**: Any history of Asthma, High BP, Stomach Ulcers, or Allergies?`,
      clarificationChips: [
        "Adult (20-50 yrs) | No other meds | Mild",
        "Adult with High BP / Diabetes",
        "History of Asthma / Stomach Ulcers",
        "Senior Citizen (65+ yrs)",
        "Skip & Show General Medicines"
      ],
      medicines: [],
      scheduleSteps: [],
      doctors: nearbyDoctors.slice(0, 2),
      followupRecommended: false
    };
  }

  // Filter or adjust medicines based on patient profile
  let filteredMeds = [...matchedMeds];
  let clinicalAdvice = "";

  const medicalConditions = (clinicalProfile.medicalHistory || query).toLowerCase();

  // Condition 1: Asthma or Ulcers -> Remove or warn Combiflam/Ibuprofen
  if (medicalConditions.includes("asthma") || medicalConditions.includes("ulcer")) {
    filteredMeds = filteredMeds.filter(m => !m.name.includes("Combiflam"));
    clinicalAdvice += "\n⚠️ Precaution: Combiflam/NSAIDs have been excluded because NSAIDs can trigger bronchospasms in asthma and aggravate gastric ulcers. Paracetamol (Dolo 650) is safely retained.";
  }

  // Condition 2: Child (< 12 years)
  if (isChild) {
    clinicalAdvice += "\n⚠️ Pediatric Notice: For children under 12, solid adult tablets can cause choking or overdose. Please use pediatric oral drops/syrup under a doctor's weight-based guidance.";
  }

  // Condition 3: Elderly (>= 65)
  if (isElderly) {
    clinicalAdvice += "\n👴 Geriatric Notice: Take tablets with adequate water and avoid sedating antihistamines during daytime hours.";
  }

  // Build sequential multi-tablet schedule
  let scheduleSteps = [];
  filteredMeds.forEach((med, index) => {
    scheduleSteps.push({
      stepNumber: index + 1,
      medicine: med.name,
      genericName: med.genericName,
      timing: med.usage.mealRelation,
      idealTime: med.usage.idealTime,
      orderGuideline: med.usage.orderSequence,
      dosage: isChild ? "Pediatric syrup equivalent under doctor guidance" : med.usage.dosage,
      warnings: med.warnings
    });
  });

  return {
    triageLevel: filteredMeds.length > 0 ? "MILD" : "GENERAL_INQUIRY",
    isEmergency: false,
    needsClarification: false,
    detectedSymptoms: detectedSymptoms.length > 0 ? detectedSymptoms : ["General inquiry"],
    message: filteredMeds.length > 0
      ? `Thank you for sharing your health details. Based on your profile, here are the safe medicine recommendations and schedule:${clinicalAdvice}`
      : "I could not find an exact match for specific mild symptoms. Could you describe more about what you are feeling (e.g., headache, fever, acidity, body pain, cold)?",
    medicines: filteredMeds,
    scheduleSteps: scheduleSteps,
    doctors: nearbyDoctors.slice(0, 2),
    followupRecommended: filteredMeds.length > 0,
    actionRequired: "OTC_MEDICATION_AND_MONITOR"
  };
}

module.exports = {
  analyzeSymptoms,
  findNearbyDoctors,
  calculateDistance
};
