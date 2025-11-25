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
  media_type: 'video' | 'static' | 'email'; // <-- AJOUT DE 'email'
}

// --- GENERATION DE CONCEPTS VIDÉOS (INCHANGÉE) ---
export async function generateVideoConcepts(
  brandName: string,
  websiteUrl: string,
  offerDetails: string,
  targetAudience: string,
  brandPositioning: string,
  apiKey: string
): Promise<ConceptData[]> {
  const prompt = `Tu es un creative strategist expert en publicité digitale (Meta Ads, TikTok Ads, etc.) avec une logique TOFU / MOFU / BOFU.

Ta mission est de générer des concepts créatifs de vidéos publicitaires (ads) pour la marque suivante :

Marque : ${brandName}
Site : ${websiteUrl}
Offre / Produits / Services : ${offerDetails}
Cibles prioritaires : ${targetAudience}
Positionnement et ton de marque : ${brandPositioning}

Contraintes :
- Proposer au moins 5 concepts par étape du funnel (TOFU, MOFU, BOFU).
- Chaque concept doit inclure :
  * Concept : idée créative
  * Format : type de contenu (UGC, micro-trottoir, trend, témoignage, etc.)
  * Hook : 3 propositions d'accroches différentes, chacune adressant un pain point différent
  * Objectif marketing : awareness, considération, conversion
  * Scroll stopper : élément visuel ou sonore qui capte l'attention dès les premières secondes
  * Problème : le pain point principal adressé
  * Solution : comment le produit/service résout ce problème
  * Bénéfices : les avantages concrets pour le client
  * Preuve : éléments de crédibilité (témoignages, statistiques, études, etc.)
  * CTA : call to action clair et incitatif
  * Visuel suggéré : description du style visuel et des plans recommandés
  * Script en grandes lignes : résumé du déroulé complet de la vidéo

Les formats par étape sont donnés à titre indicatif :
- TOFU : podcast, micro-trottoir, trend, etc.
- MOFU : UGC explicatifs, bénéfices produits, taglines, etc.
- BOFU : offres spéciales, avis clients, articles de presse, etc.

Le ton doit être simple, spontané et empathique, comme sur les réseaux sociaux, pour stopper le scroll et inciter à l'action.

Réponds UNIQUEMENT avec un JSON valide au format suivant (array de 15 objets minimum - 5 par stage):
[
  {
    "funnel_stage": "TOFU",
    "concept": "Description du concept",
    "format": "Type de format",
    "hooks": ["Hook 1", "Hook 2", "Hook 3"],
    "marketing_objective": "awareness",
    "scroll_stopper": "Description du scroll stopper",
    "problem": "Description du problème",
    "solution": "Description de la solution",
    "benefits": "Description des bénéfices",
    "proof": "Éléments de preuve",
    "cta": "Call to action",
    "suggested_visual": "Description du visuel suggéré",
    "script_outline": "Résumé du script complet"
  }
]`;

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
          content: 'Tu es un creative strategist expert. Réponds toujours avec un JSON valide, sans markdown ni texte additionnel.'
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
    throw new Error(error.error?.message || 'Failed to generate concepts');
  }

  const data = await response.json();
  const content = data.choices[0].message.content;

  const jsonMatch = content.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('Invalid response format from OpenAI');
  }

  const concepts = JSON.parse(jsonMatch[0]);
  return concepts.map((c: ConceptData) => ({ ...c, media_type: 'video' as const }));
}

// --- GENERATION DE CONCEPTS STATIQUES (INCHANGÉE) ---
export async function generateStaticConcepts(
  brandName: string,
  websiteUrl: string,
  offerDetails: string,
  targetAudience: string,
  brandPositioning: string,
  apiKey: string
): Promise<ConceptData[]> {
  const prompt = `Tu es un creative strategist expert en publicité digitale statique (Meta Ads, LinkedIn Ads, etc.) avec une logique TOFU / MOFU / BOFU.

Ta mission est de générer des concepts créatifs de publicités statiques (images, carrousels) pour la marque suivante :

Marque : ${brandName}
Site : ${websiteUrl}
Offre / Produits / Services : ${offerDetails}
Cibles prioritaires : ${targetAudience}
Positionnement et ton de marque : ${brandPositioning}

Contraintes :
- Proposer au moins 5 concepts par étape du funnel (TOFU, MOFU, BOFU).
- Chaque concept doit inclure :
  * Concept : idée créative
  * Format : type de contenu (image unique, carrousel, infographie, citation, avant/après, etc.)
  * Hook : 3 propositions de titres/headlines différents, chacun adressant un pain point différent
  * Objectif marketing : awareness, considération, conversion
  * Problème : le pain point principal adressé
  * Solution : comment le produit/service résout ce problème
  * Bénéfices : les avantages concrets pour le client
  * Preuve : éléments de crédibilité (témoignages, statistiques, études, badges, etc.)
  * CTA : call to action clair et incitatif
  * Visuel suggéré : description détaillée du visuel statique (composition, éléments visuels, hiérarchie, couleurs, style)

Les formats par étape sont donnés à titre indicatif :
- TOFU : infographie, citation inspirante, statistique choc, question provocante, etc.
- MOFU : carrousel bénéfices, comparaison avant/après, features produit, témoignages visuels, etc.
- BOFU : offre promotionnelle, garanties, preuves sociales, urgence/rareté, etc.

Le ton doit être percutant, clair et persuasif, adapté aux publicités statiques pour stopper le scroll et inciter à l'action.

Réponds UNIQUEMENT avec un JSON valide au format suivant (array de 15 objets minimum - 5 par stage):
[
  {
    "funnel_stage": "TOFU",
    "concept": "Description du concept",
    "format": "Type de format",
    "hooks": ["Headline 1", "Headline 2", "Headline 3"],
    "marketing_objective": "awareness",
    "scroll_stopper": "",
    "problem": "Description du problème",
    "solution": "Description de la solution",
    "benefits": "Description des bénéfices",
    "proof": "Éléments de preuve",
    "cta": "Call to action",
    "suggested_visual": "Description détaillée du visuel statique",
    "script_outline": ""
  }
]`;

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
          content: 'Tu es un creative strategist expert. Réponds toujours avec un JSON valide, sans markdown ni texte additionnel.'
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
    throw new Error(error.error?.message || 'Failed to generate concepts');
  }

  const data = await response.json();
  const content = data.choices[0].message.content;

  const jsonMatch = content.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('Invalid response format from OpenAI');
  }

  const concepts = JSON.parse(jsonMatch[0]);
  return concepts.map((c: ConceptData) => ({ ...c, media_type: 'static' as const }));
}


// --- NOUVEAU : GENERATION DE COLD EMAILS ---
export async function generateColdEmails(
  brandName: string,
  websiteUrl: string,
  offerDetails: string,
  targetAudience: string,
  brandPositioning: string,
  apiKey: string
): Promise<ConceptData[]> {
  const prompt = `Tu es un expert en prospection B2B et en écriture de Cold Emails performants, structurés selon une séquence TOFU / MOFU / BOFU.

Ta mission est de générer des concepts de Cold Emails pour la marque suivante :

Marque : ${brandName}
Site : ${websiteUrl}
Offre / Produits / Services : ${offerDetails}
Cibles prioritaires : ${targetAudience}
Positionnement et ton de marque : ${brandPositioning}

Contraintes :
- Proposer au moins 5 concepts d'emails par étape du funnel (TOFU : Cold/Breakthrough; MOFU : Value/Case Study; BOFU : Offer/CTA).
- Chaque concept doit inclure :
  * Concept : L'idée principale de l'email (e.g., "Email de connexion personnalisé").
  * Format : Type de contenu (e.g., "Email de 3 paragraphes", "Email de suivi bref").
  * Hook : 3 propositions d'objets d'email percutants.
  * Marketing Objective : L'objectif de l'email (e.g., "Prise de rendez-vous", "Téléchargement d'un guide", "Réponse").
  * Scroll Stopper : Une phrase d'accroche pour la **première ligne du corps de l'email** (qui s'affiche en aperçu).
  * Problème : Le pain point adressé.
  * Solution : Comment le produit résout le problème (Proposition de valeur).
  * Bénéfices : Les avantages concrets pour le prospect.
  * Preuve : Éléments de crédibilité.
  * CTA : Call to action clair.
  * Suggested Visual : **Le corps complet et brut de l'email (sans balises HTML, juste le texte formaté avec des sauts de ligne, en utilisant des variables comme {FirstName} et {Company} pour la personnalisation)**.
  * Script Outline : Un résumé de la stratégie de la séquence complète si cet email en fait partie.
  * Media Type: Définis toujours 'email'
  
Le ton doit être direct, personnalisé et axé sur la valeur ajoutée pour l'audience cible.

Réponds UNIQUEMENT avec un JSON valide au format suivant (array de 15 objets minimum - 5 par stage). Pour la clé "suggested_visual", utilise le corps de l'email.
[
  {
    "funnel_stage": "TOFU",
    "concept": "Email de connexion avec référence à l'activité récente",
    "format": "Email simple",
    "hooks": ["Objet 1 (Personnalisation)", "Objet 2 (Douleur)", "Objet 3 (Intérêt)"],
    "marketing_objective": "lead_qualification",
    "scroll_stopper": "J'ai remarqué [élément personnalisé]...",
    "problem": "Description du problème",
    "solution": "Description de la solution",
    "benefits": "Description des bénéfices",
    "proof": "Éléments de preuve",
    "cta": "Call to action",
    "suggested_visual": "Bonjour {FirstName},\n\nJ'ai vu que {Company} travaillait sur [élément personnalisé]. C'est exactement le moment où la [douleur] que nous résolvons devient critique.\n\nNous aidons des entreprises comme la vôtre à [résultat]. Est-ce que cela pourrait avoir un impact chez vous ?\n\nSouhaitez-vous un échange rapide de 15 min ?\n\nCordialement,\n[Votre Nom]",
    "script_outline": "Séquence de 3 emails : Contact, Suivi (Valeur), Rupture.",
    "media_type": "email"
  }
]`;

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
          content: 'Tu es un expert en Cold Emailing. Réponds toujours avec un JSON valide, sans markdown ni texte additionnel.'
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
    throw new Error(error.error?.message || 'Failed to generate cold emails');
  }

  const data = await response.json();
  const content = data.choices[0].message.content;

  const jsonMatch = content.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('Invalid response format from OpenAI');
  }

  const concepts = JSON.parse(jsonMatch[0]);
  return concepts.map((c: ConceptData) => ({ 
    ...c, 
    media_type: 'email' as const, 
    scroll_stopper: c.hooks[0] || c.scroll_stopper, 
    suggested_visual: c.suggested_visual, 
    script_outline: c.script_outline || '' 
  }));
}

// --- GENERATION IMAGES (OPENAI) (INCHANGÉE) ---
export async function generateImage(
  prompt: string,
  apiKey: string
): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt: prompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to generate image');
  }

  const data = await response.json();
  return data.data[0].url;
}

// --- GENERATION IMAGES (IDEOGRAM) (INCHANGÉE) ---
export async function generateImageIdeogram(
  prompt: string,
  apiKey: string
): Promise<string> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const edgeFunctionUrl = `${supabaseUrl}/functions/v1/generate-image-ideogram`;

  try {
    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({
        prompt,
        apiKey,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Ideogram Edge Function error:', errorData);
      throw new Error(errorData.error || 'Failed to generate image with Ideogram');
    }

    const data = await response.json();
    return data.data[0].url;
  } catch (error) {
    console.error('Ideogram generation error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to connect to Ideogram API');
  }
}

// --- GENERATION IMAGES (GOOGLE) (INCHANGÉE) ---
export async function generateImageGoogle(
  prompt: string,
  apiKey: string
): Promise<string> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const edgeFunctionUrl = `${supabaseUrl}/functions/v1/generate-image-google`;

  try {
    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({
        prompt,
        apiKey,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Google Edge Function error:', errorData);
      throw new Error(errorData.error || 'Failed to generate image with Google');
    }

    const data = await response.json();
    return data.url;
  } catch (error) {
    console.error('Google generation error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to connect to Google API');
  }
}

// --- GENERATION IMAGES (NANO BANANA / HIGGSFIELD) (INCHANGÉE) ---
export async function generateImageNanoBanana(
  prompt: string,
  apiKey: string,
  apiSecret: string
): Promise<string> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const edgeFunctionUrl = `${supabaseUrl}/functions/v1/generate-image-nanobanana`;

  try {
    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({
        prompt,
        apiKey,
        apiSecret,
        aspect_ratio: "1:1" // Carré par défaut
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Nano Banana Edge Function error:', errorData);
      throw new Error(errorData.error || 'Failed to generate image with Nano Banana');
    }

    const data = await response.json();
    return data.url;
  } catch (error) {
    console.error('Nano Banana generation error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to connect to Nano Banana API');
  }
}