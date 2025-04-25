# Docker Compose 部署

## Clone
```shell
git clone https://github.com/BingyanStudio/github-analyzer.git
cd github-analyzer/
cp .env.example .env
```
## 创建 Github App
在 [Github Apps](https://github.com/settings/apps) `New Github App`

- `Github App Name` 随意填写
- `Homepage URL` 如：http://localhost:8010
- `Callback URL` 如：http://localhost:8010/callback
- `Webhook` 取消勾选 `Active`

**权限选择**

Repository permissions:
  - Metadata: Read-only
  - Contents: Read-only

User permissions:
  - Events: Read-only
  - Profile: Read and write
    (你说得对，但是没有 Read-only 这个选项)

创建 App 并生成 Secret

## 填写环境变量

在 `.env` 中填入：
```ini
APP_ID=1234567 # Github App ID
PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----

-----END RSA PRIVATE KEY-----"
OAUTH_CLIENT_ID=1tIsAFaK3C1Ient1DplZ # Github Apps Client ID
OAUTH_CLIENT_SECRET=123456789abcdef123456789abcdef12345678 # Github Apps Client Secret
VITE_HOST=https://gitbox.hust.online # 域名，仅用于图片分享
```

填入自己的 OpenAI 兼容的接口、API_KEY 与模型名称
```ini
OPENAI_API_BASE_URL=https://openrouter.ai/api/v1
OPENAI_API_KEY=
OPENAI_MODEL=deepseek/deepseek-chat-v3-0324:free
```

其余环境变量无需修改

```shell
docker-compose up -d
```

服务将在 http://localhost:8010 启动
