Just do a docker-compose up -d or run the individual services as needed
- docker compose up kindleai-redis
- docker compose up kindleai-qdrant
- docker compose up kindleai-backend

use the following commands after adding a package
- docker rm kindleai-backend
- docker compose up backend --build

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
