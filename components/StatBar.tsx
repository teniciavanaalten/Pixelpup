
import React from 'react';

interface StatBarProps {
  label: string;
  value: number;
  color: string;
  icon: string;
}

const StatBar: React.FC<StatBarProps> = ({ label, value, color, icon }) => {
  return (
    <div className="flex flex-col gap-1 w-full">
      <div className="flex justify-between items-center text-[10px] font-black text-rose-900/40 uppercase">
        <span className="flex items-center gap-1">
          <i className={`${icon} text-rose-400`}></i> {label}
        </span>
        <span>{Math.round(value)}%</span>
      </div>
      <div className="w-full h-3 bg-white/50 rounded-full overflow-hidden border-2 border-rose-200">
        <div
          className={`h-full ${color} transition-all duration-500 ease-out`}
          style={{ width: `${value}%` }}
        ></div>
      </div>
    </div>
  );
};

export default StatBar;
