import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Save, AlertTriangle, Image as ImageIcon, FileText, CheckCircle2, ShieldAlert, Globe, Tags, Users } from 'lucide-react'
import FounderLayout from '../../components/founder/FounderLayout'
import { api } from '../../api'

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
      <div className="max-w-6xl mx-auto pb-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Project Settings</h1>
            <p className="text-sm text-slate-500 mt-1">Manage project preferences and configuration.</p>
          </div>
          {toastMessage && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-bold rounded-xl animate-in fade-in slide-in-from-top-2 shadow-sm">
              <CheckCircle2 size={16} className="text-emerald-500" /> {toastMessage}
            </span>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Settings Sidebar */}
          <aside className="w-full md:w-64 shrink-0">
            <nav className="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
               {navItems.map((item) => (
                 <button
                   key={item.id}
                   onClick={() => setActiveTab(item.id)}
                   className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors whitespace-nowrap text-left ${
                     activeTab === item.id
                       ? item.isDanger
                         ? 'bg-red-50 text-red-700'
                         : 'bg-maroon-50 text-maroon-700'
                       : 'text-slate-600 hover:bg-slate-100'
                   }`}
                 >
                   <span className={`${activeTab === item.id ? (item.isDanger ? 'text-red-500' : 'text-maroon-500') : 'text-slate-400'}`}>
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
              <div className="py-20 text-center text-slate-400 animate-pulse">Loading settings...</div>
            ) : (
              <form onSubmit={handleSave} className="space-y-6">
                
                {/* General Tab */}
                {activeTab === 'GENERAL' && (
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-8 animate-in fade-in">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 mb-1">Project Profile</h3>
                      <p className="text-sm text-slate-500 mb-6">Basic information that represents your project publicly.</p>
                      
                      <div className="space-y-5">
                        {/* Avatar / Logo Upload */}
                        <div className="flex items-center gap-5">
                           <div className="w-20 h-20 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden">
                             {logoUrl ? (
                               <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                             ) : (
                               <ImageIcon size={28} className="text-slate-300" />
                             )}
                           </div>
                           <div>
                             <label className="block text-sm font-semibold text-slate-700 mb-1">Project Logo</label>
                             <div className="flex items-center gap-3">
                               <input
                                 type="text"
                                 value={logoUrl}
                                 onChange={(e) => setLogoUrl(e.target.value)}
                                 placeholder="Enter logo URL (e.g., imgur link)"
                                 className="flex-1 text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-maroon-500/20 focus:border-maroon-500 transition-all placeholder:text-slate-400"
                               />
                               <button type="button" className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg transition-colors border border-slate-200 shadow-sm">
                                 Upload
                               </button>
                             </div>
                             <p className="text-xs text-slate-400 mt-1.5">Recommended size: 256x256px.</p>
                           </div>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Project Name</label>
                          <input
                            type="text"
                            value={projectName}
                            onChange={(e) => setProjectName(e.target.value)}
                            className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-maroon-500/20 focus:border-maroon-500 transition-all font-medium text-slate-900"
                            required
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5"><Tags size={14} className="text-slate-400" /> Category</label>
                            <select
                              value={category}
                              onChange={(e) => setCategory(e.target.value)}
                              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-maroon-500/20 focus:border-maroon-500 transition-all text-slate-700"
                            >
                              <option>Technology</option>
                              <option>Environment</option>
                              <option>Education</option>
                              <option>Healthcare</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5"><Globe size={14} className="text-slate-400" /> Visibility</label>
                            <select
                              value={visibility}
                              onChange={(e) => setVisibility(e.target.value)}
                              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-maroon-500/20 focus:border-maroon-500 transition-all text-slate-700"
                            >
                              <option>Public</option>
                              <option>Private</option>
                              <option>Invite Only</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Short Description</label>
                          <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={4}
                            className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-maroon-500/20 focus:border-maroon-500 transition-all text-slate-700 resize-y"
                            placeholder="Briefly describe what your project is about..."
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Hiring Tab */}
                {activeTab === 'HIRING' && (
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-8 animate-in fade-in">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 mb-1">Hiring Configuration</h3>
                      <p className="text-sm text-slate-500 mb-6">Set up global requirements and questions for applicants.</p>
                      
                      <div className="space-y-5">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1.5">General Requirements</label>
                          <textarea
                            value={generalRequirements}
                            onChange={(e) => setGeneralRequirements(e.target.value)}
                            rows={4}
                            className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-maroon-500/20 focus:border-maroon-500 transition-all text-slate-700 font-mono"
                          />
                          <p className="text-xs text-slate-400 mt-1.5">These apply to all open roles by default.</p>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Default Screening Questions</label>
                          <textarea
                            value={screeningQuestions}
                            onChange={(e) => setScreeningQuestions(e.target.value)}
                            rows={4}
                            className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-maroon-500/20 focus:border-maroon-500 transition-all text-slate-700 font-mono"
                          />
                          <p className="text-xs text-slate-400 mt-1.5">Applicants will be asked these when applying for roles.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Danger Zone */}
                {activeTab === 'DANGER' && (
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-6 shadow-sm animate-in fade-in">
                    <h3 className="text-lg font-bold text-red-800 mb-1 flex items-center gap-2"><AlertTriangle size={20} /> Danger Zone</h3>
                    <p className="text-sm text-red-600/80 mb-6">Irreversible and destructive actions.</p>
                    
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white border border-red-100 rounded-xl">
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">Transfer Ownership</h4>
                          <p className="text-xs text-slate-500 mt-0.5">Transfer this project to another user or organization.</p>
                        </div>
                        <button type="button" className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-semibold text-sm rounded-lg hover:bg-slate-50 transition-colors shrink-0">
                          Transfer
                        </button>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white border border-red-100 rounded-xl">
                        <div>
                          <h4 className="font-bold text-red-700 text-sm">Delete Project</h4>
                          <p className="text-xs text-slate-500 mt-0.5">Permanently delete this project and all its data. This cannot be undone.</p>
                        </div>
                        <button type="button" className="px-4 py-2 bg-red-600 text-white font-semibold text-sm rounded-lg hover:bg-red-700 transition-colors shrink-0">
                          Delete Project
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Save Button Footer */}
                {activeTab !== 'DANGER' && (
                  <div className="flex items-center justify-end pt-4 border-t border-slate-200">
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center gap-2 px-6 py-2.5 bg-maroon-600 text-white font-bold text-sm rounded-xl hover:bg-maroon-700 transition-all shadow-sm shadow-maroon-600/20 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      <Save size={18} />
                      {saving ? 'Saving...' : 'Save Changes'}
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
