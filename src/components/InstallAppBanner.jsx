import React, { useState, useEffect } from 'react';
import './InstallAppBanner.css';

// Global reference so any button anywhere can trigger the PWA install
let deferredInstallPrompt = null;
const installListeners = new Set();

export function promptAppInstall() {
  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    deferredInstallPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted PWA installation');
      }
      deferredInstallPrompt = null;
      notifyInstallListeners();
    });
  } else {
    // Show instruction modal or toast for iOS / manual install
    window.dispatchEvent(new CustomEvent('show-install-guide'));
  }
}

function notifyInstallListeners() {
  installListeners.forEach(listener => listener(deferredInstallPrompt));
}

export default function InstallAppBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // Check if already running in standalone / installed PWA mode
    const isApp = window.matchMedia('(display-mode: standalone)').matches ||
                  window.navigator.standalone === true ||
                  document.referrer.includes('android-app://');
    setIsStandalone(isApp);

    if (isApp) {
      return; // Already installed as an app, don't show prompt
    }

    // Detect iOS devices
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleMobile = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isAppleMobile);

    // Listen for Chrome/Android/Edge beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      deferredInstallPrompt = e;
      notifyInstallListeners();
      // Quick popup notification when someone opens the website!
      const dismissed = sessionStorage.getItem('jig_install_dismissed');
      if (!dismissed) {
        setTimeout(() => setShowBanner(true), 600);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // If on mobile and beforeinstallprompt doesn't fire immediately (e.g. iOS or already cached),
    // still show quick notification banner after 800ms
    const timer = setTimeout(() => {
      const dismissed = sessionStorage.getItem('jig_install_dismissed');
      if (!dismissed && !isApp) {
        setShowBanner(true);
      }
    }, 800);

    const handleCustomShow = () => {
      setShowBanner(true);
      if (isAppleMobile) {
        setShowIOSGuide(true);
      }
    };
    window.addEventListener('show-install-guide', handleCustomShow);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('show-install-guide', handleCustomShow);
      clearTimeout(timer);
    };
  }, []);

  const handleInstallClick = () => {
    if (deferredInstallPrompt) {
      promptAppInstall();
      setShowBanner(false);
    } else if (isIOS) {
      setShowIOSGuide(true);
    } else {
      // In case browser does not support deferred prompt, give clear feedback
      alert('To install: open your browser menu (⋮ or Share) and tap "Install app" or "Add to Home Screen".');
      setShowBanner(false);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setShowIOSGuide(false);
    try {
      sessionStorage.setItem('jig_install_dismissed', 'true');
    } catch (_e) {}
  };

  if (isStandalone || !showBanner) return null;

  return (
    <>
      {/* Quick floating notification banner */}
      <div className="install-banner-overlay" role="alert" aria-live="polite">
        <div className="install-banner-card">
          <div className="install-banner-header">
            <div className="install-banner-app-icon">🔥</div>
            <div className="install-banner-info">
              <div className="install-banner-tag">OFFICIAL WEB APP</div>
              <h4 className="install-banner-title">Install Jaydeep Gas App</h4>
              <p className="install-banner-desc">
                Fast 1-tap cylinder billing, stock ledger & offline access directly from your phone!
              </p>
            </div>
            <button 
              className="install-banner-close-btn" 
              onClick={handleDismiss}
              aria-label="Close notification"
            >
              ✕
            </button>
          </div>

          <div className="install-banner-actions">
            <button 
              className="install-banner-btn-install" 
              onClick={handleInstallClick}
            >
              <span className="install-btn-icon">📲</span>
              <span>Install App Now</span>
            </button>
            <button 
              className="install-banner-btn-later" 
              onClick={handleDismiss}
            >
              Not Now
            </button>
          </div>

          {/* Quick iOS specific helper */}
          {isIOS && showIOSGuide && (
            <div className="install-banner-ios-guide">
              <div className="ios-guide-title">🍎 Quick iPhone / iPad Install:</div>
              <ol className="ios-guide-steps">
                <li>Tap the <strong>Share</strong> button <span className="ios-icon">⎋</span> at bottom of Safari</li>
                <li>Scroll down and tap <strong>Add to Home Screen</strong> <span className="ios-icon">⊞</span></li>
                <li>Tap <strong>Add</strong> on the top right</li>
              </ol>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
