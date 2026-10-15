const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);
const video = $('#camera');
const canvas = $('#visionCanvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const humanCanvas = $('#humanCanvas');
const humanCtx = humanCanvas.getContext('2d', { willReadFrequently: true });
const animalCanvas = $('#animalCanvas');
const animalCtx = animalCanvas.getContext('2d', { willReadFrequently: true });
const sourceCanvas = document.createElement('canvas');
const sourceCtx = sourceCanvas.getContext('2d', { willReadFrequently: true });
const processedCanvas = document.createElement('canvas');
const processedCtx = processedCanvas.getContext('2d', { willReadFrequently: true });
const birdOpticsCanvas = document.createElement('canvas');
const birdGl = birdOpticsCanvas.getContext('webgl', { alpha: false, antialias: false, preserveDrawingBuffer: false });
const birdProgram = birdGl ? createBirdProgram(birdGl) : null;
const beeAnalysisCanvas = document.createElement('canvas');
beeAnalysisCanvas.width = 128;
beeAnalysisCanvas.height = 72;
const beeAnalysisCtx = beeAnalysisCanvas.getContext('2d', { willReadFrequently: true });
const flyFacetCanvas = document.createElement('canvas');
const flyFacetCtx = flyFacetCanvas.getContext('2d', { willReadFrequently: true });
const modes = {
  bird: {
    name: 'BIRD', title: 'Distant details snap into focus.',
    desc: 'A broad, high-acuity view blends rapid focus shifts with ultraviolet and magnetic-direction cues.',
    tags: ['WIDE BINOCULAR FIELD', 'UV + FIELD CUES', 'RAPID ACCOMMODATION'], note: 'BIRD VISION'
  },
  bee: {
    name: 'BEE', title: 'A mosaic full of signals.',
    desc: 'Thousands of facets receive color cues including ultraviolet, alongside reduced sensitivity to red.',
    tags: ['COMPOUND-EYE MOSAIC', 'UV SENSITIVITY', 'RED SENSITIVITY REDUCED'], note: 'BEE VISION'
  },
  snake: {
    name: 'SNAKE', title: 'Sight and warmth, together.',
    desc: 'Blue-green sight and heat cues combine around nearby detail, reflecting sensory systems found in some snakes.',
    tags: ['NEAR-FOCUS VIEW', 'HEAT SENSING', 'REDUCED DEPTH'], note: 'SNAKE VISION'
  },
  dog: {
    name: 'DOG', title: 'Movement stands out from the blur.',
    desc: 'Blue and yellow remain distinct while red-green differences collapse. Low-light contrast and moving edges are emphasized across a broad field.',
    tags: ['BLUE / YELLOW', 'LOW-LIGHT SENSITIVITY', 'MOTION TRACKING'], note: 'DOG VISION'
  },
  fly: {
    name: 'FLY', title: 'A mosaic of light and motion.',
    desc: 'Each compound eye has about 800 ommatidia with eight photoreceptors each. R1-R6 share Rh1; R7/R8 pair as Rh3/Rh5 or Rh4/Rh6.',
    tags: ['~800 OMMATIDIA / EYE', '8 PHOTORECEPTORS / OMMATIDIUM', 'UV SENSITIVITY'], note: 'DROSOPHILA VISION'
  }
};
const observerText = {
  bird: 'Far detail, broad field and ultraviolet-inspired orientation cues.',
  snake: 'Near focus, limited depth and heat cues.',
  dog: 'Blue-yellow color emphasis and motion cues.',
  fly: 'A compact facet mosaic and motion cues.'
};
const animalFacts = {
  bird: [
    { title: '자외선 단서', body: '일부 새는 자외선을 감지하며, 깃털과 먹이 탐색 등에서 자외선 단서를 활용합니다.' },
    { title: '먼 거리의 세부', body: '맹금류는 높은 시력으로 먼 거리의 작은 움직임과 형태를 잘 구분합니다.' },
    { title: '방향 감각', body: '철새는 태양, 별, 지형지물과 지구 자기장 등 여러 단서를 조합해 이동 방향을 찾습니다.' }
  ],
  bee: [
    { title: '겹눈과 낱눈', body: '꿀벌의 한쪽 겹눈은 수천 개의 낱눈으로 이루어져 있습니다.' },
    { title: '자외선과 꽃 무늬', body: '꿀벌은 자외선 단서를 감지해 사람이 볼 수 없는 꽃의 무늬를 구분합니다.' },
    { title: '색과 편광', body: '꿀벌은 자외선, 파란색, 초록색을 구분하고 편광과 빠른 깜박임도 감지합니다.' }
  ],
  snake: [
    { title: '눈을 보호하는 비늘', body: '뱀의 눈은 투명한 안경비늘이 덮어 보호하며, 이 비늘은 탈피할 때 함께 벗겨집니다.' },
    { title: '열 감지 기관', body: '일부 뱀은 열 감지 기관으로 적외선 복사에 따른 열 정보를 감지합니다.' },
    { title: '색과 자외선', body: '뱀의 색 감도는 종마다 다르며, 일부 종은 자외선 영역의 빛도 감지합니다.' }
  ],
  dog: [
    { title: '색을 구분하는 방식', body: '개는 두 종류의 원추세포를 중심으로 색을 구분해 파란색과 노란색 계열을 잘 알아봅니다.' },
    { title: '움직임에 민감한 시야', body: '개는 움직이는 대상의 변화를 민감하게 감지합니다.' },
    { title: '어두운 곳의 시각', body: '간상세포가 풍부하고 망막 뒤 반사층이 있어 어두운 환경에서도 시각 정보를 얻는 데 유리합니다.' }
  ],
  fly: [
    { title: '겹눈의 구조', body: '초파리 한쪽 겹눈에는 약 800개의 낱눈이 있습니다.' },
    { title: '광수용세포와 로돕신', body: '낱눈 하나에는 8개의 광수용세포가 있습니다. R1-R6는 주로 Rh1을 발현하고, R7/R8은 낱눈 유형에 따라 Rh3/Rh5 또는 Rh4/Rh6 조합을 이룹니다.' },
    { title: '움직임과 파장', body: '초파리는 빠른 움직임에 민감하며, 자외선과 파란색, 초록색 파장에 반응하는 로돕신을 지닙니다.' }
  ]
};
const speciesNames = { bird: 'BIRD', bee: 'BEE', snake: 'SNAKE', dog: 'DOG', fly: 'FLY', human: 'HUMAN' };
const visionNotes = {
  bird: 'Some species detect ultraviolet cues and resolve distant detail with high acuity. Rapid focus shifts and a wider field are represented only as visual effects.',
  bee: 'Thousands of ommatidia form compound eyes, alongside three simple ocelli. Bees have reduced red sensitivity and can detect UV, polarized light and rapid flicker, none of which a webcam measures.',
  snake: 'Many snakes rely on nearby detail and motion, shifting the lens to focus. Some species combine infrared heat signals from pit organs with visual information.',
  dog: 'Dogs distinguish blue and yellow more readily and are sensitive to motion over fine, stationary detail. Field of view and acuity vary by breed and eye structure.',
  fly: 'A Drosophila compound eye has about 800 ommatidia. Each ommatidium has eight photoreceptors: R1–R6 usually express Rh1, while R7/R8 pairings use Rh3/Rh5 or Rh4/Rh6. Their approximate peak sensitivities span UV (Rh3 ~345 nm; Rh4 ~375 nm), blue (Rh5 ~437 nm) and green (Rh1 ~478 nm; Rh6 ~508 nm). Rh2 is associated with the ocelli, and Rh7 also has extra-retinal roles. Flies are not simply “red-blind”: long-wavelength sensitivity is comparatively weak, not necessarily absent.'
};
let stream = null;
let current = 'human';
let source = 'sample';
let raf = 0;
let sampleCanvas;
let previousFrame = null;
let previousWidth = 0;
let previousHeight = 0;
let dogMotionTrail = null;
let beeMotionTrail = null;
let flyMotionTrail = null;
let flyFrameReady = false;
const compareFlyMotion = { previousFrame: null, width: 0, height: 0, motionTrail: null, frameReady: false };
let beeAmbientBrightness = 0;
let beeSunPosition = 0.5;
const snakeHeatPalette = new Uint8ClampedArray(256 * 3);
const snakeHeatStops = [
  [0, 7, 0, 24], [0.18, 25, 20, 143], [0.36, 8, 74, 255],
  [0.54, 0, 211, 255], [0.68, 0, 232, 92], [0.79, 239, 255, 0],
  [0.91, 255, 70, 0], [1, 255, 246, 224]
];
for (let value = 0; value < 256; value += 1) {
  const intensity = value / 255;
  let stopIndex = 0;
  while (stopIndex < snakeHeatStops.length - 2 && intensity > snakeHeatStops[stopIndex + 1][0]) stopIndex += 1;
  const start = snakeHeatStops[stopIndex];
  const end = snakeHeatStops[stopIndex + 1];
  const blend = (intensity - start[0]) / (end[0] - start[0]);
  for (let channel = 0; channel < 3; channel += 1) {
    snakeHeatPalette[value * 3 + channel] = start[channel + 1] + (end[channel + 1] - start[channel + 1]) * blend;
  }
}

function createBirdProgram(gl) {
  const vertexSource = 'attribute vec2 position; varying vec2 uv; void main() { uv = position * 0.5 + 0.5; gl_Position = vec4(position, 0.0, 1.0); }';
  const fragmentSource = `
    precision highp float;
    varying vec2 uv;
    uniform sampler2D sourceImage;
    uniform vec2 imageSize;
    uniform float time;
    void main() {
      vec2 centered = uv * 2.0 - 1.0;
      float radiusSquared = dot(centered, centered);
      float accommodation = 0.3 + sin(time * 3.2) * 0.02;
      vec2 sampleUv = clamp(0.5 + centered * (1.0 - radiusSquared * accommodation) * 0.5, 0.0, 1.0);
      vec2 stepUv = 1.0 / imageSize;
      vec3 center = texture2D(sourceImage, sampleUv).rgb;
      vec3 neighbors = texture2D(sourceImage, sampleUv + vec2(stepUv.x, 0.0)).rgb;
      neighbors += texture2D(sourceImage, sampleUv - vec2(stepUv.x, 0.0)).rgb;
      neighbors += texture2D(sourceImage, sampleUv + vec2(0.0, stepUv.y)).rgb;
      neighbors += texture2D(sourceImage, sampleUv - vec2(0.0, stepUv.y)).rgb;
      vec3 sharp = clamp(center + (center - neighbors * 0.25) * (0.82 + sin(time * 4.0) * 0.1), 0.0, 1.0);
      float uvSignal = clamp(sharp.b * 0.66 + sharp.g * 0.34 - sharp.r * 0.24, 0.0, 1.0);
      float flowerCue = clamp((sharp.b - sharp.r * 0.22 - sharp.g * 0.34) * 3.9, 0.0, 1.0);
      vec3 vision = vec3(
        sharp.r * 0.72 + uvSignal * 0.095 + flowerCue * 0.17,
        sharp.g * 0.82 + uvSignal * 0.11 + flowerCue * 0.055,
        sharp.b * 0.9 + uvSignal * 0.24 + flowerCue * 0.31
      );
      vec2 fieldDirection = normalize(vec2(0.86, 0.5));
      float fieldCue = (dot(centered, fieldDirection) + 1.0) * 0.5;
      vision += vec3(0.0, 0.018, 0.028) * fieldCue;
      gl_FragColor = vec4(clamp(vision, 0.0, 1.0), 1.0);
    }
  `;
  const compile = (type, source) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return null;
    return shader;
  };
  const vertex = compile(gl.VERTEX_SHADER, vertexSource);
  const fragment = compile(gl.FRAGMENT_SHADER, fragmentSource);
  if (!vertex || !fragment) return null;
  const program = gl.createProgram();
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  gl.useProgram(program);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, 'position');
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.uniform1i(gl.getUniformLocation(program, 'sourceImage'), 0);
  return { program, texture };
}

function renderBirdOptics(source, width, height) {
  if (!birdGl || !birdProgram) return null;
  if (birdOpticsCanvas.width !== width || birdOpticsCanvas.height !== height) {
    birdOpticsCanvas.width = width;
    birdOpticsCanvas.height = height;
  }
  birdGl.viewport(0, 0, width, height);
  birdGl.useProgram(birdProgram.program);
  birdGl.activeTexture(birdGl.TEXTURE0);
  birdGl.bindTexture(birdGl.TEXTURE_2D, birdProgram.texture);
  birdGl.pixelStorei(birdGl.UNPACK_FLIP_Y_WEBGL, true);
  birdGl.texImage2D(birdGl.TEXTURE_2D, 0, birdGl.RGBA, birdGl.RGBA, birdGl.UNSIGNED_BYTE, source);
  birdGl.uniform2f(birdGl.getUniformLocation(birdProgram.program, 'imageSize'), source.width, source.height);
  birdGl.uniform1f(birdGl.getUniformLocation(birdProgram.program, 'time'), performance.now() / 1000);
  birdGl.drawArrays(birdGl.TRIANGLE_STRIP, 0, 4);
  return birdOpticsCanvas;
}

function makeSample() {
  const sample = document.createElement('canvas');
  sample.width = 1280;
  sample.height = 720;
  const paint = sample.getContext('2d');
  const sky = paint.createLinearGradient(0, 0, 0, 720);
  sky.addColorStop(0, '#28465a');
  sky.addColorStop(0.51, '#d5bd84');
  sky.addColorStop(0.515, '#51643d');
  sky.addColorStop(1, '#17271c');
  paint.fillStyle = sky;
  paint.fillRect(0, 0, 1280, 720);
  paint.fillStyle = '#fff0b5';
  paint.beginPath();
  paint.arc(970, 140, 68, 0, Math.PI * 2);
  paint.fill();
  for (let index = 0; index < 17; index += 1) {
    paint.fillStyle = index % 2 ? '#304a34' : '#394f38';
    paint.beginPath();
    paint.arc(index * 95, 390 + (index % 3) * 15, 83, 0, Math.PI * 2);
    paint.fill();
  }
  paint.fillStyle = '#273b27';
  paint.fillRect(0, 505, 1280, 215);
  for (let index = 0; index < 55; index += 1) {
    const x = (index * 97) % 1280;
    const y = 515 + (index * 37) % 200;
    paint.strokeStyle = '#739550';
    paint.lineWidth = 3;
    paint.beginPath();
    paint.moveTo(x, 720);
    paint.quadraticCurveTo(x + 8, y + 30, x + 11, y);
    paint.stroke();
    if (index % 4 === 0) {
      paint.fillStyle = ['#f7d95a', '#e55c70', '#e879d8'][index % 3];
      for (let petal = 0; petal < 5; petal += 1) {
        paint.beginPath();
        paint.ellipse(x + 11 + Math.cos(petal * 1.256) * 11, y + Math.sin(petal * 1.256) * 11, 9, 6, petal, 0, Math.PI * 2);
        paint.fill();
      }
    }
  }
  return sample;
}
sampleCanvas = makeSample();

function setText(selector, text) {
  const element = $(selector);
  if (element) element.textContent = text;
}

function setButtonLabel(selector, text) {
  const button = $(selector);
  const icon = button.querySelector('b');
  button.replaceChildren(document.createTextNode(text));
  if (icon) {
    button.append(document.createTextNode(' '));
    button.append(icon);
  }
}

function localizeInterface() {
  document.documentElement.lang = 'en';
  $('.sense-list').replaceChildren(...Object.entries(visionNotes).map(([species, description]) => {
    const row = document.createElement('span');
    const detail = document.createElement('b');
    row.append(document.createTextNode(speciesNames[species]));
    detail.textContent = description;
    row.append(detail);
    return row;
  }));
  const finalNames = { human: 'HUMAN', dog: 'DOG', bee: 'BEE', snake: 'SNAKE', bird: 'BIRD', fly: 'FLY' };
  $$('.world').forEach((world) => {
    const key = world.className.split(' ')[1].replace('-w', '');
    world.textContent = finalNames[key];
  });
}
localizeInterface();

const cameraMessage = document.createElement('p');
cameraMessage.className = 'camera-message';
cameraMessage.setAttribute('role', 'status');
cameraMessage.setAttribute('aria-live', 'polite');
document.body.append(cameraMessage);

function showCameraError(error) {
  const messages = {
    NotAllowedError: 'Camera access was blocked. Allow camera access for this site in your browser or macOS Privacy settings, then try again.',
    NotFoundError: 'No camera was found. Connect a camera or choose the sample scene.',
    NotReadableError: 'The camera is unavailable or in use by another app. Close that app and try again.',
    OverconstrainedError: 'The camera does not support the requested settings. Try another camera.',
    SecurityError: 'Camera access requires localhost or HTTPS. Open this page on localhost or a secure connection.',
    TimeoutError: 'The camera started but did not provide a video frame. Check the device and try again.'
  };
  cameraMessage.textContent = messages[error.name] || 'The camera could not start. Check browser and system camera permissions, then try again.';
  cameraMessage.classList.add('visible');
}

function waitForCameraFrame() {
  if (video.readyState >= 2 && video.videoWidth > 0) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const finish = (callback, value) => {
      clearTimeout(timer);
      video.removeEventListener('loadeddata', onReady);
      video.removeEventListener('error', onError);
      callback(value);
    };
    const onReady = () => finish(resolve);
    const onError = () => finish(reject, new DOMException('Camera video failed to load', 'NotReadableError'));
    const timer = setTimeout(() => finish(reject, new DOMException('Camera preview timed out', 'TimeoutError')), 5000);
    video.addEventListener('loadeddata', onReady, { once: true });
    video.addEventListener('error', onError, { once: true });
  });
}

function resizeCanvases() {
  const width = innerWidth;
  const height = innerHeight;
  [canvas, humanCanvas, animalCanvas, sourceCanvas].forEach((item) => {
    item.width = width;
    item.height = height;
  });
  const processingScale = Math.min(1, 800 / width);
  processedCanvas.width = Math.round(width * processingScale);
  processedCanvas.height = Math.round(height * processingScale);
  previousFrame = null;
}
resizeCanvases();
addEventListener('resize', resizeCanvases);

function drawSource(target, width, height) {
  if (source === 'camera' && video.readyState >= 2) {
    const aspect = video.videoWidth / video.videoHeight;
    const targetAspect = width / height;
    let sourceWidth;
    let sourceHeight;
    let sourceX;
    let sourceY;
    if (aspect > targetAspect) {
      sourceHeight = video.videoHeight;
      sourceWidth = sourceHeight * targetAspect;
      sourceX = (video.videoWidth - sourceWidth) / 2;
      sourceY = 0;
    } else {
      sourceWidth = video.videoWidth;
      sourceHeight = sourceWidth / targetAspect;
      sourceX = 0;
      sourceY = (video.videoHeight - sourceHeight) / 2;
    }
    target.save();
    target.scale(-1, 1);
    target.drawImage(video, sourceX, sourceY, sourceWidth, sourceHeight, -width, 0, width, height);
    target.restore();
  } else {
    target.drawImage(sampleCanvas, 0, 0, width, height);
  }
}

function applyColorVision(image, mode, trackMotion = true, flyMotionState = null) {
  const pixels = image.data;
  const width = image.width;
  const height = image.height;
  const frameSize = width * height;
  if (trackMotion && mode === 'fly' && flyMotionState &&
    (flyMotionState.width !== width || flyMotionState.height !== height || !flyMotionState.previousFrame)) {
    flyMotionState.previousFrame = new Uint8Array(frameSize);
    flyMotionState.motionTrail = new Float32Array(frameSize);
    flyMotionState.width = width;
    flyMotionState.height = height;
    flyMotionState.frameReady = false;
  } else if (trackMotion && ['dog', 'fly', 'bee'].includes(mode) &&
    (previousWidth !== width || previousHeight !== height || !previousFrame)) {
    previousFrame = new Uint8Array(frameSize);
    previousWidth = width;
    previousHeight = height;
    if (mode === 'dog') dogMotionTrail = new Float32Array(frameSize);
    if (mode === 'bee') beeMotionTrail = new Float32Array(frameSize);
    if (mode === 'fly') {
      flyMotionTrail = new Float32Array(frameSize);
      flyFrameReady = false;
    }
  }
  let beeBrightnessTotal = 0;
  let beeHorizontalLight = 0;
  let beeLightWeightTotal = 0;
  for (let index = 0; index < pixels.length; index += 4) {
    const red = pixels[index];
    const green = pixels[index + 1];
    const blue = pixels[index + 2];
    const luminance = (red * 0.299 + green * 0.587 + blue * 0.114) / 255;
    if (mode === 'dog') {
      const pixel = index / 4;
      const yellowCone = red * 0.42 + green * 0.58;
      const blueCone = blue * 0.82;
      const nightAdaptation = Math.sqrt(luminance) * 255;
      pixels[index] = Math.min(255, yellowCone * 0.68 + nightAdaptation * 0.12);
      pixels[index + 1] = Math.min(255, yellowCone * 0.7 + nightAdaptation * 0.16);
      pixels[index + 2] = Math.min(255, blueCone * 0.78 + nightAdaptation * 0.16 + yellowCone * 0.06);
      const motion = previousFrame[pixel] ? Math.abs(luminance * 255 - previousFrame[pixel]) : 0;
      previousFrame[pixel] = luminance * 255;
      dogMotionTrail[pixel] = Math.max(motion > 14 ? Math.min(1, motion / 72) : 0, dogMotionTrail[pixel] * 0.78);
      if (dogMotionTrail[pixel] > 0.12) {
        const glow = Math.min(0.82, dogMotionTrail[pixel] * 0.78);
        pixels[index] = pixels[index] * (1 - glow) + 250 * glow;
        pixels[index + 1] = pixels[index + 1] * (1 - glow) + 221 * glow;
        pixels[index + 2] = pixels[index + 2] * (1 - glow) + 116 * glow;
      }
    } else if (mode === 'fly') {
      const pixel = index / 4;
      if (trackMotion) {
        const frame = flyMotionState ? flyMotionState.previousFrame : previousFrame;
        const motionTrail = flyMotionState ? flyMotionState.motionTrail : flyMotionTrail;
        const frameReady = flyMotionState ? flyMotionState.frameReady : flyFrameReady;
        const motion = frameReady ? Math.abs(luminance * 255 - frame[pixel]) : 0;
        frame[pixel] = luminance * 255;
        motionTrail[pixel] = Math.max(
          motion > 20 ? Math.min(1, motion / 82) : 0,
          motionTrail[pixel] * 0.72
        );
      }
      const uvIllustration = Math.max(0, Math.min(1, (blue - red * 0.55 - green * 0.2) / 220));
      const uvBlend = uvIllustration * 0.35;
      const redSignal = Math.max(0, red - Math.max(green, blue) * 0.82);
      pixels[index] *= 1 - Math.min(0.28, redSignal / 200 * 0.28);
      pixels[index] = pixels[index] * (1 - uvBlend) + 148 * uvBlend;
      pixels[index + 1] = pixels[index + 1] * (1 - uvBlend) + 78 * uvBlend;
      pixels[index + 2] = pixels[index + 2] * (1 - uvBlend) + 224 * uvBlend;
      const motionTrail = flyMotionState ? flyMotionState.motionTrail : flyMotionTrail;
      if (trackMotion && motionTrail[pixel] > 0.18) {
        const cue = Math.min(0.62, motionTrail[pixel] * 0.58);
        pixels[index] = pixels[index] * (1 - cue) + 226 * cue;
        pixels[index + 1] = pixels[index + 1] * (1 - cue) + 232 * cue;
        pixels[index + 2] = pixels[index + 2] * (1 - cue) + 240 * cue;
      }
    } else if (mode === 'bee') {
      const pixel = index / 4;
      const redSignal = Math.max(0, red - Math.max(green, blue) * 1.08);
      const blueGreenSignal = Math.max(0, blue - red * 0.18) + Math.max(0, green - red * 0.12) * 0.45;
      const uv = Math.min(0.78, Math.max(0, (blue - green * 0.32 - red * 0.12) / 180) * 0.48 + Math.max(0, luminance - 0.68) * 0.82);
      const redBlind = redSignal > 24;
      const neutralRed = luminance * 48;
      pixels[index] = redBlind ? neutralRed : Math.min(255, blueGreenSignal * 0.28 + uv * 194);
      pixels[index + 1] = redBlind ? neutralRed : Math.min(255, green * 0.7 + blue * 0.2 + uv * 37);
      pixels[index + 2] = redBlind ? neutralRed : Math.min(255, blue * 0.78 + green * 0.32 + uv * 116);

      const motion = previousFrame[pixel] ? Math.abs(luminance * 255 - previousFrame[pixel]) : 0;
      previousFrame[pixel] = luminance * 255;
      beeMotionTrail[pixel] = Math.max(motion > 27 ? Math.min(1, motion / 90) : 0, beeMotionTrail[pixel] * 0.76);
      if (beeMotionTrail[pixel] > 0.18) {
        const glow = Math.min(0.88, beeMotionTrail[pixel] * 0.82);
        pixels[index] = pixels[index] * (1 - glow) + 244 * glow;
        pixels[index + 1] = pixels[index + 1] * (1 - glow) + 93 * glow;
        pixels[index + 2] = pixels[index + 2] * (1 - glow) + 255 * glow;
      }
      const lightWeight = luminance * luminance * luminance;
      beeBrightnessTotal += luminance;
      beeHorizontalLight += (pixel % width) / Math.max(1, width - 1) * lightWeight;
      beeLightWeightTotal += lightWeight;
    } else if (mode === 'snake') {
      const heatIndex = Math.max(0, Math.min(255, Math.round((luminance - 0.035) * 340)));
      const paletteIndex = heatIndex * 3;
      const coolVisible = Math.max(0, Math.min(255, blue * 0.46 + green * 0.22 - red * 0.12));
      const heatBlend = 0.84;
      pixels[index] = snakeHeatPalette[paletteIndex] * heatBlend + coolVisible * (1 - heatBlend);
      pixels[index + 1] = snakeHeatPalette[paletteIndex + 1] * heatBlend + green * 0.18 * (1 - heatBlend);
      pixels[index + 2] = snakeHeatPalette[paletteIndex + 2] * heatBlend + Math.min(255, blue * 0.56 + green * 0.14) * (1 - heatBlend);
    } else if (mode === 'bird') {
      const uv = Math.max(0, Math.min(1, (blue * 0.66 + green * 0.34 - red * 0.24) / 255));
      const flowerCue = Math.max(0, Math.min(1, (blue - red * 0.22 - green * 0.34) / 155));
      pixels[index] = Math.min(255, red * 0.72 + uv * 24 + flowerCue * 44);
      pixels[index + 1] = Math.min(255, green * 0.82 + uv * 28 + flowerCue * 14);
      pixels[index + 2] = Math.min(255, blue * 0.9 + uv * 62 + flowerCue * 78);
    }
  }
  if (mode === 'bee') {
    beeAmbientBrightness = beeBrightnessTotal / frameSize;
    const lightTotal = beeLightWeightTotal > 0 ? beeLightWeightTotal : 1;
    beeSunPosition = Math.max(0, Math.min(1, beeHorizontalLight / lightTotal));
    applyBeeFisheye(image);
  }
  if (mode === 'bird') {
    applyBirdDistortion(image);
    applyBirdAcuity(image);
  }
  if (mode === 'fly') {
    if (flyMotionState) flyMotionState.frameReady = true;
    else flyFrameReady = true;
  }
  return image;
}

function applyBeeFisheye(image) {
  const { width, height, data } = image;
  const source = new Uint8ClampedArray(data);
  const centerX = (width - 1) / 2;
  const centerY = (height - 1) / 2;
  const radius = Math.min(width, height) / 2;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const dx = (x - centerX) / radius;
      const dy = (y - centerY) / radius;
      const scale = 1 + 0.17 * (dx * dx + dy * dy);
      const sourceX = Math.max(0, Math.min(width - 1, Math.round(centerX + dx * radius * scale)));
      const sourceY = Math.max(0, Math.min(height - 1, Math.round(centerY + dy * radius * scale)));
      const outputIndex = (y * width + x) * 4;
      const sourceIndex = (sourceY * width + sourceX) * 4;
      data[outputIndex] = source[sourceIndex];
      data[outputIndex + 1] = source[sourceIndex + 1];
      data[outputIndex + 2] = source[sourceIndex + 2];
      data[outputIndex + 3] = source[sourceIndex + 3];
    }
  }
}

function applyBirdDistortion(image) {
  const { width, height, data } = image;
  const source = new Uint8ClampedArray(data);
  const centerX = (width - 1) / 2;
  const centerY = (height - 1) / 2;
  const radiusX = width / 2;
  const radiusY = height / 2;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const dx = (x - centerX) / radiusX;
      const dy = (y - centerY) / radiusY;
      const radiusSquared = dx * dx + dy * dy;
      const accommodation = 0.16 + Math.sin(performance.now() * 0.006) * 0.012;
      const scale = 1 - radiusSquared * accommodation;
      const sourceX = Math.max(0, Math.min(width - 1, centerX + dx * radiusX * scale));
      const sourceY = Math.max(0, Math.min(height - 1, centerY + dy * radiusY * scale));
      const left = Math.floor(sourceX);
      const top = Math.floor(sourceY);
      const right = Math.min(width - 1, left + 1);
      const bottom = Math.min(height - 1, top + 1);
      const horizontalBlend = sourceX - left;
      const verticalBlend = sourceY - top;
      const outputIndex = (y * width + x) * 4;
      const topLeft = (top * width + left) * 4;
      const topRight = (top * width + right) * 4;
      const bottomLeft = (bottom * width + left) * 4;
      const bottomRight = (bottom * width + right) * 4;
      for (let channel = 0; channel < 3; channel += 1) {
        const upper = source[topLeft + channel] * (1 - horizontalBlend) + source[topRight + channel] * horizontalBlend;
        const lower = source[bottomLeft + channel] * (1 - horizontalBlend) + source[bottomRight + channel] * horizontalBlend;
        data[outputIndex + channel] = upper * (1 - verticalBlend) + lower * verticalBlend;
      }
      data[outputIndex + 3] = source[outputIndex + 3];
    }
  }
}

function applyBirdAcuity(image) {
  const { width, height, data } = image;
  const source = new Uint8ClampedArray(data);
  const breathingFocus = 0.82 + Math.sin(performance.now() * 0.008) * 0.1;
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const index = (y * width + x) * 4;
      const neighbors = [index - 4, index + 4, index - width * 4, index + width * 4];
      for (let channel = 0; channel < 3; channel += 1) {
        const surrounding = (source[neighbors[0] + channel] + source[neighbors[1] + channel] + source[neighbors[2] + channel] + source[neighbors[3] + channel]) / 4;
        data[index + channel] = Math.max(0, Math.min(255, source[index + channel] + (source[index + channel] - surrounding) * breathingFocus));
      }
    }
  }
}

function eyePath(target, width, height, mode) {
  target.beginPath();
  if (mode === 'bird') {
    const accommodation = Math.sin(performance.now() * 0.006) * 0.012;
    target.moveTo(width * 0.005, height * 0.5);
    target.bezierCurveTo(width * 0.2, height * (-0.075 + accommodation), width * 0.8, height * (-0.075 + accommodation), width * 0.995, height * 0.5);
    target.bezierCurveTo(width * 0.8, height * (1.075 - accommodation), width * 0.2, height * (1.075 - accommodation), width * 0.005, height * 0.5);
  } else if (mode === 'snake') {
    target.moveTo(width * 0.035, height * 0.5);
    target.quadraticCurveTo(width * 0.5, height * 0.015, width * 0.965, height * 0.5);
    target.quadraticCurveTo(width * 0.5, height * 0.985, width * 0.035, height * 0.5);
  } else if (mode === 'fly') {
    target.ellipse(width / 2, height / 2, width * 0.495, height * 0.49, 0, 0, Math.PI * 2);
  } else if (mode === 'dog') {
    target.ellipse(width / 2, height / 2, width * 0.5, height * 0.44, 0, 0, Math.PI * 2);
  } else {
    target.ellipse(width / 2, height / 2, width * (mode === 'bee' ? 0.485 : 0.49), height * (mode === 'bee' ? 0.47 : 0.45), 0, 0, Math.PI * 2);
  }
}

function drawAnimalScene(target, width, height, mode, animate = true, flyMotionState = null) {
  let sceneCanvas = processedCanvas;
  if (mode === 'bird' && birdProgram) {
    sceneCanvas = renderBirdOptics(sourceCanvas, width, height);
  } else {
    processedCtx.drawImage(sourceCanvas, 0, 0, processedCanvas.width, processedCanvas.height);
    const image = processedCtx.getImageData(0, 0, processedCanvas.width, processedCanvas.height);
    processedCtx.putImageData(applyColorVision(image, mode, true, flyMotionState), 0, 0);
  }
  target.fillStyle = '#101111';
  target.fillRect(0, 0, width, height);
  target.save();
  eyePath(target, width, height, mode);
  target.clip();
  if (mode === 'bee') target.filter = 'blur(1.1px)';
  if (mode === 'snake') target.filter = 'blur(1.8px)';
  if (mode === 'bird') target.filter = 'blur(0.12px)';
  if (mode === 'dog') target.filter = 'blur(0.72px)';
  target.drawImage(sceneCanvas, 0, 0, width, height);
  target.filter = 'none';
  if (mode === 'snake') {
    target.save();
    target.beginPath();
    target.ellipse(width / 2, height * 0.52, width * 0.12, height * 0.18, 0, 0, Math.PI * 2);
    target.clip();
    target.drawImage(processedCanvas, 0, 0, width, height);
    target.restore();
  }
  const vignette = target.createRadialGradient(width / 2, height / 2, height * 0.16, width / 2, height / 2, height * 0.76);
  vignette.addColorStop(0, 'rgba(5, 9, 10, 0)');
  vignette.addColorStop(1, `rgba(5, 9, 10, ${mode === 'bird' ? 0.08 : mode === 'fly' ? 0.2 : 0.3})`);
  target.fillStyle = vignette;
  target.fillRect(0, 0, width, height);
  if (mode === 'bee') drawBeeEye(target, width, height, animate);
  if (mode === 'snake') drawSnakeEye(target, width, height, animate);
  if (mode === 'fly') drawFlyEye(target, width, height);
  if (mode === 'bird') drawBirdEye(target, width, height);
  target.restore();
  if (mode !== 'bird') {
    target.save();
    eyePath(target, width, height, mode);
    target.strokeStyle = mode === 'bee' ? 'rgba(210, 241, 97, .75)' : 'rgba(233, 239, 220, .48)';
    target.lineWidth = Math.max(1, width * 0.0012);
    target.stroke();
    target.restore();
  }
}

function drawBirdEye(target, width, height) {
  const orientation = performance.now() * 0.00018;
  const startX = width * (0.22 + Math.sin(orientation) * 0.04);
  const startY = height * 0.2;
  const endX = width * (0.78 + Math.cos(orientation) * 0.04);
  const endY = height * 0.82;
  const field = target.createLinearGradient(startX, startY, endX, endY);
  field.addColorStop(0, 'rgba(49, 233, 219, 0)');
  field.addColorStop(0.5, 'rgba(85, 248, 223, .055)');
  field.addColorStop(1, 'rgba(49, 233, 219, 0)');
  target.save();
  target.globalCompositeOperation = 'screen';
  target.fillStyle = field;
  target.fillRect(0, 0, width, height);
  target.restore();
}

function drawBeeEye(target, width, height, animate) {
  const spacing = Math.max(7, Math.sqrt(width * height / 7000 * 1.1547));
  target.save();
  target.globalAlpha = 0.2;
  target.fillStyle = '#d9f270';
  for (let y = height * 0.04, row = 0; y < height * 0.97; y += spacing * 0.866, row += 1) {
    for (let x = (row % 2) * spacing * 0.5; x < width; x += spacing) {
      target.fillRect(x, y, Math.max(1, spacing * 0.09), Math.max(1, spacing * 0.09));
    }
  }
  drawBeeUVGuides(target, width, height);
  const brightness = Math.min(1, Math.max(0, beeAmbientBrightness));
  const pulse = animate ? 0.24 + brightness * 0.64 + Math.sin(performance.now() * 0.004) * 0.06 : 0.3 + brightness * 0.55;
  target.globalAlpha = pulse;
  target.strokeStyle = 'rgba(229, 213, 255, .58)';
  target.lineWidth = 1;
  target.beginPath();
  target.moveTo(width * 0.46, height * 0.072);
  target.lineTo(width * 0.54, height * 0.072);
  target.stroke();
  target.fillStyle = '#e4d5ff';
  target.shadowColor = '#df63ff';
  target.shadowBlur = 8 + brightness * 18;
  for (let index = 0; index < 3; index += 1) {
    const x = width / 2 + (index - 1) * Math.max(9, width * 0.012);
    target.beginPath();
    target.arc(x, height * 0.072, Math.max(2.5, width * 0.0028), 0, Math.PI * 2);
    target.fill();
  }
  target.shadowBlur = 0;
  target.globalAlpha = 0.82;
  target.fillStyle = '#f6f1ff';
  target.beginPath();
  target.arc(width * (0.46 + beeSunPosition * 0.08), height * 0.072, Math.max(1.5, width * 0.0018), 0, Math.PI * 2);
  target.fill();
  target.restore();
}

function drawBeeUVGuides(target, width, height) {
  beeAnalysisCtx.drawImage(sourceCanvas, 0, 0, beeAnalysisCanvas.width, beeAnalysisCanvas.height);
  const pixels = beeAnalysisCtx.getImageData(0, 0, beeAnalysisCanvas.width, beeAnalysisCanvas.height).data;
  const scores = new Float32Array(beeAnalysisCanvas.width * beeAnalysisCanvas.height);
  for (let index = 0; index < scores.length; index += 1) {
    const offset = index * 4;
    const red = pixels[offset];
    const green = pixels[offset + 1];
    const blue = pixels[offset + 2];
    const brightness = (red * 0.299 + green * 0.587 + blue * 0.114) / 255;
    const saturation = (Math.max(red, green, blue) - Math.min(red, green, blue)) / 255;
    const violet = Math.max(0, (red + blue - green * 1.35) / 510);
    scores[index] = saturation * 0.72 + violet * 0.8 + Math.max(0, brightness - 0.68) * 0.9;
  }
  const guides = [];
  for (let y = 1; y < beeAnalysisCanvas.height - 1; y += 1) {
    for (let x = 1; x < beeAnalysisCanvas.width - 1; x += 1) {
      const index = y * beeAnalysisCanvas.width + x;
      const score = scores[index];
      const offset = index * 4;
      const red = pixels[offset];
      const green = pixels[offset + 1];
      const blue = pixels[offset + 2];
      const brightness = (red * 0.299 + green * 0.587 + blue * 0.114) / 255;
      const saturation = (Math.max(red, green, blue) - Math.min(red, green, blue)) / 255;
      const violet = Math.max(0, (red + blue - green * 1.35) / 510);
      if (score < 0.34 || (violet < 0.12 && saturation < 0.56 && brightness < 0.84)) continue;
      let maximum = true;
      for (let offsetY = -1; offsetY <= 1 && maximum; offsetY += 1) {
        for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
          if ((offsetX || offsetY) && scores[index + offsetY * beeAnalysisCanvas.width + offsetX] > score) {
            maximum = false;
            break;
          }
        }
      }
      if (maximum) guides.push({ x, y, score });
    }
  }
  guides.sort((first, second) => second.score - first.score);
  target.save();
  target.globalCompositeOperation = 'screen';
  target.strokeStyle = '#f06dff';
  target.fillStyle = '#ee91ff';
  target.shadowColor = '#df4dff';
  target.shadowBlur = 13;
  const selectedGuides = [];
  let drawn = 0;
  for (const guide of guides) {
    const x = guide.x / beeAnalysisCanvas.width * width;
    const y = guide.y / beeAnalysisCanvas.height * height;
    if (Math.hypot(x - width / 2, y - height * 0.07) < width * 0.08) continue;
    if (selectedGuides.some((prior) => Math.hypot(prior.x - guide.x, prior.y - guide.y) < 5)) continue;
    const radius = Math.max(5, Math.min(width, height) * 0.012);
    target.globalAlpha = Math.min(0.82, 0.42 + guide.score * 0.3);
    target.beginPath();
    target.arc(x, y, radius, 0, Math.PI * 2);
    target.stroke();
    target.beginPath();
    target.arc(x, y, radius * 0.36, 0, Math.PI * 2);
    target.fill();
    selectedGuides.push(guide);
    drawn += 1;
    if (drawn >= 10) break;
  }
  target.restore();
}

function drawSnakeEye(target, width, height, animate = true) {
  target.save();
  const focusY = height * (0.52 + (animate ? Math.sin(performance.now() * 0.0012) * 0.015 : 0));
  target.strokeStyle = 'rgba(171, 241, 255, .48)';
  target.lineWidth = Math.max(1, width * 0.0014);
  target.beginPath();
  target.ellipse(width / 2, height / 2, width * 0.46, height * 0.41, 0, 0, Math.PI * 2);
  target.stroke();
  target.strokeStyle = 'rgba(219, 250, 255, .7)';
  target.lineWidth = 1;
  target.beginPath();
  target.ellipse(width / 2, focusY, width * 0.12, height * 0.18, 0, 0, Math.PI * 2);
  target.stroke();
  target.globalAlpha = 0.45;
  target.strokeStyle = '#c6f4ff';
  target.beginPath();
  target.moveTo(width / 2, height * 0.42);
  target.lineTo(width / 2, height * 0.58);
  target.stroke();
  target.globalAlpha = 1;
  target.fillStyle = 'rgba(255, 91, 34, .9)';
  target.shadowColor = '#ff4d20';
  target.shadowBlur = 12;
  for (const x of [width * 0.465, width * 0.535]) {
    target.beginPath();
    target.arc(x, height * 0.83, Math.max(3, width * 0.003), 0, Math.PI * 2);
    target.fill();
  }
  target.restore();
}

function drawFlyEye(target, width, height) {
  const facetCount = 2000;
  const verticalAspect = 1;
  const eyeArea = Math.PI * width * 0.495 * height * 0.49;
  const spacingX = Math.sqrt(eyeArea / (facetCount * Math.sqrt(3) / 2 * verticalAspect));
  const radiusX = spacingX / Math.sqrt(3);
  const radiusY = radiusX * verticalAspect;
  const spacingY = radiusY * 1.5;
  const columnLimit = Math.ceil(width / spacingX) + 2;
  const rowLimit = Math.ceil(height / spacingY) + 2;
  const columns = columnLimit * 2 + 1;
  const rows = rowLimit * 2 + 1;
  flyFacetCanvas.width = columns;
  flyFacetCanvas.height = rows;
  flyFacetCtx.imageSmoothingEnabled = true;
  flyFacetCtx.drawImage(processedCanvas, 0, 0, columns, rows);
  const facets = flyFacetCtx.getImageData(0, 0, columns, rows).data;
  const receptorDotRadius = Math.min(radiusX, radiusY) * 0.105;
  const receptorOffsets = Array.from({ length: 8 }, (_, receptor) => {
    const angle = -Math.PI / 2 + (receptor / 8) * Math.PI * 2;
    return [Math.cos(angle) * 0.39, Math.sin(angle) * 0.39];
  });
  const receptorColors = [
    'rgba(199, 198, 158, .84)',
    'rgba(199, 198, 158, .84)',
    'rgba(199, 198, 158, .84)',
    'rgba(199, 198, 158, .84)',
    'rgba(199, 198, 158, .84)',
    'rgba(199, 198, 158, .84)',
    'rgba(159, 134, 157, .9)',
    'rgba(145, 158, 117, .9)'
  ];
  const drawFacetShape = (x, y, scaleX, scaleY) => {
    const pointCount = 6;
    target.beginPath();
    for (let point = 0; point <= pointCount; point += 1) {
      const angle = -Math.PI / 2 + (point / pointCount) * Math.PI * 2;
      const pointX = x + Math.cos(angle) * radiusX * scaleX;
      const pointY = y + Math.sin(angle) * radiusY * scaleY;
      if (point === 0) target.moveTo(pointX, pointY);
      else target.lineTo(pointX, pointY);
    }
    target.closePath();
  };
  target.save();
  target.lineWidth = Math.max(0.8, Math.min(radiusX, radiusY) * 0.055);
  target.strokeStyle = 'rgba(8, 10, 9, .98)';
  for (let row = -rowLimit; row <= rowLimit; row += 1) {
    const y = height / 2 + row * spacingY;
    const rowOffset = Math.abs(row % 2) * spacingX * 0.5;
    for (let column = -columnLimit; column <= columnLimit; column += 1) {
      const x = width / 2 + column * spacingX + rowOffset;
      const normalizedX = (x - width / 2) / (width * 0.495);
      const normalizedY = (y - height / 2) / (height * 0.49);
      const distanceFromCenter = Math.min(1, Math.hypot(normalizedX, normalizedY));
      const edgeLight = 1 - Math.pow(distanceFromCenter, 1.6) * 0.55;
      const sampleColumn = Math.min(columns - 1, Math.max(0, Math.round((x / width) * (columns - 1))));
      const sampleRow = Math.min(rows - 1, Math.max(0, Math.round((y / height) * (rows - 1))));
      const sampleIndex = (sampleRow * columns + sampleColumn) * 4;
      const red = Math.min(255, (facets[sampleIndex] * 1.04 + 6) * edgeLight);
      const green = Math.min(255, (facets[sampleIndex + 1] * 1.01 + 4) * edgeLight);
      const blue = Math.min(255, (facets[sampleIndex + 2] * 0.9 + 8) * edgeLight);
      drawFacetShape(x, y, 1, 1);
      target.fillStyle = 'rgba(8, 10, 9, .98)';
      target.fill();
      target.stroke();
      const edgeScale = 0.94 - distanceFromCenter * distanceFromCenter * 0.2;
      drawFacetShape(x, y, edgeScale, edgeScale);
      target.fillStyle = `rgb(${Math.round(red)}, ${Math.round(green)}, ${Math.round(blue)})`;
      target.fill();
      drawFacetShape(x, y, edgeScale * 0.78, edgeScale * 0.78);
      target.fillStyle = `rgba(${Math.round(red + (255 - red) * 0.12)}, ${Math.round(green + (238 - green) * 0.12)}, ${Math.round(blue + (215 - blue) * 0.12)}, .42)`;
      target.fill();
      target.globalAlpha = edgeLight;
      for (let receptor = 0; receptor < receptorOffsets.length; receptor += 1) {
        const [offsetX, offsetY] = receptorOffsets[receptor];
        target.beginPath();
        target.arc(
          x + offsetX * radiusX * edgeScale,
          y + offsetY * radiusY * edgeScale,
          receptorDotRadius * edgeScale,
          0,
          Math.PI * 2
        );
        target.fillStyle = receptorColors[receptor];
        target.fill();
      }
      target.globalAlpha = 1;
    }
  }
  target.restore();
}

function drawHuman(target, width, height) {
  target.drawImage(sourceCanvas, 0, 0, width, height);
}

function render() {
  const width = innerWidth;
  const height = innerHeight;
  sourceCtx.clearRect(0, 0, width, height);
  drawSource(sourceCtx, width, height);
  if (current === 'human') {
    drawHuman(ctx, width, height);
  } else {
    drawAnimalScene(ctx, width, height, current);
  }
  humanCtx.clearRect(0, 0, width, height);
  humanCtx.drawImage(sourceCanvas, 0, 0, width, height);
  if ($('#compare').classList.contains('active')) {
    drawAnimalScene(animalCtx, width, height, 'fly', false, compareFlyMotion);
  }
  raf = requestAnimationFrame(render);
}
function startRender() {
  cancelAnimationFrame(raf);
  render();
}

function choose(mode) {
  current = mode;
  previousFrame = null;
  flyFrameReady = false;
  dogMotionTrail = null;
  beeMotionTrail = null;
  flyMotionTrail = null;
  resizeCanvases();
  canvas.style.display = 'block';
  $('#chooser').classList.remove('active');
  $('#viewInfo').style.display = 'none';
  $('#story').classList.remove('show');
  renderAnimalFacts(mode);
  $('.controls').classList.add('active');
  startRender();
}

const factMarkers = $('#factMarkers') || document.createElement('div');
factMarkers.id = 'factMarkers';
factMarkers.classList.add('fact-markers');
if (!factMarkers.isConnected) $('#experience').append(factMarkers);
const factDialog = $('#factDialog') || document.createElement('dialog');
factDialog.id = 'factDialog';
factDialog.classList.add('fact-dialog');
factDialog.lang = 'ko';
factDialog.setAttribute('aria-labelledby', 'factTitle');
if (!factDialog.isConnected) {
  factDialog.innerHTML = '<p class="fact-dialog-kicker">시각 정보</p><h2 id="factTitle"></h2><p id="factBody"></p><button id="factConfirm" type="button">확인했어요 <span aria-hidden="true">✓</span></button>';
  $('#experience').append(factDialog);
}
$('#modeHud')?.remove();
if (!document.head.querySelector('link[href*="Noto+Sans+KR"]')) {
  const koreanFont = document.createElement('link');
  koreanFont.rel = 'stylesheet';
  koreanFont.href = 'https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700&display=swap';
  document.head.append(koreanFont);
}
const factTitle = $('#factTitle');
const factBody = $('#factBody');
let activeFactButton = null;
function renderAnimalFacts(mode) {
  factMarkers.replaceChildren();
  animalFacts[mode].forEach((fact) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'fact-marker';
    button.setAttribute('aria-label', `${fact.title} 설명 보기`);
    button.setAttribute('aria-haspopup', 'dialog');
    button.innerHTML = '<span aria-hidden="true">?</span>';
    button.addEventListener('click', () => {
      activeFactButton = button;
      factTitle.textContent = fact.title;
      factBody.textContent = fact.body;
      factDialog.showModal();
    });
    factMarkers.append(button);
  });
  factMarkers.classList.add('active');
}

factDialog.addEventListener('close', () => {
  if (!activeFactButton) return;
  activeFactButton.classList.add('is-read');
  activeFactButton.setAttribute('aria-label', `${factTitle.textContent} 설명 확인 완료`);
  activeFactButton.setAttribute('aria-haspopup', 'false');
  activeFactButton.querySelector('span').textContent = '✓';
  activeFactButton = null;
});
$('#factConfirm').addEventListener('click', () => factDialog.close());

$('#eyes').innerHTML = Object.keys(modes).map((mode) => `<button class="observer ${mode}" data-mode="${mode}"><span class="iris"><i class="pupil"></i></span><b>${modes[mode].name}</b><small>${observerText[mode]}</small></button>`).join('');
$$('.observer').forEach((button) => { button.onclick = () => choose(button.dataset.mode); });
$('.worlds').style.pointerEvents = 'none';

$('#begin').onclick = () => {
  $('#landing').classList.remove('active');
  $('#permission').classList.add('active');
};
async function camera(enterExperience = true) {
  try {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('Camera is unavailable');
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'user' }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
    video.srcObject = stream;
    const frameReady = waitForCameraFrame();
    await Promise.all([video.play(), frameReady]);
    source = 'camera';
    setText('#sourceLabel', 'LIVE CAMERA · LOCAL');
    setText('#cameraOff', 'TURN CAMERA OFF');
    cameraMessage.classList.remove('visible');
    if (enterExperience) openExperience();
    return true;
  } catch (error) {
    if (stream) stream.getTracks().forEach((track) => track.stop());
    stream = null;
    video.pause();
    video.srcObject = null;
    source = 'sample';
    showCameraError(error);
    return false;
  }
}
function openExperience() {
  $('#permission').classList.remove('active');
  $('#experience').classList.add('active');
  canvas.style.display = 'block';
  current = 'human';
  startRender();
  setTimeout(() => $('#story').classList.add('show'), 600);
  setTimeout(() => { $('#story span').textContent = 'But you’re not the only one looking.'; }, 3100);
  setTimeout(() => $('#continue').click(), 5200);
}
$('#allowCamera').onclick = () => camera();
$('#sampleMode').onclick = () => {
  source = 'sample';
  setText('#sourceLabel', 'SAMPLE SCENE · LOCAL');
  setText('#cameraOff', 'TURN CAMERA ON');
  cameraMessage.classList.remove('visible');
  openExperience();
};
$('#continue').onclick = () => {
  $('#chooser').classList.add('active');
  $('#story').classList.remove('show');
};
$('#backToEyes').onclick = () => $('#chooser').classList.add('active');
$('#cameraOff').onclick = async () => {
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
    stream = null;
    video.pause();
    video.srcObject = null;
    source = 'sample';
    setText('#sourceLabel', 'SAMPLE SCENE · CAMERA OFF');
    setText('#cameraOff', 'TURN CAMERA ON');
  } else {
    await camera(false);
  }
};
$('#compareBtn').onclick = () => $('#compare').classList.add('active');
$('#lookBtn').onclick = () => $('#look').classList.add('active');
$('#learnBtn').onclick = () => $('#learn').classList.add('active');
$('#endBtn').onclick = () => $('#ending').classList.add('active');
$$('[data-close]').forEach((button) => { button.onclick = () => $('#' + button.dataset.close).classList.remove('active'); });
$('#splitRange').oninput = (event) => {
  const position = event.target.value;
  $('#animalPanel').style.clipPath = `inset(${position}% 0 0)`;
  $('#divider').style.top = `${position}%`;
};
$('#startLook').onclick = async () => {
  $('#look').classList.remove('active');
  if (!stream) await camera(false);
  if (!stream) return;
  source = 'camera';
  current = 'human';
  $('#chooser').classList.remove('active');
  $('#viewInfo').style.display = 'block';
  factMarkers.classList.remove('active');
  $('.controls').classList.remove('active');
  canvas.style.display = 'block';
  startRender();
};
$('#finalLook').onclick = () => {
  $('#ending').classList.remove('active');
  $('#chooser').classList.add('active');
};
