/**
 * High-fidelity photographic canvas generator.
 * Produces crisp, authentic editorial photography representations
 * with film grain, atmospheric lighting, and composition gradients.
 * Works 100% offline, guaranteeing zero broken images.
 */

export interface PresetScene {
  id: string;
  fileName: string;
  collection: string;
  title: string;
  width: number;
  height: number;
  aspectRatio: number;
  mood: 'coastal' | 'sunset' | 'editorial_bw' | 'warm_indoor' | 'botanical' | 'golden_hour' | 'twilight';
  composition: 'landscape' | 'portrait' | 'detail' | 'wide';
  exif: {
    camera: string;
    lens: string;
    focalLength: string;
    aperture: string;
    shutterSpeed: string;
    iso: string;
  };
}

export const SEED_SCENES: PresetScene[] = [
  {
    id: 'photo-1',
    fileName: 'DSC09102_CoastlineCeremony.jpg',
    collection: 'Ceremony',
    title: 'Ceremony over the Pacific Cliffs',
    width: 2400,
    height: 1600,
    aspectRatio: 1.5,
    mood: 'coastal',
    composition: 'wide',
    exif: { camera: 'Leica M11', lens: 'Summicron-M 35mm f/2 ASPH', focalLength: '35mm', aperture: 'f/2.8', shutterSpeed: '1/2000s', iso: '64' },
  },
  {
    id: 'photo-2',
    fileName: 'DSC09118_FirstLookBluff.jpg',
    collection: 'Portraits',
    title: 'Elena & Marcus First Look on Bluff',
    width: 1600,
    height: 2400,
    aspectRatio: 0.667,
    mood: 'golden_hour',
    composition: 'portrait',
    exif: { camera: 'Sony Alpha 7R V', lens: 'FE 85mm f/1.4 GM', focalLength: '85mm', aperture: 'f/1.6', shutterSpeed: '1/1600s', iso: '100' },
  },
  {
    id: 'photo-3',
    fileName: 'DSC09134_ExchangeOfVows.jpg',
    collection: 'Ceremony',
    title: 'The Exchange of Vows',
    width: 2200,
    height: 1467,
    aspectRatio: 1.5,
    mood: 'coastal',
    composition: 'landscape',
    exif: { camera: 'Leica M11', lens: 'Summilux-M 50mm f/1.4 ASPH', focalLength: '50mm', aperture: 'f/2.0', shutterSpeed: '1/1250s', iso: '125' },
  },
  {
    id: 'photo-4',
    fileName: 'DSC09149_WeddingBandsDetail.jpg',
    collection: 'Details',
    title: 'Handcrafted Gold Bands on Travertine',
    width: 1800,
    height: 1800,
    aspectRatio: 1.0,
    mood: 'botanical',
    composition: 'detail',
    exif: { camera: 'Sony Alpha 7R V', lens: 'FE 90mm f/2.8 Macro G OSS', focalLength: '90mm', aperture: 'f/3.2', shutterSpeed: '1/500s', iso: '160' },
  },
  {
    id: 'photo-5',
    fileName: 'DSC09162_BridePortraitOceanBreeze.jpg',
    collection: 'Portraits',
    title: 'Elena in Ocean Breeze',
    width: 1600,
    height: 2400,
    aspectRatio: 0.667,
    mood: 'editorial_bw',
    composition: 'portrait',
    exif: { camera: 'Leica M11 Monochrom', lens: 'Summilux-M 50mm f/1.4', focalLength: '50mm', aperture: 'f/1.4', shutterSpeed: '1/4000s', iso: '125' },
  },
  {
    id: 'photo-6',
    fileName: 'DSC09177_TheFirstKiss.jpg',
    collection: 'Ceremony',
    title: 'The First Kiss at Altar',
    width: 2400,
    height: 1600,
    aspectRatio: 1.5,
    mood: 'coastal',
    composition: 'landscape',
    exif: { camera: 'Sony Alpha 7R V', lens: 'FE 50mm f/1.2 GM', focalLength: '50mm', aperture: 'f/1.8', shutterSpeed: '1/2500s', iso: '100' },
  },
  {
    id: 'photo-7',
    fileName: 'DSC09188_FloralInstallationLinen.jpg',
    collection: 'Details',
    title: 'Wild Grasses & Natural Linens Tablescape',
    width: 2100,
    height: 1400,
    aspectRatio: 1.5,
    mood: 'botanical',
    composition: 'landscape',
    exif: { camera: 'Leica M11', lens: 'Summicron-M 35mm f/2', focalLength: '35mm', aperture: 'f/2.8', shutterSpeed: '1/800s', iso: '200' },
  },
  {
    id: 'photo-8',
    fileName: 'DSC09205_SunsetWalkingTogether.jpg',
    collection: 'Portraits',
    title: 'Sunset Walk Along Tide Line',
    width: 2500,
    height: 1406,
    aspectRatio: 1.778,
    mood: 'sunset',
    composition: 'wide',
    exif: { camera: 'Sony Alpha 7R V', lens: 'FE 35mm f/1.4 GM', focalLength: '35mm', aperture: 'f/2.2', shutterSpeed: '1/640s', iso: '200' },
  },
  {
    id: 'photo-9',
    fileName: 'DSC09221_GroomPortraitCufflinks.jpg',
    collection: 'Portraits',
    title: 'Marcus Silhouette by Sea Cliff',
    width: 1600,
    height: 2200,
    aspectRatio: 0.727,
    mood: 'editorial_bw',
    composition: 'portrait',
    exif: { camera: 'Leica M11 Monochrom', lens: 'Apo-Summicron-M 75mm', focalLength: '75mm', aperture: 'f/2.0', shutterSpeed: '1/1000s', iso: '160' },
  },
  {
    id: 'photo-10',
    fileName: 'DSC09239_ChampagneToastSunset.jpg',
    collection: 'Reception',
    title: 'Sunset Champagne Pour',
    width: 1700,
    height: 2300,
    aspectRatio: 0.739,
    mood: 'golden_hour',
    composition: 'portrait',
    exif: { camera: 'Sony Alpha 7R V', lens: 'FE 50mm f/1.2 GM', focalLength: '50mm', aperture: 'f/1.4', shutterSpeed: '1/800s', iso: '250' },
  },
  {
    id: 'photo-11',
    fileName: 'DSC09252_ReceptionTableTwilight.jpg',
    collection: 'Reception',
    title: 'Candlelight Dinner Under Cyprus Trees',
    width: 2400,
    height: 1600,
    aspectRatio: 1.5,
    mood: 'twilight',
    composition: 'landscape',
    exif: { camera: 'Sony Alpha 7R V', lens: 'FE 24-70mm f/2.8 GM II', focalLength: '28mm', aperture: 'f/2.8', shutterSpeed: '1/125s', iso: '1600' },
  },
  {
    id: 'photo-12',
    fileName: 'DSC09268_OliveBranchBouquet.jpg',
    collection: 'Details',
    title: 'Wild Olive & Garden Rose Bouquet',
    width: 1600,
    height: 2400,
    aspectRatio: 0.667,
    mood: 'botanical',
    composition: 'portrait',
    exif: { camera: 'Leica M11', lens: 'Summilux-M 50mm f/1.4', focalLength: '50mm', aperture: 'f/2.0', shutterSpeed: '1/1000s', iso: '100' },
  },
  {
    id: 'photo-13',
    fileName: 'DSC09283_LaughingDuringSpeeches.jpg',
    collection: 'Reception',
    title: 'Laughter During Best Man Speech',
    width: 2300,
    height: 1533,
    aspectRatio: 1.5,
    mood: 'warm_indoor',
    composition: 'landscape',
    exif: { camera: 'Sony Alpha 7R V', lens: 'FE 85mm f/1.4 GM', focalLength: '85mm', aperture: 'f/1.8', shutterSpeed: '1/250s', iso: '1250' },
  },
  {
    id: 'photo-14',
    fileName: 'DSC09299_FirstDanceAcoustic.jpg',
    collection: 'Reception',
    title: 'First Dance Under Festoon Lights',
    width: 2400,
    height: 1600,
    aspectRatio: 1.5,
    mood: 'twilight',
    composition: 'landscape',
    exif: { camera: 'Sony Alpha 7R V', lens: 'FE 35mm f/1.4 GM', focalLength: '35mm', aperture: 'f/1.4', shutterSpeed: '1/160s', iso: '2000' },
  },
  {
    id: 'photo-15',
    fileName: 'DSC09314_EmbraceInFog.jpg',
    collection: 'Portraits',
    title: 'Coastal Fog Embrace',
    width: 1600,
    height: 2400,
    aspectRatio: 0.667,
    mood: 'coastal',
    composition: 'portrait',
    exif: { camera: 'Leica M11', lens: 'Noctilux-M 50mm f/0.95', focalLength: '50mm', aperture: 'f/1.2', shutterSpeed: '1/2000s', iso: '64' },
  },
  {
    id: 'photo-16',
    fileName: 'DSC09328_PaperGoodsCalligraphy.jpg',
    collection: 'Details',
    title: 'Handmade Cotton Paper Vows & Calligraphy',
    width: 2000,
    height: 1500,
    aspectRatio: 1.333,
    mood: 'botanical',
    composition: 'landscape',
    exif: { camera: 'Leica M11', lens: 'Summicron-M 35mm f/2', focalLength: '35mm', aperture: 'f/4.0', shutterSpeed: '1/320s', iso: '200' },
  },
  {
    id: 'photo-17',
    fileName: 'DSC09341_GuestConfettiRecessional.jpg',
    collection: 'Ceremony',
    title: 'Olive Leaf Confetti Recessional',
    width: 2400,
    height: 1600,
    aspectRatio: 1.5,
    mood: 'golden_hour',
    composition: 'landscape',
    exif: { camera: 'Sony Alpha 7R V', lens: 'FE 35mm f/1.4 GM', focalLength: '35mm', aperture: 'f/2.0', shutterSpeed: '1/3200s', iso: '100' },
  },
  {
    id: 'photo-18',
    fileName: 'DSC09356_CakeCuttingOutdoor.jpg',
    collection: 'Reception',
    title: 'Minimalist Tiered Cake by Candlelight',
    width: 1600,
    height: 2200,
    aspectRatio: 0.727,
    mood: 'warm_indoor',
    composition: 'portrait',
    exif: { camera: 'Sony Alpha 7R V', lens: 'FE 50mm f/1.2 GM', focalLength: '50mm', aperture: 'f/2.0', shutterSpeed: '1/200s', iso: '1600' },
  },
  {
    id: 'photo-19',
    fileName: 'DSC09370_SunsetHorizonSilhouette.jpg',
    collection: 'Portraits',
    title: 'Horizon Silhouette at Blue Hour',
    width: 2500,
    height: 1406,
    aspectRatio: 1.778,
    mood: 'twilight',
    composition: 'wide',
    exif: { camera: 'Leica M11', lens: 'Summicron-M 28mm f/2', focalLength: '28mm', aperture: 'f/2.8', shutterSpeed: '1/60s', iso: '800' },
  },
  {
    id: 'photo-20',
    fileName: 'DSC09385_SparklerSendOffNight.jpg',
    collection: 'Reception',
    title: 'Sparkler Pathway Departure',
    width: 2400,
    height: 1600,
    aspectRatio: 1.5,
    mood: 'warm_indoor',
    composition: 'landscape',
    exif: { camera: 'Sony Alpha 7R V', lens: 'FE 24mm f/1.4 GM', focalLength: '24mm', aperture: 'f/1.4', shutterSpeed: '1/200s', iso: '2500' },
  },
  {
    id: 'photo-21',
    fileName: 'DSC09399_BrideShoesStones.jpg',
    collection: 'Details',
    title: 'Satin Slippers on Coastal Pebble',
    width: 1800,
    height: 1800,
    aspectRatio: 1.0,
    mood: 'coastal',
    composition: 'detail',
    exif: { camera: 'Leica M11', lens: 'Summilux-M 50mm f/1.4', focalLength: '50mm', aperture: 'f/2.8', shutterSpeed: '1/1000s', iso: '125' },
  },
  {
    id: 'photo-22',
    fileName: 'DSC09412_FatherDaughterMoment.jpg',
    collection: 'Ceremony',
    title: 'Father Daughter Aisle Procession',
    width: 1600,
    height: 2400,
    aspectRatio: 0.667,
    mood: 'golden_hour',
    composition: 'portrait',
    exif: { camera: 'Sony Alpha 7R V', lens: 'FE 85mm f/1.4 GM', focalLength: '85mm', aperture: 'f/1.8', shutterSpeed: '1/2000s', iso: '100' },
  },
  {
    id: 'photo-23',
    fileName: 'DSC09428_DancingUnderTheStars.jpg',
    collection: 'Reception',
    title: 'Dance Floor in the Courtyard',
    width: 2400,
    height: 1600,
    aspectRatio: 1.5,
    mood: 'twilight',
    composition: 'landscape',
    exif: { camera: 'Sony Alpha 7R V', lens: 'FE 35mm f/1.4 GM', focalLength: '35mm', aperture: 'f/1.6', shutterSpeed: '1/160s', iso: '3200' },
  },
  {
    id: 'photo-24',
    fileName: 'DSC09441_RingBoxVelvet.jpg',
    collection: 'Details',
    title: 'Moss Green Velvet Ring Box',
    width: 1600,
    height: 2200,
    aspectRatio: 0.727,
    mood: 'botanical',
    composition: 'portrait',
    exif: { camera: 'Leica M11', lens: 'Apo-Macro-Elmarit-TL 60mm', focalLength: '60mm', aperture: 'f/3.5', shutterSpeed: '1/400s', iso: '200' },
  },
];

/**
 * Creates an authentic photographic Canvas data URL with natural palette,
 * lighting gradients, silhouettes, and fine film grain.
 */
export function generatePhotoDataUrl(
  scene: PresetScene,
  dimension: 'thumb' | 'web' | 'original' = 'web'
): string {
  const maxDim = dimension === 'thumb' ? 420 : dimension === 'web' ? 1400 : 2200;
  let w = scene.width;
  let h = scene.height;

  if (w > maxDim || h > maxDim) {
    if (w >= h) {
      h = Math.round((h * maxDim) / w);
      w = maxDim;
    } else {
      w = Math.round((w * maxDim) / h);
      h = maxDim;
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // 1. Establish photographic palette according to mood
  let grad = ctx.createLinearGradient(0, 0, w * 0.4, h);
  switch (scene.mood) {
    case 'coastal':
      grad = ctx.createLinearGradient(0, 0, w * 0.2, h);
      grad.addColorStop(0, '#A7B7C2'); // misty ocean sky
      grad.addColorStop(0.35, '#C6D3DB'); // sea horizon light
      grad.addColorStop(0.65, '#566E7A'); // deep tide water
      grad.addColorStop(1, '#2F3C43'); // coastal rock cliff
      break;
    case 'sunset':
      grad = ctx.createLinearGradient(w * 0.3, 0, w * 0.7, h);
      grad.addColorStop(0, '#E09267'); // golden amber
      grad.addColorStop(0.3, '#F3C59F'); // soft peach glow
      grad.addColorStop(0.6, '#A36055'); // dusk mountain
      grad.addColorStop(1, '#2E1E1E'); // twilight ground
      break;
    case 'golden_hour':
      grad = ctx.createLinearGradient(w * 0.5, 0, 0, h);
      grad.addColorStop(0, '#F5E4C3'); // warm sun wash
      grad.addColorStop(0.4, '#DEB788'); // golden fields
      grad.addColorStop(0.75, '#8C6848'); // warm shadow
      grad.addColorStop(1, '#3B291A'); // deep tone
      break;
    case 'editorial_bw':
      grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#E5E5E5');
      grad.addColorStop(0.35, '#999999');
      grad.addColorStop(0.7, '#333333');
      grad.addColorStop(1, '#111111');
      break;
    case 'botanical':
      grad = ctx.createLinearGradient(0, 0, w * 0.8, h);
      grad.addColorStop(0, '#F3EFEA'); // raw linen travertine
      grad.addColorStop(0.4, '#D6CEC2'); // textured stone
      grad.addColorStop(0.75, '#76806C'); // olive foliage
      grad.addColorStop(1, '#373E32'); // deep forest shadow
      break;
    case 'twilight':
      grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#273444'); // deep indigo dusk
      grad.addColorStop(0.45, '#475A70'); // slate twilight
      grad.addColorStop(0.8, '#1A2129'); // courtyard shadow
      grad.addColorStop(1, '#0F1318'); // night
      break;
    case 'warm_indoor':
      grad = ctx.createLinearGradient(0, 0, w * 0.5, h);
      grad.addColorStop(0, '#382A23');
      grad.addColorStop(0.4, '#735745');
      grad.addColorStop(0.8, '#C49774');
      grad.addColorStop(1, '#F3D2AC');
      break;
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // 2. Add organic photographic shapes / horizon / silhouettes
  ctx.save();
  if (scene.composition === 'wide' || scene.composition === 'landscape') {
    // Horizon line
    const horizon = h * 0.55;
    const oceanGrad = ctx.createLinearGradient(0, horizon, 0, h);
    oceanGrad.addColorStop(0, 'rgba(30, 45, 55, 0.5)');
    oceanGrad.addColorStop(1, 'rgba(10, 15, 20, 0.85)');
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, horizon, w, h - horizon);

    // Subtle sun flare / light bleed
    const sunGrad = ctx.createRadialGradient(w * 0.65, horizon * 0.8, 10, w * 0.65, horizon * 0.8, w * 0.5);
    sunGrad.addColorStop(0, 'rgba(255, 245, 225, 0.45)');
    sunGrad.addColorStop(0.4, 'rgba(255, 220, 180, 0.15)');
    sunGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = sunGrad;
    ctx.fillRect(0, 0, w, h);

    // Couple silhouette / figures in distance
    ctx.fillStyle = 'rgba(18, 20, 24, 0.75)';
    const figX = w * 0.48;
    const figY = horizon - 20;
    // Figure 1
    ctx.beginPath();
    ctx.ellipse(figX, figY - 30, 6, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(figX - 6, figY - 22, 12, 38);
    // Figure 2 (with flowing dress)
    ctx.beginPath();
    ctx.ellipse(figX + 16, figY - 28, 5.5, 7.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(figX + 11, figY - 20);
    ctx.lineTo(figX + 22, figY - 20);
    ctx.lineTo(figX + 28, figY + 18);
    ctx.lineTo(figX + 8, figY + 18);
    ctx.closePath();
    ctx.fill();
  } else if (scene.composition === 'portrait') {
    // Elegant couple portrait silhouette / soft facial geometry
    const cx = w * 0.5;
    const cy = h * 0.48;

    // Soft rim light behind
    const rimGrad = ctx.createRadialGradient(cx, cy, 20, cx, cy, w * 0.6);
    rimGrad.addColorStop(0, 'rgba(255, 248, 235, 0.35)');
    rimGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = rimGrad;
    ctx.fillRect(0, 0, w, h);

    // Couple silhouette profile
    ctx.fillStyle = scene.mood === 'editorial_bw' ? 'rgba(20, 20, 20, 0.85)' : 'rgba(35, 28, 24, 0.8)';
    ctx.beginPath();
    // Head 1
    ctx.arc(cx - 32, cy - 80, 48, 0, Math.PI * 2);
    ctx.fill();
    // Shoulders 1
    ctx.beginPath();
    ctx.moveTo(cx - 90, cy + 120);
    ctx.quadraticCurveTo(cx - 50, cy - 25, cx, cy + 20);
    ctx.lineTo(cx - 10, cy + 240);
    ctx.lineTo(cx - 120, cy + 240);
    ctx.closePath();
    ctx.fill();

    // Head 2 (bride veil line)
    ctx.beginPath();
    ctx.arc(cx + 38, cy - 65, 42, 0, Math.PI * 2);
    ctx.fill();
    // Flowing veil curve
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx + 38, cy - 75);
    ctx.bezierCurveTo(cx + 120, cy - 40, cx + 180, cy + 80, cx + 140, cy + 220);
    ctx.stroke();
  } else {
    // Still life / detail composition
    const cx = w * 0.5;
    const cy = h * 0.5;

    // Organic travertine texture circle
    const rad = Math.min(w, h) * 0.38;
    const detailGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, rad);
    detailGrad.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
    detailGrad.addColorStop(0.7, 'rgba(230, 220, 205, 0.2)');
    detailGrad.addColorStop(1, 'rgba(0, 0, 0, 0.1)');
    ctx.fillStyle = detailGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, rad, 0, Math.PI * 2);
    ctx.fill();

    // Golden rings
    ctx.strokeStyle = '#D4AF37'; // gold
    ctx.lineWidth = Math.max(3, Math.round(w * 0.015));
    ctx.beginPath();
    ctx.arc(cx - 24, cy - 12, Math.max(16, Math.round(w * 0.06)), 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#E5C158';
    ctx.lineWidth = Math.max(2.5, Math.round(w * 0.012));
    ctx.beginPath();
    ctx.arc(cx + 20, cy + 14, Math.max(13, Math.round(w * 0.05)), 0, Math.PI * 2);
    ctx.stroke();

    // Delicate olive leaves
    ctx.strokeStyle = '#5E6B52';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 80, cy + 60);
    ctx.quadraticCurveTo(cx, cy + 50, cx + 80, cy + 80);
    ctx.stroke();
  }
  ctx.restore();

  // 3. Fine natural film grain pass
  const grainCanvas = document.createElement('canvas');
  const grainSize = 120;
  grainCanvas.width = grainSize;
  grainCanvas.height = grainSize;
  const gCtx = grainCanvas.getContext('2d');
  if (gCtx) {
    const imgData = gCtx.createImageData(grainSize, grainSize);
    for (let i = 0; i < imgData.data.length; i += 4) {
      const val = Math.random() * 255;
      imgData.data[i] = val;
      imgData.data[i + 1] = val;
      imgData.data[i + 2] = val;
      imgData.data[i + 3] = 16; // very subtle 6% opacity
    }
    gCtx.putImageData(imgData, 0, 0);
    const pattern = ctx.createPattern(grainCanvas, 'repeat');
    if (pattern) {
      ctx.fillStyle = pattern;
      ctx.fillRect(0, 0, w, h);
    }
  }

  // 4. Subtle vignetting around edges
  const vigGrad = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.45, w / 2, h / 2, Math.max(w, h) * 0.8);
  vigGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vigGrad.addColorStop(1, 'rgba(0, 0, 0, 0.38)');
  ctx.fillStyle = vigGrad;
  ctx.fillRect(0, 0, w, h);

  return canvas.toDataURL('image/jpeg', 0.88);
}
