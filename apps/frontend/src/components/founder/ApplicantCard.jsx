import React from 'react';
import { motion } from 'framer-motion';
import { Check, X, Bookmark } from 'lucide-react';

const ApplicantCard = ({ applicant, onAction, index, exitAnimation }) => {
  if (!applicant) return null;

  // Animation variants for the card slide
  const variants = {
    initial: { x: 0, y: 0, rotate: 0, opacity: 1, scale: 1 },
    exitAccept: { x: 500, rotate: 20, opacity: 0, scale: 0.8, transition: { duration: 0.4 } },
    exitReject: { x: -500, rotate: -20, opacity: 0, scale: 0.8, transition: { duration: 0.4 } },
    exitShortlist: { y: -500, rotate: 0, opacity: 0, scale: 0.8, transition: { duration: 0.4 } },
  };

  const handleDragEnd = (event, info) => {
    const { x, y } = info.offset;

    // Thresholds for swiping
    const THRESHOLD = 150;

    if (x > THRESHOLD) {
      onAction('ACCEPT', applicant.id);
    } else if (x < -THRESHOLD) {
      onAction('REJECT', applicant.id);
    } else if (y < -THRESHOLD) {
      onAction('SHORTLIST', applicant.id);
    }
  };

  return (
    <motion.div
      className="absolute w-full max-w-md aspect-[3/4] bg-indigo-50 border-2 border-yellow-400 rounded-3xl shadow-xl overflow-hidden cursor-grab active:cursor-grabbing select-none"
      variants={variants}
      initial="initial"
      animate={exitAnimation ? `exit${exitAnimation}` : "initial"}
      style={{ zIndex: 100 - index }}
      drag
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      onDragEnd={handleDragEnd}
      whileDrag={{ scale: 1.05, rotate: (info) => info.offset.x / 20 }}
    >
      <div className="h-full flex flex-col">
        {/* Header / Image Section */}
        <div className="relative h-1/2 w-full bg-indigo-100">
          <img
            src={applicant.avatar || 'https://via.placeholder.com/150'}
            alt={applicant.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-indigo-900/80 to-transparent p-4">
            <h3 className="text-2xl font-bold text-white">{applicant.name}</h3>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6 flex-1 flex flex-col gap-4 overflow-y-auto">
          {/* Skill Badges */}
          <div className="flex flex-wrap gap-2">
            {applicant.matchedSkills?.map((skill, i) => (
              <span
                key={i}
                className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full border border-green-200"
              >
                {skill}
              </span>
            ))}
          </div>

          {/* Application Message */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-indigo-900 uppercase tracking-wider">Application</p>
            <p className="text-sm text-gray-700 italic leading-relaxed">
              "{applicant.message}"
            </p>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-indigo-900 uppercase tracking-wider">About</p>
            <p className="text-sm text-gray-600 leading-relaxed">
              {applicant.bio}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-white border-t border-indigo-100 flex justify-between items-center gap-4">
          <button
            onClick={() => onAction('REJECT', applicant.id)}
            className="p-4 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
            aria-label="Reject"
          >
            <X size={24} />
          </button>
          <button
            onClick={() => onAction('SHORTLIST', applicant.id)}
            className="p-4 rounded-full bg-yellow-100 text-yellow-700 hover:bg-yellow-200 transition-colors"
            aria-label="Shortlist"
          >
            <Bookmark size={24} />
          </button>
          <button
            onClick={() => onAction('ACCEPT', applicant.id)}
            className="p-4 rounded-full bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
            aria-label="Accept"
          >
            <Check size={24} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ApplicantCard;
