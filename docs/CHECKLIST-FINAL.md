# ✅ CHECKLIST FINAL - RelaWhats

**Data:** 23/12/2025  
**Status Geral:** 85% Pronto

---

## 📊 VISÃO GERAL DO SISTEMA

### Arquitetura
```
Frontend (React/Vite)
    ↓ API calls
Supabase (Auth + Database + Edge Functions)
    ↓ Webhooks
n8n (Automação)
    ↓ API calls
Evolution API (WhatsApp)
Meta Graph API (Facebook/Instagram Ads)
Google Ads API
```

---

## ✅ COMPONENTES PRONTOS

### 1. Frontend (React + Vite + Tailwind)
- [x] Sistema de autenticação (login/registro)
- [x] Dashboard principal
- [x] Página de Conexões (Meta/Google Ads)
- [x] Página de Serviços (WhatsApp)
- [x] Página de Relatórios (CRUD completo)
- [x] Wizard de criação de relatórios
- [x] Página de Alertas
- [x] Página de Clientes
- [x] Design responsivo e dark mode

### 2. Supabase
- [x] Autenticação configurada
- [x] Tabelas criadas (reports, ad_connections, whatsapp_accounts, etc.)
- [x] RLS policies configuradas
- [x] Edge Functions deployadas (9 funções)

### 3. n8n Workflows
- [x] Config (variáveis centralizadas)
- [x] WhatsApp Gerenciamento
- [x] WhatsApp Test Send  
- [x] Sync Grupos WhatsApp
- [x] Webhook Status WhatsApp
- [x] Envio Relatórios WhatsApp
- [x] Coleta Métricas Meta
- [x] Coleta Métricas Google
- [x] Verificação de Alertas
- [x] Renovação Token Google

### 4. Secrets Configurados
- [x] APP_URL
- [x] META_APP_ID
- [x] META_APP_SECRET
- [x] VITE_SUPABASE_URL
- [x] VITE_SUPABASE_ANON_KEY
- [x] WEBHOOK_SECRET

---

## ⚠️ O QUE FALTA CONFIGURAR

### 1. n8n - Workflow Config (VOCÊ DEVE FAZER)
Atualize o nó "Set" do workflow Config no n8n com:

```json
{
  "SUPABASE_URL": "https://otuyyxippyyieeleviid.supabase.co",
  "SUPABASE_ANON_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90dXl5eGlwcHl5aWVlbGV2aWlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxMTM5MTUsImV4cCI6MjA4MTY4OTkxNX0.xKYOpyGP5S15uvbWxfEXYXeQRrsnVii_TuoPRO3aI6g",
  "WEBHOOK_SECRET": "",
  "EVOLUTION_API_URL": "https://n8n-evolution-api.5lgyrt.easypanel.host/",
  "EVOLUTION_API_KEY": "FA98925AB3F1-45BB-A7C1-1098A647709A",
  "EVOLUTION_INSTANCE_NAME": "Elmark AI",
  "META_ACCESS_TOKEN": "EAAMQcYB80CYBQeMrVZB12tZCz7kg3CrkR2oUdd95iO9ELnkR46iMYk3y0FBXWRrQWzFD45j8GcUxYbDtmyqJo6vWx34dxJMRITtezMCEgRjWe33ZBLrdDcF8fWzvrXVxpoGSgVZA2uhPpgxHXAk0SiNdqhpbsxV2ZBairinacJJjPSkFkjl6Ocu9d4vDnvUzA",
  "META_APP_ID": "862504603144230",
  "META_APP_SECRET": "5e94b3ba8f4accfc15594acc1012f419",
  "GOOGLE_CLIENT_ID": "241082414427-bs1fprv4542vbn88mik5c9429lm5uuv6.apps.googleusercontent.com",
  "GOOGLE_CLIENT_SECRET": "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",
  "GOOGLE_ADS_DEVELOPER_TOKEN": "dCeVEq65btFOsHU-fqTOaA",
  "GOOGLE_ADS_REFRESH_TOKEN": "1//04m_I0_tA6AJNCgYIARAAGAQSNwF-L9IrPzcgwd0oJeuL9g5VQ8bJfEzH06JGomWsvBs-SR4gEHJCC5R9-1p0LsApji-MBfgpMrU",
  "APP_URL": "https://relawhats.lovable.app",
  "N8N_BASE_URL": "https://n8n-n8n.5lgyrt.easypanel.host/"
}
```

### 2. Ativar Workflows Agendados no n8n
Os seguintes workflows precisam estar ATIVOS no n8n:

| Workflow | Schedule | Status |
|----------|----------|--------|
| Envio Relatórios WhatsApp | A cada 1 minuto | ⚠️ Verificar se ativo |
| Coleta Métricas Meta | A cada 6 horas | ⚠️ Verificar se ativo |
| Coleta Métricas Google | A cada 6 horas | ⚠️ Verificar se ativo |
| Verificação de Alertas | A cada 15 min | ⚠️ Verificar se ativo |
| Renovação Token Google | A cada 45 min | ⚠️ Verificar se ativo |

### 3. Meta Ads OAuth (OPCIONAL - já funciona via Edge Function)
O OAuth do Meta já funciona via edge function do Supabase. Os workflows de OAuth no n8n são placeholders.

---

## 🧪 TESTES PARA VALIDAR

### Teste 1: Conexão WhatsApp
1. Vá em **Serviços**
2. Clique em **Nova Conta**
3. Digite um nome e clique **Gerar QR Code**
4. Escaneie o QR Code com WhatsApp
5. Clique em **Status** para verificar conexão

### Teste 2: Envio de Mensagem
1. Com WhatsApp conectado, clique em **Testar**
2. Digite um número no formato: `5511999999999`
3. Clique **Enviar Teste**
4. Verifique se a mensagem chegou

### Teste 3: Conexão Meta Ads
1. Vá em **Conexões**
2. Clique **Conectar com Meta**
3. Autorize no Facebook
4. Verifique se aparece "Conectado"
5. Clique **Sincronizar** para puxar contas

### Teste 4: Criar Relatório
1. Vá em **Relatórios** → **Criar Relatório**
2. Configure nome, canal, período, frequência
3. Configure destinatário (número ou grupo)
4. Salve o relatório
5. Clique **Enviar Agora** para testar envio

---

## 🔗 URLs DOS WEBHOOKS N8N

| Webhook | URL | Usado por |
|---------|-----|-----------|
| WhatsApp Management | `https://n8n-n8n.5lgyrt.easypanel.host/webhook/whatsapp-management` | Página Serviços |
| WhatsApp Test Send | `https://n8n-n8n.5lgyrt.easypanel.host/webhook/whatsapp-test-send` | Teste de envio |
| WhatsApp Sync Groups | `https://n8n-n8n.5lgyrt.easypanel.host/webhook/whatsapp-sync-groups` | Sincronizar grupos |
| WhatsApp Status Callback | `https://n8n-n8n.5lgyrt.easypanel.host/webhook/whatsapp-status-callback` | Evolution API callback |

---

## 📋 FLUXO COMPLETO DE UM RELATÓRIO

```
1. Usuário cria relatório no frontend
   ↓
2. Relatório salvo na tabela `reports` (Supabase)
   ↓
3. Workflow "Envio Relatórios WhatsApp" roda a cada 1 min
   ↓
4. Busca relatórios com next_send_at <= agora e is_active = true
   ↓
5. Para cada relatório:
   a. Busca métricas da tabela `ad_metrics`
   b. Formata mensagem com template
   c. Envia via Evolution API
   d. Atualiza last_sent_at e next_send_at
   ↓
6. Usuário recebe mensagem no WhatsApp
```

---

## 🚨 PROBLEMAS CONHECIDOS E SOLUÇÕES

### Problema: "Failed to fetch" ao conectar Meta
**Causa:** Edge function não deployada ou erro de CORS
**Solução:** Verificar logs do edge function no Supabase

### Problema: QR Code não aparece
**Causa:** Evolution API não responde ou instância não existe
**Solução:** Verificar se Evolution API está online e configurada no n8n

### Problema: Relatório não é enviado
**Causa:** Workflow não está ativo ou métricas não foram coletadas
**Solução:** 
1. Verificar se workflow está ativo no n8n
2. Verificar se há métricas na tabela `ad_metrics`
3. Verificar se `next_send_at` está correto

### Problema: Métricas não aparecem
**Causa:** Coleta de métricas não está rodando
**Solução:** Ativar workflows de coleta no n8n e verificar conexões

---

## 📈 PRÓXIMOS PASSOS (MELHORIAS FUTURAS)

1. [ ] Implementar OAuth Google Ads via Edge Function
2. [ ] Dashboard com gráficos de performance
3. [ ] Histórico de envios de relatórios
4. [ ] Templates de relatório personalizáveis
5. [ ] Integração com mais plataformas (TikTok, LinkedIn)
6. [ ] App mobile (React Native)

---

## 📞 SUPORTE

- **App URL:** https://relawhats.lovable.app
- **n8n URL:** https://n8n-n8n.5lgyrt.easypanel.host
- **Evolution API:** https://n8n-evolution-api.5lgyrt.easypanel.host
- **Supabase:** https://otuyyxippyyieeleviid.supabase.co
