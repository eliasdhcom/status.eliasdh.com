![logo](https://eliasdh.com/assets/media/images/logo-github.png)
# 💙🤍GITHUB PAGES🤍💙

## 📘Table of Contents

1. [📘Table of Contents](#table-of-contents)
2. [🚀How it works](#how-it-works)
3. [🔧Setup](#setup)
    - [🔧Repository settings](#repository-settings)
    - [🔧Custom domain](#custom-domain)
    - [🔧Secrets](#secrets)
4. [🔨Configuration](#configuration)
5. [💻Local development](#local-development)
6. [🩺Troubleshooting](#troubleshooting)

## 🚀How it works

```
every 5 minutes (GitHub Actions)
  └─ monitor job
       ├─ restores history.json from the status-data branch
       ├─ probes every service in App/Monitor/services.json (retries before reporting an outage;
       │  services that follow another service copy its result)
       ├─ writes status.json (current status, 90 day bars, uptime, incidents)
       └─ publishes the new history.json to the status-data branch
  └─ deploy job
       ├─ builds the Angular site (skipped when the frontend did not change, the build is cached)
       ├─ adds status.json to the site as data/status.json
       └─ deploys the site to GitHub Pages
```

- The checks run from a GitHub runner, so they are an outside view of our infrastructure. Nothing in the browser talks to our cluster, so no CORS settings or API keys end up in the website.
- `status.json` contains no URLs, headers or error messages, only names, status, response time and counts.
- The history lives on the `status-data` branch. That branch always holds a single commit that is replaced on every run, so the repository does not grow.
- A pull request only runs the tests and a build (`ci.yaml`). Only `main` and the schedule deploy.

What a check means:

| Status | Meaning |
| --- | --- |
| Operational | The request succeeded, the content is right and the response was faster than `degradedMs` (3 seconds). |
| Degraded performance | The service answered, but slowly or one of its `jsonChecks` failed (for example not all cluster nodes are healthy). |
| Outage | The request or connection failed, timed out or returned the wrong content, three times in a row. |

Uptime counts "degraded" as available. A day in the 90 day bar turns amber when some checks failed and red when at least 1% of them failed.

## 🔧Setup

### 🔧Repository settings

1. The repository must be **public**. GitHub Pages on a private repository needs a paid plan.
2. **Settings → Pages → Build and deployment → Source**: choose **GitHub Actions**.
3. **Settings → Actions → General → Workflow permissions**: choose **Read and write permissions**. The pipeline needs it to update the `status-data` branch.
4. **Settings → Environments → github-pages**: check that `main` is allowed to deploy (this is the default).
5. Start the first run: **Actions → Check Status and Deploy to GitHub Pages → Run workflow**.

### 🔧Custom domain

1. **Settings → Pages → Custom domain**: enter `status.eliasdh.com` and enable **Enforce HTTPS** once the certificate is ready.
2. Create a DNS record at the DNS provider of `eliasdh.com`:

   | Type | Name | Value |
   | --- | --- | --- |
   | CNAME | `status` | `eliasdhcom.github.io` |

3. Do not host the DNS for this name on the cluster: the status page has to keep working when the cluster is down.

### 🔧Secrets

None. All checks use public endpoints, so no secrets are needed. A check that uses a `${NAME}` placeholder in its `headers` is skipped (and does not show on the page) until you add that secret and pass it to the `Check websites and webservices` step in `status.yaml`.

## 🔨Configuration

All checks are in [App/Monitor/services.json](App/Monitor/services.json). Add a service by adding an entry:

```json
{
  "id": "customer-site",
  "name": "Customer Site",
  "group": "websites",
  "url": "https://example.be",
  "expectBody": "text that must be on the page"
}
```

| Field | Default | Meaning |
| --- | --- | --- |
| `id` | | Lowercase letters, digits and dashes. Used in the history and for translations. |
| `name` | | Shown on the page when there is no translation. |
| `group` | | One of the `groups` in the same file. |
| `type` | `http` | `http` checks a URL, `tls` opens a TLS connection (used for the mail servers). |
| `url` | | `http` only. Must use `https`. |
| `targets` | | `tls` only. List of `{ "host": "...", "port": 993, "expectGreeting": "* OK" }`, all of them must answer with that greeting. |
| `sameAs` | | Id of another service. The service has no check of its own and copies the result of that service, with its own history. |
| `expectStatus` | `[200]` | Accepted HTTP status codes. |
| `expectBody` | | Text the response has to contain. |
| `headers` | | Extra request headers. `${NAME}` is replaced by an environment variable, add it as a secret and to `status.yaml`. |
| `jsonChecks` | | List of `{ "path": "data.healthy", "equals": true }`. A failing check makes the service degraded. |
| `metrics` | | Numbers to show from the JSON response, for example the number of healthy nodes. |
| `timeoutMs`, `degradedMs`, `retries`, `retryDelayMs` | `10000`, `3000`, `2`, `5000` | Timing of a check. |

Names and descriptions are translated in `App/Frontend/src/assets/i18n/*.json` under `SERVICES.<id>` and `GROUPS.<id>`. The services on the page are `EliasDH Website`, `EliasDH App`, `EliasDH Web` and `EliasDH QR` (the last two follow the app), `EliasDH Mail` (the mail servers) and `EliasDH Domains` (the domain registrar API). Customer websites are not listed on purpose, add them only when the customer agrees.

## 💻Local development

```bash
# Test the monitor (Node.js 20 or newer, no dependencies)
cd App/Monitor
npm test

# Generate demo data and start the website on http://localhost:4200
npm run demo
cd ../Frontend
npm install
npm start

# Run a real check (writes status.json and history.json next to you)
cd ../Monitor
ELIASDH_API_KEY=... node src/monitor.js --history history.json --out status.json
```

`App/Frontend/src/data` is ignored by git. It only exists for local previews, the pipeline adds the real data after the build.

## 🩺Troubleshooting

- **The page says the last check was a long time ago.** GitHub runs scheduled workflows with some delay, and it disables them after 60 days without repository activity on a public repository. Open **Actions** and enable the workflow again, or start it with **Run workflow**. Pushing to `main` also deploys.
- **The deploy job fails with a permissions error.** Check step 2 and 4 of the repository settings.
- **The history was lost.** The `status-data` branch holds the only copy. Do not delete it. Without it the bars start again from today.
- **A check shows an outage but the site works.** Open the run log of the `monitor` job, it lists the reason per service (timeout, HTTP code, unexpected body).
