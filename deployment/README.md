# 🚀 TransferFlow Production Deployment

Déploiement automatisé de TransferFlow sur VPS Ubuntu 24.04 avec CI/CD GitHub Actions.

## 📋 Fichiers de déploiement

```
deployment/
├── README.md                          # Ce fichier
├── INSTALLATION.md                    # Guide détaillé d'installation
├── GITHUB-SECRETS.md                  # Configuration des secrets GitHub
├── setup-vps.sh                       # Script d'installation automatique VPS
├── nginx-transfertsecur.conf          # Configuration Nginx reverse proxy
├── systemd-transferflow-api.service   # Service systemd pour l'API
└── env-production.example             # Variables d'environnement template

.github/workflows/
└── deploy.yml                         # Workflow GitHub Actions CI/CD
```

## 🎯 Prérequis

- ✅ VPS Ubuntu 24.04 avec accès SSH root
- ✅ Domaine `transfertsecur.com` pointant vers l'IP VPS (195.35.0.235)
- ✅ Dépôt GitHub: https://github.com/DevMick/TransferFlow
- ✅ Stack: Node.js 22+, pnpm, PostgreSQL, Nginx

## ⚡ Quick Start (5 étapes)

### 1️⃣ Préparer le VPS
```bash
ssh root@195.35.0.235
cd /tmp && curl -fsSL https://raw.githubusercontent.com/DevMick/TransferFlow/main/deployment/setup-vps.sh | bash
```
⏱️ Durée: ~5-10 minutes | Le script affichera la clé SSH à ajouter à GitHub

### 2️⃣ Ajouter la clé SSH à GitHub
Copie la clé affichée par le script et ajoute-la comme **Deploy Key**:
- URL: https://github.com/DevMick/TransferFlow/settings/keys
- Title: `VPS Deployment Key`
- ✅ Coche "Allow write access"

### 3️⃣ Configurer les variables d'environnement
```bash
ssh root@195.35.0.235
nano /var/www/transfertsecur.com/app/.env
```
Voir `env-production.example` pour les valeurs à remplir.

### 4️⃣ Ajouter les GitHub Secrets
URL: https://github.com/DevMick/TransferFlow/settings/secrets/actions

| Secret | Valeur |
|--------|--------|
| `VPS_HOST` | `195.35.0.235` |
| `VPS_USER` | `transferflow` |
| `VPS_SSH_KEY` | Contenu de `id_ed25519` |

### 5️⃣ Tester le déploiement automatique
```bash
git push origin main
# ✅ Le workflow GitHub Actions se déclenche automatiquement
# 📊 Observe le déploiement: https://github.com/DevMick/TransferFlow/actions
```

## 📚 Documentation complète

- **[INSTALLATION.md](./INSTALLATION.md)** - Guide détaillé avec toutes les étapes
- **[GITHUB-SECRETS.md](./GITHUB-SECRETS.md)** - Configuration des secrets GitHub
- **[nginx-transfertsecur.conf](./nginx-transfertsecur.conf)** - Configuration Nginx
- **[setup-vps.sh](./setup-vps.sh)** - Script d'installation VPS

## 🔄 Workflow CI/CD

À chaque `push` sur `main`:

```
Code Push
    ↓
GitHub Actions Workflow
    ├── 1. Lint & Format
    ├── 2. Type Check
    ├── 3. Build Frontend & Backend
    ├── 4. Run Tests
    ├── 5. SSH Deploy to VPS
    │   ├── Git pull latest code
    │   ├── pnpm install
    │   ├── pnpm build
    │   ├── pnpm db:migrate
    │   └── systemctl restart services
    └── 6. Verify Health Checks
         ├── https://transfertsecur.com
         └── https://transfertsecur.com/api/health
```

Vois le workflow: [.github/workflows/deploy.yml](../.github/workflows/deploy.yml)

## 🔐 Architecture sécurisée

```
Internet
    ↓
Nginx (HTTPS/SSL)
    ├→ /api/*          → Node.js API (port 3000)
    └→ /*              → React Frontend (port 5173)
            ↓
        PostgreSQL (localhost:5432)
```

**Sécurité:**
- ✅ SSL/TLS via Let's Encrypt (auto-renouvellement)
- ✅ Firewall UFW (ports 22, 80, 443)
- ✅ Clé SSH pour déploiement (pas de tokens exposés)
- ✅ Variables sensibles en GitHub Secrets
- ✅ User `transferflow` sans privilèges root
- ✅ Logs centralisés et rotation

## 📊 Monitoring

### Logs en temps réel
```bash
# API
ssh root@195.35.0.235
sudo journalctl -u transferflow-api -f

# Nginx
tail -f /var/log/nginx/transfertsecur-access.log
```

### Health checks
```bash
# API
curl https://transfertsecur.com/api/health

# Frontend
curl https://transfertsecur.com
```

### Commandes utiles
```bash
# Status service
sudo systemctl status transferflow-api

# Redémarrer
sudo systemctl restart transferflow-api

# Vérifier Nginx
sudo nginx -t

# Certificats SSL
sudo certbot certificates
```

## 🆘 Troubleshooting

### Le workflow échoue?
1. Va à: https://github.com/DevMick/TransferFlow/actions
2. Clique sur le workflow échoué
3. Regarde les logs détaillés

### L'API ne répond pas?
```bash
ssh root@195.35.0.235
sudo systemctl status transferflow-api
sudo journalctl -u transferflow-api -n 50
```

### Erreur de base de données?
```bash
ssh root@195.35.0.235
sudo -u postgres psql -U transferflow -d transferflow_prod -c "SELECT 1"
```

### Problème Nginx?
```bash
sudo nginx -t
sudo systemctl reload nginx
tail -f /var/log/nginx/error.log
```

## 📈 Mise à l'échelle future

- **Reverse Proxy:** Peut être remplacé par Traefik
- **Container:** Docker/Docker Compose (prêt)
- **Load Balancing:** Nginx upstream + multiple API instances
- **Cache:** Redis pour session/cache
- **Monitoring:** Prometheus + Grafana
- **Logging:** ELK Stack ou Datadog

## 📞 Support

- **Documentation:** Voir [INSTALLATION.md](./INSTALLATION.md)
- **GitHub Issues:** https://github.com/DevMick/TransferFlow/issues
- **Logs:** `/var/log/transferflow/`
- **Contact:** support@transfertsecur.com

## ✅ Checklist pré-production

- [ ] VPS Ubuntu 24.04 préparé (setup-vps.sh exécuté)
- [ ] Domaine DNS pointant vers l'IP VPS
- [ ] Certificat SSL généré (Let's Encrypt)
- [ ] Variables .env configurées
- [ ] Deploy Key SSH ajoutée à GitHub
- [ ] Secrets GitHub configurés (VPS_HOST, VPS_USER, VPS_SSH_KEY)
- [ ] Déploiement manuel testé avec succès
- [ ] Workflow GitHub Actions fonctionnant
- [ ] Logs et monitoring en place
- [ ] Backups configurés

---

**Status:** ✅ Prêt pour la production  
**Dernière mise à jour:** 2026-07-31  
**Version:** 1.0.0
