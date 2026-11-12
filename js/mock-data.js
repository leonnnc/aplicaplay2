/**
 * CristianPlay - Datos simulados (mock) de YouTube
 * Versión 0.06
 */
const CHRISTIAN_KEYWORDS = [
  'alabanza','alabanzas','adoración','adoracion','evangelio','cristiana','cristiano',
  'jesús','jesus','dios','señor','senor','espíritu santo','espiritu santo','himno','himnos',
  'predicación','predicacion','sermón','sermon','pastor','podcast cristiano','fe','oración','oracion',
  'milagro','salvación','salvacion','cruz','resurrección','resurreccion','adoramos','adorando',
  'gloria','halleluya','hallelujah','amén','amen','poderoso','señor mío','señor mio','bendición','bendicion',
  'adorarle','cristo','evangélico','evangelico','iglesia','adoremos','cantemos','silencio','santo','sagrada',
  'sagrado','biblia','palabra de dios'
];
const EXCLUDE_KEYWORDS = ['reguetón','reggaeton','trap','bailable','fiesta','rumba','escaparate','falso','parodia','comedia','chiste'];

function isChristianContent(title, description='') {
  const t = `${title} ${description}`.toLowerCase();
  if (EXCLUDE_KEYWORDS.some(k => t.includes(k.toLowerCase()))) return false;
  return CHRISTIAN_KEYWORDS.some(k => t.includes(k.toLowerCase()));
}
function passesCategory(text, category) {
  const t = text.toLowerCase();
  const maps = {
    alabanza: ['alabanza','alabanzas','himno','himnos','coral','cantemos','adoramos','adorando'],
    adoracion: ['adoración','adoracion','adorando','adoremos','gloria','halleluya','hallelujah'],
    predicacion: ['predicación','predicacion','sermón','sermon','pastor','iglesia','biblia','palabra de dios'],
    podcast: ['podcast','predicador','conferencia','entrevista'],
    'en vivo': ['en vivo', 'en directo', 'transmisión', 'transmision', 'vivo', 'directo', 'catedral de fe', 'centro de avivamiento']
  };
  return (maps[category]||[]).some(k => t.includes(k));
}

function isLiveStream(item) {
  return item.isLive === true;
}

const MOCK_VIDEOS = [
  { id:'yt_001', title:'Alabanza y Adoración - En la Presencia de Dios (2024)', channel:'Adoración Cristiana', category:'adoracion', duration:'45:12', thumbnail:'https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg', youtubeId:'dQw4w9WgXcQ', type:'video', description:'Una hora de alabanza y adoración cristiana.', artist:'Adoración Cristiana' },
  { id:'yt_002', title:'Himnos Cristianos Tradicionales - Grandes Clásicos de la Fe', channel:'Himnos Evangélicos', category:'alabanza', duration:'1:10:00', thumbnail:'https://i.ytimg.com/vi/j5-yKhDd64s/mqdefault.jpg', youtubeId:'j5-yKhDd64s', type:'video', description:'Colección de himnos cristianos tradicionales.', artist:'Himnos Evangélicos' },
  { id:'yt_003', title:'Marcos Witt - Alabanza y Poder (En Vivo)', channel:'Marcos Witt Oficial', category:'alabanza', duration:'1:05:00', thumbnail:'https://i.ytimg.com/vi/kffacxfA7G4/mqdefault.jpg', youtubeId:'kffacxfA7G4', type:'video', description:'Lo mejor de Marcos Witt en alabanza y poder.', artist:'Marcos Witt' },
  { id:'yt_004', title:'Manuel Medina - Adoración en Espíritu y Verdad', channel:'Manuel Medina Oficial', category:'adoracion', duration:'52:30', thumbnail:'https://i.ytimg.com/vi/2Vv-BfVoq4g/mqdefault.jpg', youtubeId:'2Vv-BfVoq4g', type:'video', description:'Adoración profunda con Manuel Medina.', artist:'Manuel Medina' },
  { id:'yt_005', title:'Sermón: El Poder de la Cruz - Predicación Cristiano', channel:'Ministerio Fe y Vida', category:'predicacion', duration:'38:05', thumbnail:'https://i.ytimg.com/vi/yJxtxP8xr3s/mqdefault.jpg', youtubeId:'yJxtxP8xr3s', type:'video', description:'Predicación sobre el poder transformador de la cruz de Cristo.', artist:'Ministerio Fe y Vida' },
  { id:'yt_006', title:'Julio Melgar - Adoración Profunda', channel:'Julio Melgar Oficial', category:'adoracion', duration:'41:15', thumbnail:'https://i.ytimg.com/vi/i6r9N4_5oQg/mqdefault.jpg', youtubeId:'i6r9N4_5oQg', type:'video', description:'Lo mejor de Julio Melgar en adoración.', artist:'Julio Melgar' },
  { id:'yt_007', title:'Predicación: Salmo 23 - El Señor es mi Pastor', channel:'Palabra Viva Ministerio', category:'predicacion', duration:'29:40', thumbnail:'https://i.ytimg.com/vi/p2P6I1Z4C7g/mqdefault.jpg', youtubeId:'p2P6I1Z4C7g', type:'video', description:'Exposición del Salmo 23, el Señor es mi pastor.', artist:'Palabra Viva Ministerio' },
  { id:'yt_008', title:'Ricardo Rodriguez - Predicación Unción del Espíritu', channel:'Ricardo Rodriguez Oficial', category:'predicacion', duration:'44:20', thumbnail:'https://i.ytimg.com/vi/L_jWHffIx5E/mqdefault.jpg', youtubeId:'L_jWHffIx5E', type:'video', description:'Predicación con unción del Espíritu Santo.', artist:'Ricardo Rodriguez' },
  { id:'yt_009', title:'Marcela Gandara - Adoración y Gloria', channel:'Marcela Gandara Oficial', category:'adoracion', duration:'36:50', thumbnail:'https://i.ytimg.com/vi/A_ZD2V6R6uU/mqdefault.jpg', youtubeId:'A_ZD2V6R6uU', type:'video', description:'Adoración y gloria con Marcela Gandara.', artist:'Marcela Gandara' },
  { id:'yt_010', title:'Marco Barrientos - Aire Fresco (En Vivo)', channel:'Marco Barrientos Oficial', category:'alabanza', duration:'1:15:00', thumbnail:'https://i.ytimg.com/vi/3JH_D39qlOQ/mqdefault.jpg', youtubeId:'3JH_D39qlOQ', type:'video', description:'Aire fresco en vivo con Marco Barrientos.', artist:'Marco Barrientos' },

  // Transmisiones en vivo - Catedral de Fe Centro de Avivamiento
  { id:'live_001', title:'🔴 EN VIVO - Servicio Dominical - Catedral de Fe Centro de Avivamiento', channel:'Catedral de Fe Centro de Avivamiento', category:'en vivo', duration:'LIVE', thumbnail:'https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg', youtubeId:'dQw4w9WgXcQ', type:'video', description:'Transmisión en vivo del servicio dominical de la Catedral de Fe Centro de Avivamiento.', artist:'Catedral de Fe Centro de Avivamiento', isLive: true },
  { id:'live_002', title:'🔴 EN VIVO - Oración y Alabanza - Catedral de Fe Centro de Avivamiento', channel:'Catedral de Fe Centro de Avivamiento', category:'en vivo', duration:'LIVE', thumbnail:'https://i.ytimg.com/vi/j5-yKhDd64s/mqdefault.jpg', youtubeId:'j5-yKhDd64s', type:'video', description:'Transmisión en vivo de oración y alabanza.', artist:'Catedral de Fe Centro de Avivamiento', isLive: true },
  { id:'live_003', title:'🔴 EN VIVO - Predicación de la Palabra - Catedral de Fe Centro de Avivamiento', channel:'Catedral de Fe Centro de Avivamiento', category:'en vivo', duration:'LIVE', thumbnail:'https://i.ytimg.com/vi/kffacxfA7G4/mqdefault.jpg', youtubeId:'kffacxfA7G4', type:'video', description:'Transmisión en vivo de predicación de la Palabra de Dios.', artist:'Catedral de Fe Centro de Avivamiento', isLive: true }
];

const MOCK_FILTERED = MOCK_VIDEOS.filter(v => isChristianContent(v.title, v.description));

function getMockResults(query='', category=null) {
  const q = query.toLowerCase();
  return MOCK_FILTERED.filter(v => {
    const mq = !q || v.title.toLowerCase().includes(q) || v.channel.toLowerCase().includes(q) || (v.artist && v.artist.toLowerCase().includes(q));
    const mc = !category || v.category === category;
    return mq && mc;
  });
}

window.__cpMock = { isChristianContent, passesCategory, getMockResults, MOCK_VIDEOS, MOCK_FILTERED };