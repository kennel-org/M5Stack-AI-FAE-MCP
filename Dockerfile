# Dockerfile for M5Stack AI FAE MCP (Playwright + MCPサーバ)
FROM mcr.microsoft.com/playwright:v1.51.1-jammy

# 作業ディレクトリ設定
WORKDIR /app

# package.json, package-lock.json をコピーして依存解決を高速化
COPY package*.json ./

# 依存インストール
RUN npm install && \
    npx playwright install chromium

# プロジェクト全体をコピー
COPY . .

# MCPサーバをデフォルトで起動
CMD ["node", "mcp-server.js"]

# ポート公開
EXPOSE 3000
