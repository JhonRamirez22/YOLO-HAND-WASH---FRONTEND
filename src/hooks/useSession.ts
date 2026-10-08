import { useCallback } from 'react';
import { useSessionStore } from '@/stores/sessionStore';
import { useWebSocket } from './useWebSocket';
import type { Protocolo } from '@/types';
import { RuntimeEndpointConfig } from '@/lib/RuntimeEndpointConfig';

const API_URL = RuntimeEndpointConfig.apiBaseUrl();

export function useSession() {
  const { startSession, endSession, isActive, sessionId, accessToken, isOwner } = useSessionStore();
  const { connect, disconnect } = useWebSocket();

  const start = useCallback(
    async (protocolo: Protocolo) => {
      try {
        const activeResponse = await fetch(`${API_URL}/api/v1/session/active`);
        let data: { sessionId: string; protocolo: Protocolo; pairingCode?: string; accessToken?: string } | null = null;

        if (activeResponse.ok && activeResponse.status !== 204) {
          const active = (await activeResponse.json()) as { sessionId: string; protocolo: Protocolo; accessRequired?: boolean };
          if (active.protocolo === protocolo && active.accessRequired === false) {
            const detailResponse = await fetch(`${API_URL}/api/v1/session/${active.sessionId}`);
            if (!detailResponse.ok) throw new Error('No se pudo consultar la sesión activa');
            data = (await detailResponse.json()) as { sessionId: string; protocolo: Protocolo; pairingCode?: string };
          }
        } else if (activeResponse.status !== 204 && activeResponse.status !== 409) {
          throw new Error(`No se pudo consultar la sesión activa: HTTP ${activeResponse.status}`);
        }

        const response = data ? null : await fetch(`${API_URL}/api/v1/session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ protocolo, producerProtocolVersion: '2' }),
        });

        if (response && !response.ok) {
          throw new Error(`Failed to create session: ${response.statusText}`);
        }

        if (!data && response) data = (await response.json()) as { sessionId: string; protocolo: Protocolo; pairingCode?: string; accessToken?: string };
        if (!data) throw new Error('No se pudo obtener una sesión activa');
        if (response && !data.accessToken) throw new Error('Falta el token de sesión');
        startSession(data.sessionId, protocolo, data.accessToken ?? null);
        connect(data.sessionId, data.accessToken ?? null);
        return data.pairingCode ?? null;
      } catch (error) {
        console.error('Error starting session:', error);
        throw error;
      }
    },
    [startSession, connect]
  );

  const join = useCallback(async (code: string) => {
    const response = await fetch(`${API_URL}/api/v1/auth/dashboard-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: code.trim() }),
    });
    if (!response.ok) {
      throw new Error(response.status === 404
        ? 'Código inválido o sesión terminada'
        : `No se pudo vincular la sesión: HTTP ${response.status}`);
    }
    const paired = (await response.json()) as {
      sessionId: string; protocolo: Protocolo; role: 'VIEWER'; accessToken: string;
    };
    if (!paired.sessionId || !paired.accessToken || paired.role !== 'VIEWER') {
      throw new Error('Respuesta de vinculación del dashboard inválida');
    }
    startSession(paired.sessionId, paired.protocolo, paired.accessToken, false);
    connect(paired.sessionId, paired.accessToken);
  }, [startSession, connect]);

  const stop = useCallback(async () => {
    if (!sessionId) return;

    if (!isOwner) {
      disconnect();
      endSession();
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/v1/session/${sessionId}`, {
        method: 'DELETE',
        headers: accessToken ? { 'X-Session-Token': accessToken } : {},
      });
      if (!response.ok) throw new Error(`No se pudo detener la sesión: HTTP ${response.status}`);
      disconnect();
      endSession();
    } catch (error) {
      console.error('Error stopping session:', error);
      throw error;
    }
  }, [sessionId, accessToken, isOwner, disconnect, endSession]);

  return { start, join, stop, isActive, isOwner };
}
