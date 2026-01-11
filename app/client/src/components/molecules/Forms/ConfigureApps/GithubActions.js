"use client";
import { ErrorToast, SuccessToast, WarningToast } from "@/components/atoms/toastUtils/Toast";
import { useState } from "react"; // Removed useEffect as we handle logic in the handler now
import { useDispatch } from "react-redux";
import { addApp } from "@/redux/features/apps/appsSlice";

// --- Encryption Helper Functions (Client-Side) ---
async function generateKey() {
  return await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

async function exportKey(key) {
  const exported = await crypto.subtle.exportKey('raw', key);
  return btoa(String.fromCharCode(...new Uint8Array(exported)));
}

async function importKey(base64Key) {
  const keyData = Uint8Array.from(atob(base64Key), c => c.charCodeAt(0));
  return await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM' },
    true,
    ['encrypt', 'decrypt']
  );
}

async function encryptToken(token, key) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encodedToken = new TextEncoder().encode(token);
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encodedToken
  );
  return {
    encryptedToken: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
    iv: btoa(String.fromCharCode(...iv))
  };
}
// --------------------------------------------------

const GithubActions = ({ closeModal }) => {
  const dispatch = useDispatch();
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false); // Local loading state

  const handleConfigure = async (e) => {
    e.preventDefault();
    
    if (!token.trim()) {
      WarningToast("Enter GitHub Token First!");
      return;
    }

    setLoading(true);

    try {
      // 1. Verify Token with GitHub (Client-Side)
      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (!response.ok) {
        throw new Error("Invalid Token. Please check your permissions.");
      }

      const userData = await response.json();

      // 2. Encryption Logic
      let key;
      let keyBase64 = localStorage.getItem("github_encryption_key");

      if (keyBase64) {
        key = await importKey(keyBase64);
      } else {
        key = await generateKey();
        keyBase64 = await exportKey(key);
        localStorage.setItem("github_encryption_key", keyBase64);
      }

      const { encryptedToken, iv } = await encryptToken(token, key);

      // 3. Save to Local Storage (Client-Side Persistence)
      localStorage.setItem("github_token_data", JSON.stringify({
        encryptedToken,
        iv,
        username: userData.login,
        timestamp: new Date().toISOString()
      }));

      // 4. Handle Success
      SuccessToast(`Connected as ${userData.login}`);
      
      // Update Redux state
      dispatch(addApp({ 
        name: "github actions", 
        user: userData.login,
        status: "connected"
      }));
      
      setToken("");
      
      if (closeModal) {
        setTimeout(() => closeModal(), 500);
      }

    } catch (err) {
      console.error(err);
      ErrorToast(err.message || "Configuration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border flex flex-col rounded-md border-gray-500 shadow shadow-blue-500 p-5 sm:p-8 max-w-[450px] sm:py-12">
      <div className="mb-8">
        <p className="text-xl xs:text-2xl font-bold mb-3">GitHub Actions Setup</p>
        <p className="text-sm text-gray-300 mb-2">
          Enter your GitHub Personal Access Token (PAT) to enable workflow monitoring
          and integration with GitHub Actions.
        </p>
        <div className="mt-3 p-3 bg-blue-900/20 border border-blue-700/50 rounded-lg">
          <p className="text-xs text-blue-300 font-semibold mb-1">Required Scopes:</p>
          <ul className="text-xs text-blue-200 list-disc list-inside space-y-1">
            <li>repo (Full control of private repositories)</li>
            <li>workflow (Update GitHub Action workflows)</li>
            <li>read:org (Read organization data)</li>
          </ul>
        </div>
      </div>
      
      {/* Token Input Field */}
      <div className="w-[100%] flex flex-col mb-10">
        <label htmlFor="token" className="my-2 sm:text-lg">
          GitHub Personal Access Token (PAT)
        </label>
        <input
          className="border-2 w-full py-2 px-3 h-12 outline-none bg-transparent rounded-lg border-gray-400 focus:border-purple-600 transition-colors"
          placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
          type="password"
          name="token"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          disabled={loading}
        />
        <p className="text-xs text-gray-400 mt-2">
          Create a token at{" "}
          <a 
            href="https://github.com/settings/tokens/new" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-purple-400 hover:text-purple-300 underline"
          >
            GitHub Settings → Developer settings → Personal access tokens
          </a>
        </p>
      </div>
      
      {/* Configure Button */}
      <button
        className={`py-2 rounded-lg text-lg font-semibold transition-colors ${
          loading 
            ? "bg-gray-600 cursor-not-allowed" 
            : "bg-purple-600 hover:bg-purple-700"
        }`}
        onClick={handleConfigure}
        disabled={loading}
      >
        {loading ? "Verifying..." : "Configure GitHub"}
      </button>
    </div>
  );
};

export default GithubActions;