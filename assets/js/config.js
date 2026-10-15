/* ==========================================================================
   WHITE_DUST — indstillinger for hjemmesiden
   Download-knapperne peger på den NYESTE GitHub Release i spil-repoet.
   Releasen laves automatisk af GitHub Actions, når du pusher et "v…"-tag (fx v1.0.1)
   (se .github/workflows/desktop.yml i spil-mappen).
   Spillet findes kun som download – der er ingen browser-udgave.
   ========================================================================== */
window.WD_CONFIG = {
  repo: "linbatkivi/white_dust",                     // GitHub-repo med releases
  appVersion: "v1.0.0",                              // spillets version (vises på siden)

  downloads: {
    windows: { file: "WhiteDust-Setup.exe",      size: "650 MB", req: "Windows 10 / 11 · 64-bit" },
    mac:     { file: "WhiteDust-macOS.dmg",      size: "790 MB", req: "macOS 11+ · Apple Silicon & Intel" },
    linux:   { file: "WhiteDust-Linux.AppImage", size: "660 MB", req: "64-bit · de fleste distroer" }
  }
};
