const CUBE_SIZE  = 2;
const CUBE_COLOR = [0.1, 0.1, 0.9];
const modelMatrix = makeModelMatrix([0, 0, 0], [CUBE_SIZE, CUBE_SIZE, CUBE_SIZE]);

const FLOOR_COLOR = [0.55, 0.55, 0.55];
const floorModelMatrix = makeModelMatrix([0, -1.05, 0], [16, 0.1, 16]);

const UP = [0, 1, 0];
const LOOK_AT = [0, 0, 0];
const ORBIT_RADIUS = 8.0;
const START_ANGLE = Math.PI / 2;    
const START_HEIGHT = 2.0;
const MIN_HEIGHT = -0.5; // keep the camera above the floor
const MAX_HEIGHT = 12.0;
const ORBIT_SPEED = 1.5;            
const HEIGHT_SPEED = 5.0;           

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
gl.clearColor(0.1, 0.12, 0.16, 1.0);

let lastTime = null;

function render(timeInMilliseconds) {
  const dt = lastTime === null ? 0 : (timeInMilliseconds - lastTime) / 1000;
  lastTime = timeInMilliseconds;

  resizeCanvas();
  const eye = updateCamera(dt);

  const aspect = canvas.width / canvas.height;
  gl.uniformMatrix4fv(u_view, false, lookAt(eye, LOOK_AT, UP));
  gl.uniformMatrix4fv(u_projection, false, perspective(45 * Math.PI / 180, aspect, 0.1, 100.0));

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.uniformMatrix4fv(u_model, false, floorModelMatrix);
  gl.uniform3fv(u_color, FLOOR_COLOR);
  gl.drawArrays(gl.TRIANGLES, 0, VERTEX_COUNT);

  gl.uniformMatrix4fv(u_model, false, modelMatrix);
  gl.uniform3fv(u_color, CUBE_COLOR);
  gl.drawArrays(gl.TRIANGLES, 0, VERTEX_COUNT);

  requestAnimationFrame(render);
}

requestAnimationFrame(render);
