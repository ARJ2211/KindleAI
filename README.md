# KindleAI

A web e-reader with a built-in AI assistant. Upload EPUBs, read in the browser, listen with text-to-speech, and ask questions about what you are reading.

**Group:** Developers in Paris
**Repository:** [github.com/ARJ2211/KindleAI](https://github.com/ARJ2211/KindleAI)

---

## Setup

The submitted zip includes a `.env` file and a `serviceAccountKey.json` for Firebase. Place both inside the `backend/` directory before starting.

> **Stop any local MongoDB or Redis instances first.** If ports `27017` or `6379` are already in use, the containers will fail to start.
>
> macOS: `brew services stop mongodb-community && brew services stop redis`
>
> Linux: `sudo systemctl stop mongod && sudo systemctl stop redis`

---

## Starting the App

```bash
docker compose up --build
```

This starts all services: frontend, backend, MongoDB, Redis, Qdrant, and Ollama. On first run, Docker will pull all images and download the `llama3.2:3b` model into a local volume. This can take several minutes depending on your connection. Subsequent starts are fast.

The app will be available at `http://localhost:5173`.

If `kindleai-ollama-pull` exits with an error, check what went wrong:

```bash
docker compose logs ollama-pull
```

---

## Stopping the App

To stop without losing data:

```bash
docker compose down
```

To stop and delete all local data (volumes):

```bash
docker compose down -v
```

---

## Rebuilding After Code Changes

If you add a package to the backend or frontend, remove the old container and rebuild:

```bash
docker rm kindleai-backend
docker compose up kindleai-backend --build
```

---

## Known Issues

**Page position (epub.js CFI bug):** When opening a book or navigating to a note, the reader may land one page before the correct location. This is a known upstream bug in epub.js with no available fix.

- [epub.js issue #895](https://github.com/futurepress/epub.js/issues/895)
- [epub.js issue #691](https://github.com/futurepress/epub.js/issues/691)

Workaround: press the next page button once if the page looks wrong.
