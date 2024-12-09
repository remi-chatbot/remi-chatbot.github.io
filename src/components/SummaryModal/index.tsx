import React from 'react';
import { X } from 'react-feather';
import './styles.scss';

interface SummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: string;
}

export const SummaryModal: React.FC<SummaryModalProps> = ({ isOpen, onClose, summary }) => {
  if (!isOpen) return null;

  return (
    <div className="summary-modal-overlay" onClick={onClose}>
      <div className="summary-modal" onClick={e => e.stopPropagation()}>
        <div className="summary-modal-header">
          <h2>Conversation Summary</h2>
          <button className="close-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="summary-modal-content">
          <p>{summary}</p>
        </div>
      </div>
    </div>
  );
}; 