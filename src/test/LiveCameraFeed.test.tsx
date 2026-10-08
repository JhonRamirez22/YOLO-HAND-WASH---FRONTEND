import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LiveCameraFeed } from '../components/LiveCameraFeed'
import { useSessionStore } from '../stores/sessionStore'

describe('LiveCameraFeed session binding', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  beforeEach(() => {
    useSessionStore.getState().endSession()
  })

  it('does not display an unpaired camera stream when no dashboard session is active', () => {
    render(<LiveCameraFeed />)

    expect(screen.getByText('Inicia o vincula una sesión')).toBeInTheDocument()
    expect(screen.queryByRole('img', {
      name: 'Video en vivo de las manos con las detecciones del modelo YOLO superpuestas',
    })).not.toBeInTheDocument()
  })

  it('requests video for the exact session owned by the Stepper', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ camera: 'connected', sessionId: 'camera-session-1' }),
    });
    vi.stubGlobal('fetch', fetchMock);
    useSessionStore.getState().startSession('camera-session-1', 'DOMESTICO', 'dashboard-token')
    render(<LiveCameraFeed />)

    const image = screen.getByRole('img', {
      name: 'Video en vivo de las manos con las detecciones del modelo YOLO superpuestas',
    })
    const streamUrl = new URL((image as HTMLImageElement).src)
    expect(streamUrl.searchParams.get('sessionId')).toBe('camera-session-1')
    expect(streamUrl.searchParams.get('retry')).toBe('0')
    expect(streamUrl.searchParams.has('access_token')).toBe(false)

    fireEvent.load(image)
    expect(await screen.findByText('En vivo')).toBeInTheDocument()

    fireEvent.error(image)
    expect(screen.getByText('No llega el video de esta sesión')).toBeInTheDocument()
    expect(screen.getByText(/código de vinculación de esta misma sesión/i)).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/health' }),
      expect.objectContaining({ cache: 'no-store' }),
    )
  })

  it('distinguishes an open MJPEG stream from a camera that is reconnecting', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ camera: 'reconnecting', sessionId: 'camera-session-1' }),
    }))
    useSessionStore.getState().startSession('camera-session-1', 'DOMESTICO', 'dashboard-token')
    render(<LiveCameraFeed />)

    const image = screen.getByRole('img', {
      name: 'Video en vivo de las manos con las detecciones del modelo YOLO superpuestas',
    })
    fireEvent.load(image)

    expect(await screen.findByText('Cámara reconectando')).toBeInTheDocument()
    expect(screen.queryByText('En vivo')).not.toBeInTheDocument()
    expect(fetch).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/health' }),
      expect.objectContaining({ cache: 'no-store' }),
    )
  })

  it('shows the camera warmup state before Java receives the first step', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        camera: 'connected',
        sessionId: 'camera-session-1',
        handPresence: {
          handsVisible: 2,
          warmupElapsedMs: 1500,
          warmupRequiredMs: 3000,
          warmupComplete: false,
          stepsEnabled: false,
        },
      }),
    }))
    useSessionStore.getState().startSession('camera-session-1', 'DOMESTICO', 'dashboard-token')
    render(<LiveCameraFeed />)

    fireEvent.load(screen.getByRole('img', {
      name: 'Video en vivo de las manos con las detecciones del modelo YOLO superpuestas',
    }))

    expect(await screen.findByText('Estabilizando manos: 1.5/3.0 s')).toBeInTheDocument()
  })

  it('does not present the local camera gate as Java-confirmed readiness', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        camera: 'connected',
        sessionId: 'camera-session-1',
        handPresence: {
          handsVisible: 2,
          warmupElapsedMs: 3000,
          warmupRequiredMs: 3000,
          warmupComplete: true,
          stepsEnabled: true,
        },
      }),
    }))
    useSessionStore.getState().startSession('camera-session-1', 'DOMESTICO', 'dashboard-token')
    useSessionStore.getState().setDetectionDiagnostics({
      estadoIntencion: 'MANOS_PRESENTES',
      motivoIntencion: 'PRESENCIA_NO_ESTABILIZADA',
      manosVisiblesIntencion: 2,
      tiempoConfirmacionIntencionMs: 0,
      umbralConfirmacionIntencionMs: 650,
      claseCandidata: '',
      confianzaCandidata: null,
    })
    render(<LiveCameraFeed />)

    fireEvent.load(screen.getByRole('img', {
      name: 'Video en vivo de las manos con las detecciones del modelo YOLO superpuestas',
    }))

    expect(await screen.findByText('Dos manos detectadas · verificando preparación')).toBeInTheDocument()
    expect(screen.queryByText('Ambas manos estables · inicia con palmas')).not.toBeInTheDocument()
  })

  it('shows Java readiness only after the backend confirms washing intent', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        camera: 'connected',
        sessionId: 'camera-session-1',
        handPresence: {
          handsVisible: 2,
          warmupElapsedMs: 3000,
          warmupRequiredMs: 3000,
          warmupComplete: true,
          stepsEnabled: true,
        },
      }),
    }))
    useSessionStore.getState().startSession('camera-session-1', 'DOMESTICO', 'dashboard-token')
    useSessionStore.getState().setDetectionDiagnostics({
      estadoIntencion: 'LAVADO_PROBABLE',
      motivoIntencion: 'Palmas reconocidas de forma sostenida; inicia la evaluación',
      manosVisiblesIntencion: 2,
      tiempoConfirmacionIntencionMs: 650,
      umbralConfirmacionIntencionMs: 650,
      claseCandidata: 'PASO_1_PALMAS',
      confianzaCandidata: 0.9,
    })
    render(<LiveCameraFeed />)

    fireEvent.load(screen.getByRole('img', {
      name: 'Video en vivo de las manos con las detecciones del modelo YOLO superpuestas',
    }))

    expect(await screen.findByText('Dos manos visibles · seguimiento de pasos activo')).toBeInTheDocument()
  })

  it('expires camera health instead of keeping a stale connected state when polling hangs', async () => {
    vi.useFakeTimers()
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ camera: 'connected', sessionId: 'camera-session-1' }),
      })
      .mockImplementationOnce((_url: URL, options: RequestInit) => new Promise((_resolve, reject) => {
        options.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
      }))
    vi.stubGlobal('fetch', fetchMock)
    useSessionStore.getState().startSession('camera-session-1', 'DOMESTICO', 'dashboard-token')
    render(<LiveCameraFeed />)

    const image = screen.getByRole('img', {
      name: 'Video en vivo de las manos con las detecciones del modelo YOLO superpuestas',
    })
    fireEvent.load(image)
    await act(async () => { await Promise.resolve(); await Promise.resolve() })
    expect(screen.getByText('En vivo')).toBeInTheDocument()

    await act(async () => { await vi.advanceTimersByTimeAsync(1_500) })
    expect(fetchMock).toHaveBeenCalledTimes(2)
    await act(async () => { await vi.advanceTimersByTimeAsync(2_000) })

    expect(screen.getByText('Stream conectado · cámara sin verificar')).toBeInTheDocument()
  })
})
