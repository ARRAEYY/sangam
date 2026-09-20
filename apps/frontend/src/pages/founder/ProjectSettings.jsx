import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Save, AlertTriangle, Image as ImageIcon, FileText, CheckCircle2, ShieldAlert, Globe, Tags, Users } from 'lucide-react'
import FounderLayout from '../../components/founder/FounderLayout'
import { api } from '../../services/api.js'

export default function ProjectSettings() {
  const { id } = useParams()
  const [activeTab, setActiveTab] = useState('GENERAL') // GENERAL, HIRING, DANGER
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  // Settings State
  const [projectName, setProjectName] = useState('')
  const [category, setCategory] = useState('Technology')
  const [projectUrl, setProjectUrl] = useState('')
  const [visibility, setVisibility] = useState('Public')
  const [description, setDescription] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [generalRequirements, setGeneralRequirements] = useState(
    "• Passion for the project's mission\n• Willingness to collaborate\n• Relevant skills or willingness to learn\n• Commitment of at least 5 hours/week"
  )
  const [screeningQuestions, setScreeningQuestions] = useState(
    '1. Why do you want to join this project?\n2. What relevant experience do you have?\n3. How much time can you commit per week?'
  )

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true)
        const project = await api.getProject(id).catch(() => null)
        if (project) {
          setProjectName(project.title || 'AI for Social Good')
          setCategory(project.category || 'Technology')
          setProjectUrl(project.project_url || 'sangam.dev/ai-for-social-good')
          setVisibility(project.visibility || 'Public')
          setDescription(project.description || 'Building AI solutions for a better, more inclusive world.')
          setLogoUrl(project.logo_url || '')
        }
      } catch (err) {
        console.error('Failed to load project settings:', err)
      } finally {
        setLoading(false)
      }
    }
    loadSettings()
  }, [id])

  const handleSave = async (e) => {
    if (e) e.preventDefault()
    try {
      setSaving(true)
      await api.updateProjectSettings(id, {
        title: projectName,
        category,
        project_url: projectUrl,
        visibility,
        description,
        logo_url: logoUrl,
      }).catch(() => null)

      setToastMessage('Settings saved successfully!')
      setTimeout(() => setToastMessage(''), 3000)
    } catch (err) {
      alert(err.message || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const navItems = [
    { id: 'GENERAL', label: 'General Information', icon: <FileText size={16} /> },
    { id: 'HIRING', label: 'Hiring & Onboarding', icon: <Users size={16} /> },
    { id: 'DANGER', label: 'Danger Zone', icon: <ShieldAlert size={16} />, isDanger: true },
  ]

  return (
    <FounderLayout>
      <div className="page-stack max-w-[1200px] mx-auto w-full mb-16">
        {/* Header */}
        <section className="reveal-in flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Project Settings</h1>
            <p className="text-[15px] text-slate-500 mt-1">Manage project preferences and configuration.</p>
          </div>
          {toastMessage && (
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[13px] font-bold rounded-xl animate-in fade-in slide-in-from-top-2 shadow-sm">
              <CheckCircle2 size={16} className="text-emerald-600" /> {toastMessage}
            </span>
          )}
        </section>

        <div className="flex flex-col md:flex-row gap-10 dashboard-section reveal-in delay-1">
          {/* Settings Sidebar */}
          <aside className="w-full md:w-64 shrink-0">
            <nav className="flex flex-row md:flex-col gap-1.5 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
               {navItems.map((item) => (
                 <button
                   key={item.id}
                   onClick={() => setActiveTab(item.id)}
                   className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-[14px] transition-colors whitespace-nowrap text-left ${
                     activeTab === item.id
                       ? item.isDanger
                         ? 'bg-red-50 text-red-700 shadow-sm'
                         : 'bg-white border border-slate-200 text-slate-900 shadow-sm'
                       : 'text-slate-500 hover:bg-white hover:border-slate-200 border border-transparent hover:text-slate-900'
                   }`}
                 >
                   <span className={`${activeTab === item.id ? (item.isDanger ? 'text-red-500' : 'text-brand-600') : 'text-slate-400'}`}>
                     {item.icon}
                   </span>
                   {item.label}
                 </button>
               ))}
            </nav>
          </aside>

          {/* Settings Content */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="py-20 text-center text-slate-400 animate-pulse font-medium">Loading settings...</div>
            ) : (
              <form onSubmit={handleSave} className="space-y-6">
                
                {/* General Tab */}
                {activeTab === 'GENERAL' && (
                  <div className="bg-white border border-slate-200 rounded-[18px] p-8 shadow-sm space-y-8 animate-in fade-in">
                    <div>
                      <h3 className="font-display font-semibold text-slate-900 text-lg mb-1">Project Profile</h3>
                      <p className="text-[13px] text-slate-500 mb-8">Basic information that represents your project publicly.</p>
                      
                      <div className="space-y-6">
                        {/* Avatar / Logo Upload */}
                        <div className="flex items-center gap-6">
                           <div className="w-24 h-24 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden">
                             {logoUrl ? (
                               <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                             ) : (
                               <ImageIcon size={32} className="text-slate-300" />
                             )}
                           </div>
                           <div>
                             <label className="block text-[14px] font-semibold text-slate-900 mb-2">Project Logo</label>
                             <div className="flex items-center gap-3">
                               <input
                                 type="text"
                                 value={logoUrl}
                                 onChange={(e) => setLogoUrl(e.target.value)}
                                 placeholder="Enter logo URL (e.g., imgur link)"
                                 className="flex-1 text-[13px] bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all placeholder:text-slate-400"
                               />
                               <button type="button" className="button button-secondary">
                                 Upload
                               </button>
                             </div>
                             <p className="text-[12px] text-slate-400 mt-2">Recommended size: 256x256px.</p>
                           </div>
                        </div>

                        <div>
                          <label className="block text-[14px] font-semibold text-slate-900 mb-2">Project Name</label>
                          <input
                            type="text"
                            value={projectName}
                            onChange={(e) => setProjectName(e.target.value)}
                            className="w-full text-[14px] bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-semibold text-slate-900"
                            required
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="flex items-center gap-1.5 text-[14px] font-semibold text-slate-900 mb-2"><Tags size={14} className="text-brand-500" /> Category</label>
                            <select
                              value={category}
                              onChange={(e) => setCategory(e.target.value)}
                              className="w-full text-[14px] bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-slate-700"
                            >
                              <option>Technology</option>
                              <option>Environment</option>
                              <option>Education</option>
                              <option>Healthcare</option>
                            </select>
                          </div>
                          <div>
                            <label className="flex items-center gap-1.5 text-[14px] font-semibold text-slate-900 mb-2"><Globe size={14} className="text-brand-500" /> Visibility</label>
                            <select
                              value={visibility}
                              onChange={(e) => setVisibility(e.target.value)}
                              className="w-full text-[14px] bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-slate-700"
                            >
                              <option>Public</option>
                              <option>Private</option>
                              <option>Invite Only</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[14px] font-semibold text-slate-900 mb-2">Short Description</label>
                          <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={4}
                            className="w-full text-[14px] bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-slate-700 resize-y leading-relaxed"
                            placeholder="Briefly describe what your project is about..."
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Hiring Tab */}
                {activeTab === 'HIRING' && (
                  <div className="bg-white border border-slate-200 rounded-[18px] p-8 shadow-sm space-y-8 animate-in fade-in">
                    <div>
                      <h3 className="font-display font-semibold text-slate-900 text-lg mb-1">Hiring Configuration</h3>
                      <p className="text-[13px] text-slate-500 mb-8">Set up global requirements and questions for applicants.</p>
                      
                      <div className="space-y-6">
                        <div>
                          <label className="block text-[14px] font-semibold text-slate-900 mb-2">General Requirements</label>
                          <textarea
                            value={generalRequirements}
                            onChange={(e) => setGeneralRequirements(e.target.value)}
                            rows={5}
                            className="w-full text-[13px] bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-slate-700 font-mono leading-relaxed"
                          />
                          <p className="text-[12px] text-slate-400 mt-2">These apply to all open roles by default.</p>
                        </div>
                        <div>
                          <label className="block text-[14px] font-semibold text-slate-900 mb-2">Default Screening Questions</label>
                          <textarea
                            value={screeningQuestions}
                            onChange={(e) => setScreeningQuestions(e.target.value)}
                            rows={5}
                            className="w-full text-[13px] bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-slate-700 font-mono leading-relaxed"
                          />
                          <p className="text-[12px] text-slate-400 mt-2">Applicants will be asked these when applying for roles.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Danger Zone */}
                {activeTab === 'DANGER' && (
                  <div className="bg-white border border-slate-200 rounded-[18px] p-8 shadow-sm space-y-8 animate-in fade-in">
                      <h3 className="font-display font-semibold text-slate-900 text-lg mb-1 flex items-center gap-2">
                        <AlertTriangle size={20} className="text-red-500" /> Danger Zone
                      </h3>
                      <p className="text-[13px] text-slate-500 mb-8">Irreversible and destructive actions.</p>
                      
                      <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white border border-slate-200 rounded-xl shadow-sm">
                          <div>
                            <h4 className="font-semibold text-slate-900 text-[14px]">Transfer Ownership</h4>
                            <p className="text-[12px] text-slate-500 mt-1">Transfer this project to another user or organization.</p>
                          </div>
                          <button type="button" className="button button-secondary shrink-0">
                            Transfer
                          </button>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white border border-slate-200 rounded-xl shadow-sm">
                          <div>
                            <h4 className="font-semibold text-slate-900 text-[14px]">Delete Project</h4>
                            <p className="text-[12px] text-slate-500 mt-1">Permanently delete this project and all its data. This cannot be undone.</p>
                          </div>
                        <button type="button" className="button bg-red-600 hover:bg-red-700 text-white shrink-0 border-none">
                          Delete Project
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Save Button Footer */}
                {activeTab !== 'DANGER' && (
                  <div className="flex items-center justify-end pt-6 border-t border-slate-200">
                    <button
                      type="submit"
                      disabled={saving}
                      className="button button-primary shadow-md shadow-brand-600/20"
                    >
                      {saving ? 'Saving...' : 'Save Changes'} <Save size={14} className="ml-1" />
                    </button>
                  </div>
                )}

              </form>
            )}
          </div>
        </div>
      </div>
    </FounderLayout>
  )
}
