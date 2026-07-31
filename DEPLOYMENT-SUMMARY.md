# 📋 Résumé Déploiement TransferFlow - 31 Juillet 2026

## ✅ Ce qui a été fait

### 1. **Configuration du code**
- ✅ Email modifié: `info@equipe-securisevinted-pro.com` → `support@transfertsecur.com`
- ✅ Fichiers sources mis à jour (email.service.ts, test-smtp.js)
- ✅ Tous les changements committés sur la branche `main`

### 2. **Fichiers de déploiement créés**

#### Workflow CI/CD
- `.github/workflows/deploy.yml` - Pipeline automatique qui:
  - Lint & Format du code
  - Type checking TypeScript
  - Build Frontend (React) + Backend (Node.js)
  - Run tests
  - Déploie via SSH au VPS
  - Redémarre les services

#### Configuration VPS
- `deployment/setup-vps.sh` - Script d'installation complète:
  - Node.js 22
  - PostgreSQL
  - Nginx
  - SSL/Let's Encrypt
  - Utilisateur `transferflow`
  - Clé SSH pour GitHub

#### Configuration Nginx
- `deployment/nginx-transfertsecur.conf`
  - Reverse proxy (API + Frontend)
  - SSL/TLS automatique
  - Headers de sécurité
  - Gestion des fichiers statiques
  - Fallback SPA

#### Service systemd
- `deployment/systemd-transferflow-api.service`
  - Service Node.js managé par systemd
  - Auto-restart en cas de crash
  - Logs centralisés

#### Documentation
- `deployment/README.md` - Vue d'ensemble
- `deployment/INSTALLATION.md` - Guide détaillé complet
- `deployment/GITHUB-SECRETS.md` - Configuration secrets GitHub
- `deployment/env-production.example` - Template variables d'env

## 🎯 Prochaines étapes (URGENT)

### ÉTAPE 1: Pousser le code sur GitHub
```bash
# Le code est déjà sur la branche main locale
# À faire: Push vers GitHub
git push origin main --force-with-lease
```

**Vérification:**
```
https://github.com/DevMick/TransferFlow
→ Should show 'main' branch with latest commit
```

### ÉTAPE 2: Préparer le VPS (SSH root)
```bash
ssh root@195.35.0.235

# Télécharger et exécuter le script d'installation
cd /tmp
curl -fsSL https://raw.githubusercontent.com/DevMick/TransferFlow/main/deployment/setup-vps.sh > setup-vps.sh
chmod +x setup-vps.sh
./setup-vps.sh
```

**Ce que le script fait:**
- ✅ Met à jour le système
- ✅ Installe Node.js 22, PostgreSQL, Nginx, Certbot
- ✅ Crée l'utilisateur `transferflow`
- ✅ Génère une clé SSH
- ✅ Configure Nginx et SSL
- ✅ Crée la base de données PostgreSQL
- ✅ Configure les services systemd

**Sortie importante:** Le script affichera une clé SSH publique à copier

### ÉTAPE 3: Ajouter la clé SSH à GitHub (Deploy Key)
```
1. Va à: https://github.com/DevMick/TransferFlow/settings/keys
2. Clique "Add deploy key"
3. Title: "VPS Deployment Key"
4. Key: (Colle la clé affichée par le script)
5. ✅ Coche "Allow write access"
6. Clique "Add key"
```

### ÉTAPE 4: Configurer les secrets GitHub
```
https://github.com/DevMick/TransferFlow/settings/secrets/actions
```

Ajoute ces 3 secrets:

**Secret 1: VPS_HOST**
- Name: `VPS_HOST`
- Value: `195.35.0.235`

**Secret 2: VPS_USER**
- Name: `VPS_USER`
- Value: `transferflow`

**Secret 3: VPS_SSH_KEY**
- Name: `VPS_SSH_KEY`
- Value: (Contenu de `/var/www/transfertsecur.com/.ssh/id_ed25519`)

```bash
# Pour récupérer la clé privée sur le VPS:
cat /var/www/transfertsecur.com/.ssh/id_ed25519
```

Copie l'intégralité du contenu (incluant `-----BEGIN OPENSSH PRIVATE KEY-----` et `-----END OPENSSH PRIVATE KEY-----`)

### ÉTAPE 5: Configurer les variables d'environnement
```bash
ssh root@195.35.0.235
nano /var/www/transfertsecur.com/app/.env
```

Remplis les valeurs:
```env
NODE_ENV=production
PORT=3000
DATABASE_URL="postgresql://transferflow:TON_MOT_DE_PASSE@localhost:5432/transferflow_prod"
JWT_SECRET="$(openssl rand -base64 32)"
CORS_ORIGIN="https://transfertsecur.com"
SMTP_HOST="smtp.hostinger.com"
SMTP_PORT="465"
SMTP_USER="support@transfertsecur.com"
SMTP_PASS="Amour##v22@"
```

Pour générer JWT_SECRET sécurisé:
```bash
openssl rand -base64 32
```

### ÉTAPE 6: Test de déploiement manuel
```bash
ssh transferflow@195.35.0.235
cd /var/www/transfertsecur.com/app

# Clone du dépôt
git clone git@github.com:DevMick/TransferFlow.git .

# Installation
pnpm install --frozen-lockfile

# Build
pnpm build

# Migration BD
pnpm db:migrate

# Démarrer l'API
sudo systemctl start transferflow-api
sudo systemctl status transferflow-api

# Vérifier
curl https://transfertsecur.com/api/health
curl https://transfertsecur.com
```

### ÉTAPE 7: Configurer le déploiement automatique
Une fois tout testé manuellement, le déploiement automatique est prêt!

```bash
# Chaque push sur main déclenche le workflow
git push origin main

# Observer le déploiement:
https://github.com/DevMick/TransferFlow/actions
```

## 📊 Architecture finale

```
Internet
    ↓
transfertsecur.com (Nginx SSL/TLS)
    ├→ /api/*     → Node.js Hono API (port 3000)
    │              └→ PostgreSQL
    └→ /*          → React Frontend (port 5173)
                    └→ Ant Design UI
```

## 🔐 Sécurité mise en place

- ✅ SSL/TLS via Let's Encrypt (auto-renew)
- ✅ Firewall UFW (ports 22, 80, 443)
- ✅ SSH key authentification (pas de passwords)
- ✅ User `transferflow` sans privilèges root
- ✅ Variables sensibles en GitHub Secrets
- ✅ Logs centralisés et rotatés
- ✅ Headers de sécurité Nginx

## 📋 Checklist avant déploiement

- [ ] Code pushé sur GitHub (branche main)
- [ ] Domaine DNS configuré (transfertsecur.com → 195.35.0.235)
- [ ] Script setup-vps.sh exécuté avec succès
- [ ] Clé SSH ajoutée comme Deploy Key sur GitHub
- [ ] 3 secrets GitHub configurés (VPS_HOST, VPS_USER, VPS_SSH_KEY)
- [ ] Variables .env remplies sur le VPS
- [ ] Déploiement manuel testé
- [ ] API répond sur https://transfertsecur.com/api/health
- [ ] Frontend accessible sur https://transfertsecur.com

## 🆘 Support & Troubleshooting

### Les logs du workflow GitHub
```
https://github.com/DevMick/TransferFlow/actions
→ Clique sur le workflow qui échoue
→ Regarde "Deploy to VPS" pour les détails
```

### Les logs du VPS
```bash
# API logs
sudo journalctl -u transferflow-api -f

# Nginx logs
tail -f /var/log/nginx/transfertsecur-*.log

# Erreurs générales
sudo journalctl -n 100
```

### Commandes utiles
```bash
# Status service
sudo systemctl status transferflow-api

# Redémarrer
sudo systemctl restart transferflow-api

# Voir les derniers logs
sudo journalctl -u transferflow-api -n 50

# Vérifier Nginx
sudo nginx -t
sudo systemctl reload nginx
```

## 📞 Contacts & URLs

- **Dépôt GitHub:** https://github.com/DevMick/TransferFlow
- **Workflow Actions:** https://github.com/DevMick/TransferFlow/actions
- **Secrets GitHub:** https://github.com/DevMick/TransferFlow/settings/secrets/actions
- **Deploy Keys:** https://github.com/DevMick/TransferFlow/settings/keys
- **VPS SSH:** `ssh root@195.35.0.235`
- **Site en production:** https://transfertsecur.com
- **API en production:** https://transfertsecur.com/api
- **Email support:** support@transfertsecur.com

## ⏱️ Temps estimé

- Exécution du setup-vps.sh: **5-10 minutes**
- Configuration Nginx/SSL: **2-3 minutes** (auto)
- Premier déploiement manuel: **5-10 minutes**
- Configuration GitHub Secrets: **2-3 minutes**
- **Total: ~20-30 minutes** ✨

---

**État:** ✅ Prêt pour déploiement  
**Date:** 31 Juillet 2026  
**Auteur:** Claude Code  
**Version:** 1.0.0
