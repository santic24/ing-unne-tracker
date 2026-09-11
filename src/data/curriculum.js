// correlativas se usan para calcular si una materia puede cursarse:
// regularizadas: alcanza con tenerla Regular o Aprobada.
// aprobadas: debe estar Aprobada.
// las materias con el mismo código lógico comparten estado.

const m = (code, name, year, term, hours, totalHours, regularized = [], approved = [], extra = {}) => ({
  code, name, year, term, hours, totalHours, regularized, approved, ...extra,
});
//carreras
export const CAREERS = {
  civil: {
    key: 'civil',
    short: 'IC',
    label: 'Ingeniería Civil',
    description: 'Seguimiento del plan de estudios, correlativas, notas y avance de tu carrera.',
    source: 'Plan de Estudios de Ingeniería Civil · Resolución 552/16',
    requirements: { hours: 4430, pps: 200, english: 'Evaluación de conocimiento del idioma inglés antes de iniciar materias de 4° año' },
    milestones: [
      ['english', 'Inglés', 'Antes de iniciar 4° año'],
      ['pps', 'PPS', '200 h reloj'],
      ['elective', 'Electiva', '10° cuatrimestre'],
      ['final', 'Trabajo Final', '300 h · 20 h/sem'],
    ],
  },
  electromecanica: {
    key: 'electromecanica',
    short: 'IE',
    label: 'Ingeniería Electromecánica',
    description: 'Trackeador del plan de Ingeniería Electromecánica con sus tres opciones de orientación.',
    source: 'Plan de Estudios vigente · Resolución 866/05',
    requirements: { hours: 4370, pps: 200, english: 'Evaluación de conocimiento del idioma inglés antes de iniciar materias de 4° año' },
    milestones: [
      ['english', 'Inglés Técnico', 'Antes de iniciar 4° año'],
      ['pps', 'PPS', '200 h reloj'],
      ['elective', 'Optativas', 'I · II · III'],
      ['final', 'Proyecto de Máquinas', 'Materia de 5° año'],
    ],
  },
  mecanica: {
    key: 'mecanica',
    short: 'IM',
    label: 'Ingeniería Mecánica',
    description: 'Trackeador del plan de Ingeniería Mecánica con la opción de Máquinas Agrícolas.',
    source: 'Plan de Estudios · Resolución 113/17-CS',
    requirements: { hours: 4220, pps: 200, english: 'Evaluación de conocimiento del idioma inglés antes de iniciar materias de 4° año' },
    milestones: [
      ['english', 'Inglés Técnico', 'Antes de iniciar 4° año'],
      ['pps', 'PPS', '200 h reloj'],
      ['elective', 'Optativas', 'I a VIII'],
      ['final', 'Proyecto de Máquinas Agrícolas', '10° cuatrimestre'],
    ],
  },
};
//civil
export const COMMON_CIVIL = [
  m('01','Álgebra y Geometría',1,1,10,150),
  m('02','Análisis Matemático I',1,1,8,120),
  m('03','Sistemas de Representación (Mód. I)',1,1,6,90),
  m('04','Fundamentos de Ingeniería',1,1,4,60),
  m('05','Análisis Matemático II',1,2,8,120,['01','02']),
  m('06','Física I',1,2,10,150,['01','02']),
  m('07','Química',1,2,6,90,['01']),
  m('08','Sistemas de Representación (Mód. II)',1,2,2,30,['03']),
  m('09','Análisis Matemático III',2,3,8,120,['05'],['01','02']),
  m('10A','Física II',2,3,5,75,['06'],['01','02']),
  m('10B','Física III',2,3,5,75,['06'],['01','02']),
  m('11','Informática',2,3,6,90,['05'],['01','02']),
  m('12','Estabilidad I',2,3,8,120,['05','06','08'],['01','02','03','04']),
  m('13','Estabilidad II',2,4,8,120,['09','11','12'],['05','06','08']),
  m('14','Topografía y Elementos de Geodesia',2,4,8,120,[],['06']),
  m('15','Estudio y Ensayo de Materiales',2,4,8,120,['09','12'],['05','07']),
  m('16','Planeamiento',2,4,4,60,['08'],['04']),
  m('17','Estabilidad III',3,5,6,90,['13','15'],['11','12']),
  m('18','Hidráulica General',3,5,8,120,['10A'],['09','10A']),
  m('19','Instalaciones en Edificios',3,5,6,90,['15','10A','10B']),
  m('20','Geotecnia',3,5,8,120,['13','14'],['06','07']),
  m('21','Construcciones Metálicas y de Madera',3,6,8,120,['17'],['13','15']),
  m('22','Legislación, Higiene y Seguridad en la Construcción',3,6,6,90,['16','19']),
  m('23','Arquitectura I',3,6,6,90,['19'],['15','16']),
  m('24','Hormigón Armado I',3,6,8,120,['13','17','20'],['15']),
  m('25','Estabilidad IV (Mód. I)',3,6,2,30,['17'],['13']),
  m('26','Fundaciones',4,7,6,90,['21','23','24'],['20']),
  m('27','Hormigón Armado II',4,7,8,120,['24','25'],['17']),
  m('28','Hidrología',4,7,8,120,[],['14','18','20']),
  m('29','Fotointerpretación',4,7,4,60,[],['14']),
  m('30','Construcción de Edificios I (Mód. I)',4,7,2,30,['23','24']),
];
//orientaciones
export const CIVIL_ORIENTATIONS = {
  estructuras: {
    label: 'Proyecto de Estructuras',
    subtitle: 'Proyecto de Estructuras en Obras Civiles',
    subjects: [
      m('31','Construcción de Edificios I (Mód. II)',4,8,4,60,['23','24','30']),
      m('32','Vías de Comunicación I',4,8,8,120,['28','29'],['13','15','16']),
      m('33','Ingeniería Sanitaria y Ambiental',4,8,6,90,['28']),
      m('34','Aprovechamiento y Obras Hidráulicas',4,8,6,90,['28'],['24','25']),
      m('E35','Estabilidad IV (Mód. II)',4,8,4,60,['25']),
      m('36','Vías de Comunicación II',5,9,8,120,['32'],['28','29']),
      m('37','Organización y Dirección de Obras',5,9,6,90,['32','33','34'],['22','23']),
      m('38','Economía y Evaluación de Proyectos',5,9,6,90,['32','33','34']),
      m('E39','Construcciones Metálicas',5,9,6,90,['E35'],['21']),
      m('E40','Hormigón Pretensado',5,10,4,60,['E35'],['26','27']),
    ],
  },
  proyecto: {
    label: 'Proyecto y Construcción',
    subtitle: 'Proyecto y Construcción de Obras Civiles',
    subjects: [
      m('31','Construcción de Edificios I (Mód. II)',4,8,4,60,['23','24','30']),
      m('32','Vías de Comunicación I',4,8,8,120,['28','29'],['13','15','16']),
      m('33','Ingeniería Sanitaria y Ambiental',4,8,6,90,['28']),
      m('34','Aprovechamiento y Obras Hidráulicas',4,8,6,90,['28'],['24','25']),
      m('C35','Máquinas y Equipos',4,8,4,60,['15'],['10A','10B']),
      m('36','Vías de Comunicación II',5,9,8,120,['32'],['28','29']),
      m('37','Organización y Dirección de Obras',5,9,6,90,['32','33','34'],['22','23']),
      m('38','Economía y Evaluación de Proyectos',5,9,6,90,['32','33','34']),
      m('C39','Construcciones de Edificios II',5,9,6,90,['31','C35'],['22','23','26','27','30']),
      m('C40','Arquitectura II',5,10,4,60,['C39'],['21']),
    ],
  },
  hidraulica: {
    label: 'Hidráulica',
    subtitle: 'Orientación Hidráulica',
    subjects: [
      m('31','Construcción de Edificios I (Mód. II)',4,8,4,60,['23','24','30']),
      m('32','Vías de Comunicación I',4,8,8,120,['28','29'],['13','15','16']),
      m('33','Ingeniería Sanitaria y Ambiental',4,8,6,90,['28']),
      m('34','Aprovechamiento y Obras Hidráulicas',4,8,6,90,['28'],['24','25']),
      m('H35','Riego y Drenaje',4,8,6,90,['28']),
      m('36','Vías de Comunicación II',5,9,8,120,['32'],['28','29']),
      m('37','Organización y Dirección de Obras',5,9,6,90,['32','33','34'],['22','23']),
      m('38','Economía y Evaluación de Proyectos',5,9,6,90,['32','33','34']),
      m('H39','Construcciones Hidráulicas',5,9,4,60,['34'],['26','27','28']),
      m('H40','Máquinas Hidráulicas',5,10,4,60,['34']),
    ],
  },
  vias: {
    label: 'Vías de Comunicación',
    subtitle: 'Orientación Vías de Comunicación',
    subjects: [
      m('31','Construcción de Edificios I (Mód. II)',4,8,4,60,['23','24','30']),
      m('32','Vías de Comunicación I',4,8,8,120,['28','29'],['13','15','16']),
      m('33','Ingeniería Sanitaria y Ambiental',4,8,6,90,['28']),
      m('34','Aprovechamiento y Obras Hidráulicas',4,8,6,90,['28'],['24','25']),
      m('V35','Máquinas y Equipos',4,8,4,60,['15'],['10A','10B']),
      m('36','Vías de Comunicación II',5,9,8,120,['32'],['28','29']),
      m('37','Organización y Dirección de Obras',5,9,6,90,['32','33','34'],['22','23']),
      m('38','Economía y Evaluación de Proyectos',5,9,6,90,['32','33','34']),
      m('V39','Vialidad Especial',5,9,6,90,['32','V35']),
      m('V40','Transportes',5,10,4,60,['36','38','V39'],['32']),
    ],
  },
};
//electro
const ELECTRO_BASE = [
  m('01','Álgebra y Geometría',1,1,10,150),
  m('02','Análisis Matemático I',1,1,8,120),
  m('03','Sistemas de Representación (Mod. I)',1,1,6,90),
  m('04','Fundamentos de Ingeniería',1,1,4,60),
  m('05','Análisis Matemático II',1,2,6,90,['01','02']),
  m('06','Física I',1,2,10,150,['01','02']),
  m('07','Química',1,2,6,90,['01']),
  m('08','Sistemas de Representación (Mod. II)',1,2,2,30,['03']),
  m('11','Informática',2,3,6,90,['05'],['01','02']),
  m('209','Complementos de Matemáticas Especiales',2,3,2,30,['05'],['01','02']),
  m('210','Física del Calor',2,3,8,120,['06'],['01','02']),
  m('213','Física Electromagnética y Atómica',2,3,8,120,['06'],['01','02']),
  m('12','Estabilidad I',2,3,8,120,['05','06','08'],['01','02','03','04']),
  m('214','Teoría de los Circuitos',2,4,8,120,['11','209','213'],['05','06']),
  m('215','Resistencia de Materiales',2,4,8,120,['11','12'],['05','06']),
  m('216','Termodinámica',2,4,6,90,['210'],['04','05']),
  m('217','Seguridad y Organización Industrial',2,4,8,120,[],[],{sourceNote:'Las celdas de correlatividades de esta fila no resultan legibles en la copia consultada; no se inventan requisitos.'}),
  m('318','Medidas Eléctricas',3,5,8,120,['214'],['209','213']),
  m('319','Ciencia de los Materiales',3,5,6,90,['210','215'],['07']),
  m('320','Mecánica Racional',3,5,8,120,['209'],['05','06','11']),
  m('321','Metalurgia',3,5,8,120,['210','216'],['07']),
  m('322','Mecánica de los Fluidos',3,6,10,150,['216','320'],['209']),
  m('323','Economía y Administración de Empresas',3,6,4,60,[],[],{sourceNote:'Las celdas de correlatividades de esta fila no resultan legibles en la copia consultada; no se inventan requisitos.'}),
  m('324','Máquinas Térmicas I',3,6,10,150,['216'],['11','210']),
  m('425','Máquinas Hidráulicas',4,7,8,120,['322'],['320','216']),
  m('426','Elementos de Máquinas',4,7,10,150,['321'],['215','320']),
  m('427','Teoría de las Máquinas Eléctricas',4,7,10,150,['318'],['214']),
  m('428','Tecnología Mecánica',4,8,8,120,['426'],['321']),
  m('429','Electrónica I',4,8,6,90,['318'],['214']),
  m('430','Instalaciones Eléctricas',4,8,6,90,['427'],['214']),
  m('531','Automotores, Máquinas Agrícolas y Especiales',5,9,6,90,['324'],['216']),
  m('532','Máquinas de Elevación y Transporte',5,9,8,120,['428','430'],['426']),
  m('533','Ingeniería Legal',5,9,6,90,['428','430'],['426']),
  m('534','Sistemas de Control',5,10,6,90,['429'],['318']),
  m('535','Generación y Transporte de Energía Eléctrica',5,10,8,120,['430'],['427']),
  m('536','Proyecto de Máquinas',5,10,10,150,['532'],['428']),
];
//orientaciones
export const ELECTRO_ORIENTATIONS = {
  automatica: {
    label: 'Automática', subtitle: 'Opción 1 · Automática',
    subjects: [
      m('A37','Oleoneumática',4,8,6,90,['427'],['322']),
      m('A38','Electrónica II',5,9,6,90,['429'],['318']),
      m('A39','Programación Automática',5,10,6,90,['429']),
    ],
  },
  fabricacion: {
    label: 'Fabricación', subtitle: 'Opción 2 · Fabricación',
    subjects: [
      m('F37','Conocimiento de Materiales',4,8,6,90,[],['319','321']),
      m('F38','Elasticidad y Plasticidad',5,9,6,90,[],['215','319']),
      m('F39','Mecánica de Fabricación',5,10,6,90,['F38'],['428']),
    ],
  },
  termica: {
    label: 'Térmica', subtitle: 'Opción 3 · Térmica',
    subjects: [
      m('T37','Oleoneumática',4,8,6,90,['427'],['322']),
      m('T38','Máquinas Térmicas II',5,9,6,90,[],['324']),
      m('T39','Construcción y Ensayo de Máquinas Térmicas',5,10,6,90,['T38','426'],['324']),
    ],
  },
};
//mecanica
const MEC_BASE = [
  m('01','Álgebra y Geometría',1,1,10,150),
  m('02','Análisis Matemático I',1,1,8,120),
  m('03','Sistemas de Representación (Mód. I)',1,1,6,90),
  m('04','Fundamentos de Ingeniería',1,1,4,60),
  m('05','Análisis Matemático II',1,2,8,120,['01','02']),
  m('06','Física I',1,2,10,150,['01','02']),
  m('07','Química',1,2,6,90,['01']),
  m('08','Sistemas de Representación Módulo II',1,2,2,30,['03']),
  m('11','Informática',2,3,6,90,['05'],['01','02']),
  m('09','Análisis Matemático III',2,3,8,120,['05'],['01','02']),
  m('10A','Física II',2,3,5,75,['06'],['01','02']),
  m('10B','Física III',2,3,5,75,['05','06'],['01','02']),
  m('12','Estabilidad I',2,3,8,120,['05','06','08'],['01','02','03','04']),
  m('209','Complementos de Matemáticas Especiales',2,4,4,60,['09'],['05']),
  m('216','Termodinámica',2,4,6,90,['10A'],['04','05','06']),
  m('214','Teoría de los circuitos',2,4,6,90,['11','09','10B'],['05','06']),
  m('215','Resistencia de Materiales',2,4,6,90,['12'],['05']),
  m('318','Medidas Eléctricas',3,5,6,90,['214','209'],['10B']),
  m('319','Ciencia de los Materiales',3,5,6,90,['215'],['07']),
  m('320','Mecánica Racional',3,5,8,120,['209'],['06','09']),
  m('323','Economía y Administración de empresas',3,5,6,90,['209'],['09']),
  m('322','Mecánica de los Fluidos',3,6,8,120,['216','320'],['209']),
  m('324','Máquinas Térmicas I',3,6,8,120,['216'],['11','10A']),
  m('F38','Elasticidad Aplicada',3,6,6,90,['319'],['215']),
  m('321','Metalurgia',3,6,4,60,['10A','216'],['07']),
  m('425a','Máquinas Hidráulicas',4,7,4,60,['322'],['320','216'],{displayCode:'425',progressCode:'425',sourceNote:'Aparece dos veces en la tabla de la resolución; ambas apariciones comparten el mismo código 425.'}),
  m('426','Elementos de Máquinas',4,7,8,120,['319','F38'],['215','320']),
  m('427','Teoría de la Máquinas Eléctricas',4,7,8,120,[],['209','214','318']),
  m('429','Electrónica I',4,7,6,90,[],['209','214','318']),
  m('425b','Máquinas Hidráulicas',4,8,4,60,['322'],['320','216'],{displayCode:'425',progressCode:'425',sourceNote:'Segunda aparición del código 425 en la tabla original; comparte estado con la primera aparición.'}),
  m('428','Tecnología Mecánica',4,8,6,90,['426'],['319']),
  m('A37','Oleoneumática',4,8,6,90,['322','427'],['214']),
  m('217','Seguridad y Organización Industrial',4,8,6,90,['11','09','10A','05'],['323']),
  m('A3','Optativa III',4,8,6,90,['426'],['215','A2']),
  m('A4','Optativa IV',5,9,4,60,['425','A3'],['322','A2']),
  m('533','Ingeniería Legal',5,9,6,90,['217'],['323']),
  m('A5','Optativa V',5,9,6,90,['A3'],['426']),
  m('A6','Optativa VI',5,9,4,60,['324'],['A1','426']),
  m('A7','Optativa VII',5,10,4,60,['217','A3','A5'],['321','323']),
  m('534','Sistemas de Control',5,10,6,90,[],['318','429']),
  m('F39','Mecánica de Fabricación',5,10,6,90,['F38'],['319','428']),
  m('A8','Optativa VIII',5,10,6,90,['A5','A6'],['A1','A2','A3']),
];
//orientaciones
export const MEC_ORIENTATIONS = {
  maquinas_agricolas: {
    label: 'Máquinas Agrícolas', subtitle: 'Opción 1 · Máquinas Agrícolas',
    subjects: [
      m('A1','Química Orgánica y Biológica',3,5,6,90,[],['07']),
      m('A2','Edafología',3,6,6,90,['A1','10A','10B'],['06','07']),
      m('A3','Máquinas agrícolas I',4,8,6,90,['426'],['215','A2']),
      m('A4','Equipos para riego y sistemas de drenaje',5,9,4,60,['425','A3'],['322','A2']),
      m('A5','Máquinas agrícolas II',5,9,6,90,['A3'],['426']),
      m('A6','Manejo y Conservación de granos y forrajes',5,9,4,60,['324'],['A1','426']),
      m('A7','Mantenimiento y Reparación de Máquinas Agrícolas',5,10,4,60,['217','A3','A5'],['321','323']),
      m('A8','Proyecto de Máquinas Agrícolas',5,10,6,90,['A5','A6'],['A1','A2','A3']),
    ],
  },
};

export const CAREER_ORIENTATIONS = {
  civil: CIVIL_ORIENTATIONS,
  electromecanica: ELECTRO_ORIENTATIONS,
  mecanica: MEC_ORIENTATIONS,
};

export const ORIENTATION_KEYS = Object.fromEntries(Object.entries(CAREER_ORIENTATIONS).map(([career, obj]) => [career, Object.keys(obj)]));
//mostrar carrera
export function getCurriculum(career, orientation) {
  if (career === 'civil') return [...COMMON_CIVIL, ...(CIVIL_ORIENTATIONS[orientation]?.subjects || [])];
  if (career === 'electromecanica') {
    const optCodes = new Set(['A37','A38','A39','F37','F38','F39','T37','T38','T39']);
    const base = ELECTRO_BASE.filter(s => !optCodes.has(s.code));
    return [...base, ...(ELECTRO_ORIENTATIONS[orientation]?.subjects || [])];
  }
  if (career === 'mecanica') {
    const generic = new Set(['A1','A2','A3','A4','A5','A6','A7','A8']);
    const base = MEC_BASE.filter(s => !generic.has(s.code));
    return [...base, ...(MEC_ORIENTATIONS[orientation]?.subjects || [])];
  }
  return [];
}
