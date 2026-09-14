import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import FounderGuard from '../../components/auth/FounderGuard';
import ApplicantCard from '../../components/founder/ApplicantCard';
import { api } from '../../api';
import { Sparkles } from 'lucide-react';

const ProjectApplications = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [applicants, setApplicants] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionState, setActionState] = useState(null); // 'ACCEPT', 'REJECT', 'SHORTLIST'
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    const fetchApplicants = async () => {
      try {
        setLoading(true);
        // The token is handled by the HttpOnly cookie in the api.js request,
        // but we might need a dummy token if the api.js requires one.
        const data = await api.getFounderApplicants(projectId, 'dummy-token');
        setApplicants(data);
      } catch (err) {
        console.error('Failed to fetch applicants:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchApplicants();
  }, [projectId]);

  const handleAction = async (action, applicantId) => {
    try {
      setActionState(action);

      // If accepting, trigger welcome animation
      if (action === 'ACCEPT') {
        setShowWelcome(true);
        setTimeout(() => setShowWelcome(false), 2000);
      }

      await api.applicantAction(projectId, applicantId, action, 'dummy-token');

      // Move to next card after a short delay to allow animation
      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
        setActionState(null);
      }, 400);

    } catch (err) {
      console.error(`Failed to perform action ${action}:`, err);
      setActionState(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-indigo-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-900"></div>
      </div>
    );
  }

  if (applicants.length === 0 || currentIndex >= applicants.length) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-indigo-50 p-4 text-center">
        <div className="bg-white p-8 rounded-3xl border-2 border-yellow-400 shadow-xl max-w-md">
          <h2 className="text-2xl font-bold text-indigo-900 mb-4">All Caught Up!</h2>
          <p className="text-gray-600 mb-6">
            You've processed all the applicants for this project. Great work!
          </p>
          <button
            onClick={() => navigate('/founder/projects')}
            className="px-6 py-2 bg-indigo-900 text-white rounded-full font-semibold hover:bg-indigo-800 transition-colors"
          >
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  return (
    <FounderGuard>
      <div className="relative h-screen w-full bg-indigo-50 overflow-hidden flex flex-col items-center justify-center">
        {/* Page Header */}
        <div className="absolute top-8 left-0 right-0 text-center z-10">
          <h1 className="text-3xl font-black text-indigo-900 uppercase tracking-tighter">
            Recruiting Pipeline
          </h1>
          <p className="text-indigo-600 font-medium">
            {applicants.length - currentIndex} applicants remaining
          </p>
        </div>

        {/* Card Stack */}
        <div className="relative w-full max-w-md h-[600px] flex items-center justify-center">
          <AnimatePresence>
            {applicants.slice(currentIndex, currentIndex + 3).map((applicant, i) => {
              return (
                <ApplicantCard
                  key={applicant.id}
                  applicant={applicant}
                  index={i}
                  exitAnimation={i === 0 ? actionState : null}
                  onAction={(action, id) => handleAction(action, id)}
                />
              );
            }).reverse()}
          </AnimatePresence>
        </div>

        {/* Welcome Overlay */}
        <AnimatePresence>
          {showWelcome && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.5 }}
              className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none"
            >
              <div className="bg-white/90 backdrop-blur-sm p-8 rounded-full shadow-2xl border-4 border-yellow-400 flex flex-col items-center gap-4">
                <Sparkles className="text-yellow-500 w-12 h-12 animate-bounce" />
                <h2 className="text-4xl font-black text-indigo-900">WELCOME!</h2>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </FounderGuard>
  );
};

export default ProjectApplications;
