/// <reference types="google.maps" />

/**
 * Browser globals the app touches that no package declares: scripts loaded from index.html
 * and the App Check debug switch (mirrors the SDK's own internal declaration).
 */
declare global {
  interface Window {
    /** Google Maps JavaScript API, present once `useLoadScript` has loaded it. */
    google?: typeof google;
    /** Tally embed (index.html): opens the feedback form. */
    Tally?: {
      openPopup(formId: string, options?: { layout?: 'default' | 'modal'; width?: number }): void;
    };
  }

  /** Read by the App Check SDK at init; `true` mints a debug token for this browser profile. */
  var FIREBASE_APPCHECK_DEBUG_TOKEN: boolean | string | undefined;
}

export {};
