import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Save, 
  FileText, 
  Languages, 
  Download, 
  Printer, 
  Signature, 
  Trash2,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Info
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { api } from '../services/api';
import { DocumentTemplate, LegalDocument, Tenant, Property, Owner } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface DocumentEditorProps {
  documentId?: number;
  template?: DocumentTemplate;
  property?: Property;
  tenant?: Tenant;
  onClose: () => void;
  onSave: () => void;
}

export const DocumentEditor: React.FC<DocumentEditorProps> = ({ 
  documentId, 
  template, 
  property, 
  tenant,
  onClose,
  onSave
}) => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [doc, setDoc] = useState<Partial<LegalDocument>>({
    status: 'Draft',
    placeholders_data: {},
    content_en: '',
    content_so: '',
    title: ''
  });
  const [language, setLanguage] = useState<'en' | 'so' | 'both'>('both');
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [showSignature, setShowSignature] = useState(false);
  const [signatureName, setSignatureName] = useState('');

  useEffect(() => {
    const init = async () => {
      try {
        const [tenantsData, propertiesData] = await Promise.all([
          api.getTenants(),
          api.getProperties()
        ]);
        setTenants(tenantsData);
        setProperties(propertiesData);

        if (documentId) {
          const existingDoc = await api.getLegalDocument(documentId);
          setDoc(existingDoc);
        } else if (template) {
          // Initialize from template
          const initialData: Record<string, string> = {
            date: new Date().toLocaleDateString(),
          };

          if (tenant) {
            initialData.tenant_name = `${tenant.first_name} ${tenant.last_name}`;
            initialData.rent_amount = tenant.rent_amount?.toString() || '';
            initialData.lease_start = tenant.lease_start || '';
            initialData.lease_end = tenant.lease_end || '';
          }

          if (property) {
            initialData.property_address = property.address;
            initialData.landlord_name = property.owner_name || '';
          }

          setDoc({
            template_id: template.id,
            title: template.name_en,
            content_en: template.content_en,
            content_so: template.content_so,
            placeholders_data: initialData,
            status: 'Draft',
            property_id: property?.id,
            tenant_id: tenant?.id,
            owner_id: property?.owner_id
          });
        }
      } catch (error) {
        console.error('Failed to init document editor:', error);
        addToast('Failed to load document data', 'error');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [documentId, template, property, tenant]);

  const replacePlaceholders = (content: string, data: Record<string, string>) => {
    let newContent = content;
    Object.entries(data).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      newContent = newContent.replace(regex, value || `[${key}]`);
    });
    return newContent;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (doc.id) {
        await api.updateLegalDocument(doc.id, {
          ...doc,
          updated_at: new Date().toISOString()
        });
      } else {
        await api.createLegalDocument({
          ...doc,
          created_by: user?.id,
          created_at: new Date().toISOString()
        } as LegalDocument);
      }
      addToast('Document saved successfully', 'success');
      onSave();
    } catch (error) {
      console.error('Save error:', error);
      addToast('Failed to save document', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleExportPDF = async () => {
    const element = document.getElementById('document-preview-target');
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${doc.title || 'Document'}.pdf`);
      addToast('PDF exported successfully', 'success');
    } catch (error) {
      console.error('PDF export error:', error);
      addToast('Failed to export PDF', 'error');
    }
  };

  const handleSign = async () => {
    if (!signatureName) return;
    try {
      await api.addSignature({
        document_id: doc.id,
        signer_id: user?.id,
        signer_name: signatureName,
        signer_role: user?.role_name === 'Tenant' ? 'Tenant' : 'Landlord',
        signed_at: new Date().toISOString(),
      });
      
      // Update status if needed
      await api.updateLegalDocument(doc.id!, { status: 'Signed' });
      
      addToast('Signed successfully', 'success');
      setShowSignature(false);
      onSave();
    } catch (error) {
      addToast('Signing failed', 'error');
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[60] bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const processedContentEn = replacePlaceholders(doc.content_en || '', doc.placeholders_data || {});
  const processedContentSo = replacePlaceholders(doc.content_so || '', doc.placeholders_data || {});

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 z-[60] flex flex-col bg-zinc-50 dark:bg-zinc-950 overflow-hidden"
    >
      {/* Header */}
      <header className="h-20 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between px-8 shrink-0">
        <div className="flex items-center gap-6">
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors">
            <X size={20} className="text-zinc-500" />
          </button>
          <div>
             <div className="flex items-center gap-2 mb-1">
                <FileText size={16} className="text-violet-600" />
                <h2 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
                  {doc.title || 'Untitled Document'}
                </h2>
                <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest ${
                  doc.status === 'Signed' ? 'bg-green-100 text-green-700' :
                  doc.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                  'bg-zinc-100 text-zinc-600'
                }`}>
                  {doc.status}
                </span>
             </div>
             <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
               Somalia Legal Workflow • {template?.category || 'General'}
             </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl mr-4">
            <button 
              onClick={() => setActiveTab('edit')}
              className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${
                activeTab === 'edit' ? 'bg-white dark:bg-zinc-700 text-violet-600 shadow-sm' : 'text-zinc-500'
              }`}
            >
              Edit
            </button>
            <button 
              onClick={() => setActiveTab('preview')}
              className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${
                activeTab === 'preview' ? 'bg-white dark:bg-zinc-700 text-violet-600 shadow-sm' : 'text-zinc-500'
              }`}
            >
              Preview
            </button>
          </div>

          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-violet-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-violet-700 transition-all shadow-lg shadow-violet-600/20 disabled:opacity-50"
          >
            <Save size={14} />
            {saving ? 'Saving...' : 'Save Draft'}
          </button>
          
          {doc.id && (
            <>
              <button 
                onClick={handleExportPDF}
                className="flex items-center gap-2 px-6 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-all"
              >
                <Download size={14} />
                Export PDF
              </button>
              {doc.status !== 'Signed' && (
                <button 
                  onClick={() => setShowSignature(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
                >
                  <Signature size={14} />
                  Sign Document
                </button>
              )}
            </>
          )}
        </div>
      </header>
      
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar: Placeholders & Options */}
        <aside className="w-80 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 overflow-y-auto shrink-0 scrollbar-hide">
          <div className="mb-8">
            <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-4">Language Options</h4>
            <div className="grid grid-cols-1 gap-2">
              <button 
                onClick={() => setLanguage('en')}
                className={`flex items-center justify-between p-3 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all ${
                  language === 'en' ? 'bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800 text-violet-600' : 'border-锌-100 dark:border-zinc-800 text-zinc-500'
                }`}
              >
                <div className="flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-violet-600" />
                   English Only
                </div>
                <Languages size={14} />
              </button>
              <button 
                onClick={() => setLanguage('so')}
                className={`flex items-center justify-between p-3 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all ${
                  language === 'so' ? 'bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800 text-violet-600' : 'border-锌-100 dark:border-zinc-800 text-zinc-500'
                }`}
              >
                <div className="flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-violet-600" />
                   Somali Only
                </div>
                <Languages size={14} />
              </button>
              <button 
                onClick={() => setLanguage('both')}
                className={`flex items-center justify-between p-3 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all ${
                  language === 'both' ? 'bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800 text-violet-600' : 'border-锌-100 dark:border-zinc-800 text-zinc-500'
                }`}
              >
                <div className="flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-violet-600" />
                   Bilingual Side-by-Side
                </div>
                <Languages size={14} />
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">Smart Autofill</h4>
              <Info size={12} className="text-zinc-400" />
            </div>
            
            {(Array.isArray(template?.placeholders) ? template.placeholders : []).map(key => (
              <div key={key} className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                  {key.replace(/_/g, ' ')}
                </label>
                <input 
                  type="text"
                  value={doc.placeholders_data?.[key] || ''}
                  onChange={(e) => {
                    const newData = { ...doc.placeholders_data, [key]: e.target.value };
                    setDoc({ ...doc, placeholders_data: newData });
                  }}
                  className="vintsy-input w-full py-2.5"
                  placeholder={`Enter ${key.replace(/_/g, ' ')}...`}
                />
              </div>
            ))}
          </div>

          <div className="mt-12 pt-12 border-t border-zinc-100 dark:border-zinc-800 space-y-6">
            <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-4">Entity Linking</h4>
            
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Property</label>
              <select 
                value={doc.property_id || ''}
                onChange={(e) => setDoc({ ...doc, property_id: Number(e.target.value) })}
                className="vintsy-input w-full py-2.5 appearance-none"
              >
                <option value="">Select Property...</option>
                {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Tenant</label>
              <select 
                value={doc.tenant_id || ''}
                onChange={(e) => setDoc({ ...doc, tenant_id: Number(e.target.value) })}
                className="vintsy-input w-full py-2.5 appearance-none"
              >
                <option value="">Select Tenant...</option>
                {tenants.map(t => <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>)}
              </select>
            </div>
          </div>
        </aside>

        {/* Editor/Preview Area */}
        <main className="flex-1 bg-zinc-50 dark:bg-zinc-950 p-12 overflow-y-auto scrollbar-hide">
          <div className="max-w-5xl mx-auto">
            {activeTab === 'edit' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
                <div className="vintsy-card p-10 flex flex-col gap-6">
                   <div className="flex items-center justify-between">
                     <h5 className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">English Content</h5>
                     <Languages size={14} className="text-zinc-300" />
                   </div>
                   <textarea 
                    value={doc.content_en}
                    onChange={(e) => setDoc({ ...doc, content_en: e.target.value })}
                    className="flex-1 w-full bg-zinc-50/50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-6 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                    placeholder="Enter English markdown content..."
                   />
                </div>
                <div className="vintsy-card p-10 flex flex-col gap-6">
                   <div className="flex items-center justify-between">
                     <h5 className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">Somali Content (Af Somaali)</h5>
                     <Languages size={14} className="text-zinc-300" />
                   </div>
                   <textarea 
                    value={doc.content_so}
                    onChange={(e) => setDoc({ ...doc, content_so: e.target.value })}
                    className="flex-1 w-full bg-zinc-50/50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-6 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                    placeholder="Gali qoraalka Af Soomaaliga ah..."
                   />
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-8">
                <div 
                  id="document-preview-target"
                  className="vintsy-card p-16 shadow-2xl bg-white text-zinc-900 min-h-[141.42%] aspect-[1/1.4142]"
                >
                  <div className="flex justify-between items-start mb-16 pb-8 border-b-2 border-zinc-900">
                    <div>
                      <h1 className="text-4xl font-extrabold tracking-tight uppercase mb-2">HantiMaster</h1>
                      <p className="text-[10px] font-bold tracking-[0.3em] uppercase opacity-60">Somalia Real Estate Authority Compliant</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold uppercase tracking-[0.2em] mb-1">Document ID</p>
                      <p className="text-xl font-mono">#{doc.id || 'DRAFT'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-12">
                    {language === 'both' ? (
                      <div className="grid grid-cols-2 gap-12">
                         <div className="prose prose-sm prose-zinc prose-headings:uppercase prose-headings:tracking-widest">
                           <ReactMarkdown>{processedContentEn}</ReactMarkdown>
                         </div>
                         <div className="prose prose-sm prose-zinc prose-headings:uppercase prose-headings:tracking-widest border-l-2 border-zinc-100 pl-12" dir="rtl">
                           <ReactMarkdown>{processedContentSo}</ReactMarkdown>
                         </div>
                      </div>
                    ) : language === 'en' ? (
                      <div className="prose prose prose-zinc prose-headings:uppercase max-w-none">
                        <ReactMarkdown>{processedContentEn}</ReactMarkdown>
                      </div>
                    ) : (
                      <div className="prose prose prose-zinc prose-headings:uppercase max-w-none text-right" dir="rtl">
                        <ReactMarkdown>{processedContentSo}</ReactMarkdown>
                      </div>
                    )}
                  </div>

                  {/* Signatures Area */}
                  <div className="mt-24 pt-12 border-t-2 border-dashed border-zinc-200">
                    <h5 className="text-[10px] font-bold uppercase tracking-[0.3em] mb-12">Authorized Signatures / Saxiixyada La Ogolaaday</h5>
                    <div className="grid grid-cols-2 gap-24">
                       <div className="space-y-6">
                         <div className="h-16 border-b-2 border-zinc-900 flex items-end pb-2">
                           {doc.signatures?.find(s => s.signer_role === 'Landlord' || s.signer_role === 'Witness') ? (
                              <p className="font-serif italic text-2xl">{doc.signatures.find(s => s.signer_role === 'Landlord' || s.signer_role === 'Witness')?.signer_name}</p>
                           ) : (
                             <p className="text-[10px] text-zinc-300 uppercase tracking-widest font-bold font-sans">Pending Landlord Signature</p>
                           )}
                         </div>
                         <p className="text-xs font-bold uppercase tracking-widest">Landlord / Mulkiilaha</p>
                       </div>
                       <div className="space-y-6">
                         <div className="h-16 border-b-2 border-zinc-900 flex items-end pb-2">
                           {doc.signatures?.find(s => s.signer_role === 'Tenant') ? (
                              <p className="font-serif italic text-2xl">{doc.signatures.find(s => s.signer_role === 'Tenant')?.signer_name}</p>
                           ) : (
                             <p className="text-[10px] text-zinc-300 uppercase tracking-widest font-bold font-sans">Pending Tenant Signature</p>
                           )}
                         </div>
                         <p className="text-xs font-bold uppercase tracking-widest">Tenant / Kireystaha</p>
                       </div>
                    </div>
                  </div>

                  <div className="mt-24 text-center">
                    <p className="text-[8px] uppercase tracking-[0.4em] font-bold opacity-30">This is an electronically signed document verifiable via HantiMaster Somalia.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Signature Modal */}
      <AnimatePresence>
        {showSignature && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSignature(false)}
              className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md vintsy-card p-10 bg-white dark:bg-zinc-900 shadow-2xl"
            >
              <h3 className="text-sm font-bold uppercase tracking-[0.2em] mb-8">Digital Signature Confirmation</h3>
              <p className="text-xs text-zinc-500 mb-8 leading-relaxed">
                By entering your name below, you are providing a legally binding digital signature for this document in accordance with Somalia electronic transaction norms.
              </p>
              
              <div className="space-y-6">
                 <div className="space-y-2">
                   <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Type Full Legal Name</label>
                   <input 
                    type="text"
                    value={signatureName}
                    onChange={(e) => setSignatureName(e.target.value)}
                    className="vintsy-input w-full text-lg font-serif italic"
                    placeholder="Your Full Name"
                   />
                 </div>

                 <div className="flex gap-4">
                   <button 
                     onClick={handleSign}
                     disabled={!signatureName}
                     className="flex-1 py-4 bg-emerald-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                   >
                     Confirm Signature
                   </button>
                   <button 
                     onClick={() => setShowSignature(false)}
                     className="flex-1 py-4 bg-zinc-50 dark:bg-zinc-800 text-zinc-500 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-zinc-100 dark:border-zinc-700"
                   >
                     Cancel
                   </button>
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
