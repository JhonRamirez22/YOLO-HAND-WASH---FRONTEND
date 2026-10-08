import { useEffect, useState } from 'react';
import { LoaderCircle, ScanEye, Wifi, WifiOff } from 'lucide-react';
import { useSessionStore } from '@/stores/sessionStore';
import { STEP_LABELS } from '@/types';
import { RuntimeEndpointConfig } from '@/lib/RuntimeEndpointConfig';

type StreamStatus = 'idle' | 'connecting' | 'live' | 'offline';
type CameraHealth = 'connected' | 'reconnecting' | 'unknown';
type HandPresence = {
  handsVisible: number;
  warmupElapsedMs: number;
  warmupRequiredMs: number;
  warmupComplete: boolean;
  stepsEnabled: boolean;
};

function parseHandPresence(value: unknown): HandPresence | null {
  if (typeof value !== 'object' || value === null) return null;
  const status = value as Record<string, unknown>;
  const { handsVisible, warmupElapsedMs, warmupRequiredMs, warmupComplete, stepsEnabled } = status;
  if (!Number.isInteger(handsVisible) || (handsVisible as number) < 0 || (handsVisible as number) > 2
    || !Number.isInteger(warmupElapsedMs) || (warmupElapsedMs as number) < 0
    || !Number.isInteger(warmupRequiredMs) || (warmupRequiredMs as number) < 0
    || (warmupRequiredMs as number) > 10_000
    || typeof warmupComplete !== 'boolean' || typeof stepsEnabled !== 'boolean') return null;
  return {
    handsVisible: handsVisible as number,
    warmupElapsedMs: Math.min(warmupElapsedMs as number, warmupRequiredMs as number),
    warmupRequiredMs: warmupRequiredMs as number,
    warmupComplete,
    stepsEnabled,
  };
}

const STREAM_URL = RuntimeEndpointConfig.cameraStreamUrl();
const CAMERA_HEALTH_TIMEOUT_MS = 2_000;
const CAMERA_HEALTH_POLL_MS = 1_500;

export function LiveCameraFeed() {
  const [status, setStatus] = useState<StreamStatus>('idle');
  const [cameraHealth, setCameraHealth] = useState<CameraHealth>('unknown');
  const [handPresence, setHandPresence] = useState<HandPresence | null>(null);
  const [retry, setRetry] = useState(0);
  const sessionId = useSessionStore((state) => state.sessionId);
  const currentStep = useSessionStore((state) => state.currentStep);
  const isActive = useSessionStore((state) => state.isActive);
  const summary = useSessionStore((state) => state.summary);
  const retries = useSessionStore((state) => state.intentosReiniciados);
  const mode = useSessionStore((state) => state.modoEvaluacion);
  const intentionState = useSessionStore((state) => state.estadoIntencion);

  useEffect(() => {
    setStatus(sessionId ? 'connecting' : 'idle');
    setCameraHealth('unknown');
    setHandPresence(null);
    setRetry(0);
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;

    const healthUrl = new URL('/health', STREAM_URL);
    let active = true;
    let controller: AbortController | null = null;
    let timeout = 0;
    let requestTimeout = 0;

    const checkCameraHealth = async () => {
      const requestController = new AbortController();
      let timedOut = false;
      controller = requestController;
      requestTimeout = window.setTimeout(() => {
        timedOut = true;
        requestController.abort();
      }, CAMERA_HEALTH_TIMEOUT_MS);
      try {
        const response = await fetch(healthUrl, {
          cache: 'no-store',
          signal: requestController.signal,
        });
        if (!response.ok) throw new Error('Camera stream health unavailable');
        const health = await response.json() as {
          camera?: string; sessionId?: string | null; handPresence?: unknown;
        };
        if (!active) return;
        if (health.sessionId !== sessionId) {
          setCameraHealth('unknown');
          setHandPresence(null);
          return;
        }
        setCameraHealth(health.camera === 'connected' ? 'connected' : 'reconnecting');
        setHandPresence(parseHandPresence(health.handPresence));
      } catch {
        if (active && (!requestController.signal.aborted || timedOut)) {
          setCameraHealth('unknown');
          setHandPresence(null);
        }
      } finally {
        window.clearTimeout(requestTimeout);
        if (active) timeout = window.setTimeout(() => void checkCameraHealth(), CAMERA_HEALTH_POLL_MS);
      }
    };

    void checkCameraHealth();
    return () => {
      active = false;
      controller?.abort();
      window.clearTimeout(requestTimeout);
      window.clearTimeout(timeout);
    };
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId || status !== 'offline') return;
    const timeout = window.setTimeout(() => {
      setStatus('connecting');
      setRetry((count) => count + 1);
    }, 2500);
    return () => window.clearTimeout(timeout);
  }, [sessionId, status]);

  const streamUrl = sessionId
    ? (() => {
      const url = new URL(STREAM_URL, window.location.href);
      url.searchParams.set('sessionId', sessionId);
      url.searchParams.set('retry', String(retry));
      return url.toString();
    })()
    : null;
  const handPresenceLabel = handPresence === null ? null
    : handPresence.stepsEnabled ? intentionState === 'LAVADO_PROBABLE'
      ? 'Dos manos visibles · seguimiento de pasos activo'
      : intentionState === 'PAUSA'
        ? 'Seguimiento en pausa · consulta el motivo'
        : 'Dos manos detectadas · verificando preparación'
      : handPresence.handsVisible < 2 ? `Manos en encuadre: ${handPresence.handsVisible}/2`
        : handPresence.warmupComplete ? 'Preparando detección de pasos'
          : `Estabilizando manos: ${(handPresence.warmupElapsedMs / 1000).toFixed(1)}/`
            + `${(handPresence.warmupRequiredMs / 1000).toFixed(1)} s`;

  return (
    <section className="neumorphic overflow-hidden rounded-2xl" aria-label="Video en vivo del lavado">
      <header className="flex items-center gap-2 border-b border-border/50 bg-muted/30 px-5 py-3">
        <ScanEye className="h-4 w-4 text-primary" aria-hidden="true" />
        <h2 className="font-heading text-sm font-semibold text-card-foreground">
          Cámara y detección YOLO
        </h2>
        <div className="ml-auto flex items-center gap-1.5" role="status" aria-live="polite">
          {status === 'live' && cameraHealth === 'connected' ? (
            <><Wifi className="h-4 w-4 text-success" aria-hidden="true" /><span className="text-[10px] font-bold uppercase tracking-wider text-success">En vivo</span></>
          ) : status === 'live' && cameraHealth === 'reconnecting' ? (
            <><WifiOff className="h-4 w-4 text-warning" aria-hidden="true" /><span className="text-[10px] font-bold uppercase tracking-wider text-warning">Cámara reconectando</span></>
          ) : status === 'live' ? (
            <><Wifi className="h-4 w-4 text-warning" aria-hidden="true" /><span className="text-[10px] font-bold uppercase tracking-wider text-warning">Stream conectado · cámara sin verificar</span></>
          ) : status === 'idle' ? (
            <><WifiOff className="h-4 w-4 text-muted-foreground" aria-hidden="true" /><span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Sin sesión</span></>
          ) : status === 'connecting' ? (
            <><LoaderCircle className="h-4 w-4 animate-spin text-warning" aria-hidden="true" /><span className="text-[10px] font-bold uppercase tracking-wider text-warning">Conectando</span></>
          ) : (
            <><WifiOff className="h-4 w-4 text-muted-foreground" aria-hidden="true" /><span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Sin señal</span></>
          )}
        </div>
      </header>

      <div className="relative aspect-video bg-[#07151c]">
        {streamUrl && (
          <img
            key={`${sessionId}:${retry}`}
            src={streamUrl}
            alt="Video en vivo de las manos con las detecciones del modelo YOLO superpuestas"
            className={`h-full w-full object-contain transition-opacity duration-300 ${status === 'live' ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setStatus('live')}
            onError={() => setStatus('offline')}
          />
        )}

        {status !== 'live' && (
          <div className="absolute inset-0 flex items-center justify-center px-6 text-center">
            <div className="max-w-sm">
              <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-background/10 text-background">
                {status === 'connecting' ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <WifiOff className="h-5 w-5" />}
              </div>
              <p className="text-sm font-semibold text-white">
                {status === 'idle' ? 'Inicia o vincula una sesión'
                  : status === 'connecting' ? 'Esperando la cámara del iPhone'
                    : 'No llega el video de esta sesión'}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-white/75">
                {status === 'idle'
                  ? 'El video se habilita al vincular el dashboard con el capturador YOLO.'
                  : 'Comprueba que el iPhone esté disponible y que YOLO use el código de vinculación de esta misma sesión.'}
              </p>
            </div>
          </div>
        )}

        <div className="absolute bottom-3 left-3 rounded-lg bg-black/65 px-3 py-2 text-xs text-white backdrop-blur-sm">
          {isActive
            ? currentStep ? `Movimiento actual: ${STEP_LABELS[currentStep as keyof typeof STEP_LABELS] ?? currentStep}` : retries > 0 ? `Intento reiniciado · vuelve a empezar por ${mode === 'PROTOCOLO_OMS' ? 'mojar las manos' : 'Palmas'}` : 'Sesión activa · esperando el primer paso'
            : summary ? 'Sesión finalizada · consulta el resumen'
              : 'Inicia o vincula una sesión para evaluar el lavado'}
          {isActive && mode !== 'PROTOCOLO_OMS' && handPresenceLabel && (
            <p className="mt-1 text-white/80" role="status" aria-live="polite">{handPresenceLabel}</p>
          )}
        </div>
      </div>
    </section>
  );
}
