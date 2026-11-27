# Windows desktop installer

The Windows setup EXE is built with:

```powershell
npm install
npm run build:win
```

The installer is written to `release/squirrel-installer/`. On first launch, enter the hosted MongoDB connection URI and the initial admin account. Allow the computer's IP address in the MongoDB provider's network access list. Existing admin accounts and passwords in a database are not changed by setup.

Connection settings and the generated JWT secret are stored outside the installation, encrypted using Windows secure storage for the current Windows user. They are not included in the installer. The backend listens only on `127.0.0.1`, serves the frontend and API locally, and restarts with increasing delays if it exits or becomes unhealthy. Backend lifecycle details are written to the app's user-data `backend.log`.

The installer is unsigned unless a trusted Authenticode certificate is configured. Windows Smart App Control may warn about or block an unsigned installer; changing app code cannot override that policy. A trusted code-signing certificate is required for a verified publisher identity.
