import { useState } from 'react';
import { StepIllustration } from '@/components/illustrations/StepIllustration';
import { LiveStepLine } from '@/components/KioskProgress';
import { KioskWashSummary } from '@/components/KioskWashSummary';
import { WaterAmbience } from '@/components/ui/WaterAmbience';
import { ProgressMeter } from '@/components/ui/ProgressMeter';
import type { FrictionEvaluation } from '@/types';

const finished = (verdict: 'CORRECTO' | 'RECHAZADO', score: number) => ({
  numeroIntento: 1, estadoIntento: 'COMPLETO_PARCIAL', secuenciaValidada: true, veredicto: verdict, puntajePct: score,
  ultimoResultado: { numeroIntento: 1, resultado: 'FRICTION_SEQUENCE_COMPLETE', motivo: null, pasos: [], puntajePct: score, veredicto: verdict },
  pasos: ['PASO_1_PALMAS', 'PASO_2_DORSOS', 'PASO_3_INTERDIGITALES', 'PASO_4_NUDILLOS', 'PASO_5_PULGAR', 'PASO_6_PUNTA_DE_DEDOS']
    .map((paso, i) => ({ paso, estado: 'VALIDADO', tiempoAcreditadoMs: 7000, minimoRequeridoMs: 7000, motivo: null, calidadPct: score - i })),
}) as unknown as FrictionEvaluation;

/** Development-only sheet to review the new visuals side by side (#/illustrations). Not part of the production build. */
export function IllustrationGallery() {
  const [percent, setPercent] = useState(35);
  const [busy, setBusy] = useState(false);
  return (
    <main style={{ display: 'grid', gap: 20, padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
        {[1, 2, 3, 4, 5, 6].map((step) => <figure key={step} style={{ margin: 0 }}><StepIllustration step={step} /><figcaption>Paso {step}</figcaption></figure>)}
      </section>
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        <div>
          <LiveStepLine detected={{ step: 'Paso2_Dorsos', confidence: 0.91, hands: 2, current: 2, expected: 3, error: false }}
            credit={{ step: 2, percent, seconds: percent * 0.07, required: 7 }} />
          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            <button type="button" className="button-quiet" onClick={() => setPercent((p) => Math.min(100, p + 20))}>+20 %</button>
            <button type="button" className="button-quiet" onClick={() => setPercent(0)}>Reiniciar</button>
            <button type="button" className="button-primary" aria-busy={busy} onClick={() => { setBusy(true); setTimeout(() => setBusy(false), 2500); }}>Iniciar cámara</button>
            <button type="button" className="button-danger">Terminar turno</button>
            <button type="button" className="button-primary" disabled>Desactivado</button>
          </div>
          <ProgressMeter value={percent} label="Demo" className="big" />
          <LiveStepLine detected={{ step: 'Paso5_Pulgar', confidence: 0.9, hands: 2, current: 0, expected: 1, error: true }} credit={null} />
        </div>
        <div className="live-video-stage" style={{ minHeight: 260 }}>
          <div className="live-video-empty"><WaterAmbience /><strong>Esperando la cámara del celular</strong><span>Escanea el código de abajo.</span></div>
        </div>
      </section>
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        <KioskWashSummary evaluation={finished('CORRECTO', 92)} />
        <KioskWashSummary evaluation={finished('RECHAZADO', 71)} />
      </section>
    </main>
  );
}
