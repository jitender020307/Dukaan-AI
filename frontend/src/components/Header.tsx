import React, { useState } from 'react';
import { NavTab } from '../types';

interface HeaderProps {
  onOpenMobile: () => void;
  onOpenVoice: () => void;
  onOpenDomain: () => void;
  domainName: string;
  domainConnected: boolean;
  currentLang: 'hi' | 'en';
  onToggleLang: () => void;
  unreadAlertsCount: number;
  onOpenAlerts: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenMobile,
  onOpenVoice,
  onOpenDomain,
  domainName,
  domainConnected,
  currentLang,
  onToggleLang,
  unreadAlertsCount,
  onOpenAlerts,
}) => {
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 lg:left-72 right-0 h-16 bg-white border-b border-[#EAE6DF] shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger */}
        <button
          type="button"
          onClick={onOpenMobile}
          className="p-1.5 rounded-lg text-[#404941] hover:bg-[#F0F5F0] lg:hidden cursor-pointer"
          title="Open Menu"
        >
          <span className="material-symbols-outlined text-[24px]">menu</span>
        </button>

        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-[17px] font-bold text-[#181D1A] leading-tight">
              {currentLang === 'hi' ? 'Aaj ka haal' : "Today's Overview"}
            </span>
            {domainConnected && (
              <button
                type="button"
                onClick={onOpenDomain}
                className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#F0F5F0] hover:bg-[#EBEFEA] border border-[#DFE4DF] text-[11px] font-semibold text-[#14532D] cursor-pointer"
                title="Manage Custom Domain"
              >
                <span className="material-symbols-outlined text-[13px]">language</span>
                <span>{domainName}</span>
              </button>
            )}
          </div>
          <span className="text-[11px] text-[#404941] font-medium">23 October 2026</span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Language selector toggle */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F0F5F0] hover:bg-[#EBEFEA] border border-[#DFE4DF] transition-colors cursor-pointer text-[#181D1A]"
          >
            <span className="material-symbols-outlined text-[18px] text-[#404941]">language</span>
            <span className="text-[13px] font-semibold">{currentLang === 'hi' ? 'हिन्दी' : 'English'}</span>
            <span className="material-symbols-outlined text-[16px] text-[#404941]">arrow_drop_down</span>
          </button>

          {isLangMenuOpen && (
            <div className="absolute right-0 mt-1 w-36 bg-white border border-[#EAE6DF] rounded-lg shadow-lg py-1 z-50">
              <button
                type="button"
                onClick={() => {
                  if (currentLang !== 'hi') onToggleLang();
                  setIsLangMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 text-[13px] font-semibold flex items-center justify-between hover:bg-[#F0F5F0] ${
                  currentLang === 'hi' ? 'text-[#14532D]' : 'text-[#404941]'
                }`}
              >
                <span>हिन्दी (Hindi)</span>
                {currentLang === 'hi' && <span className="material-symbols-outlined text-[16px]">check</span>}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (currentLang !== 'en') onToggleLang();
                  setIsLangMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 text-[13px] font-semibold flex items-center justify-between hover:bg-[#F0F5F0] ${
                  currentLang === 'en' ? 'text-[#14532D]' : 'text-[#404941]'
                }`}
              >
                <span>English</span>
                {currentLang === 'en' && <span className="material-symbols-outlined text-[16px]">check</span>}
              </button>
            </div>
          )}
        </div>

        {/* Primary voice assistant button - NOT pill shaped, clean rounded-lg */}
        <button
          type="button"
          onClick={onOpenVoice}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-[#14532D] text-white rounded-lg text-[14px] font-semibold hover:bg-[#003B1B] transition-colors shadow-sm cursor-pointer"
        >
          <span className="material-symbols-outlined text-[19px]">mic</span>
          <span className="hidden sm:inline">
            {currentLang === 'hi' ? 'Dukaan se poochhein' : 'Ask Dukaan Assistant'}
          </span>
          <span className="sm:hidden">Poochhein</span>
        </button>

        {/* Notifications */}
        <button
          type="button"
          onClick={onOpenAlerts}
          className="relative p-2 rounded-lg hover:bg-[#F0F5F0] text-[#404941] hover:text-[#181D1A] transition-colors cursor-pointer"
          title="Alerts and Stock Notifications"
        >
          <span className="material-symbols-outlined text-[22px]">notifications</span>
          {unreadAlertsCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#BA1A1A]"></span>
          )}
        </button>

        {/* Profile Avatar */}
        <div className="w-8 h-8 rounded-lg bg-[#003B1B] flex items-center justify-center text-white">
          <span className="material-symbols-outlined text-[18px]">person</span>
        </div>
      </div>
    </header>
  );
};
