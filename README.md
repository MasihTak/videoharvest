<div align="center">
  <img src="public/logo.png" alt="VideoHarvest logo" width="140" />

  # VideoHarvest

  A modern, cross-platform desktop application for downloading videos and playlists using yt-dlp — without touching the command line!

  ![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20Linux%20%7C%20macOS-blue)

</div>

---

## Overview

VideoHarvest is built with **Tauri 2**, **Vue 3**, **Bootstrap 5**, **SCSS**, and **Rust**. **yt-dlp** and **FFmpeg** are downloaded automatically on first launch, so you can start downloading content right after installation, with no manual setup required.

## Features

### Smart URL Detection

Paste a URL and VideoHarvest automatically:

- Validates the URL
- Detects the platform
- Detects video or playlist content
- Fetches metadata (thumbnail, title, duration, channel)

### Multiple Download Formats

**Video** — Best Quality, 4K MP4, 1080p MP4, 720p MP4

**Audio** — MP3, M4A, WAV

- Download video only, audio only, or merged formats
- Save preferred formats as defaults

### Playlist Support

- Entire playlists
- Custom ranges
- Selected videos

### Download Queue

Track downloads through their full lifecycle: Pending, Scheduled, Downloading, Completed, Failed, Cancelled.

Supported actions: Cancel, Retry, Remove — plus bulk "retry all failed" and "clear completed".

### Download Scheduler

Schedule a download for a specific date and time, or use the saved default time (today if it hasn't passed, otherwise tomorrow). Each schedule runs once, with native desktop notifications when it does.

### Download History & Logs

- Full history of previous downloads and their status
- Detailed logs: information, warnings, errors, and successful downloads

### Privacy First

- No account required
- No cloud dependency
- Fully local operation
- Open source

## Why VideoHarvest?

Most video downloaders either require command-line knowledge, depend on online services, include ads or tracking, or require manual yt-dlp installation.

VideoHarvest focuses on:

- Simplicity
- Reliability
- Performance
- Privacy
- Open-source transparency


## Installation

### Download Latest Release

Download the latest version from the [Releases](../../releases) page.

Supported packages:

- Windows (`.exe`)
- Linux (`.AppImage`, `.deb`)
- macOS (`.dmg`)

### Development Setup

**Requirements**

- Node.js 24.16+
- pnpm 11+
- Rust (stable)
- Tauri 2

**Clone the repository**

```bash
git clone https://github.com/MasihTak/videoharvest.git
cd videoharvest
```

**Install dependencies**

```bash
pnpm install
```

**Start development**

```bash
pnpm tauri dev
```

**Build the application**

```bash
pnpm tauri build
```

**Checks**

```bash
pnpm lint          # ESLint
pnpm test          # Vitest
```
---

## Sponsors ❤

Thanks to those supporting this project:

| [<img src="public/jetbrains.svg" alt="JetBrains" width="70" />](https://www.jetbrains.com/?from=MasihTak) | [<img src="public/bitdefender-seeklogo.svg" alt="BitDefender" width="70" />](https://www.bitdefender.com/?from=MasihTak) | [<img src="public/Mery.svg" alt="Mery" width="70" />](https://www.fashionmery.com/?from=MasihTak) |
|:---------------------------------------------------------------------------------------------------------:|:------------------------------------------------------------------------------------------------------------------------:|:-------------------------------------------------------------------------------------------------:|

## Contributing

Contributions are welcome.

Please read:

- [CONTRIBUTING.md](CONTRIBUTING.md)
- [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)

Before opening a pull request.


## License

This project is licensed under the MIT License.

See [LICENSE](LICENSE) for details.

## Disclaimer

VideoHarvest is a graphical interface for yt-dlp. Users are responsible for complying with the Terms of Service and copyright laws applicable in their jurisdiction. The developers of VideoHarvest do not encourage or support copyright infringement.
