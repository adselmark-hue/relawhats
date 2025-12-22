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

## URLs dos Webhooks Supabase

```
Conexão: https://ksvcszizxrtwcdjbvukm.supabase.co/functions/v1/webhook-connection
Métricas: https://ksvcszizxrtwcdjbvukm.supabase.co/functions/v1/webhook-metrics
Trigger Relatórios: https://ksvcszizxrtwcdjbvukm.supabase.co/functions/v1/webhook-report-trigger
Relatório Enviado: https://ksvcszizxrtwcdjbvukm.supabase.co/functions/v1/webhook-report-sent
WhatsApp: https://ksvcszizxrtwcdjbvukm.supabase.co/functions/v1/webhook-whatsapp
Alertas: https://ksvcszizxrtwcdjbvukm.supabase.co/functions/v1/webhook-alert
```
