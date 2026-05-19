# AdPartners.kz — Production Deploy

## 1. Buy domain
- Hoster.kz → register `adpartners.kz`.

## 2. Buy VPS
- Hoster.kz VPS — min 2 vCPU, 4GB RAM, 40GB SSD, Ubuntu 22.04.
- Note IPv4 address.

## 3. DNS
At registrar control panel:
```
A     @     <VPS_IP>
A     www   <VPS_IP>
```
Wait for propagation (`dig adpartners.kz`).

## 4. VPS bootstrap (SSH as root)
```bash
ssh root@<VPS_IP>
adduser deploy && usermod -aG sudo deploy
rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy
apt update && apt -y upgrade
apt -y install ca-certificates curl gnupg ufw git
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" > /etc/apt/sources.list.d/docker.list
apt update && apt -y install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
usermod -aG docker deploy
ufw allow OpenSSH && ufw allow 80 && ufw allow 443 && ufw --force enable
```

## 5. Clone + configure
```bash
su - deploy
git clone https://github.com/Satzhan7/diploma.git
cd diploma
cp .env.prod.example .env
nano .env   # strong DB_PASSWORD + JWT_SECRET (openssl rand -hex 32)
```

## 6. First cert (one-time, before nginx 443 block active)
Comment out `server { listen 443 ... }` block in `nginx/site.conf` for first boot, or use standalone:

```bash
mkdir -p certbot/www certbot/conf
docker run --rm -p 80:80 \
  -v $PWD/certbot/conf:/etc/letsencrypt \
  -v $PWD/certbot/www:/var/www/certbot \
  certbot/certbot certonly --standalone \
  -d adpartners.kz -d www.adpartners.kz \
  --email you@adpartners.kz --agree-tos --no-eff-email
```

Then restore 443 block.

## 7. Full stack up
```bash
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f nginx backend
```

Open: https://adpartners.kz

## 8. Updates
```bash
cd ~/diploma && git pull
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
```

## 9. DB backup (cron)
```
0 3 * * * docker exec adpartners_db pg_dump -U adpartners adpartners | gzip > /home/deploy/backups/db_$(date +\%F).sql.gz
```

## Ports
- 80, 443 → nginx (public)
- backend 3005, postgres 5432, frontend 80 → internal-only
