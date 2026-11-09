/**
 * CristianPlay - Datos simulados (mock) de YouTube
 * Versión 0.01
 *
 * NOTA: En producción reemplaza esto por la YouTube Data API v3.
 * Necesitarás una API Key de Google Cloud Console y habilitar
 * YouTube Data API v3. Luego usa los endpoints search.list y videos.list.
 */

// Palabras clave que definen contenido cristiano.
// Un resultado solo pasa el filtro si su título O descripción contiene
// al menos una de estas palabras (evitando falsos positivos obvios).
const CHRISTIAN_KEYWORDS = [
  'alabanza', 'alabanzas', 'adoración', 'adoracion', 'evangelio',
  'cristiana', 'cristiano', 'jesús', 'jesus', 'dios', 'señor', 'senor',
  'espíritu santo', 'espiritu santo', 'himno', 'himnos', 'coral',
  'predicación', 'predicacion', 'sermón', 'sermon', 'pastor',
  'podcast cristiano', 'fe', 'oración', 'oracion', 'milagro',
  'salvación', 'salvacion', 'cruz', 'resurrección', 'resurreccion',
  'adoramos', 'adorando', 'gloria', 'halleluya', 'hallelujah',
  'amén', 'amen', 'poderoso', 'señor mío', 'señor mio',
  'bendición', 'bendicion', 'adoradle', 'cristo', 'evangélico',
  'evangelico', 'iglesia', 'adoremos', 'cantemos', 'silencio',
  'santo', 'sagrada', 'sagrado', 'biblia', 'palabra de dios',
];

// Términos que, si aparecen, excluyen el resultado aunque tenga
// palabras cristianas (evita contenido no cristiano disfrazado).
const EXCLUDE_KEYWORDS = [
  'reguetón', 'reggaeton', 'trap', 'bailable', 'fiesta', 'rumba',
  'escaparate', 'falso', 'parodia', 'comedia', 'chiste',
];

function isChristianContent(title, description = '') {
  const text = `${title} ${description}`.toLowerCase();
  if (EXCLUDE_KEYWORDS.some(k => text.includes(k.toLowerCase()))) {
    return false;
  }
  return CHRISTIAN_KEYWORDS.some(k => text.includes(k.toLowerCase()));
}

function passesCategory(text, category) {
  const t = text.toLowerCase();
  const maps = {
    alabanza: ['alabanza', 'alabanzas', 'himno', 'himnos', 'coral', 'cantemos', 'adoramos', 'adorando'],
    adoracion: ['adoración', 'adoracion', 'adorando', 'adoremos', 'gloria', 'halleluya', 'hallelujah'],
    predicacion: ['predicación', 'predicacion', 'sermón', 'sermon', 'pastor', 'iglesia', 'biblia', 'palabra de dios'],
    podcast: ['podcast', 'predicador', 'conferencia', 'entrevista'],
  };
  const keys = maps[category] || [];
  return keys.some(k => t.includes(k));
}

const MOCK_VIDEOS = [
  {
    id: 'yt_001',
    title: 'Alabanza y Adoración - En la Presencia de Dios (2024)',
    channel: 'Adoración Cristiana',
    category: 'adoracion',
    duration: '45:12',
    thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
    youtubeId: 'dQw4w9WgXcQ',
    type: 'video',
    description: 'Una hora de alabanza y adoración cristiana para tu vida espiritual.',
  },
  {
    id: 'yt_002',
    title: 'Himnos Cristianos Tradicionales - Grandes Clásicos de la Fe',
    channel: 'Himnos Evangélicos',
    category: 'alabanza',
    duration: '1:10:00',
    thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
    youtubeId: 'dQw4w9WgXcQ',
    type: 'audio',
    description: 'Colección de himnos cristianos tradicionales para escuchar y adorar.',
  },
  {
    id: 'yt_003',
    title: 'Sermón: El Poder de la Cruz - Predicación Cristiano',
    channel: 'Ministerio Fe y Vida',
    category: 'predicacion',
    duration: '38:05',
    thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
    youtubeId: 'dQw4w9WgXcQ',
    type: 'video',
    description: 'Predicación sobre el poder transformador de la cruz de Cristo.',
  },
  {
    id: 'yt_004',
    title: 'Podcast Cristiano - Fe en Tiempos Difíciles',
    channel: 'Voces del Evangelio',
    category: 'podcast',
    duration: '52:30',
    thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
    youtubeId: 'dQw4w9WgXcQ',
    type: 'audio',
    description: 'Episodio del podcast cristiano hablando de fe y perseverancia.',
  },
  {
    id: 'yt_005',
    title: 'Adoración en Espíritu y Verdad - Sesión en Vivo',
    channel: 'Llame de Adoración',
    category: 'adoracion',
    duration: '1:05:00',
    thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
    youtubeId: 'dQw4w9WgXcQ',
    type: 'video',
    description: 'Sesión en vivo de adoración cristiana, alabando al Señor.',
  },
  {
    id: 'yt_006',
    title: 'Música Instrumental Cristiana - Piano y Oración',
    channel: 'Piano Cristiano',
    category: 'alabanza',
    duration: '1:20:00',
    thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
    youtubeId: 'dQw4w9WgXcQ',
    type: 'audio',
    description: 'Música instrumental cristiana para orar y meditar en la Palabra.',
  },
  {
    id: 'yt_007',
    title: 'Predicación: Salmo 23 - El Señor es mi Pastor',
    channel: 'Palabra Viva Ministerio',
    category: 'predicacion',
    duration: '29:40',
    thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
    youtubeId: 'dQw4w9WgXcQ',
    type: 'video',
    description: 'Exposición del Salmo 23, el Señor es mi pastor.',
  },
  {
    id: 'yt_008',
    title: 'Podcast Predicadores - Testimonios de Fe',
    channel: 'Testimonios Cristianos',
    category: 'podcast',
    duration: '41:15',
    thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
    youtubeId: 'dQw4w9WgXcQ',
    type: 'audio',
    description: 'Testimonios reales de predicadores cristianos alrededor del mundo.',
  },
];

// Filtrar solo los que pasan la regla cristiana al iniciar
const MOCK_FILTERED = MOCK_VIDEOS.filter(v => isChristianContent(v.title, v.description));

function getMockResults(query = '', category = null) {
  const q = query.toLowerCase();
  return MOCK_FILTERED.filter(v => {
    const matchQuery = !q || v.title.toLowerCase().includes(q) || v.channel.toLowerCase().includes(q);
    const matchCat = !category || v.category === category;
    return matchQuery && matchCat;
  });
}

window.__cpMock = {
  isChristianContent,
  passesCategory,
  getMockResults,
  MOCK_VIDEOS,
};