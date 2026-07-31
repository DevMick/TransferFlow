# Guide d'Installation & Déploiement - TransferFlow

## Architecture

```
transfertsecur.com (Nginx reverse proxy)
├── https://transfertsecur.com       → Frontend React (port 5173)
├── https://transfertsecur.com/api   → Backend Node.js/Hono (port 3000)
└── PostgreSQL (port 5432, localhost only)
```

## Phase 1: Préparation du VPS

### Étape 1.1: SSH sur le serveur
```bash
ssh root@195.35.0.235
```

### Étape 1.2: Télécharger et exécuter le script d'installation
```bash
cd /tmp
curl -fsSL https://raw.githubusercontent.com/DevMick/TransferFlow/main/deployment/setup-vps.sh > setup-vps.sh
chmod +x setup-vps.sh
./setup-vps.sh
```

Ce script va:
- ✅ Installer Node.js 22, PostgreSQL, Nginx, Certbot
- ✅ Configurer les certificats SSL/TLS
- ✅ Créer l'utilisateur `transferflow`
- ✅ Générer une clé SSH pour GitHub
- ✅ Configurer les services systemd
- ✅ Afficher la clé SSH publique à ajouter à GitHub

### Étape 1.3: Copier la clé SSH et l'ajouter à GitHub

Le script affichera la clé publique SSH. Copie-la et ajoute-la comme **Deploy Key** sur GitHub:

1. Va à: https://github.com/DevMick/TransferFlow/settings/keys
2. Clique "Add deploy key"
3. **Title:** `VPS Deployment Key`
4. **Key:** (Colle la clé affichée)
5. ✅ Coche "Allow write access"
6. Clique "Add key"

### Étape 1.4: Configurer les variables d'environnement

```bash
ssh root@195.35.0.235
nano /var/www/transfertsecur.com/app/.env
```

Modifie les valeurs suivantes:

```env
NODE_ENV=production
PORT=3000
DATABASE_URL="postgresql://transferflow:TonMotDePasse@localhost:5432/transferflow_prod"
JWT_SECRET="$(openssl rand -base64 32)"
CORS_ORIGIN="https://transfertsecur.com"
SMTP_HOST="smtp.hostinger.com"
SMTP_PORT="465"
SMTP_USER="support@transfertsecur.com"
SMTP_PASS="Amour##v22@"
```

**Générer JWT_SECRET sécurisé:**
```bash
openssl rand -base64 32
```

Sauvegarde: `CTRL+O`, `Entrée`, `CTRL+X`

### Étape 1.5: Mettre à jour la base de données PostgreSQL

```bash
ssh root@195.35.0.235
sudo -u postgres psql
```

```sql
ALTER USER transferflow WITH PASSWORD 'tonMotDePasseSecurise';
\q
```

Puis mets à jour le `.env` avec le mot de passe:
```bash
nano /var/www/transfertsecur.com/app/.env
```

## Phase 2: Configuration GitHub Secrets

### Étape 2.1: Ajouter les secrets GitHub

Va à: https://github.com/DevMick/TransferFlow/settings/secrets/actions

Ajoute ces 3 secrets:

#### Secret 1: VPS_HOST
- **Name:** VPS_HOST
- **Value:** `195.35.0.235`

#### Secret 2: VPS_USER
- **Name:** VPS_USER
- **Value:** `transferflow`

#### Secret 3: VPS_SSH_KEY
- **Name:** VPS_SSH_KEY
- **Value:** (Contenu du fichier `/var/www/transfertsecur.com/.ssh/id_ed25519`)

```bash
# Pour récupérer la clé privée:
ssh root@195.35.0.235
cat /var/www/transfertsecur.com/.ssh/id_ed25519
```

Copie l'intégralité (incluant les lignes `-----BEGIN...` et `-----END...`)

## Phase 3: Test du déploiement manuel

### Étape 3.1: Clone et setup initial sur le VPS

```bash
ssh transferflow@195.35.0.235
cd /var/www/transfertsecur.com/app

# Clone du dépôt
git clone git@github.com:DevMick/TransferFlow.git .

# Installation des dépendances
pnpm install --frozen-lockfile

# Build du projet
pnpm build

# Migration de la base de données
pnpm db:migrate
```

### Étape 3.2: Démarrer le service API

```bash
sudo systemctl start transferflow-api
sudo systemctl status transferflow-api
```

### Étape 3.3: Vérifier que tout fonctionne

```bash
# Test API
curl https://transfertsecur.com/api/health

# Test Frontend
curl https://transfertsecur.com
```

## Phase 4: Configuration CI/CD automatique

Une fois tout testé manuellement, le déploiement automatique est prêt:

1. Chaque `git push` sur `main` déclenche le workflow GitHub Actions
2. Le workflow vérifie, build, et déploie automatiquement

**Observer le déploiement:**
1. Va à: https://github.com/DevMick/TransferFlow/actions
2. Clique sur le dernier workflow
3. Suis la progression en temps réel

## Commandes utiles VPS

```bash
# Status du service API
sudo systemctl status transferflow-api

# Logs en temps réel
sudo journalctl -u transferflow-api -f

# Redémarrer le service
sudo systemctl restart transferflow-api

# Vérifier Nginx
sudo nginx -t
sudo systemctl reload nginx

# Status SSL
sudo certbot certificates

# Renouvellement SSL manuel
sudo certbot renew

# Logs Nginx
tail -f /var/log/nginx/transfertsecur-*.log

# Accès PostgreSQL
sudo -u postgres psql transferflow_prod

# Espace disque
df -h

# Utilisation CPU/Mémoire
top
htop
```

## Troubleshooting

### Le service ne démarre pas
```bash
sudo journalctl -u transferflow-api -n 50
```

### Erreurs de connexion à la base de données
```bash
# Vérifier la connexion PostgreSQL
sudo -u postgres psql -U transferflow -d transferflow_prod -h localhost -c "SELECT 1"
```

### Problèmes Nginx
```bash
sudo nginx -t
sudo systemctl reload nginx
tail -f /var/log/nginx/error.log
```

### Problèmes SSL
```bash
sudo certbot certificates
sudo certbot renew --dry-run
```

## Monitoring

### Vérifier les logs en temps réel
```bash
# API logs
sudo journalctl -u transferflow-api -f

# Nginx access logs
tail -f /var/log/nginx/transfertsecur-access.log

# Nginx error logs
tail -f /var/log/nginx/transfertsecur-error.log
```

### Health checks
```bash
# API
curl -v https://transfertsecur.com/api/health

# Frontend
curl -v https://transfertsecur.com

# Base de données
sudo -u postgres pg_isready -d transferflow_prod
```

## Mise à jour du code

### Déploiement automatique (recommandé)
```bash
git push origin main
# Le workflow GitHub Actions se déclenche automatiquement
```

### Déploiement manuel
```bash
ssh transferflow@195.35.0.235
cd /var/www/transfertsecur.com/app
git pull origin main
pnpm install --frozen-lockfile
pnpm build
pnpm db:migrate
sudo systemctl restart transferflow-api
```

## Sécurité

✅ **Points à vérifier:**
- [ ] Firewall UFW configuré (only 22, 80, 443)
- [ ] SSH key authentification (pas de password login)
- [ ] Fail2ban installé (protection brute-force)
- [ ] Backups PostgreSQL configurés
- [ ] Logs centralisés
- [ ] Monitoring/Alertes mises en place

## Support

Pour toute assistance:
- Logs: `/var/log/transferflow/`
- GitHub Issues: https://github.com/DevMick/TransferFlow/issues
- Contact: support@transfertsecur.com
