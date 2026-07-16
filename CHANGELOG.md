# Changelog

All notable changes to VideoHarvest will be documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
Releases are automated via [Release Please](https://github.com/googleapis/release-please).

## [0.2.0](https://github.com/MasihTak/videoharvest/compare/v0.1.0...v0.2.0) (2026-07-16)


### Features

* add app layout ([7c22604](https://github.com/MasihTak/videoharvest/commit/7c22604da23b4f1495ec4d93416060590d851aa3))
* **backend:** command layer and process manager ([091da82](https://github.com/MasihTak/videoharvest/commit/091da82d76217ef68c599da06e94681eabd7bf0a))
* **backend:** replace tauri-plugin-shell with managed binary download ([9505355](https://github.com/MasihTak/videoharvest/commit/950535534572d9023eeb7c264f3ded073243898c))
* **backend:** sqlite schema and migration system ([85cc2c8](https://github.com/MasihTak/videoharvest/commit/85cc2c8acba1098cf1536cfeae74eeab9936bdaa))
* **dashboard:** add URL input form and video preview placeholder ([0343fa5](https://github.com/MasihTak/videoharvest/commit/0343fa588079d476bc0a80671551c766b5ef97d7))
* **dashboard:** wire URL input to metadata fetch + VideoPreview ([149e95d](https://github.com/MasihTak/videoharvest/commit/149e95d04b5e6f19133c45bd7c85307ae3f19d62))
* **db:** add selector column migration ([a0f0472](https://github.com/MasihTak/videoharvest/commit/a0f047298edd8cb21477c1b6e738b36c0dbd3ed1))
* **download:** add error classifier ([bb8fd86](https://github.com/MasihTak/videoharvest/commit/bb8fd86e6fa004a9dfd407f390cef97e7858ceed))
* **download:** implement queue store, format selection, and downloads page ([42de672](https://github.com/MasihTak/videoharvest/commit/42de6727ccaedd5648a690100004c27d38ba32e0))
* **downloads:** add cancel-all for playlist groups ([cd7d793](https://github.com/MasihTak/videoharvest/commit/cd7d7931eb623106ea38247fab9f6d9cd1bb2ff2))
* **downloads:** add playlist download queue with selection, range, and progress rollup ([d695172](https://github.com/MasihTak/videoharvest/commit/d695172cd02842e1194c8d81fe26d615ccadbf9c))
* **downloads:** persist failure reason across restarts ([ad0d1b3](https://github.com/MasihTak/videoharvest/commit/ad0d1b3e9e1a0aafbe9dd24e32d207c286e2a4f9))
* **downloads:** persist selector and add retry flow ([6b83b1d](https://github.com/MasihTak/videoharvest/commit/6b83b1dc8a705e8ac3727e63917aadb6b3595ac7))
* **formats:** add fallback selector chains ([1fcf9d2](https://github.com/MasihTak/videoharvest/commit/1fcf9d21a9920d489344f1c43076a464d671f7c7))
* **logs:** add activity log system with filtering, clearing, and persistence ([19d62ab](https://github.com/MasihTak/videoharvest/commit/19d62abe86b9acee8eb2873cf2403f6bfd5085fb))
* **notifications:** add toggle for OS notifications ([8fa202b](https://github.com/MasihTak/videoharvest/commit/8fa202b35f9212fa6addc3c50b8f24c1ffe09609))
* **notifications:** register notification plugin in backend ([9f908fa](https://github.com/MasihTak/videoharvest/commit/9f908fab151560e1a45b3fa01193f761dc637312))
* **preview:** enrich metadata and redesign card ([50c5eec](https://github.com/MasihTak/videoharvest/commit/50c5eec975f27645ecd1482ffaa964f8efaee31d))
* **preview:** persist video preview across navigation ([cf99d60](https://github.com/MasihTak/videoharvest/commit/cf99d6052aa5289c2514ec4c337de748f94ea8b9))
* project init ([4e2de2b](https://github.com/MasihTak/videoharvest/commit/4e2de2b7dffacc39227c5256339f329992221ef9))
* **scheduler:** add default schedule time with quick-fill ([d1986c4](https://github.com/MasihTak/videoharvest/commit/d1986c478ee98d5a1c48d19be9e75642babf2108))
* **scheduler:** add one-time scheduled downloads ([e2cc2c3](https://github.com/MasihTak/videoharvest/commit/e2cc2c32141bce614eed25b90be26cdd6e34a514))
* **scheduler:** hide schedule button when disabled ([4da2734](https://github.com/MasihTak/videoharvest/commit/4da27349eb0fb14c7908d1d7c252248e02da60eb))
* **scheduler:** show countdown to next scheduled run ([95a3618](https://github.com/MasihTak/videoharvest/commit/95a361803945ee6ecea3f935027c850495207c79))
* **scripts:** add tauri:build script and specify package manager ([36ba792](https://github.com/MasihTak/videoharvest/commit/36ba79222aa8766af42a420fa158d7ed1839e5d5))
* **services:** add database wrapper ([e570b28](https://github.com/MasihTak/videoharvest/commit/e570b2891b069b0ef0f81aadfac3eca8d36d253c))
* **services:** add logs, notifications, and settings service modules ([373b679](https://github.com/MasihTak/videoharvest/commit/373b6791745bae3e701e6ad47db337d958d58dac))
* **services:** add sidecar service layer (yt-dlp, ffmpeg) ([a05d633](https://github.com/MasihTak/videoharvest/commit/a05d6332beb4008c5344bae0baa1b18ca2a8bc16))
* **settings:** add default download format and quality ([dd5d5dd](https://github.com/MasihTak/videoharvest/commit/dd5d5ddcfdb5c5b390cd2e30165693e1265f171c))
* **settings:** add download folder picker ([c9cf556](https://github.com/MasihTak/videoharvest/commit/c9cf5569b4d3cd550087d028b83321576e0f1d69))
* **settings:** add notifications toggle switch ([9448e28](https://github.com/MasihTak/videoharvest/commit/9448e282beac6f55fa6869e50088fbdad384f59f))
* **settings:** add yt-dlp version display and update controls ([c484c6a](https://github.com/MasihTak/videoharvest/commit/c484c6a336f61f17d3571100d37799ccace2fced))
* update icon ([e0b3510](https://github.com/MasihTak/videoharvest/commit/e0b3510e60e7dd09c905cf8327d0cfd4b43107a5))
* **video-preview:** show channel name ([2c3f3dd](https://github.com/MasihTak/videoharvest/commit/2c3f3dddbeb0c2e28fd2cafbd16e96e94861a3dc))
* **video-preview:** show platform and playlist size ([b42400a](https://github.com/MasihTak/videoharvest/commit/b42400a7592e0c7c1e0e68bfd818acc87db04bf9))


### Bug Fixes

* **binaries:** add timeout to binary downloads ([0c2a0ec](https://github.com/MasihTak/videoharvest/commit/0c2a0ecb2c676dfd559b27114f718b37d4ad8cfb))
* **binaries:** stage ffmpeg binary before replacing ([a578a4e](https://github.com/MasihTak/videoharvest/commit/a578a4e71fa762c6ff23c19a8f89af9232279506))
* **ci:** rename release config files for consistency ([c49fac0](https://github.com/MasihTak/videoharvest/commit/c49fac06293d1ad0b269bc9efdc1c70770dd8c20))
* **download:** kill process tree on Windows ([979d547](https://github.com/MasihTak/videoharvest/commit/979d54706c9e9a489bb4a1010e1e9ffcd984b6d9))
* **download:** map bare exit-code failures to friendly message ([0b6fc20](https://github.com/MasihTak/videoharvest/commit/0b6fc205cc9d20442d4fc65d65adbadf06afd138))
* **download:** reap cancelled process handle ([8c4a7f9](https://github.com/MasihTak/videoharvest/commit/8c4a7f9a1dc1099b6d9093d27ac83314be926759))
* **download:** recover from mutex poisoning ([6170dd0](https://github.com/MasihTak/videoharvest/commit/6170dd081f4aaf7418fb3ec71f72ee99729314af))
* **downloads:** ignore stale sidecar output for non-active items ([e1fb954](https://github.com/MasihTak/videoharvest/commit/e1fb9546847cfa7d74ea3a488bb823481bb433a2))
* **downloads:** playlist progress no longer regresses ([57bf1f6](https://github.com/MasihTak/videoharvest/commit/57bf1f6f0fc7f42b1f9952cf31637db93063c315))
* **format-selector:** keep best-quality pick when switching mode ([8893244](https://github.com/MasihTak/videoharvest/commit/8893244e8c2c0e98d9982b43c124b0dab5284309))
* **husky:** use local commitlint binary ([af64ee2](https://github.com/MasihTak/videoharvest/commit/af64ee2ef9441f2000bd7d5be23d4501f0c14acb))
* **layout:** keep sidebar fixed on scroll ([1cd9927](https://github.com/MasihTak/videoharvest/commit/1cd99271bfe698b22f95a7f1f751911898c16f30))
* **preview:** fall back to thumbnails[] when thumbnail is unset ([64574d0](https://github.com/MasihTak/videoharvest/commit/64574d0062128f0c9c1be2ba6a488822d887eb43))
* **scss:** configure Vite token injection and stylesheet entry point ([c01f500](https://github.com/MasihTak/videoharvest/commit/c01f500ef367c2d91e27ab0c5117fc843cacc049))


### Performance Improvements

* **binaries:** skip re-downloading existing binaries ([06bbbb3](https://github.com/MasihTak/videoharvest/commit/06bbbb395687df2f0206ce95b3582e42863d6976))

## [Unreleased]
