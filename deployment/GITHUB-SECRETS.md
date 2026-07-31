# Configuration des Secrets GitHub

## Secrets à ajouter dans GitHub

Accès: https://github.com/DevMick/TransferFlow/settings/secrets/actions

### 1. VPS_HOST
**Valeur:** `195.35.0.235`
**Description:** Adresse IP du serveur VPS

### 2. VPS_USER
**Valeur:** `transferflow`
**Description:** Utilisateur système sur le VPS

### 3. VPS_SSH_KEY
**Valeur:** Contenu de `/var/www/transfertsecur.com/.ssh/id_ed25519`
**Description:** Clé SSH privée pour authentifier les déploiements

**Comment obtenir la clé:**
```bash
ssh root@195.35.0.235
cat /var/www/transfertsecur.com/.ssh/id_ed25519
```

Copie l'intégralité du contenu (y compris `-----BEGIN OPENSSH PRIVATE KEY-----` et `-----END OPENSSH PRIVATE KEY-----`)

## Comment ajouter les secrets

1. Va à: https://github.com/DevMick/TransferFlow/settings/secrets/actions
2. Clique "New repository secret"
3. Ajoute chaque secret:
   - **Name:** VPS_HOST
   - **Value:** (voir ci-dessus)
   - Clique "Add secret"
4. Répète pour VPS_USER et VPS_SSH_KEY

## Vérification

Une fois ajoutés, les secrets n'apparaîtront jamais en clair. Ils sont masqués dans les logs GitHub Actions.

Pour tester le déploiement:
1. Pousse un commit sur `main`
2. Va à: https://github.com/DevMick/TransferFlow/actions
3. Observe le workflow `Deploy to Production`
