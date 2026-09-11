const KEY = 'facultad-ingenieria-unne-tracker-v5';
const LEGACY_KEY = 'facultad-ingenieria-unne-tracker-v4';

const DEFAULT_MILESTONES = { english: false, pps: false, elective: false, final: false };

export function emptyProfile(orientation) {
  return {
    orientation,
    subjects: {},
    milestones: { ...DEFAULT_MILESTONES },
  };
}

export function emptyState() {
  return {
    career: null,
    profiles: {},
  };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY) || localStorage.getItem(LEGACY_KEY) || '{}';
    const parsed = JSON.parse(raw);
    // Migración simple desde la versión Civil V3 y desde el tracker multicarrera V4.
    if (!parsed.career && parsed.orientation && parsed.subjects) {
      return {
        career: 'civil',
        profiles: { civil: { orientation: parsed.orientation, subjects: parsed.subjects || {}, milestones: { ...DEFAULT_MILESTONES, ...(parsed.milestones || {}) } } },
      };
    }
    const next = { career: parsed.career || null, profiles: parsed.profiles || {} };
    // En Mecánica, las dos apariciones del código 425 representan la misma materia.
    const mec = next.profiles?.mecanica;
    if (mec?.subjects) {
      const a = mec.subjects['425a'];
      const b = mec.subjects['425b'];
      if (!mec.subjects['425'] && (a || b)) mec.subjects['425'] = a || b;
      delete mec.subjects['425a'];
      delete mec.subjects['425b'];
    }
    return next;
  } catch {
    return emptyState();
  }
}

export function saveState(state) {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
}

export function ensureProfile(state, career, orientation) {
  const existing = state.profiles?.[career];
  if (existing) return existing;
  return emptyProfile(orientation);
}

export function resetProfile(state, career, orientation) {
  const next = { ...state, profiles: { ...state.profiles, [career]: emptyProfile(orientation) } };
  saveState(next);
  return next;
}

export function exportState(state) {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `mi-tracker-facultad-ingenieria-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importState(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try { resolve(JSON.parse(reader.result)); } catch (e) { reject(e); }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}
