# Deploying agenda-service on a Linux server

This guide reproduces the reference setup exactly: Debian 12 or Ubuntu 24.04, x86_64, nginx as reverse proxy with a certificate from Let's Encrypt (certbot), the service as a systemd unit under its own system user.

Replace `agenda.example.org` everywhere with your domain. All commands run as root on the server unless stated otherwise.

**What runs on the server.** One program, `agenda-service`, a single Go binary with the web application embedded. It is a relay (architecture, 8.1): it stores one file of encrypted lines per account in `/var/lib/agenda/accounts/` and hands it back. It holds no key, cannot read any journal, and needs no database, no Go installation and no repository checkout on the server. nginx terminates TLS and forwards requests to it.

## Overview

| Item | Value |
|---|---|
| Domain | `agenda.example.org`, DNS A (and AAAA, if IPv6) record pointing to the server |
| Reverse proxy | nginx, TLS by certbot, site file `/etc/nginx/sites-available/agenda.example.org` |
| Service | `/usr/local/bin/agenda-service`, systemd unit `agenda-service`, listens on `127.0.0.1:41380` only |
| System user | `agenda`, no login shell, home `/var/lib/agenda` |
| Data | `/var/lib/agenda/accounts/`: `<account>.enc` (encrypted lines), `<account>.enc.prev` (state before the last compaction), `<account>.seen` (day of last access) |
| Open ports | 22 (SSH), 80, 443 |

## 1. DNS

Create an A record (and AAAA for IPv6) for the domain pointing to the server. Check from any computer:

```
dig +short agenda.example.org
```

The answer must be the server's address.

## 2. Check what is already running

```
ss -tlnp | grep -E ':(80|443|41380)\b'
```

- Ports 80 and 443: if nginx is already running (e.g. for other sites), keep it and add the site in step 3. If another web server is running (Apache, Caddy), adapt step 3 and 7 to it; this guide assumes nginx.
- Port 41380: must be free for the service. If it is taken, choose another port and use it in the unit file (`-listen 127.0.0.1:<port>`) and in the proxy configuration (`proxy_pass`).

If nginx is not installed:

```
apt update && apt install -y nginx
```

## 3. Firewall

```
ufw allow OpenSSH
ufw allow 80,443/tcp
ufw enable
ufw status
```

If the server is behind the Hetzner Cloud Firewall (or another provider firewall), allow TCP 80 and 443 there as well.

## 4. Site with placeholder and certificate

Install the placeholder site (file in this repository: `deploy/nginx/agenda-placeholder.conf`):

```
cp agenda-placeholder.conf /etc/nginx/sites-available/agenda.example.org
sed -i 's/agenda.example.org/<your domain>/' /etc/nginx/sites-available/agenda.example.org
ln -s /etc/nginx/sites-available/agenda.example.org /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

Certificate (certbot adds a `listen 443` block and a redirect from HTTP to HTTPS to the site file, and renews automatically):

```
certbot --version || apt install -y certbot python3-certbot-nginx
certbot --nginx -d agenda.example.org
```

Check:

```
curl -I https://agenda.example.org/
```

Expected: `HTTP/1.1 503` with a valid certificate. DNS, firewall, nginx and TLS are then in place.

## 5. System user and data directory

```
useradd --system --home /var/lib/agenda --shell /usr/sbin/nologin agenda
mkdir -p /var/lib/agenda/accounts
chown -R agenda:agenda /var/lib/agenda
chmod 700 /var/lib/agenda/accounts
```

## 6. Build the binary

The binary is built from the current state of the repository on a computer with Go ≥ 1.22 and access to the repository, normally your own computer:

```
git clone https://github.com/outheis-labs/outheis-agenda.git
cd outheis-agenda
git pull            # when updating an existing checkout
```

In the repository root. The server architecture is shown by `uname -m` on the server: `x86_64` → `GOARCH=amd64`, `aarch64` → `GOARCH=arm64`.

```
go test ./...
GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -ldflags "-s -w" -o agenda-service-linux-amd64 ./server
```

The web client is embedded in the binary; nothing else needs to be copied. The server needs no Go installation.

## 7. Install the service and switch nginx to it

From your computer:

```
scp agenda-service-linux-amd64 deploy/agenda-service.service deploy/nginx/agenda-proxy.conf root@SERVER:/tmp/
```

On the server:

```
install -m 755 /tmp/agenda-service-linux-amd64 /usr/local/bin/agenda-service
install -m 644 /tmp/agenda-service.service /etc/systemd/system/agenda-service.service
systemctl daemon-reload
systemctl enable --now agenda-service
systemctl status agenda-service --no-pager
curl -sI http://127.0.0.1:41380/        # expected: 200
```

Then edit `/etc/nginx/sites-available/agenda.example.org`: in the `server` block with `listen 443`, replace

```
    location / {
        return 503 "agenda: service not yet running\n";
    }
```

by the content of `/tmp/agenda-proxy.conf`. Leave the lines certbot added (`ssl_certificate`, `include`, `listen 443`) unchanged. If the placeholder `location` also remains in the port-80 block, certbot has replaced it by a redirect; otherwise leave it as it is.

```
nginx -t && systemctl reload nginx
curl -I https://agenda.example.org/    # expected: 200
```

Open `https://agenda.example.org/` in a browser: the setup dialog asks for the server URL (prefilled) and offers *New account*. The service logs its start, storage errors and deleted inactive accounts:

```
journalctl -u agenda-service -n 20
```

Building on the server instead (optional): install Go ≥ 1.22 from https://go.dev/dl/ (the Debian package may be older), clone the repository (a private repository needs a deploy key or token), and run the build command of step 6 there; then continue with the `install` commands above, using the local file.

## 8. Backup

The server holds only encrypted files that cannot be read without the account phrase; there is no key on the server to back up. Copying `/var/lib/agenda/accounts/` daily to another machine protects against losing the files, for example:

```
rsync -a root@SERVER:/var/lib/agenda/accounts/ /backup/agenda-accounts/
```

Each user keeps their own phrase, and can export their encrypted journal at any time from the settings of the web application.

### 8a. Nightly versioned backup with restic (prepared, not yet deployed)

The service keeps its own daily backups of every journal (architecture 8.4c) and removes them when a journal is deleted (8.4b). A restic backup of the data directory is the administrator's copy against losing the server; it holds a deleted journal as long as its retention, so keep it short (`--keep-daily 7` is in line with the 7 days in which an owner can undo a deletion).

The files in `deploy/backup/` copy the account directory every night to one or more repositories with [restic](https://restic.net), keeping versions: 14 daily, 8 weekly, 12 monthly. Versions protect also against a client that writes a damaged or emptied journal, which a plain copy would overwrite. As the account files are encrypted by the clients, any storage provider can hold them; restic encrypts once more with its own repository password. Two targets with different providers are recommended, for example a Hetzner Storage Box and Backblaze B2.

What runs: `agenda-backup.timer` starts `agenda-backup.service` at about 03:17 (randomised by up to 20 minutes; a missed run is made up after a reboot). The service runs as the user `agenda` with read-only access to `/var/lib/agenda` and calls `agenda-backup.sh`, which for every file `/etc/agenda-backup/<name>.env` runs `restic backup`, `restic forget --prune` and `restic check`, and reports `<name>: ok` or `<name>: FAILED` in the journal (`journalctl -u agenda-backup`). A failing target does not stop the others.

1. Install restic and the files:

   ```
   apt install restic
   install -m 755 deploy/backup/agenda-backup.sh /usr/local/bin/agenda-backup
   install -m 644 deploy/backup/agenda-backup.service deploy/backup/agenda-backup.timer /etc/systemd/system/
   install -d -m 750 -o agenda -g agenda /etc/agenda-backup
   ```

2. One target per `.env` file, from the examples `storagebox.env.example` and `b2.env.example`; each with its own repository password (keep a copy of the passwords off the server, e.g. in a password manager — without it the repository cannot be read):

   ```
   openssl rand -base64 32 > /etc/agenda-backup/storagebox.password
   # edit /etc/agenda-backup/storagebox.env from the example
   chown agenda:agenda /etc/agenda-backup/*; chmod 600 /etc/agenda-backup/*
   ```

   For a Storage Box (SFTP, port 23): create a key for the service and give its public part to the Storage Box (Hetzner Robot, or `ssh-copy-id -p 23 -s`):

   ```
   sudo -u agenda ssh-keygen -t ed25519 -N '' -f /etc/agenda-backup/id_ed25519
   sudo -u agenda ssh -p 23 -i /etc/agenda-backup/id_ed25519 -o UserKnownHostsFile=/etc/agenda-backup/known_hosts u123456@u123456.your-storagebox.de exit
   ```

3. Initialise each repository once, then test and enable:

   ```
   sudo -u agenda sh -c 'set -a; . /etc/agenda-backup/storagebox.env; restic -o sftp.args="$RESTIC_SFTP_ARGS" init'
   sudo -u agenda sh -c 'set -a; . /etc/agenda-backup/b2.env; restic init'
   systemctl daemon-reload
   systemctl start agenda-backup && journalctl -u agenda-backup -n 20
   systemctl enable --now agenda-backup.timer
   ```

**Restoring.** List the versions and restore one into a new directory, then put the files back while the service is stopped:

```
sudo -u agenda sh -c 'set -a; . /etc/agenda-backup/b2.env; restic snapshots; restic restore latest --target /tmp/agenda-restore'
systemctl stop agenda-service
cp -a /tmp/agenda-restore/var/lib/agenda/accounts/. /var/lib/agenda/accounts/
systemctl start agenda-service
```

A single journal can also be restored without a server: its file `<account id>.enc` opens in the web application with *Settings → Work locally → Open local journal* and the account phrase. Changes made after the backup are not in the restored file.

## 9. Update

From your computer, after building (step 6):

```
scp agenda-service-linux-amd64 root@SERVER:/tmp/
ssh root@SERVER 'install -m 755 /tmp/agenda-service-linux-amd64 /usr/local/bin/agenda-service && systemctl restart agenda-service'
```

## 10. Logs and troubleshooting

```
journalctl -u agenda-service -f          # service
tail -f /var/log/nginx/error.log         # proxy
certbot renew --dry-run                  # certificate renewal
```

| Symptom | Cause |
|---|---|
| `502 Bad Gateway` | service not running or listening on another port than `proxy_pass` |
| `413 Request Entity Too Large` | `client_max_body_size` missing in the 443 block, or the account has reached 5 MB |
| `429 Too Many Requests` | rate limits of the service (architecture, 8.4) |
| certificate error | DNS not yet pointing to the server, or port 80 blocked during `certbot` |

## 11. Clients

| Client | Setup |
|---|---|
| Web application (Mac, iPhone, any browser) | open `https://agenda.example.org/`; on iPhone *Share → Add to Home Screen*; *New account* or *I have an account phrase* |
| iOS Shortcut (dictation) | last action *Open URLs* with `https://agenda.example.org/#add=` followed by the URL-encoded text; the web application encrypts and sends it |
| Local use without the server | in the web application *Open a local journal file*, with the phrase; the file is exported from *Settings → Export journal file* |
