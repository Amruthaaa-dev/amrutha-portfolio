/* ============================================================================
   SITE CONFIG — single source of truth for contact details & links
   ----------------------------------------------------------------------------
   ▶ EDIT THIS FILE ONLY. Every email/phone/social link on the page is wired
     from here, so you never have to hunt through the HTML.
   ▶ Values marked TODO are placeholders — replace them with the real ones.
   ========================================================================== */

const SITE_CONFIG = {
  name: 'Amrutha Haridas',
  role: 'Software Engineer | Full Stack PHP Developer',
  location: 'Kerala, India',

  /* ── Verified contact details ──────────────────────────────────────────── */
  email: 'amruthaalayattil@gmail.com',
  phone: '+91 99468 65197',

  /* NOTE: the https:// scheme is required on these. Without it the browser
     treats the value as a relative path and the link resolves to a file on
     this site instead of the external profile. */
  linkedin:  'https://www.linkedin.com/in/amrutha-haridas-71533a257/',
  github:    'https://github.com/Amruthaaa-dev',
  instagram: 'https://www.instagram.com/amrutha_______haridas',

  /* Short handles shown as the visible label on the contact cards */
  linkedinHandle:  'linkedin.com/in/amrutha-haridas-71533a257',
  githubHandle:    'github.com/Amruthaaa-dev',
  instagramHandle: '@amrutha_______haridas',

  /* Typed.js rotating headline strings */
  typedStrings: [
    'Software Engineer',
    'Full Stack PHP Developer',
    'Laravel Specialist',
    'Shopify Developer',
    'REST API Engineer',
    'ERP Systems Builder'
  ],

  /* Subject line pre-filled on the mailto: contact links */
  mailSubject: 'Project enquiry — via portfolio',

  /* ── CONTACT FORM DELIVERY ───────────────────────────────────────────────
     When a visitor submits the form, their name / email / subject / message
     are emailed to the inbox below. No server or backend is involved — the
     browser posts straight to a form-relay service.

     Three delivery paths, tried in this order:

       1. web3formsKey  — used if set (needs a free key, see below)
       2. formsubmitTo  — used otherwise. NO KEY NEEDED. ← active by default
       3. mailto:       — last resort if both are empty

     ▶ ONE-TIME ACTIVATION REQUIRED for path 2:
       The very first time anyone submits the form, FormSubmit sends a
       "Confirm your email" message to the address below. Open it and click
       the confirmation link. From then on every submission is delivered
       automatically. Send yourself one test message to trigger this.

     ▶ Optional privacy upgrade:
       Putting a raw address here means spam bots scraping the page can read
       it. After activating, FormSubmit gives you a random alias that looks
       like "a1b2c3d4e5f6". Paste that here instead of the email address —
       it works identically but hides the address from scrapers.
     ──────────────────────────────────────────────────────────────────────── */
  formsubmitTo: 'amruthaalayattil@gmail.com',

  /* Optional alternative relay. If you would rather use Web3Forms, get a free
     key at https://web3forms.com and paste it here — it then takes priority
     over formsubmitTo above. */
  web3formsKey: ''
};

/**
 * Wire config values into the DOM.
 *  [data-config="email|mailto|phone|tel|linkedin|github|instagram"] → href
 *  [data-config-text="email|phone|…"]                              → text content
 */
function applySiteConfig() {
  const hrefMap = {
    email:     `mailto:${SITE_CONFIG.email}?subject=${encodeURIComponent(SITE_CONFIG.mailSubject)}`,
    mailto:    `mailto:${SITE_CONFIG.email}?subject=${encodeURIComponent(SITE_CONFIG.mailSubject)}`,
    phone:     `tel:${SITE_CONFIG.phone.replace(/[^\d+]/g, '')}`,
    tel:       `tel:${SITE_CONFIG.phone.replace(/[^\d+]/g, '')}`,
    linkedin:  SITE_CONFIG.linkedin,
    github:    SITE_CONFIG.github,
    instagram: SITE_CONFIG.instagram
  };

  document.querySelectorAll('[data-config]').forEach((el) => {
    const href = hrefMap[el.dataset.config];
    if (href) el.setAttribute('href', href);
  });

  document.querySelectorAll('[data-config-text]').forEach((el) => {
    const value = SITE_CONFIG[el.dataset.configText];
    if (value) el.textContent = value;
  });
}

/* Run as early as possible so links are live before first interaction */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', applySiteConfig, { once: true });
} else {
  applySiteConfig();
}
