# Workflows n8n - RelaWhats

Todos os workflows prontos para importar. Consulte `docs/n8n-setup-guide.md` para instruções.

## Variáveis

| Variável | Valor |
|----------|-------|
| SUPABASE_URL | https://hbmweepukkolpnqjahkw.supabase.co |
| SUPABASE_ANON_KEY | eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... |
| EVOLUTION_API_URL | https://api.gzappw.com |
| EVOLUTION_INSTANCE_NAME | gzappw |
| META_APP_ID | 1350562626022414 |
| GOOGLE_CLIENT_ID | 832238390498-eoaflqn8eiv6g4tg4v3rskvs53r2usnq.apps.googleusercontent.com |
| APP_URL | https://relawhats.lovable.app |
| N8N_BASE_URL | https://n8n-n8n.5lgyrt.easypanel.host |

---

## Workflow 0: Config

**IMPORTE PRIMEIRO** - Copie o ID após importar e use nos outros workflows.

```json
{
  "name": "Config",
  "nodes": [
    {
      "parameters": {},
      "id": "start",
      "name": "When Called by Another Workflow",
      "type": "n8n-nodes-base.executeWorkflowTrigger",
      "typeVersion": 1,
      "position": [250, 300]
    },
    {
      "parameters": {
        "mode": "raw",
        "jsonOutput": "={\n  \"SUPABASE_URL\": \"https://hbmweepukkolpnqjahkw.supabase.co\",\n  \"SUPABASE_ANON_KEY\": \"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhibXdlZXB1a2tvbHBucWphaGt3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzMTk5MTcsImV4cCI6MjA2NDg5NTkxN30.Xn7TQQST0lkeL3Qrfce1a6UV5gdAaAETPxrW22qABdU\",\n  \"WEBHOOK_SECRET\": \"{{ $env.WEBHOOK_SECRET }}\",\n  \"EVOLUTION_API_URL\": \"https://api.gzappw.com\",\n  \"EVOLUTION_API_KEY\": \"{{ $env.EVOLUTION_API_KEY }}\",\n  \"EVOLUTION_INSTANCE_NAME\": \"gzappw\",\n  \"META_ACCESS_TOKEN\": \"{{ $env.META_ACCESS_TOKEN }}\",\n  \"META_APP_ID\": \"1350562626022414\",\n  \"META_APP_SECRET\": \"{{ $env.META_APP_SECRET }}\",\n  \"GOOGLE_CLIENT_ID\": \"832238390498-eoaflqn8eiv6g4tg4v3rskvs53r2usnq.apps.googleusercontent.com\",\n  \"GOOGLE_CLIENT_SECRET\": \"{{ $env.GOOGLE_CLIENT_SECRET }}\",\n  \"GOOGLE_ADS_DEVELOPER_TOKEN\": \"{{ $env.GOOGLE_ADS_DEVELOPER_TOKEN }}\",\n  \"APP_URL\": \"https://relawhats.lovable.app\",\n  \"N8N_BASE_URL\": \"https://n8n-n8n.5lgyrt.easypanel.host\"\n}",
        "options": {}
      },
      "id": "config",
      "name": "Config Variables",
      "type": "n8n-nodes-base.set",
      "typeVersion": 3.4,
      "position": [450, 300]
    }
  ],
  "connections": {
    "When Called by Another Workflow": {
      "main": [[{"node": "Config Variables", "type": "main", "index": 0}]]
    }
  },
  "settings": {"executionOrder": "v1"}
}
```

---

## Workflow 1: Renovação Token Google Ads

**Trigger**: Schedule 45min | **Substitua**: `CONFIG_WORKFLOW_ID`

```json
{
  "name": "Renovação Token Google Ads",
  "nodes": [
    {
      "parameters": {"rule": {"interval": [{"field": "minutes", "minutesInterval": 45}]}},
      "id": "schedule",
      "name": "A cada 45 minutos",
      "type": "n8n-nodes-base.scheduleTrigger",
      "typeVersion": 1.2,
      "position": [250, 300]
    },
    {
      "parameters": {"workflowId": "CONFIG_WORKFLOW_ID", "options": {}},
      "id": "get-config",
      "name": "Buscar Config",
      "type": "n8n-nodes-base.executeWorkflow",
      "typeVersion": 1.1,
      "position": [450, 300]
    },
    {
      "parameters": {
        "method": "GET",
        "url": "={{ $json.SUPABASE_URL }}/rest/v1/ad_connections?platform=eq.google_ads&select=*",
        "sendHeaders": true,
        "headerParameters": {"parameters": [{"name": "apikey", "value": "={{ $json.SUPABASE_ANON_KEY }}"}]},
        "options": {}
      },
      "id": "fetch-connections",
      "name": "Buscar Conexões Google",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [650, 300]
    },
    {
      "parameters": {
        "conditions": {"conditions": [{"leftValue": "={{ $json.credentials?.expires_at }}", "rightValue": "={{ $now.plus({ hours: 1 }).toISO() }}", "operator": {"type": "dateTime", "operation": "before"}}]}
      },
      "id": "filter",
      "name": "Filtrar Tokens Expirando",
      "type": "n8n-nodes-base.filter",
      "typeVersion": 2,
      "position": [850, 300]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "https://oauth2.googleapis.com/token",
        "sendBody": true,
        "contentType": "form-urlencoded",
        "bodyParameters": {"parameters": [
          {"name": "client_id", "value": "={{ $('Buscar Config').item.json.GOOGLE_CLIENT_ID }}"},
          {"name": "client_secret", "value": "={{ $('Buscar Config').item.json.GOOGLE_CLIENT_SECRET }}"},
          {"name": "refresh_token", "value": "={{ $json.credentials.refresh_token }}"},
          {"name": "grant_type", "value": "refresh_token"}
        ]},
        "options": {}
      },
      "id": "refresh-token",
      "name": "Renovar Token",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [1050, 300]
    },
    {
      "parameters": {
        "method": "PATCH",
        "url": "={{ $('Buscar Config').item.json.SUPABASE_URL }}/rest/v1/ad_connections?id=eq.{{ $('Filtrar Tokens Expirando').item.json.id }}",
        "sendHeaders": true,
        "headerParameters": {"parameters": [
          {"name": "apikey", "value": "={{ $('Buscar Config').item.json.SUPABASE_ANON_KEY }}"},
          {"name": "Content-Type", "value": "application/json"}
        ]},
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={\n  \"credentials\": {\n    \"access_token\": \"{{ $json.access_token }}\",\n    \"refresh_token\": \"{{ $('Filtrar Tokens Expirando').item.json.credentials.refresh_token }}\",\n    \"expires_at\": \"{{ $now.plus({ seconds: $json.expires_in }).toISO() }}\"\n  }\n}",
        "options": {}
      },
      "id": "update-token",
      "name": "Atualizar Token",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [1250, 300]
    }
  ],
  "connections": {
    "A cada 45 minutos": {"main": [[{"node": "Buscar Config", "type": "main", "index": 0}]]},
    "Buscar Config": {"main": [[{"node": "Buscar Conexões Google", "type": "main", "index": 0}]]},
    "Buscar Conexões Google": {"main": [[{"node": "Filtrar Tokens Expirando", "type": "main", "index": 0}]]},
    "Filtrar Tokens Expirando": {"main": [[{"node": "Renovar Token", "type": "main", "index": 0}]]},
    "Renovar Token": {"main": [[{"node": "Atualizar Token", "type": "main", "index": 0}]]}
  },
  "settings": {"executionOrder": "v1"}
}
```

---

## Workflow 2: Sync Grupos WhatsApp

**Trigger**: Webhook POST `/whatsapp-sync-groups`

```json
{
  "name": "Sync Grupos WhatsApp",
  "nodes": [
    {
      "parameters": {"httpMethod": "POST", "path": "whatsapp-sync-groups", "options": {}},
      "id": "webhook",
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2,
      "position": [250, 300],
      "webhookId": "whatsapp-sync-groups"
    },
    {
      "parameters": {"workflowId": "CONFIG_WORKFLOW_ID", "options": {}},
      "id": "get-config",
      "name": "Buscar Config",
      "type": "n8n-nodes-base.executeWorkflow",
      "typeVersion": 1.1,
      "position": [450, 300]
    },
    {
      "parameters": {
        "conditions": {"conditions": [{"leftValue": "={{ $('Webhook').item.json.headers['x-webhook-secret'] }}", "rightValue": "={{ $json.WEBHOOK_SECRET }}", "operator": {"type": "string", "operation": "equals"}}]}
      },
      "id": "validate",
      "name": "Validar Secret",
      "type": "n8n-nodes-base.if",
      "typeVersion": 2,
      "position": [650, 300]
    },
    {
      "parameters": {
        "method": "GET",
        "url": "={{ $('Buscar Config').item.json.EVOLUTION_API_URL }}/group/fetchAllGroups/{{ $('Buscar Config').item.json.EVOLUTION_INSTANCE_NAME }}?getParticipants=false",
        "sendHeaders": true,
        "headerParameters": {"parameters": [{"name": "apikey", "value": "={{ $('Buscar Config').item.json.EVOLUTION_API_KEY }}"}]},
        "options": {}
      },
      "id": "fetch-groups",
      "name": "Buscar Grupos Evolution",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [850, 200]
    },
    {
      "parameters": {
        "jsCode": "const groups = $input.all();\nconst orgId = $('Webhook').item.json.body.organization_id;\n\nreturn groups.map(group => ({\n  json: {\n    whatsapp_group_id: group.json.id,\n    organization_id: orgId,\n    name: group.json.subject,\n    participant_count: group.json.size || 0,\n    is_active: true,\n    synced_at: new Date().toISOString()\n  }\n}));"
      },
      "id": "map-groups",
      "name": "Mapear Grupos",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [1050, 200]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "={{ $('Buscar Config').item.json.SUPABASE_URL }}/rest/v1/whatsapp_groups",
        "sendHeaders": true,
        "headerParameters": {"parameters": [
          {"name": "apikey", "value": "={{ $('Buscar Config').item.json.SUPABASE_ANON_KEY }}"},
          {"name": "Prefer", "value": "resolution=merge-duplicates"}
        ]},
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={{ JSON.stringify($json) }}",
        "options": {}
      },
      "id": "upsert-groups",
      "name": "Upsert Grupos",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [1250, 200]
    },
    {
      "parameters": {"respondWith": "json", "responseBody": "={\"success\":true}", "options": {}},
      "id": "success",
      "name": "Sucesso",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1.1,
      "position": [1450, 200]
    },
    {
      "parameters": {"respondWith": "json", "responseBody": "={\"error\":\"Unauthorized\"}", "options": {"responseCode": 401}},
      "id": "error",
      "name": "Erro",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1.1,
      "position": [850, 400]
    }
  ],
  "connections": {
    "Webhook": {"main": [[{"node": "Buscar Config", "type": "main", "index": 0}]]},
    "Buscar Config": {"main": [[{"node": "Validar Secret", "type": "main", "index": 0}]]},
    "Validar Secret": {"main": [[{"node": "Buscar Grupos Evolution", "type": "main", "index": 0}], [{"node": "Erro", "type": "main", "index": 0}]]},
    "Buscar Grupos Evolution": {"main": [[{"node": "Mapear Grupos", "type": "main", "index": 0}]]},
    "Mapear Grupos": {"main": [[{"node": "Upsert Grupos", "type": "main", "index": 0}]]},
    "Upsert Grupos": {"main": [[{"node": "Sucesso", "type": "main", "index": 0}]]}
  },
  "settings": {"executionOrder": "v1"}
}
```

---

## Workflow 3: Webhook Status WhatsApp

**Trigger**: Webhook POST `/whatsapp-status-callback`

```json
{
  "name": "Webhook Status WhatsApp",
  "nodes": [
    {
      "parameters": {"httpMethod": "POST", "path": "whatsapp-status-callback", "options": {}},
      "id": "webhook",
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2,
      "position": [250, 300],
      "webhookId": "whatsapp-status-callback"
    },
    {
      "parameters": {"workflowId": "CONFIG_WORKFLOW_ID", "options": {}},
      "id": "get-config",
      "name": "Buscar Config",
      "type": "n8n-nodes-base.executeWorkflow",
      "typeVersion": 1.1,
      "position": [450, 300]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "={{ $('Buscar Config').item.json.SUPABASE_URL }}/functions/v1/webhook-whatsapp",
        "sendHeaders": true,
        "headerParameters": {"parameters": [{"name": "Authorization", "value": "Bearer {{ $('Buscar Config').item.json.SUPABASE_ANON_KEY }}"}]},
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={{ JSON.stringify($('Webhook').item.json.body) }}",
        "options": {}
      },
      "id": "forward",
      "name": "Enviar ao Supabase",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [650, 300]
    },
    {
      "parameters": {"respondWith": "json", "responseBody": "={\"success\":true}", "options": {}},
      "id": "response",
      "name": "OK",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1.1,
      "position": [850, 300]
    }
  ],
  "connections": {
    "Webhook": {"main": [[{"node": "Buscar Config", "type": "main", "index": 0}]]},
    "Buscar Config": {"main": [[{"node": "Enviar ao Supabase", "type": "main", "index": 0}]]},
    "Enviar ao Supabase": {"main": [[{"node": "OK", "type": "main", "index": 0}]]}
  },
  "settings": {"executionOrder": "v1"}
}
```

---

## Workflow 4: WhatsApp Gerenciamento

**Trigger**: Webhook POST `/whatsapp-management`

```json
{
  "name": "WhatsApp Gerenciamento",
  "nodes": [
    {
      "parameters": {"httpMethod": "POST", "path": "whatsapp-management", "options": {}},
      "id": "webhook",
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2,
      "position": [250, 300],
      "webhookId": "whatsapp-management"
    },
    {
      "parameters": {"workflowId": "CONFIG_WORKFLOW_ID", "options": {}},
      "id": "get-config",
      "name": "Buscar Config",
      "type": "n8n-nodes-base.executeWorkflow",
      "typeVersion": 1.1,
      "position": [450, 300]
    },
    {
      "parameters": {
        "conditions": {"conditions": [{"leftValue": "={{ $('Webhook').item.json.headers['x-webhook-secret'] }}", "rightValue": "={{ $json.WEBHOOK_SECRET }}", "operator": {"type": "string", "operation": "equals"}}]}
      },
      "id": "validate",
      "name": "Validar",
      "type": "n8n-nodes-base.if",
      "typeVersion": 2,
      "position": [650, 300]
    },
    {
      "parameters": {
        "rules": {"rules": [
          {"value": "create", "outputKey": "create"},
          {"value": "qrcode", "outputKey": "qrcode"},
          {"value": "status", "outputKey": "status"},
          {"value": "delete", "outputKey": "delete"},
          {"value": "logout", "outputKey": "logout"},
          {"value": "restart", "outputKey": "restart"}
        ]},
        "fallbackOutput": "extra"
      },
      "id": "switch",
      "name": "Switch Action",
      "type": "n8n-nodes-base.switch",
      "typeVersion": 3,
      "position": [900, 200]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "={{ $('Buscar Config').item.json.EVOLUTION_API_URL }}/instance/create",
        "sendHeaders": true,
        "headerParameters": {"parameters": [{"name": "apikey", "value": "={{ $('Buscar Config').item.json.EVOLUTION_API_KEY }}"}]},
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={\n  \"instanceName\": \"{{ $('Webhook').item.json.body.instance_name }}\",\n  \"integration\": \"WHATSAPP-BAILEYS\",\n  \"qrcode\": true,\n  \"webhook\": {\n    \"url\": \"{{ $('Buscar Config').item.json.N8N_BASE_URL }}/webhook/whatsapp-status-callback\",\n    \"events\": [\"connection.update\", \"qrcode.updated\"]\n  }\n}",
        "options": {}
      },
      "id": "create",
      "name": "Criar Instância",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [1150, 50]
    },
    {
      "parameters": {
        "method": "GET",
        "url": "={{ $('Buscar Config').item.json.EVOLUTION_API_URL }}/instance/connect/{{ $('Webhook').item.json.body.instance_name }}",
        "sendHeaders": true,
        "headerParameters": {"parameters": [{"name": "apikey", "value": "={{ $('Buscar Config').item.json.EVOLUTION_API_KEY }}"}]},
        "options": {}
      },
      "id": "qrcode",
      "name": "Buscar QR Code",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [1150, 150]
    },
    {
      "parameters": {
        "method": "GET",
        "url": "={{ $('Buscar Config').item.json.EVOLUTION_API_URL }}/instance/connectionState/{{ $('Webhook').item.json.body.instance_name }}",
        "sendHeaders": true,
        "headerParameters": {"parameters": [{"name": "apikey", "value": "={{ $('Buscar Config').item.json.EVOLUTION_API_KEY }}"}]},
        "options": {}
      },
      "id": "status",
      "name": "Buscar Status",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [1150, 250]
    },
    {
      "parameters": {
        "method": "DELETE",
        "url": "={{ $('Buscar Config').item.json.EVOLUTION_API_URL }}/instance/delete/{{ $('Webhook').item.json.body.instance_name }}",
        "sendHeaders": true,
        "headerParameters": {"parameters": [{"name": "apikey", "value": "={{ $('Buscar Config').item.json.EVOLUTION_API_KEY }}"}]},
        "options": {}
      },
      "id": "delete",
      "name": "Deletar",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [1150, 350]
    },
    {
      "parameters": {
        "method": "DELETE",
        "url": "={{ $('Buscar Config').item.json.EVOLUTION_API_URL }}/instance/logout/{{ $('Webhook').item.json.body.instance_name }}",
        "sendHeaders": true,
        "headerParameters": {"parameters": [{"name": "apikey", "value": "={{ $('Buscar Config').item.json.EVOLUTION_API_KEY }}"}]},
        "options": {}
      },
      "id": "logout",
      "name": "Logout",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [1150, 450]
    },
    {
      "parameters": {
        "method": "PUT",
        "url": "={{ $('Buscar Config').item.json.EVOLUTION_API_URL }}/instance/restart/{{ $('Webhook').item.json.body.instance_name }}",
        "sendHeaders": true,
        "headerParameters": {"parameters": [{"name": "apikey", "value": "={{ $('Buscar Config').item.json.EVOLUTION_API_KEY }}"}]},
        "options": {}
      },
      "id": "restart",
      "name": "Reiniciar",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [1150, 550]
    },
    {
      "parameters": {"respondWith": "json", "responseBody": "={{ JSON.stringify($json) }}", "options": {}},
      "id": "response",
      "name": "Resposta",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1.1,
      "position": [1400, 250]
    },
    {
      "parameters": {"respondWith": "json", "responseBody": "={\"error\":\"Unauthorized\"}", "options": {"responseCode": 401}},
      "id": "error",
      "name": "Erro",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1.1,
      "position": [900, 450]
    },
    {
      "parameters": {"respondWith": "json", "responseBody": "={\"error\":\"Invalid action\"}", "options": {"responseCode": 400}},
      "id": "invalid",
      "name": "Ação Inválida",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1.1,
      "position": [1150, 650]
    }
  ],
  "connections": {
    "Webhook": {"main": [[{"node": "Buscar Config", "type": "main", "index": 0}]]},
    "Buscar Config": {"main": [[{"node": "Validar", "type": "main", "index": 0}]]},
    "Validar": {"main": [[{"node": "Switch Action", "type": "main", "index": 0}], [{"node": "Erro", "type": "main", "index": 0}]]},
    "Switch Action": {"main": [
      [{"node": "Criar Instância", "type": "main", "index": 0}],
      [{"node": "Buscar QR Code", "type": "main", "index": 0}],
      [{"node": "Buscar Status", "type": "main", "index": 0}],
      [{"node": "Deletar", "type": "main", "index": 0}],
      [{"node": "Logout", "type": "main", "index": 0}],
      [{"node": "Reiniciar", "type": "main", "index": 0}],
      [{"node": "Ação Inválida", "type": "main", "index": 0}]
    ]},
    "Criar Instância": {"main": [[{"node": "Resposta", "type": "main", "index": 0}]]},
    "Buscar QR Code": {"main": [[{"node": "Resposta", "type": "main", "index": 0}]]},
    "Buscar Status": {"main": [[{"node": "Resposta", "type": "main", "index": 0}]]},
    "Deletar": {"main": [[{"node": "Resposta", "type": "main", "index": 0}]]},
    "Logout": {"main": [[{"node": "Resposta", "type": "main", "index": 0}]]},
    "Reiniciar": {"main": [[{"node": "Resposta", "type": "main", "index": 0}]]}
  },
  "settings": {"executionOrder": "v1"}
}
```

---

## Workflow 5: Coleta Métricas Google Ads

**Trigger**: Schedule 1 hora

```json
{
  "name": "Coleta Métricas Google Ads",
  "nodes": [
    {
      "parameters": {"rule": {"interval": [{"field": "hours", "hoursInterval": 1}]}},
      "id": "schedule",
      "name": "A cada hora",
      "type": "n8n-nodes-base.scheduleTrigger",
      "typeVersion": 1.2,
      "position": [250, 300]
    },
    {
      "parameters": {"workflowId": "CONFIG_WORKFLOW_ID", "options": {}},
      "id": "get-config",
      "name": "Buscar Config",
      "type": "n8n-nodes-base.executeWorkflow",
      "typeVersion": 1.1,
      "position": [450, 300]
    },
    {
      "parameters": {
        "method": "GET",
        "url": "={{ $json.SUPABASE_URL }}/rest/v1/ad_connections?platform=eq.google_ads&status=eq.active&select=*",
        "sendHeaders": true,
        "headerParameters": {"parameters": [{"name": "apikey", "value": "={{ $json.SUPABASE_ANON_KEY }}"}]},
        "options": {}
      },
      "id": "fetch-connections",
      "name": "Buscar Conexões",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [650, 300]
    },
    {
      "parameters": {
        "method": "GET",
        "url": "={{ $('Buscar Config').item.json.SUPABASE_URL }}/rest/v1/ad_accounts?connection_id=eq.{{ $json.id }}&is_active=eq.true&select=*",
        "sendHeaders": true,
        "headerParameters": {"parameters": [{"name": "apikey", "value": "={{ $('Buscar Config').item.json.SUPABASE_ANON_KEY }}"}]},
        "options": {}
      },
      "id": "fetch-accounts",
      "name": "Buscar Contas",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [850, 300]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "https://googleads.googleapis.com/v15/customers/{{ $json.platform_account_id.replace(/-/g, '') }}/googleAds:searchStream",
        "sendHeaders": true,
        "headerParameters": {"parameters": [
          {"name": "Authorization", "value": "Bearer {{ $('Buscar Conexões').item.json.credentials.access_token }}"},
          {"name": "developer-token", "value": "={{ $('Buscar Config').item.json.GOOGLE_ADS_DEVELOPER_TOKEN }}"},
          {"name": "login-customer-id", "value": "={{ $('Buscar Conexões').item.json.credentials.manager_id || $json.platform_account_id.replace(/-/g, '') }}"}
        ]},
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={\"query\": \"SELECT campaign.id, campaign.name, metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions, metrics.conversions_value FROM campaign WHERE segments.date DURING TODAY\"}",
        "options": {}
      },
      "id": "fetch-metrics",
      "name": "Buscar Métricas",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [1050, 300]
    },
    {
      "parameters": {
        "jsCode": "const results = $input.all();\nconst account = $('Buscar Contas').item.json;\nconst today = new Date().toISOString().split('T')[0];\n\nlet allMetrics = [];\nfor (const result of results) {\n  if (result.json && result.json.results) {\n    for (const row of result.json.results) {\n      const campaign = row.campaign || {};\n      const metrics = row.metrics || {};\n      const impressions = parseInt(metrics.impressions || 0);\n      const clicks = parseInt(metrics.clicks || 0);\n      const spend = parseFloat(metrics.costMicros || 0) / 1000000;\n      const conversions = parseFloat(metrics.conversions || 0);\n      const convValue = parseFloat(metrics.conversionsValue || 0);\n      \n      allMetrics.push({\n        ad_account_id: account.id,\n        campaign_id: campaign.id || null,\n        campaign_name: campaign.name || null,\n        date: today,\n        impressions, clicks, spend, conversions,\n        conversion_value: convValue,\n        reach: 0,\n        cpc: clicks > 0 ? spend / clicks : 0,\n        cpm: impressions > 0 ? (spend / impressions) * 1000 : 0,\n        ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,\n        roas: spend > 0 ? convValue / spend : 0\n      });\n    }\n  }\n}\nreturn allMetrics.map(m => ({ json: m }));"
      },
      "id": "process",
      "name": "Processar",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [1250, 300]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "={{ $('Buscar Config').item.json.SUPABASE_URL }}/rest/v1/ad_metrics",
        "sendHeaders": true,
        "headerParameters": {"parameters": [
          {"name": "apikey", "value": "={{ $('Buscar Config').item.json.SUPABASE_ANON_KEY }}"},
          {"name": "Prefer", "value": "resolution=merge-duplicates"}
        ]},
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={{ JSON.stringify($json) }}",
        "options": {}
      },
      "id": "save",
      "name": "Salvar",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [1450, 300]
    }
  ],
  "connections": {
    "A cada hora": {"main": [[{"node": "Buscar Config", "type": "main", "index": 0}]]},
    "Buscar Config": {"main": [[{"node": "Buscar Conexões", "type": "main", "index": 0}]]},
    "Buscar Conexões": {"main": [[{"node": "Buscar Contas", "type": "main", "index": 0}]]},
    "Buscar Contas": {"main": [[{"node": "Buscar Métricas", "type": "main", "index": 0}]]},
    "Buscar Métricas": {"main": [[{"node": "Processar", "type": "main", "index": 0}]]},
    "Processar": {"main": [[{"node": "Salvar", "type": "main", "index": 0}]]}
  },
  "settings": {"executionOrder": "v1"}
}
```

---

## Workflow 6: OAuth Google Ads

**Trigger**: Webhook GET `/google-oauth-callback`

```json
{
  "name": "OAuth Google Ads",
  "nodes": [
    {
      "parameters": {"httpMethod": "GET", "path": "google-oauth-callback", "options": {}},
      "id": "webhook",
      "name": "OAuth Callback",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2,
      "position": [250, 300],
      "webhookId": "google-oauth-callback"
    },
    {
      "parameters": {"workflowId": "CONFIG_WORKFLOW_ID", "options": {}},
      "id": "get-config",
      "name": "Buscar Config",
      "type": "n8n-nodes-base.executeWorkflow",
      "typeVersion": 1.1,
      "position": [450, 300]
    },
    {
      "parameters": {
        "conditions": {"conditions": [{"leftValue": "={{ $('OAuth Callback').item.json.query.code }}", "rightValue": "", "operator": {"type": "string", "operation": "notEmpty"}}]}
      },
      "id": "validate",
      "name": "Tem Código?",
      "type": "n8n-nodes-base.if",
      "typeVersion": 2,
      "position": [650, 300]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "https://oauth2.googleapis.com/token",
        "sendBody": true,
        "contentType": "form-urlencoded",
        "bodyParameters": {"parameters": [
          {"name": "code", "value": "={{ $('OAuth Callback').item.json.query.code }}"},
          {"name": "client_id", "value": "={{ $('Buscar Config').item.json.GOOGLE_CLIENT_ID }}"},
          {"name": "client_secret", "value": "={{ $('Buscar Config').item.json.GOOGLE_CLIENT_SECRET }}"},
          {"name": "redirect_uri", "value": "={{ $('Buscar Config').item.json.N8N_BASE_URL }}/webhook/google-oauth-callback"},
          {"name": "grant_type", "value": "authorization_code"}
        ]},
        "options": {}
      },
      "id": "exchange",
      "name": "Trocar Código",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [900, 200]
    },
    {
      "parameters": {
        "method": "GET",
        "url": "https://googleads.googleapis.com/v15/customers:listAccessibleCustomers",
        "sendHeaders": true,
        "headerParameters": {"parameters": [
          {"name": "Authorization", "value": "Bearer {{ $json.access_token }}"},
          {"name": "developer-token", "value": "={{ $('Buscar Config').item.json.GOOGLE_ADS_DEVELOPER_TOKEN }}"}
        ]},
        "options": {}
      },
      "id": "list-customers",
      "name": "Listar Contas",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [1100, 200]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "={{ $('Buscar Config').item.json.SUPABASE_URL }}/rest/v1/ad_connections",
        "sendHeaders": true,
        "headerParameters": {"parameters": [
          {"name": "apikey", "value": "={{ $('Buscar Config').item.json.SUPABASE_ANON_KEY }}"},
          {"name": "Prefer", "value": "return=representation"}
        ]},
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={\n  \"organization_id\": \"{{ $('OAuth Callback').item.json.query.state }}\",\n  \"platform\": \"google_ads\",\n  \"name\": \"Google Ads\",\n  \"status\": \"active\",\n  \"credentials\": {\n    \"access_token\": \"{{ $('Trocar Código').item.json.access_token }}\",\n    \"refresh_token\": \"{{ $('Trocar Código').item.json.refresh_token }}\",\n    \"expires_at\": \"{{ $now.plus({ seconds: $('Trocar Código').item.json.expires_in }).toISO() }}\"\n  }\n}",
        "options": {}
      },
      "id": "create-connection",
      "name": "Criar Conexão",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [1300, 200]
    },
    {
      "parameters": {
        "jsCode": "const connection = $('Criar Conexão').item.json[0];\nconst customers = $('Listar Contas').item.json.resourceNames || [];\n\nreturn customers.map(r => ({\n  json: {\n    connection_id: connection.id,\n    platform: 'google_ads',\n    platform_account_id: r.replace('customers/', ''),\n    name: `Conta ${r.replace('customers/', '')}`,\n    is_active: true\n  }\n}));"
      },
      "id": "map-accounts",
      "name": "Mapear Contas",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [1500, 200]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "={{ $('Buscar Config').item.json.SUPABASE_URL }}/rest/v1/ad_accounts",
        "sendHeaders": true,
        "headerParameters": {"parameters": [
          {"name": "apikey", "value": "={{ $('Buscar Config').item.json.SUPABASE_ANON_KEY }}"},
          {"name": "Prefer", "value": "resolution=merge-duplicates"}
        ]},
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={{ JSON.stringify($json) }}",
        "options": {}
      },
      "id": "save-accounts",
      "name": "Salvar Contas",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [1700, 200]
    },
    {
      "parameters": {"respondWith": "redirect", "redirectURL": "={{ $('Buscar Config').item.json.APP_URL }}/connections?success=google", "options": {}},
      "id": "success",
      "name": "Sucesso",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1.1,
      "position": [1900, 200]
    },
    {
      "parameters": {"respondWith": "redirect", "redirectURL": "={{ $('Buscar Config').item.json.APP_URL }}/connections?error=google_oauth_failed", "options": {}},
      "id": "error",
      "name": "Erro",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1.1,
      "position": [900, 400]
    }
  ],
  "connections": {
    "OAuth Callback": {"main": [[{"node": "Buscar Config", "type": "main", "index": 0}]]},
    "Buscar Config": {"main": [[{"node": "Tem Código?", "type": "main", "index": 0}]]},
    "Tem Código?": {"main": [[{"node": "Trocar Código", "type": "main", "index": 0}], [{"node": "Erro", "type": "main", "index": 0}]]},
    "Trocar Código": {"main": [[{"node": "Listar Contas", "type": "main", "index": 0}]]},
    "Listar Contas": {"main": [[{"node": "Criar Conexão", "type": "main", "index": 0}]]},
    "Criar Conexão": {"main": [[{"node": "Mapear Contas", "type": "main", "index": 0}]]},
    "Mapear Contas": {"main": [[{"node": "Salvar Contas", "type": "main", "index": 0}]]},
    "Salvar Contas": {"main": [[{"node": "Sucesso", "type": "main", "index": 0}]]}
  },
  "settings": {"executionOrder": "v1"}
}
```

---

## Workflow 7: Renovação Token Meta (PLACEHOLDER)

⚠️ **AGUARDANDO META_APP_SECRET**

```json
{
  "name": "Renovação Token Meta (PLACEHOLDER)",
  "nodes": [
    {
      "parameters": {"rule": {"interval": [{"field": "days", "triggerAtHour": 3}]}},
      "id": "schedule",
      "name": "Diariamente às 3h",
      "type": "n8n-nodes-base.scheduleTrigger",
      "typeVersion": 1.2,
      "position": [250, 300]
    },
    {
      "parameters": {"workflowId": "CONFIG_WORKFLOW_ID", "options": {}},
      "id": "get-config",
      "name": "Buscar Config",
      "type": "n8n-nodes-base.executeWorkflow",
      "typeVersion": 1.1,
      "position": [450, 300]
    },
    {
      "parameters": {"content": "## PLACEHOLDER\n\nPrecisa do META_APP_SECRET.\n\n1. Buscar conexões Meta\n2. Trocar token via Graph API\n3. Atualizar no Supabase", "height": 200, "width": 300},
      "id": "note",
      "name": "Nota",
      "type": "n8n-nodes-base.stickyNote",
      "typeVersion": 1,
      "position": [650, 250]
    }
  ],
  "connections": {
    "Diariamente às 3h": {"main": [[{"node": "Buscar Config", "type": "main", "index": 0}]]}
  },
  "settings": {"executionOrder": "v1"}
}
```

---

## Workflow 8: Verificação de Alertas

**Trigger**: Schedule 30min

```json
{
  "name": "Verificação de Alertas",
  "nodes": [
    {
      "parameters": {"rule": {"interval": [{"field": "minutes", "minutesInterval": 30}]}},
      "id": "schedule",
      "name": "A cada 30 minutos",
      "type": "n8n-nodes-base.scheduleTrigger",
      "typeVersion": 1.2,
      "position": [250, 300]
    },
    {
      "parameters": {"workflowId": "CONFIG_WORKFLOW_ID", "options": {}},
      "id": "get-config",
      "name": "Buscar Config",
      "type": "n8n-nodes-base.executeWorkflow",
      "typeVersion": 1.1,
      "position": [450, 300]
    },
    {
      "parameters": {
        "method": "GET",
        "url": "={{ $json.SUPABASE_URL }}/rest/v1/alerts?is_active=eq.true&select=*,ad_accounts(*)",
        "sendHeaders": true,
        "headerParameters": {"parameters": [{"name": "apikey", "value": "={{ $json.SUPABASE_ANON_KEY }}"}]},
        "options": {}
      },
      "id": "fetch-alerts",
      "name": "Buscar Alertas",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [650, 300]
    },
    {
      "parameters": {
        "method": "GET",
        "url": "={{ $('Buscar Config').item.json.SUPABASE_URL }}/rest/v1/ad_metrics?ad_account_id=eq.{{ $json.ad_account_id }}&date=eq.{{ $now.toFormat('yyyy-MM-dd') }}&select=*&order=created_at.desc&limit=1",
        "sendHeaders": true,
        "headerParameters": {"parameters": [{"name": "apikey", "value": "={{ $('Buscar Config').item.json.SUPABASE_ANON_KEY }}"}]},
        "options": {}
      },
      "id": "fetch-metrics",
      "name": "Buscar Métricas",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [850, 300]
    },
    {
      "parameters": {
        "jsCode": "const alert = $('Buscar Alertas').item.json;\nconst metrics = $input.first().json[0];\nif (!metrics) return [{json:{triggered:false}}];\n\nconst val = metrics[alert.metric];\nlet triggered = false;\nswitch (alert.condition) {\n  case 'greater_than': triggered = val > alert.threshold; break;\n  case 'less_than': triggered = val < alert.threshold; break;\n  case 'equals': triggered = val === alert.threshold; break;\n}\nreturn [{json:{triggered,alert,current_value:val,threshold:alert.threshold,metric:alert.metric,account_name:alert.ad_accounts?.name||'Conta'}}];"
      },
      "id": "check",
      "name": "Verificar",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [1050, 300]
    },
    {
      "parameters": {
        "conditions": {"conditions": [{"leftValue": "={{ $json.triggered }}", "rightValue": true, "operator": {"type": "boolean", "operation": "equals"}}]}
      },
      "id": "filter",
      "name": "Disparado?",
      "type": "n8n-nodes-base.if",
      "typeVersion": 2,
      "position": [1250, 300]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "={{ $('Buscar Config').item.json.EVOLUTION_API_URL }}/message/sendText/{{ $('Buscar Config').item.json.EVOLUTION_INSTANCE_NAME }}",
        "sendHeaders": true,
        "headerParameters": {"parameters": [{"name": "apikey", "value": "={{ $('Buscar Config').item.json.EVOLUTION_API_KEY }}"}]},
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={\n  \"number\": \"{{ $json.alert.notification_phone }}\",\n  \"text\": \"🚨 *ALERTA: {{ $json.alert.name }}*\\n\\n📊 Conta: {{ $json.account_name }}\\n📈 Métrica: {{ $json.metric }}\\n💰 Valor: {{ $json.current_value }}\\n🎯 Threshold: {{ $json.threshold }}\"\n}",
        "options": {}
      },
      "id": "send",
      "name": "Enviar WhatsApp",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [1450, 200]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "={{ $('Buscar Config').item.json.SUPABASE_URL }}/rest/v1/alert_history",
        "sendHeaders": true,
        "headerParameters": {"parameters": [{"name": "apikey", "value": "={{ $('Buscar Config').item.json.SUPABASE_ANON_KEY }}"}]},
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={\"alert_id\":\"{{ $('Verificar').item.json.alert.id }}\",\"triggered_value\":{{ $('Verificar').item.json.current_value }},\"triggered_at\":\"{{ $now.toISO() }}\"}",
        "options": {}
      },
      "id": "log",
      "name": "Registrar",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [1650, 200]
    }
  ],
  "connections": {
    "A cada 30 minutos": {"main": [[{"node": "Buscar Config", "type": "main", "index": 0}]]},
    "Buscar Config": {"main": [[{"node": "Buscar Alertas", "type": "main", "index": 0}]]},
    "Buscar Alertas": {"main": [[{"node": "Buscar Métricas", "type": "main", "index": 0}]]},
    "Buscar Métricas": {"main": [[{"node": "Verificar", "type": "main", "index": 0}]]},
    "Verificar": {"main": [[{"node": "Disparado?", "type": "main", "index": 0}]]},
    "Disparado?": {"main": [[{"node": "Enviar WhatsApp", "type": "main", "index": 0}]]},
    "Enviar WhatsApp": {"main": [[{"node": "Registrar", "type": "main", "index": 0}]]}
  },
  "settings": {"executionOrder": "v1"}
}
```

---

## Workflow 9: Envio Relatórios WhatsApp

**Trigger**: Schedule 5min

```json
{
  "name": "Envio Relatórios WhatsApp",
  "nodes": [
    {
      "parameters": {"rule": {"interval": [{"field": "minutes", "minutesInterval": 5}]}},
      "id": "schedule",
      "name": "A cada 5 minutos",
      "type": "n8n-nodes-base.scheduleTrigger",
      "typeVersion": 1.2,
      "position": [250, 300]
    },
    {
      "parameters": {"workflowId": "CONFIG_WORKFLOW_ID", "options": {}},
      "id": "get-config",
      "name": "Buscar Config",
      "type": "n8n-nodes-base.executeWorkflow",
      "typeVersion": 1.1,
      "position": [450, 300]
    },
    {
      "parameters": {
        "method": "GET",
        "url": "={{ $json.SUPABASE_URL }}/rest/v1/reports?is_active=eq.true&select=*,report_ad_accounts(ad_accounts(*)),report_destinations(*)",
        "sendHeaders": true,
        "headerParameters": {"parameters": [{"name": "apikey", "value": "={{ $json.SUPABASE_ANON_KEY }}"}]},
        "options": {}
      },
      "id": "fetch-reports",
      "name": "Buscar Relatórios",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [650, 300]
    },
    {
      "parameters": {
        "jsCode": "const reports = $input.all();\nconst now = new Date();\nconst h = now.getHours(), m = now.getMinutes(), d = now.getDay();\nconst daysMap = {monday:1,tuesday:2,wednesday:3,thursday:4,friday:5,saturday:6,sunday:0};\n\nconst pending = [];\nfor (const r of reports) {\n  const [sh, sm] = (r.json.schedule_time || '08:00').split(':').map(Number);\n  if (h !== sh || m < sm || m >= sm + 5) continue;\n  \n  let send = false;\n  if (r.json.frequency === 'daily') send = true;\n  else if (r.json.frequency === 'weekly') {\n    const days = r.json.schedule_days || ['monday'];\n    send = days.some(day => daysMap[day] === d);\n  } else if (r.json.frequency === 'monthly') send = now.getDate() === 1;\n  \n  if (send) pending.push({json: r.json});\n}\nreturn pending.length > 0 ? pending : [{json:{skip:true}}];"
      },
      "id": "filter",
      "name": "Filtrar Pendentes",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [850, 300]
    },
    {
      "parameters": {
        "conditions": {"conditions": [{"leftValue": "={{ $json.skip }}", "rightValue": true, "operator": {"type": "boolean", "operation": "notEquals"}}]}
      },
      "id": "has-pending",
      "name": "Tem Pendentes?",
      "type": "n8n-nodes-base.if",
      "typeVersion": 2,
      "position": [1050, 300]
    },
    {
      "parameters": {
        "method": "GET",
        "url": "={{ $('Buscar Config').item.json.SUPABASE_URL }}/rest/v1/ad_metrics?date=gte.{{ $now.minus({days:7}).toFormat('yyyy-MM-dd') }}&select=*",
        "sendHeaders": true,
        "headerParameters": {"parameters": [{"name": "apikey", "value": "={{ $('Buscar Config').item.json.SUPABASE_ANON_KEY }}"}]},
        "options": {}
      },
      "id": "fetch-metrics",
      "name": "Buscar Métricas",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [1300, 200]
    },
    {
      "parameters": {
        "jsCode": "const report = $('Filtrar Pendentes').item.json;\nconst metrics = $input.first().json || [];\n\nlet t = {impressions:0,clicks:0,spend:0,conversions:0,conversion_value:0};\nif (Array.isArray(metrics)) {\n  for (const m of metrics) {\n    t.impressions += m.impressions||0;\n    t.clicks += m.clicks||0;\n    t.spend += m.spend||0;\n    t.conversions += m.conversions||0;\n    t.conversion_value += m.conversion_value||0;\n  }\n}\n\nconst ctr = t.impressions > 0 ? ((t.clicks/t.impressions)*100).toFixed(2) : 0;\nconst cpc = t.clicks > 0 ? (t.spend/t.clicks).toFixed(2) : 0;\nconst roas = t.spend > 0 ? (t.conversion_value/t.spend).toFixed(2) : 0;\nconst fmt = v => `R$ ${v.toFixed(2).replace('.',',')}`;\n\nconst msg = `📊 *${report.name}*\\n\\n📅 Últimos 7 dias\\n\\n👁️ Impressões: ${t.impressions.toLocaleString('pt-BR')}\\n👆 Cliques: ${t.clicks.toLocaleString('pt-BR')}\\n📊 CTR: ${ctr}%\\n💰 Investimento: ${fmt(t.spend)}\\n💵 CPC: ${fmt(parseFloat(cpc))}\\n🎯 Conversões: ${t.conversions.toFixed(0)}\\n💎 Valor: ${fmt(t.conversion_value)}\\n📈 ROAS: ${roas}x`;\n\nreturn [{json:{report,message:msg,destinations:report.report_destinations||[]}}];"
      },
      "id": "format",
      "name": "Formatar",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [1500, 200]
    },
    {
      "parameters": {
        "jsCode": "const data = $input.first().json;\nreturn data.destinations.map(d => ({json:{destination:d.destination_id,message:data.message}}));"
      },
      "id": "split",
      "name": "Separar Destinos",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [1700, 200]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "={{ $('Buscar Config').item.json.EVOLUTION_API_URL }}/message/sendText/{{ $('Buscar Config').item.json.EVOLUTION_INSTANCE_NAME }}",
        "sendHeaders": true,
        "headerParameters": {"parameters": [{"name": "apikey", "value": "={{ $('Buscar Config').item.json.EVOLUTION_API_KEY }}"}]},
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={\"number\":\"{{ $json.destination }}\",\"text\":\"{{ $json.message.replace(/\"/g,'\\\\\"').replace(/\\n/g,'\\\\n') }}\"}",
        "options": {}
      },
      "id": "send",
      "name": "Enviar",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [1900, 200]
    },
    {
      "parameters": {
        "method": "PATCH",
        "url": "={{ $('Buscar Config').item.json.SUPABASE_URL }}/rest/v1/reports?id=eq.{{ $('Formatar').item.json.report.id }}",
        "sendHeaders": true,
        "headerParameters": {"parameters": [{"name": "apikey", "value": "={{ $('Buscar Config').item.json.SUPABASE_ANON_KEY }}"}]},
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={\"last_sent_at\":\"{{ $now.toISO() }}\"}",
        "options": {}
      },
      "id": "update",
      "name": "Atualizar",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [2100, 200]
    }
  ],
  "connections": {
    "A cada 5 minutos": {"main": [[{"node": "Buscar Config", "type": "main", "index": 0}]]},
    "Buscar Config": {"main": [[{"node": "Buscar Relatórios", "type": "main", "index": 0}]]},
    "Buscar Relatórios": {"main": [[{"node": "Filtrar Pendentes", "type": "main", "index": 0}]]},
    "Filtrar Pendentes": {"main": [[{"node": "Tem Pendentes?", "type": "main", "index": 0}]]},
    "Tem Pendentes?": {"main": [[{"node": "Buscar Métricas", "type": "main", "index": 0}]]},
    "Buscar Métricas": {"main": [[{"node": "Formatar", "type": "main", "index": 0}]]},
    "Formatar": {"main": [[{"node": "Separar Destinos", "type": "main", "index": 0}]]},
    "Separar Destinos": {"main": [[{"node": "Enviar", "type": "main", "index": 0}]]},
    "Enviar": {"main": [[{"node": "Atualizar", "type": "main", "index": 0}]]}
  },
  "settings": {"executionOrder": "v1"}
}
```

---

## Workflow 10: Coleta Métricas Meta

**Trigger**: Schedule 1 hora

```json
{
  "name": "Coleta Métricas Meta",
  "nodes": [
    {
      "parameters": {"rule": {"interval": [{"field": "hours", "hoursInterval": 1}]}},
      "id": "schedule",
      "name": "A cada hora",
      "type": "n8n-nodes-base.scheduleTrigger",
      "typeVersion": 1.2,
      "position": [250, 300]
    },
    {
      "parameters": {"workflowId": "CONFIG_WORKFLOW_ID", "options": {}},
      "id": "get-config",
      "name": "Buscar Config",
      "type": "n8n-nodes-base.executeWorkflow",
      "typeVersion": 1.1,
      "position": [450, 300]
    },
    {
      "parameters": {
        "method": "GET",
        "url": "={{ $json.SUPABASE_URL }}/rest/v1/ad_connections?platform=eq.meta_ads&status=eq.active&select=*",
        "sendHeaders": true,
        "headerParameters": {"parameters": [{"name": "apikey", "value": "={{ $json.SUPABASE_ANON_KEY }}"}]},
        "options": {}
      },
      "id": "fetch-connections",
      "name": "Buscar Conexões",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [650, 300]
    },
    {
      "parameters": {
        "method": "GET",
        "url": "={{ $('Buscar Config').item.json.SUPABASE_URL }}/rest/v1/ad_accounts?connection_id=eq.{{ $json.id }}&is_active=eq.true&select=*",
        "sendHeaders": true,
        "headerParameters": {"parameters": [{"name": "apikey", "value": "={{ $('Buscar Config').item.json.SUPABASE_ANON_KEY }}"}]},
        "options": {}
      },
      "id": "fetch-accounts",
      "name": "Buscar Contas",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [850, 300]
    },
    {
      "parameters": {
        "method": "GET",
        "url": "=https://graph.facebook.com/v18.0/act_{{ $json.platform_account_id }}/insights?fields=impressions,reach,clicks,spend,actions,action_values&date_preset=today&level=campaign",
        "sendHeaders": true,
        "headerParameters": {"parameters": [{"name": "Authorization", "value": "Bearer {{ $('Buscar Conexões').item.json.credentials.access_token }}"}]},
        "options": {}
      },
      "id": "fetch-insights",
      "name": "Buscar Insights",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [1050, 300]
    },
    {
      "parameters": {
        "jsCode": "const account = $('Buscar Contas').item.json;\nconst insights = $input.first().json;\nconst today = new Date().toISOString().split('T')[0];\nconst data = insights.data || [];\nconst allMetrics = [];\n\nfor (const row of data) {\n  let conversions = 0, convValue = 0;\n  if (row.actions) {\n    const p = row.actions.find(a => a.action_type === 'purchase');\n    if (p) conversions = parseFloat(p.value || 0);\n  }\n  if (row.action_values) {\n    const p = row.action_values.find(a => a.action_type === 'purchase');\n    if (p) convValue = parseFloat(p.value || 0);\n  }\n  const imp = parseInt(row.impressions||0);\n  const clicks = parseInt(row.clicks||0);\n  const spend = parseFloat(row.spend||0);\n  const reach = parseInt(row.reach||0);\n  \n  allMetrics.push({\n    ad_account_id: account.id,\n    campaign_id: row.campaign_id||null,\n    campaign_name: row.campaign_name||null,\n    date: today, impressions: imp, clicks, spend, conversions, conversion_value: convValue, reach,\n    cpc: clicks>0?spend/clicks:0,\n    cpm: imp>0?(spend/imp)*1000:0,\n    ctr: imp>0?(clicks/imp)*100:0,\n    roas: spend>0?convValue/spend:0\n  });\n}\nreturn allMetrics.map(m => ({json:m}));"
      },
      "id": "process",
      "name": "Processar",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [1250, 300]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "={{ $('Buscar Config').item.json.SUPABASE_URL }}/rest/v1/ad_metrics",
        "sendHeaders": true,
        "headerParameters": {"parameters": [
          {"name": "apikey", "value": "={{ $('Buscar Config').item.json.SUPABASE_ANON_KEY }}"},
          {"name": "Prefer", "value": "resolution=merge-duplicates"}
        ]},
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={{ JSON.stringify($json) }}",
        "options": {}
      },
      "id": "save",
      "name": "Salvar",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [1450, 300]
    }
  ],
  "connections": {
    "A cada hora": {"main": [[{"node": "Buscar Config", "type": "main", "index": 0}]]},
    "Buscar Config": {"main": [[{"node": "Buscar Conexões", "type": "main", "index": 0}]]},
    "Buscar Conexões": {"main": [[{"node": "Buscar Contas", "type": "main", "index": 0}]]},
    "Buscar Contas": {"main": [[{"node": "Buscar Insights", "type": "main", "index": 0}]]},
    "Buscar Insights": {"main": [[{"node": "Processar", "type": "main", "index": 0}]]},
    "Processar": {"main": [[{"node": "Salvar", "type": "main", "index": 0}]]}
  },
  "settings": {"executionOrder": "v1"}
}
```

---

## Workflow 11: OAuth Meta Ads (PLACEHOLDER)

⚠️ **AGUARDANDO META_APP_SECRET**

```json
{
  "name": "OAuth Meta Ads (PLACEHOLDER)",
  "nodes": [
    {
      "parameters": {"httpMethod": "GET", "path": "meta-oauth-callback", "options": {}},
      "id": "webhook",
      "name": "OAuth Callback",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2,
      "position": [250, 300],
      "webhookId": "meta-oauth-callback"
    },
    {
      "parameters": {"workflowId": "CONFIG_WORKFLOW_ID", "options": {}},
      "id": "get-config",
      "name": "Buscar Config",
      "type": "n8n-nodes-base.executeWorkflow",
      "typeVersion": 1.1,
      "position": [450, 300]
    },
    {
      "parameters": {"content": "## PLACEHOLDER\n\nPrecisa do META_APP_SECRET.\n\n1. Trocar código por token\n2. Trocar por token longo\n3. Buscar contas\n4. Criar conexão\n5. Salvar contas", "height": 200, "width": 300},
      "id": "note",
      "name": "Nota",
      "type": "n8n-nodes-base.stickyNote",
      "typeVersion": 1,
      "position": [650, 200]
    },
    {
      "parameters": {"respondWith": "redirect", "redirectURL": "={{ $('Buscar Config').item.json.APP_URL }}/connections?error=meta_not_configured", "options": {}},
      "id": "redirect",
      "name": "Erro",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1.1,
      "position": [650, 400]
    }
  ],
  "connections": {
    "OAuth Callback": {"main": [[{"node": "Buscar Config", "type": "main", "index": 0}]]},
    "Buscar Config": {"main": [[{"node": "Erro", "type": "main", "index": 0}]]}
  },
  "settings": {"executionOrder": "v1"}
}
```

---

## URLs dos Webhooks

| Webhook | URL |
|---------|-----|
| Sync Grupos | `https://n8n-n8n.5lgyrt.easypanel.host/webhook/whatsapp-sync-groups` |
| Status WhatsApp | `https://n8n-n8n.5lgyrt.easypanel.host/webhook/whatsapp-status-callback` |
| WhatsApp Management | `https://n8n-n8n.5lgyrt.easypanel.host/webhook/whatsapp-management` |
| OAuth Google | `https://n8n-n8n.5lgyrt.easypanel.host/webhook/google-oauth-callback` |
| OAuth Meta | `https://n8n-n8n.5lgyrt.easypanel.host/webhook/meta-oauth-callback` |

---

## Configuração Evolution API

Configure o webhook no Evolution:

```
URL: https://n8n-n8n.5lgyrt.easypanel.host/webhook/whatsapp-status-callback
Eventos: connection.update, qrcode.updated
```
