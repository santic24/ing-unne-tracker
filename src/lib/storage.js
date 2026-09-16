import { CAREERS, CAREER_ORIENTATIONS } from '../data/curriculum';

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
const VALID_STATUSES = new Set([
  'pending',
  'current',
  'regular',
  'passed',
]);

const VALID_MILESTONES = new Set([
  'english',
  'pps',
  'elective',
  'final',
]);

function isPlainObject(value) {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value)
  );
}

function isValidGrade(value) {
  if (value === undefined || value === null || value === '') {
    return true;
  }

  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return false;
  }

  if (value < 0 || value > 10) {
    return false;
  }

  // Máximo dos decimales.
  return Math.abs(value * 100 - Math.round(value * 100)) < 0.000001;
}

function isValidDate(value) {
  if (value === undefined || value === null || value === '') {
    return true;
  }

  if (typeof value !== 'string') {
    return false;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00`);

  return !Number.isNaN(date.getTime());
}

function sanitizeSubject(subject) {
  if (!isPlainObject(subject)) {
    return null;
  }

  const status =
    typeof subject.status === 'string' &&
    VALID_STATUSES.has(subject.status)
      ? subject.status
      : 'pending';

  let grade;

  if (
    subject.grade !== undefined &&
    subject.grade !== null &&
    subject.grade !== ''
  ) {
    const numericGrade = Number(subject.grade);

    if (!isValidGrade(numericGrade)) {
      return null;
    }

    grade = Number(numericGrade.toFixed(2));
  }

  let date;

  if (subject.date !== undefined && subject.date !== '') {
    if (!isValidDate(subject.date)) {
      return null;
    }

    date = subject.date;
  }

  return {
    status,
    ...(grade !== undefined ? { grade } : {}),
    ...(date !== undefined ? { date } : {}),
  };
}

function sanitizeProfile(careerKey, profile) {
  if (!isPlainObject(profile)) {
    throw new Error('Perfil inválido');
  }

  const orientations = CAREER_ORIENTATIONS[careerKey] || {};
  const validOrientations = Object.keys(orientations);

  let orientation = profile.orientation;

  if (!validOrientations.includes(orientation)) {
    orientation = validOrientations[0];
  }

  const subjects = {};

  if (isPlainObject(profile.subjects)) {
    for (const [code, rawSubject] of Object.entries(profile.subjects)) {
      // evitar claves absurdamente largas.
      if (
        typeof code !== 'string' ||
        code.length === 0 ||
        code.length > 30
      ) {
        continue;
      }

      const cleanSubject = sanitizeSubject(rawSubject);

      if (cleanSubject) {
        subjects[code] = cleanSubject;
      }
    }
  }

  const milestones = { ...DEFAULT_MILESTONES };

  if (isPlainObject(profile.milestones)) {
    for (const key of VALID_MILESTONES) {
      if (typeof profile.milestones[key] === 'boolean') {
        milestones[key] = profile.milestones[key];
      }
    }
  }

  return {
    orientation,
    subjects,
    milestones,
  };
}

export function validateImportedState(raw) {
  if (!isPlainObject(raw)) {
    throw new Error('El archivo no contiene un objeto válido');
  }

  if (
    typeof raw.career !== 'string' ||
    !Object.prototype.hasOwnProperty.call(CAREERS, raw.career)
  ) {
    throw new Error('Carrera inválida');
  }

  if (!isPlainObject(raw.profiles)) {
    throw new Error('Perfiles inválidos');
  }

  const profiles = {};

  for (const careerKey of Object.keys(CAREERS)) {
    const rawProfile = raw.profiles[careerKey];

    if (rawProfile === undefined) {
      continue;
    }

    profiles[careerKey] = sanitizeProfile(
      careerKey,
      rawProfile
    );
  }

  if (!profiles[raw.career]) {
    throw new Error('No existe un perfil para la carrera seleccionada');
  }

  return {
    career: raw.career,
    profiles,
  };
}

export function importState(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        const validated = validateImportedState(parsed);
        resolve(validated);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = reject;
    reader.readAsText(file);
  });
}
