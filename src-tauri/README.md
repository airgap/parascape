# Parascape desktop (Tauri + Parabun)

A self-contained desktop build of the whole Parascape site — no public hosting,
no login. The app is a thin **Tauri** shell that launches the **Parabun** runtime
as a sidecar; that one process serves the built site **and** the `/api` over a
local **SQLite** file, all in single-user **guest mode** (the account UI is
hidden). Nothing is exposed publicly.

```
Tauri window ──▶ http://localhost:8788  ◀── parabun sidecar
                                              ├─ serves dist/ (the site)
                                              ├─ /api  (guest, no auth)
                                              └─ SQLite in the app data dir
```

## Build

Prereqs (already present on this machine): Rust/cargo, a `parabun` binary on
`PATH` (or set `PARABUN_BIN`), and the platform webview (Linux: `webkit2gtk-4.1`).

```sh
bun run tauri:build      # → src-tauri/target/release/bundle/** (.deb/.AppImage/.app/.msi)
bun run tauri:dev        # run it locally (needs a display)
```

`tauri:prep` (run automatically) builds `dist/` and stages the Parabun binary as
the Tauri sidecar at `src-tauri/binaries/parabun-<target-triple>`. Both are
gitignored; the build regenerates them.

## How guest mode works

The same codebase is the public web build *and* the desktop build — the
difference is one env flag the desktop sidecar sets:

- **`PARASCAPE_GUEST=1`** — the account server bypasses auth: every request is the
  built-in `guest` user, `/api/me` returns the guest with no token, and the
  Designer hides the Sign in / account UI and persists silently.
- **`PARASCAPE_DIST=<dist>`** — the server also serves the built site, so it's the
  whole app in one process.
- **`PARASCAPE_DB=<path>`** — the SQLite file (the desktop app uses the OS app-data
  dir).

Run that combination yourself without Tauri:

```sh
PARASCAPE_GUEST=1 PARASCAPE_DIST=dist PARASCAPE_DB=/tmp/parascape.sqlite \
  PARASCAPE_ACCOUNT_PORT=8788 bun server/account-server.ts
# → open http://localhost:8788
```

The public web build leaves these unset: Vite serves the site, the account server
runs multi-user with login (see ../server/README.md).

## CI

`../jenkins/Jenkinsfile` builds the desktop bundles on every push (Jenkins, same
controller as Lyku/ParaBun):

- **Linux** — natively on this machine (the `linux` agent already has Rust,
  parabun, and webkit2gtk-4.1): `jenkins/build-linux.sh` → `.deb`/`.rpm`/`.AppImage`.
- **macOS** — rsync the tree to the `mac-mini` SSH alias and run
  `jenkins/build-macos.sh` there; it installs parabun, builds `--bundles app`,
  and makes the `.dmg` by hand (Tauri's DMG bundler needs a GUI/AppleScript and
  fails over headless SSH). The `.dmg` is rsynced back.

It is **build-only**: both branches `archiveArtifacts` the installers and that's
it — no R2 upload, no GitHub release, no registry push. Parascape is not public,
so CI just proves the bundles build on both platforms; releasing waits on
approval.
