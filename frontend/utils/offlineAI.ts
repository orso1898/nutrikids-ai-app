// Fallback AI per modalità offline
// Regole base e database cibi per funzionamento senza connessione

interface FoodItem {
  name: string;
  category: string;
  calories: number;
  proteins: number;
  carbs: number;
  fats: number;
  fiber: number;
  allergens: string[];
}

// Database cibi comuni (valori per 100g)
const COMMON_FOODS: FoodItem[] = [
  // Cereali e derivati
  { name: 'Pasta', category: 'cereali', calories: 350, proteins: 12, carbs: 72, fats: 1.5, fiber: 3, allergens: ['glutine'] },
  { name: 'Riso', category: 'cereali', calories: 130, proteins: 2.7, carbs: 28, fats: 0.3, fiber: 0.4, allergens: [] },
  { name: 'Pane', category: 'cereali', calories: 265, proteins: 9, carbs: 49, fats: 3.2, fiber: 3.8, allergens: ['glutine'] },
  { name: 'Fette biscottate', category: 'cereali', calories: 410, proteins: 11, carbs: 76, fats: 6, fiber: 4, allergens: ['glutine'] },
  
  // Proteine
  { name: 'Pollo', category: 'proteine', calories: 165, proteins: 31, carbs: 0, fats: 3.6, fiber: 0, allergens: [] },
  { name: 'Manzo', category: 'proteine', calories: 250, proteins: 26, carbs: 0, fats: 17, fiber: 0, allergens: [] },
  { name: 'Pesce', category: 'proteine', calories: 82, proteins: 17, carbs: 0, fats: 1, fiber: 0, allergens: ['pesce'] },
  { name: 'Uova', category: 'proteine', calories: 155, proteins: 13, carbs: 1.1, fats: 11, fiber: 0, allergens: ['uova'] },
  { name: 'Lenticchie', category: 'proteine', calories: 116, proteins: 9, carbs: 20, fats: 0.4, fiber: 8, allergens: [] },
  
  // Latticini
  { name: 'Latte', category: 'latticini', calories: 42, proteins: 3.4, carbs: 5, fats: 1, fiber: 0, allergens: ['lattosio'] },
  { name: 'Yogurt', category: 'latticini', calories: 59, proteins: 3.5, carbs: 4.7, fats: 3.3, fiber: 0, allergens: ['lattosio'] },
  { name: 'Formaggio', category: 'latticini', calories: 402, proteins: 25, carbs: 1.3, fats: 33, fiber: 0, allergens: ['lattosio'] },
  { name: 'Parmigiano', category: 'latticini', calories: 431, proteins: 36, carbs: 4.1, fats: 29, fiber: 0, allergens: ['lattosio'] },
  
  // Verdure
  { name: 'Pomodoro', category: 'verdure', calories: 18, proteins: 0.9, carbs: 3.9, fats: 0.2, fiber: 1.2, allergens: [] },
  { name: 'Carote', category: 'verdure', calories: 41, proteins: 0.9, carbs: 10, fats: 0.2, fiber: 2.8, allergens: [] },
  { name: 'Spinaci', category: 'verdure', calories: 23, proteins: 2.9, carbs: 3.6, fats: 0.4, fiber: 2.2, allergens: [] },
  { name: 'Zucchine', category: 'verdure', calories: 17, proteins: 1.2, carbs: 3.1, fats: 0.3, fiber: 1, allergens: [] },
  { name: 'Broccoli', category: 'verdure', calories: 34, proteins: 2.8, carbs: 7, fats: 0.4, fiber: 2.6, allergens: [] },
  
  // Frutta
  { name: 'Mela', category: 'frutta', calories: 52, proteins: 0.3, carbs: 14, fats: 0.2, fiber: 2.4, allergens: [] },
  { name: 'Banana', category: 'frutta', calories: 89, proteins: 1.1, carbs: 23, fats: 0.3, fiber: 2.6, allergens: [] },
  { name: 'Arancia', category: 'frutta', calories: 47, proteins: 0.9, carbs: 12, fats: 0.1, fiber: 2.4, allergens: [] },
  { name: 'Pera', category: 'frutta', calories: 57, proteins: 0.4, carbs: 15, fats: 0.1, fiber: 3.1, allergens: [] },
  
  // Condimenti
  { name: 'Olio d\'oliva', category: 'condimenti', calories: 884, proteins: 0, carbs: 0, fats: 100, fiber: 0, allergens: [] },
  { name: 'Pomodoro pelati', category: 'condimenti', calories: 24, proteins: 1, carbs: 4, fats: 0.5, fiber: 1.5, allergens: [] },
];

// Regole nutrizionali base per bambini 0-6 anni
const NUTRITION_RULES = {
  age_0_1: {
    calories_range: [650, 850],
    proteins_percent: [7, 10],
    carbs_percent: [40, 50],
    fats_percent: [40, 50],
  },
  age_1_3: {
    calories_range: [1000, 1400],
    proteins_percent: [5, 20],
    carbs_percent: [45, 65],
    fats_percent: [30, 40],
  },
  age_4_6: {
    calories_range: [1400, 1800],
    proteins_percent: [10, 30],
    carbs_percent: [45, 65],
    fats_percent: [25, 35],
  },
};

// Messaggi Coach Maya pre-generati per scenari comuni
export const OFFLINE_COACH_RESPONSES: { [key: string]: string } = {
  'rifiuto verdure': `È normale che i bambini attraversino fasi di rifiuto delle verdure! 🥦

Ecco 3 strategie efficaci:
1. 🎨 Presentazione creativa: crea piatti colorati con forme divertenti
2. 🍝 Integra le verdure: nascondi in sughi, frullati, polpette
3. 👨‍🍳 Coinvolgi il bambino: fallo scegliere e cucinare insieme

Ricorda: servono 10-15 esposizioni prima che un bambino accetti un nuovo cibo. Pazienza! 💚`,

  'allergie': `Le allergie alimentari nei bambini richiedono attenzione ma non panico! 🛡️

Consigli pratici:
• Leggi sempre le etichette con attenzione
• Comunica le allergie a scuola/asilo
• Porta sempre farmaci prescritti
• Insegna al bambino a riconoscere cibi sicuri

Usa lo Scanner NutriKids per identificare allergeni nascosti! 📸`,

  'pasti equilibrati': `Un pasto equilibrato per bambini include:

🥗 Verdure (50%): Colorate e varie
🍗 Proteine (25%): Carne, pesce, legumi, uova
🍚 Carboidrati (25%): Pasta, riso, pane integrale
🥑 Grassi buoni: Olio d'oliva, avocado, frutta secca

💧 Non dimenticare l'acqua! Evita bibite zuccherate.`,

  'merenda sana': `Merende sane per bambini:

✅ OTTIMO:
• Frutta fresca di stagione 🍎
• Yogurt naturale + miele 🍯
• Crackers integrali + hummus
• Frutta secca (>3 anni) 🥜

❌ EVITA:
• Merendine confezionate
• Succhi di frutta industriali
• Snack fritti
• Dolci troppo zuccherati`,

  'calcio': `Il calcio è essenziale per ossa e denti forti! 🦴

Fonti di calcio (oltre il latte):
• Verdure a foglia verde (broccoli, cavolo) 🥬
• Pesce con lische (sardine, salmone) 🐟
• Semi di sesamo e mandorle 🌰
• Tofu e latte vegetale fortificato
• Acqua calcica 💧

Fabbisogno giornaliero 1-3 anni: 700mg, 4-6 anni: 1000mg`,

  'ferro': `Il ferro previene l'anemia e supporta lo sviluppo cerebrale! 🧠

Alimenti ricchi di ferro:
• Carne rossa magra 🥩
• Legumi (lenticchie, ceci) 🌱
• Verdure a foglia verde scuro 🥬
• Cereali fortificati
• Pesce 🐟

💡 TIP: La vitamina C aiuta l'assorbimento! Aggiungi agrumi o pomodori.`,

  'omega3': `Gli Omega-3 supportano sviluppo cervello e vista! 👁️🧠

Fonti migliori:
• Pesce grasso (salmone, sgombro) 🐟
• Semi di lino macinati
• Noci 🥜
• Uova omega-3 arricchite
• Olio di canola

Consiglio: 2-3 porzioni di pesce/settimana per bambini.`,

  'default': `Ciao! Sono Coach Maya 💚

Al momento sei in modalità offline, ma posso comunque aiutarti con consigli base!

Chiedi di:
• Pasti equilibrati
• Allergie alimentari
• Merende sane
• Rifiuto verdure
• Calcio, ferro, omega-3

Per consigli personalizzati avanzati, riconnettiti a internet! 📡`,
};

// Calcola health score offline
export function calculateOfflineHealthScore(nutritionalInfo: {
  calories: number;
  proteins: number;
  carbs: number;
  fats: number;
  fiber: number;
}): number {
  let score = 5; // Base score

  // Valuta bilanciamento macronutrienti
  const totalMacros = nutritionalInfo.proteins + nutritionalInfo.carbs + nutritionalInfo.fats;
  const proteinsPercent = (nutritionalInfo.proteins * 4 / (totalMacros * 4 + nutritionalInfo.fats * 9)) * 100;
  const carbsPercent = (nutritionalInfo.carbs * 4 / (totalMacros * 4 + nutritionalInfo.fats * 9)) * 100;
  const fatsPercent = (nutritionalInfo.fats * 9 / (totalMacros * 4 + nutritionalInfo.fats * 9)) * 100;

  // Proteine: 10-30% (ottimale: 15-25%)
  if (proteinsPercent >= 15 && proteinsPercent <= 25) score += 1.5;
  else if (proteinsPercent >= 10 && proteinsPercent <= 30) score += 0.5;

  // Carboidrati: 45-65% (ottimale: 50-60%)
  if (carbsPercent >= 50 && carbsPercent <= 60) score += 1.5;
  else if (carbsPercent >= 45 && carbsPercent <= 65) score += 0.5;

  // Grassi: 25-35% (ottimale: 28-32%)
  if (fatsPercent >= 28 && fatsPercent <= 32) score += 1.5;
  else if (fatsPercent >= 25 && fatsPercent <= 35) score += 0.5;

  // Fibre: bonus se presenti
  if (nutritionalInfo.fiber >= 3) score += 1;
  else if (nutritionalInfo.fiber >= 1.5) score += 0.5;

  // Calorie: penalità se troppo alte per singolo pasto
  if (nutritionalInfo.calories > 600) score -= 1;

  return Math.min(10, Math.max(0, Math.round(score)));
}

// Cerca cibo nel database offline
export function searchFoodInDatabase(query: string): FoodItem | null {
  const lowerQuery = query.toLowerCase();
  const found = COMMON_FOODS.find(food => 
    food.name.toLowerCase().includes(lowerQuery)
  );
  return found || null;
}

// Genera risposta Coach Maya offline
export function getOfflineCoachResponse(userMessage: string): string {
  const lowerMessage = userMessage.toLowerCase();

  // Match parole chiave
  if (lowerMessage.includes('verdura') || lowerMessage.includes('verdure')) {
    return OFFLINE_COACH_RESPONSES['rifiuto verdure'];
  }
  if (lowerMessage.includes('allergia') || lowerMessage.includes('allergie')) {
    return OFFLINE_COACH_RESPONSES['allergie'];
  }
  if (lowerMessage.includes('equilibrato') || lowerMessage.includes('bilanciato') || lowerMessage.includes('pasto')) {
    return OFFLINE_COACH_RESPONSES['pasti equilibrati'];
  }
  if (lowerMessage.includes('merenda') || lowerMessage.includes('spuntino')) {
    return OFFLINE_COACH_RESPONSES['merenda sana'];
  }
  if (lowerMessage.includes('calcio') || lowerMessage.includes('latte')) {
    return OFFLINE_COACH_RESPONSES['calcio'];
  }
  if (lowerMessage.includes('ferro') || lowerMessage.includes('anemia')) {
    return OFFLINE_COACH_RESPONSES['ferro'];
  }
  if (lowerMessage.includes('omega') || lowerMessage.includes('pesce')) {
    return OFFLINE_COACH_RESPONSES['omega3'];
  }

  // Default response
  return OFFLINE_COACH_RESPONSES['default'];
}

// Analizza foto offline (semplificato)
export function analyzePhotoOffline(childAllergies: string[]): {
  foods_detected: any[];
  nutritional_info: any;
  allergens_detected: string[];
  allergen_warning: string;
  health_score: number;
  suggestions: string;
  offline_mode: boolean;
} {
  // Simula riconoscimento con alimenti comuni
  const sampleFoods = [
    { name: 'Pasta al pomodoro', portion: '120g', cooking_method: 'Bollita' },
    { name: 'Verdure miste', portion: '80g', cooking_method: 'Saltate' },
  ];

  // Calcola valori nutrizionali stimati
  const nutritionalInfo = {
    calories: 380,
    proteins: 14,
    carbs: 65,
    fats: 8,
    fiber: 5,
  };

  // Check allergeni
  const detectedAllergens = ['glutine'];
  const hasMatchingAllergen = detectedAllergens.some(allergen => 
    childAllergies.some(childAllergen => 
      childAllergen.toLowerCase().includes(allergen.toLowerCase())
    )
  );

  const allergenWarning = hasMatchingAllergen
    ? `⚠️ ATTENZIONE: Rilevati allergeni corrispondenti al profilo del bambino (${detectedAllergens.join(', ')})`
    : '';

  const healthScore = calculateOfflineHealthScore(nutritionalInfo);

  const suggestions = `📡 MODALITÀ OFFLINE

Analisi basata su dati salvati localmente.
Il piatto sembra equilibrato, ma per un'analisi precisa riconnettiti a internet.

💡 Suggerimenti generici:
• Aggiungi più verdure per vitamine
• Considera una fonte di proteine (carne, pesce, legumi)
• Mantieni porzioni adeguate all'età del bambino`;

  return {
    foods_detected: sampleFoods,
    nutritional_info: nutritionalInfo,
    allergens_detected: detectedAllergens,
    allergen_warning: allergenWarning,
    health_score: healthScore,
    suggestions,
    offline_mode: true,
  };
}

// Genera piano pasto base offline
export function generateOfflineMealPlan(numPeople: number = 2): any {
  return {
    monday: {
      breakfast: 'Latte + Fette biscottate con marmellata',
      lunch: 'Pasta al pomodoro + Verdure grigliate',
      dinner: 'Pollo alla piastra + Patate al forno + Insalata',
      snack: 'Frutta fresca',
    },
    tuesday: {
      breakfast: 'Yogurt + Cereali + Frutta',
      lunch: 'Riso con verdure + Pesce al vapore',
      dinner: 'Minestrone + Pane integrale',
      snack: 'Crackers integrali',
    },
    wednesday: {
      breakfast: 'Latte + Biscotti fatti in casa',
      lunch: 'Pasta al pesto + Carote crude',
      dinner: 'Polpette di legumi + Purè di patate',
      snack: 'Banana',
    },
    thursday: {
      breakfast: 'Pancake + Miele + Frutta',
      lunch: 'Risotto alla zucca + Spinaci saltati',
      dinner: 'Frittata + Pane + Pomodori',
      snack: 'Yogurt',
    },
    friday: {
      breakfast: 'Latte + Cornflakes',
      lunch: 'Pasta al tonno + Broccoli',
      dinner: 'Pizza margherita fatta in casa + Insalata',
      snack: 'Mela',
    },
    saturday: {
      breakfast: 'Pane e marmellata + Latte',
      lunch: 'Lasagne vegetariane + Insalata mista',
      dinner: 'Pesce al forno + Verdure grigliate + Pane',
      snack: 'Frutta secca (>3 anni)',
    },
    sunday: {
      breakfast: 'Torta fatta in casa + Latte',
      lunch: 'Pollo arrosto + Patate + Carote',
      dinner: 'Zuppa di legumi + Crostini',
      snack: 'Gelato alla frutta',
    },
    shopping_list: `🛒 LISTA DELLA SPESA (Modalità Offline - Base)

📡 Piano settimanale generico. Per lista personalizzata, riconnettiti a internet.

🥛 LATTICINI
• Latte (2L)
• Yogurt (6 vasetti)

🥖 CEREALI
• Pasta (500g)
• Riso (500g)
• Pane integrale
• Fette biscottate

🥩 PROTEINE
• Pollo (400g)
• Pesce (300g)
• Uova (6)
• Legumi vari (500g)

🥬 VERDURE
• Pomodori
• Carote
• Zucchine
• Spinaci
• Patate

🍎 FRUTTA
• Mele
• Banane
• Frutta di stagione

💰 Costo stimato: 35-45€ (per ${numPeople} persone)`,
  };
}

export { COMMON_FOODS, NUTRITION_RULES };
