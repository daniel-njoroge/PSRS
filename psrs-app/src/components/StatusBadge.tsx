import React from 'react';
import type { RequestStatus } from '../types';
import { Clock, CheckCheck } from 'lucide-react';

interface StatusBadgeProps {
  status: RequestStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const statusConfig = {
    Pending: { className: 'status-submitted', icon: <Clock size={size === 'sm' ? 11 : 13} /> },
    'In Progress': { className: 'status-under-review', icon: <Clock size={size === 'sm' ? 11 : 13} /> },
    Resolved: { className: 'status-completed', icon: <CheckCheck size={size === 'sm' ? 11 : 13} /> }
  } satisfies Record<RequestStatus, { className: string; icon: React.ReactNode }>;
  const current = statusConfig[status];

  return (
    <span
      className={`status-badge ${current.className}`}
      style={{
        fontSize: size === 'sm' ? '11px' : '12px',
        padding: size === 'sm' ? '2px 6px' : '3px 9px',
      }}
    >
      {current.icon}<span>{status}</span>
    </span>
  );
};
