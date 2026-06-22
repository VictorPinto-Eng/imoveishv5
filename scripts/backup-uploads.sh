#!/bin/bash
# ============================================================
# Backup do diretório de uploads (fotos de imóveis)
# Executar via cron no servidor: 0 3 * * * /opt/hv5-imoveis/scripts/backup-uploads.sh
# ============================================================

BACKUP_DIR="/opt/backups/hv5-uploads"
SOURCE_DIR="/opt/hv5-imoveis/public/uploads"
DATE=$(date +%Y-%m-%d_%H%M)
RETENTION_DAYS=30

# Criar diretório de backup se não existir
mkdir -p "$BACKUP_DIR"

# Backup incremental com rsync (só copia alterados)
rsync -a --delete "$SOURCE_DIR/" "$BACKUP_DIR/latest/"

# Snapshot compactado semanal (domingo)
if [ "$(date +%u)" -eq 7 ]; then
    tar -czf "$BACKUP_DIR/uploads_${DATE}.tar.gz" -C "$SOURCE_DIR" .
fi

# Limpar backups antigos (manter últimos 30 dias)
find "$BACKUP_DIR" -name "uploads_*.tar.gz" -mtime +$RETENTION_DAYS -delete

echo "[$(date)] Backup de uploads concluído"