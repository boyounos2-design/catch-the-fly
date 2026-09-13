/* ============================================================================
   CATCH THE FLY — Firebase configuration (optional cloud sync)

   To enable online shared storage:
   1) Go to https://console.firebase.google.com and sign in (Google account).
   2) Add a project (e.g. "catch-the-fly").
   3) Add app -> Web -> copy the firebaseConfig values below.
   4) Firestore Database -> Create database (production mode is fine).
   5) Set Security Rules (see README / docs) so the app can read/write data.
   6) Paste the values below, then commit + push.

   If apiKey is left empty the app runs fully offline (data stays on each
   visitor's own device).
   ========================================================================== */
window.FIREBASE_CONFIG = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};