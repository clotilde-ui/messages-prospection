import { useState, useEffect } from 'react';
import { supabase, Analysis, Concept, Client } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { generateColdEmails } from '../services/openaiService';
import { ArrowLeft, Loader, Download, FileDown, Trash2, Edit2, Check, Sparkles, FileText, X, ChevronDown, ChevronUp, Save } from 'lucide-react'; // <-- Ajout et correction des imports

interface ConceptsViewProps {
  analysis: Analysis;
  onBack: () => void;
}

// Le type Tab est fixe
type Tab = 'email'; 

export default function ConceptsView({ analysis, onBack }: ConceptsViewProps) {
  const { user } = useAuth();
  const [concepts, setConcepts] = useState<Concept[]>([]);
  // TS6133: 'setActiveTab' est retiré car non utilisé
  const [activeTab] = useState<Tab>('email'); 
  
  // Gestion de l'analyse éditable
  const [analysisParams, setAnalysisParams] = useState<Analysis>(analysis);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
  const [isSavingAnalysis, setIsSavingAnalysis] = useState(false);

  // States de génération
  const [loading, setLoading] = useState(false); // Utilisé pour le chargement initial
  const [generatingEmail, setGeneratingEmail] = useState(false); // Nouveau state spécifique
  
  // States d'édition standard
  const [editingConceptId, setEditingConceptId] = useState<string | null>(null);
  const [editedConcept, setEditedConcept] = useState<Partial<Concept>>({});
  
  // Clé API OpenAI (la seule restante)
  const [apiKey, setApiKey] = useState('');
  
  // Rétiré le state clientData car il était non lu (TS6133)
  
  useEffect(() => {
    setAnalysisParams(analysis);
    loadConcepts();
    loadApiKey();
    // Appel loadClientData maintenu car la fonction est déclarée et appelée
    loadClientData(); 
  }, [analysis.id]);

  async function loadApiKey() {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        setApiKey(data.openai_api_key || '');
      }
    } catch (error) {
      console.error('Error loading API keys:', error);
    }
  }

  async function loadClientData() {
    // Maintenu car appelé dans useEffect
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', analysis.client_id)
        .maybeSingle();

      if (error) throw error;
      return data;

    } catch (error) {
      console.error('Error loading client data:', error);
      return null;
    }
  }

  async function loadConcepts() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('concepts')
        .select('*')
        .eq('analysis_id', analysis.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setConcepts((data || []).filter(c => c.media_type === 'email') as Concept[]);
    } catch (error) {
      console.error('Error loading concepts:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveAnalysis() {
    setIsSavingAnalysis(true);
    try {
      const { error } = await supabase
        .from('analyses')
        .update({
          brand_name: analysisParams.brand_name,
          offer_details: analysisParams.offer_details,
          target_audience: analysisParams.target_audience,
          brand_positioning: analysisParams.brand_positioning,
        })
        .eq('id', analysis.id);

      if (error) throw error;
      alert('Analyse mise à jour avec succès');
    } catch (error) {
      console.error('Error updating analysis:', error);
      alert('Erreur lors de la mise à jour de l\'analyse');
    } finally {
      setIsSavingAnalysis(false);
    }
  }

  async function handleDeleteConcept(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm('Supprimer ce concept d\'email ?')) return;

    try {
      const { error } = await supabase
        .from('concepts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setConcepts(concepts.filter(c => c.id !== id));
    } catch (error) {
      console.error('Error deleting concept:', error);
      alert('Erreur lors de la suppression');
    }
  }

  async function handleDeleteAll(stage: string) {
    if (!confirm(`Supprimer tous les concepts ${stage} ?`)) return;

    try {
      const conceptIds = concepts
        .filter(c => c.funnel_stage === stage && c.media_type === activeTab)
        .map(c => c.id);

      if (conceptIds.length === 0) return;

      const { error } = await supabase
        .from('concepts')
        .delete()
        .in('id', conceptIds);

      if (error) throw error;
      setConcepts(concepts.filter(c => !conceptIds.includes(c.id)));
    } catch (error) {
      console.error('Error deleting concepts:', error);
      alert('Erreur lors de la suppression');
    }
  }

  // --- GENERATION UNIQUE (COLD EMAIL) ---
  async function handleGenerateEmail() {
    if (!apiKey) {
        alert('Veuillez configurer votre clé API OpenAI dans les paramètres');
        return;
    }
    setGeneratingEmail(true); 
    try {
        const generatedConcepts = await generateColdEmails( 
            analysisParams.brand_name,
            analysisParams.website_url,
            analysisParams.offer_details,
            analysisParams.target_audience,
            analysisParams.brand_positioning,
            apiKey
        );
        const conceptsToInsert = generatedConcepts.map(c => ({
            analysis_id: analysis.id,
            funnel_stage: c.funnel_stage,
            concept: c.concept,
            format: c.format,
            hooks: c.hooks,
            marketing_objective: c.marketing_objective,
            scroll_stopper: c.scroll_stopper,
            problem: c.problem,
            solution: c.solution,
            benefits: c.benefits,
            proof: c.proof,
            cta: c.cta,
            suggested_visual: c.suggested_visual, 
            script_outline: c.script_outline, 
            media_type: 'email' as const, 
        }));

        const { error } = await supabase.from('concepts').insert(conceptsToInsert);
        if (error) throw error;
        await loadConcepts();
    } catch (error) {
        console.error('Error generating email concepts:', error);
        alert('Erreur lors de la génération des emails. Vérifiez votre clé API.');
    } finally {
        setGeneratingEmail(false);
    }
  }

  // --- Suppression de handleGeneratePrompt et handleGenerateImage (plus d'images) ---

  // --- LOGIQUE EDITION CONCEPT CLASSIQUE ---
  function startEditing(concept: Concept) {
    setEditingConceptId(concept.id);
    setEditedConcept({ ...concept });
  }

  async function saveEdit() {
    if (!editingConceptId || !editedConcept) return;
    try {
      const { error } = await supabase
        .from('concepts')
        .update({
          concept: editedConcept.concept,
          format: editedConcept.format,
          hooks: editedConcept.hooks,
          marketing_objective: editedConcept.marketing_objective,
          scroll_stopper: editedConcept.scroll_stopper,
          problem: editedConcept.problem,
          solution: editedConcept.solution,
          benefits: editedConcept.benefits,
          proof: editedConcept.proof,
          cta: editedConcept.cta,
          suggested_visual: editedConcept.suggested_visual,
          script_outline: editedConcept.script_outline,
        })
        .eq('id', editingConceptId);

      if (error) throw error;
      setConcepts(concepts.map(c =>
        c.id === editingConceptId ? { ...c, ...editedConcept as Concept } : c
      ));
      setEditingConceptId(null);
      setEditedConcept({});
    } catch (error) {
      console.error('Error saving concept:', error);
      alert('Erreur lors de la sauvegarde');
    }
  }

  function cancelEdit() {
    setEditingConceptId(null);
    setEditedConcept({});
  }

  function updateHook(index: number, value: string) {
    const newHooks = [...(editedConcept.hooks || [])];
    newHooks[index] = value;
    setEditedConcept({ ...editedConcept, hooks: newHooks });
  }

  // --- EXPORTS ---
  function exportToCSV() {
    const activeConcepts = concepts; // activeConcepts est toujours 'email' ici
    const headers = ['Stage', 'Concept', 'Format', 'Objectif Marketing', 'Objet 1', 'Objet 2', 'Objet 3', 'Accroche Preview', 'Problème', 'Solution', 'Bénéfices', 'Preuve', 'CTA', 'Corps de l\'Email', 'Séquence/Script'];
    
    const rows = activeConcepts.map(c => [
        c.funnel_stage,
        c.concept,
        c.format,
        c.marketing_objective,
        c.hooks[0] || '',
        c.hooks[1] || '',
        c.hooks[2] || '',
        c.scroll_stopper,
        c.problem,
        c.solution,
        c.benefits,
        c.proof,
        c.cta,
        c.suggested_visual,
        c.script_outline
    ]);
    
    const csvContent = [ headers.join(','), ...rows.map(row => row.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(',')) ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `cold_emails_${analysisParams.brand_name}_${Date.now()}.csv`;
    link.click();
  }

  function exportToText() {
    const activeConcepts = concepts; // activeConcepts est toujours 'email' ici
    let content = `COLD EMAILS - ${analysisParams.brand_name}\n`;
    content += `Site: ${analysisParams.website_url}\n`;
    content += `Date: ${new Date().toLocaleDateString('fr-FR')}\n\n`;
    content += '='.repeat(80) + '\n\n';

    ['TOFU', 'MOFU', 'BOFU'].forEach(stage => {
      const stageConcepts = activeConcepts.filter(c => c.funnel_stage === stage);
      if (stageConcepts.length === 0) return;
      content += `\n### ${stage} - ${stageConcepts.length} concepts\n\n`;
      stageConcepts.forEach((c, i) => {
        content += `## Email ${i + 1}: ${c.concept}\n\n`;
        content += `Format: ${c.format}\n`;
        content += `Objectif: ${c.marketing_objective}\n\n`;
        
        content += `Objets d'Email:\n`;
        c.hooks.forEach((h, j) => content += `  Objet ${j + 1}. ${h}\n`);
        content += `\nAccroche Preview:\n${c.scroll_stopper}\n\n`;
        
        content += `Problème:\n${c.problem}\n\n`;
        content += `Solution:\n${c.solution}\n\n`;
        content += `Bénéfices:\n${c.benefits}\n\n`;
        content += `Preuve:\n${c.proof}\n\n`;
        content += `CTA:\n${c.cta}\n\n`;
        
        content += `Corps de l'Email:\n${c.suggested_visual}\n\n`;
        content += `Stratégie Séquence:\n${c.script_outline}\n\n`;
        
        content += '-'.repeat(80) + '\n\n';
      });
    });
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `cold_emails_${analysisParams.brand_name}_${Date.now()}.txt`;
    link.click();
  }

  const activeConcepts = concepts;
  const tofuConcepts = activeConcepts.filter(c => c.funnel_stage === 'TOFU');
  const mofuConcepts = activeConcepts.filter(c => c.funnel_stage === 'MOFU');
  const bofuConcepts = activeConcepts.filter(c => c.funnel_stage === 'BOFU');

  return (
    <div className="max-w-[95%] mx-auto">
      {/* HEADER et BOUTON DE GENERATION (Simplifié) */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="flex items-center gap-2 text-[#232323]/60 hover:text-studio-accent font-bold uppercase tracking-wider text-xs transition-colors">
          <ArrowLeft className="w-4 h-4" /> Retour
        </button>
        
        <div className="flex bg-[#232323] p-1 gap-1 rounded-none">
          {/* Un seul bouton d'onglet visible */}
          <button className={`flex items-center gap-2 px-6 py-2 font-bold uppercase text-xs tracking-wide bg-blue-400 text-[#232323] rounded-none`}>
            <FileText className="w-4 h-4" /> Cold Emails
          </button>
        </div>
      </div>

      {/* CARTE STRATÉGIE */}
      <div className="bg-[#232323] p-6 mb-6 border-l-4 border-studio-accent shadow-md rounded-none">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-black text-[#FAF5ED] uppercase tracking-tighter">{analysisParams.brand_name}</h2>
            <p className="text-[#FAF5ED]/60 text-sm font-mono">{analysisParams.website_url}</p>
          </div>
          <div className="flex gap-2">
            {activeConcepts.length > 0 && (
              <>
                <button onClick={exportToCSV} className="flex items-center gap-2 px-4 py-3 bg-studio-accent/20 hover:bg-studio-accent/40 text-studio-accent font-bold uppercase text-xs border border-studio-accent transition-colors rounded-none">
                  <FileDown className="w-4 h-4" /> CSV
                </button>
                <button onClick={exportToText} className="flex items-center gap-2 px-4 py-3 bg-[#FAF5ED]/10 hover:bg-[#FAF5ED]/20 text-[#FAF5ED] font-bold uppercase text-xs border border-[#FAF5ED]/20 transition-colors rounded-none">
                  <Download className="w-4 h-4" /> TXT
                </button>
              </>
            )}
            {/* BOUTON DE GENERATION UNIQUE */}
            <button onClick={handleGenerateEmail} disabled={generatingEmail || !apiKey} className="flex items-center gap-2 px-6 py-3 bg-blue-400 text-[#232323] hover:bg-blue-300 disabled:opacity-50 transition-colors font-bold uppercase text-xs tracking-widest rounded-none">
                {generatingEmail ? <Loader className="w-4 h-4 animate-spin" /> : <><FileText className="w-4 h-4" /> Générer Emails</>}
            </button>
          </div>
        </div>

        {/* PANNEAU DÉPLIABLE ANALYSE (Inchangé) */}
        <div className="bg-[#2A2A2A] border border-[#3A3A3A] overflow-hidden rounded-none">
          <button onClick={() => setIsAnalysisOpen(!isAnalysisOpen)} className="w-full flex items-center justify-between p-3 text-left hover:bg-[#333] transition-colors rounded-none">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-studio-accent" />
              <span className="font-bold text-[#FAF5ED] uppercase text-xs tracking-widest">Stratégie & Analyse (Déplier pour modifier)</span>
            </div>
            {isAnalysisOpen ? <ChevronUp className="w-4 h-4 text-[#FAF5ED]" /> : <ChevronDown className="w-4 h-4 text-[#FAF5ED]" />}
          </button>
          {isAnalysisOpen && (
            <div className="p-4 border-t border-[#3A3A3A] space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-studio-accent uppercase tracking-wider mb-1">Nom de l'analyse</label>
                  <input type="text" value={analysisParams.brand_name} onChange={(e) => setAnalysisParams({ ...analysisParams, brand_name: e.target.value })} className="w-full bg-[#232323] border border-[#3A3A3A] text-[#FAF5ED] p-2 text-sm focus:border-studio-accent rounded-none" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-studio-accent uppercase tracking-wider mb-1">Offre</label>
                  <textarea value={analysisParams.offer_details} onChange={(e) => setAnalysisParams({ ...analysisParams, offer_details: e.target.value })} className="w-full bg-[#232323] border border-[#3A3A3A] text-[#FAF5ED] p-2 text-sm focus:border-studio-accent rounded-none" rows={2} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-studio-accent uppercase tracking-wider mb-1">Cible</label>
                  <textarea value={analysisParams.target_audience} onChange={(e) => setAnalysisParams({ ...analysisParams, target_audience: e.target.value })} className="w-full bg-[#232323] border border-[#3A3A3A] text-[#FAF5ED] p-2 text-sm focus:border-studio-accent rounded-none" rows={3} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-studio-accent uppercase tracking-wider mb-1">Positionnement</label>
                  <textarea value={analysisParams.brand_positioning} onChange={(e) => setAnalysisParams({ ...analysisParams, brand_positioning: e.target.value })} className="w-full bg-[#232323] border border-[#3A3A3A] text-[#FAF5ED] p-2 text-sm focus:border-studio-accent rounded-none" rows={3} />
                </div>
              </div>
              <div className="flex justify-end">
                <button onClick={handleSaveAnalysis} disabled={isSavingAnalysis} className="flex items-center gap-2 px-4 py-2 bg-[#232323] border border-studio-accent text-studio-accent hover:bg-studio-accent hover:text-[#FAF5ED] transition-colors font-bold uppercase text-xs rounded-none">
                  {isSavingAnalysis ? '...' : <><Save className="w-3 h-3" /> Sauvegarder</>}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* TABLEAU DES CONCEPTS */}
      {loading ? (
        <div className="flex justify-center h-64 items-center"><Loader className="w-8 h-8 animate-spin text-[#232323]" /></div>
      ) : activeConcepts.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-[#232323]/20 rounded-none">
          <p className="text-[#232323] font-medium">Aucun concept d'email généré pour le moment</p>
        </div>
      ) : (
        <div className="space-y-8">
          {[
            { stage: 'TOFU', concepts: tofuConcepts, label: 'Top of Funnel (Breakthrough)' },
            { stage: 'MOFU', concepts: mofuConcepts, label: 'Middle of Funnel (Value)' },
            { stage: 'BOFU', concepts: bofuConcepts, label: 'Bottom of Funnel (Offer)' },
          ].map(({ stage, concepts: stageConcepts, label }) => (
            stageConcepts.length > 0 && (
              <div key={stage} className="bg-[#232323] p-0 shadow-xl border border-[#232323] overflow-hidden rounded-none">
                <div className="flex items-center justify-between p-4 bg-[#2A2A2A] border-b border-[#3A3A3A]">
                  <h3 className="text-xl font-black text-[#FAF5ED] uppercase tracking-tight">{stage} <span className="text-[#FAF5ED]/40 text-sm font-normal normal-case ml-2">- {label}</span></h3>
                  <button onClick={() => handleDeleteAll(stage)} className="text-red-400 hover:text-red-300 text-xs font-bold uppercase flex items-center gap-1"><Trash2 className="w-3 h-3" /> Tout supprimer</button>
                </div>
                
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-[#1A1A1A] text-[#FAF5ED]/60 text-[10px] uppercase tracking-wider">
                      <tr>
                        <th className="p-4 min-w-[200px]">Concept</th>
                        <th className="p-4 min-w-[100px]">Format</th>
                        <th className="p-4 min-w-[250px]">Objets/Accroches</th>
                        <th className="p-4 min-w-[100px]">Objectif Marketing</th> 
                        <th className="p-4 min-w-[200px]">Problème / Solution</th>
                        <th className="p-4 min-w-[150px]">CTA</th>
                        
                        <th className="p-4 min-w-[200px]">Accroche (Preview)</th>
                        <th className="p-4 min-w-[320px] sticky right-[50px] bg-[#1A1A1A] z-10 border-l-4 border-blue-400">Corps de l'Email</th>
                        
                        <th className="w-[50px] sticky right-0 bg-[#1A1A1A] z-10 border-l border-[#3A3A3A]"></th>
                      </tr>
                    </thead>
                    <tbody className="text-[#FAF5ED] text-sm divide-y divide-[#3A3A3A]">
                      {stageConcepts.map((c) => {
                         const isEditing = editingConceptId === c.id;
                         const displayConcept = isEditing ? editedConcept : c;
                         
                         return (
                        <tr key={c.id} className="group hover:bg-[#2A2A2A] transition-colors">
                          {/* COLONNE 1: Concept */}
                          <td className="p-4 align-top font-bold">
                            {isEditing ? <textarea value={displayConcept.concept} onChange={e=>setEditedConcept({...editedConcept, concept: e.target.value})} className="w-full bg-[#1A1A1A] text-[#FAF5ED] border border-[#3A3A3A] p-1 text-xs rounded-none"/> : c.concept}
                          </td>
                          
                          {/* COLONNE 2: Format */}
                          <td className="p-4 align-top text-[#FAF5ED]/70 text-xs">
                              {isEditing ? <input value={displayConcept.format} onChange={e=>setEditedConcept({...editedConcept, format: e.target.value})} className="w-full bg-[#1A1A1A] text-[#FAF5ED] border border-[#3A3A3A] p-1 text-xs rounded-none"/> : c.format}
                          </td>

                          {/* COLONNE 3: Objets Email */}
                          <td className="p-4 align-top">
                             {isEditing ? (
                               <div className="space-y-1">{displayConcept.hooks?.map((h,i)=><input key={i} value={h} onChange={e=>updateHook(i, e.target.value)} className="w-full bg-[#1A1A1A] text-[#FAF5ED] border border-[#3A3A3A] p-1 text-xs rounded-none"/>)}</div>
                             ) : (
                               <ul className="list-decimal list-inside text-xs space-y-1 text-[#FAF5ED]/80">{c.hooks.map((h, i) => <li key={i}>{h}</li>)}</ul>
                             )}
                          </td>

                          {/* COLONNE 4: Objectif Marketing */}
                          <td className="p-4 align-top">
                             {isEditing ? <input value={displayConcept.marketing_objective} onChange={e=>setEditedConcept({...editedConcept, marketing_objective: e.target.value})} className="w-full bg-[#1A1A1A] text-[#FAF5ED] border border-[#3A3A3A] p-1 text-xs rounded-none"/> : <span className={`px-2 py-1 text-[10px] font-bold uppercase bg-blue-400/10 text-blue-400`}>{c.marketing_objective}</span>}
                          </td>

                          {/* COLONNE 5: Problème / Solution */}
                          <td className="p-4 align-top text-xs space-y-2">
                            {isEditing ? (
                              <>
                                <textarea value={displayConcept.problem} onChange={e=>setEditedConcept({...editedConcept, problem: e.target.value})} className="w-full bg-[#1A1A1A] text-[#FAF5ED] border border-[#3A3A3A] p-1 text-xs rounded-none mb-1"/>
                                <textarea value={displayConcept.solution} onChange={e=>setEditedConcept({...editedConcept, solution: e.target.value})} className="w-full bg-[#1A1A1A] text-[#FAF5ED] border border-[#3A3A3A] p-1 text-xs rounded-none"/>
                              </>
                            ) : (
                              <>
                                <div><span className="text-studio-accent font-bold">P:</span> {c.problem}</div>
                                <div><span className="text-studio-accent font-bold">S:</span> {c.solution}</div>
                              </>
                            )}
                          </td>
                          
                          {/* COLONNE 6: CTA */}
                          <td className="p-4 align-top text-xs font-bold text-studio-accent">
                            {isEditing ? <input value={displayConcept.cta} onChange={e=>setEditedConcept({...editedConcept, cta: e.target.value})} className="w-full bg-[#1A1A1A] text-[#FAF5ED] border border-[#3A3A3A] p-1 text-xs rounded-none"/> : c.cta}
                          </td>
                          
                          {/* COLONNE 7: Accroche (Preview Line) */}
                          <td className="p-4 align-top text-xs">
                            <span className="font-bold text-blue-400">Objet:</span> {c.hooks[0]}<br/>
                            <span className="font-bold text-[#FAF5ED]/80">Preview:</span> {c.scroll_stopper}
                          </td>
                          
                          {/* COLONNE 8: Corps de l'Email */}
                          <td className="p-4 align-top sticky right-[50px] bg-[#232323] group-hover:bg-[#2A2A2A] border-l-4 border-blue-400 z-10 shadow-[-10px_0_20px_-5px_rgba(0,0,0,0.5)]">
                              <div className="p-2 bg-[#1A1A1A] border border-[#3A3A3A] text-xs font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">
                                 {c.suggested_visual || "Corps de l'email non généré ou introuvable."}
                              </div>
                              <button onClick={() => {navigator.clipboard.writeText(c.suggested_visual || ''); alert('Corps de l\'email copié !')}} className="text-[9px] text-blue-400 hover:underline mb-2 block text-right mt-2">Copier le corps</button>
                          </td>
                          
                          {/* COLONNE 9: ACTIONS */}
                          <td className="p-4 align-top sticky right-0 bg-[#232323] group-hover:bg-[#2A2A2A] border-l border-[#3A3A3A] z-10">
                            <div className="flex flex-col gap-2">
                              {!isEditing ? (
                                <>
                                  <button onClick={() => startEditing(c)} className="text-[#FAF5ED]/20 hover:text-studio-accent"><Edit2 className="w-4 h-4" /></button>
                                  <button onClick={(e) => handleDeleteConcept(c.id, e)} className="text-[#FAF5ED]/20 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                                </>
                              ) : (
                                <>
                                  <button onClick={saveEdit} className="text-green-500 hover:text-green-400"><Check className="w-4 h-4" /></button>
                                  <button onClick={cancelEdit} className="text-red-500 hover:text-red-400"><X className="w-4 h-4" /></button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );})}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          ))}
        </div>
      )}
      
      {/* Suppression des Modales d'Image et de Prompt d'Image */}

    </div>
  );
}