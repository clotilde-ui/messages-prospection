import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Save, Key, ExternalLink } from 'lucide-react';

interface SettingsProps { onBack: () => void; }

export default function Settings({ onBack }: SettingsProps) {
  const { user } = useAuth();
  const [apiKey, setApiKey] = useState('');
  
  // Clés API d'imagerie retirées de l'état
  // const [ideogramApiKey, setIdeogramApiKey] = useState('');
  // const [googleApiKey, setGoogleApiKey] = useState('');
  // const [higgsfieldApiKey, setHiggsfieldApiKey] = useState('');
  // const [higgsfieldSecret, setHiggsfieldSecret] = useState('');
  
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { loadSettings(); }, []);

  async function loadSettings() {
    if (!user) return;
    const { data } = await supabase.from('settings').select('*').eq('user_id', user.id).maybeSingle();
    if (data) {
      // Les autres champs API ne sont plus lus ou gérés ici
      setApiKey(data.openai_api_key || '');
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      const { data: existing } = await supabase.from('settings').select('id').eq('user_id', user.id).maybeSingle();
      
      const updates = { 
        openai_api_key: apiKey, 
        updated_at: new Date().toISOString() 
        // Les autres clés API ne sont plus incluses dans la mise à jour
      };

      if (existing) await supabase.from('settings').update(updates).eq('id', existing.id);
      else await supabase.from('settings').insert({ user_id: user.id, ...updates });
      
      setSaved(true); setTimeout(() => setSaved(false), 3000);
    } catch (error) { alert('Erreur lors de la sauvegarde'); console.error(error); } finally { setSaving(false); }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-2 text-[#232323]/60 hover:text-studio-accent mb-8 font-bold uppercase tracking-wider text-xs">
        <ArrowLeft className="w-4 h-4" /> Retour
      </button>

      <div className="bg-[#232323] p-8 shadow-[8px_8px_0px_0px_#FFBEFA] border-2 border-[#232323]">
        <h2 className="text-2xl font-black text-[#FAF5ED] mb-8 uppercase tracking-tight">Paramètres API</h2>
        
        {/* NOTE IMPORTANTE */}
        <div className="p-4 bg-[#2A2A2A] border border-[#3A3A3A] mb-6">
           <p className="text-xs text-studio-accent font-bold uppercase mb-2">Configuration requise</p>
           <p className="text-sm text-[#FAF5ED]/80">Seule la clé API OpenAI est nécessaire pour générer les cold emails (utilisation de GPT-4o).</p>
        </div>


        <form onSubmit={handleSave} className="space-y-6">
          {/* OpenAI (MAINTENU) */}
          <div className="p-4 bg-[#2A2A2A] border border-[#3A3A3A] border-l-4 border-l-studio-accent">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-studio-accent">OpenAI API Key (GPT-4o)</label>
              <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" className="text-[10px] text-[#FAF5ED]/50 hover:text-[#FAF5ED] flex items-center gap-1"><ExternalLink className="w-3 h-3" /> Obtenir</a>
            </div>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#FAF5ED]/30" />
              <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="sk-..." className="w-full pl-10 pr-4 py-3 bg-[#232323] border border-[#3A3A3A] text-[#FAF5ED] focus:border-studio-accent outline-none text-sm font-mono" />
            </div>
          </div>
          
          {/* Les autres champs API sont maintenant supprimés du rendu */}

          <div className="flex items-center gap-4 pt-4">
            <button type="submit" disabled={saving} className="flex items-center gap-2 px-6 py-4 bg-studio-accent text-[#232323] hover:bg-studio-accentHover transition-colors font-bold uppercase tracking-widest text-xs shadow-lg">
              <Save className="w-4 h-4" /> {saving ? '...' : 'Sauvegarder'}
            </button>
            {saved && <span className="text-studio-accent text-xs font-bold uppercase tracking-wide animate-pulse">✓ Sauvegardé</span>}
          </div>
        </form>
      </div>
    </div>
  );
}