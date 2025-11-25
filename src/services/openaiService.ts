// Suppression de l'import OpenAI car il n'est pas utilisé (corrige TS6133)

export interface ConceptData {
  funnel_stage: string;
  concept: string;
  format: string;
  hooks: string[];
  marketing_objective: string;
  scroll_stopper: string;
  problem: string;
  solution: string;
  benefits: string;
  proof: string;
  cta: string;
  suggested_visual: string;
  script_outline: string;
  media_type: 'email'; // CONSTRAINT À 'email'
}

// --- GENERATION DE COLD EMAILS (Prompt Amélioré) ---
export async function generateColdEmails(
  brandName: string,
  websiteUrl: string,
  offerDetails: string,
  targetAudience: string,
  brandPositioning: string,
  apiKey: string
): Promise<ConceptData[]> {
  const prompt = `Tu es un Copywriter Senior spécialisé en Cold Email B2B, avec plus de 10 ans d'expérience et une expertise reconnue pour générer des taux de réponse élevés (44%+). Ton unique but est de créer des emails qui génèrent des conversations.

Marque : ${brandName}
Site : ${websiteUrl}
Offre / Produits / Services : ${offerDetails}
Cibles prioritaires : ${targetAudience}
Positionnement et ton de marque : ${brandPositioning}

---
RÈGLES IMPÉRATIVES DE COPYWRITING :
1.  Longueur maximale : 300 mots.
2.  Format : Simple, 10-12 lignes maximum. Pas de longs paragraphes.
3.  Jargon : Vocabulaire simple, compréhensible par un enfant de 10 ans. PAS de jargon professionnel ou de mots compliqués.
4.  Ton : Absolument PAS commercial ("anti-salesy"). Créer une conversation, ne pas vendre. ÉVITER : "Ça vous intéresse?", "Avez-vous déjà envisagé...", "Imaginez".
5.  Contenu : Doit fournir ou promettre une valeur concrète et ciblée.
6.  CTA : DOIT inclure UN SEUL appel à l'action/question, clairement formulé et vague pour un premier contact (ex: "Peut-on entrer en contact?").
7.  Interdiction : Pas de spam words, pas d'images, pas de code, pas de liens.
8.  Personnalisation : Utiliser les variables {FirstName} (prénom), {Company} (entreprise), {PainPoint} (douleur principale de la cible), {ValueProp} (résultat clé).

---
TEMPLATE À SUIVRE POUR LA CLÉ "suggested_visual" :
[salutation] [prénom],
[Part 1 : Context et raison de la prise de contact, 1-2 phrases maximum.]
[Part 2 : Proposition de valeur pertinente et pont vers la conversation (le Bridge). 1-2 phrases. Doit communiquer la proposition de valeur de manière générale et se terminer par une phrase de transition qui incite à converser pour résoudre un besoin implicite.]
[Part 3 : Projection de la valeur (Vivid Projection). 1-2 phrases. Le prospect doit se projeter dans le résultat. Utiliser le framework : "Concrètement, nous aidons {clients} à {résoudre problème} de {métrique} en {délai}, sans {douleur}."]
[Part 4 : Appel à l’action vague pour amener à un échange rapide (UN SEUL CTA).]
[Part 5 : salutation]

---
FORMAT DE RÉPONSE :
Tu dois générer 5 concepts d'emails basés sur le framework ci-dessus.
Ensuite, dans la clé "script_outline", tu ajouteras l'analyse de chaque concept.

Réponds UNIQUEMENT avec un JSON valide au format suivant (array de 5 objets):
[
  {
    "funnel_stage": "TOFU",
    "concept": "Idée principale du Cold Email (ex: Connexion personnalisée par trigger)",
    "format": "Email conversationnel, 4 parties",
    "hooks": ["Objet 1", "Objet 2", "Objet 3"],
    "marketing_objective": "Générer un échange qualifié",
    "scroll_stopper": "Accroche pour la ligne d'aperçu de l'email",
    "problem": "Pain point majeur adressé",
    "solution": "Solution générale apportée",
    "benefits": "Résultat clé pour le prospect",
    "proof": "Chiffre/preuve qui valide la projection (ex: 44% de taux de réponse)",
    "cta": "Question simple pour engager la conversation (ex: Peut-on en discuter 15 min ?)",
    "suggested_visual": "Corps de l'email FORMATTÉ en texte simple, suivant le template 5 parties, et utilisant les variables de personnalisation.",
    "script_outline": "Analyse du concept : Pourquoi ce concept est bon (le Bridge et la Projection sont-ils forts ?)"
  }
]

Rédige ces 5 emails en utilisant les données scrapées ci-dessus. **Assure-toi que la clé "suggested_visual" contienne le corps de l'email final.**`;

// L'appel à l'API est inchangé, mais nous nous assurons que le modèle utilisé est performant.
// Nous modifions la logique de parsing pour extraire et renvoyer les 5 concepts,
// et nous ajoutons une étape de génération d'analyse et de réécriture après les 5 concepts.
// Étant donné la complexité de l'analyse demandée (points 2 à 6), nous allons séparer la requête en deux parties.

// Première partie : Génération des 5 concepts.

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o', 
      messages: [
        {
          role: 'system',
          content: 'Tu es un expert en Cold Emailing. Réponds toujours avec un JSON valide, sans markdown ni texte additionnel. Le JSON doit contenir EXACTEMENT 5 objets d\'email générés.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to generate cold emails (Phase 1)');
  }

  const data = await response.json();
  const content = data.choices[0].message.content;

  const jsonMatch = content.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('Invalid response format from OpenAI (Phase 1)');
  }

  const generatedConcepts = JSON.parse(jsonMatch[0]) as ConceptData[];
  
  if (generatedConcepts.length === 0) {
      throw new Error('No concepts were generated by the AI.');
  }

  // --- NOUVELLE PHASE : ANALYSE ET AMÉLIORATION ---
  // Nous envoyons les concepts générés à l'IA pour l'analyse et la réécriture demandées.

  const analysisPrompt = `
PHASE 2: ANALYSE CRITIQUE ET AMÉLIORATION DU COLD EMAIL

Tu as généré 5 Cold Emails. Maintenant, effectue l'analyse et l'amélioration critique suivantes, en te basant sur le template de haute performance et les règles strictes d'anti-vente fournies précédemment.

DONNÉES CLIENT:
Marque : ${brandName}
Offre : ${offerDetails}

LES 5 CONCEPTS GÉNÉRÉS:
${JSON.stringify(generatedConcepts, null, 2)}

---

TA MISSION D'ANALYSTE ET DE RÉDACTEUR SENIOR:
1.  **Choix du Meilleur:** Parmi les 5 concepts ci-dessus (index 0 à 4), identifie celui que tu considères comme le plus efficace pour atteindre l'objectif (obtenir un appel ASAP avec un prospect qualifié).
2.  **Justification:** Explique la raison de ton choix en t'appuyant sur les règles du prompt original (Part 1, Bridge, Projection, CTA, Anti-salesy).
3.  **Suggestion d'Amélioration:** Propose une amélioration concrète pour rendre l'email choisi (suggested_visual) encore plus efficace.
4.  **Réécriture:** Réécris l'email choisi en appliquant la suggestion du point 3.
5.  **Test personnel:** Réponds à la question: Répondrais-tu à cet email toi-même si tu étais le prospect ciblé ? (OUI/NON/PEUT-ÊTRE) Justifie.
6.  **Réécriture finale (si NON):** Si la réponse est NON, réécris l'email une dernière fois pour le rendre irrésistible. Si la réponse est OUI, réécris l'email pour le rendre parfait.

Réponds UNIQUEMENT avec un JSON valide au format suivant (sans markdown ni texte additionnel) :
{
  "best_concept_index": 0, // Index (0 à 4) du meilleur concept
  "justification": "Explication basée sur les parties du template et les règles d'anti-vente.",
  "improvement_suggestion": "Suggestion pour rendre l'email plus efficace (ex: rendre la projection plus émotionnelle).",
  "rewritten_email_final": "Corps de l'email FINAL, réécrit en texte brut, suivant toutes les règles.",
  "self_reply_test": "OUI/NON/PEUT-ÊTRE",
  "self_reply_justification": "Pourquoi je répondrais ou non.",
  "rewritten_email_for_reply": "Corps de l'email PARFAIT (si nécessaire, sinon même que 'rewritten_email_final').",
  "final_hooks": ["Objet final 1", "Objet final 2", "Objet final 3"]
}
`;

  const analysisResponse = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o', // Utilisation de GPT-4o pour l'analyse complexe
      messages: [
        {
          role: 'system',
          content: 'Tu es un Copywriter Senior et un analyste. Réponds toujours avec un JSON valide, sans markdown ni texte additionnel.'
        },
        {
          role: 'user',
          content: analysisPrompt
        }
      ],
      temperature: 0.5, // Température plus basse pour l'analyse
      max_tokens: 3000,
    }),
  });

  if (!analysisResponse.ok) {
    const error = await analysisResponse.json();
    throw new Error(error.error?.message || 'Failed to generate cold emails (Phase 2 - Analysis)');
  }

  const analysisData = await analysisResponse.json();
  const analysisContent = analysisData.choices[0].message.content;
  
  let analysisResult: any;
  try {
    const jsonMatch = analysisContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No analysis JSON found');
    analysisResult = JSON.parse(jsonMatch[0]);
  } catch (e) {
    console.error("Failed to parse AI Analysis JSON:", analysisContent);
    throw new Error("AI analysis response format error");
  }

  // --- INTÉGRATION DES RÉSULTATS DANS LA RÉPONSE FINALE ---

  // 1. Mise à jour du meilleur concept avec la version réécrite
  const bestConceptIndex = analysisResult.best_concept_index || 0;
  let finalConcepts = generatedConcepts.map((c, i) => {
    if (i === bestConceptIndex) {
      // Remplace le corps de l'email et les hooks par la version finale améliorée
      return {
        ...c,
        suggested_visual: analysisResult.rewritten_email_for_reply || analysisResult.rewritten_email_final,
        hooks: analysisResult.final_hooks || c.hooks,
        concept: c.concept + " (Version Améliorée Finale)",
        // Ajout de l'analyse complète dans script_outline pour consultation
        script_outline: `--- ANALYSE DÉTAILLÉE ---\nChoix: ${analysisResult.justification}\nAmélioration suggérée: ${analysisResult.improvement_suggestion}\nTest personnel: ${analysisResult.self_reply_test} - ${analysisResult.self_reply_justification}\n--- CORPS FINAL AMÉLIORÉ ---\n${analysisResult.rewritten_email_for_reply || analysisResult.rewritten_email_final}`
      };
    }
    return c;
  });

  // 2. Ajout de l'analyse complète comme dernier élément de la liste
  // Ceci permet au développeur d'afficher l'analyse critique dans l'interface si nécessaire.
  const analysisConcept: ConceptData = {
    funnel_stage: "ANALYSIS",
    concept: "Analyse Critique et Meilleur Email",
    format: "Rapport",
    hooks: analysisResult.final_hooks || generatedConcepts[bestConceptIndex].hooks,
    marketing_objective: "Optimisation de la performance",
    scroll_stopper: analysisResult.rewritten_email_for_reply?.split('\n')[1] || analysisResult.rewritten_email_final?.split('\n')[1] || '',
    problem: "Optimisation du taux de réponse",
    solution: "Application du framework de copywriting",
    benefits: "Taux de réponse > 40%",
    proof: `Index choisi: ${bestConceptIndex}, Répondrais-je: ${analysisResult.self_reply_test}`,
    cta: "Voir le Corps de l'Email Final",
    suggested_visual: analysisResult.rewritten_email_for_reply || analysisResult.rewritten_email_final,
    script_outline: `JUSTIFICATION:\n${analysisResult.justification}\n\nAMÉLIORATION SUGGÉRÉE:\n${analysisResult.improvement_suggestion}\n\nTEST PERSONNEL:\n${analysisResult.self_reply_test} - ${analysisResult.self_reply_justification}\n\nCORPS FINAL AMÉLIORÉ (copiable ci-dessous):\n${analysisResult.rewritten_email_for_reply || analysisResult.rewritten_email_final}`,
    media_type: 'email'
  };
  finalConcepts.push(analysisConcept);
  
  return finalConcepts.map((c: ConceptData) => ({ 
    ...c, 
    media_type: 'email' as const, 
    scroll_stopper: c.hooks[0] || c.scroll_stopper, 
    suggested_visual: c.suggested_visual, 
    script_outline: c.script_outline || '' 
  }));
}
// Suppression des fonctions images/vidéos... (déjà fait)