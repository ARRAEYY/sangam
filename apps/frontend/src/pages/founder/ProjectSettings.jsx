import React, { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Save, AlertTriangle, Image as ImageIcon, FileText, CheckCircle2, ShieldAlert, Globe, Tags, Users, X } from 'lucide-react'
import WorkspaceLayout from '../../components/founder/WorkspaceLayout'
import { api } from '../../services/api.js'

export default function ProjectSettings() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('GENERAL') // GENERAL, HIRING, DANGER
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const fileInputRef = useRef(null)

  const handleDeleteProject = async () => {
    if (!window.confirm('Are you absolutely sure you want to permanently delete this project? This action cannot be undone.')) {
      return
    }
    try {
      setLoading(true)
      await api.deleteProject(id)
      navigate('/dashboard')
    } catch (err) {
      alert(err.message || 'Failed to delete project')
      setLoading(false)
    }
  }

  // Transfer State
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false)
  const [projectMembers, setProjectMembers] = useState([])
  const [selectedNewOwner, setSelectedNewOwner] = useState(null)
  const [transferring, setTransferring] = useState(false)

  const handleOpenTransfer = async () => {
    setIsTransferModalOpen(true)
    try {
      const data = await api.getMembers(id)
      // Filter out the current lead
      const eligible = data.filter(m => !m.is_lead)
      setProjectMembers(eligible)
    } catch (err) {
      console.error('Failed to load members', err)
    }
  }

  const handleConfirmTransfer = async () => {
    if (!selectedNewOwner) return
    try {
      setTransferring(true)
      await api.transferProjectOwnership(id, selectedNewOwner)
      setToastMessage('Ownership transferred successfully.')
      setIsTransferModalOpen(false)
      setTimeout(() => {
        navigate('/dashboard')
      }, 1500)
    } catch (err) {
      alert(err.message || 'Failed to transfer ownership.')
    } finally {
      setTransferring(false)
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('File is too large. Please select an image under 2MB.')
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoUrl(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

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
      })

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
    <WorkspaceLayout>
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
                                  value={logoUrl?.startsWith('data:image') ? 'Uploaded Image' : logoUrl}
                                  onChange={(e) => {
                                    if (e.target.value !== 'Uploaded Image') {
                                      setLogoUrl(e.target.value)
                                    }
                                  }}
                                  placeholder="Enter logo URL (e.g., imgur link) or upload"
                                  disabled={logoUrl?.startsWith('data:image')}
                                  className="flex-1 text-[13px] bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all placeholder:text-slate-400"
                                />
                               <input
                                 type="file"
                                 ref={fileInputRef}
                                 onChange={handleFileChange}
                                 accept="image/*"
                                 className="hidden"
                               />
                               <button type="button" className="button button-secondary" onClick={() => fileInputRef.current?.click()}>
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
                          <button type="button" onClick={handleOpenTransfer} className="button button-secondary shrink-0">
                            Transfer
                          </button>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white border border-slate-200 rounded-xl shadow-sm">
                          <div>
                            <h4 className="font-semibold text-slate-900 text-[14px]">Delete Project</h4>
                            <p className="text-[12px] text-slate-500 mt-1">Permanently delete this project and all its data. This cannot be undone.</p>
                          </div>
                        <button 
                          type="button" 
                          onClick={handleDeleteProject}
                          className="button bg-red-600 hover:bg-red-700 text-white shrink-0 border-none"
                        >
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

      {/* Transfer Modal */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden reveal-in">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="font-display font-semibold text-slate-900">Transfer Ownership</h3>
              <button onClick={() => setIsTransferModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-5">
              <p className="text-[14px] text-slate-500 mb-4">Select an active team member to transfer ownership of this project to. You will lose founder access.</p>
              
              {projectMembers.length === 0 ? (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-[13px] text-slate-500">
                  No eligible team members found.
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                  {projectMembers.map(m => (
                    <div 
                      key={m.user_id}
                      onClick={() => setSelectedNewOwner(m.user_id)}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${selectedNewOwner === m.user_id ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:border-slate-300'}`}
                    >
                      <div className="w-10 h-10 rounded-full bg-slate-200 flex-shrink-0 overflow-hidden">
                        {m.user?.avatar_url ? <img src={m.user.avatar_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold text-sm">{m.user?.full_name?.charAt(0)}</div>}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 text-[14px]">{m.user?.full_name}</div>
                        <div className="text-slate-500 text-[12px]">{m.role}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-5 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button onClick={() => setIsTransferModalOpen(false)} className="button button-secondary text-[13px]">
                Cancel
              </button>
              <button 
                onClick={handleConfirmTransfer}
                disabled={!selectedNewOwner || transferring}
                className="button bg-red-600 hover:bg-red-700 text-white text-[13px] disabled:opacity-50 border-none"
              >
                {transferring ? 'Transferring...' : 'Confirm Transfer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </WorkspaceLayout>
  )
}
