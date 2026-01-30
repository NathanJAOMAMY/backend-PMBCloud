Write-Host "=== TEST DEVSECOPS ===" -ForegroundColor Cyan

# 1. Test du serveur
Write-Host "`n1. Serveur en ligne ?" -ForegroundColor Yellow
try {
    $resp = Invoke-WebRequest -Uri "http://localhost:3001/health" -UseBasicParsing
    Write-Host "   OUI - Status: $($resp.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "    NON - Serveur éteint" -ForegroundColor Red
    exit
}

# 2. Test rate limiting
Write-Host "`n2. Test protection anti-bruteforce..." -ForegroundColor Yellow
Write-Host "   Envoi de 6 tentatives de connexion..." -ForegroundColor Gray

$blocked = 0
for ($i=1; $i -le 6; $i++) {
    try {
        Invoke-WebRequest -Uri "http://localhost:3001/auth/login" -Method POST `
            -Headers @{"Content-Type"="application/json"} `
            -Body '{"email":"test","password":"test"}' `
            -UseBasicParsing -ErrorAction Stop | Out-Null
        Write-Host "   Tentative $i : Passée" -ForegroundColor Gray
    } catch {
        if ($_.Exception.Response.StatusCode.Value__ -eq 429) {
            Write-Host "   Tentative $i : BLOQUÉE (rate limiting)" -ForegroundColor Green
            $blocked++
        } else {
            Write-Host "   Tentative $i : Erreur normale" -ForegroundColor Gray
        }
    }
    Start-Sleep -Milliseconds 100
}

if ($blocked -gt 0) {
    Write-Host "   ✅ SUCCÈS : $blocked requêtes bloquées (rate limiting actif)" -ForegroundColor Green
} else {
    Write-Host "   ⚠️ ATTENTION : Aucune requête bloquée" -ForegroundColor Yellow
}

# 3. Vérifiez les logs
Write-Host "`n3. Vérification des logs..." -ForegroundColor Yellow
if (Test-Path "logs\security.log") {
    $lines = Get-Content -Path "logs\security.log" -Tail 3
    Write-Host "   Logs trouvés :" -ForegroundColor Green
    foreach ($line in $lines) {
        Write-Host "   $line"
    }
} else {
    Write-Host "   Aucun log trouvé" -ForegroundColor Gray
}

Write-Host "`n=== FIN DU TEST ===" -ForegroundColor Cyan
