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

The reader Book assistant calls Ollama over HTTP from the backend (`services/ollamaStream.js`). Ollama should run on your host (not inside Docker).

1. Install [Ollama](https://ollama.com) and keep it running (menu bar on macOS is fine).
2. Pull the same model the backend expects (default in `docker-compose.yml` / `backend/config/settings.js`):

   ```bash
   ollama pull llama3.2:3b
   ```

3. Docker backend — `OLLAMA_URL` is set to `http://host.docker.internal:11434` so the container can reach Ollama on the host.
4. Backend on the host (`npm run dev` in `backend/`) — defaults to `http://127.0.0.1:11434` if `OLLAMA_URL` is unset.

Optional env vars (see `backend/config/settings.js`): `OLLAMA_URL`, `OLLAMA_MODEL`, `OLLAMA_TIMEOUT_MS`. If you change `OLLAMA_MODEL`, run `ollama pull <name>` with that exact tag.
