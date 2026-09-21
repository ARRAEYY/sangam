import React from 'react';
import { Link } from 'react-router-dom';
import { Zap } from 'lucide-react';

export function ProjectNavigation({ projectId, isLead }) {
  if (!isLead) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-900 rounded-lg border border-indigo-100 font-bold text-xs transition-colors hover:bg-indigo-100">
      <Zap size={14} className="text-yellow-500 fill-yellow-500" />
      <Link
        to={`/founder/projects/${projectId}/overview`}
        className="hover:underline"
      >
        Founder Console
      </Link>
    </div>
  );
}
