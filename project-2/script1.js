const GRID_SIZE = 100;                  // 10000 cubes
const SPACING = 1.0;                    
const ZONE_WIDTH = GRID_SIZE / 4;       

const random = Math.random;

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const lerp = (a, b, t) => a + (b - a) * t;
const colorVariation = (c1, c2, t) => [lerp(c1[0], c2[0], t), lerp(c1[1], c2[1], t), lerp(c1[2], c2[2], t)];
const shade = (c, f) => [clamp(c[0] * f, 0, 1), clamp(c[1] * f, 0, 1), clamp(c[2] * f, 0, 1)];
const positionVariation = (amount) => 1 + (random() - 0.5) * 2 * amount;


const GREY       = [0.45, 0.45, 0.47];
const WHITE      = [0.95, 0.96, 1.00];
const GREEN      = [0.20, 0.55, 0.22];
const BLUE       = [0.15, 0.40, 0.85];
const ORANGE     = [0.90, 0.55, 0.15];


function heightVariation(row) {
  return 0.5 + 0.25 * Math.sin(row * 0.17) + 0.15 * Math.sin(row * 0.43 + 1.3) + 0.10 * Math.sin(row * 0.91 + 4.0);
}


function mountainZone(col, row) {
  const center = (ZONE_WIDTH - 1) / 2;
  const edgeness = Math.abs(col - center) / center;
  const ridge = Math.pow(1 - edgeness, 1.3);
  const height = 2 + 20 * ridge * heightVariation(row) + random() * 1.5;
  const snow = clamp((height - 9) / 5, 0, 1);
  return { height, color: shade(colorVariation(GREY, WHITE, snow), positionVariation(0.06)) };
}


function forestZone() {
  const height = 3 + random() * 1.5;
  return { height, color: shade(GREEN, positionVariation(0.18)) };
}


function riverZone(col, row) {
  const localCol = col - 2 * ZONE_WIDTH;                     // 0..24 inside this slice
  const riverCenter = (ZONE_WIDTH - 1) / 2 + 2 * Math.sin(row * 0.12);
  const riverHalfWidth = 3;
  const offset = localCol - riverCenter;

  if (Math.abs(offset) <= riverHalfWidth) {
    return { height: 0.4, color: shade(BLUE, positionVariation(0.08)) };
  }
  
  const distFromWater = Math.abs(offset) - riverHalfWidth;
  const rise = clamp(distFromWater / 4, 0, 1);
  if (offset < 0) {
    return { height: lerp(1.2, 3.5, rise) + random() * 0.3, color: shade(GREEN, positionVariation(0.18)) };
  }
  return { height: lerp(1.0, 1.4, rise) + random() * 0.2, color: shade(ORANGE, positionVariation(0.10)) };
}


function desertZone() {
  const height = 1.4 + random() * 0.2;
  return { height, color: shade(ORANGE, positionVariation(0.12)) };
}


const cubes = [];
for (let row = 0; row < GRID_SIZE; row++) {
  for (let col = 0; col < GRID_SIZE; col++) {
    const zone = Math.floor(col / ZONE_WIDTH);
    let cell;
    if (zone === 0)      cell = mountainZone(col, row);
    else if (zone === 1) cell = forestZone();
    else if (zone === 2) cell = riverZone(col, row);
    else                 cell = desertZone();

    cubes.push({
      x: (col - (GRID_SIZE - 1) / 2) * SPACING,
      z: (row - (GRID_SIZE - 1) / 2) * SPACING,
      height: cell.height,
      color: cell.color,
    });
  }
}



const UP = [0, 1, 0];
const LOOK_AT = [0, 0, 0];
const ORBIT_RADIUS = 85.0;
const START_ANGLE = Math.PI / 2;
const START_HEIGHT = 45.0;
const MIN_HEIGHT = 2.0;
const MAX_HEIGHT = 150.0;
const ORBIT_SPEED = 1.0;
const HEIGHT_SPEED = 40.0;
const FAR_PLANE = 500.0;

let angle = START_ANGLE;
let height = START_HEIGHT;
const keysDown = new Set();

window.addEventListener('keydown', (event) => {
  if (event.key.startsWith('Arrow')) {
    event.preventDefault(); // keep the page from scrolling
    keysDown.add(event.key);
  } else if (event.key === 'r' || event.key === 'R') {
    angle = START_ANGLE;
    height = START_HEIGHT;
  }
});
window.addEventListener('keyup', (event) => keysDown.delete(event.key));
window.addEventListener('blur', () => keysDown.clear());

function updateCamera(dt) {
  if (keysDown.has('ArrowRight')) angle += ORBIT_SPEED * dt;
  if (keysDown.has('ArrowLeft'))  angle -= ORBIT_SPEED * dt;
  if (keysDown.has('ArrowUp'))    height += HEIGHT_SPEED * dt;
  if (keysDown.has('ArrowDown'))  height -= HEIGHT_SPEED * dt;
  height = Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, height));

  return [
    ORBIT_RADIUS * Math.cos(angle),
    height,
    ORBIT_RADIUS * Math.sin(angle),
  ];
}


gl.enable(gl.DEPTH_TEST);
gl.clearColor(0.53, 0.75, 0.92, 1.0);

let lastTime = null;

function render(timeInMilliseconds) {
  const dt = lastTime === null ? 0 : (timeInMilliseconds - lastTime) / 1000;
  lastTime = timeInMilliseconds;

  resizeCanvas();
  const eye = updateCamera(dt);

  const aspect = canvas.width / canvas.height;
  gl.uniformMatrix4fv(u_view, false, lookAt(eye, LOOK_AT, UP));
  gl.uniformMatrix4fv(u_projection, false, perspective(45 * Math.PI / 180, aspect, 0.1, FAR_PLANE));

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  for (const cube of cubes) {
    const model = multiply(
      translation(cube.x, cube.height / 2, cube.z),
      scaling(1, cube.height, 1),
    );
    gl.uniformMatrix4fv(u_model, false, model);
    gl.uniform3fv(u_color, cube.color);
    gl.drawArrays(gl.TRIANGLES, 0, VERTEX_COUNT);
  }

  requestAnimationFrame(render);
}

requestAnimationFrame(render);
