const canvas = document.getElementById('glcanvas');
const gl = canvas.getContext('webgl');

if (!gl) {
  // Very old browsers or disabled graphics drivers may not support WebGL.
  alert('Sorry, your browser does not support WebGL.');
}

const vertexShaderSource = `
  attribute vec3 a_position;  
  attribute float a_shade;   
  
  uniform mat4 u_model;       
  uniform mat4 u_view;        
  uniform mat4 u_projection;  
 
  varying float v_shade;

  void main() {
    gl_Position = u_projection * u_view * u_model * vec4(a_position, 1.0);

    v_shade = a_shade;
  }
`;

const fragmentShaderSource = `
  precision mediump float;

  uniform vec3 u_color;   
  varying float v_shade;  

  void main() {
    gl_FragColor = vec4(u_color * v_shade, 1.0);
  }
`;

function compileShader(type, source) {
  const shader = gl.createShader(type);   
  gl.shaderSource(shader, source);        
  gl.compileShader(shader);               

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
  }
  return shader;
}

const vertexShader = compileShader(gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentShaderSource);

const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);
if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
  console.error(gl.getProgramInfoLog(program));
}


gl.useProgram(program);


const a_position   = gl.getAttribLocation(program, 'a_position');
const a_shade      = gl.getAttribLocation(program, 'a_shade');
const u_model      = gl.getUniformLocation(program, 'u_model');
const u_view       = gl.getUniformLocation(program, 'u_view');
const u_projection = gl.getUniformLocation(program, 'u_projection');
const u_color      = gl.getUniformLocation(program, 'u_color');

const cubePositions = new Float32Array([
  // Front face (z = +0.5)
  -0.5, -0.5,  0.5,   0.5, -0.5,  0.5,   0.5,  0.5,  0.5,   
  -0.5, -0.5,  0.5,   0.5,  0.5,  0.5,  -0.5,  0.5,  0.5,   
  // Back face (z = -0.5)
   0.5, -0.5, -0.5,  -0.5, -0.5, -0.5,  -0.5,  0.5, -0.5,
   0.5, -0.5, -0.5,  -0.5,  0.5, -0.5,   0.5,  0.5, -0.5,
  // Top face (y = +0.5)
  -0.5,  0.5,  0.5,   0.5,  0.5,  0.5,   0.5,  0.5, -0.5,
  -0.5,  0.5,  0.5,   0.5,  0.5, -0.5,  -0.5,  0.5, -0.5,
  // Bottom face (y = -0.5)
  -0.5, -0.5, -0.5,   0.5, -0.5, -0.5,   0.5, -0.5,  0.5,
  -0.5, -0.5, -0.5,   0.5, -0.5,  0.5,  -0.5, -0.5,  0.5,
  // Right face (x = +0.5)
   0.5, -0.5,  0.5,   0.5, -0.5, -0.5,   0.5,  0.5, -0.5,
   0.5, -0.5,  0.5,   0.5,  0.5, -0.5,   0.5,  0.5,  0.5,
  // Left face (x = -0.5)
  -0.5, -0.5, -0.5,  -0.5, -0.5,  0.5,  -0.5,  0.5,  0.5,
  -0.5, -0.5, -0.5,  -0.5,  0.5,  0.5,  -0.5,  0.5, -0.5,
]);

const cubeShades = new Float32Array([
  0.85, 0.85, 0.85, 0.85, 0.85, 0.85,   // front
  0.70, 0.70, 0.70, 0.70, 0.70, 0.70,   // back
  1.00, 1.00, 1.00, 1.00, 1.00, 1.00,   // top    (brightest, "lit from above")
  0.40, 0.40, 0.40, 0.40, 0.40, 0.40,   // bottom (darkest)
  0.75, 0.75, 0.75, 0.75, 0.75, 0.75,   // right
  0.60, 0.60, 0.60, 0.60, 0.60, 0.60,   // left
]);

const VERTEX_COUNT = 36;

const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, cubePositions, gl.STATIC_DRAW);

gl.vertexAttribPointer(a_position, 3, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(a_position);

const shadeBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, shadeBuffer);
gl.bufferData(gl.ARRAY_BUFFER, cubeShades, gl.STATIC_DRAW);
gl.vertexAttribPointer(a_shade, 1, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(a_shade);

function subtract(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
function dot(a, b)      { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
function cross(a, b) {
  // The cross product gives a vector perpendicular to both a and b.
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}
function normalize(v) {
  // Scale a vector so its length is exactly 1 (keep its direction).
  const length = Math.sqrt(dot(v, v));
  return [v[0] / length, v[1] / length, v[2] / length];
}

// Move a point by (x, y, z).
function translation(x, y, z) {
  return [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    x, y, z, 1,
  ];
}

// Stretch a point by (sx, sy, sz).
function scaling(sx, sy, sz) {
  return [
    sx, 0,  0,  0,
    0,  sy, 0,  0,
    0,  0,  sz, 0,
    0,  0,  0,  1,
  ];
}

// Multiply two matrices: the result does b first, then a.
function multiply(a, b) {
  const result = new Array(16).fill(0);
  for (let col = 0; col < 4; col++) {
    for (let row = 0; row < 4; row++) {
      for (let k = 0; k < 4; k++) {
        result[col * 4 + row] += a[k * 4 + row] * b[col * 4 + k];
      }
    }
  }
  return result;
}

function makeModelMatrix(position, scale) {
  const [tx, ty, tz] = position;
  const [sx, sy, sz] = scale;
  return new Float32Array([
    sx, 0,  0,  0,    // column 1
    0,  sy, 0,  0,    // column 2
    0,  0,  sz, 0,    // column 3
    tx, ty, tz, 1,    // column 4 (the translation)
  ]);
}

function lookAt(eye, target, up) {
  const zAxis = normalize(subtract(eye, target));
  const xAxis = normalize(cross(up, zAxis));
  const yAxis = cross(zAxis, xAxis);   // already length 1

  // The upper-left 3x3 part ROTATES world directions into camera directions
  // (the camera axes are the ROWS). The last column TRANSLATES so that the
  // eye point lands exactly on the origin.
  return new Float32Array([
    xAxis[0], yAxis[0], zAxis[0], 0,   // column 1
    xAxis[1], yAxis[1], zAxis[1], 0,   // column 2
    xAxis[2], yAxis[2], zAxis[2], 0,   // column 3
    -dot(xAxis, eye), -dot(yAxis, eye), -dot(zAxis, eye), 1,   // column 4
  ]);
}

function perspective(fieldOfView, aspect, near, far) {
  const f = 1.0 / Math.tan(fieldOfView / 2);
  const rangeInv = 1.0 / (near - far);
  return new Float32Array([
    f / aspect, 0, 0,                          0,    // column 1
    0,          f, 0,                          0,    // column 2
    0,          0, (near + far) * rangeInv,   -1,    // column 3
    0,          0, 2 * near * far * rangeInv,  0,    // column 4
  ]);
}

function resizeCanvas() {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  gl.viewport(0, 0, canvas.width, canvas.height);
}

