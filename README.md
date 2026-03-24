# VaultShare 🔐

VaultShare is a high-security, end-to-end encrypted file sharing platform designed for absolute data privacy. It relies on a rigorous cryptographic architecture to ensure that the server never stores or views unencrypted files or the keys required to decode them.

## 🏗️ Architecture

VaultShare utilizes a hybrid cryptography model (RSA-OAEP for asymmetric key exchange, AES-256-GCM for rapid symmetric file encryption).

The Web Worker architecture ensures UI fluidity when encrypting massive files off the main browser thread. 

```text
                        ┌───────────────────┐
                        │   User Browser    │
                        │ (WebCrypto API)   │
                        └────────┬──────────┘
                                 │
     ┌───────────────────────────┴───────────────────────────┐
     │                                                       │
 ┌───▼───┐                                               ┌───▼───┐
 │Vercel │ (Static Frontend)                             │ API   │ (Supabase)
 └───────┘                                               └───────┘
     │                                                       │
     └───────────────────────────────────────────────────────┤
                                                             │
                  ┌────────────────────┐          ┌──────────▼──────────┐
                  │ Edge Functions     │          │    PostgreSQL DB    │
                  │ (share-file, etc.) │          │ (RLS, Auth, Data)   │
                  └────────────────────┘          └─────────────────────┘
```

## 🛡️ Security Model

VaultShare follows a strict Zero-Knowledge pattern:
1. **File Encryption:** The source file is encrypted entirely in the browser using a randomly generated 256-bit AES-GCM key inside an isolated Web Worker. 
2. **Metadata Protection:** File names and mime-types are encrypted symmetrically prior to database upload to prevent metadata leakage.
3. **Key Exchange:** The symmetric AES key is encrypted using the file owner's 4096-bit RSA public key, which is natively generated on their device.
4. **Resharing Mechanics:** When a user shares a file with a recipient, their client unwraps the AES file key using their RSA private key, limits access via Edge Functions conditionally, and re-wraps the AES key using the *recipient's* RSA public key.
5. **Key Recovery:** The private RSA key can be symmetrically exported using PBKDF2 derived from the user's password utilizing 600,000 iterations and a uniquely generated 16-byte salt, preventing brute-force attacks on backup files.
6. **Public Links:** Public files export the raw AES key inside the URL hash (`#key=...`). URL Hash fragments are explicitly withheld by browsers during HTTP requests, guaranteeing the server never observes the secret material.

### Hardened Production Build
- Strict **Content Security Policies** (CSP) blocking external scripts.
- Magic bytes file type validation to prevent malicious payload uploads under forged mime-types.
- PII scrubbing on all Sentry telemetry payloads.

## 🚀 Environment Variables

Create a `.env` file referencing your Supabase implementation:

| Variable                      | Where used     | Description                          |
|-------------------------------|----------------|--------------------------------------|
| `VITE_SUPABASE_URL`           | Frontend       | Your Supabase project URL            |
| `VITE_SUPABASE_PUBLISHABLE_KEY`| Frontend       | `sb_publishable_...` key (safe to expose) |
| `VITE_SENTRY_DSN`             | Frontend       | Sentry error tracking DSN            |
| `SUPABASE_URL`                | Edge Functions | Auto-injected by Supabase local edge |
| `SUPABASE_SECRET_KEY`         | Edge Functions | `sb_secret_...` key (set manually via secrets)|
| `UPSTASH_REDIS_REST_URL`      | Edge Functions | Upstash rate limiting URL            |
| `UPSTASH_REDIS_REST_TOKEN`    | Edge Functions | Upstash rate limiting token          |
| `ALLOWED_ORIGIN`              | Edge Functions | CORS allowed origin                  |

## 💻 Local Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/vaultshare.git
   cd vaultshare
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Initialize the local Supabase environment:**
   ```bash
   npx supabase start
   ```
4. **Push database migrations to your project via CLI:**
   ```bash
   npx supabase db push
   ```
5. **Run the local development server:**
   ```bash
   npm run dev
   ```

## 🧪 Pre-Launch Security Checklist

- [x] Web Workers are effectively segregating memory.
- [x] IndexedDB securely caches non-extractable asymmetric keypairs internally.
- [x] Rate limiting is enabled via Upstash Redis edge integrations to nullify brute-force key attacks.
- [x] Supabase Row-Level Security validates auth credentials strictly at the table layer.
