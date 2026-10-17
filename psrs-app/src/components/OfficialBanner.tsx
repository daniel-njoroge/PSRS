import React from 'react';
import { NationalEmblem } from './NationalEmblem';

export const OfficialBanner: React.FC = () => {
  return (
    <div>
      {/* Kenya Tricolor Bar */}
      <div className="kenya-tricolor-bar" aria-hidden="true">
        <div className="bar-black"></div>
        <div className="bar-white-1"></div>
        <div className="bar-red"></div>
        <div className="bar-white-2"></div>
        <div className="bar-green"></div>
      </div>
    </div>
  );
};
