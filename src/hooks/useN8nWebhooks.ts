// Hook para chamar webhooks do n8n
import { useAuth } from '@/contexts/AuthContext';

// n8n base URL from CONFIG workflow
const N8N_BASE_URL = 'https://n8n-n8n.5lgyrt.easypanel.host';

interface WebhookOptions {
  headers?: Record<string, string>;
}

export function useN8nWebhooks() {
  const { organizationId } = useAuth();

  const callWebhook = async (
    path: string,
    body: Record<string, unknown>,
    options?: WebhookOptions
  ) => {
    const url = `${N8N_BASE_URL}/webhook/${path}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: JSON.stringify({
        organization_id: organizationId,
        ...body,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Webhook call failed');
    }

    return response.json();
  };

  // WhatsApp Management
  const whatsappManagement = {
    create: async (instanceName: string) => {
      return callWebhook('whatsapp-management', {
        action: 'create',
        instance_name: instanceName,
      });
    },
    
    getQrCode: async (instanceName: string) => {
      return callWebhook('whatsapp-management', {
        action: 'qrcode',
        instance_name: instanceName,
      });
    },
    
    getStatus: async (instanceName: string) => {
      return callWebhook('whatsapp-management', {
        action: 'status',
        instance_name: instanceName,
      });
    },
    
    delete: async (instanceName: string) => {
      return callWebhook('whatsapp-management', {
        action: 'delete',
        instance_name: instanceName,
      });
    },
    
    logout: async (instanceName: string) => {
      return callWebhook('whatsapp-management', {
        action: 'logout',
        instance_name: instanceName,
      });
    },
    
    restart: async (instanceName: string) => {
      return callWebhook('whatsapp-management', {
        action: 'restart',
        instance_name: instanceName,
      });
    },
  };

  // WhatsApp Test Send
  const sendTestMessage = async (params: {
    phoneNumber: string;
    message: string;
    instanceName?: string;
    isGroup?: boolean;
    apiKey?: string;
  }) => {
    return callWebhook('whatsapp-test-send', {
      phone_number: params.phoneNumber,
      message: params.message,
      instance_name: params.instanceName || 'gzappw',
      is_group: params.isGroup || false,
      api_key: params.apiKey,
    });
  };

  // Sync WhatsApp Groups
  const syncWhatsAppGroups = async () => {
    return callWebhook('whatsapp-sync-groups', {});
  };

  return {
    whatsappManagement,
    sendTestMessage,
    syncWhatsAppGroups,
    callWebhook,
  };
}
