
docker run -d -p 3001:3001 --name pmbcloud-backend-test \
  -e NODE_ENV=production -e PORT=3001 \
  -e SUPABASE_URL=$SUPABASE_URL \
  -e SUPABASE_KEY=$SUPABASE_KEY \
  -e MONGO_URI=$MONGO_URI \
  -e JWT_SECRET=$JWT_SECRET \
  pmbcloud-backend

sleep 10
RESPONSE=$(curl --write-out "%{http_code}" --silent --output /dev/null http://localhost:3001/health)
if [ "$RESPONSE" -ne 200 ]; then
  echo "ERREUR: Endpoint de santé non disponible"
  docker logs pmbcloud-backend-test
  docker rm -f pmbcloud-backend-test
  exit 1
fi
echo "Endpoint de santé OK"
docker rm -f pmbcloud-backend-test