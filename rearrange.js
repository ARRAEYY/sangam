const fs = require('fs')

function reorderDashboard() {
  let content = fs.readFileSync('frontend/src/pages/Dashboard.jsx', 'utf8')
  
  // Extract Experience section
  const expStartStr = '      {/* Experience */}'
  const expStartIndex = content.indexOf(expStartStr)
  const eduStartStr = '      {/* Education */}'
  const eduStartIndex = content.indexOf(eduStartStr)
  const achStartStr = '      {/* Achievements & Awards */}'
  const achStartIndex = content.indexOf(achStartStr)
  const projStartStr = '      {/* Projects (LinkedIn-style history) */}'
  const projStartIndex = content.indexOf(projStartStr)
  const yourProjStartStr = '      {/* Projects */}'
  const yourProjStartIndex = content.indexOf(yourProjStartStr)
  
  const experienceSection = content.substring(expStartIndex, eduStartIndex)
  const educationSection = content.substring(eduStartIndex, achStartIndex)
  const achievementSection = content.substring(achStartIndex, projStartIndex)
  const projectsSection = content.substring(projStartIndex, yourProjStartIndex)
  
  // Create new content by replacing the chunk from expStartStr to yourProjStartIndex
  const newOrder = projectsSection + educationSection + experienceSection + achievementSection
  
  const prefix = content.substring(0, expStartIndex)
  const suffix = content.substring(yourProjStartIndex)
  
  fs.writeFileSync('frontend/src/pages/Dashboard.jsx', prefix + newOrder + suffix)
  console.log('Reordered Dashboard.jsx')
}

function reorderTalentSearch() {
  let content = fs.readFileSync('frontend/src/pages/TalentSearch.jsx', 'utf8')
  
  // Replace "Project Experience" with "Projects"
  content = content.replace('Project Experience', 'Projects')
  
  // Replace "Work Experience" with "Experience"
  content = content.replace('Work Experience', 'Experience')
  
  // Remove role_category span
  const roleCategoryRegex = /\{pr\.role_category && pr\.role_category !== 'OTHER' && \([\s\S]*?\)\}/
  content = content.replace(roleCategoryRegex, '')
  
  // Reorder sections
  const eduStart = content.indexOf('{/* Education First */}')
  const projStart = content.indexOf('{/* Projects Second */}')
  const expStart = content.indexOf('{/* Work Experience Third */}')
  const achStart = content.indexOf('{/* Achievements Last */}')
  
  const eduBlock = content.substring(eduStart, projStart)
  let projBlock = content.substring(projStart, expStart)
  const expBlock = content.substring(expStart, achStart)
  
  // Rename the comments just for clarity
  const newEduBlock = eduBlock.replace('{/* Education First */}', '{/* Education Second */}')
  const newProjBlock = projBlock.replace('{/* Projects Second */}', '{/* Projects First */}')
  const newExpBlock = expBlock.replace('{/* Work Experience Third */}', '{/* Experience Third */}')
  
  const newOrder = newProjBlock + newEduBlock + newExpBlock
  
  const prefix = content.substring(0, eduStart)
  const suffix = content.substring(achStart)
  
  fs.writeFileSync('frontend/src/pages/TalentSearch.jsx', prefix + newOrder + suffix)
  console.log('Reordered TalentSearch.jsx')
}

try {
  reorderDashboard()
  reorderTalentSearch()
} catch(e) {
  console.error(e)
}
