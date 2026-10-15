# WHITE_DUST — hjemmeside

Statisk hjemmeside (HTML/CSS/JS, ingen build-step) til GitHub Pages.

- `index.html` — forside
- `downloads.html` — downloads
- `assets/js/config.js` — repo, version og filnavne (ret her)

## Sådan hænger det sammen

```
Spillet           →  ligger HELT inde i desktop-appen (Electron)            (~/Projekter/wd/desktop/)
Multiplayer       →  værten kører serveren i sin egen app; vennerne forbinder direkte (peer-to-peer)
                     ingen server i skyen, intet dataloft, gratis
App-filerne       →  bygges af GitHub Actions og lægges på en Release       (wd/.github/workflows/desktop.yml)
Opdateringer      →  ved start henter appen game/manifest.json fra DENNE side og kun de ændrede filer
                     (udgiv med  node scripts/game-update.js --publish  i spil-mappen – ingen ny app)
App-skallen       →  sjældent: ny Release via v…-tag (electron-updater)
Hjemmesiden       →  GitHub Pages, linker til den nyeste Release            (denne mappe)
```

## 1 · Udgiv spillet (i spil-mappen `~/Projekter/wd`)

```bash
cd ~/Projekter/wd
git add -A
git commit -m "White Dust som desktop-app med peer-to-peer"
git push
git tag v1.0.0
git push origin v1.0.0
```

Gå til github.com/linbatkivi/white_dust → **Actions** og se den bygge (~15 min).
Når den er færdig, ligger `.exe`, `.dmg` og `.AppImage` under **Releases** — og download-knapperne virker.

Næste version: ret `"version"` i `desktop/package.json` (fx `1.0.1`), commit, push og `git tag v1.0.1`.
Tagget skal passe med versionen, ellers stopper bygget.

## 2 · Læg hjemmesiden ud

1. Opret et nyt **public** repo på GitHub, fx `white-dust-web`.
2. Push indholdet af denne mappe til det.
3. Repo → **Settings → Pages** → Source: *Deploy from a branch* → `main` / `(root)` → Save.
4. Efter et minut ligger siden på `https://linbatkivi.github.io/white-dust-web/`.

## Test appen lokalt

```bash
cd ~/Projekter/wd/desktop
npm install
npm start
```

(Vært + ven på én computer: kør også `WD_PROFILE=ven npm start` i et andet terminalvindue.)
