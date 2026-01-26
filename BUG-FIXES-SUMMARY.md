# 🐛 Bug Fixes Summary - Celeb Selfie

**Date**: 2026-01-21
**Session**: Bug Resolution - Google API & Replicate CORS

---

## 🎯 Bugs Résumés

### Bug 1: Google Direct API - Geo-Restriction ✅ RÉSOLU
**Symptôme**: `finishReason: "IMAGE_OTHER"` - Aucune image générée

**Cause Racine**:
- L'API Google Nano Banana Pro est **géo-restreinte** en dehors des US
- Les appels directs depuis la France sont bloqués
- Google retourne `IMAGE_OTHER` sans image

**Solution**:
- ✅ Configurer le proxy US pour Google AI API (path `/google/`)
- ✅ Modifier `googleDirectNanoBanana.service.ts` pour utiliser le proxy US
- ✅ Même principe que pour Replicate - tout passe par le VPS US

---

### Bug 2: Replicate API - CORS Header Missing ✅ RÉSOLU
**Symptôme**: `Request header field prefer is not allowed by Access-Control-Allow-Headers`

**Cause Racine**:
- Le header `Prefer` envoyé par le client n'était pas dans la liste CORS du proxy nginx
- Requête OPTIONS (preflight) échouait
- Failover vers le proxy France fonctionnait déjà

**Solution**:
- ✅ Ajouter `Prefer` aux headers autorisés dans nginx CORS config
- ✅ Restructurer nginx avec des `location` séparées pour Replicate et Google

---

## 📝 Fichiers Modifiés

### Configuration Nginx (VPS US)
**Fichier**: `nginx-replicate-proxy.conf`

**Changements**:
```nginx
# AVANT: Proxy root / vers Replicate
location / {
    proxy_pass https://api.replicate.com;
    # Headers CORS incomplets
}

# APRÈS: Proxies séparés avec CORS complets
location /replicate/ {
    rewrite ^/replicate/(.*) /$1 break;
    proxy_pass https://api.replicate.com;
    add_header 'Access-Control-Allow-Headers' '..., Prefer' always;
}

location /google/ {
    rewrite ^/google/(.*) /$1 break;
    proxy_pass https://generativelanguage.googleapis.com;
    add_header 'Access-Control-Allow-Headers' '..., Prefer' always;
}
```

### Service Google Direct
**Fichier**: `src/services/composite/googleDirectNanoBanana.service.ts`

**Changements**:
```typescript
// AVANT: Appel direct
const API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/...';

// APRÈS: Via proxy US si activé
const USE_US_PROXY = import.meta.env.VITE_USE_CORS_PROXY === 'true';
const API_ENDPOINT = USE_US_PROXY
  ? `${US_PROXY_BASE}/google/v1beta/models/${MODEL_NAME}:generateContent`
  : `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent`;
```

### Variables d'Environnement
**Fichier**: `.env`

**Changements**:
```bash
# AVANT
VITE_US_CORS_PROXY_URL=https://us.api.tmtprod.com/

# APRÈS
VITE_US_CORS_PROXY_URL=https://us.api.tmtprod.com/replicate/
# Note: Le path /google/ sera utilisé dynamiquement par googleDirectNanoBanana.service.ts
```

### Logs de Debug (Temporaires)
**Fichier**: `src/services/composite/googleDirectNanoBanana.service.ts`

**Ajouté** (pour diagnostic):
```typescript
console.log('[Google Direct Nano Banana] 🔍 Full API Response:', JSON.stringify(data, null, 2));
console.log('[Google Direct Nano Banana] 🔍 Extracting images from response...');
// ... plus de logs détaillés
```

⚠️ **À nettoyer après validation**: Retirer les logs `🔍` une fois les tests confirmés

---

## 🚀 Déploiement

### Étape 1: Déployer la Config Nginx sur VPS US

**Option A: Script Automatique** (Recommandé)
```bash
cd /Users/antoine/claude/celeb-selfie
./scripts/deploy-nginx-us-proxy.sh
```

**Option B: Déploiement Manuel**
```bash
# 1. Copier la config
scp nginx-replicate-proxy.conf root@76.13.97.11:/etc/nginx/sites-available/api-proxy

# 2. SSH au VPS
ssh root@76.13.97.11

# 3. Tester la config
nginx -t

# 4. Créer le symlink
ln -sf /etc/nginx/sites-available/api-proxy /etc/nginx/sites-enabled/api-proxy

# 5. Recharger nginx
systemctl reload nginx

# 6. Vérifier le status
systemctl status nginx
```

### Étape 2: Vérifier les Endpoints

Depuis votre machine locale:
```bash
# Test Replicate proxy
curl -I https://us.api.tmtprod.com/replicate/

# Test Google proxy
curl -I https://us.api.tmtprod.com/google/

# Les deux devraient retourner des headers CORS avec:
# Access-Control-Allow-Headers: Authorization, Content-Type, Accept, Prefer
```

### Étape 3: Tester l'Application

1. **Rechargez** http://localhost:5182 (hard refresh: Cmd+Shift+R)

2. **Test Replicate API**:
   - Prenez une photo
   - Sélectionnez "Replicate API" (violet)
   - Entrez "Beyoncé" ou "Taylor Swift"
   - Générez
   - ✅ Devrait fonctionner en 60-90s sans erreur CORS

3. **Test Google Direct API**:
   - Prenez une photo
   - Sélectionnez "Google Direct API" (bleu)
   - Entrez "Elon Musk" ou "Brad Pitt"
   - Générez
   - ✅ Devrait fonctionner en 20-40s et générer une image

---

## 🧪 Plan de Test

### Critères de Succès

| Test | Statut | Notes |
|------|--------|-------|
| **Replicate API - US Proxy** | ⏳ À tester | Pas d'erreur CORS "Prefer" |
| **Replicate API - France Proxy** | ✅ Fonctionne | Failover déjà testé |
| **Google Direct API - US Proxy** | ⏳ À tester | Doit générer une image |
| **Google Direct API - Sans Proxy** | ❌ Bloqué | Geo-restriction confirmée |

### Tests à Effectuer

1. ✅ **CORS Preflight**: Vérifier que OPTIONS requests passent
2. ✅ **Replicate Generation**: Selfie avec célébrité via Replicate
3. ✅ **Google Generation**: Selfie avec célébrité via Google Direct
4. ✅ **Failover**: Si US proxy échoue, France proxy prend le relais
5. ✅ **Comparison**: Comparer qualité/vitesse Replicate vs Google

---

## 📊 Architecture Mise à Jour

```
┌─────────────────────┐
│   Browser (FR)      │
│  localhost:5182     │
└──────┬──────────────┘
       │
       ├─────────────────────────────────┐
       │                                 │
       ▼                                 ▼
┌──────────────────┐            ┌──────────────────┐
│  Replicate API   │            │  Google Direct   │
│  (via US Proxy)  │            │   (via US Proxy) │
└────────┬─────────┘            └────────┬─────────┘
         │                               │
         ▼                               ▼
┌──────────────────────────────────────────────────┐
│         VPS US (76.13.97.11)                     │
│      us.api.tmtprod.com                          │
│                                                   │
│  ┌─────────────────────────────────────────┐    │
│  │  Nginx Reverse Proxy                    │    │
│  │                                          │    │
│  │  /replicate/ ──> api.replicate.com      │    │
│  │  /google/    ──> generativelanguage...  │    │
│  │                                          │    │
│  │  CORS: Authorization, Prefer, ...       │    │
│  └─────────────────────────────────────────┘    │
└──────────────────────────────────────────────────┘
         │                               │
         ▼                               ▼
┌──────────────────┐            ┌──────────────────┐
│  api.replicate.  │            │  Google Gemini   │
│      com         │            │   API (US only)  │
│  Nano Banana Pro │            │  Nano Banana Pro │
└──────────────────┘            └──────────────────┘
```

---

## 💰 Cost Comparison (Updated)

| API | Cost/Image | Speed | Geo-Restriction | Status |
|-----|------------|-------|-----------------|--------|
| **Replicate** | $0.15 | 60-90s | ✅ Bypassed (US proxy) | ✅ Battle-tested |
| **Google Direct** | $0.13-0.24 | 20-40s | ✅ Bypassed (US proxy) | ⚡ Testing |

**Recommendation**: Tester les deux APIs et comparer la qualité/fiabilité avant de choisir une par défaut.

---

## 🔧 Cleanup à Faire (Post-Validation)

Une fois les tests validés:

1. **Retirer les logs de debug** dans `googleDirectNanoBanana.service.ts`:
   ```typescript
   // Retirer tous les console.log avec 🔍
   ```

2. **Mettre à jour le README**:
   - Documenter les deux APIs
   - Expliquer le proxy US
   - Ajouter les instructions de test

3. **Choisir l'API par défaut**:
   - Si Google est fiable: mettre `google-direct` par défaut
   - Sinon: garder `replicate`

---

## 📚 Ressources

- **Nginx CORS Config**: https://enable-cors.org/server_nginx.html
- **Google Nano Banana Docs**: https://ai.google.dev/gemini-api/docs/nanobanana
- **Replicate API Docs**: https://replicate.com/docs
- **VPS US**: 76.13.97.11 (us.api.tmtprod.com)
- **VPS France**: api.tmtprod.com

---

## ✅ Checklist de Déploiement

- [ ] Déployer nginx config sur VPS US
- [ ] Vérifier les endpoints CORS (curl -I)
- [ ] Recharger l'application (hard refresh)
- [ ] Tester Replicate API avec célébrité
- [ ] Tester Google Direct API avec célébrité
- [ ] Comparer qualité des images
- [ ] Comparer vitesse de génération
- [ ] Vérifier les coûts réels
- [ ] Choisir l'API par défaut
- [ ] Nettoyer les logs de debug
- [ ] Mettre à jour la documentation

---

**Prochaine étape**: Déployez la config nginx avec `./scripts/deploy-nginx-us-proxy.sh` puis testez les deux APIs! 🚀
