import { useState } from 'react';
import { Loader2, Play, Square } from 'lucide-react';
import { useSession } from '@/hooks/useSession';
import type { Protocolo } from '@/types';
import { cn } from '@/lib/utils';

export function ControlPanel() {
  const [protocolo, setProtocolo] = useState<Protocolo>('CLINICO_QUIRURGICO');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const { start, join, stop, isActive, isOwner } = useSession();

  const handleStart = async () => {
    setIsLoading(true);
    setError(null);
    setPairingCode(null);
    try {
      setPairingCode(await start(protocolo));
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'No se pudo iniciar la sesión');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await join(joinCode);
      setJoinCode('');
      setPairingCode(null);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'No se pudo vincular la sesión');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStop = async () => {
    setIsLoading(true);
    try {
      await stop();
      setPairingCode(null);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'No se pudo detener la sesión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="neumorphic rounded-2xl p-5">
      <h2 className="font-heading mb-5 text-lg font-semibold text-card-foreground">
        Control de sesión
      </h2>

      <div className="space-y-5">
        <div>
          <label className="mb-3 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Protocolo
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setProtocolo('CLINICO_QUIRURGICO')}
              aria-pressed={protocolo === 'CLINICO_QUIRURGICO'}
              disabled={isActive}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 cursor-pointer',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                protocolo === 'CLINICO_QUIRURGICO'
                  ? 'neumorphic-pressed bg-primary text-primary-foreground shadow-neumorphic-inset'
                  : 'neumorphic-sm bg-card text-card-foreground hover:bg-muted/50',
                'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-card'
              )}
            >
              Objetivo 60 s
            </button>
            <button
              type="button"
              onClick={() => setProtocolo('DOMESTICO')}
              aria-pressed={protocolo === 'DOMESTICO'}
              disabled={isActive}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 cursor-pointer',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                protocolo === 'DOMESTICO'
                  ? 'neumorphic-pressed bg-primary text-primary-foreground shadow-neumorphic-inset'
                  : 'neumorphic-sm bg-card text-card-foreground hover:bg-muted/50',
                'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-card'
              )}
            >
              Objetivo 40 s
            </button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Tiempos configurados para este proyecto; no certifican el lavado completo de la OMS.
          </p>
        </div>

        {error && (
          <div role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
            {error}
          </div>
        )}

        {isActive && pairingCode && (
          <div className="rounded-xl bg-primary/10 px-4 py-3 text-sm text-card-foreground">
            <div className="font-semibold">Código para vincular la cámara YOLO</div>
            <div className="mt-1 font-mono text-lg tracking-widest" aria-label="Código de vinculación">{pairingCode}</div>
            <div className="mt-1 text-xs text-muted-foreground">Pégalo en el visor YOLO de la Mac si la sesión se inició desde aquí.</div>
          </div>
        )}

        {!isActive && (
          <div className="space-y-2">
            <label htmlFor="dashboard-pair-code" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Vincular sesión creada por el visor YOLO
            </label>
            <div className="flex gap-2">
              <input
                id="dashboard-pair-code"
                value={joinCode}
                onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
                placeholder="XXXXX-XXXXX"
                maxLength={11}
                className="min-h-11 min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2 font-mono text-sm"
              />
              <button type="button" onClick={handleJoin} disabled={isLoading || !joinCode.trim()} className="min-h-11 rounded-xl bg-muted px-3 py-2 text-xs font-semibold disabled:opacity-50">
                Vincular
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          {!isActive ? (
            <button
              onClick={handleStart}
              disabled={isLoading}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-bold transition-all duration-200 cursor-pointer',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                'bg-gradient-to-r from-success to-accent text-success-foreground shadow-neumorphic-sm',
                'hover:shadow-neumorphic hover:scale-[1.02] active:scale-[0.98] active:shadow-neumorphic-inset',
                'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-neumorphic-sm'
              )}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin-slow" />
              ) : (
                <Play className="h-4 w-4" fill="currentColor" />
              )}
              {isLoading ? 'Iniciando...' : 'Iniciar nueva sesión'}
            </button>
          ) : (
            <button
              onClick={handleStop}
              disabled={isLoading}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-bold transition-all duration-200 cursor-pointer',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                'bg-gradient-to-r from-destructive to-red-600 text-destructive-foreground shadow-neumorphic-sm',
                'hover:shadow-neumorphic hover:scale-[1.02] active:scale-[0.98] active:shadow-neumorphic-inset',
                'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-neumorphic-sm'
              )}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin-slow" />
              ) : (
                <Square className="h-4 w-4" fill="currentColor" />
              )}
              {isLoading ? 'Deteniendo...' : isOwner ? 'Detener sesión' : 'Salir de la sesión'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
