export const en = {
  // Common
  appName: 'VaultShare',
  loading: 'Loading...',

  // Header / Nav
  nav: {
    myFiles: 'My Files',
    settings: 'Settings',
    logIn: 'Log in',
    signUp: 'Sign up',
    logOut: 'Log out',
  },

  // Landing
  landing: {
    badge: 'End-to-end encrypted',
    heroTitle1: 'Share files with ',
    heroTitle2: 'zero-knowledge privacy',
    heroDescription: 'Your files are encrypted before they leave your device. Only you and your recipients hold the keys. Not even VaultShare can read your data.',
    getStarted: 'Get Started Free',
    goToDashboard: 'Go to Dashboard →',
    feature1Title: 'Client-Side Encryption',
    feature1Desc: 'Files are encrypted with AES-256-GCM directly in your browser before upload. Your encryption keys never leave your device.',
    feature2Title: 'Secure Sharing',
    feature2Desc: 'Generate time-limited share links. Recipients decrypt files locally with the shared key.',
    feature3Title: 'Zero-Knowledge Architecture',
    feature3Desc: 'Our servers store only encrypted blobs. No metadata logging, no access to plaintext. Your privacy is mathematically guaranteed.',
    statsAes: 'AES-256-GCM',
    statsZk: 'Zero-Knowledge',
    statsClient: '100% Client-Side',
  },

  // Auth
  auth: {
    welcomeBack: 'Welcome back',
    signInSubtitle: 'Sign in to access your encrypted vault',
    email: 'Email address',
    emailPlaceholder: 'you@example.com',
    password: 'Password',
    passwordPlaceholder: '••••••••',
    confirmPassword: 'Confirm password',
    signIn: 'Sign in',
    signingIn: 'Signing in...',
    createAccount: 'Create account',
    creatingAccount: 'Creating account...',
    orContinueWith: 'Or continue with',
    noAccount: "Don't have an account?",
    createOne: 'Create one',
    haveAccount: 'Already have an account?',
    signInLink: 'Sign in',
    createVault: 'Create your vault',
    createVaultSubtitle: 'Start sharing files with end-to-end encryption',
  },

  // Dashboard
  dashboard: {
    welcomeBack: 'Welcome back',
    subtitle: 'Your files are end-to-end encrypted. Only you can see them.',
    upload: 'Upload',
    yourFiles: 'Your Files',
    filesEncrypted: '{count} file(s) encrypted',
  },

  // File Uploader
  uploader: {
    dropHere: 'Drop file here',
    dragOrClick: 'Drag & drop a file, or click to browse',
    encrypted: 'Files are end-to-end encrypted before upload',
    encryptUpload: 'Encrypt & Upload',
    encrypting: 'Encrypting...',
    uploading: 'Uploading...',
    saving: 'Saving...',
    done: 'Done ✓',
    failed: 'Failed',
    tryAgain: 'Try again',
  },

  // File Card
  file: {
    encryptedFile: 'Encrypted File',
    expires: 'Expires',
    downloads: 'downloads',
    download: 'Download',
    preparing: 'Preparing...',
    downloading: 'Downloading...',
    decrypting: 'Decrypting...',
    retry: 'Retry',
    share: 'Share',
    delete: 'Delete',
    deleting: 'Deleting...',
  },

  // File List
  fileList: {
    noFiles: 'No files yet',
    noFilesDesc: 'Upload your first file to get started. All files are encrypted before leaving your device.',
    loadError: 'Failed to load files. Please try refreshing.',
  },

  // Settings
  settings: {
    title: 'Security Settings',
    subtitle: 'Manage your encryption keys and account data.',
    encryptionKeys: 'Encryption Keys',
    keysActive: 'Keys Generated and Active',
    keysNotFound: 'Keys Not Found',
    fingerprint: 'Key Fingerprint (SHA-256)',
    exportKey: 'Export Recovery Key',
    exportDesc: 'Download an encrypted backup of your private key. If you clear your browser data or switch devices, you will need this file.',
    backupPassword: 'Set a backup password',
    downloadBackup: 'Download Backup',
    restoreKeys: 'Restore Keys',
    restoreDesc: 'Import your private key backup file to regain access to your encrypted files on a new device.',
    enterBackupPassword: 'Enter backup password',
    selectBackupFile: 'Select Backup File',
    dangerZone: 'Danger Zone',
    dangerDesc: 'Irreversible actions that will permanently destroy your data.',
    deleteAllFiles: 'Delete All Files',
    deleteAllDesc: 'Permanently remove all your encrypted files from the database and storage.',
    deleteAll: 'Delete All',
    language: 'Language',
    languageDesc: 'Choose your preferred display language.',
  },

  // Share Modal
  share: {
    publicLink: 'Public Link Access',
    publicLinkDesc: 'Anyone with the link can download this file.',
    generateLink: 'Generate Public Link',
    generatingLink: 'Generating...',
    copyLink: 'Copy',
    expiration: 'Expiration (Optional)',
    activeLinks: 'Active Public Links',
    noLinks: 'No public links generated yet.',
    canDownload: 'Can Download',
    viewOnly: 'View Only',
    revoke: 'Revoke',
    revoked: 'Revoked',
  },

  // Public Share Page
  publicShare: {
    decryptingConnection: 'Decrypting connection...',
    linkUnavailable: 'Link Unavailable',
    decryptDownload: 'Decrypt & Download',
    decryptingProgress: 'Decrypting ({progress}%)',
    footerNote: 'Decryption happens entirely in your browser. VaultShare cannot read this file.',
    e2ee: 'E2EE',
  },
} as const

// Recursively map all leaf values to string
type DeepString<T> = {
  [K in keyof T]: T[K] extends object ? DeepString<T[K]> : string
}

export type TranslationKeys = DeepString<typeof en>

