const WORLD_SIZE = 100.0;            
const HALF_WORLD = WORLD_SIZE / 2;
const MIN_CUBE_HEIGHT = 0.5;
const MAX_CUBE_HEIGHT = 2.0;
const RESOLUTIONS = [100, 200, 300, 400, 500];
const DEFAULT_RESOLUTION = 200;
let gridResolution = DEFAULT_RESOLUTION;
let colorImage = null;
let heightImage = null;

let cubes = [];
let gridCellSize = WORLD_SIZE / DEFAULT_RESOLUTION;


function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Could not load ' + src));
    image.src = src;
  });
}

function sampleImage(image, size) {
  const sampler = document.createElement('canvas');
  sampler.width = size;
  sampler.height = size;
  const ctx = sampler.getContext('2d', { willReadFrequently: true });
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(image, 0, 0, size, size);
  return ctx.getImageData(0, 0, size, size).data;
}

function buildGrid(size) {
  gridResolution = size;
  const colors = sampleImage(colorImage, size);
  const heights = sampleImage(heightImage, size);
  const cellSize = WORLD_SIZE / size;

  cubes = [];
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const i = (row * size + col) * 4;
      const gray = heights[i] / 255;
      cubes.push({
        x: (col - (size - 1) / 2) * cellSize,
        z: (row - (size - 1) / 2) * cellSize,
        height: MIN_CUBE_HEIGHT + gray * (MAX_CUBE_HEIGHT - MIN_CUBE_HEIGHT),
        color: [colors[i] / 255, colors[i + 1] / 255, colors[i + 2] / 255],
      });
    }
  }
  gridCellSize = cellSize;
}


function getPointOnCubicBezier(p0, p1, p2, p3, t) {
    const invT = 1 - t;
    const b0 = invT * invT * invT;
    const b1 = 3 * t * invT * invT;
    const b2 = 3 * t * t * invT;
    const b3 = t * t * t;

    return [
        b0 * p0[0] + b1 * p1[0] + b2 * p2[0] + b3 * p3[0],
        b0 * p0[1] + b1 * p1[1] + b2 * p2[1] + b3 * p3[1]
    ];
}


function generateBezierMesh(p0, p1, p2, p3, segments = 50) {
    const vertices = [];
    for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const [x, y] = getPointOnCubicBezier(p0, p1, p2, p3, t);
        vertices.push(x, y);
    }
    return new Float32Array(vertices);
}


function rotationY(a) {
  const c = Math.cos(a), s = Math.sin(a);
  return [
     c, 0, -s, 0,
     0, 1,  0, 0,
     s, 0,  c, 0,
     0, 0,  0, 1,
  ];
}


function partFromRect(rect, ref, scale, depth, color) {
  const [x0, y0, x1, y1] = rect;
  const centerX = ((x0 + x1) / 2 - ref[0]) * scale;
  const centerY = -((y0 + y1) / 2 - ref[1]) * scale;
  return {
    local: multiply(
      translation(centerX, centerY, 0),
      scaling((x1 - x0) * scale, (y1 - y0) * scale, depth),
    ),
    color,
  };
}

const GRAY   = [0.50, 0.50, 0.50];
const YELLOW = [1.00, 0.80, 0.05];
const BROWN  = [0.72, 0.50, 0.35];
const LIGHT_BLUE = [0.60, 0.85, 0.92];
const ORANGE = [1.00, 0.55, 0.12];
const WHITE  = [1.00, 1.00, 1.00];

const AIRSHIP_SCALE = 0.03;
const AIRSHIP_MIDPOINT = [580, 160];    
const airshipParts = [
  [[386, 113, 775, 206], 5.0, BROWN],        // gas bladder
  [[773,  20, 857, 206], 6.0, GRAY],         // main tail block
  [[738,  47, 773, 113], 5.5, GRAY],         // rear step 1
  [[714,  81, 739, 113], 5.0, GRAY],         // rear step 2
  [[790, 137, 842, 151], 6.3, YELLOW],       // rear slit
  [[365, 130, 386, 187], 3.5, GRAY],         // nose block 1
  [[347, 141, 365, 177], 2.5, GRAY],         // nose block 2
  [[265, 151, 347, 165], 0.8, YELLOW],       // propeller shaft
  [[487, 206, 743, 246], 3.5, GRAY],         // main body
  [[418, 206, 487, 246], 3.5, LIGHT_BLUE],   // cockpit window
  [[544, 223, 564, 281], 0.8, YELLOW],       // front strut
  [[654, 222, 674, 281], 0.8, YELLOW],       // rear strut
  [[526, 281, 584, 310], 2.5, GRAY],         // front engine
  [[637, 281, 694, 310], 2.5, GRAY],         // rear engine
].map(([rect, depth, color]) => partFromRect(rect, AIRSHIP_MIDPOINT, AIRSHIP_SCALE, depth, color));


const SUN_SCALE = 0.03;
const SUN_MIDPOINT = [941.5, 389.5];
const sunParts = [
  [[849, 302, 1034, 477],  4.5, ORANGE],   // border
  [[867, 320, 1020, 459],  4.8, YELLOW],   // center
  [[869, 288, 1020, 302],  4.5, YELLOW],   // top surface
  [[869, 477, 1020, 491],  4.5, YELLOW],   // bottom surface
  [[836, 321,  849, 459],  4.5, YELLOW],   // left surface
  [[1034, 321, 1047, 459], 4.5, YELLOW],   // right surface
].map(([rect, depth, color]) => partFromRect(rect, SUN_MIDPOINT, SUN_SCALE, depth, color));


const CLOUD_SCALE = 0.03;
const CLOUD_MIDPOINT = [206, 430];
const cloudParts = [
  [[70, 380, 343, 481],  4.0, WHITE],
  [[111, 332, 297, 380], 3.5, WHITE],
].map(([rect, depth, color]) => partFromRect(rect, CLOUD_MIDPOINT, CLOUD_SCALE, depth, color));


const TOP_LEFT     = [-HALF_WORLD, -HALF_WORLD];
const TOP_RIGHT    = [ HALF_WORLD, -HALF_WORLD];
const BOTTOM_LEFT  = [-HALF_WORLD,  HALF_WORLD];


const skyObjects = [
  {
    kind: 'sun', parts: sunParts, y: 45, duration: 60, spin: 0.4,
    bezier: [TOP_LEFT, [-30, 30], [30, 30], TOP_RIGHT],
  },
  {
    kind: 'airship', parts: airshipParts, y: 22, duration: 45,
    bezier: [TOP_RIGHT, [50, 20], [-20, -30], BOTTOM_LEFT],
  },
  {
    kind: 'cloud', parts: cloudParts, y: 33, duration: 80, offset: 0.0,
    line: [[-HALF_WORLD, -25], [HALF_WORLD, -25]],
  },
  {
    kind: 'cloud', parts: cloudParts, y: 30, duration: 65, offset: 0.35,
    line: [[-HALF_WORLD, 25], [HALF_WORLD, 25]],
  },
];


function skyPosition(object, t) {
  if (object.bezier) return getPointOnCubicBezier(...object.bezier, t);
  const [a, b] = object.line;
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}


function airshipMovement(object, t) {
  const t0 = Math.max(0, t - 0.005);
  const t1 = Math.min(1, t + 0.005);
  const a = getPointOnCubicBezier(...object.bezier, t0);
  const b = getPointOnCubicBezier(...object.bezier, t1);
  return Math.atan2(b[1] - a[1], -(b[0] - a[0]));
}

function drawSkyObject(object, seconds) {
  const t = (seconds / object.duration + (object.offset || 0)) % 1;
  const [x, z] = skyPosition(object, t);

  let yaw = 0;
  if (object.kind === 'airship') yaw = airshipMovement(object, t);
  if (object.kind === 'sun') yaw = seconds * object.spin;

  const base = multiply(translation(x, object.y, z), rotationY(yaw));
  for (const part of object.parts) {
    gl.uniformMatrix4fv(u_model, false, multiply(base, part.local));
    gl.uniform3fv(u_color, part.color);
    gl.drawArrays(gl.TRIANGLES, 0, VERTEX_COUNT);
  }
}


const UP = [0, 1, 0];
const CUBE_SIZE = 0.1; //0.1 a standard cube
const EYE_HEIGHT = 2 * CUBE_SIZE; // camera perspective is 0.2 cubes tall
const JUMP_HEIGHT = 10 * CUBE_SIZE; // jump rises one cube
const GRAVITY = 20.0;
const JUMP_SPEED = Math.sqrt(2 * GRAVITY * JUMP_HEIGHT);
const MOVE_SPEED = 8.0;
const LOOK_UP_ANGLE = 30 * Math.PI / 180; // look up 30 degrees
const LOOK_SPEED = 4.0;
const TURN_SPEED = 1.8;
const FAR_PLANE = 500.0;


const START_POS = [0, 0, 0];
let camX = START_POS[0];
let camZ = START_POS[2];
let jumpOffset = 0;
let jumpVelocity = 0;
let pitch = 0;
let yaw = 0;
let groundY = null;
const keysDown = new Set();

function resetCamera() {
  camX = START_POS[0];
  camZ = START_POS[2];
  jumpOffset = 0;
  jumpVelocity = 0;
  pitch = 0;
  yaw = 0;
  groundY = null;
}


function floorHeightAt(x, z) {
  const size = gridResolution;
  const col = Math.min(size - 1, Math.max(0, Math.round(x / gridCellSize + (size - 1) / 2)));
  const row = Math.min(size - 1, Math.max(0, Math.round(z / gridCellSize + (size - 1) / 2)));
  const cube = cubes[row * size + col];
  return cube ? cube.height : 0;
}

window.addEventListener('keydown', (event) => {
  if (event.key.startsWith('Arrow')) {
    event.preventDefault();
    keysDown.add(event.key);
  } else if (event.key === ' ' || event.code === 'Space') {
    event.preventDefault();
    if (jumpOffset === 0) jumpVelocity = JUMP_SPEED;
  } else if (event.key === 'Shift') {
    keysDown.add('Shift');
  } else if (event.key === 'r' || event.key === 'R') {
    resetCamera();
  }
});
window.addEventListener('keyup', (event) => keysDown.delete(event.key));
window.addEventListener('blur', () => keysDown.clear());


function updateCamera(dt) {
  
  if (keysDown.has('ArrowRight')) yaw += TURN_SPEED * dt;
  if (keysDown.has('ArrowLeft'))  yaw -= TURN_SPEED * dt;

  let forward = 0;
  if (keysDown.has('ArrowUp'))   forward += 1;
  if (keysDown.has('ArrowDown')) forward -= 1;
  camX += Math.sin(yaw) * forward * MOVE_SPEED * dt;
  camZ -= Math.cos(yaw) * forward * MOVE_SPEED * dt;
  camX = Math.min(HALF_WORLD, Math.max(-HALF_WORLD, camX));
  camZ = Math.min(HALF_WORLD, Math.max(-HALF_WORLD, camZ));

  
  if (jumpOffset > 0 || jumpVelocity > 0) {
    jumpVelocity -= GRAVITY * dt;
    jumpOffset += jumpVelocity * dt;
    if (jumpOffset <= 0) { jumpOffset = 0; jumpVelocity = 0; }
  }

  
  const targetPitch = keysDown.has('Shift') ? LOOK_UP_ANGLE : 0;
  pitch += (targetPitch - pitch) * Math.min(1, LOOK_SPEED * dt);

  
  const floorNow = floorHeightAt(camX, camZ);
  if (groundY === null || floorNow > groundY) groundY = floorNow;
  else groundY += (floorNow - groundY) * Math.min(1, 10 * dt);
  groundY = Math.max(groundY, floorNow);

  const eye = [camX, groundY + EYE_HEIGHT + jumpOffset, camZ];
  const target = [
    camX + Math.sin(yaw) * Math.cos(pitch),
    eye[1] + Math.sin(pitch),
    camZ - Math.cos(yaw) * Math.cos(pitch),
  ];
  return { eye, target };
}


const resolutionSelect = document.getElementById('resolution');
if (resolutionSelect) {
  for (const r of RESOLUTIONS) {
    const option = document.createElement('option');
    option.value = r;
    option.textContent = `${r} x ${r}`;
    option.selected = r === DEFAULT_RESOLUTION;
    resolutionSelect.appendChild(option);
  }
  resolutionSelect.addEventListener('change', () => {
    if (colorImage && heightImage) buildGrid(parseInt(resolutionSelect.value, 10));
    resolutionSelect.blur();
  });
}


gl.enable(gl.DEPTH_TEST);
gl.clearColor(0.53, 0.75, 0.92, 1.0);

let lastTime = null;

function render(timeInMilliseconds) {
  const dt = lastTime === null ? 0 : (timeInMilliseconds - lastTime) / 1000;
  lastTime = timeInMilliseconds;

  const seconds = timeInMilliseconds / 1000;

  resizeCanvas();
  const { eye, target } = updateCamera(dt);

  const aspect = canvas.width / canvas.height;
  gl.uniformMatrix4fv(u_view, false, lookAt(eye, target, UP));
  gl.uniformMatrix4fv(u_projection, false, perspective(45 * Math.PI / 180, aspect, 0.1, FAR_PLANE));

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


  for (const cube of cubes) {
    const model = multiply(
      translation(cube.x, cube.height / 2, cube.z),
      scaling(gridCellSize, cube.height, gridCellSize),
    );
    gl.uniformMatrix4fv(u_model, false, model);
    gl.uniform3fv(u_color, cube.color);
    gl.drawArrays(gl.TRIANGLES, 0, VERTEX_COUNT);
  }


  for (const object of skyObjects) drawSkyObject(object, seconds);

  requestAnimationFrame(render);
}

Promise.all([loadImage('L2_color_map.png'), loadImage('L2_height_map.png')])
  .then(([color, heightMap]) => {
    colorImage = color;
    heightImage = heightMap;
    buildGrid(DEFAULT_RESOLUTION);
    requestAnimationFrame(render);
  })
  .catch((error) => {
    console.error(error);
    alert(error.message + '\nServe this folder over http (e.g. Live Server) instead of opening the file directly.');
  });
