const VALID_COURSES = [
  'B-Tech CS & AI',
  'B-Tech CS & DS',
  'B.Design',
  'Bsc Phy',
  'BBA',
]

const COURSE_ALIASES = {
  'b-tech cs & ai': 'B-Tech CS & AI',
  'b.tech cs & ai': 'B-Tech CS & AI',
  'btech cs & ai': 'B-Tech CS & AI',
  'btech cs ai': 'B-Tech CS & AI',
  'cs & ai': 'B-Tech CS & AI',
  'cs and ai': 'B-Tech CS & AI',
  'computer science & ai': 'B-Tech CS & AI',

  'b-tech cs & ds': 'B-Tech CS & DS',
  'b.tech cs & ds': 'B-Tech CS & DS',
  'btech cs & ds': 'B-Tech CS & DS',
  'btech cs ds': 'B-Tech CS & DS',
  'cs & ds': 'B-Tech CS & DS',
  'cs and ds': 'B-Tech CS & DS',
  'computer science & ds': 'B-Tech CS & DS',

  'b.design': 'B.Design',
  'b.des': 'B.Design',
  'bdes': 'B.Design',
  'bdesign': 'B.Design',
  'design': 'B.Design',

  'bsc phy': 'Bsc Phy',
  'bsc. phy': 'Bsc Phy',
  'b.sc phy': 'Bsc Phy',
  'bsc physics': 'Bsc Phy',
  'b.sc physics': 'Bsc Phy',
  'physics': 'Bsc Phy',

  'bba': 'BBA',
  'b.b.a': 'BBA',
  'b.b.a.': 'BBA',
}

function normalizeCourse(raw) {
  if (!raw) return null
  const trimmed = String(raw).trim()
  if (VALID_COURSES.includes(trimmed)) {
    return trimmed
  }
  const lower = trimmed.toLowerCase()
  if (COURSE_ALIASES[lower]) {
    return COURSE_ALIASES[lower]
  }
  return null
}

function isValidCourse(raw) {
  return normalizeCourse(raw) !== null
}

module.exports = {
  VALID_COURSES,
  COURSE_ALIASES,
  normalizeCourse,
  isValidCourse,
}
