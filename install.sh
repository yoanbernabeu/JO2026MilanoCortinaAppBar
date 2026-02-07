#!/bin/bash
set -euo pipefail

APP_NAME="JO 2026"
REPO="yoanbernabeu/JO2026"
INSTALL_DIR="/Applications"
TMP_DIR=$(mktemp -d)

cleanup() { rm -rf "$TMP_DIR"; }
trap cleanup EXIT

echo "==> Installation de ${APP_NAME}..."

# 1. Supprimer l'ancienne version si presente
if [ -d "${INSTALL_DIR}/${APP_NAME}.app" ]; then
  echo "==> Suppression de l'ancienne version..."
  rm -rf "${INSTALL_DIR}/${APP_NAME}.app"
fi

# 2. Recuperer l'URL du dernier .zip depuis GitHub Releases
echo "==> Recherche de la derniere release..."
DOWNLOAD_URL=$(curl -fsSL "https://api.github.com/repos/${REPO}/releases/latest" \
  | grep "browser_download_url.*mac.*\.zip" \
  | head -1 \
  | cut -d '"' -f 4)

if [ -z "$DOWNLOAD_URL" ]; then
  echo "Erreur : impossible de trouver le .zip dans la derniere release."
  exit 1
fi

# 3. Telecharger
echo "==> Telechargement..."
curl -fsSL -o "${TMP_DIR}/app.zip" "$DOWNLOAD_URL"

# 4. Decompresser
echo "==> Decompression..."
unzip -q "${TMP_DIR}/app.zip" -d "${TMP_DIR}"

# 5. Copier dans /Applications
echo "==> Installation dans ${INSTALL_DIR}..."
cp -R "${TMP_DIR}/${APP_NAME}.app" "${INSTALL_DIR}/"

# 6. Retirer la quarantaine (application non signee)
echo "==> Retrait de la quarantaine macOS..."
xattr -cr "${INSTALL_DIR}/${APP_NAME}.app"

echo ""
echo "==> ${APP_NAME} installe avec succes !"
echo "    Vous pouvez le lancer depuis ${INSTALL_DIR}/${APP_NAME}.app"
