import React, { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import './GlobalLoadingModal.css';

export default function GlobalLoadingModal() {
  const { 
    globalLoading, 
    globalLoadingMessage, 
    globalLoadingSubtext, 
    hideLoading,
    agencySettings 
  } = useApp();

  // Safety auto-dismiss timeout in case of an uncaught network hanging
  useEffect(() => {
    if (!globalLoading) return;
    const timer = setTimeout(() => {
      if (hideLoading) {
        console.warn('Global loading automatically dismissed after timeout safety threshold.');
        hideLoading();
      }
    }, 25000);
    return () => clearTimeout(timer);
  }, [globalLoading, hideLoading]);

  if (!globalLoading) return null;

  const agencyName = agencySettings?.agencyName || 'JAYDEEP INDIAN GAS';
  const message = globalLoadingMessage || 'Processing your request...';
  const subtext = globalLoadingSubtext || '';

  return (
    <div 
      className="gl-overlay" 
      role="dialog" 
      aria-modal="true" 
      aria-live="assertive"
      id="global-process-loading-modal"
    >
      <div className="gl-card">
        {/* Logo with outer circular waiting spinner */}
        <div className="gl-spinner-wrap">
          {/* Animated Circular Orbit Spinner */}
          <svg className="gl-spinner-svg" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="glSpinnerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="50%" stopColor="#ea580c" />
                <stop offset="100%" stopColor="#dc2626" />
              </linearGradient>
            </defs>
            {/* Background circular track */}
            <circle
              cx="60"
              cy="60"
              r="52"
              stroke="rgba(249, 115, 22, 0.16)"
              strokeWidth="4"
              fill="none"
            />
            {/* Active spinning arc around logo */}
            <circle
              cx="60"
              cy="60"
              r="52"
              stroke="url(#glSpinnerGradient)"
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeDasharray="180 145"
              fill="none"
            />
          </svg>

          {/* Secondary Orbiting Satellite Light */}
          <div className="gl-orbit-tracker">
            <div className="gl-orbit-dot" />
          </div>

          {/* Central Website Logo */}
          <div className="gl-center-logo" title={agencyName}>
            {/* High-res Indian Gas Flame SVG */}
            <svg 
              className="gl-flame-svg" 
              viewBox="0 0 36 36" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Outer flame */}
              <path 
                d="M18 2C17.2 4.5 14.5 8.2 12.8 11.4C10.5 15.6 10 18.5 10 22C10 26.4 13.6 30 18 30C22.4 30 26 26.4 26 22C26 17.5 22.8 13.5 21 10C20.2 8.5 18.8 4 18 2Z" 
                fill="#ffffff"
                fillOpacity="0.95"
              />
              {/* Inner golden flame core */}
              <path 
                d="M18 9C17.4 11 15.5 13.8 14.4 16.2C13 19 12.5 21 12.5 23.5C12.5 26.5 15 29 18 29C21 29 23.5 26.5 23.5 23.5C23.5 20.2 21.2 17.2 20 14.8C19.5 13.8 18.5 10.5 18 9Z" 
                fill="#fef08a"
              />
              {/* Hot core flame */}
              <path 
                d="M18 16C17.5 17.5 16.5 19.5 16 21C15.2 22.5 15 24 15 25.5C15 27.2 16.3 28.5 18 28.5C19.7 28.5 21 27.2 21 25.5C21 23.8 20.2 22 19.5 20.5C19 19 18.4 17 18 16Z" 
                fill="#f97316"
              />
            </svg>
          </div>
        </div>

        {/* Agency Tagline / Name */}
        <div className="gl-agency-badge">
          {agencyName}
        </div>

        {/* Primary Please Wait Title with wave dots */}
        <div className="gl-title">
          Please Wait
          <span className="gl-dots" aria-hidden="true">
            <span>.</span>
            <span>.</span>
            <span>.</span>
          </span>
        </div>

        {/* Dynamic Process Message */}
        <div className="gl-message">
          {message}
        </div>

        {/* Optional Subtext */}
        {subtext && (
          <div className="gl-subtext">
            {subtext}
          </div>
        )}

        {/* Shimmer Progress Track */}
        <div className="gl-progress-track" aria-hidden="true">
          <div className="gl-progress-bar" />
        </div>

        {/* Footnote / Reassurance */}
        <div className="gl-footer-note">
          <span className="gl-footer-note-icon">⚡</span>
          <span>Please do not close or refresh this page</span>
        </div>
      </div>
    </div>
  );
}
