/**
 * Canonical Health & Lab Parameter Dictionary
 * 25 standard biomarkers with synonyms, clinical reference bands, units,
 * plain-language physiological explanations, and deterministic goal-linked habit suggestions.
 */

export type BiomarkerCategory =
  | "metabolic"
  | "lipid"
  | "vitamins"
  | "liver"
  | "kidney"
  | "thyroid"
  | "hematology";

export type BiomarkerStatus = "low" | "normal" | "high" | "unknown";

export interface CanonicalBiomarkerDefinition {
  key: string;
  name: string;
  category: BiomarkerCategory;
  standardUnit: string;
  synonyms: readonly string[];
  referenceRange: {
    low: number;
    high: number;
  };
  explanation: string;
  goalLinkedHabits: {
    whenHigh?: {
      title: string;
      why: string;
      metric: string;
    };
    whenLow?: {
      title: string;
      why: string;
      metric: string;
    };
  };
}

export const CANONICAL_BIOMARKERS: Record<string, CanonicalBiomarkerDefinition> = {
  hba1c: {
    key: "hba1c",
    name: "HbA1c (Glycated Hemoglobin)",
    category: "metabolic",
    standardUnit: "%",
    synonyms: ["hba1c", "glycated hemoglobin", "a1c", "glycosylated hemoglobin"],
    referenceRange: { low: 4.0, high: 5.6 },
    explanation:
      "HbA1c reflects your average blood sugar levels over the past 2 to 3 months. Keeping it in range prevents insulin resistance and sustained fatigue.",
    goalLinkedHabits: {
      whenHigh: {
        title: "Focus on low glycemic carbs & walk after dinner",
        why: "A post-dinner 15-minute walk and complex fiber help blunt blood glucose spikes.",
        metric: "Carbs quality & post-meal movement",
      },
    },
  },

  fasting_glucose: {
    key: "fasting_glucose",
    name: "Fasting Blood Glucose",
    category: "metabolic",
    standardUnit: "mg/dL",
    synonyms: ["fasting blood sugar", "fbs", "glucose fasting", "fasting glucose"],
    referenceRange: { low: 70, high: 99 },
    explanation:
      "Measures circulating blood sugar after an overnight fast. It serves as an early indicator of metabolic efficiency.",
    goalLinkedHabits: {
      whenHigh: {
        title: "Limit refined sugars and late-night snacks",
        why: "Reducing refined evening carbohydrates helps normalize morning baseline glucose.",
        metric: "Evening sugar intake",
      },
    },
  },

  ldl_cholesterol: {
    key: "ldl_cholesterol",
    name: "LDL Cholesterol",
    category: "lipid",
    standardUnit: "mg/dL",
    synonyms: ["ldl", "low density lipoprotein", "bad cholesterol", "ldl-c"],
    referenceRange: { low: 50, high: 99 },
    explanation:
      "LDL transports lipids through the bloodstream. Elevated levels are commonly influenced by saturated fats and ultra-processed foods.",
    goalLinkedHabits: {
      whenHigh: {
        title: "Swap 2 fried snacks a week for roasted chana or nuts",
        why: "Replacing saturated oils with dietary fiber and healthy fats helps lower circulating LDL.",
        metric: "Saturated fat & whole food snacks",
      },
    },
  },

  hdl_cholesterol: {
    key: "hdl_cholesterol",
    name: "HDL Cholesterol",
    category: "lipid",
    standardUnit: "mg/dL",
    synonyms: ["hdl", "high density lipoprotein", "good cholesterol", "hdl-c"],
    referenceRange: { low: 40, high: 60 },
    explanation:
      "HDL carries excess cholesterol back to the liver for disposal. Higher levels correlate with heart and vascular resilience.",
    goalLinkedHabits: {
      whenLow: {
        title: "Include healthy fats (olive oil, walnuts, seeds)",
        why: "Omega-3 and monounsaturated fatty acids support optimal HDL production.",
        metric: "Healthy fats logged",
      },
    },
  },

  triglycerides: {
    key: "triglycerides",
    name: "Serum Triglycerides",
    category: "lipid",
    standardUnit: "mg/dL",
    synonyms: ["tg", "triglycerides", "serum tg"],
    referenceRange: { low: 50, high: 149 },
    explanation:
      "Triglycerides are the main form of stored fat in the blood. They rise quickly when consuming excess refined carbs or alcohol.",
    goalLinkedHabits: {
      whenHigh: {
        title: "Reduce sugary drinks and refined flours",
        why: "Cutting simple liquid sugars produces a rapid decline in circulating triglycerides.",
        metric: "Refined sugar tracking",
      },
    },
  },

  total_cholesterol: {
    key: "total_cholesterol",
    name: "Total Cholesterol",
    category: "lipid",
    standardUnit: "mg/dL",
    synonyms: ["serum cholesterol", "total cholesterol", "tc"],
    referenceRange: { low: 125, high: 199 },
    explanation:
      "The overall measure of all cholesterol fractions in your blood, including LDL, HDL, and VLDL.",
    goalLinkedHabits: {
      whenHigh: {
        title: "Increase soluble dietary fiber to 30g daily",
        why: "Soluble fiber binds cholesterol in the digestive tract, encouraging healthy clearance.",
        metric: "Daily fiber intake",
      },
    },
  },

  vitamin_d: {
    key: "vitamin_d",
    name: "Vitamin D (25-OH)",
    category: "vitamins",
    standardUnit: "ng/mL",
    synonyms: ["vitamin d3", "25-hydroxy vitamin d", "vit d", "25-oh vit d"],
    referenceRange: { low: 30, high: 100 },
    explanation:
      "Directly influences daily vitality, serotonin synthesis, and morning wakefulness. Low levels often manifest as unexplained brain fog, sluggish afternoon energy, and low mood.",
    goalLinkedHabits: {
      whenLow: {
        title: "15-min morning sunlight walk & fortified foods",
        why: "Bringing Vitamin D into the optimal zone uplifts daily mood, sharpens focus, and eliminates unexplained chronic fatigue.",
        metric: "Outdoor morning habit",
      },
    },
  },

  vitamin_b12: {
    key: "vitamin_b12",
    name: "Vitamin B12",
    category: "vitamins",
    standardUnit: "pg/mL",
    synonyms: ["vit b12", "cobalamin", "cyanocobalamin"],
    referenceRange: { low: 200, high: 900 },
    explanation:
      "Essential for nerve tissue health, brain function, and red blood cell production. Often lower on plant-based diets.",
    goalLinkedHabits: {
      whenLow: {
        title: "Include dairy, eggs, or fortified nutritional yeast",
        why: "Active B12 sources keep energy metabolism and mental clarity high.",
        metric: "B12 rich foods",
      },
    },
  },

  tsh: {
    key: "tsh",
    name: "Thyroid Stimulating Hormone (TSH)",
    category: "thyroid",
    standardUnit: "mIU/L",
    synonyms: ["thyroid stimulating hormone", "tsh"],
    referenceRange: { low: 0.4, high: 4.5 },
    explanation:
      "TSH regulates overall metabolic rate and temperature. Variations can alter daily energy and calorie burn.",
    goalLinkedHabits: {
      whenHigh: {
        title: "Discuss thyroid function with physician & prioritize sleep",
        why: "Elevated TSH signals the thyroid is working harder; adequate sleep protects endocrine rhythm.",
        metric: "Sleep consistency",
      },
    },
  },

  creatinine: {
    key: "creatinine",
    name: "Serum Creatinine",
    category: "kidney",
    standardUnit: "mg/dL",
    synonyms: ["creatinine", "serum creat"],
    referenceRange: { low: 0.7, high: 1.3 },
    explanation:
      "A natural waste product of muscle metabolism filtered by the kidneys. Reflects hydration and renal clearance.",
    goalLinkedHabits: {
      whenHigh: {
        title: "Maintain daily hydration (2.5L to 3L water)",
        why: "Proper hydration optimizes kidney clearance and normalizes acute creatinine levels.",
        metric: "Water intake",
      },
    },
  },

  uric_acid: {
    key: "uric_acid",
    name: "Serum Uric Acid",
    category: "kidney",
    standardUnit: "mg/dL",
    synonyms: ["uric acid", "serum urate"],
    referenceRange: { low: 3.5, high: 7.2 },
    explanation:
      "Formed when the body breaks down purines found in certain foods and beverages.",
    goalLinkedHabits: {
      whenHigh: {
        title: "Limit high-fructose corn syrup & alcohol",
        why: "Fructose and alcohol compete with uric acid excretion in the kidneys.",
        metric: "Low-purine hydration",
      },
    },
  },

  hemoglobin: {
    key: "hemoglobin",
    name: "Hemoglobin (Hb)",
    category: "hematology",
    standardUnit: "g/dL",
    synonyms: ["hb", "hemoglobin", "haemoglobin"],
    referenceRange: { low: 12.0, high: 17.5 },
    explanation:
      "The oxygen-carrying protein in red blood cells that powers physical stamina and mental alertness.",
    goalLinkedHabits: {
      whenLow: {
        title: "Pair iron-rich foods with Vitamin C (lemon on dal)",
        why: "Vitamin C triples the absorption of non-heme iron from legumes and greens.",
        metric: "Iron & Vitamin C pairing",
      },
    },
  },

  sgot_ast: {
    key: "sgot_ast",
    name: "SGOT / AST (Aspartate Aminotransferase)",
    category: "liver",
    standardUnit: "U/L",
    synonyms: ["ast", "sgot", "aspartate aminotransferase"],
    referenceRange: { low: 10, high: 40 },
    explanation:
      "A cellular enzyme found in liver and heart tissue. Mild elevations occur after intense exercise or alcohol.",
    goalLinkedHabits: {
      whenHigh: {
        title: "Focus on recovery and limit processed foods",
        why: "Reducing liver metabolic burden aids natural cellular repair.",
        metric: "Rest & liver care",
      },
    },
  },

  sgpt_alt: {
    key: "sgpt_alt",
    name: "SGPT / ALT (Alanine Aminotransferase)",
    category: "liver",
    standardUnit: "U/L",
    synonyms: ["alt", "sgpt", "alanine aminotransferase"],
    referenceRange: { low: 7, high: 56 },
    explanation:
      "An enzyme concentrated specifically in liver cells, commonly monitored for metabolic liver health.",
    goalLinkedHabits: {
      whenHigh: {
        title: "Reduce refined carbohydrates and saturated fats",
        why: "Managing total caloric surplus decreases intra-hepatic fat accumulation.",
        metric: "Whole food balance",
      },
    },
  },

  ferritin: {
    key: "ferritin",
    name: "Serum Ferritin",
    category: "hematology",
    standardUnit: "ng/mL",
    synonyms: ["ferritin", "serum ferritin"],
    referenceRange: { low: 20, high: 250 },
    explanation:
      "The body's primary iron storage buffer. Low levels indicate depleted iron reserves before anemia develops.",
    goalLinkedHabits: {
      whenLow: {
        title: "Incorporate lentils, spinach, seeds, or lean proteins",
        why: "Replenishing dietary iron stores rebuilds cellular energy and stamina.",
        metric: "Iron rich meals",
      },
    },
  },

  calcium: {
    key: "calcium",
    name: "Total Serum Calcium",
    category: "metabolic",
    standardUnit: "mg/dL",
    synonyms: ["calcium", "serum calcium"],
    referenceRange: { low: 8.5, high: 10.5 },
    explanation:
      "Vital for muscle contractions, nerve transmission, and structural bone density.",
    goalLinkedHabits: {
      whenLow: {
        title: "Include calcium sources (paneer, sesame seeds, ragi)",
        why: "Nutrient-dense calcium foods support bone mineralization.",
        metric: "Calcium-rich foods",
      },
    },
  },

  bun: {
    key: "bun",
    name: "Blood Urea Nitrogen (BUN)",
    category: "kidney",
    standardUnit: "mg/dL",
    synonyms: ["bun", "blood urea nitrogen", "urea"],
    referenceRange: { low: 7, high: 20 },
    explanation:
      "Measures urea nitrogen from protein breakdown; sensitive to protein intake levels and fluid hydration.",
    goalLinkedHabits: {
      whenHigh: {
        title: "Balance hydration with high-protein intake",
        why: "Adequate water helps kidneys smoothly clear metabolic nitrogen.",
        metric: "Hydration balance",
      },
    },
  },
};

/**
 * Normalizes an arbitrary extracted test name to a canonical biomarker key.
 */
export function matchCanonicalBiomarker(rawName: string): CanonicalBiomarkerDefinition | null {
  const cleaned = rawName.toLowerCase().trim();
  for (const biomarker of Object.values(CANONICAL_BIOMARKERS)) {
    if (biomarker.key === cleaned || biomarker.name.toLowerCase() === cleaned) {
      return biomarker;
    }
    for (const syn of biomarker.synonyms) {
      if (cleaned.includes(syn) || syn.includes(cleaned)) {
        return biomarker;
      }
    }
  }
  return null;
}

