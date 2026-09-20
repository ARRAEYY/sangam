/**
 * Calculates a deterministic profile completion score (0 - 100%)
 * based on real, meaningful profile sections.
 */
function calculateProfileCompletion(user, { experiences = [], educations = [], achievements = [], memberships = [] } = {}) {
  if (!user) return { percentage: 0, next_step: 'Complete your registration', breakdown: {} }

  let score = 0
  const breakdown = {}
  const missingSteps = []

  // 1. Basic Identity (20%)
  const hasAvatar = Boolean(user.avatar_url && String(user.avatar_url).trim())
  breakdown.avatar = hasAvatar ? 10 : 0
  score += breakdown.avatar
  if (!hasAvatar) {
    missingSteps.push({ key: 'avatar', message: 'Add a profile photo to stand out.', weight: 10 })
  }

  const hasHeadline = Boolean(user.headline && String(user.headline).trim())
  breakdown.headline = hasHeadline ? 10 : 0
  score += breakdown.headline
  if (!hasHeadline) {
    missingSteps.push({ key: 'headline', message: 'Add a professional headline.', weight: 10 })
  }

  // 2. Academic & Bio (25%)
  const hasBranch = Boolean(user.branch && String(user.branch).trim())
  breakdown.branch = hasBranch ? 10 : 0
  score += breakdown.branch
  if (!hasBranch) {
    missingSteps.push({ key: 'branch', message: 'Select your course/branch.', weight: 10 })
  }

  const bioLength = user.bio ? String(user.bio).trim().length : 0
  const hasBio = bioLength >= 15
  breakdown.bio = hasBio ? 15 : (bioLength > 0 ? 5 : 0)
  score += breakdown.bio
  if (!hasBio) {
    missingSteps.push({ key: 'bio', message: 'Write a brief bio (at least 15 characters).', weight: 15 })
  }

  // 3. Skills (15%)
  const skillsCount = Array.isArray(user.skills) ? user.skills.length : 0
  let skillsScore = 0
  if (skillsCount >= 3) {
    skillsScore = 15
  } else if (skillsCount > 0) {
    skillsScore = skillsCount * 5
  }
  breakdown.skills = skillsScore
  score += skillsScore
  if (skillsCount < 3) {
    const remaining = 3 - skillsCount
    missingSteps.push({ key: 'skills', message: `Add ${remaining} more skill${remaining > 1 ? 's' : ''} to highlight your expertise.`, weight: 15 - skillsScore })
  }

  // 4. Links & Socials (15%)
  const hasLinks = Boolean(
    (user.github_url && String(user.github_url).trim()) ||
    (user.linkedin_url && String(user.linkedin_url).trim()) ||
    (user.portfolio_url && String(user.portfolio_url).trim()) ||
    (user.leetcode_url && String(user.leetcode_url).trim()) ||
    (user.codeforces_url && String(user.codeforces_url).trim())
  )
  breakdown.links = hasLinks ? 15 : 0
  score += breakdown.links
  if (!hasLinks) {
    missingSteps.push({ key: 'links', message: 'Link your GitHub, LinkedIn, or portfolio.', weight: 15 })
  }

  // 5. Portfolio & History (25%)
  const hasEducation = educations.length > 0
  breakdown.education = hasEducation ? 10 : 0
  score += breakdown.education
  if (!hasEducation) {
    missingSteps.push({ key: 'education', message: 'Add your education history.', weight: 10 })
  }

  const hasWorkOrProject = experiences.length > 0 || memberships.length > 0
  breakdown.experience = hasWorkOrProject ? 10 : 0
  score += breakdown.experience
  if (!hasWorkOrProject) {
    missingSteps.push({ key: 'experience', message: 'Add work experience or join a project team.', weight: 10 })
  }

  const hasAchievement = achievements.length > 0
  breakdown.achievements = hasAchievement ? 5 : 0
  score += breakdown.achievements
  if (!hasAchievement) {
    missingSteps.push({ key: 'achievements', message: 'Add an achievement or certification.', weight: 5 })
  }

  const percentage = Math.min(Math.max(score, 0), 100)

  // Sort missing steps by highest weight first
  missingSteps.sort((a, b) => b.weight - a.weight)
  const next_step = missingSteps.length > 0 ? missingSteps[0].message : 'Your profile is 100% complete! 🎉'
  const next_action_key = missingSteps.length > 0 ? missingSteps[0].key : null

  return {
    percentage,
    next_step,
    next_action_key,
    breakdown,
  }
}

module.exports = {
  calculateProfileCompletion,
}
