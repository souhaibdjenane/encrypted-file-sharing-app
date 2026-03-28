# VaultShare 

VaultShare is a high-security, end-to-end encrypted file sharing platform designed for absolute data privacy. It relies on a rigorous cryptographic architecture to ensure that the server never stores or views unencrypted files or the keys required to decode them.
This project focuses on designing and developing a secure web-based file sharing platform that guarantees confidentiality, integrity, and controlled access to shared files. The system ensures that files remain protected throughout their lifecycle, from upload to download.

## Architecture

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

## Security Model

VaultShare follows a strict Zero-Knowledge pattern:
1. **File Encryption:** The source file is encrypted entirely in the browser using a randomly generated 256-bit AES-GCM key inside an isolated Web Worker. 
2. **Metadata Protection:** File names and mime-types are encrypted symmetrically prior to database upload to prevent metadata leakage.
3. **Key Exchange:** The symmetric AES key is encrypted using the file owner's 4096-bit RSA public key, which is natively generated on their device.
5. **Key Recovery:** The private RSA key can be symmetrically exported using PBKDF2 derived from the user's password utilizing 600,000 iterations and a uniquely generated 16-byte salt, preventing brute-force attacks on backup files.
6. **Public Links:** Public files export the raw AES key inside the URL hash (`#key=...`). URL Hash fragments are explicitly withheld by browsers during HTTP requests, guaranteeing the server never observes the secret material.

### Hardened Production Build
- Strict **Content Security Policies** (CSP) blocking external scripts.
- Magic bytes file type validation to prevent malicious payload uploads under forged mime-types.
- PII scrubbing on all Sentry telemetry payloads.

## Objective
The objective of this project is to implement a secure file sharing solution using end-to-end encryption (E2EE). Files are encrypted before being uploaded and can only be decrypted by authorized users. The server never stores files in plaintext format, ensuring that sensitive data remains protected even if the storage system is compromised.

## Technologies Used
- React 19
- TypeScript
- Vite
- React Router v7
- Tailwind CSS (v3.4)
- Zustand (State management)
- Supabase
- Fonts: Sensation, Alyamama(arabic)

## How to Run
It is hosted at: `https://vaultshare-ten.vercel.app/`

## Team Members
- Abdallah Mimoun BENCHEIKH
- Aya SAHRAOUI
- Souhaib DJENANE
- Kawther Ikhlas BOUREGAA
- Sondes GASMI

## Course Information
- Course: Computer Network and Security
- Professor: Dr. Karim Lounis
- Academic Year: 2025 — 2026
