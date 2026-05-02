### NOTES:

- STOP MONGO AND REDIS services on local devices since docker will throw out an error stating that the respective ports are already in use!!!!

### HOW TO RUN:

Just do a docker-compose up -d or run the individual services as needed

- docker compose up kindleai-redis
- docker compose up kindleai-qdrant
- docker compose up kindleai-backend

use the following commands after adding a package

- docker rm kindleai-backend
- docker compose up backend --build

### SPEECH TO TEXT

Speech to text docs

- [Horrible but it works :p](https://codesandbox.io/p/sandbox/text-to-speech-demo-umlkzv)

React Reader

- [git repo] (https://github.com/gerhardsletten/react-reader)

### Ollama (book assistant / RAG)

The reader Book assistant calls Ollama over HTTP from the backend (`services/ollamaStream.js`).

Docker Compose (default):

- Services `ollama` and `ollama-pull` run the server and download `llama3.2:3b` into the `ollama_data` volume (the pull container waits for the API, then exits; the backend waits until that finishes successfully).
- The backend uses `OLLAMA_URL=http://ollama:11434` on the Compose network.

```bash
docker compose up --build
```

First startup can take a while while the model downloads. If `kindleai-ollama-pull` fails, check logs: `docker compose logs ollama-pull`.

Host Ollama instead (e.g. macOS app): set `OLLAMA_URL` to `http://host.docker.internal:11434` for the backend (env or a local `docker-compose.override.yml`).

Backend on the host (`npm run dev` in `backend/`): defaults to `http://127.0.0.1:11434` if `OLLAMA_URL` is unset; install Ollama locally and `ollama pull` the same model as `OLLAMA_MODEL`.

Optional env vars (see `backend/config/settings.js`): `OLLAMA_URL`, `OLLAMA_MODEL`, `OLLAMA_TIMEOUT_MS`. If you change `OLLAMA_MODEL`, update the `ollama pull` line in `docker-compose.yml` for the one-shot service (or pull manually inside the container).

## Known Issues

### Page Position (epub.js CFI Bug)

When opening a book or clicking a note from a different page, the reader sometimes
opens one page before the correct page. This is a known bug in the epub.js
library that we are using for rendering. Sadly we have no control over it.

Reference 1: https://github.com/futurepress/epub.js/issues/895
Reference 2: https://github.com/futurepress/epub.js/issues/691

**Workaround:** Press the next page button once if you are not on the correct page.
