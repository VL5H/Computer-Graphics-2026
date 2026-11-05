const WORLD_SIZE = 100.0;
const MIN_CUBE_HEIGHT = 0.5;
const MAX_CUBE_HEIGHT = 2.0;
const RESOLUTIONS = [100, 200, 300, 400, 500];
const DEFAULT_RESOLUTION = 200;

let cubes = [];


let colorImage = null;
let heightImage = null;

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

let gridCellSize = WORLD_SIZE / DEFAULT_RESOLUTION;


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
    resolutionSelect.blur();   // keep arrow keys for the camera
  });
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
      scaling(gridCellSize, cube.height, gridCellSize),
    );
    gl.uniformMatrix4fv(u_model, false, model);
    gl.uniform3fv(u_color, cube.color);
    gl.drawArrays(gl.TRIANGLES, 0, VERTEX_COUNT);
  }

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
