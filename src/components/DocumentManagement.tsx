import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  LayoutGrid, 
  List as ListIcon, 
  MoreHorizontal, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Archive,
  Download,
  Trash2,
  Copy,
  ChevronRight,
  BookOpen,
  Library,
  Scale,
  Inbox,
  Upload,
  Zap as Sparkles,
  Link
} from 'lucide-react';
import { api } from '../services/api';
import { LegalDocument, DocumentTemplate, Property, Tenant } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { DocumentEditor } from './DocumentEditor';
import { LeaseWorkflow } from './LeaseWorkflow';

export const DocumentManagement: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [unmatchedDocs, setUnmatchedDocs] = useState<any[]>([]);
  const [vaultDocs, setVaultDocs] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState<'all' | 'templates' | 'vault'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  
  // Editor & Workflow State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isWorkflowOpen, setIsWorkflowOpen] = useState(false);
  const [editingDocId, setEditingDocId] = useState<number | undefined>();
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | undefined>();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleVaultUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Placeholder implementation
    addToast('Vault upload triggered', 'info');
  };

  const handleConfirmMatch = (docId: number, matchData: any) => {
    // Placeholder implementation
    addToast('Match confirmed', 'success');
  };

  const deleteVaultDoc = async (id: number) => {
    try {
      await api.deleteVaultDocument(id);
      loadData();
    } catch (e) {
      addToast('Failed to delete vault doc', 'error');
    }
  };

  const loadData = async () => {
    setLoading(true);
    setErrorDetails(null);
    let tableError: any = null;

    try {
      // 1. Initial fetch of everything
      const [docsResult, templatesResult, vaultResult, tenantsResult] = await Promise.allSettled([
        api.getLegalDocuments(),
        api.getDocumentTemplates(),
        api.getVaultDocuments(),
        api.getTenants()
      ]);

      const docsData = docsResult.status === 'fulfilled' ? docsResult.value : [];
      let templatesData = templatesResult.status === 'fulfilled' ? templatesResult.value : [];
      const vaultData = vaultResult.status === 'fulfilled' ? vaultResult.value : [];
      const tenantsData = tenantsResult.status === 'fulfilled' ? tenantsResult.value : [];

      // Check for table missing errors (42P01) or other critical errors
      if (docsResult.status === 'rejected') {
        const err = docsResult.reason;
        if (err?.code === '42P01' || err?.message?.includes('legal_documents')) tableError = err;
      }
      if (templatesResult.status === 'rejected') {
        const err = templatesResult.reason;
        if (err?.code === '42P01' || err?.message?.includes('document_templates')) tableError = err;
      }

      // 2. If no templates found and no critical error, attempt to seed them
      if (!tableError && templatesData.length === 0) {
        console.log('No templates found, attempting to seed...');
        try {
          await api.seedTemplates();
          // Re-fetch templates after seeding
          templatesData = await api.getDocumentTemplates();
        } catch (seedError) {
          console.warn('Template seeding failed:', seedError);
        }
      }
      
      setDocuments(docsData);
      setTemplates(templatesData);
      setUnmatchedDocs(vaultData);
      setTenants(tenantsData);

      if (tableError) throw tableError;
      
      console.log('Load Data complete:', { 
        docsCount: docsData.length, 
        templatesCount: templatesData.length 
      });
    } catch (error) {
      console.error('Failed to load documents:', error);
      const message = error instanceof Error ? error.message : typeof error === 'object' ? JSON.stringify(error) : String(error);
      setErrorDetails(message);
      
      const isMissingTable = message.includes('legal_documents') || message.includes('document_templates') || message.includes('PGRST205');
      
      addToast(
        isMissingTable 
          ? 'Database tables missing. See instructions on screen.'
          : 'Failed to load documents', 
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const sqlMigration = `-- Paste this into your Supabase SQL Editor:

CREATE TABLE IF NOT EXISTS public.document_templates (
  id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  category text NOT NULL,
  name_en text NOT NULL,
  name_so text NOT NULL,
  content_en text NOT NULL,
  content_so text NOT NULL,
  placeholders jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.legal_documents (
  id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  template_id bigint REFERENCES public.document_templates(id) ON DELETE SET NULL,
  property_id bigint REFERENCES public.properties(id) ON DELETE CASCADE,
  unit_id bigint REFERENCES public.units(id) ON DELETE CASCADE,
  tenant_id bigint REFERENCES public.tenants(id) ON DELETE CASCADE,
  owner_id bigint REFERENCES public.owners(id) ON DELETE CASCADE,
  title text NOT NULL,
  content_en text NOT NULL,
  content_so text NOT NULL,
  placeholders_data jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'Draft',
  version integer DEFAULT 1,
  file_url text,
  asset_id uuid REFERENCES public.media_assets(id),
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.document_signatures (
  id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  document_id bigint REFERENCES public.legal_documents(id) ON DELETE CASCADE,
  signer_id uuid REFERENCES public.profiles(id),
  signer_name text,
  signer_role text,
  signature_data text, 
  signed_at timestamptz,
  ip_address text,
  user_agent text
);

CREATE TABLE IF NOT EXISTS public.property_documents (
  id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  property_id bigint REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  url text NOT NULL,
  type text NOT NULL,
  asset_id uuid REFERENCES public.media_assets(id),
  uploaded_at timestamp with time zone DEFAULT now(),
  uploaded_by uuid REFERENCES public.profiles(id)
);

ALTER TABLE public.document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_documents ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.vault_documents (
  id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_size bigint NOT NULL,
  status text DEFAULT 'Pending',
  ai_suggestions jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.vault_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage vault" ON public.vault_documents FOR ALL USING (auth.role() = 'authenticated');

-- FINANCE FIXES (Run these if you get column missing errors)
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tenants' AND column_name = 'current_balance') THEN
    ALTER TABLE public.tenants ADD COLUMN current_balance numeric DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tenants' AND column_name = 'security_deposit_held') THEN
    ALTER TABLE public.tenants ADD COLUMN security_deposit_held numeric DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'transactions' AND column_name = 'category') THEN
    ALTER TABLE public.transactions ADD COLUMN category text DEFAULT 'Rent';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'transactions' AND column_name = 'transaction_date') THEN
    ALTER TABLE public.transactions ADD COLUMN transaction_date date DEFAULT current_date;
  END IF;
END $$;

CREATE POLICY "Authenticated users can view templates" ON public.document_templates FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage templates" ON public.document_templates FOR ALL USING (true);
CREATE POLICY "Authenticated users can view legal docs" ON public.legal_documents FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins and Managers can manage legal docs" ON public.legal_documents FOR ALL USING (true);
CREATE POLICY "Authenticated users can view signatures" ON public.document_signatures FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can sign docs" ON public.document_signatures FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can read property docs" ON public.property_documents FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins and Managers can manage property docs" ON public.property_documents FOR ALL USING (true);

-- Enhanced Templates
INSERT INTO public.document_templates (category, name_en, name_so, content_en, content_so, placeholders)
VALUES 
('Lease', 'Residential Tenancy Agreement', 'Heshiiska Kirada Guriga', 
 '# RESIDENTIAL TENANCY AGREEMENT

**DATE:** {{date}}
**TENANCY REFERENCE:** {{reference_no}}

### 1. THE PARTIES
This Residential Tenancy Agreement is entered into by:
**THE LANDLORD:** {{landlord_name}}
**THE TENANT:** {{tenant_name}}
**AUTHORIZED OCCUPANTS:** {{occupants_list}}

### 2. THE PROPERTY
The Landlord let to the Tenant the property located at:
**ADDRESS:** {{property_address}}
**UNIT/SUITE:** {{unit_number}}
**INVENTORY STATUS:** {{inventory_status}} (Furnished/Unfurnished)

### 3. TERM & DURATION
The tenancy shall be for a fixed term of **{{lease_duration}} months**, commencing on **{{lease_start}}** and terminating on **{{lease_end}}**.
Upon expiry, the parties may negotiate a renewal or the tenancy may convert to a month-to-month basis as per local laws.

### 4. RENT & PAYMENTS
* **Monthly Base Rent:** \${{rent_amount}}
* **Payment Due Date:** On or before the {{payment_day}} day of each calendar month.
* **Late Fee:** A late fee of \${{late_fee}} shall apply if rent is not received within {{grace_period}} days of the due date.
* **Preferred Payment Method:** {{payment_method}}

### 5. SECURITY DEPOSIT
The Tenant shall pay a Security Deposit of **\${{security_deposit}}** upon signing. This deposit will be held by the Landlord as security for the performance of the Tenant''s obligations and will be refunded within {{return_days}} days of termination, less any deductions for unpaid rent or damages beyond normal wear and tear.

### 6. UTILITIES & SERVICES
* **Landlord Responsibility:** {{landlord_utilities}} (e.g., Water, Waste Management)
* **Tenant Responsibility:** {{tenant_utilities}} (e.g., Electricity, Internet, Gas)

### 7. MAINTENANCE & REPAIRS
* **Tenant Duties:** Keep premises clean, sanitary, and in good condition. Report any defects immediately.
* **Landlord Duties:** Maintain structural integrity, exterior, and essential services (plumbing, wiring, HVAC).
* **Emergency Access:** The Landlord may enter without notice in case of emergency. For routine inspections, {{notice_for_entry}} hours notice will be given.

### 8. RULES & CONDUCT
* **Subletting:** Prohibited without written Landlord consent.
* **Pets:** {{pet_policy}}
* **Smoking:** {{smoking_policy}}
* **Noises:** Tenant shall not disturb the peace of neighbors.

### 9. TERMINATION & NOTICES
Either party may terminate this agreement by providing **{{notice_period}} days** written notice before the end of the term.

### 10. GOVERNING LAW
This agreement shall be governed by and construed in accordance with the Laws of the Federal Republic of Somalia.

**SIGNATURES:**

**Landlord/Agent:** ________________________  Date: __________

**Tenant:** ________________________  Date: __________',
 '# HESHIISKA KIRADA GURIGA (DEEGAANKA)

**TAARIIKHDA:** {{date}}
**TIXRAACA:** {{reference_no}}

### 1. DHINACYADA HESHIISKA
Heshiiskan waxaa kal saxiixday:
**MULKIILAHA:** {{landlord_name}}
**KIREYSTAHA:** {{tenant_name}}
**DADKA DEGEN:** {{occupants_list}}

### 2. HANTIDA / GURIGA
Mulkiiluhu wuxuu u kireeyay Kireystaha guriga ku yaal:
**CINWAANKA:** {{property_address}}
**LAMBARKA GURIGA:** {{unit_number}}
**XAALADDA GURIGA:** {{inventory_status}} (Qalabaysan/Aan qalabaysnayn)

### 3. MUDDADA HESHIISKA
Heshiiska kiradu waa mid go''an oo socon doona muddo **{{lease_duration}} bilood ah**, oo ka bilaabanaysa **{{lease_start}}** kuna dhammaanaysa **{{lease_end}}**.

### 4. KIRADA & LACAG BIXINTA
* **Kirada Bishii:** \${{rent_amount}}
* **Xilliga Lacag-bixinta:** Maalinta {{payment_day}} ee bil kasta.
* **Ganaaxa Dib-u-dhaca:** Ganaax dhan \${{late_fee}} ayaa lagu soo rogi doonaa haddii kirada la waayo {{grace_period}} maalmood gudahood.
* **Habka Lacag-bixinta:** {{payment_method}}

### 5. DHIBOOMADKA (DEPOSIT)
Kireystuhu waa inuu bixiyo dhiboomad dhan **\${{security_deposit}}**. Lacagtan waxaa loo hayn doonaa dammaanad ahaan, waxaana lagu soo celin doonaa {{return_days}} maalmood gudahood marka guriga laga guuro, marka laga reebo wixii khasaare ah ama kire aan la bixin.

### 6. ADEEGYADA (BIYAHA & KONTOROOLKA)
* **Mas''uuliyadda Mulkiilaha:** {{landlord_utilities}}
* **Mas''uuliyadda Kireystaha:** {{tenant_utilities}}

### 7. DAYACTIRKA
* **Kireystaha:** Waa inuu guriga u hayo si nadiif ah oo nidaamsan.
* **Mulkiilaha:** Waxaa mas''uul ka yahay dhismaha iyo nidaamyada waaweyn (tuubooyinka, korontada).
* **Gelitaanka Guriga:** Mulkiiluhu wuxuu geli karaa guriga ogeysiis {{notice_for_entry}} saacadood ah ka dib.

### 8. XEERARKA GURIGA
* **Kireynta kale:** Reebban iyada oo aan oggolaansho qoraal ah laga helin.
* **Xayawaanka:** {{pet_policy}}
* **Sigaar-cabidda:** {{smoking_policy}}

### 9. JOOJINTA HESHIISKA
Labadaba dhinac waxay joojin karaan heshiiska iyagoo bixinaya ogeysiis qoraal ah oo {{notice_period}} maalmood ah.

### 10. SHARCIGA LAGU DHAQMAYO
Heshiiskan waxaa lagu maamuli doonaa sharciyada Jamhuuriyadda Federaalka Soomaaliya.

**SAXIIXADA:**

**Mulkiilaha:** ________________________  Taariikh: __________

**Kireystaha:** ________________________  Taariikh: __________',
 '["date", "reference_no", "landlord_name", "tenant_name", "occupants_list", "property_address", "unit_number", "inventory_status", "lease_duration", "lease_start", "lease_end", "rent_amount", "payment_day", "late_fee", "grace_period", "payment_method", "security_deposit", "return_days", "landlord_utilities", "tenant_utilities", "notice_for_entry", "notice_period", "pet_policy", "smoking_policy"]'
) ON CONFLICT DO NOTHING;
`;

  useEffect(() => {
    loadData();
  }, []);

  const filteredDocs = documents.filter(d => {
    const matchesSearch = d.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All'; // Categorization to be added to model if needed
    return matchesSearch && matchesCategory;
  });

  const tenantLookup = tenants.reduce((acc, t) => {
    acc[t.id] = `${t.first_name} ${t.last_name}`;
    return acc;
  }, {} as Record<number, string>);

  const categories = ['All', 'Lease', 'Notice', 'Financial', 'Property Management'];

  const handleCreateFromTemplate = (template: DocumentTemplate) => {
    if (template.category === 'Lease') {
      setIsWorkflowOpen(true);
    } else {
      setSelectedTemplate(template);
      setEditingDocId(undefined);
      setIsEditorOpen(true);
    }
  };

  const deleteDocument = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (isDeleting) {
      console.log('Delete already in progress, skipping');
      return;
    }
    
    console.log('deleteDocument triggered for ID:', id);
    if (window.confirm('Are you sure you want to delete this draft lease?')) {
      setIsDeleting(true);
      try {
        console.log('Attempting to delete doc via API:', id);
        const result = await api.deleteLegalDocument(id);
        console.log('API Delete result:', result);
        
        // Always update UI after call if no error thrown
        setDocuments(prev => prev.filter(d => d.id !== id));
        addToast('Draft lease deleted', 'success');
        
        // Small delay before reload to allow Supabase to reflect changes
        setTimeout(() => {
          loadData();
        }, 1000);
      } catch (e) {
        console.error('Delete failed in component:', e);
        addToast('Failed to delete draft: ' + (e instanceof Error ? e.message : String(e)), 'error');
      } finally {
        setIsDeleting(false);
      }
    } else {
      console.log('Delete cancelled by user');
    }
  };

  const handleEditDocument = (id: number) => {
    setEditingDocId(id);
    setSelectedTemplate(undefined);
    setIsEditorOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Signed': return 'text-emerald-600 bg-emerald-50';
      case 'Pending': return 'text-amber-600 bg-amber-50';
      case 'Draft': return 'text-zinc-500 bg-zinc-50';
      default: return 'text-zinc-400 bg-zinc-50';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-12 max-w-[1600px] mx-auto">
      {/* Hero Section */}
      <div className="relative group">
        <div className="vintsy-card p-12 overflow-hidden bg-zinc-900 text-white transition-all duration-700">
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-end md:items-center gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
                    <Scale size={20} className="text-violet-400" />
                 </div>
                 <span className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-60">Legal Excellence • Somalia</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-none">
                 Lease & Documents <br />
                 <span className="text-violet-400">Workflow Hub</span>
              </h1>
              <p className="text-zinc-400 text-sm max-w-xl font-medium tracking-wide">
                 Professional, bilingual documentation management system specifically designed for Somalia's property jurisdiction and legal standards.
              </p>
            </div>
            
            <button 
              onClick={() => setIsWorkflowOpen(true)}
              className="px-8 py-5 bg-violet-600 text-white rounded-[2rem] text-xs font-bold uppercase tracking-widest hover:bg-violet-500 transition-all shadow-2xl shadow-violet-600/30 flex items-center gap-3 group/btn"
            >
              <Plus size={18} className="group-hover/btn:rotate-90 transition-transform duration-500" />
              New Tenancy Workflow
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
             <FileText size={400} strokeWidth={0.5} />
          </div>
        </div>
      </div>

      {/* Main Tabs & Filters */}
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
           <div className="flex bg-white p-1.5 rounded-2xl border border-zinc-100 shadow-sm">
             <button 
               onClick={() => setActiveTab('all')}
               className={`flex items-center gap-3 px-8 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                 activeTab === 'all' ? 'bg-zinc-900 text-white shadow-xl' : 'text-zinc-500 hover:text-zinc-900'
               }`}
             >
               <FileText size={16} />
               Records Hub
             </button>
             <button 
               onClick={() => setActiveTab('templates')}
               className={`flex items-center gap-3 px-8 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                 activeTab === 'templates' ? 'bg-zinc-900 text-white shadow-xl' : 'text-zinc-500 hover:text-zinc-900'
               }`}
             >
               <Library size={16} />
               Template Library
             </button>
             <button 
               onClick={() => setActiveTab('vault')}
               className={`flex items-center gap-3 px-8 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                 activeTab === 'vault' ? 'bg-zinc-900 text-white shadow-xl' : 'text-zinc-500 hover:text-zinc-900'
               }`}
             >
               <Inbox size={16} />
               Vault Inbox
             </button>
           </div>

           <div className="flex items-center gap-4 w-full md:w-auto">
             <div className="relative flex-1 md:w-80 group">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 transition-colors group-focus-within:text-violet-600" size={14} />
               <input 
                 type="text" 
                 placeholder="Search documents by title or tenant..."
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="vintsy-input w-full pl-12 pr-4 py-3"
               />
             </div>
             <div className="flex bg-white p-1.5 rounded-2xl border border-zinc-100 shadow-sm">
               <button 
                 onClick={() => setViewMode('grid')}
                 className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-400'}`}
               >
                 <LayoutGrid size={16} />
               </button>
               <button 
                 onClick={() => setViewMode('list')}
                 className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-400'}`}
               >
                 <ListIcon size={16} />
               </button>
             </div>
           </div>
        </div>

        {/* Category Filters */}
        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
          {categories.map((cat) => (
            <button 
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-6 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all shrink-0 ${
                selectedCategory === cat 
                  ? 'bg-violet-600 border-violet-600 text-white shadow-lg shadow-violet-600/20' 
                  : 'bg-white border-zinc-100 text-zinc-500 hover:border-violet-600 hover:text-violet-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {activeTab === 'all' ? (
          <>
            {errorDetails ? (
              <div className="vintsy-card p-12 text-center space-y-6 border-red-100">
                 <div className="w-16 h-16 bg-red-50 rounded-3xl flex items-center justify-center text-red-500 mx-auto">
                    <AlertCircle size={32} />
                 </div>
                 <div className="max-w-2xl mx-auto text-left">
                    <h3 className="text-lg font-bold text-zinc-900 mb-2 tracking-tight text-center">Legal Database Synchronization Error</h3>
                    <p className="text-zinc-400 text-sm mb-6 text-center">The following tables are missing from your database schema. Please paste the SQL below into your Supabase SQL Editor.</p>
                    
                    <div className="relative group">
                       <pre className="text-zinc-500 text-[10px] font-mono bg-zinc-50 p-6 rounded-xl border border-zinc-100 overflow-x-auto max-h-60 scrollbar-hide">
                        {sqlMigration}
                      </pre>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(sqlMigration);
                          addToast('SQL copied to clipboard', 'info');
                        }}
                        className="absolute top-4 right-4 p-2 bg-white shadow-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Copy size={14} className="text-zinc-500" />
                      </button>
                    </div>

                    <p className="text-zinc-500 text-[10px] mt-6 italic font-medium">Error Details: {errorDetails}</p>
                 </div>
                 <div className="flex justify-center gap-4">
                   <button 
                    onClick={loadData}
                    className="px-10 py-4 bg-zinc-900 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-all shadow-xl"
                   >
                     Retry Connection
                   </button>
                 </div>
              </div>
            ) : filteredDocs.length === 0 ? (
              <div className="vintsy-card p-24 text-center space-y-6">
                 <div className="w-20 h-20 bg-zinc-50 rounded-3xl flex items-center justify-center text-zinc-300 mx-auto">
                    <FileText size={40} />
                 </div>
                 <div>
                    <h3 className="text-lg font-bold text-zinc-900 mb-2 tracking-tight">No Documents Found</h3>
                    <p className="text-zinc-400 text-sm max-w-xs mx-auto">Try adjusting your search or generate a new document from the templates library.</p>
                 </div>
                 <button 
                  onClick={() => setActiveTab('templates')}
                  className="text-[10px] font-bold text-violet-600 uppercase tracking-widest hover:underline px-6 py-3"
                 >
                   Browse Template Library
                 </button>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {filteredDocs.map((doc) => (
                  <motion.div 
                    layout
                    key={doc.id} 
                    className="vintsy-card group h-full flex flex-col hover:border-violet-200"
                  >
                    <div className="p-8 space-y-6 flex-1">
                       <div className="flex items-start justify-between">
                         <div className={`p-4 rounded-2xl ${getStatusColor(doc.status)}`}>
                           <FileText size={24} />
                         </div>
                         <div className="flex flex-col items-end gap-2">
                            <span className={`px-2.5 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest ${getStatusColor(doc.status)}`}>
                              {doc.status}
                            </span>
                            <span className="text-[8px] text-zinc-400 font-bold uppercase tracking-widest italic">v{doc.version}.0</span>
                         </div>
                       </div>
                       
                       <div className="space-y-2">
                         <h3 className="text-sm font-bold text-zinc-900 group-hover:text-violet-600 transition-colors line-clamp-2">
                           {doc.title}
                         </h3>
                         <div className="flex items-center gap-2 text-zinc-400">
                           <Clock size={12} />
                           <span className="text-[10px] font-medium tracking-wide">Updated {new Date(doc.updated_at).toLocaleDateString()}</span>
                         </div>
                       </div>

                       <div className="pt-6 border-t border-zinc-50 flex flex-wrap gap-4">
                          <div className="flex-1 space-y-1">
                             <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Signatures</p>
                             <div className="flex -space-x-2">
                               {[1, 2].map(i => (
                                 <div key={i} className={`w-6 h-6 rounded-full border-2 border-white flex items-center justify-center ${
                                   doc.signatures && doc.signatures.length >= i ? 'bg-emerald-100 text-emerald-600' : 'bg-zinc-100 text-zinc-400'
                                 }`}>
                                   <CheckCircle2 size={10} />
                                 </div>
                               ))}
                             </div>
                          </div>
                          {doc.placeholders_data && (
                            <div className="flex-1 text-right space-y-1">
                               <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Type</p>
                               <p className="text-[10px] font-bold text-zinc-900 truncate">Official</p>
                            </div>
                          )}
                       </div>
                    </div>
                    
                    <div className="px-8 py-6 bg-zinc-50 flex items-center justify-between border-t border-zinc-100">
                       <button 
                        onClick={() => handleEditDocument(doc.id)}
                        className="text-[10px] font-bold text-violet-600 uppercase tracking-widest hover:underline"
                       >
                         Manage Doc
                       </button>
                       <div className="flex items-center gap-3">
                         <button 
                           onClick={() => {
                             console.log('Doc Status:', doc.status);
                             console.log('File URL:', doc.file_url);
                             if (doc.file_url) {
                               window.open(doc.file_url, '_blank');
                             } else {
                               addToast('This document is a draft and not yet available for download. Click "Manage Doc" to edit it.', 'info');
                             }
                           }}
                           className="p-2 text-zinc-400 hover:text-zinc-600 transition-colors"
                         >
                           <Download size={14} />
                         </button>
                         {doc.status.trim() === 'Draft' && (
                           <button 
                             onClick={(e) => {
                               console.log('Deleting doc:', doc.id);
                               deleteDocument(e, doc.id);
                             }}
                             className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
                           >
                             <Trash2 size={14} />
                           </button>
                         )}
                       </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="vintsy-card overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-zinc-50 border-b border-zinc-100">
                    <tr>
                      <th className="px-8 py-5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Document Title</th>
                      <th className="px-8 py-5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Status</th>
                      <th className="px-8 py-5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Signatures</th>
                      <th className="px-8 py-5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Last Updated</th>
                      <th className="px-8 py-5 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {filteredDocs.map((doc) => (
                      <tr key={doc.id} className="hover:bg-zinc-50/50">
                        <td className="px-8 py-6">
                           <div className="flex items-center gap-4">
                             <div className={`p-2.5 rounded-xl ${getStatusColor(doc.status)}`}>
                               <FileText size={18} />
                             </div>
                             <div>
                               <p className="text-sm font-bold text-zinc-900">
                                {doc.title} {doc.tenant_id && tenantLookup[doc.tenant_id] ? ` - ${tenantLookup[doc.tenant_id]}` : ''}
                               </p>
                               <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">v{doc.version}.0</p>
                             </div>
                           </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className={`px-2.5 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest ${getStatusColor(doc.status)}`}>
                            {doc.status}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                           <div className="flex -space-x-1.5">
                              {[1, 2].map(i => (
                                <div key={i} className={`w-5 h-5 rounded-full border-2 border-white flex items-center justify-center ${
                                  doc.signatures && doc.signatures.length >= i ? 'bg-emerald-100 text-emerald-600' : 'bg-zinc-100 text-zinc-400'
                                }`}>
                                  <CheckCircle2 size={8} />
                                </div>
                              ))}
                           </div>
                        </td>
                        <td className="px-8 py-6 text-[10px] font-medium text-zinc-500">
                          {new Date(doc.updated_at).toLocaleDateString()}
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex justify-end items-center gap-2">
                            <button 
                             onClick={() => {
                               if (doc.file_url) {
                                 window.open(doc.file_url, '_blank');
                               } else {
                                 addToast('This document is a draft and not yet available for download. Click "Manage Doc" to edit it.', 'info');
                               }
                             }}
                               className="p-2 text-zinc-400 hover:text-zinc-600 transition-colors"
                            >
                               <Download size={14} />
                            </button>
                            {doc.status.trim() === 'Draft' && (
                                <button
                                  onClick={(e) => deleteDocument(e, doc.id)}
                                  className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
                                >
                                  <Trash2 size={14} className={isDeleting ? 'animate-pulse text-zinc-200' : ''} />
                                </button>
                            )}
                            <button 
                              onClick={() => handleEditDocument(doc.id)}
                              className="p-2 text-zinc-400 hover:text-violet-600 transition-colors"
                            >
                              <MoreHorizontal size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : activeTab === 'templates' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {templates.filter(t => selectedCategory === 'All' || t.category === selectedCategory).map((template) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={template.id} 
                className="vintsy-card group flex flex-col hover:border-emerald-200"
              >
                <div className="p-8 space-y-6 flex-1">
                   <div className="flex items-start justify-between">
                     <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-600">
                       <LayoutGrid size={24} />
                     </div>
                     <span className="px-2.5 py-1 rounded-full text-[8px] font-bold bg-zinc-100 text-zinc-500 uppercase tracking-widest">
                       Bilingual
                     </span>
                   </div>
                   
                   <div className="space-y-4">
                     <div>
                       <h3 className="text-sm font-bold text-zinc-900 line-clamp-1">{template.name_en}</h3>
                       <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-1">{template.name_so}</p>
                     </div>
                     <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">
                       Standard Somalia legal template with support for {(Array.isArray(template.placeholders) ? template.placeholders : (typeof template.placeholders === 'string' ? JSON.parse(template.placeholders) : [])).length} dynamic fields.
                     </p>
                   </div>
                </div>
                
                <div className="px-8 py-6 bg-zinc-50 flex items-center justify-between border-t border-zinc-100">
                   <button 
                    onClick={() => handleCreateFromTemplate(template)}
                    className="flex-1 py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 group/btn"
                   >
                     Use Template
                     <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                   </button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            <div className="vintsy-card p-12 border-dashed border-2 flex flex-col items-center justify-center text-center space-y-6">
              <div className="w-20 h-20 bg-violet-50 rounded-full flex items-center justify-center text-violet-600">
                <Upload size={40} />
              </div>
              <div className="max-w-md">
                <h3 className="text-xl font-bold text-zinc-900 mb-2">Vault Smart Inbox</h3>
                <p className="text-sm text-zinc-400 font-medium">
                  Upload scanned documents, photos, or PDFs. Our AI-matching engine will analyze the content and suggest the correct property, tenant, or lease connection.
                </p>
              </div>
              <div className="flex gap-4">
                <label className="px-10 py-4 bg-zinc-900 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-all flex items-center gap-3 cursor-pointer">
                  <Plus size={16} />
                  Choose Files
                  <input type="file" className="hidden" onChange={handleVaultUpload} />
                </label>
                <button className="px-10 py-4 bg-white border border-zinc-200 text-zinc-600 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-50 transition-all">
                  Browse Cloud
                </button>
              </div>
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Supports PDF, JPG, PNG (Max 50MB)</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {vaultDocs.map(doc => (
                <div key={doc.id} className="vintsy-card p-6 space-y-6 group border-amber-100 bg-amber-50/10">
                  <div className="flex items-start justify-between">
                    <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
                      <FileText size={20} />
                    </div>
                    <span className="px-2 py-1 bg-amber-100 text-amber-700 text-[8px] font-bold uppercase tracking-widest rounded-lg flex items-center gap-1">
                      <Sparkles size={10} className="animate-pulse" />
                      AI Analyzed
                    </span>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-bold text-zinc-900 mb-1">{doc.file_name}</h4>
                    <p className="text-[10px] text-zinc-400 font-medium italic">
                      Uploaded {new Date(doc.created_at).toLocaleTimeString()} • {(doc.file_size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>

                  <div className="p-4 bg-white rounded-xl border border-amber-100 space-y-3">
                    <p className="text-[10px] font-bold text-amber-800 uppercase tracking-widest flex items-center gap-2">
                       AI Match Suggestions
                    </p>
                    <div className="space-y-2">
                      {doc.ai_suggestions?.map((suggestion: any, idx: number) => (
                        <div 
                          key={idx}
                          onClick={() => handleConfirmMatch(doc.id, suggestion)}
                          className="flex items-center justify-between p-2 hover:bg-zinc-50 rounded-lg cursor-pointer border border-transparent hover:border-zinc-100 transition-all"
                        >
                          <div className="flex items-center gap-2">
                            <Link size={12} className="text-violet-600" />
                            <span className="text-[10px] font-bold text-zinc-700">{suggestion.type}: {suggestion.name}</span>
                          </div>
                          <span className="text-[8px] font-bold text-emerald-600 uppercase tracking-widest">{(suggestion.match * 100).toFixed(0)}% Match</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleConfirmMatch(doc.id, doc.ai_suggestions?.[0])}
                      className="flex-1 py-3 bg-zinc-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-all font-sans"
                    >
                      Confirm Primary Match
                    </button>
                    <button 
                      onClick={() => deleteVaultDoc(doc.id)}
                      className="p-3 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
              {vaultDocs.length === 0 && (
                <div className="lg:col-span-3 py-12 text-center">
                   <p className="text-sm text-zinc-400 italic">No pending documents in the Smart Inbox.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isEditorOpen && (
          <DocumentEditor 
            documentId={editingDocId}
            template={selectedTemplate}
            onClose={() => setIsEditorOpen(false)}
            onSave={() => {
              setIsEditorOpen(false);
              loadData();
            }}
          />
        )}
        {isWorkflowOpen && (
          <LeaseWorkflow 
            onClose={() => setIsWorkflowOpen(false)}
            onComplete={() => {
              setIsWorkflowOpen(false);
              loadData();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
