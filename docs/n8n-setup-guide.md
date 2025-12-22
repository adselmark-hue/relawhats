# Guia de Configuração n8n - RelaWhats

Este guia detalha o processo completo de importação e configuração dos workflows n8n para o sistema RelaWhats.

## Pré-requisitos

- Acesso ao n8n: `https://n8n-n8n.5lgyrt.easypanel.host`
- Acesso ao Supabase: `https://hbmweepukkolpnqjahkw.supabase.co`
- Acesso ao Evolution API: `https://api.gzappw.com`
- Credenciais do Google Cloud Console
- Credenciais do Meta for Developers

---

## Parte 1: Configuração de Variáveis de Ambiente no n8n

Antes de importar os workflows, configure as variáveis de ambiente no n8n:

### Passo 1: Acessar Configurações do n8n

1. Acesse `https://n8n-n8n.5lgyrt.easypanel.host`
2. Vá em **Settings** → **Variables** (ou use Environment Variables no seu hosting)

### Passo 2: Adicionar Variáveis

Adicione as seguintes variáveis de ambiente:

| Variável | Descrição |
|----------|-----------|
| `WEBHOOK_SECRET` | Secret para validar webhooks (mesmo valor do Supabase) |
| `EVOLUTION_API_KEY` | API Key do Evolution API |
| `META_ACCESS_TOKEN` | Token de acesso do Meta (se disponível) |
| `META_APP_SECRET` | ⚠️ PENDENTE - Secret do App Meta |
| `GOOGLE_CLIENT_SECRET` | Client Secret do Google OAuth |
| `GOOGLE_ADS_DEVELOPER_TOKEN` | Developer Token do Google Ads |

---

## Parte 2: Importar Workflows

### Ordem de Importação (IMPORTANTE!)

1. **Config** (primeiro - obrigatório)
2. Renovação Token Google Ads
3. Sync Grupos WhatsApp
4. Webhook Status WhatsApp
5. WhatsApp Gerenciamento (Evolution API)
6. Coleta Métricas Google Ads
7. OAuth Google Ads
8. Renovação Token Meta (placeholder)
9. Verificação de Alertas
10. Envio Relatórios WhatsApp
11. Coleta Métricas Meta
12. OAuth Meta Ads (placeholder)

### Passo 1: Importar o Workflow Config

1. No n8n, clique em **+ Add Workflow**
2. Clique nos **3 pontos** → **Import from JSON**
3. Cole o JSON do workflow "Config" (do arquivo `docs/n8n-workflows.md`)
4. Salve o workflow
5. **COPIE O ID DO WORKFLOW** (aparece na URL: `/workflow/XXXXX`)

### Passo 2: Importar os Outros Workflows

Para cada workflow:

1. Importe o JSON
2. Localize o nó **"Buscar Config"**
3. Substitua `CONFIG_WORKFLOW_ID` pelo ID copiado no passo anterior
4. Salve e ative o workflow (exceto os marcados como PLACEHOLDER)

---

## Parte 3: Configuração do Evolution API

### Configurar Webhook de Status

No painel do Evolution API, configure o webhook para receber atualizações de status:

1. Acesse o painel do Evolution API
2. Vá em configurações da instância `gzappw`
3. Configure o webhook de eventos:

```
URL: https://n8n-n8n.5lgyrt.easypanel.host/webhook/whatsapp-status-callback
Eventos: connection.update, qrcode.updated, messages.upsert
```

---

## Parte 4: Configuração OAuth Google

### No Google Cloud Console

1. Acesse [Google Cloud Console](https://console.cloud.google.com)
2. Selecione seu projeto
3. Vá em **APIs & Services** → **Credentials**
4. Edite o OAuth 2.0 Client ID
5. Adicione a URI de redirecionamento:

```
https://n8n-n8n.5lgyrt.easypanel.host/webhook/google-oauth-callback
```

### Gerar URL de Autorização

Use esta URL para iniciar o fluxo OAuth (substitua `{ORGANIZATION_ID}`):

```
https://accounts.google.com/o/oauth2/v2/auth?
  client_id=832238390498-eoaflqn8eiv6g4tg4v3rskvs53r2usnq.apps.googleusercontent.com
  &redirect_uri=https://n8n-n8n.5lgyrt.easypanel.host/webhook/google-oauth-callback
  &response_type=code
  &scope=https://www.googleapis.com/auth/adwords
  &access_type=offline
  &prompt=consent
  &state={ORGANIZATION_ID}
```

---

## Parte 5: Configuração OAuth Meta (Quando META_APP_SECRET estiver disponível)

### No Meta for Developers

1. Acesse [Meta for Developers](https://developers.facebook.com)
2. Selecione seu app (ID: `1350562626022414`)
3. Vá em **Settings** → **Basic**
4. Copie o **App Secret** e adicione como `META_APP_SECRET`
5. Vá em **Facebook Login** → **Settings**
6. Adicione a URI de redirecionamento OAuth:

```
https://n8n-n8n.5lgyrt.easypanel.host/webhook/meta-oauth-callback
```

### Gerar URL de Autorização

Use esta URL para iniciar o fluxo OAuth (substitua `{ORGANIZATION_ID}`):

```
https://www.facebook.com/v18.0/dialog/oauth?
  client_id=1350562626022414
  &redirect_uri=https://n8n-n8n.5lgyrt.easypanel.host/webhook/meta-oauth-callback
  &scope=ads_management,ads_read,business_management
  &state={ORGANIZATION_ID}
```

---

## Parte 6: Testar Workflows

### Teste 1: Config

1. Abra o workflow Config
2. Clique em **Test Workflow**
3. Verifique se as variáveis estão sendo retornadas corretamente

### Teste 2: WhatsApp Management

```bash
curl -X POST https://n8n-n8n.5lgyrt.easypanel.host/webhook/whatsapp-management \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: SEU_WEBHOOK_SECRET" \
  -d '{
    "action": "status",
    "instance_name": "gzappw"
  }'
```

### Teste 3: Sync Grupos

```bash
curl -X POST https://n8n-n8n.5lgyrt.easypanel.host/webhook/whatsapp-sync-groups \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: SEU_WEBHOOK_SECRET" \
  -d '{
    "organization_id": "SEU_ORGANIZATION_ID"
  }'
```

---

## Checklist Final

### Workflows Ativados ✅

- [ ] Config
- [ ] Renovação Token Google Ads
- [ ] Sync Grupos WhatsApp
- [ ] Webhook Status WhatsApp
- [ ] WhatsApp Gerenciamento (Evolution API)
- [ ] Coleta Métricas Google Ads
- [ ] OAuth Google Ads
- [ ] Verificação de Alertas
- [ ] Envio Relatórios WhatsApp
- [ ] Coleta Métricas Meta

### Workflows Pendentes (precisam META_APP_SECRET) ⚠️

- [ ] Renovação Token Meta
- [ ] OAuth Meta Ads

### Configurações Externas ✅

- [ ] Evolution API webhook configurado
- [ ] Google OAuth redirect URI configurado
- [ ] Variáveis de ambiente do n8n configuradas

### Configurações Pendentes ⚠️

- [ ] Meta OAuth redirect URI (quando tiver META_APP_SECRET)
- [ ] META_APP_SECRET adicionado

---

## Troubleshooting

### Erro: "Unauthorized" nos webhooks

- Verifique se o `WEBHOOK_SECRET` está correto
- Verifique se o header `x-webhook-secret` está sendo enviado

### Erro: "Config workflow not found"

- Verifique se o workflow Config está ativo
- Verifique se o ID do workflow Config está correto nos outros workflows

### Erro: "Invalid token" no Google Ads

- Execute o fluxo OAuth novamente
- Verifique se o token foi salvo corretamente no Supabase

### Erro: Evolution API não conecta

- Verifique se a instância `gzappw` existe
- Verifique se a API Key está correta
- Verifique o status da instância no painel do Evolution

---

## Suporte

Para dúvidas ou problemas:
1. Verifique os logs de execução no n8n
2. Verifique os logs do Supabase Edge Functions
3. Teste cada componente individualmente antes de testar o fluxo completo
