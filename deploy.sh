#!/bin/bash
set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}==> Indo para /opt/sites/imoveishv5${NC}"
cd /opt/sites/imoveishv5

echo -e "${GREEN}==> Atualizando do GitHub${NC}"
git pull origin main

echo -e "${GREEN}==> Build da imagem Docker (sem cache)${NC}"
docker build --no-cache -t 127.0.0.1:5000/imoveishv5:latest . || {
    echo -e "${RED}Erro no build Docker${NC}"
    exit 1
}

echo -e "${GREEN}==> Push para registry local${NC}"
docker push 127.0.0.1:5000/imoveishv5:latest || {
    echo -e "${RED}Erro no push para registry${NC}"
    exit 1
}

echo -e "${GREEN}==> Atualizando serviço no Swarm${NC}"
docker service update --image 127.0.0.1:5000/imoveishv5:latest --force imoveishv5_web || {
    echo -e "${RED}Erro ao atualizar serviço${NC}"
    exit 1
}

echo -e "${YELLOW}==> Aguardando 5s para service estabilizar...${NC}"
sleep 5

# ============================================================
# Limpeza com timeout — nunca trava o script
# ============================================================
set +e  # Desabilitar set -e para a limpeza não matar o script

echo -e "${GREEN}==> Removendo imagens dangling (timeout 60s)${NC}"
timeout 60 docker image prune -f 2>/dev/null
if [ $? -eq 124 ]; then
    echo -e "${YELLOW}Aviso: limpeza de imagens excedeu 60s, abortada${NC}"
fi

echo -e "${GREEN}==> Removendo containers parados (timeout 30s)${NC}"
timeout 30 docker container prune -f 2>/dev/null
if [ $? -eq 124 ]; then
    echo -e "${YELLOW}Aviso: limpeza de containers excedeu 30s, abortada${NC}"
fi

echo -e "${GREEN}==> Removendo imagens sem tag antigas (timeout 60s)${NC}"
timeout 60 docker image prune -af --filter "until=24h" 2>/dev/null
if [ $? -eq 124 ]; then
    echo -e "${YELLOW}Aviso: limpeza de imagens antigas excedeu 60s, abortada${NC}"
fi

set -e  # Reabilitar set -e

echo -e "${GREEN}==> Status do serviço${NC}"
docker service ls
docker service ps imoveishv5_web --no-trunc 2>/dev/null | head -5

echo -e "${GREEN}==> Deploy concluído com sucesso!${NC}"
echo -e "${YELLOW}    Logs: docker service logs -f imoveishv5_web${NC}"
