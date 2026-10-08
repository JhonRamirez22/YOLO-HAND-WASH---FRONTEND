import { useCallback, useEffect, useRef, useState } from 'react';
import { Hand } from 'lucide-react';
import { ConnectionStatusBadge } from './components/ConnectionStatusBadge';
import { ControlPanel } from './components/ControlPanel';
import { DeploymentNotice } from './components/DeploymentNotice';
import { LiveCameraFeed } from './components/LiveCameraFeed';
import { StepStepper } from './components/StepStepper';
import { InfractionsLog } from './components/InfractionsLog';
import { SessionSummary } from './components/SessionSummary';
import { DeploymentStatusService } from './lib/DeploymentStatusService';
import { useSessionStore } from './stores/sessionStore';

const deploymentStatusService = new DeploymentStatusService();

function App() {
  const summary = useSessionStore((s) => s.summary);
  const [deploymentStatus, setDeploymentStatus] = useState(DeploymentStatusService.checking());
  const [deploymentStatusLoading, setDeploymentStatusLoading] = useState(true);
  const deploymentCheck = useRef<AbortController | null>(null);

  const checkDeploymentStatus = useCallback(() => {
    deploymentCheck.current?.abort();
    const controller = new AbortController();
    deploymentCheck.current = controller;
    setDeploymentStatusLoading(true);
    void deploymentStatusService.load(controller.signal)
      .then(setDeploymentStatus)
      .catch(() => {
        if (!controller.signal.aborted) {
          setDeploymentStatus(DeploymentStatusService.unverified());
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setDeploymentStatusLoading(false);
      });
  }, []);

  useEffect(() => {
    checkDeploymentStatus();
    return () => deploymentCheck.current?.abort();
  }, [checkDeploymentStatus]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-sm shadow-neumorphic-sm sticky top-0 z-50">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-2 px-4 py-4 sm:gap-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-primary-foreground shadow-neumorphic transition-transform hover:scale-105 sm:h-11 sm:w-11">
              <Hand className="h-6 w-6" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="font-heading text-lg font-bold text-card-foreground tracking-tight sm:text-xl">
                HandWash AI
              </h1>
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider sm:text-xs">
                Evaluación de movimientos
              </p>
            </div>
          </div>
          <ConnectionStatusBadge />
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6">
        <DeploymentNotice
          status={deploymentStatus}
          loading={deploymentStatusLoading}
          onRetry={checkDeploymentStatus}
        />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <div className="space-y-6">
              <ControlPanel />
              <StepStepper deploymentStatus={deploymentStatus} />
            </div>
          </div>

          <div className="lg:col-span-6">
            <LiveCameraFeed />
          </div>

          <div className="lg:col-span-3">
            <InfractionsLog />
          </div>
        </div>

        {summary && (
          <div className="mt-6">
            <SessionSummary deploymentStatus={deploymentStatus} />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
