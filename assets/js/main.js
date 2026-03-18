const navToggle = document.querySelector('[data-nav-toggle]');
const nav = document.querySelector('[data-nav]');
if (navToggle && nav) {
  navToggle.addEventListener('click', () => {
    nav.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(nav.classList.contains('open')));
  });
}

document.addEventListener('DOMContentLoaded', function () {
  const animatedGrids = document.querySelectorAll('.service-grid.js-animate-on-scroll');
  if (animatedGrids.length) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          obs.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.2,
      rootMargin: '0px 0px -5% 0px'
    });

    animatedGrids.forEach((grid) => observer.observe(grid));
  }

  initConsentManager();
});

function initConsentManager() {
  const CONSENT_KEY = 'futurecount-cookie-consent-v1';
  const GA_MEASUREMENT_ID = 'G-YWB7X9L58J';
  const defaultConsent = {
    necessary: true,
    analytics: false,
    external: false,
    timestamp: null,
    source: 'default',
    gpcHonored: false
  };

  const gpcEnabled = navigator.globalPrivacyControl === true;
  const savedConsent = readConsent();
  const activeConsent = savedConsent || { ...defaultConsent };

  if (gpcEnabled) {
    activeConsent.analytics = false;
    activeConsent.gpcHonored = true;
    if (!savedConsent) {
      activeConsent.source = 'gpc-default';
    }
  }

  window.futureCountConsent = {
    get: () => ({ ...activeConsent }),
    openPreferences: openPreferences,
    reset: resetConsent
  };
  window.openCookiePreferences = openPreferences;

  buildConsentUi();
  applyConsent(activeConsent);

  if (!savedConsent) {
    openBanner();
  }

  document.querySelectorAll('[data-cookie-preferences]').forEach((trigger) => {
    trigger.addEventListener('click', function (event) {
      event.preventDefault();
      openPreferences();
    });
  });

  document.addEventListener('click', function (event) {
    const trigger = event.target.closest('[data-cookie-preferences]');
    if (!trigger) return;
    event.preventDefault();
    openPreferences();
  });

  function readConsent() {
    try {
      const raw = localStorage.getItem(CONSENT_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return {
        ...defaultConsent,
        ...parsed,
        necessary: true
      };
    } catch (error) {
      return null;
    }
  }

  function persistConsent(consent) {
    const nextConsent = {
      necessary: true,
      analytics: !!consent.analytics,
      external: !!consent.external,
      timestamp: new Date().toISOString(),
      source: consent.source || 'saved',
      gpcHonored: !!gpcEnabled
    };

    localStorage.setItem(CONSENT_KEY, JSON.stringify(nextConsent));
    Object.assign(activeConsent, nextConsent);
    applyConsent(activeConsent);
    closeConsentUi();
  }

  function resetConsent() {
    localStorage.removeItem(CONSENT_KEY);
    location.reload();
  }

  function buildConsentUi() {
    if (document.getElementById('fc-cookie-banner')) return;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
      <div class="fc-cookie-banner" id="fc-cookie-banner" hidden>
        <div class="fc-cookie-banner__content">
          <p class="fc-cookie-banner__eyebrow">Cookie choices</p>
          <h2>We use cookies and similar technologies.</h2>
          <p>Essential technologies keep the site working. Optional analytics help us understand site performance, and external scheduling content can place third-party cookies when loaded. You can accept, reject non-essential technologies, or customize your choices.</p>
          <p class="fc-cookie-banner__status" ${gpcEnabled ? '' : 'hidden'}>Your browser&apos;s Global Privacy Control signal has been honored by disabling analytics by default.</p>
        </div>
        <div class="fc-cookie-banner__actions">
          <button type="button" class="button secondary" data-consent-action="reject">Reject non-essential</button>
          <button type="button" class="button secondary" data-consent-action="customize">Customize</button>
          <button type="button" class="button primary" data-consent-action="accept">Accept all</button>
        </div>
      </div>
      <div class="fc-cookie-modal" id="fc-cookie-modal" hidden aria-hidden="true">
        <div class="fc-cookie-modal__backdrop" data-consent-close></div>
        <div class="fc-cookie-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="fc-cookie-modal-title">
          <div class="fc-cookie-modal__header">
            <p class="fc-cookie-banner__eyebrow">Privacy controls</p>
            <h2 id="fc-cookie-modal-title">Manage cookie preferences</h2>
            <button type="button" class="fc-cookie-modal__close" aria-label="Close cookie preferences" data-consent-close>×</button>
          </div>
          <p class="fc-cookie-modal__intro">You can choose which optional technologies FutureCount may use on this site. Essential technologies are always on because they are required for core site functionality.</p>
          <div class="fc-cookie-option">
            <div>
              <h3>Strictly necessary</h3>
              <p>Required for navigation, security, and saving the choice you make here.</p>
            </div>
            <label class="fc-cookie-switch">
              <input type="checkbox" checked disabled>
              <span>Always active</span>
            </label>
          </div>
          <div class="fc-cookie-option">
            <div>
              <h3>Analytics</h3>
              <p>Google Analytics helps us understand visits and page performance. These technologies remain off until you opt in.</p>
            </div>
            <label class="fc-cookie-switch">
              <input type="checkbox" id="fc-consent-analytics">
              <span>Allow analytics</span>
            </label>
          </div>
          <div class="fc-cookie-option">
            <div>
              <h3>External scheduling content</h3>
              <p>The scheduling widget on the contact page is hosted by SimplyMeet and may place third-party cookies or access similar browser storage when loaded.</p>
            </div>
            <label class="fc-cookie-switch">
              <input type="checkbox" id="fc-consent-external">
              <span>Allow scheduling embed</span>
            </label>
          </div>
          <div class="fc-cookie-modal__note" ${gpcEnabled ? '' : 'hidden'}>Global Privacy Control is enabled in your browser. FutureCount will keep analytics turned off unless you later change that choice here.</div>
          <div class="fc-cookie-modal__actions">
            <button type="button" class="button secondary" data-consent-save="reject">Reject non-essential</button>
            <button type="button" class="button primary" data-consent-save="save">Save choices</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(wrapper);

    document.querySelector('[data-consent-action="accept"]').addEventListener('click', function () {
      persistConsent({ analytics: true, external: true, source: 'banner-accept-all' });
    });

    document.querySelector('[data-consent-action="reject"]').addEventListener('click', function () {
      persistConsent({ analytics: false, external: false, source: 'banner-reject-all' });
    });

    document.querySelector('[data-consent-action="customize"]').addEventListener('click', function () {
      openPreferences();
    });

    document.querySelectorAll('[data-consent-close]').forEach((element) => {
      element.addEventListener('click', closeConsentUi);
    });

    document.querySelector('[data-consent-save="reject"]').addEventListener('click', function () {
      persistConsent({ analytics: false, external: false, source: 'modal-reject-all' });
    });

    document.querySelector('[data-consent-save="save"]').addEventListener('click', function () {
      persistConsent({
        analytics: document.getElementById('fc-consent-analytics').checked,
        external: document.getElementById('fc-consent-external').checked,
        source: 'modal-save'
      });
    });
  }

  function openBanner() {
    const banner = document.getElementById('fc-cookie-banner');
    if (banner) banner.hidden = false;
  }

  function openPreferences() {
    syncModalControls();
    const modal = document.getElementById('fc-cookie-modal');
    if (!modal) return;
    modal.hidden = false;
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('fc-cookie-modal-open');
  }

  function closeConsentUi() {
    const banner = document.getElementById('fc-cookie-banner');
    const modal = document.getElementById('fc-cookie-modal');
    if (banner && activeConsent.timestamp) banner.hidden = true;
    if (modal) {
      modal.hidden = true;
      modal.setAttribute('aria-hidden', 'true');
    }
    document.body.classList.remove('fc-cookie-modal-open');
  }

  function syncModalControls() {
    const analyticsField = document.getElementById('fc-consent-analytics');
    const externalField = document.getElementById('fc-consent-external');
    if (analyticsField) analyticsField.checked = !!activeConsent.analytics && !gpcEnabled;
    if (externalField) externalField.checked = !!activeConsent.external;
    if (analyticsField && gpcEnabled) {
      analyticsField.checked = false;
    }
  }

  function applyConsent(consent) {
    const banner = document.getElementById('fc-cookie-banner');
    if (banner && consent.timestamp) {
      banner.hidden = true;
    }

    if (consent.analytics && !gpcEnabled) {
      enableAnalytics();
    } else {
      disableAnalytics();
    }

    applyExternalEmbeds(consent.external);
  }

  function disableAnalytics() {
    window[`ga-disable-${GA_MEASUREMENT_ID}`] = true;
  }

  function enableAnalytics() {
    if (window.futureCountAnalyticsLoaded) return;
    window[`ga-disable-${GA_MEASUREMENT_ID}`] = false;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function(){ dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA_MEASUREMENT_ID, {
      anonymize_ip: true,
      allow_google_signals: false,
      allow_ad_personalization_signals: false
    });
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(script);
    window.futureCountAnalyticsLoaded = true;
  }

  function applyExternalEmbeds(allowed) {
    document.querySelectorAll('[data-requires-consent="external"]').forEach((frame) => {
      const frameSrc = frame.getAttribute('data-consent-src');
      const placeholder = frame.parentElement.querySelector('.fc-embed-placeholder');
      if (allowed) {
        if (frameSrc && frame.getAttribute('src') !== frameSrc) {
          frame.setAttribute('src', frameSrc);
        }
        frame.hidden = false;
        if (placeholder) placeholder.hidden = true;
      } else {
        frame.setAttribute('src', 'about:blank');
        frame.hidden = true;
        if (placeholder) placeholder.hidden = false;
      }
    });
  }
}
