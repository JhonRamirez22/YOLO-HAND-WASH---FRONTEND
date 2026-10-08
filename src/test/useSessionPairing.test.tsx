import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useSession } from '../hooks/useSession';
import { useSessionStore } from '../stores/sessionStore';

const socket = vi.hoisted(() => ({ connect: vi.fn(), disconnect: vi.fn() }));
vi.mock('../hooks/useWebSocket', () => ({ useWebSocket: () => socket }));

function jsonResponse(body: object, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('useSession pairing', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    socket.connect.mockReset();
    socket.disconnect.mockReset();
    useSessionStore.setState({ sessionId: null, accessToken: null, isOwner: false,
      protocolo: null, isActive: false });
  });

  it('creates a distinct session on ambiguous discovery and returns its code', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ error: 'SESIONES_ACTIVAS_AMBIGUAS' }, 409))
      .mockResolvedValueOnce(jsonResponse({
        sessionId: 'new-session', protocolo: 'DOMESTICO', pairingCode: 'ABCDE-FGHIJ', accessToken: 'owner-token',
      }));
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useSession());

    let code: string | null = null;
    await act(async () => { code = await result.current.start('DOMESTICO'); });

    expect(code).toBe('ABCDE-FGHIJ');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][1]).toMatchObject({
      method: 'POST',
      body: JSON.stringify({ protocolo: 'DOMESTICO', producerProtocolVersion: '2' }),
    });
    expect(useSessionStore.getState().sessionId).toBe('new-session');
    expect(socket.connect).toHaveBeenCalledWith('new-session', 'owner-token');
  });

  it('reuses the unique matching session and loads its pairing code', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ sessionId: 'existing', protocolo: 'DOMESTICO', accessRequired: false }))
      .mockResolvedValueOnce(jsonResponse({
        sessionId: 'existing', protocolo: 'DOMESTICO', pairingCode: 'KLMNO-PQRST',
      }));
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useSession());

    let code: string | null = null;
    await act(async () => { code = await result.current.start('DOMESTICO'); });

    expect(code).toBe('KLMNO-PQRST');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(socket.connect).toHaveBeenCalledWith('existing', null);
  });

  it('does not claim an existing protected session without its token', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({
        sessionId: 'someone-else', protocolo: 'DOMESTICO', accessRequired: true,
      }))
      .mockResolvedValueOnce(jsonResponse({
        sessionId: 'new-session', protocolo: 'DOMESTICO',
        pairingCode: 'ABCDE-FGHIJ', accessToken: 'new-owner-token',
      }));
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useSession());

    await act(async () => { await result.current.start('DOMESTICO'); });

    expect(useSessionStore.getState().sessionId).toBe('new-session');
    expect(useSessionStore.getState().accessToken).toBe('new-owner-token');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('keeps the session and token when the server rejects stopping it', async () => {
    useSessionStore.getState().startSession('existing', 'DOMESTICO', 'owner-token');
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ error: 'ACCESO_NO_AUTORIZADO' }, 401));
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useSession());

    await expect(act(async () => { await result.current.stop(); })).rejects.toThrow();
    expect(useSessionStore.getState().isActive).toBe(true);
    expect(useSessionStore.getState().accessToken).toBe('owner-token');
    expect(socket.disconnect).not.toHaveBeenCalled();
  });

  it('joins a camera-owned session and leaves without deleting it', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({
      sessionId: 'iphone-session', protocolo: 'CLINICO_QUIRURGICO',
      role: 'VIEWER', accessToken: 'viewer-token',
    }));
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useSession());

    await act(async () => { await result.current.join('ABCDE-FGHIJ'); });
    expect(useSessionStore.getState().isOwner).toBe(false);
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/api/v1/auth/dashboard-login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'ABCDE-FGHIJ' }),
    });
    expect(socket.connect).toHaveBeenCalledWith('iphone-session', 'viewer-token');

    await act(async () => { await result.current.stop(); });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(socket.disconnect).toHaveBeenCalled();
    expect(useSessionStore.getState().isActive).toBe(false);
  });
});
