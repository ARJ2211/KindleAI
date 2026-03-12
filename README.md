Just do a docker-compose up -d or run the individual services as needed
- docker compose up kindleai-redis
- docker compose up kindleai-qdrant
- docker compose up kindleai-backend

use the following commands after adding a package
docker rm kindleai-backend
docker compose up backend --build