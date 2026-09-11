import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import './styles.css';
import { CAREERS, CAREER_ORIENTATIONS, getCurriculum, ORIENTATION_KEYS } from './data/curriculum';
import { emptyProfile, exportState, importState, loadState, saveState } from './lib/storage';

const STATUS = {
  pending: { label: 'Pendiente', short: 'P', icon: '○' },
  current: { label: 'En curso', short: 'C', icon: '◉' },
  regular: { label: 'Regular', short: 'R', icon: '◐' },
  passed: { label: 'Aprobada', short: 'A', icon: '✓' },
};
const STATUS_ORDER = ['pending', 'current', 'regular', 'passed'];
const DEFAULT_ORIENTATION = { civil: 'estructuras', electromecanica: 'automatica', mecanica: 'maquinas_agricolas' };

function App() {
  const [state, setState] = useState(loadState);
  const [view, setView] = useState('carrera');
  const [search, setSearch] = useState('');
  const [yearFilter, setYearFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [termFilter, setTermFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [toast, setToast] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [compact, setCompact] = useState(false);
  const [showCareerPicker, setShowCareerPicker] = useState(false);

  const careerKey = state.career;
  const career = careerKey ? CAREERS[careerKey] : null;
  const profile = career ? (state.profiles?.[careerKey] || emptyProfile(DEFAULT_ORIENTATION[careerKey])) : null;
  const orientation = profile?.orientation || DEFAULT_ORIENTATION[careerKey];
  const orientationSet = career ? CAREER_ORIENTATIONS[careerKey] : {};
  const subjects = useMemo(() => career ? getCurriculum(careerKey, orientation) : [], [careerKey, orientation]);
  const byCode = useMemo(() => {
    const map = {};
    subjects.forEach(s => {
      map[s.code] = s;
      if (s.progressCode) map[s.progressCode] = s;
    });
    return map;
  }, [subjects]);

  useEffect(() => saveState(state), [state]);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(''), 1800);
    return () => clearTimeout(id);
  }, [toast]);

  const getStatus = code => profile?.subjects?.[byCode[code]?.progressCode || code]?.status || 'pending';
  const getProgressCode = subjectOrCode => typeof subjectOrCode === 'string' ? (byCode[subjectOrCode]?.progressCode || subjectOrCode) : (subjectOrCode.progressCode || subjectOrCode.code);
  const getEligibility = subject => {
    const regularized = (subject.regularized || []).filter(Boolean);
    const approved = (subject.approved || []).filter(Boolean);
    const unmetRegularized = regularized.filter(code => !['regular','passed'].includes(getStatus(getProgressCode(code))));
    const unmetApproved = approved.filter(code => getStatus(getProgressCode(code)) !== 'passed');
    return {
      regularized, approved, unmetRegularized, unmetApproved,
      unlocked: unmetRegularized.length === 0 && unmetApproved.length === 0,
    };
  };
  const canSetStatus = (subject, status) => status === 'pending' || getEligibility(subject).unlocked;

  const progress = useMemo(() => {
    if (!career) return { passed: 0, regular: 0, current: 0, grades: 0, avg: '—', percent: 0, hoursPassed: 0 };
    const passed = subjects.filter(s => getStatus(s.code) === 'passed').length;
    const regular = subjects.filter(s => getStatus(s.code) === 'regular').length;
    const current = subjects.filter(s => getStatus(s.code) === 'current').length;
    const grades = subjects.map(s => profile.subjects[s.progressCode || s.code]?.grade).filter(g => typeof g === 'number' && g >= 0);
    const avg = grades.length ? (grades.reduce((a, b) => a + b, 0) / grades.length).toFixed(2) : '—';
    const hoursPassed = subjects.filter(s => getStatus(s.code) === 'passed').reduce((a, s) => a + s.totalHours, 0);
    return { passed, regular, current, grades: grades.length, avg, percent: subjects.length ? Math.round((passed / subjects.length) * 100) : 0, hoursPassed };
  }, [career, subjects, profile?.subjects]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return subjects.filter(s => {
      const displayCode = s.displayCode || s.code;
      const matchesText = !q || `${displayCode} ${s.code} ${s.name}`.toLowerCase().includes(q);
      const matchesYear = yearFilter === 'all' || String(s.year) === yearFilter;
      const matchesTerm = termFilter === 'all' || String(s.term) === termFilter;
      const matchesStatus = statusFilter === 'all' || getStatus(s.code) === statusFilter;
      return matchesText && matchesYear && matchesTerm && matchesStatus;
    });
  }, [subjects, search, yearFilter, termFilter, statusFilter, profile?.subjects]);

  function patchProfile(patch) {
    setState(s => {
      const current = s.profiles?.[careerKey] || emptyProfile(DEFAULT_ORIENTATION[careerKey]);
      return { ...s, profiles: { ...s.profiles, [careerKey]: { ...current, ...patch } } };
    });
  }

  function patchSubject(code, patch) {
    setState(s => {
      const current = s.profiles?.[careerKey] || emptyProfile(DEFAULT_ORIENTATION[careerKey]);
      return { ...s, profiles: { ...s.profiles, [careerKey]: { ...current, subjects: { ...current.subjects, [code]: { ...current.subjects?.[code], ...patch } } } } };
    });
  }

  function setStatus(code, status) {
    const subject = byCode[code];
    const progressCode = subject ? getProgressCode(subject) : code;
    if (subject && !canSetStatus(subject, status)) {
      const eligibility = getEligibility(subject);
      const missing = [...eligibility.unmetApproved, ...eligibility.unmetRegularized];
      setToast(`No podés cursar ${subject.name}: faltan ${missing.length} correlativa${missing.length === 1 ? '' : 's'}`);
      return;
    }
    const previous = getStatus(progressCode);
    const patch = { status };
    if (status === 'pending') {
      patch.grade = undefined;
      patch.date = undefined;
    }
    patchSubject(progressCode, patch);
    setToast(`${subject?.name || code}: ${STATUS[status].label}`);
    if (previous !== status && status === 'passed') setSelected(null);
  }

  function cycleStatus(code) {
    const subject = byCode[code];
    const current = getStatus(getProgressCode(subject || code));
    const next = STATUS_ORDER[(STATUS_ORDER.indexOf(current) + 1) % STATUS_ORDER.length];
    if (subject && !canSetStatus(subject, next)) {
      setStatus(code, next);
      return;
    }
    setStatus(code, next);
  }

  function selectCareer(key) {
    const existing = state.profiles?.[key];
    const nextProfile = existing || emptyProfile(DEFAULT_ORIENTATION[key]);
    setState(s => ({ ...s, career: key, profiles: { ...s.profiles, [key]: nextProfile } }));
    setView('carrera');
    setSearch('');
    setYearFilter('all');
    setTermFilter('all');
    setStatusFilter('all');
    setSelected(null);
    setToast(`${CAREERS[key].label} seleccionada`);
  }

  function changeOrientation(key) {
    patchProfile({ orientation: key });
    setSelected(null);
    setToast(`${careerKey === 'civil' ? 'Orientación' : 'Opción'}: ${orientationSet[key].label}`);
  }

  function toggleMilestone(key) {
    patchProfile({ milestones: { ...profile.milestones, [key]: !profile.milestones?.[key] } });
  }

  function doImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    importState(file).then(data => {
      if (!data?.career || !data?.profiles) throw new Error('Formato inválido');
      setState(data);
      setToast('Progreso importado');
    }).catch(() => setToast('No se pudo importar ese archivo'));
    e.target.value = '';
  }

  function doReset() {
    if (!window.confirm(`¿Borrar todo tu progreso de ${career.label}?`)) return;
    const fresh = emptyProfile(DEFAULT_ORIENTATION[careerKey]);
    setState(s => ({ ...s, profiles: { ...s.profiles, [careerKey]: fresh } }));
    setToast('Progreso reiniciado');
  }

  if (!careerKey) return <Welcome onSelect={selectCareer} />;

  const title = view === 'carrera' ? 'Plan de Estudios' : view === 'mapa' ? 'Mapa de correlativas' : view === 'stats' ? 'Estadísticas' : 'Configuración';
  const orientationLabel = careerKey === 'civil' ? 'ORIENTACIÓN' : 'OPCIÓN';

  const themeClass = `theme-${careerKey}`;

  return (
    <div className={`app ${themeClass}`}>
      <header className="topbar">
        <button className="brand" onClick={() => setView('carrera')} aria-label="Ir a mi carrera">
          <span className="brand-mark">{career.short}</span>
          <span><b>{career.label}</b><small>UNNE · FACULTAD DE INGENIERÍA</small></span>
        </button>
        <nav className="nav">
          <NavButton active={view === 'carrera'} onClick={() => setView('carrera')}>Carrera</NavButton>
          <NavButton active={view === 'mapa'} onClick={() => setView('mapa')}>Mapa</NavButton>
          <NavButton active={view === 'stats'} onClick={() => setView('stats')}>Stats</NavButton>
          <NavButton active={view === 'settings'} onClick={() => setView('settings')}>⚙</NavButton>
        </nav>
      </header>

      <main>
        <section className="hero">
          <div>
            <div className="kicker">UNIVERSIDAD NACIONAL DEL NORDESTE · FACULTAD DE INGENIERÍA</div>
            <h1>{title}</h1>
            <p>{career.description} <b>Registrá tu progreso directamente desde las tarjetas.</b></p>
          </div>
          <div className="hero-progress">
            <div className="ring" style={{ '--deg': `${progress.percent * 3.6}deg` }}><span><b>{progress.percent}%</b><small>avance</small></span></div>
            <div><b>{progress.passed}/{subjects.length}</b><small>materias aprobadas</small></div>
          </div>
        </section>

        <section className="orientation-tabs">
          <div className="section-label">{orientationLabel}</div>
          <div className="tabs-scroll">
            {ORIENTATION_KEYS[careerKey].map(key => (
              <button key={key} className={orientation === key ? 'orientation-tab active' : 'orientation-tab'} onClick={() => changeOrientation(key)}>
                <span className="tab-dot" />{orientationSet[key].label}
              </button>
            ))}
          </div>
        </section>

        {view === 'carrera' && (
          <>
            <section className="metrics">
              <Metric icon="✓" value={progress.passed} label="Aprobadas" sub={`${progress.percent}% del plan`} />
              <Metric icon="◐" value={progress.regular} label="Regularizadas" sub="listas para final" />
              <Metric icon="◉" value={progress.current} label="En curso" sub="actualmente cursando" />
              <Metric icon="★" value={progress.avg} label="Promedio" sub={`${progress.grades} notas cargadas`} />
            </section>

            <section className="quick-goals">
              {career.milestones.map(([key, titleText, sub]) => <Milestone key={key} title={titleText} sub={sub} checked={!!profile.milestones?.[key]} onClick={() => toggleMilestone(key)} />)}
            </section>

            <section className="toolbar">
              <div className="search-wrap"><span>⌕</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar materia o código…" /></div>
              <div className="toolbar-actions">
                <button className={`filter-toggle ${showFilters ? 'active' : ''}`} onClick={() => setShowFilters(v => !v)}>⚙ Filtros</button>
                <button className={`view-toggle ${compact ? 'active' : ''}`} onClick={() => setCompact(v => !v)}>{compact ? '▦ Compacta' : '▦ Cómoda'}</button>
              </div>
            </section>
            {showFilters && <FilterBar year={yearFilter} setYear={setYearFilter} term={termFilter} setTerm={setTermFilter} status={statusFilter} setStatus={setStatusFilter} />}
            <div className="legend"><span><i className="dot passed" />Aprobada</span><span><i className="dot current" />En curso</span><span><i className="dot regular" />Regular</span><span><i className="dot pending" />Pendiente</span></div>

            <CareerGrid subjects={filtered} state={state} careerKey={careerKey} compact={compact} onStatus={setStatus} onCycle={cycleStatus} onOpen={setSelected} getEligibility={getEligibility} />
          </>
        )}

        {view === 'mapa' && <MapView subjects={subjects} profile={profile} onOpen={setSelected} getEligibility={getEligibility} />}
        {view === 'stats' && <StatsView subjects={subjects} profile={profile} progress={progress} career={career} getStatus={getStatus} />}
        {view === 'settings' && <SettingsView state={state} career={career} careerKey={careerKey} orientation={orientation} orientationSet={orientationSet} onReset={doReset} onImport={doImport} onExport={() => exportState(state)} onChangeCareer={() => setShowCareerPicker(true)} />}
      </main>

      {showCareerPicker && <CareerPickerModal current={careerKey} onSelect={key => { selectCareer(key); setShowCareerPicker(false); }} onClose={() => setShowCareerPicker(false)} />}
      {selected && <SubjectModal subject={selected} profile={profile} byCode={byCode} getStatus={getStatus} getEligibility={getEligibility} onStatus={setStatus} onPatch={patchSubject} onClose={() => setSelected(null)} />}
      {toast && <div className="toast">✓ {toast}</div>}

      <footer className="credits-footer">
        <p>© {new Date().getFullYear()} · Creado y desarrollado por <b>Santino Cuadra</b> · Proyecto independiente para estudiantes de la Facultad de Ingeniería de la UNNE.</p>
        <a
          href="https://github.com/santic24/ing-unne-tracker"
          target="_blank"
          rel="noreferrer"
          className="footer-github"
        >
          GitHub ↗
        </a>
        <small>No es un sitio oficial de la UNNE.</small>
      </footer>
    </div>
  );
}

function Welcome({ onSelect }) {
  const choices = [
    { ...CAREERS.civil, icon: '⌂', eyebrow: 'ESTRUCTURAS · OBRAS', note: '4 orientaciones' },
    { ...CAREERS.electromecanica, icon: 'ϟ', eyebrow: 'ELECTRICIDAD · MÁQUINAS', note: '3 opciones' },
    { ...CAREERS.mecanica, icon: '⚙', eyebrow: 'MÁQUINAS · PRODUCCIÓN', note: 'Máquinas Agrícolas' },
  ];
  return <div className="welcome-screen">
    <div className="welcome-shell">
      <div className="welcome-brand"><span className="welcome-mark">FI</span><div><b>Trackeador de Ingeniería</b><small>FACULTAD DE INGENIERÍA · UNNE</small></div></div>
      <div className="welcome-kicker-row"><span className="kicker">SEGUIMIENTO ACADÉMICO</span><span className="welcome-pill">v5 · MULTICARRERA</span></div>
      <h1>Tu carrera. Tus correlativas. Tu progreso.</h1>
      <p className="welcome-lead">Elegí tu ingeniería y tené el plan de estudios organizado por año y cuatrimestre. Marcá una materia como <b>regular</b> o <b>aprobada</b> y el trackeador va conectando las correlativas para mostrarte qué materias podés cursar.</p>
      <div className="welcome-features"><span><b>01</b> Plan de estudios completo</span><span><b>02</b> Correlativas conectadas</span><span><b>03</b> Notas y fechas</span><span><b>04</b> Avance y estadísticas</span></div>
      <div className="welcome-divider" />
      <div className="welcome-select-head"><div><span className="kicker">PRIMER PASO</span><h2>¿Qué ingeniería estudiás?</h2></div><span className="welcome-select-hint">Elegí una para comenzar</span></div>
      <div className="career-choices">
        {choices.map(c => <button key={c.key} className={`career-choice ${c.key}`} onClick={() => onSelect(c.key)}>
          <span className="career-choice-mark"><span>{c.icon}</span><small>{c.short}</small></span>
          <span className="career-choice-copy"><small>{c.eyebrow}</small><b>{c.label}</b><em>{c.note}</em></span>
          <span className="choice-arrow">→</span>
        </button>)}
      </div>
      <div className="welcome-bottom"><span>Guardado local · sin cuenta</span><span>Proyecto independiente</span><span>© {new Date().getFullYear()} Santino Cuadra</span></div>
    </div>
  </div>;
}

function NavButton({ active, onClick, children }) { return <button className={active ? 'nav-btn active' : 'nav-btn'} onClick={onClick}>{children}</button>; }
function Metric({ icon, value, label, sub }) { return <div className="metric"><span>{icon}</span><div><b>{value}</b><strong>{label}</strong><small>{sub}</small></div></div>; }
function Milestone({ title, sub, checked, onClick }) { return <button className={`milestone ${checked ? 'done' : ''}`} onClick={onClick}><span>{checked ? '✓' : '○'}</span><div><b>{title}</b><small>{sub}</small></div></button>; }

function FilterBar({ year, setYear, term, setTerm, status, setStatus }) {
  return <div className="filter-panel">
    <div><b>Año</b><div className="chips">{['all','1','2','3','4','5'].map(v => <button key={v} className={year === v ? 'chip active' : 'chip'} onClick={() => setYear(v)}>{v === 'all' ? 'Todos' : `${v}°`}</button>)}</div></div>
    <div><b>Cuatrimestre</b><div className="chips">{['all',1,2,3,4,5,6,7,8,9,10].map(v => <button key={v} className={String(term) === String(v) ? 'chip active' : 'chip'} onClick={() => setTerm(String(v))}>{v === 'all' ? 'Todos' : v}</button>)}</div></div>
    <div><b>Estado</b><div className="chips">{['all',...STATUS_ORDER].map(v => <button key={v} className={status === v ? 'chip active' : 'chip'} onClick={() => setStatus(v)}>{v === 'all' ? 'Todos' : STATUS[v].label}</button>)}</div></div>
  </div>;
}

function CareerGrid({ subjects, state, careerKey, compact, onStatus, onCycle, onOpen, getEligibility }) {
  if (!subjects.length) return <div className="empty"><span>⌕</span><h3>No encontramos materias</h3><p>Probá con otro texto o limpiá los filtros.</p></div>;
  const years = [1,2,3,4,5];
  return <div className={`career-grid ${compact ? 'compact' : ''}`}>
    {years.map(year => {
      const yearSubjects = subjects.filter(s => s.year === year);
      if (!yearSubjects.length) return null;
      return <section className="year-section" key={year}>
        <div className="year-heading"><div><span className="year-number">0{year}</span><div><h2>{year}° año</h2><small>{yearSubjects.length} materias visibles</small></div></div><span className="year-line" /></div>
        {[1,2,3,4,5,6,7,8,9,10].map(term => {
          const arr = yearSubjects.filter(s => s.term === term);
          if (!arr.length) return null;
          return <div className="term-section" key={term}><div className="term-title"><span>{term}° cuatrimestre</span><i>{arr.length}</i></div><div className="subject-grid">{arr.map(s => <SubjectCard key={`${s.code}-${s.term}`} subject={s} state={state} compact={compact} onStatus={onStatus} onCycle={onCycle} onOpen={onOpen} getEligibility={getEligibility} />)}</div></div>;
        })}
      </section>;
    })}
  </div>;
}

function byCodeLabel(code, state, subject) {
  const subjects = getCurriculum(state.career, state.profiles?.[state.career]?.orientation || DEFAULT_ORIENTATION[state.career]);
  const target = subjects.find(s => (s.progressCode || s.code) === code || s.code === code || s.displayCode === code);
  return target?.displayCode || code;
}

function SubjectCard({ subject, state, compact, onStatus, onCycle, onOpen, getEligibility }) {
  const progressCode = subject.progressCode || subject.code;
  const s = state.profiles?.[state.career]?.subjects?.[progressCode] || { status: 'pending' };
  const status = s.status || 'pending';
  const code = subject.displayCode || subject.code;
  const eligibility = getEligibility(subject);
  const missing = [...new Set([...eligibility.unmetApproved, ...eligibility.unmetRegularized])];
  const isLocked = !eligibility.unlocked && status === 'pending';
  return <article className={`subject-card ${status} ${isLocked ? 'locked' : 'unlocked'} ${compact ? 'is-compact' : ''}`}>
    <button className="subject-main" onClick={() => onOpen(subject)}>
      <div className="card-top"><span className="code">{code}</span><span className="hours">{subject.totalHours} h</span></div>
      <h3>{subject.name}</h3>
      <div className="card-info"><span>{subject.hours} h/sem</span>{s.grade != null && <b>Nota {s.grade}</b>}</div>
    </button>
    <div className="status-actions" onClick={e => e.stopPropagation()}>
      {STATUS_ORDER.map(key => <button key={key} disabled={key !== 'pending' && !eligibility.unlocked} title={key === 'pending' ? STATUS[key].label : eligibility.unlocked ? STATUS[key].label : `Faltan correlativas: ${missing.map(c => byCodeLabel(c, state, subject)).join(', ')}`} aria-label={`${subject.name}: ${STATUS[key].label}`} className={status === key ? `status-btn selected ${key}` : 'status-btn'} onClick={() => onStatus(subject.code, key)}>{STATUS[key].icon}</button>)}
      <button className="cycle-btn" title={eligibility.unlocked ? 'Avanzar estado' : 'Correlativas pendientes'} disabled={!eligibility.unlocked} onClick={() => onCycle(subject.code)}>{eligibility.unlocked ? '→' : '🔒'}</button>
    </div>
    <div className="status-caption"><span>{status === 'pending' && !eligibility.unlocked ? `🔒 Faltan ${missing.length} correlativa${missing.length === 1 ? '' : 's'}` : eligibility.unlocked ? '✓ Podés cursarla' : STATUS[status].label}</span><span>{status === 'pending' && missing.length ? missing.slice(0,2).map(c => byCodeLabel(c, state, subject)).join(' · ') + (missing.length > 2 ? '…' : '') : ''}</span></div>
  </article>;
}

function SubjectModal({ subject, profile, byCode, getStatus, getEligibility, onStatus, onPatch, onClose }) {
  const progressCode = subject.progressCode || subject.code;
  const s = profile.subjects[progressCode] || { status: 'pending' };
  const eligibility = getEligibility(subject);
  const status = s.status || 'pending';
  const req = codes => codes?.length ? <div className="req-list">{codes.map(code => { const target = byCode[code]; const logical = target?.progressCode || code; const st = getStatus(logical); return <span key={code}><b>{target?.displayCode || code}</b><em>{target?.name || 'Materia del plan'}</em><small className={`req-status ${st}`}>{STATUS[st].label}</small></span>; })}</div> : <p className="muted">Sin correlativas.</p>;
  const displayCode = subject.displayCode || subject.code;
  return <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}><div className="modal">
    <button className="modal-close" onClick={onClose}>×</button>
    <div className="modal-kicker">{displayCode} · {subject.year}° año · {subject.term}° cuatrimestre</div>
    <h2>{subject.name}</h2>
    {subject.sourceNote && <p className="source-note">Nota del documento: {subject.sourceNote}</p>}
    {!eligibility.unlocked && <div className="lock-box"><b>🔒 Correlativas pendientes</b><span>Esta materia se desbloquea cuando cumplas las condiciones indicadas por el plan.</span></div>}
    {eligibility.unlocked && status === 'pending' && <div className="unlock-box"><b>✓ Materia desbloqueada</b><span>Ya cumplís las correlativas para cursarla.</span></div>}
    <div className="modal-tags"><span>{subject.hours} h/sem</span><span>{subject.totalHours} h totales</span></div>
    <div className="modal-statuses"><b>Estado</b><div>{STATUS_ORDER.map(key => <button key={key} disabled={key !== 'pending' && !eligibility.unlocked} className={status === key ? `modal-status selected ${key}` : 'modal-status'} onClick={() => onStatus(subject.code, key)}>{STATUS[key].icon} {STATUS[key].label}</button>)}</div></div>
    <div className="modal-fields"><label>Nota final<input type="number" min="0" max="10" step="0.01" value={s.grade ?? ''} onChange={e => onPatch(progressCode, { grade: e.target.value === '' ? undefined : Number(e.target.value) })} /></label><label>Fecha de aprobación<input type="date" value={s.date || ''} onChange={e => onPatch(progressCode, { date: e.target.value })} /></label></div>
    <div className="requirements-grid"><div><h4>Para regularizar</h4>{req(subject.regularized)}</div><div><h4>Para aprobar</h4>{req(subject.approved)}</div></div>
  </div></div>;
}

function MapView({ subjects, profile, onOpen, getEligibility }) {
  const grouped = [1,2,3,4,5].map(year => ({ year, list: subjects.filter(s => s.year === year) }));
  return <section className="page-section"><div className="section-head"><div><div className="kicker">DEPENDENCIAS</div><h2>Mapa de correlativas</h2><p>Vista general del plan. Las materias se colorean según el estado que vos registres.</p></div></div><div className="map-flow">{grouped.map(g => <div className="map-year" key={g.year}><div className="map-year-label">{g.year}°</div><div className="map-nodes">{g.list.map(s => {const st = profile.subjects[s.progressCode || s.code]?.status || 'pending'; const eligibility = getEligibility(s); return <button key={`${s.code}-${s.term}`} className={`map-node ${st} ${!eligibility.unlocked && st === 'pending' ? 'locked' : ''}`} onClick={() => onOpen(s)}><span>{s.displayCode || s.code}</span><b>{s.name}</b><small>{st === 'pending' && !eligibility.unlocked ? `🔒 Faltan ${[...new Set([...eligibility.unmetApproved, ...eligibility.unmetRegularized])].length}` : STATUS[st].label}</small></button>})}</div></div>)}</div></section>;
}

function StatsView({ subjects, profile, progress, career, getStatus }) {
  const yearStats = [1,2,3,4,5].map(year => { const list = subjects.filter(s => s.year === year); const passed = list.filter(s => getStatus(s.code) === 'passed').length; return { year, total: list.length, passed, percent: list.length ? Math.round((passed/list.length)*100) : 0 }; });
  const grades = subjects.filter(s => typeof profile.subjects[s.progressCode || s.code]?.grade === 'number').sort((a,b) => (profile.subjects[b.progressCode || b.code]?.grade ?? -1) - (profile.subjects[a.progressCode || a.code]?.grade ?? -1));
  const pending = subjects.filter(s => getStatus(s.code) === 'pending').length;
  return <section className="page-section"><div className="stats-hero"><div><div className="kicker">TU PROGRESO</div><h2>{progress.percent}% de carrera completada</h2><p>{progress.hoursPassed.toLocaleString('es-AR')} horas de asignaturas aprobadas sobre las {career.requirements.hours.toLocaleString('es-AR')} horas indicadas para el plan.</p></div><div className="big-number">{progress.avg}<small>promedio</small></div></div><div className="year-stats">{yearStats.map(s => <div className="year-stat" key={s.year}><div><b>{s.year}° año</b><span>{s.passed}/{s.total}</span></div><div className="bar"><i style={{ width: `${s.percent}%` }} /></div></div>)}</div><div className="stats-columns"><div className="panel"><div className="panel-head"><div><div className="kicker">RESUMEN</div><h3>Estado de tu carrera</h3></div></div><div className="summary-list"><div><span>Aprobadas</span><b>{progress.passed}</b></div><div><span>Regularizadas</span><b>{progress.regular}</b></div><div><span>En curso</span><b>{progress.current}</b></div><div><span>Pendientes</span><b>{pending}</b></div></div></div><div className="panel"><div className="panel-head"><div><div className="kicker">CALIFICACIONES</div><h3>Notas cargadas</h3></div></div>{grades.length ? <div className="grades">{grades.map(s => <div key={s.code}><span>{s.displayCode || s.code}</span><b>{s.name}</b><strong>{profile.subjects[s.progressCode || s.code].grade}</strong></div>)}</div> : <p className="muted">Todavía no cargaste notas.</p>}</div></div></section>;
}

function SettingsView({ state, career, careerKey, orientation, orientationSet, onReset, onImport, onExport, onChangeCareer }) {
  return <section className="page-section settings-page">
    <div className="panel"><div className="kicker">DATOS</div><h2>Tu progreso queda guardado en este navegador.</h2><p>Exportá una copia JSON para respaldarlo o pasarlo a otra computadora. Importarlo recupera los perfiles, estados, notas y fechas.</p><div className="settings-actions"><button className="primary" onClick={onExport}>↓ Exportar progreso</button><label className="secondary">↑ Importar progreso<input type="file" accept="application/json" onChange={onImport} /></label><button className="danger" onClick={onReset}>Borrar progreso de esta carrera</button></div></div>
    <div className="panel"><div className="kicker">CARRERA ACTIVA</div><h2>{career.label}</h2><p>{career.source}</p><div className="info-grid"><div><span>Carga horaria</span><b>{career.requirements.hours.toLocaleString('es-AR')} h</b></div><div><span>PPS</span><b>{career.requirements.pps} h reloj</b></div><div><span>{careerKey === 'civil' ? 'Orientación' : 'Opción'}</span><b>{orientationSet[orientation]?.label}</b></div><div><span>Inglés Técnico</span><b>Antes de 4° año</b></div></div><p className="note">{career.requirements.english}.</p><button className="secondary change-career" onClick={onChangeCareer}>↔ Cambiar carrera</button></div>
    <div className="panel"><div className="kicker">CRÉDITOS</div><h2>Proyecto independiente</h2><p>Trackeador desarrollado por <b>Santino Cuadra</b> para facilitar el seguimiento personal de los planes de estudio de la Facultad de Ingeniería de la UNNE.</p><p className="note">No es un sitio oficial de la UNNE. Los planes y correlatividades deben contrastarse con la documentación académica vigente.</p></div>
    <div className="panel"><div className="kicker">PLAN</div><h2>¿Cómo se guarda?</h2><p>El progreso se almacena localmente en el navegador. Cada estudiante tiene su propio seguimiento. Para moverlo entre dispositivos, usá Exportar e Importar.</p></div>
  </section>;
}

function CareerPickerModal({ current, onSelect, onClose }) {
  return <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}>
    <div className="modal career-picker-modal">
      <button className="modal-close" onClick={onClose}>×</button>
      <div className="kicker">CARRERA</div>
      <h2>Seleccioná la carrera</h2>
      <p className="muted">Podés cambiar de carrera sin perder el progreso guardado de las otras.</p>
      <div className="career-choices picker-choices">
        {Object.values(CAREERS).map(c => <button key={c.key} className={`career-choice ${c.key} ${current === c.key ? 'active-choice' : ''}`} onClick={() => onSelect(c.key)}>
          <span className="career-choice-mark">{c.short}</span><span><b>{c.label}</b><small>{c.key === 'civil' ? '4 orientaciones' : c.key === 'electromecanica' ? '3 opciones' : 'Máquinas Agrícolas'}</small></span><span className="choice-arrow">{current === c.key ? '✓' : '→'}</span>
        </button>)}
      </div>
    </div>
  </div>;
}


createRoot(document.getElementById('root')).render(
  <>
    <App />
    <Analytics />
  </>
);
