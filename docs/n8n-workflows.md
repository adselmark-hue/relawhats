# Workflows n8n - Importação Completa

## Configurações Necessárias no n8n

### Credenciais a Configurar:
1. **Meta Ads OAuth2** - App ID e Secret do Meta Developers
2. **Evolution API** - URL: `https://n8n-evolution-api.5lgyrt.easypanel.host/`
3. **Supabase Webhook Secret** - Definir o mesmo valor configurado no Supabase

### Variáveis de Ambiente no n8n:
```
SUPABASE_URL=https://ksvcszizxrtwcdjbvukm.supabase.co
SUPABASE_ANON_KEY=seu_anon_key
WEBHOOK_SECRET=seu_webhook_secret
EVOLUTION_API_URL=https://n8n-evolution-api.5lgyrt.easypanel.host
EVOLUTION_API_KEY=sua_api_key
META_APP_ID=seu_app_id
META_APP_SECRET=seu_app_secret
```

---

## 1. OAuth Meta Ads - Conexão e Sync de Contas

Este workflow gerencia a autenticação OAuth2 com Meta Ads e sincroniza as contas de anúncios.

```json
{
  "name": "Meta Ads OAuth & Sync",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "GET",
        "path": "meta-oauth-callback",
        "responseMode": "responseNode",
        "options": {}
      },
      "id": "webhook-oauth",
      "name": "OAuth Callback",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2,
      "position": [240, 300],
      "webhookId": "meta-oauth-callback"
    },
    {
      "parameters": {
        "method": "POST",
        "url": "https://graph.facebook.com/v19.0/oauth/access_token",
        "sendQuery": true,
        "queryParameters": {
          "parameters": [
            {
              "name": "client_id",
              "value": "={{ $env.META_APP_ID }}"
            },
            {
              "name": "client_secret",
              "value": "={{ $env.META_APP_SECRET }}"
            },
            {
              "name": "redirect_uri",
              "value": "={{ $env.N8N_WEBHOOK_URL }}/webhook/meta-oauth-callback"
            },
            {
              "name": "code",
              "value": "={{ $json.query.code }}"
            }
          ]
        },
        "options": {}
      },
      "id": "exchange-code",
      "name": "Exchange Code for Token",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [460, 300]
    },
    {
      "parameters": {
        "method": "GET",
        "url": "https://graph.facebook.com/v19.0/me/adaccounts",
        "sendQuery": true,
        "queryParameters": {
          "parameters": [
            {
              "name": "access_token",
              "value": "={{ $json.access_token }}"
            },
            {
              "name": "fields",
              "value": "id,name,currency,timezone_name,account_status"
            }
          ]
        },
        "options": {}
      },
      "id": "fetch-ad-accounts",
      "name": "Fetch Ad Accounts",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [680, 300]
    },
    {
      "parameters": {
        "jsCode": "const tokenData = $('Exchange Code for Token').first().json;\nconst accountsData = $input.first().json;\nconst organizationId = $('OAuth Callback').first().json.query.state;\n\n// Preparar contas para sincronização\nconst accounts = (accountsData.data || []).map(acc => ({\n  account_id: acc.id.replace('act_', ''),\n  name: acc.name,\n  currency: acc.currency,\n  timezone: acc.timezone_name\n}));\n\n// Calcular expiração (60 dias para long-lived token)\nconst expiresAt = new Date();\nexpiresAt.setSeconds(expiresAt.getSeconds() + (tokenData.expires_in || 5184000));\n\nreturn {\n  organization_id: organizationId,\n  platform: 'meta',\n  name: 'Meta Ads',\n  access_token: tokenData.access_token,\n  expires_at: expiresAt.toISOString(),\n  status: 'connected',\n  accounts: accounts\n};"
      },
      "id": "prepare-data",
      "name": "Prepare Connection Data",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [900, 300]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "={{ $env.SUPABASE_URL }}/functions/v1/webhook-connection",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Content-Type",
              "value": "application/json"
            },
            {
              "name": "x-webhook-secret",
              "value": "={{ $env.WEBHOOK_SECRET }}"
            }
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={\n  \"action\": \"create\",\n  \"organization_id\": \"{{ $json.organization_id }}\",\n  \"platform\": \"{{ $json.platform }}\",\n  \"name\": \"{{ $json.name }}\",\n  \"access_token\": \"{{ $json.access_token }}\",\n  \"expires_at\": \"{{ $json.expires_at }}\",\n  \"status\": \"{{ $json.status }}\"\n}",
        "options": {}
      },
      "id": "create-connection",
      "name": "Create Connection",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [1120, 200]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "={{ $env.SUPABASE_URL }}/functions/v1/webhook-connection",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Content-Type",
              "value": "application/json"
            },
            {
              "name": "x-webhook-secret",
              "value": "={{ $env.WEBHOOK_SECRET }}"
            }
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={\n  \"action\": \"sync_accounts\",\n  \"organization_id\": \"{{ $('Prepare Connection Data').first().json.organization_id }}\",\n  \"platform\": \"meta\",\n  \"name\": \"Meta Ads\",\n  \"accounts\": {{ JSON.stringify($('Prepare Connection Data').first().json.accounts) }}\n}",
        "options": {}
      },
      "id": "sync-accounts",
      "name": "Sync Ad Accounts",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [1340, 200]
    },
    {
      "parameters": {
        "respondWith": "redirect",
        "redirectURL": "={{ $env.APP_URL }}/connections?status=success"
      },
      "id": "respond-success",
      "name": "Redirect Success",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1.1,
      "position": [1560, 200]
    },
    {
      "parameters": {
        "respondWith": "redirect",
        "redirectURL": "={{ $env.APP_URL }}/connections?status=error&message={{ encodeURIComponent($json.error || 'Erro desconhecido') }}"
      },
      "id": "respond-error",
      "name": "Redirect Error",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1.1,
      "position": [1120, 500]
    }
  ],
  "connections": {
    "OAuth Callback": {
      "main": [
        [
          {
            "node": "Exchange Code for Token",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Exchange Code for Token": {
      "main": [
        [
          {
            "node": "Fetch Ad Accounts",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Fetch Ad Accounts": {
      "main": [
        [
          {
            "node": "Prepare Connection Data",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Prepare Connection Data": {
      "main": [
        [
          {
            "node": "Create Connection",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Create Connection": {
      "main": [
        [
          {
            "node": "Sync Ad Accounts",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Sync Ad Accounts": {
      "main": [
        [
          {
            "node": "Redirect Success",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  },
  "settings": {
    "executionOrder": "v1"
  },
  "staticData": null,
  "tags": ["meta", "oauth", "conexoes"]
}
```

---

## 2. Coleta de Métricas Meta Ads (Agendado - A cada hora)

Este workflow coleta métricas de todas as contas conectadas e envia para o Supabase.

```json
{
  "name": "Coleta Métricas Meta Ads",
  "nodes": [
    {
      "parameters": {
        "rule": {
          "interval": [
            {
              "field": "hours",
              "hoursInterval": 1
            }
          ]
        }
      },
      "id": "schedule",
      "name": "A Cada Hora",
      "type": "n8n-nodes-base.scheduleTrigger",
      "typeVersion": 1.2,
      "position": [240, 300]
    },
    {
      "parameters": {
        "method": "GET",
        "url": "={{ $env.SUPABASE_URL }}/rest/v1/ad_connections",
        "sendQuery": true,
        "queryParameters": {
          "parameters": [
            {
              "name": "select",
              "value": "id,organization_id,platform,access_token,status"
            },
            {
              "name": "platform",
              "value": "eq.meta"
            },
            {
              "name": "status",
              "value": "eq.connected"
            }
          ]
        },
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "apikey",
              "value": "={{ $env.SUPABASE_ANON_KEY }}"
            },
            {
              "name": "Authorization",
              "value": "=Bearer {{ $env.SUPABASE_ANON_KEY }}"
            }
          ]
        },
        "options": {}
      },
      "id": "fetch-connections",
      "name": "Fetch Active Connections",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [460, 300]
    },
    {
      "parameters": {
        "method": "GET",
        "url": "={{ $env.SUPABASE_URL }}/rest/v1/ad_accounts",
        "sendQuery": true,
        "queryParameters": {
          "parameters": [
            {
              "name": "select",
              "value": "id,connection_id,organization_id,account_id,name,is_active"
            },
            {
              "name": "connection_id",
              "value": "=eq.{{ $json.id }}"
            },
            {
              "name": "is_active",
              "value": "eq.true"
            }
          ]
        },
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "apikey",
              "value": "={{ $env.SUPABASE_ANON_KEY }}"
            },
            {
              "name": "Authorization",
              "value": "=Bearer {{ $env.SUPABASE_ANON_KEY }}"
            }
          ]
        },
        "options": {}
      },
      "id": "fetch-accounts",
      "name": "Fetch Ad Accounts",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [680, 300]
    },
    {
      "parameters": {
        "jsCode": "const connection = $('Fetch Active Connections').item.json;\nconst accounts = $input.all().flatMap(item => {\n  if (Array.isArray(item.json)) {\n    return item.json;\n  }\n  return [item.json];\n});\n\nreturn accounts.filter(acc => acc.account_id).map(acc => ({\n  account_id: acc.account_id,\n  supabase_id: acc.id,\n  organization_id: acc.organization_id,\n  access_token: connection.access_token\n}));"
      },
      "id": "split-accounts",
      "name": "Split Accounts",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [900, 300]
    },
    {
      "parameters": {
        "method": "GET",
        "url": "=https://graph.facebook.com/v19.0/act_{{ $json.account_id }}/insights",
        "sendQuery": true,
        "queryParameters": {
          "parameters": [
            {
              "name": "access_token",
              "value": "={{ $json.access_token }}"
            },
            {
              "name": "fields",
              "value": "spend,impressions,clicks,ctr,cpc,conversions,cost_per_conversion,reach,frequency"
            },
            {
              "name": "date_preset",
              "value": "today"
            },
            {
              "name": "level",
              "value": "account"
            }
          ]
        },
        "options": {
          "response": {
            "response": {
              "neverError": true
            }
          }
        }
      },
      "id": "fetch-insights",
      "name": "Fetch Meta Insights",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [1120, 300]
    },
    {
      "parameters": {
        "jsCode": "const accountData = $('Split Accounts').item.json;\nconst insights = $input.first().json;\n\n// Se não houver dados, retornar métricas zeradas\nconst data = insights.data?.[0] || {};\n\nconst metrics = {\n  spend: parseFloat(data.spend || '0'),\n  impressions: parseInt(data.impressions || '0'),\n  clicks: parseInt(data.clicks || '0'),\n  ctr: parseFloat(data.ctr || '0'),\n  cpc: parseFloat(data.cpc || '0'),\n  conversions: parseInt(data.conversions || '0'),\n  cost_per_conversion: parseFloat(data.cost_per_conversion || '0'),\n  reach: parseInt(data.reach || '0'),\n  frequency: parseFloat(data.frequency || '0')\n};\n\nconst today = new Date().toISOString().split('T')[0];\n\nreturn {\n  organization_id: accountData.organization_id,\n  ad_account_id: accountData.supabase_id,\n  date: today,\n  metrics: metrics\n};"
      },
      "id": "prepare-metrics",
      "name": "Prepare Metrics",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [1340, 300]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "={{ $env.SUPABASE_URL }}/functions/v1/webhook-metrics",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Content-Type",
              "value": "application/json"
            },
            {
              "name": "x-webhook-secret",
              "value": "={{ $env.WEBHOOK_SECRET }}"
            }
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={{ JSON.stringify($json) }}",
        "options": {}
      },
      "id": "save-metrics",
      "name": "Save to Supabase",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [1560, 300]
    }
  ],
  "connections": {
    "A Cada Hora": {
      "main": [
        [
          {
            "node": "Fetch Active Connections",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Fetch Active Connections": {
      "main": [
        [
          {
            "node": "Fetch Ad Accounts",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Fetch Ad Accounts": {
      "main": [
        [
          {
            "node": "Split Accounts",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Split Accounts": {
      "main": [
        [
          {
            "node": "Fetch Meta Insights",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Fetch Meta Insights": {
      "main": [
        [
          {
            "node": "Prepare Metrics",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Prepare Metrics": {
      "main": [
        [
          {
            "node": "Save to Supabase",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  },
  "settings": {
    "executionOrder": "v1"
  },
  "staticData": null,
  "tags": ["meta", "metricas", "agendado"]
}
```

---

## 3. Envio de Relatórios via WhatsApp (Evolution API)

Este workflow verifica relatórios prontos e envia via WhatsApp usando Evolution API.

```json
{
  "name": "Envio Relatórios WhatsApp",
  "nodes": [
    {
      "parameters": {
        "rule": {
          "interval": [
            {
              "field": "minutes",
              "minutesInterval": 5
            }
          ]
        }
      },
      "id": "schedule",
      "name": "A Cada 5 Minutos",
      "type": "n8n-nodes-base.scheduleTrigger",
      "typeVersion": 1.2,
      "position": [240, 300]
    },
    {
      "parameters": {
        "method": "GET",
        "url": "={{ $env.SUPABASE_URL }}/functions/v1/webhook-report-trigger",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "x-webhook-secret",
              "value": "={{ $env.WEBHOOK_SECRET }}"
            }
          ]
        },
        "options": {}
      },
      "id": "fetch-reports",
      "name": "Fetch Reports to Send",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [460, 300]
    },
    {
      "parameters": {
        "conditions": {
          "options": {
            "caseSensitive": true,
            "leftValue": "",
            "typeValidation": "strict"
          },
          "conditions": [
            {
              "id": "has-reports",
              "leftValue": "={{ $json.count }}",
              "rightValue": 0,
              "operator": {
                "type": "number",
                "operation": "gt"
              }
            }
          ],
          "combinator": "and"
        },
        "options": {}
      },
      "id": "check-reports",
      "name": "Has Reports?",
      "type": "n8n-nodes-base.if",
      "typeVersion": 2,
      "position": [680, 300]
    },
    {
      "parameters": {
        "jsCode": "const reports = $input.first().json.reports || [];\nreturn reports.map(report => ({\n  report_id: report.id,\n  organization_id: report.organization_id,\n  recipient_phone: report.recipient_phone,\n  recipient_group_id: report.recipient_group_id,\n  formatted_message: report.formatted_message,\n  whatsapp_account_id: report.whatsapp_account_id,\n  metrics: report.metrics\n}));"
      },
      "id": "split-reports",
      "name": "Split Reports",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [900, 200]
    },
    {
      "parameters": {
        "method": "GET",
        "url": "={{ $env.SUPABASE_URL }}/rest/v1/whatsapp_accounts",
        "sendQuery": true,
        "queryParameters": {
          "parameters": [
            {
              "name": "select",
              "value": "id,name,phone_number,api_key,metadata"
            },
            {
              "name": "id",
              "value": "=eq.{{ $json.whatsapp_account_id }}"
            }
          ]
        },
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "apikey",
              "value": "={{ $env.SUPABASE_ANON_KEY }}"
            },
            {
              "name": "Authorization",
              "value": "=Bearer {{ $env.SUPABASE_ANON_KEY }}"
            }
          ]
        },
        "options": {}
      },
      "id": "fetch-whatsapp-account",
      "name": "Fetch WhatsApp Account",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [1120, 200]
    },
    {
      "parameters": {
        "jsCode": "const reportData = $('Split Reports').item.json;\nconst whatsappAccount = $input.first().json[0];\n\n// Determinar destino (telefone individual ou grupo)\nlet recipient = reportData.recipient_phone;\nlet isGroup = false;\n\nif (reportData.recipient_group_id) {\n  recipient = reportData.recipient_group_id;\n  isGroup = true;\n}\n\n// Formatar telefone (adicionar @s.whatsapp.net ou @g.us)\nif (!isGroup && recipient) {\n  // Limpar número (remover caracteres não numéricos)\n  recipient = recipient.replace(/\\D/g, '');\n  // Adicionar código do país se necessário\n  if (!recipient.startsWith('55')) {\n    recipient = '55' + recipient;\n  }\n}\n\nreturn {\n  report_id: reportData.report_id,\n  recipient: recipient,\n  is_group: isGroup,\n  message: reportData.formatted_message,\n  instance_name: whatsappAccount?.metadata?.instance_name || 'default',\n  api_key: whatsappAccount?.api_key || $env.EVOLUTION_API_KEY,\n  metrics: reportData.metrics\n};"
      },
      "id": "prepare-message",
      "name": "Prepare Message",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [1340, 200]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "={{ $env.EVOLUTION_API_URL }}/message/sendText/{{ $json.instance_name }}",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Content-Type",
              "value": "application/json"
            },
            {
              "name": "apikey",
              "value": "={{ $json.api_key }}"
            }
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={\n  \"number\": \"{{ $json.recipient }}{{ $json.is_group ? '@g.us' : '@s.whatsapp.net' }}\",\n  \"text\": {{ JSON.stringify($json.message) }}\n}",
        "options": {
          "response": {
            "response": {
              "neverError": true
            }
          }
        }
      },
      "id": "send-whatsapp",
      "name": "Send via Evolution API",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [1560, 200]
    },
    {
      "parameters": {
        "jsCode": "const reportData = $('Prepare Message').item.json;\nconst response = $input.first().json;\n\nconst isSuccess = response.key?.id || response.status === 'PENDING';\n\nreturn {\n  report_id: reportData.report_id,\n  status: isSuccess ? 'success' : 'error',\n  error_message: isSuccess ? null : (response.message || JSON.stringify(response)),\n  metrics_snapshot: reportData.metrics\n};"
      },
      "id": "prepare-callback",
      "name": "Prepare Callback",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [1780, 200]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "={{ $env.SUPABASE_URL }}/functions/v1/webhook-report-sent",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Content-Type",
              "value": "application/json"
            },
            {
              "name": "x-webhook-secret",
              "value": "={{ $env.WEBHOOK_SECRET }}"
            }
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={{ JSON.stringify($json) }}",
        "options": {}
      },
      "id": "report-sent-callback",
      "name": "Report Sent Callback",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [2000, 200]
    },
    {
      "parameters": {},
      "id": "no-reports",
      "name": "No Reports",
      "type": "n8n-nodes-base.noOp",
      "typeVersion": 1,
      "position": [900, 400]
    }
  ],
  "connections": {
    "A Cada 5 Minutos": {
      "main": [
        [
          {
            "node": "Fetch Reports to Send",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Fetch Reports to Send": {
      "main": [
        [
          {
            "node": "Has Reports?",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Has Reports?": {
      "main": [
        [
          {
            "node": "Split Reports",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "No Reports",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Split Reports": {
      "main": [
        [
          {
            "node": "Fetch WhatsApp Account",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Fetch WhatsApp Account": {
      "main": [
        [
          {
            "node": "Prepare Message",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Prepare Message": {
      "main": [
        [
          {
            "node": "Send via Evolution API",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Send via Evolution API": {
      "main": [
        [
          {
            "node": "Prepare Callback",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Prepare Callback": {
      "main": [
        [
          {
            "node": "Report Sent Callback",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  },
  "settings": {
    "executionOrder": "v1"
  },
  "staticData": null,
  "tags": ["whatsapp", "relatorios", "evolution"]
}
```

---

## 4. Verificação de Alertas (Agendado)

Este workflow verifica condições de alertas e notifica via WhatsApp.

```json
{
  "name": "Verificação de Alertas",
  "nodes": [
    {
      "parameters": {
        "rule": {
          "interval": [
            {
              "field": "minutes",
              "minutesInterval": 30
            }
          ]
        }
      },
      "id": "schedule",
      "name": "A Cada 30 Minutos",
      "type": "n8n-nodes-base.scheduleTrigger",
      "typeVersion": 1.2,
      "position": [240, 300]
    },
    {
      "parameters": {
        "method": "GET",
        "url": "={{ $env.SUPABASE_URL }}/rest/v1/alerts",
        "sendQuery": true,
        "queryParameters": {
          "parameters": [
            {
              "name": "select",
              "value": "id,organization_id,name,metric,condition,threshold,recipient_phone,is_active,ad_account_id"
            },
            {
              "name": "is_active",
              "value": "eq.true"
            }
          ]
        },
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "apikey",
              "value": "={{ $env.SUPABASE_ANON_KEY }}"
            },
            {
              "name": "Authorization",
              "value": "=Bearer {{ $env.SUPABASE_ANON_KEY }}"
            }
          ]
        },
        "options": {}
      },
      "id": "fetch-alerts",
      "name": "Fetch Active Alerts",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [460, 300]
    },
    {
      "parameters": {
        "jsCode": "const alerts = $input.first().json || [];\nreturn alerts.filter(alert => alert.ad_account_id).map(alert => alert);"
      },
      "id": "split-alerts",
      "name": "Split Alerts",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [680, 300]
    },
    {
      "parameters": {
        "method": "GET",
        "url": "={{ $env.SUPABASE_URL }}/rest/v1/ad_metrics_snapshots",
        "sendQuery": true,
        "queryParameters": {
          "parameters": [
            {
              "name": "select",
              "value": "metrics"
            },
            {
              "name": "ad_account_id",
              "value": "=eq.{{ $json.ad_account_id }}"
            },
            {
              "name": "order",
              "value": "date.desc"
            },
            {
              "name": "limit",
              "value": "1"
            }
          ]
        },
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "apikey",
              "value": "={{ $env.SUPABASE_ANON_KEY }}"
            },
            {
              "name": "Authorization",
              "value": "=Bearer {{ $env.SUPABASE_ANON_KEY }}"
            }
          ]
        },
        "options": {}
      },
      "id": "fetch-metrics",
      "name": "Fetch Latest Metrics",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [900, 300]
    },
    {
      "parameters": {
        "jsCode": "const alert = $('Split Alerts').item.json;\nconst metricsData = $input.first().json[0];\n\nif (!metricsData) {\n  return { shouldNotify: false };\n}\n\nconst metrics = metricsData.metrics || {};\nconst metricValue = metrics[alert.metric] || 0;\nconst threshold = parseFloat(alert.threshold);\n\nlet shouldNotify = false;\n\nswitch (alert.condition) {\n  case 'gt': // greater than\n    shouldNotify = metricValue > threshold;\n    break;\n  case 'lt': // less than\n    shouldNotify = metricValue < threshold;\n    break;\n  case 'gte': // greater than or equal\n    shouldNotify = metricValue >= threshold;\n    break;\n  case 'lte': // less than or equal\n    shouldNotify = metricValue <= threshold;\n    break;\n  case 'eq': // equal\n    shouldNotify = metricValue === threshold;\n    break;\n}\n\nconst conditionText = {\n  'gt': 'maior que',\n  'lt': 'menor que',\n  'gte': 'maior ou igual a',\n  'lte': 'menor ou igual a',\n  'eq': 'igual a'\n};\n\nconst metricNames = {\n  'spend': 'Gasto',\n  'impressions': 'Impressões',\n  'clicks': 'Cliques',\n  'ctr': 'CTR',\n  'cpc': 'CPC',\n  'conversions': 'Conversões',\n  'cost_per_conversion': 'Custo por Conversão'\n};\n\nconst message = `🚨 *ALERTA: ${alert.name}*\\n\\n` +\n  `📊 Métrica: ${metricNames[alert.metric] || alert.metric}\\n` +\n  `📈 Valor atual: ${metricValue.toLocaleString('pt-BR')}\\n` +\n  `⚠️ Condição: ${conditionText[alert.condition]} ${threshold}\\n\\n` +\n  `_Alerta automático - ${new Date().toLocaleString('pt-BR')}_`;\n\nreturn {\n  shouldNotify,\n  alert_id: alert.id,\n  recipient_phone: alert.recipient_phone,\n  message,\n  metric_value: metricValue,\n  threshold\n};"
      },
      "id": "check-condition",
      "name": "Check Alert Condition",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [1120, 300]
    },
    {
      "parameters": {
        "conditions": {
          "options": {
            "caseSensitive": true,
            "leftValue": "",
            "typeValidation": "strict"
          },
          "conditions": [
            {
              "id": "should-notify",
              "leftValue": "={{ $json.shouldNotify }}",
              "rightValue": true,
              "operator": {
                "type": "boolean",
                "operation": "equals"
              }
            }
          ],
          "combinator": "and"
        },
        "options": {}
      },
      "id": "if-notify",
      "name": "Should Notify?",
      "type": "n8n-nodes-base.if",
      "typeVersion": 2,
      "position": [1340, 300]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "={{ $env.EVOLUTION_API_URL }}/message/sendText/default",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Content-Type",
              "value": "application/json"
            },
            {
              "name": "apikey",
              "value": "={{ $env.EVOLUTION_API_KEY }}"
            }
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={\n  \"number\": \"{{ $json.recipient_phone.replace(/\\D/g, '') }}@s.whatsapp.net\",\n  \"text\": {{ JSON.stringify($json.message) }}\n}",
        "options": {}
      },
      "id": "send-alert",
      "name": "Send Alert via WhatsApp",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [1560, 200]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "={{ $env.SUPABASE_URL }}/functions/v1/webhook-alert",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Content-Type",
              "value": "application/json"
            },
            {
              "name": "x-webhook-secret",
              "value": "={{ $env.WEBHOOK_SECRET }}"
            }
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={\n  \"alert_id\": \"{{ $('Check Alert Condition').item.json.alert_id }}\",\n  \"triggered_at\": \"{{ new Date().toISOString() }}\",\n  \"metric_value\": {{ $('Check Alert Condition').item.json.metric_value }},\n  \"threshold\": {{ $('Check Alert Condition').item.json.threshold }}\n}",
        "options": {}
      },
      "id": "log-alert",
      "name": "Log Alert Trigger",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [1780, 200]
    },
    {
      "parameters": {},
      "id": "no-action",
      "name": "No Action Needed",
      "type": "n8n-nodes-base.noOp",
      "typeVersion": 1,
      "position": [1560, 400]
    }
  ],
  "connections": {
    "A Cada 30 Minutos": {
      "main": [
        [
          {
            "node": "Fetch Active Alerts",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Fetch Active Alerts": {
      "main": [
        [
          {
            "node": "Split Alerts",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Split Alerts": {
      "main": [
        [
          {
            "node": "Fetch Latest Metrics",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Fetch Latest Metrics": {
      "main": [
        [
          {
            "node": "Check Alert Condition",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Check Alert Condition": {
      "main": [
        [
          {
            "node": "Should Notify?",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Should Notify?": {
      "main": [
        [
          {
            "node": "Send Alert via WhatsApp",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "No Action Needed",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Send Alert via WhatsApp": {
      "main": [
        [
          {
            "node": "Log Alert Trigger",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  },
  "settings": {
    "executionOrder": "v1"
  },
  "staticData": null,
  "tags": ["alertas", "whatsapp", "monitoramento"]
}
```

---

## 5. Renovação de Token Meta (Agendado - Diário)

Renova automaticamente tokens do Meta Ads antes de expirarem.

```json
{
  "name": "Renovação Token Meta Ads",
  "nodes": [
    {
      "parameters": {
        "rule": {
          "interval": [
            {
              "field": "hours",
              "hoursInterval": 24
            }
          ]
        }
      },
      "id": "schedule",
      "name": "Diariamente",
      "type": "n8n-nodes-base.scheduleTrigger",
      "typeVersion": 1.2,
      "position": [240, 300]
    },
    {
      "parameters": {
        "method": "GET",
        "url": "={{ $env.SUPABASE_URL }}/rest/v1/ad_connections",
        "sendQuery": true,
        "queryParameters": {
          "parameters": [
            {
              "name": "select",
              "value": "id,organization_id,platform,access_token,expires_at,status"
            },
            {
              "name": "platform",
              "value": "eq.meta"
            },
            {
              "name": "status",
              "value": "eq.connected"
            }
          ]
        },
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "apikey",
              "value": "={{ $env.SUPABASE_ANON_KEY }}"
            },
            {
              "name": "Authorization",
              "value": "=Bearer {{ $env.SUPABASE_ANON_KEY }}"
            }
          ]
        },
        "options": {}
      },
      "id": "fetch-connections",
      "name": "Fetch Meta Connections",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [460, 300]
    },
    {
      "parameters": {
        "jsCode": "const connections = $input.first().json || [];\nconst now = new Date();\nconst sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);\n\n// Filtrar conexões que expiram nos próximos 7 dias\nreturn connections.filter(conn => {\n  if (!conn.expires_at) return false;\n  const expiresAt = new Date(conn.expires_at);\n  return expiresAt <= sevenDaysFromNow;\n});"
      },
      "id": "filter-expiring",
      "name": "Filter Expiring Tokens",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [680, 300]
    },
    {
      "parameters": {
        "method": "GET",
        "url": "=https://graph.facebook.com/v19.0/oauth/access_token",
        "sendQuery": true,
        "queryParameters": {
          "parameters": [
            {
              "name": "grant_type",
              "value": "fb_exchange_token"
            },
            {
              "name": "client_id",
              "value": "={{ $env.META_APP_ID }}"
            },
            {
              "name": "client_secret",
              "value": "={{ $env.META_APP_SECRET }}"
            },
            {
              "name": "fb_exchange_token",
              "value": "={{ $json.access_token }}"
            }
          ]
        },
        "options": {
          "response": {
            "response": {
              "neverError": true
            }
          }
        }
      },
      "id": "refresh-token",
      "name": "Refresh Token",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [900, 300]
    },
    {
      "parameters": {
        "jsCode": "const connection = $('Filter Expiring Tokens').item.json;\nconst response = $input.first().json;\n\nif (response.error) {\n  return {\n    success: false,\n    connection_id: connection.id,\n    organization_id: connection.organization_id,\n    error: response.error.message\n  };\n}\n\nconst expiresAt = new Date();\nexpiresAt.setSeconds(expiresAt.getSeconds() + (response.expires_in || 5184000));\n\nreturn {\n  success: true,\n  connection_id: connection.id,\n  organization_id: connection.organization_id,\n  access_token: response.access_token,\n  expires_at: expiresAt.toISOString()\n};"
      },
      "id": "prepare-update",
      "name": "Prepare Update",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [1120, 300]
    },
    {
      "parameters": {
        "conditions": {
          "options": {
            "caseSensitive": true,
            "leftValue": "",
            "typeValidation": "strict"
          },
          "conditions": [
            {
              "id": "is-success",
              "leftValue": "={{ $json.success }}",
              "rightValue": true,
              "operator": {
                "type": "boolean",
                "operation": "equals"
              }
            }
          ],
          "combinator": "and"
        },
        "options": {}
      },
      "id": "if-success",
      "name": "Refresh Success?",
      "type": "n8n-nodes-base.if",
      "typeVersion": 2,
      "position": [1340, 300]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "={{ $env.SUPABASE_URL }}/functions/v1/webhook-connection",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Content-Type",
              "value": "application/json"
            },
            {
              "name": "x-webhook-secret",
              "value": "={{ $env.WEBHOOK_SECRET }}"
            }
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={\n  \"action\": \"update\",\n  \"organization_id\": \"{{ $json.organization_id }}\",\n  \"platform\": \"meta\",\n  \"name\": \"Meta Ads\",\n  \"access_token\": \"{{ $json.access_token }}\",\n  \"expires_at\": \"{{ $json.expires_at }}\",\n  \"status\": \"connected\"\n}",
        "options": {}
      },
      "id": "update-connection",
      "name": "Update Connection",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [1560, 200]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "={{ $env.SUPABASE_URL }}/functions/v1/webhook-connection",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Content-Type",
              "value": "application/json"
            },
            {
              "name": "x-webhook-secret",
              "value": "={{ $env.WEBHOOK_SECRET }}"
            }
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={\n  \"action\": \"update\",\n  \"organization_id\": \"{{ $json.organization_id }}\",\n  \"platform\": \"meta\",\n  \"name\": \"Meta Ads\",\n  \"status\": \"expired\"\n}",
        "options": {}
      },
      "id": "mark-expired",
      "name": "Mark as Expired",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [1560, 400]
    }
  ],
  "connections": {
    "Diariamente": {
      "main": [
        [
          {
            "node": "Fetch Meta Connections",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Fetch Meta Connections": {
      "main": [
        [
          {
            "node": "Filter Expiring Tokens",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Filter Expiring Tokens": {
      "main": [
        [
          {
            "node": "Refresh Token",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Refresh Token": {
      "main": [
        [
          {
            "node": "Prepare Update",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Prepare Update": {
      "main": [
        [
          {
            "node": "Refresh Success?",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Refresh Success?": {
      "main": [
        [
          {
            "node": "Update Connection",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "Mark as Expired",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  },
  "settings": {
    "executionOrder": "v1"
  },
  "staticData": null,
  "tags": ["meta", "token", "renovacao"]
}
```

---

## Instruções de Importação

1. **No n8n**, vá em **Workflows** → **Import from File** (ou cole o JSON)
2. Configure as **Credenciais** necessárias em **Settings** → **Credentials**
3. Configure as **Variáveis de Ambiente** em **Settings** → **Variables**
4. **Ative** cada workflow após importar
5. Teste cada workflow individualmente antes de usar em produção

## Ordem de Implementação Recomendada

1. ✅ OAuth Meta Ads
2. ✅ Coleta de Métricas
3. ✅ Envio de Relatórios
4. ✅ Verificação de Alertas
5. ✅ Renovação de Token

---

## 6. OAuth Google Ads - Conexão e Sync de Contas

```json
{
  "name": "Google Ads OAuth & Sync",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "GET",
        "path": "google-oauth-callback",
        "responseMode": "responseNode",
        "options": {}
      },
      "id": "webhook-oauth",
      "name": "OAuth Callback",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2,
      "position": [240, 300],
      "webhookId": "google-oauth-callback"
    },
    {
      "parameters": {
        "method": "POST",
        "url": "https://oauth2.googleapis.com/token",
        "sendBody": true,
        "contentType": "form-urlencoded",
        "bodyParameters": {
          "parameters": [
            {
              "name": "code",
              "value": "={{ $json.query.code }}"
            },
            {
              "name": "client_id",
              "value": "={{ $env.GOOGLE_CLIENT_ID }}"
            },
            {
              "name": "client_secret",
              "value": "={{ $env.GOOGLE_CLIENT_SECRET }}"
            },
            {
              "name": "redirect_uri",
              "value": "={{ $env.N8N_WEBHOOK_URL }}/webhook/google-oauth-callback"
            },
            {
              "name": "grant_type",
              "value": "authorization_code"
            }
          ]
        },
        "options": {}
      },
      "id": "exchange-code",
      "name": "Exchange Code for Token",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [460, 300]
    },
    {
      "parameters": {
        "method": "GET",
        "url": "https://googleads.googleapis.com/v15/customers:listAccessibleCustomers",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Authorization",
              "value": "=Bearer {{ $json.access_token }}"
            },
            {
              "name": "developer-token",
              "value": "={{ $env.GOOGLE_ADS_DEVELOPER_TOKEN }}"
            }
          ]
        },
        "options": {}
      },
      "id": "fetch-customers",
      "name": "Fetch Accessible Customers",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [680, 300]
    },
    {
      "parameters": {
        "jsCode": "const tokenData = $('Exchange Code for Token').first().json;\nconst customersData = $input.first().json;\nconst organizationId = $('OAuth Callback').first().json.query.state;\n\n// Preparar contas\nconst resourceNames = customersData.resourceNames || [];\nconst accounts = resourceNames.map(name => {\n  const customerId = name.replace('customers/', '');\n  return {\n    account_id: customerId,\n    name: `Google Ads ${customerId}`,\n    currency: 'BRL',\n    timezone: 'America/Sao_Paulo'\n  };\n});\n\n// Calcular expiração\nconst expiresAt = new Date();\nexpiresAt.setSeconds(expiresAt.getSeconds() + (tokenData.expires_in || 3600));\n\nreturn {\n  organization_id: organizationId,\n  platform: 'google',\n  name: 'Google Ads',\n  access_token: tokenData.access_token,\n  refresh_token: tokenData.refresh_token,\n  expires_at: expiresAt.toISOString(),\n  status: 'connected',\n  accounts: accounts\n};"
      },
      "id": "prepare-data",
      "name": "Prepare Connection Data",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [900, 300]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "={{ $env.SUPABASE_URL }}/functions/v1/webhook-connection",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Content-Type",
              "value": "application/json"
            },
            {
              "name": "x-webhook-secret",
              "value": "={{ $env.WEBHOOK_SECRET }}"
            }
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={\n  \"action\": \"create\",\n  \"organization_id\": \"{{ $json.organization_id }}\",\n  \"platform\": \"{{ $json.platform }}\",\n  \"name\": \"{{ $json.name }}\",\n  \"access_token\": \"{{ $json.access_token }}\",\n  \"refresh_token\": \"{{ $json.refresh_token }}\",\n  \"expires_at\": \"{{ $json.expires_at }}\",\n  \"status\": \"{{ $json.status }}\"\n}",
        "options": {}
      },
      "id": "create-connection",
      "name": "Create Connection",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [1120, 200]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "={{ $env.SUPABASE_URL }}/functions/v1/webhook-connection",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Content-Type",
              "value": "application/json"
            },
            {
              "name": "x-webhook-secret",
              "value": "={{ $env.WEBHOOK_SECRET }}"
            }
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={\n  \"action\": \"sync_accounts\",\n  \"organization_id\": \"{{ $('Prepare Connection Data').first().json.organization_id }}\",\n  \"platform\": \"google\",\n  \"name\": \"Google Ads\",\n  \"accounts\": {{ JSON.stringify($('Prepare Connection Data').first().json.accounts) }}\n}",
        "options": {}
      },
      "id": "sync-accounts",
      "name": "Sync Ad Accounts",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [1340, 200]
    },
    {
      "parameters": {
        "respondWith": "redirect",
        "redirectURL": "={{ $env.APP_URL }}/connections?status=success&platform=google"
      },
      "id": "respond-success",
      "name": "Redirect Success",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1.1,
      "position": [1560, 200]
    }
  ],
  "connections": {
    "OAuth Callback": {
      "main": [[{"node": "Exchange Code for Token", "type": "main", "index": 0}]]
    },
    "Exchange Code for Token": {
      "main": [[{"node": "Fetch Accessible Customers", "type": "main", "index": 0}]]
    },
    "Fetch Accessible Customers": {
      "main": [[{"node": "Prepare Connection Data", "type": "main", "index": 0}]]
    },
    "Prepare Connection Data": {
      "main": [[{"node": "Create Connection", "type": "main", "index": 0}]]
    },
    "Create Connection": {
      "main": [[{"node": "Sync Ad Accounts", "type": "main", "index": 0}]]
    },
    "Sync Ad Accounts": {
      "main": [[{"node": "Redirect Success", "type": "main", "index": 0}]]
    }
  },
  "settings": {"executionOrder": "v1"},
  "tags": ["google", "oauth", "conexoes"]
}
```

---

## 7. Coleta de Métricas Google Ads (Agendado - A cada hora)

```json
{
  "name": "Coleta Métricas Google Ads",
  "nodes": [
    {
      "parameters": {
        "rule": {
          "interval": [{"field": "hours", "hoursInterval": 1}]
        }
      },
      "id": "schedule",
      "name": "A Cada Hora",
      "type": "n8n-nodes-base.scheduleTrigger",
      "typeVersion": 1.2,
      "position": [240, 300]
    },
    {
      "parameters": {
        "method": "GET",
        "url": "={{ $env.SUPABASE_URL }}/rest/v1/ad_connections",
        "sendQuery": true,
        "queryParameters": {
          "parameters": [
            {"name": "select", "value": "id,organization_id,platform,access_token,refresh_token,status"},
            {"name": "platform", "value": "eq.google"},
            {"name": "status", "value": "eq.connected"}
          ]
        },
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {"name": "apikey", "value": "={{ $env.SUPABASE_ANON_KEY }}"},
            {"name": "Authorization", "value": "=Bearer {{ $env.SUPABASE_ANON_KEY }}"}
          ]
        },
        "options": {}
      },
      "id": "fetch-connections",
      "name": "Fetch Google Connections",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [460, 300]
    },
    {
      "parameters": {
        "method": "GET",
        "url": "={{ $env.SUPABASE_URL }}/rest/v1/ad_accounts",
        "sendQuery": true,
        "queryParameters": {
          "parameters": [
            {"name": "select", "value": "id,connection_id,organization_id,account_id,name,is_active"},
            {"name": "connection_id", "value": "=eq.{{ $json.id }}"},
            {"name": "is_active", "value": "eq.true"}
          ]
        },
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {"name": "apikey", "value": "={{ $env.SUPABASE_ANON_KEY }}"},
            {"name": "Authorization", "value": "=Bearer {{ $env.SUPABASE_ANON_KEY }}"}
          ]
        },
        "options": {}
      },
      "id": "fetch-accounts",
      "name": "Fetch Ad Accounts",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [680, 300]
    },
    {
      "parameters": {
        "jsCode": "const connection = $('Fetch Google Connections').item.json;\nconst accounts = $input.all().flatMap(item => {\n  if (Array.isArray(item.json)) return item.json;\n  return [item.json];\n});\n\nreturn accounts.filter(acc => acc.account_id).map(acc => ({\n  account_id: acc.account_id,\n  supabase_id: acc.id,\n  organization_id: acc.organization_id,\n  access_token: connection.access_token,\n  refresh_token: connection.refresh_token\n}));"
      },
      "id": "split-accounts",
      "name": "Split Accounts",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [900, 300]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "=https://googleads.googleapis.com/v15/customers/{{ $json.account_id }}/googleAds:searchStream",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {"name": "Authorization", "value": "=Bearer {{ $json.access_token }}"},
            {"name": "developer-token", "value": "={{ $env.GOOGLE_ADS_DEVELOPER_TOKEN }}"},
            {"name": "login-customer-id", "value": "={{ $json.account_id }}"}
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "{\n  \"query\": \"SELECT metrics.cost_micros, metrics.impressions, metrics.clicks, metrics.ctr, metrics.average_cpc, metrics.conversions, metrics.cost_per_conversion FROM customer WHERE segments.date = '{{ new Date().toISOString().split('T')[0] }}'\"\n}",
        "options": {
          "response": {"response": {"neverError": true}}
        }
      },
      "id": "fetch-metrics",
      "name": "Fetch Google Ads Metrics",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [1120, 300]
    },
    {
      "parameters": {
        "jsCode": "const accountData = $('Split Accounts').item.json;\nconst response = $input.first().json;\n\n// Processar resposta do Google Ads\nconst results = response[0]?.results?.[0] || {};\nconst metricsData = results.metrics || {};\n\nconst metrics = {\n  spend: (parseFloat(metricsData.costMicros || '0') / 1000000),\n  impressions: parseInt(metricsData.impressions || '0'),\n  clicks: parseInt(metricsData.clicks || '0'),\n  ctr: parseFloat(metricsData.ctr || '0') * 100,\n  cpc: (parseFloat(metricsData.averageCpc || '0') / 1000000),\n  conversions: parseFloat(metricsData.conversions || '0'),\n  cost_per_conversion: (parseFloat(metricsData.costPerConversion || '0') / 1000000)\n};\n\nconst today = new Date().toISOString().split('T')[0];\n\nreturn {\n  organization_id: accountData.organization_id,\n  ad_account_id: accountData.supabase_id,\n  date: today,\n  metrics: metrics\n};"
      },
      "id": "prepare-metrics",
      "name": "Prepare Metrics",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [1340, 300]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "={{ $env.SUPABASE_URL }}/functions/v1/webhook-metrics",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {"name": "Content-Type", "value": "application/json"},
            {"name": "x-webhook-secret", "value": "={{ $env.WEBHOOK_SECRET }}"}
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={{ JSON.stringify($json) }}",
        "options": {}
      },
      "id": "save-metrics",
      "name": "Save to Supabase",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [1560, 300]
    }
  ],
  "connections": {
    "A Cada Hora": {
      "main": [[{"node": "Fetch Google Connections", "type": "main", "index": 0}]]
    },
    "Fetch Google Connections": {
      "main": [[{"node": "Fetch Ad Accounts", "type": "main", "index": 0}]]
    },
    "Fetch Ad Accounts": {
      "main": [[{"node": "Split Accounts", "type": "main", "index": 0}]]
    },
    "Split Accounts": {
      "main": [[{"node": "Fetch Google Ads Metrics", "type": "main", "index": 0}]]
    },
    "Fetch Google Ads Metrics": {
      "main": [[{"node": "Prepare Metrics", "type": "main", "index": 0}]]
    },
    "Prepare Metrics": {
      "main": [[{"node": "Save to Supabase", "type": "main", "index": 0}]]
    }
  },
  "settings": {"executionOrder": "v1"},
  "tags": ["google", "metricas", "agendado"]
}
```

---

## 8. Gerenciamento WhatsApp - Evolution API (Criar Instância, QR Code)

```json
{
  "name": "WhatsApp Evolution - Gerenciamento",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "whatsapp-manage",
        "responseMode": "responseNode",
        "options": {}
      },
      "id": "webhook",
      "name": "Webhook Gerenciamento",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2,
      "position": [240, 300],
      "webhookId": "whatsapp-manage"
    },
    {
      "parameters": {
        "conditions": {
          "string": [
            {
              "value1": "={{ $json.body.action }}",
              "operation": "equals",
              "value2": "create_instance"
            }
          ]
        }
      },
      "id": "route-action",
      "name": "Route by Action",
      "type": "n8n-nodes-base.switch",
      "typeVersion": 3,
      "position": [460, 300]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "={{ $env.EVOLUTION_API_URL }}/instance/create",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {"name": "Content-Type", "value": "application/json"},
            {"name": "apikey", "value": "={{ $env.EVOLUTION_API_KEY }}"}
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={\n  \"instanceName\": \"{{ $json.body.instance_name }}\",\n  \"integration\": \"WHATSAPP-BAILEYS\",\n  \"qrcode\": true,\n  \"reject_call\": false,\n  \"webhook\": {\n    \"url\": \"{{ $env.SUPABASE_URL }}/functions/v1/webhook-whatsapp-status\",\n    \"webhook_by_events\": true,\n    \"events\": [\"CONNECTION_UPDATE\", \"MESSAGES_UPSERT\", \"SEND_MESSAGE\"]\n  }\n}",
        "options": {}
      },
      "id": "create-instance",
      "name": "Create Instance",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [680, 100]
    },
    {
      "parameters": {
        "method": "GET",
        "url": "={{ $env.EVOLUTION_API_URL }}/instance/connect/{{ $json.body.instance_name }}",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {"name": "apikey", "value": "={{ $env.EVOLUTION_API_KEY }}"}
          ]
        },
        "options": {}
      },
      "id": "get-qrcode",
      "name": "Get QR Code",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [680, 250]
    },
    {
      "parameters": {
        "method": "GET",
        "url": "={{ $env.EVOLUTION_API_URL }}/instance/connectionState/{{ $json.body.instance_name }}",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {"name": "apikey", "value": "={{ $env.EVOLUTION_API_KEY }}"}
          ]
        },
        "options": {}
      },
      "id": "check-status",
      "name": "Check Connection Status",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [680, 400]
    },
    {
      "parameters": {
        "method": "DELETE",
        "url": "={{ $env.EVOLUTION_API_URL }}/instance/delete/{{ $json.body.instance_name }}",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {"name": "apikey", "value": "={{ $env.EVOLUTION_API_KEY }}"}
          ]
        },
        "options": {}
      },
      "id": "delete-instance",
      "name": "Delete Instance",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [680, 550]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "={{ $env.SUPABASE_URL }}/functions/v1/webhook-whatsapp",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {"name": "Content-Type", "value": "application/json"},
            {"name": "x-webhook-secret", "value": "={{ $env.WEBHOOK_SECRET }}"}
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={\n  \"action\": \"create\",\n  \"organization_id\": \"{{ $('Webhook Gerenciamento').first().json.body.organization_id }}\",\n  \"name\": \"{{ $('Webhook Gerenciamento').first().json.body.instance_name }}\",\n  \"phone_number\": \"\",\n  \"status\": \"disconnected\",\n  \"metadata\": {\n    \"instance_name\": \"{{ $('Webhook Gerenciamento').first().json.body.instance_name }}\",\n    \"qrcode\": \"{{ $json.base64 || $json.code }}\"\n  }\n}",
        "options": {}
      },
      "id": "save-whatsapp",
      "name": "Save to Supabase",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [900, 100]
    },
    {
      "parameters": {
        "respondWith": "json",
        "responseBody": "={{ $json }}"
      },
      "id": "respond",
      "name": "Respond",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1.1,
      "position": [1120, 300]
    }
  ],
  "connections": {
    "Webhook Gerenciamento": {
      "main": [[{"node": "Route by Action", "type": "main", "index": 0}]]
    },
    "Route by Action": {
      "main": [
        [{"node": "Create Instance", "type": "main", "index": 0}],
        [{"node": "Get QR Code", "type": "main", "index": 0}],
        [{"node": "Check Connection Status", "type": "main", "index": 0}],
        [{"node": "Delete Instance", "type": "main", "index": 0}]
      ]
    },
    "Create Instance": {
      "main": [[{"node": "Save to Supabase", "type": "main", "index": 0}]]
    },
    "Save to Supabase": {
      "main": [[{"node": "Respond", "type": "main", "index": 0}]]
    },
    "Get QR Code": {
      "main": [[{"node": "Respond", "type": "main", "index": 0}]]
    },
    "Check Connection Status": {
      "main": [[{"node": "Respond", "type": "main", "index": 0}]]
    },
    "Delete Instance": {
      "main": [[{"node": "Respond", "type": "main", "index": 0}]]
    }
  },
  "settings": {"executionOrder": "v1"},
  "tags": ["whatsapp", "evolution", "gerenciamento"]
}
```

---

## 9. Webhook Status WhatsApp - Receber Atualizações Evolution

```json
{
  "name": "WhatsApp Status Webhook",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "whatsapp-status-callback",
        "responseMode": "lastNode",
        "options": {}
      },
      "id": "webhook",
      "name": "Evolution Webhook",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2,
      "position": [240, 300],
      "webhookId": "whatsapp-status-callback"
    },
    {
      "parameters": {
        "jsCode": "const payload = $input.first().json;\nconst event = payload.event;\nconst instance = payload.instance;\nconst data = payload.data;\n\nlet status = 'disconnected';\nlet phoneNumber = '';\n\nif (event === 'connection.update') {\n  const state = data?.state || data?.connection;\n  if (state === 'open' || state === 'connected') {\n    status = 'connected';\n  } else if (state === 'close' || state === 'disconnected') {\n    status = 'disconnected';\n  } else if (state === 'connecting') {\n    status = 'connecting';\n  }\n  \n  // Tentar extrair número do telefone\n  if (data?.wid?.user) {\n    phoneNumber = data.wid.user;\n  }\n}\n\nreturn {\n  event,\n  instance_name: instance,\n  status,\n  phone_number: phoneNumber,\n  raw_data: data\n};"
      },
      "id": "parse-event",
      "name": "Parse Event",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [460, 300]
    },
    {
      "parameters": {
        "conditions": {
          "string": [
            {
              "value1": "={{ $json.event }}",
              "operation": "equals",
              "value2": "connection.update"
            }
          ]
        }
      },
      "id": "is-connection-event",
      "name": "Is Connection Event?",
      "type": "n8n-nodes-base.if",
      "typeVersion": 2,
      "position": [680, 300]
    },
    {
      "parameters": {
        "method": "GET",
        "url": "={{ $env.SUPABASE_URL }}/rest/v1/whatsapp_accounts",
        "sendQuery": true,
        "queryParameters": {
          "parameters": [
            {"name": "select", "value": "id,organization_id"},
            {"name": "metadata->>instance_name", "value": "=eq.{{ $json.instance_name }}"}
          ]
        },
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {"name": "apikey", "value": "={{ $env.SUPABASE_ANON_KEY }}"},
            {"name": "Authorization", "value": "=Bearer {{ $env.SUPABASE_ANON_KEY }}"}
          ]
        },
        "options": {}
      },
      "id": "find-account",
      "name": "Find WhatsApp Account",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [900, 200]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "={{ $env.SUPABASE_URL }}/functions/v1/webhook-whatsapp",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {"name": "Content-Type", "value": "application/json"},
            {"name": "x-webhook-secret", "value": "={{ $env.WEBHOOK_SECRET }}"}
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={\n  \"action\": \"status\",\n  \"organization_id\": \"{{ $json[0]?.organization_id }}\",\n  \"id\": \"{{ $json[0]?.id }}\",\n  \"status\": \"{{ $('Parse Event').first().json.status }}\",\n  \"phone_number\": \"{{ $('Parse Event').first().json.phone_number }}\"\n}",
        "options": {}
      },
      "id": "update-status",
      "name": "Update Account Status",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [1120, 200]
    },
    {
      "parameters": {
        "respondWith": "json",
        "responseBody": "={\"success\": true}"
      },
      "id": "respond",
      "name": "Respond OK",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1.1,
      "position": [1340, 300]
    }
  ],
  "connections": {
    "Evolution Webhook": {
      "main": [[{"node": "Parse Event", "type": "main", "index": 0}]]
    },
    "Parse Event": {
      "main": [[{"node": "Is Connection Event?", "type": "main", "index": 0}]]
    },
    "Is Connection Event?": {
      "main": [
        [{"node": "Find WhatsApp Account", "type": "main", "index": 0}],
        [{"node": "Respond OK", "type": "main", "index": 0}]
      ]
    },
    "Find WhatsApp Account": {
      "main": [[{"node": "Update Account Status", "type": "main", "index": 0}]]
    },
    "Update Account Status": {
      "main": [[{"node": "Respond OK", "type": "main", "index": 0}]]
    }
  },
  "settings": {"executionOrder": "v1"},
  "tags": ["whatsapp", "evolution", "webhook"]
}
```

---

## 10. Sync de Grupos WhatsApp

```json
{
  "name": "Sync Grupos WhatsApp",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "whatsapp-sync-groups",
        "responseMode": "responseNode",
        "options": {}
      },
      "id": "webhook",
      "name": "Webhook Sync",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2,
      "position": [240, 300],
      "webhookId": "whatsapp-sync-groups"
    },
    {
      "parameters": {
        "method": "GET",
        "url": "={{ $env.EVOLUTION_API_URL }}/group/fetchAllGroups/{{ $json.body.instance_name }}?getParticipants=false",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {"name": "apikey", "value": "={{ $env.EVOLUTION_API_KEY }}"}
          ]
        },
        "options": {}
      },
      "id": "fetch-groups",
      "name": "Fetch Groups from Evolution",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [460, 300]
    },
    {
      "parameters": {
        "jsCode": "const groups = $input.first().json || [];\nconst webhookData = $('Webhook Sync').first().json.body;\n\nreturn (Array.isArray(groups) ? groups : []).map(group => ({\n  group_id: group.id,\n  name: group.subject || group.name,\n  organization_id: webhookData.organization_id,\n  whatsapp_account_id: webhookData.whatsapp_account_id,\n  participants_count: group.size || 0\n}));"
      },
      "id": "map-groups",
      "name": "Map Groups",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [680, 300]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "={{ $env.SUPABASE_URL }}/rest/v1/whatsapp_groups",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {"name": "apikey", "value": "={{ $env.SUPABASE_ANON_KEY }}"},
            {"name": "Authorization", "value": "=Bearer {{ $env.SUPABASE_ANON_KEY }}"},
            {"name": "Content-Type", "value": "application/json"},
            {"name": "Prefer", "value": "resolution=merge-duplicates"}
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={{ JSON.stringify($input.all().map(i => i.json)) }}",
        "options": {}
      },
      "id": "upsert-groups",
      "name": "Upsert Groups",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [900, 300]
    },
    {
      "parameters": {
        "respondWith": "json",
        "responseBody": "={\n  \"success\": true,\n  \"groups_synced\": {{ $('Map Groups').all().length }}\n}"
      },
      "id": "respond",
      "name": "Respond",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1.1,
      "position": [1120, 300]
    }
  ],
  "connections": {
    "Webhook Sync": {
      "main": [[{"node": "Fetch Groups from Evolution", "type": "main", "index": 0}]]
    },
    "Fetch Groups from Evolution": {
      "main": [[{"node": "Map Groups", "type": "main", "index": 0}]]
    },
    "Map Groups": {
      "main": [[{"node": "Upsert Groups", "type": "main", "index": 0}]]
    },
    "Upsert Groups": {
      "main": [[{"node": "Respond", "type": "main", "index": 0}]]
    }
  },
  "settings": {"executionOrder": "v1"},
  "tags": ["whatsapp", "grupos", "sync"]
}
```

---

## 11. Renovação Token Google Ads (Agendado)

```json
{
  "name": "Renovação Token Google Ads",
  "nodes": [
    {
      "parameters": {
        "rule": {
          "interval": [{"field": "minutes", "minutesInterval": 45}]
        }
      },
      "id": "schedule",
      "name": "A Cada 45 Minutos",
      "type": "n8n-nodes-base.scheduleTrigger",
      "typeVersion": 1.2,
      "position": [240, 300]
    },
    {
      "parameters": {
        "method": "GET",
        "url": "={{ $env.SUPABASE_URL }}/rest/v1/ad_connections",
        "sendQuery": true,
        "queryParameters": {
          "parameters": [
            {"name": "select", "value": "id,organization_id,platform,refresh_token,expires_at,status"},
            {"name": "platform", "value": "eq.google"},
            {"name": "status", "value": "eq.connected"}
          ]
        },
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {"name": "apikey", "value": "={{ $env.SUPABASE_ANON_KEY }}"},
            {"name": "Authorization", "value": "=Bearer {{ $env.SUPABASE_ANON_KEY }}"}
          ]
        },
        "options": {}
      },
      "id": "fetch-connections",
      "name": "Fetch Google Connections",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [460, 300]
    },
    {
      "parameters": {
        "jsCode": "const connections = $input.first().json || [];\nconst now = new Date();\nconst tenMinutesFromNow = new Date(now.getTime() + 10 * 60 * 1000);\n\nreturn connections.filter(conn => {\n  if (!conn.expires_at) return true; // Sempre renovar se não tiver expiração\n  const expiresAt = new Date(conn.expires_at);\n  return expiresAt <= tenMinutesFromNow;\n});"
      },
      "id": "filter-expiring",
      "name": "Filter Expiring Tokens",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [680, 300]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "https://oauth2.googleapis.com/token",
        "sendBody": true,
        "contentType": "form-urlencoded",
        "bodyParameters": {
          "parameters": [
            {"name": "client_id", "value": "={{ $env.GOOGLE_CLIENT_ID }}"},
            {"name": "client_secret", "value": "={{ $env.GOOGLE_CLIENT_SECRET }}"},
            {"name": "refresh_token", "value": "={{ $json.refresh_token }}"},
            {"name": "grant_type", "value": "refresh_token"}
          ]
        },
        "options": {"response": {"response": {"neverError": true}}}
      },
      "id": "refresh-token",
      "name": "Refresh Token",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [900, 300]
    },
    {
      "parameters": {
        "jsCode": "const connection = $('Filter Expiring Tokens').item.json;\nconst response = $input.first().json;\n\nif (response.error) {\n  return {\n    success: false,\n    connection_id: connection.id,\n    organization_id: connection.organization_id,\n    error: response.error_description || response.error\n  };\n}\n\nconst expiresAt = new Date();\nexpiresAt.setSeconds(expiresAt.getSeconds() + (response.expires_in || 3600));\n\nreturn {\n  success: true,\n  connection_id: connection.id,\n  organization_id: connection.organization_id,\n  access_token: response.access_token,\n  expires_at: expiresAt.toISOString()\n};"
      },
      "id": "prepare-update",
      "name": "Prepare Update",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [1120, 300]
    },
    {
      "parameters": {
        "conditions": {
          "boolean": [
            {"value1": "={{ $json.success }}", "value2": true}
          ]
        }
      },
      "id": "if-success",
      "name": "Refresh Success?",
      "type": "n8n-nodes-base.if",
      "typeVersion": 2,
      "position": [1340, 300]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "={{ $env.SUPABASE_URL }}/functions/v1/webhook-connection",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {"name": "Content-Type", "value": "application/json"},
            {"name": "x-webhook-secret", "value": "={{ $env.WEBHOOK_SECRET }}"}
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={\n  \"action\": \"update\",\n  \"organization_id\": \"{{ $json.organization_id }}\",\n  \"platform\": \"google\",\n  \"name\": \"Google Ads\",\n  \"access_token\": \"{{ $json.access_token }}\",\n  \"expires_at\": \"{{ $json.expires_at }}\",\n  \"status\": \"connected\"\n}",
        "options": {}
      },
      "id": "update-connection",
      "name": "Update Connection",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [1560, 200]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "={{ $env.SUPABASE_URL }}/functions/v1/webhook-connection",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {"name": "Content-Type", "value": "application/json"},
            {"name": "x-webhook-secret", "value": "={{ $env.WEBHOOK_SECRET }}"}
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={\n  \"action\": \"update\",\n  \"organization_id\": \"{{ $json.organization_id }}\",\n  \"platform\": \"google\",\n  \"name\": \"Google Ads\",\n  \"status\": \"expired\"\n}",
        "options": {}
      },
      "id": "mark-expired",
      "name": "Mark as Expired",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [1560, 400]
    }
  ],
  "connections": {
    "A Cada 45 Minutos": {
      "main": [[{"node": "Fetch Google Connections", "type": "main", "index": 0}]]
    },
    "Fetch Google Connections": {
      "main": [[{"node": "Filter Expiring Tokens", "type": "main", "index": 0}]]
    },
    "Filter Expiring Tokens": {
      "main": [[{"node": "Refresh Token", "type": "main", "index": 0}]]
    },
    "Refresh Token": {
      "main": [[{"node": "Prepare Update", "type": "main", "index": 0}]]
    },
    "Prepare Update": {
      "main": [[{"node": "Refresh Success?", "type": "main", "index": 0}]]
    },
    "Refresh Success?": {
      "main": [
        [{"node": "Update Connection", "type": "main", "index": 0}],
        [{"node": "Mark as Expired", "type": "main", "index": 0}]
      ]
    }
  },
  "settings": {"executionOrder": "v1"},
  "tags": ["google", "token", "renovacao"]
}
```

---

## 12. Teste de Envio WhatsApp (Manual)

```json
{
  "name": "Teste Envio WhatsApp",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "whatsapp-test-send",
        "responseMode": "responseNode",
        "options": {}
      },
      "id": "webhook",
      "name": "Webhook Test",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2,
      "position": [240, 300],
      "webhookId": "whatsapp-test-send"
    },
    {
      "parameters": {
        "jsCode": "const body = $input.first().json.body;\n\nlet number = body.phone_number || '';\n// Limpar número\nnumber = number.replace(/\\D/g, '');\n\n// Adicionar código do país se necessário\nif (!number.startsWith('55') && number.length <= 11) {\n  number = '55' + number;\n}\n\nconst isGroup = body.is_group || false;\nconst suffix = isGroup ? '@g.us' : '@s.whatsapp.net';\n\nreturn {\n  instance_name: body.instance_name || 'default',\n  number: number + suffix,\n  message: body.message || 'Teste de envio do AdReport!',\n  api_key: body.api_key\n};"
      },
      "id": "prepare",
      "name": "Prepare Message",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [460, 300]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "={{ $env.EVOLUTION_API_URL }}/message/sendText/{{ $json.instance_name }}",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {"name": "Content-Type", "value": "application/json"},
            {"name": "apikey", "value": "={{ $json.api_key || $env.EVOLUTION_API_KEY }}"}
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={\n  \"number\": \"{{ $json.number }}\",\n  \"text\": {{ JSON.stringify($json.message) }}\n}",
        "options": {"response": {"response": {"neverError": true}}}
      },
      "id": "send",
      "name": "Send Message",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [680, 300]
    },
    {
      "parameters": {
        "jsCode": "const response = $input.first().json;\n\nconst success = response.key?.id || response.status === 'PENDING';\n\nreturn {\n  success,\n  message_id: response.key?.id || null,\n  error: success ? null : (response.message || response.error || 'Erro desconhecido'),\n  raw_response: response\n};"
      },
      "id": "parse-response",
      "name": "Parse Response",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [900, 300]
    },
    {
      "parameters": {
        "respondWith": "json",
        "responseBody": "={{ JSON.stringify($json) }}"
      },
      "id": "respond",
      "name": "Respond",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1.1,
      "position": [1120, 300]
    }
  ],
  "connections": {
    "Webhook Test": {
      "main": [[{"node": "Prepare Message", "type": "main", "index": 0}]]
    },
    "Prepare Message": {
      "main": [[{"node": "Send Message", "type": "main", "index": 0}]]
    },
    "Send Message": {
      "main": [[{"node": "Parse Response", "type": "main", "index": 0}]]
    },
    "Parse Response": {
      "main": [[{"node": "Respond", "type": "main", "index": 0}]]
    }
  },
  "settings": {"executionOrder": "v1"},
  "tags": ["whatsapp", "teste", "evolution"]
}
```

---

## Variáveis de Ambiente Completas

Configure estas variáveis no n8n em **Settings → Variables**:

```
# Supabase
SUPABASE_URL=https://ksvcszizxrtwcdjbvukm.supabase.co
SUPABASE_ANON_KEY=seu_anon_key_aqui
WEBHOOK_SECRET=seu_webhook_secret_aqui

# Evolution API
EVOLUTION_API_URL=https://n8n-evolution-api.5lgyrt.easypanel.host
EVOLUTION_API_KEY=sua_api_key_evolution

# Meta Ads
META_APP_ID=seu_meta_app_id
META_APP_SECRET=seu_meta_app_secret

# Google Ads
GOOGLE_CLIENT_ID=seu_google_client_id
GOOGLE_CLIENT_SECRET=seu_google_client_secret
GOOGLE_ADS_DEVELOPER_TOKEN=seu_developer_token

# App
APP_URL=https://seu-app.lovable.app
N8N_WEBHOOK_URL=https://seu-n8n.com
```

---

## Resumo dos Workflows

| # | Nome | Tipo | Frequência |
|---|------|------|------------|
| 1 | Meta Ads OAuth & Sync | Webhook | Sob demanda |
| 2 | Coleta Métricas Meta Ads | Agendado | A cada hora |
| 3 | Envio Relatórios WhatsApp | Agendado | A cada 5 min |
| 4 | Verificação de Alertas | Agendado | A cada 30 min |
| 5 | Renovação Token Meta | Agendado | Diário |
| 6 | Google Ads OAuth & Sync | Webhook | Sob demanda |
| 7 | Coleta Métricas Google Ads | Agendado | A cada hora |
| 8 | WhatsApp Gerenciamento | Webhook | Sob demanda |
| 9 | WhatsApp Status Webhook | Webhook | Eventos |
| 10 | Sync Grupos WhatsApp | Webhook | Sob demanda |
| 11 | Renovação Token Google | Agendado | A cada 45 min |
| 12 | Teste Envio WhatsApp | Webhook | Manual |

---

## URLs dos Webhooks Supabase

```
Conexão: https://ksvcszizxrtwcdjbvukm.supabase.co/functions/v1/webhook-connection
Métricas: https://ksvcszizxrtwcdjbvukm.supabase.co/functions/v1/webhook-metrics
Trigger Relatórios: https://ksvcszizxrtwcdjbvukm.supabase.co/functions/v1/webhook-report-trigger
Relatório Enviado: https://ksvcszizxrtwcdjbvukm.supabase.co/functions/v1/webhook-report-sent
WhatsApp: https://ksvcszizxrtwcdjbvukm.supabase.co/functions/v1/webhook-whatsapp
Alertas: https://ksvcszizxrtwcdjbvukm.supabase.co/functions/v1/webhook-alert
```
