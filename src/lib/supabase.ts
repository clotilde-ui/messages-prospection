import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Les variables d\'environnement VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY doivent être définies');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Client {
  id: string;
  name: string;
  website_url?: string;
  baseline?: string;
  positioning_keywords?: string[];
  primary_color?: string;
  secondary_color?: string;
  dark_color?: string;
  light_color?: string;
  brand_mood?: string;
  created_at: string;
  updated_at: string;
}

export interface Analysis {
  id: string;
  client_id: string;
  website_url: string;
  brand_name: string;
  offer_details: string;
  target_audience: string;
  brand_positioning: string;
  ad_platform: string;
  raw_content: string;
  created_at: string;
  updated_at: string;
}

export interface Concept {
  id: string;
  analysis_id: string;
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
  // image_url, image_generated_at, generated_prompt, prompt_generated_at supprimés
  created_at: string;
}

export interface Settings {
  id: string;
  user_id: string;
  openai_api_key: string;
  // ideogram_api_key, google_api_key, higgsfield_api_key, higgsfield_secret supprimés
  is_admin?: boolean;
  created_at: string;
  updated_at: string;
}

export interface FeatureRequest {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  upvotes_count: number;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface FeatureRequestVote {
  id: string;
  feature_request_id: string;
  user_id: string;
  created_at: string;
}

// --- Suppression de la fonction uploadImageToStorage car elle n'est plus nécessaire ---

export async function checkStorageConnection(): Promise<void> {
  // Fonction de remplacement minimaliste pour éviter les erreurs d'import/export
  // Cette fonction ne sera jamais appelée mais est laissée en cas de dépendance
  console.log("Storage check is no longer relevant for this email-only application.");
}