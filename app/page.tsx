'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  BarChart3,
  Check,
  ChevronRight,
  Download,
  FileSpreadsheet,
  Info,
  Plus,
  RefreshCw,
  Settings2,
  ShieldAlert,
  Target,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type CostKind = 'Directo' | 'Indirecto';

type CostItem = {
  id: number;
  code: string;
  name: string;
  kind: CostKind;
  base: number;
  optimistic: number;
  pessimistic: number;
  modeled: boolean;
  aggregate?: boolean;
  risk: string;
  opportunity: string;
};

type SimulationResult = {
  base: number;
  p10: number;
  p50: number;
  p90: number;
  curve: { value: number; probability: number }[];
  source: 'Informe Rev. 1' | 'Simulación actual';
};

const INITIAL_ITEMS: CostItem[] = [
  { id: 1, code: 'A1', name: 'Movimiento de tierras - masivo', kind: 'Directo', base: 1_929_837, optimistic: 1_834_503, pessimistic: 2_778_966, modeled: true, risk: 'Interferencias bajo superficie y condiciones climáticas', opportunity: 'Hallazgo de roca cercana a superficie' },
  { id: 2, code: 'A2', name: 'Movimiento de tierras - estructural', kind: 'Directo', base: 3_119_535, optimistic: 2_891_628, pessimistic: 3_949_357, modeled: true, risk: 'Calidad de suelo y reemplazo de material', opportunity: 'Disponibilidad de material de relleno' },
  { id: 3, code: 'C', name: 'Concreto', kind: 'Directo', base: 7_655_125, optimistic: 7_126_922, pessimistic: 10_338_618, modeled: true, risk: 'Lejanía de la planta y cambio climático', opportunity: 'Construcción de nueva planta de concreto' },
  { id: 4, code: 'D', name: 'Estructuras metálicas', kind: 'Directo', base: 6_573_557, optimistic: 6_119_982, pessimistic: 8_931_591, modeled: true, risk: 'Información vendor incompleta y mayor costo del acero', opportunity: 'Material prearmado y secuenciación' },
  { id: 5, code: 'N1', name: 'Equipos mecánicos principales', kind: 'Directo', base: 18_159_469, optimistic: 17_251_495, pessimistic: 20_085_911, modeled: true, risk: 'Cambios de diseño vendor', opportunity: 'Paquetización de compra de equipos' },
  { id: 6, code: 'N2', name: 'Equipos mecánicos complementarios', kind: 'Directo', base: 7_918_425, optimistic: 7_522_503, pessimistic: 9_843_143, modeled: true, risk: 'Crecimiento de equipos menores', opportunity: 'Optimización del proceso constructivo' },
  { id: 7, code: 'P', name: 'Tuberías', kind: 'Directo', base: 8_728_350, optimistic: 8_126_093, pessimistic: 12_274_673, modeled: true, risk: 'Interferencias, geotecnia y cambios de tie-ins', opportunity: 'Optimización por longitudes prolongadas' },
  { id: 8, code: 'T1', name: 'Equipo eléctrico - sala principal', kind: 'Directo', base: 2_628_033, optimistic: 2_496_631, pessimistic: 2_909_745, modeled: true, risk: 'Interferencia en alimentación eléctrica', opportunity: 'Ensamble anticipado en sala eléctrica' },
  { id: 9, code: 'T2', name: 'Equipo eléctrico - distribución', kind: 'Directo', base: 9_585_517, optimistic: 8_701_696, pessimistic: 11_832_436, modeled: true, risk: 'Aumento del costo del cobre', opportunity: 'Compra consolidada de equipos' },
  { id: 10, code: 'OT-D', name: 'Otros costos directos', kind: 'Directo', base: 16_340_726, optimistic: 15_228_100, pessimistic: 20_443_686, modeled: false, aggregate: true, risk: 'Rango heredado del promedio ponderado', opportunity: 'Rango heredado del promedio ponderado' },
  { id: 11, code: 'Y2', name: 'EPCM - servicios profesionales', kind: 'Indirecto', base: 21_275_410, optimistic: 20_211_639, pessimistic: 25_530_492, modeled: true, risk: 'Aumento de horas bajo modalidad EPCM', opportunity: 'Mejor definición temprana de alcance' },
  { id: 12, code: 'Y4', name: 'Fletes', kind: 'Indirecto', base: 5_686_148, optimistic: 5_572_426, pessimistic: 6_823_378, modeled: true, risk: 'Cambios de rutas y disponibilidad logística', opportunity: 'Consolidación de embarques' },
  { id: 13, code: 'Y1', name: 'Facilidades temporales de construcción', kind: 'Indirecto', base: 5_381_168, optimistic: 5_112_109, pessimistic: 6_188_343, modeled: true, risk: 'Mayor permanencia de instalaciones', opportunity: 'Reutilización de facilidades existentes' },
  { id: 14, code: 'Y3', name: 'Servicios de terceros', kind: 'Indirecto', base: 4_058_776, optimistic: 3_855_837, pessimistic: 4_667_593, modeled: true, risk: 'Extensión de topografía y QA', opportunity: 'Contratos marco vigentes' },
  { id: 15, code: 'OT-I', name: 'Otros costos indirectos', kind: 'Indirecto', base: 4_816_365, optimistic: 4_587_758, pessimistic: 5_717_187, modeled: false, aggregate: true, risk: 'Rango heredado del promedio ponderado', opportunity: 'Rango heredado del promedio ponderado' },
];

const PUBLISHED_RESULT: SimulationResult = {
  base: 123_856_441,
  p10: 130_971_811,
  p50: 136_503_554,
  p90: 142_600_173,
  source: 'Informe Rev. 1',
  curve: Array.from({ length: 41 }, (_, index) => {
    const probability = index / 40;
    const value = probability <= 0.5
      ? 123_500_000 + (136_503_554 - 123_500_000) * Math.pow(probability / 0.5, 0.72)
      : 136_503_554 + (148_800_000 - 136_503_554) * Math.pow((probability - 0.5) / 0.5, 1.35);
    return { value, probability };
  }),
};

const money = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const compactMoney = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 });

function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function triangular(min: number, mode: number, max: number, random: number) {
  if (max <= min) return mode;
  const split = (mode - min) / (max - min);
  return random < split
    ? min + Math.sqrt(random * (max - min) * (mode - min))
    : max - Math.sqrt((1 - random) * (max - min) * (max - mode));
}

function percentile(sortedValues: number[], p: number) {
  const index = (sortedValues.length - 1) * p;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sortedValues[lower];
  return sortedValues[lower] + (sortedValues[upper] - sortedValues[lower]) * (index - lower);
}

function simulate(items: CostItem[]): SimulationResult {
  const random = seededRandom(20240418);
  const runs = Array.from({ length: 10_000 }, () =>
    items.reduce((total, item) => total + triangular(item.optimistic, item.base, item.pessimistic, random()), 0),
  ).sort((a, b) => a - b);
  const base = items.reduce((sum, item) => sum + item.base, 0);
  return {
    base,
    p10: percentile(runs, 0.1),
    p50: percentile(runs, 0.5),
    p90: percentile(runs, 0.9),
    source: 'Simulación actual',
    curve: Array.from({ length: 51 }, (_, index) => ({ value: percentile(runs, index / 50), probability: index / 50 })),
  };
}

function coverage(items: CostItem[], kind: CostKind) {
  const ofKind = items.filter((item) => item.kind === kind);
  const total = ofKind.reduce((sum, item) => sum + item.base, 0);
  const modeled = ofKind.filter((item) => item.modeled).reduce((sum, item) => sum + item.base, 0);
  return total ? (modeled / total) * 100 : 0;
}

function CumulativeChart({ result }: { result: SimulationResult }) {
  const width = 820;
  const height = 250;
  const margin = { left: 54, right: 22, top: 22, bottom: 38 };
  const min = Math.min(...result.curve.map((point) => point.value));
  const max = Math.max(...result.curve.map((point) => point.value));
  const scaleX = (value: number) => margin.left + ((value - min) / Math.max(1, max - min)) * (width - margin.left - margin.right);
  const scaleY = (probability: number) => height - margin.bottom - probability * (height - margin.top - margin.bottom);
  const path = result.curve.map((point, index) => `${index ? 'L' : 'M'} ${scaleX(point.value)} ${scaleY(point.probability)}`).join(' ');
  const markers = [
    { label: 'P10', probability: 0.1, value: result.p10, color: '#0f766e' },
    { label: 'P50', probability: 0.5, value: result.p50, color: '#f97316' },
    { label: 'P90', probability: 0.9, value: result.p90, color: '#b42318' },
  ];

  return (
    <div className="chart-wrap">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Curva acumulada de probabilidad del CapEx">
        <defs>
          <linearGradient id="curveArea" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#0f766e" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#0f766e" stopOpacity="0.01" />
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((tick) => (
          <g key={tick}>
            <line x1={margin.left} x2={width - margin.right} y1={scaleY(tick)} y2={scaleY(tick)} stroke="#d9e2df" strokeDasharray="3 6" />
            <text x={margin.left - 12} y={scaleY(tick) + 4} textAnchor="end" className="chart-label">{Math.round(tick * 100)}%</text>
          </g>
        ))}
        <path d={`${path} L ${scaleX(max)} ${scaleY(0)} L ${scaleX(min)} ${scaleY(0)} Z`} fill="url(#curveArea)" />
        <path d={path} fill="none" stroke="#0f766e" strokeWidth="4" strokeLinecap="round" />
        {markers.map((marker) => (
          <g key={marker.label}>
            <line x1={scaleX(marker.value)} x2={scaleX(marker.value)} y1={margin.top} y2={height - margin.bottom} stroke={marker.color} strokeWidth="1.5" strokeDasharray="5 5" />
            <circle cx={scaleX(marker.value)} cy={scaleY(marker.probability)} r="5" fill={marker.color} />
            <text x={scaleX(marker.value)} y={15} textAnchor="middle" fill={marker.color} className="chart-marker">{marker.label}</text>
          </g>
        ))}
        <text x={margin.left} y={height - 8} className="chart-label">{compactMoney.format(min)}</text>
        <text x={width - margin.right} y={height - 8} textAnchor="end" className="chart-label">{compactMoney.format(max)}</text>
      </svg>
    </div>
  );
}

export default function Home() {
  const [items, setItems] = useState<CostItem[]>(INITIAL_ITEMS);
  const [result, setResult] = useState<SimulationResult>(PUBLISHED_RESULT);
  const [dirty, setDirty] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  const effectiveItems = useMemo(() => items.map((item) => {
    if (!item.aggregate || item.modeled) return item;
    const peers = items.filter((peer) => peer.kind === item.kind && peer.modeled && peer.base > 0);
    const peerBase = peers.reduce((sum, peer) => sum + peer.base, 0);
    if (!peerBase) return item;
    const optimisticRatio = peers.reduce((sum, peer) => sum + peer.optimistic, 0) / peerBase;
    const pessimisticRatio = peers.reduce((sum, peer) => sum + peer.pessimistic, 0) / peerBase;
    return { ...item, optimistic: item.base * optimisticRatio, pessimistic: item.base * pessimisticRatio };
  }), [items]);

  useEffect(() => {
    type ModelContext = {
      registerTool: (
        tool: {
          name: string;
          title: string;
          description: string;
          inputSchema: object;
          annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
          execute: (input: unknown) => unknown;
        },
        options: { signal: AbortSignal },
      ) => void | Promise<void>;
    };
    const context = (document as Document & { modelContext?: ModelContext }).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const registration = context.registerTool({
      name: 'run_capex_simulation',
      title: 'Ejecutar simulación CapEx',
      description: 'Ejecuta 10.000 iteraciones Monte Carlo con los rangos visibles y actualiza P10, P50, P90 y contingencia en la aplicación.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute: (input) => {
        if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).length > 0) {
          throw new Error('La simulación no acepta parámetros. Use un objeto vacío.');
        }
        const next = simulate(effectiveItems);
        setResult(next);
        setDirty(false);
        return { base: next.base, p10: next.p10, p50: next.p50, p90: next.p90, iterations: 10_000 };
      },
    }, { signal: lifecycle.signal });
    void Promise.resolve(registration).catch(() => undefined);
    return () => lifecycle.abort();
  }, [effectiveItems]);

  const directCoverage = coverage(items, 'Directo');
  const indirectCoverage = coverage(items, 'Indirecto');
  const contingency50 = ((result.p50 - result.base) / result.base) * 100;
  const contingency90 = ((result.p90 - result.base) / result.base) * 100;

  const updateItem = (id: number, field: keyof CostItem, value: string | boolean) => {
    setItems((current) => current.map((item) => {
      if (item.id !== id) return item;
      if (field === 'modeled') return { ...item, modeled: Boolean(value) };
      if (field === 'name' || field === 'risk' || field === 'opportunity') return { ...item, [field]: String(value) };
      return { ...item, [field]: Math.max(0, Number(value) * 1_000_000) };
    }));
    setDirty(true);
  };

  const runSimulation = () => {
    setIsRunning(true);
    window.setTimeout(() => {
      setResult(simulate(effectiveItems));
      setDirty(false);
      setIsRunning(false);
    }, 320);
  };

  const resetModel = () => {
    setItems(INITIAL_ITEMS);
    setResult(PUBLISHED_RESULT);
    setDirty(false);
  };

  const applyPareto = () => {
    const selected = new Set<number>();
    (['Directo', 'Indirecto'] as CostKind[]).forEach((kind) => {
      const candidates = items.filter((item) => item.kind === kind && !item.aggregate).sort((a, b) => b.base - a.base);
      const total = items.filter((item) => item.kind === kind).reduce((sum, item) => sum + item.base, 0);
      let running = 0;
      for (const item of candidates) {
        if (running / total >= 0.8) break;
        selected.add(item.id);
        running += item.base;
      }
    });
    setItems((current) => current.map((item) => ({ ...item, modeled: selected.has(item.id) })));
    setDirty(true);
  };

  const addItem = () => {
    const id = Math.max(...items.map((item) => item.id), 0) + 1;
    setItems((current) => [...current, { id, code: `N${id}`, name: 'Nueva partida', kind: 'Directo', base: 1_000_000, optimistic: 900_000, pessimistic: 1_200_000, modeled: true, risk: 'Riesgo por definir en taller', opportunity: 'Oportunidad por definir en taller' }]);
    setDirty(true);
  };

  const removeItem = (id: number) => {
    setItems((current) => current.filter((item) => item.id !== id));
    setDirty(true);
  };

  const downloadCsv = () => {
    const headers = ['Tipo', 'Código', 'Partida', 'VEB', 'Optimista_P10', 'Más_probable', 'Pesimista_P90', 'Modelada', 'Riesgo', 'Oportunidad'];
    const rows = effectiveItems.map((item) => [item.kind, item.code, item.name, item.base, item.optimistic, item.base, item.pessimistic, item.modeled ? 'Sí' : 'No', item.risk, item.opportunity]);
    const summary = [[], ['Resultado', 'USD'], ['VEB', result.base], ['P10', result.p10], ['P50', result.p50], ['P90', result.p90], ['Contingencia P90', result.p90 - result.base]];
    const csv = [headers, ...rows, ...summary].map((row) => row.map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'contingencia-capex.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-mark"><span>CC</span></div>
        <div className="brand-copy"><strong>Contingencia CapEx</strong><span>Modelo probabilístico · Clase 3</span></div>
        <div className="project-chip"><span className="status-dot" />CPF Antapaccay · FS</div>
        <Button variant="outline" size="sm" onClick={downloadCsv}><Download /> Exportar</Button>
      </header>

      <div className="workspace">
        <aside className="rail" aria-label="Flujo de análisis">
          <p className="rail-label">FLUJO</p>
          {[
            ['01', 'Datos de entrada', FileSpreadsheet],
            ['02', 'Rangos', Settings2],
            ['03', 'Simulación', Activity],
            ['04', 'Resultados', BarChart3],
          ].map(([number, label, Icon], index) => (
            <div className={`rail-step ${index === 2 ? 'active' : ''}`} key={String(number)}>
              <span className="step-index">{String(number)}</span><Icon size={17} /><span>{String(label)}</span>{index < 2 && <Check size={14} className="step-check" />}
            </div>
          ))}
          <div className="method-card"><Target size={18} /><strong>Meta de cobertura</strong><span>Modelar al menos el 80% del costo de cada grupo.</span></div>
        </aside>

        <section className="content">
          <div className="page-heading">
            <div>
              <div className="eyebrow"><span>ANÁLISIS PROBABILÍSTICO</span><ChevronRight size={13} /><span>REV. 1</span></div>
              <h1>Estimación de contingencia</h1>
              <p>Rangos del panel experto y 10.000 iteraciones Monte Carlo.</p>
            </div>
            <div className="heading-actions">
              {dirty && <Badge variant="outline" className="dirty-badge">Cambios sin simular</Badge>}
              <Button variant="outline" onClick={resetModel}><RefreshCw /> Restablecer</Button>
              <Button className="run-button" onClick={runSimulation} disabled={isRunning}><Activity className={isRunning ? 'spin' : ''} />{isRunning ? 'Simulando…' : 'Ejecutar simulación'}</Button>
            </div>
          </div>

          <div className="metric-grid">
            <article className="metric-card base-card"><span>Valor estimado base</span><strong>{compactMoney.format(result.base)}</strong><small>100% del CapEx neto</small></article>
            <article className="metric-card"><span>P10</span><strong>{compactMoney.format(result.p10)}</strong><small>Escenario optimista</small></article>
            <article className="metric-card focus-card"><span>P50</span><strong>{compactMoney.format(result.p50)}</strong><small>Contingencia +{contingency50.toFixed(1).replace('.', ',')}%</small></article>
            <article className="metric-card risk-card"><span>P90 recomendado</span><strong>{compactMoney.format(result.p90)}</strong><small>Contingencia +{contingency90.toFixed(1).replace('.', ',')}%</small></article>
          </div>

          <Tabs defaultValue="results" className="analysis-tabs">
            <TabsList><TabsTrigger value="results">Resultados</TabsTrigger><TabsTrigger value="model">Modelo de rangos</TabsTrigger><TabsTrigger value="assumptions">Trazabilidad</TabsTrigger></TabsList>

            <TabsContent value="results" className="tab-panel">
              <div className="results-grid">
                <article className="panel chart-panel">
                  <div className="panel-heading"><div><span className="panel-kicker">DISTRIBUCIÓN ACUMULADA</span><h2>Probabilidad del CapEx total</h2></div><Badge variant="outline">{result.source}</Badge></div>
                  <CumulativeChart result={result} />
                  <div className="chart-legend"><span><i className="legend-dot teal" />P10 · {money.format(result.p10)}</span><span><i className="legend-dot orange" />P50 · {money.format(result.p50)}</span><span><i className="legend-dot red" />P90 · {money.format(result.p90)}</span></div>
                </article>

                <aside className="panel decision-panel">
                  <div className="decision-icon"><ShieldAlert size={22} /></div><span className="panel-kicker">RECOMENDACIÓN</span><h2>Reserva al P90</h2><strong>{money.format(result.p90 - result.base)}</strong>
                  <p>Nivel conservador para absorber incertidumbre de cantidades, productividad y precios.</p>
                  <div className="decision-breakdown"><div><span>Contingencia</span><b>{contingency90.toFixed(1).replace('.', ',')}%</b></div><div><span>Confianza</span><b>90%</b></div><div><span>Iteraciones</span><b>10.000</b></div></div>
                  <Button variant="outline" onClick={() => window.print()}><Download /> Imprimir informe</Button>
                </aside>
              </div>

              <div className="coverage-grid">
                <article className="panel coverage-card"><div className="coverage-title"><span>Costos directos</span><b>{directCoverage.toFixed(1)}%</b></div><Progress value={Math.min(directCoverage, 100)} /><small>{directCoverage >= 80 ? 'Cobertura mínima alcanzada' : 'Faltan partidas para alcanzar 80%'}</small></article>
                <article className="panel coverage-card"><div className="coverage-title"><span>Costos indirectos</span><b>{indirectCoverage.toFixed(1)}%</b></div><Progress value={Math.min(indirectCoverage, 100)} /><small>{indirectCoverage >= 80 ? 'Cobertura mínima alcanzada' : 'Faltan partidas para alcanzar 80%'}</small></article>
                <article className="panel finding-card"><TrendingUp size={20} /><div><span>Exposición P90</span><strong>{compactMoney.format(result.p90 - result.p50)}</strong></div><small>Sobre el escenario central</small></article>
              </div>
            </TabsContent>

            <TabsContent value="model" className="tab-panel">
              <div className="panel table-panel">
                <div className="panel-heading table-tools"><div><span className="panel-kicker">ENTRADAS DEL TALLER</span><h2>Rangos por partida</h2><p>Los valores se editan en millones de USD.</p></div><div><Button variant="outline" onClick={applyPareto}><Target /> Aplicar regla 80%</Button><Button variant="outline" onClick={addItem}><Plus /> Añadir partida</Button></div></div>
                <div className="table-scroll">
                  <Table>
                    <TableHeader><TableRow><TableHead className="check-col">Modelo</TableHead><TableHead>Partida</TableHead><TableHead>Tipo</TableHead><TableHead>Optimista · P10</TableHead><TableHead>Más probable</TableHead><TableHead>Pesimista · P90</TableHead><TableHead className="action-col"><span className="sr-only">Acciones</span></TableHead></TableRow></TableHeader>
                    <TableBody>
                      {effectiveItems.map((item) => (
                        <TableRow key={item.id} className={!item.modeled ? 'inherited-row' : ''}>
                          <TableCell><Checkbox checked={item.modeled} disabled={item.aggregate} onCheckedChange={(checked) => updateItem(item.id, 'modeled', Boolean(checked))} aria-label={`Modelar ${item.name}`} /></TableCell>
                          <TableCell><div className="item-name"><b>{item.code}</b><span>{item.name}</span></div></TableCell>
                          <TableCell><Badge variant="outline">{item.kind}</Badge></TableCell>
                          {(['optimistic', 'base', 'pessimistic'] as const).map((field) => (
                            <TableCell key={field}><div className="money-input"><span>$</span><Input type="number" step="0.001" value={(item[field] / 1_000_000).toFixed(3)} disabled={item.aggregate && field !== 'base'} onChange={(event) => updateItem(item.id, field, event.target.value)} aria-label={`${field} de ${item.name} en millones de USD`} /></div></TableCell>
                          ))}
                          <TableCell>{!item.aggregate && <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)} aria-label={`Eliminar ${item.name}`}><Trash2 /></Button>}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="table-note"><Info size={16} /> Las filas “Otros” heredan la variación promedio ponderada de las partidas modeladas de su grupo.</div>
              </div>
            </TabsContent>

            <TabsContent value="assumptions" className="tab-panel">
              <div className="trace-grid">
                <article className="panel">
                  <div className="panel-heading"><div><span className="panel-kicker">REGISTRO DEL TALLER</span><h2>Riesgos y oportunidades</h2></div><Badge variant="outline">{items.filter((item) => item.modeled).length} partidas</Badge></div>
                  <div className="trace-list">
                    {effectiveItems.filter((item) => item.modeled).slice(0, 8).map((item) => (
                      <div className="trace-item" key={item.id}><div className="trace-code">{item.code}</div><div><strong>{item.name}</strong><span><b>Riesgo:</b> {item.risk}</span><span><b>Oportunidad:</b> {item.opportunity}</span></div></div>
                    ))}
                  </div>
                </article>
                <aside className="panel method-panel">
                  <span className="panel-kicker">MÉTODO</span><h2>Supuestos de simulación</h2>
                  <ol><li><b>1</b><span><strong>Base estructurada</strong>Costos directos e indirectos por commodity.</span></li><li><b>2</b><span><strong>Juicio experto</strong>Escenarios optimista, más probable y pesimista.</span></li><li><b>3</b><span><strong>Distribución triangular</strong>Una distribución por partida, sin correlaciones.</span></li><li><b>4</b><span><strong>Monte Carlo</strong>10.000 iteraciones con semilla reproducible.</span></li></ol>
                  <div className="method-warning"><Info size={16} /> El caso publicado conserva los resultados de @Risk del informe. Al simular, la app recalcula con las entradas visibles.</div>
                </aside>
              </div>
            </TabsContent>
          </Tabs>
        </section>
      </div>
    </main>
  );
}
