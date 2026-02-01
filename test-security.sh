#!/bin/bash
echo "=== Test de sécurité PMBCloud ==="

# 1. Vérifiez les headers
echo "1. Test des headers de sécurité..."
curl -sI http://localhost:3001/health | grep -E "(X-Content-Type-Options|X-Frame-Options|X-Powered-By)"

# 2. Test rate limiting (lancez plusieurs requêtes)
echo "2. Test rate limiting..."
for i in {1..6}; do
  curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3001/health
done

# 3. Vérifiez Helmet
echo "3. Vérification Helmet..."
node -e "const helmet = require('helmet'); console.log(' Helmet installé')"

echo " Tests terminés"