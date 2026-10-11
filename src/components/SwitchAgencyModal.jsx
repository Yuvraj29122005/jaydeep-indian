import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { AGENCIES, AGENCY_SWITCH_PASSWORD } from '../lib/constants';

export default function SwitchAgencyModal() {
  const {
    agencySwitchModalOpen,
    closeAgencySwitchModal,
    currentAgency,
    switchAgency,
    pendingSwitchAgency,
  } = useApp();

  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [targetId, setTargetId] = useState('aegis');
  const inputRef = useRef(null);

  useEffect(() => {
    if (agencySwitchModalOpen) {
      setPin('');
      setError('');
      setIsSubmitting(false);
      // Determine default target agency
      if (pendingSwitchAgency && pendingSwitchAgency !== currentAgency) {
        setTargetId(pendingSwitchAgency);
      } else {
        setTargetId(currentAgency === 'jaydeep' ? 'aegis' : 'jaydeep');
      }
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 100);
    }
  }, [agencySwitchModalOpen, pendingSwitchAgency, currentAgency]);

  if (!agencySwitchModalOpen) return null;

  const currentAgencyInfo = AGENCIES.find(a => a.id === currentAgency) || AGENCIES[0];
  const targetAgencyInfo = AGENCIES.find(a => a.id === targetId) || AGENCIES[1] || AGENCIES[0];

  const handleDigitPress = (digit) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError('');
      if (nextPin.length === 4) {
        triggerSubmit(nextPin);
      }
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setError('');
  };

  const handleClear = () => {
    setPin('');
    setError('');
  };

  const triggerSubmit = async (pinToTest = pin) => {
    if (pinToTest.length !== 4) {
      setError('Please enter complete 4-digit security PIN');
      return;
    }

    if (pinToTest !== AGENCY_SWITCH_PASSWORD) {
      setError('Incorrect security PIN. Please try again.');
      setPin('');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      await switchAgency(targetId, pinToTest);
      closeAgencySwitchModal();
    } catch (err) {
      setError(err.message || 'Failed to switch agency profile');
      setPin('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key >= '0' && e.key <= '9') {
      e.preventDefault();
      handleDigitPress(e.key);
    } else if (e.key === 'Backspace') {
      e.preventDefault();
      handleBackspace();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closeAgencySwitchModal();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      triggerSubmit();
    }
  };

  return (
    <div className="agency-switch-overlay" onClick={closeAgencySwitchModal}>
      <div 
        className="agency-switch-dialog" 
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        {/* Header */}
        <div className="agency-switch-header">
          <div className="agency-switch-title-wrap">
            <div className="agency-switch-icon-bubble">🔒</div>
            <div>
              <h3 className="agency-switch-title">Switch Agency Profile</h3>
              <p className="agency-switch-sub">Secure multi-agency data partition</p>
            </div>
          </div>
          <button 
            type="button" 
            className="agency-switch-close-btn"
            onClick={closeAgencySwitchModal}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Agency Selection Tabs */}
        <div className="agency-picker-container">
          {AGENCIES.map(agency => {
            const isCurrent = agency.id === currentAgency;
            const isSelectedTarget = agency.id === targetId;
            return (
              <button
                key={agency.id}
                type="button"
                className={`agency-picker-card ${isSelectedTarget ? 'selected' : ''} ${isCurrent ? 'is-active-now' : ''}`}
                onClick={() => {
                  setTargetId(agency.id);
                  setPin('');
                  setError('');
                }}
              >
                <div 
                  className="agency-picker-badge"
                  style={{ background: agency.badgeColor }}
                >
                  {agency.icon}
                </div>
                <div className="agency-picker-info">
                  <div className="agency-picker-name">{agency.name}</div>
                  <div className="agency-picker-tag">
                    {isCurrent ? '● Active Profile' : 'Click to Select'}
                  </div>
                </div>
                {isSelectedTarget && (
                  <span className="agency-picker-check">✓</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Transition Summary Banner */}
        <div className="agency-transition-banner">
          <div className="agency-transition-node">
            <span className="transition-tag">FROM</span>
            <span className="transition-name">{currentAgencyInfo.name.split(' ')[0]} {currentAgencyInfo.icon}</span>
          </div>
          <div className="agency-transition-arrow">➔</div>
          <div className="agency-transition-node target">
            <span className="transition-tag">SWITCH TO</span>
            <span className="transition-name">{targetAgencyInfo.name.split(' ')[0]} {targetAgencyInfo.icon}</span>
          </div>
        </div>

        {/* Security Password Box */}
        <div className="agency-security-box">
          <label className="agency-pin-label">
            Enter 4-Digit Security PIN
          </label>

          {/* Hidden input for physical keyboard focus */}
          <input
            ref={inputRef}
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={pin}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '').slice(0, 4);
              setPin(val);
              setError('');
              if (val.length === 4) triggerSubmit(val);
            }}
            style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
          />

          {/* Visual PIN Dots */}
          <div 
            className={`agency-pin-dots-row ${error ? 'has-error' : ''}`}
            onClick={() => inputRef.current && inputRef.current.focus()}
          >
            {[0, 1, 2, 3].map(idx => (
              <div 
                key={idx} 
                className={`agency-pin-dot ${pin.length > idx ? 'filled' : ''} ${pin.length === idx ? 'active' : ''}`}
              >
                {pin.length > idx ? '●' : ''}
              </div>
            ))}
          </div>

          {error && (
            <div className="agency-pin-error">
              <span>⚠️</span> {error}
            </div>
          )}

          {/* Numeric Touch Keypad */}
          <div className="agency-keypad-grid" style={{ marginTop: 12 }}>
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
              <button
                key={num}
                type="button"
                className="agency-keypad-key"
                onClick={() => handleDigitPress(num)}
                disabled={isSubmitting}
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              className="agency-keypad-key action-clear"
              onClick={handleClear}
              disabled={isSubmitting || pin.length === 0}
              title="Clear"
            >
              CLR
            </button>
            <button
              type="button"
              className="agency-keypad-key"
              onClick={() => handleDigitPress('0')}
              disabled={isSubmitting}
            >
              0
            </button>
            <button
              type="button"
              className="agency-keypad-key action-backspace"
              onClick={handleBackspace}
              disabled={isSubmitting || pin.length === 0}
              title="Backspace"
            >
              ⌫
            </button>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="agency-switch-footer">
          <button
            type="button"
            className="btn-modal-cancel"
            onClick={closeAgencySwitchModal}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-modal-confirm"
            onClick={() => triggerSubmit()}
            disabled={isSubmitting || pin.length !== 4}
            style={{
              background: targetAgencyInfo.themeColor || '#ea580c',
            }}
          >
            {isSubmitting ? (
              <span className="btn-spinner-content">
                <span className="spinner-mini" /> Switching...
              </span>
            ) : (
              `Switch to ${targetAgencyInfo.name.split(' ')[0]} ➔`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
