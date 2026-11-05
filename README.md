![logo](https://eliasdh.com/assets/media/images/logo-github.png)
# 💙🤍README🤍💙

## 📘Table of Contents

1. [📘Table of Contents](#📘table-of-contents)
2. [🖖Introduction](#🖖introduction)
3. [🧩Structure](#🧩structure)
4. [🔗Links](#🔗links)

---

## 🖖Introduction

This is the EliasDH status website: [status.eliasdh.com](https://status.eliasdh.com). It shows whether the EliasDH website and webservices are online, how they performed over the last 90 days and which incidents happened recently.

The site is hosted on **GitHub Pages**, outside of our own cluster, so it stays online when our infrastructure is down. A GitHub Actions pipeline checks our websites and webservices every 5 minutes and publishes the result with the site.

I kindly request your thorough examination and absorption of the comprehensive documentation incorporated within the confines of this repository. Your diligent review of the diverse materials provided herein will undoubtedly enhance your understanding of the intricacies and nuances associated with the contents therein.

Please also see following documents:
- [LICENSE](LICENSE.md)
- [SECURITY](SECURITY.md)
- [CONTRIBUTING](CONTRIBUTING.md)
- [CODE OF CONDUCT](CODE-OF-CONDUCT.md)
- [GITHUB PAGES](GITHUB-PAGES.md)

## 🧩Structure

| Path | Purpose |
| --- | --- |
| `App/Frontend` | The Angular website (same theme and UI components as [eliasdh.com](https://eliasdh.com)). |
| `App/Monitor` | The checker that probes our websites and webservices. The list of checks is in `App/Monitor/services.json`. |
| `.github/workflows/status.yaml` | Checks the status every 5 minutes, builds the site and deploys it to GitHub Pages. |
| `.github/workflows/ci.yaml` | Runs the tests and a build on every pull request. |

There is no backend and no Docker image: the site is static and the pipeline is the only moving part.

## 🔗Links
- 👯 Web hosting company [EliasDH.com](https://eliasdh.com).
- 📫 How to reach us info@eliasdh.com
