import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
// ```

// ---

// ## Step 9 — Set Up Google OAuth Credentials

// Before you can test login, you need real Google credentials. Here's how:

// 1. Go to [console.cloud.google.com](https://console.cloud.google.com)
// 2. Create a new project (call it "TaskFlow Dev")
// 3. Go to **APIs & Services → OAuth consent screen** → External → fill in app name "TaskFlow", your email
// 4. Go to **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**
// 5. Application type: **Web application**
// 6. Add Authorized redirect URI: `http://localhost:3001/auth/google/callback`
// 7. Copy the **Client ID** and **Client Secret**

// Update `server/.env`:
// ```
// GOOGLE_CLIENT_ID="your-real-client-id-here"
// GOOGLE_CLIENT_SECRET="your-real-client-secret-here"