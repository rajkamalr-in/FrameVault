import React from 'react';
import trizenLogoImg from '../assets/trizen-logo.png';

export default function TrizenLogo({ className = "w-9 h-9", showText = true, textClassName = "text-gray-900" }) {
  return (
    <div className="flex items-center gap-2.5 group cursor-pointer">
      <img
        src={trizenLogoImg}
        alt="FrameVault Logo"
        className={`${className} object-contain transition-transform duration-300 group-hover:scale-105`}
      />

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-0.5">
            <span className={`font-extrabold text-lg tracking-tight ${textClassName}`}>Frame</span>
            <span className="font-extrabold text-lg tracking-tight text-indigo-600">Vault</span>
          </div>
          <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest -mt-1">
            Studio Platform
          </span>
        </div>
      )}
    </div>
  );
}
