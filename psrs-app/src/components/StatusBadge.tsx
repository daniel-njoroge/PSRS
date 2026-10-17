import React from 'react';
import type { ApplicationStatus } from '../types';
import { Clock, CheckCircle2, AlertTriangle, XCircle, FileText, Send, CheckCheck } from 'lucide-react';

interface StatusBadgeProps {
  status: ApplicationStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const getBadgeConfig = () => {
    switch (status) {
      case 'Draft':
        return {
          className: 'status-draft',
          label: 'Draft',
          icon: <FileText size={size === 'sm' ? 11 : 13} />,
        };
      case 'Submitted':
        return {
          className: 'status-submitted',
          label: 'Submitted',
          icon: <Send size={size === 'sm' ? 11 : 13} />,
        };
      case 'Under Review':
        return {
          className: 'status-under-review',
          label: 'Under Review',
          icon: <Clock size={size === 'sm' ? 11 : 13} />,
        };
      case 'Action Required':
        return {
          className: 'status-action-required',
          label: 'Action Required',
          icon: <AlertTriangle size={size === 'sm' ? 11 : 13} />,
        };
      case 'Approved':
        return {
          className: 'status-approved',
          label: 'Approved',
          icon: <CheckCircle2 size={size === 'sm' ? 11 : 13} />,
        };
      case 'Completed':
        return {
          className: 'status-completed',
          label: 'Completed',
          icon: <CheckCheck size={size === 'sm' ? 11 : 13} />,
        };
      case 'Rejected':
        return {
          className: 'status-rejected',
          label: 'Rejected',
          icon: <XCircle size={size === 'sm' ? 11 : 13} />,
        };
      default:
        return {
          className: 'status-draft',
          label: status,
          icon: null,
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <span
      className={`status-badge ${config.className}`}
      style={{
        fontSize: size === 'sm' ? '11px' : '12px',
        padding: size === 'sm' ? '2px 6px' : '3px 9px',
      }}
    >
      {config.icon}
      <span>{config.label}</span>
    </span>
  );
};
