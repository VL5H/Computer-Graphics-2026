//we add shapes (like lines) to this canvas
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const rows = 200;
const cols = 320;
const pixelSize = 5;
const pixelGrid = Array.from({ length: cols }, () => Array(rows).fill("#050510"));
const depthBuffer = Array.from({ length: cols }, () => Array(rows).fill(Infinity));
const nearPlane = 0.1;

let seePixelOutline = false;

const segmentSize = 4;
const numVisibleSegments = 200;
const bushInterval = 3;

let camera = {x: 0, y: 2, z: -8};

const carSize = {width: 0.5, height: 0.5, depth: 2};

let car = {x: 0, y: 0.5, z: -2, width: carSize.width, height: carSize.height, depth: carSize.depth};

function update_camera_y() {
    const effectiveSeg = Math.max(0, camera.z / segmentSize);
    camera.y = 2 / (1 + effectiveSeg * 0.08);
}

function update_car() {
    const carScale = 1 / (1 + Math.max(0, camera.z / segmentSize) * 0.08);

    car.x = camera.x;
    car.y = camera.y - 1.5 * carScale;
    car.z = camera.z + 6 * carScale;
    car.width = carSize.width * carScale;
    car.height = carSize.height * carScale;
    car.depth = carSize.depth * carScale;
}

function render_canyon(cameraZ) {
    let vertices = [];
    let triangles = [];
    let vertexIndex = 0;

    const wallColor = "#a84300";
    const floorColor = "#7a3100";

    let startSeg = Math.max(0, Math.floor(cameraZ / segmentSize) + 1);

    for (let seg = startSeg; seg < startSeg + numVisibleSegments; seg++) {
        const zFront = seg * segmentSize;
        const zBack = (seg + 1) * segmentSize;

        const scale = 1 / (1 + seg * 0.08);
        const halfWidth = 4 * scale;
        const halfHeight = 4 * scale;
        const yTop = 2 * scale;
        const yBottom = -2 * scale;

        const baseIdx = vertexIndex;

        vertices.push(
            { x:  halfWidth, y: yTop,    z: zFront },
            { x: -halfWidth, y: yTop,    z: zFront },
            { x:  halfWidth, y: yBottom, z: zFront },
            { x: -halfWidth, y: yBottom, z: zFront },
            { x:  halfWidth, y: yTop,    z: zBack },
            { x: -halfWidth, y: yTop,    z: zBack },
            { x:  halfWidth, y: yBottom, z: zBack },
            { x: -halfWidth, y: yBottom, z: zBack }
        );
        vertexIndex += 8;

        triangles.push(
            { indices: [baseIdx + 2, baseIdx + 3, baseIdx + 7], color: floorColor },
            { indices: [baseIdx + 2, baseIdx + 7, baseIdx + 6], color: floorColor },
            { indices: [baseIdx + 0, baseIdx + 2, baseIdx + 6], color: wallColor },
            { indices: [baseIdx + 0, baseIdx + 6, baseIdx + 4], color: wallColor },
            { indices: [baseIdx + 1, baseIdx + 3, baseIdx + 7], color: wallColor },
            { indices: [baseIdx + 1, baseIdx + 7, baseIdx + 5], color: wallColor }
        );

        if (seg > startSeg) {
            const prevBase = (seg - startSeg - 1) * 8;
            triangles.push(
                { indices: [prevBase + 6, prevBase + 7, baseIdx + 3], color: floorColor },
                { indices: [prevBase + 6, baseIdx + 3, baseIdx + 2], color: floorColor },
                { indices: [prevBase + 4, prevBase + 6, baseIdx + 2], color: wallColor },
                { indices: [prevBase + 4, baseIdx + 2, baseIdx + 0], color: wallColor },
                { indices: [prevBase + 5, prevBase + 7, baseIdx + 3], color: wallColor },
                { indices: [prevBase + 5, baseIdx + 3, baseIdx + 1], color: wallColor }
            );
        }
    }

    return { vertices, triangles };
}

function render_bushes(cameraZ) {
    let vertices = [];
    let triangles = [];

    const bushColor = "#459900";

    let startSeg = Math.max(0, Math.floor(cameraZ / segmentSize) + 1);
    let firstSeg = Math.ceil(startSeg / bushInterval) * bushInterval;

    for (let seg = firstSeg; seg < startSeg + numVisibleSegments; seg += bushInterval) {
        const scale = 1 / (1 + seg * 0.08);
        const radius = 0.8 * scale;
        const side = (seg / bushInterval) % 2 === 0 ? -1 : 1;
        const centerX = side * 1 * scale;
        const centerY = -2 * scale + radius;
        const centerZ = seg * segmentSize + segmentSize / 2;

        const centerIdx = vertices.length;
        vertices.push({ x: centerX, y: centerY, z: centerZ });

        for (let i = 0; i < 8; i++) {
            const angle = Math.PI / 8 + i * Math.PI / 4;
            vertices.push({ x: centerX + radius * Math.cos(angle), y: centerY + radius * Math.sin(angle), z: centerZ });
            triangles.push({ indices: [centerIdx, centerIdx + 1 + i, centerIdx + 1 + (i + 1) % 8], color: bushColor });
        }
    }

    return { vertices, triangles };
}

function render_car(car) {
    const halfWidth = car.width / 2;
    const halfHeight = car.height / 2;
    const halfDepth = car.depth / 2;
    const hoodLine = -halfHeight + car.height * 0.45;

    const profile = [
        { y: -halfHeight, z: -halfDepth },
        { y: -halfHeight, z:  halfDepth },
        { y:  hoodLine,   z:  halfDepth },
        { y:  hoodLine,   z:  halfDepth * 0.4 },
        { y:  halfHeight, z:  halfDepth * 0.1 },
        { y:  halfHeight, z: -halfDepth * 0.6 },
        { y:  hoodLine,   z: -halfDepth * 0.8 },
        { y:  hoodLine,   z: -halfDepth }
    ];

    const sideColor = "#ffffff";
    const bodyColor = "#bbbbbb";
    const windowColor = "#5a8fd6";

    const sideQuads = [
        [0, 1, 2, 7],
        [6, 3, 4, 5]
    ];

    let vertices = [];
    let triangles = [];

    for (let i = 0; i < profile.length; i++) {
        vertices.push(
            { x: car.x + halfWidth, y: car.y + profile[i].y, z: car.z + profile[i].z },
            { x: car.x - halfWidth, y: car.y + profile[i].y, z: car.z + profile[i].z }
        );
    }

    for (let s = 0; s < 2; s++) {
        for (let q = 0; q < sideQuads.length; q++) {
            const [a, b, c, d] = sideQuads[q];
            triangles.push(
                { indices: [a * 2 + s, b * 2 + s, c * 2 + s], color: sideColor },
                { indices: [a * 2 + s, c * 2 + s, d * 2 + s], color: sideColor }
            );
        }
    }

    for (let i = 0; i < profile.length; i++) {
        const next = (i + 1) % profile.length;
        const color = (i === 3 || i === 5) ? windowColor : bodyColor;
        triangles.push(
            { indices: [i * 2, next * 2, next * 2 + 1], color: color },
            { indices: [i * 2, next * 2 + 1, i * 2 + 1], color: color }
        );
    }

    return { vertices, triangles };
}


function draw_object(camera){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#050510";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    clear_pixel_grid();

    // Draw the horizon line
    draw_line(0, canvas.height/2, canvas.width, canvas.height/2, "#a84300");

    draw_the_sun();

    let { vertices, triangles } = render_canyon(camera.z);

    let bushShape = render_bushes(camera.z);
    let bushOffset = vertices.length;
    vertices = vertices.concat(bushShape.vertices);
    for(let t = 0; t < bushShape.triangles.length; t++){
        const [a, b, c] = bushShape.triangles[t].indices;
        triangles.push({ indices: [a + bushOffset, b + bushOffset, c + bushOffset], color: bushShape.triangles[t].color });
    }

    let carShape = render_car(car);
    let carOffset = vertices.length;
    vertices = vertices.concat(carShape.vertices);
    for(let t = 0; t < carShape.triangles.length; t++){
        const [a, b, c] = carShape.triangles[t].indices;
        triangles.push({ indices: [a + carOffset, b + carOffset, c + carOffset], color: carShape.triangles[t].color });
    }

    let projectedVertices = [];

    for(let v = 0; v< vertices.length; v++){
        let camVert = {};
        camVert.x = vertices[v].x - camera.x;
        camVert.y = vertices[v].y - camera.y;
        camVert.z = vertices[v].z - camera.z;

        let canvasPos = {};
        canvasPos.u = camVert.x / camVert.z;
        canvasPos.v = camVert.y / camVert.z;

        canvasPos.u = canvasPos.u * canvas.width + canvas.width/2;
        canvasPos.v = canvasPos.v * canvas.height + canvas.height/2;
        canvasPos.z = camVert.z;

        projectedVertices.push(canvasPos);
    }

    for(let t = 0; t < triangles.length; t++){
        let points = [];

        for(let i = 0; i < 3; i++){
            let projected = projectedVertices[ triangles[t].indices[i] ];
            points.push({ u: projected.u, v: canvas.height - projected.v, z: projected.z });
        }

        draw_triangle(points[0], points[1], points[2], triangles[t].color);
    }

    draw_pixel_grid();
}


function draw_the_sun(){
    const centerX = canvas.width/2;
    const centerY = canvas.height/2;
    const radius = Math.min(canvas.width, canvas.height) * 0.2;
    const sunDepth = 1e9;

    let points = [{ u: centerX + radius * Math.cos(Math.PI / 8), v: centerY, z: sunDepth }];
    for(let i = 0; i < 4; i++){
        const angle = Math.PI / 8 + i * Math.PI / 4;
        points.push({ u: centerX + radius * Math.cos(angle), v: centerY - radius * Math.sin(angle), z: sunDepth });
    }
    points.push({ u: centerX - radius * Math.cos(Math.PI / 8), v: centerY, z: sunDepth });

    const center = { u: centerX, v: centerY, z: sunDepth };

    for(let p = 0; p < points.length - 1; p++){
        draw_triangle(center, points[p], points[p + 1], "yellow");
    }
}


//This fills in the pixels of the mock low resolution canvas that represent the line
function draw_line(x1, y1, x2, y2, color){
    let tStart = 0;
    let tEnd = 1;
    const p = [-(x2 - x1), x2 - x1, -(y2 - y1), y2 - y1];
    const q = [x1, canvas.width - x1, y1, canvas.height - y1];

    for(let i = 0; i < 4; i++){
        if (p[i] === 0) {
            if (q[i] < 0) {
                return;
            }
        } else {
            const t = q[i] / p[i];
            if (p[i] < 0) {
                tStart = Math.max(tStart, t);
            } else {
                tEnd = Math.min(tEnd, t);
            }
        }
    }

    if (tStart > tEnd) {
        return;
    }

    const u1 = (x1 + tStart * (x2 - x1)) / pixelSize;
    const v1 = (y1 + tStart * (y2 - y1)) / pixelSize;
    const u2 = (x1 + tEnd * (x2 - x1)) / pixelSize;
    const v2 = (y1 + tEnd * (y2 - y1)) / pixelSize;

    const steps = Math.ceil(Math.max(Math.abs(u2 - u1), Math.abs(v2 - v1)));
    if (steps === 0) {
        set_pixel_color(Math.floor(u1), Math.floor(v1), color);
        return;
    }

    const du = (u2 - u1) / steps;
    const dv = (v2 - v1) / steps;

    let u = u1;
    let v = v1;
    for(let i = 0; i <= steps; i++){
        set_pixel_color(Math.floor(u), Math.floor(v), color);
        u += du;
        v += dv;
    }
}

function triangle_area(p0, p1, p2){
    return 0.5 * ((p1.u - p0.u) * (p2.v - p0.v) - (p2.u - p0.u) * (p1.v - p0.v));
}

function draw_triangle(p0, p1, p2, color){
    if (p0.z < nearPlane || p1.z < nearPlane || p2.z < nearPlane) {
        return;
    }

    const a = { u: p0.u / pixelSize, v: p0.v / pixelSize };
    const b = { u: p1.u / pixelSize, v: p1.v / pixelSize };
    const c = { u: p2.u / pixelSize, v: p2.v / pixelSize };

    const totalArea = triangle_area(a, b, c);
    if (totalArea === 0) {
        return;
    }

    const minU = Math.max(0, Math.floor(Math.min(a.u, b.u, c.u)));
    const maxU = Math.min(cols - 1, Math.ceil(Math.max(a.u, b.u, c.u)));
    const minV = Math.max(0, Math.floor(Math.min(a.v, b.v, c.v)));
    const maxV = Math.min(rows - 1, Math.ceil(Math.max(a.v, b.v, c.v)));

    for(let u = minU; u <= maxU; u++){
        for(let v = minV; v <= maxV; v++){
            const center = { u: u + 0.5, v: v + 0.5 };

            const w0 = triangle_area(center, b, c) / totalArea;
            const w1 = triangle_area(a, center, c) / totalArea;
            const w2 = triangle_area(a, b, center) / totalArea;

            if (w0 >= 0 && w1 >= 0 && w2 >= 0) {
                const depth = w0 * p0.z + w1 * p1.z + w2 * p2.z;

                if (depth < depthBuffer[u][v]) {
                    depthBuffer[u][v] = depth;
                    pixelGrid[u][v] = color;
                }
            }
        }
    }
}

function set_pixel_color(u, v, color){
    if (u >= 0 && u < cols && v >= 0 && v < rows) {
        pixelGrid[u][v] = color;
    }
}

function clear_pixel_grid(){
    for(let u = 0; u < cols; u++){
        pixelGrid[u].fill("#050510");
        depthBuffer[u].fill(Infinity);
    }
}

function draw_pixel_grid(){
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#444444";

    for(let v = 0; v < rows; v++){
        for(let u = 0; u < cols; u++){
            ctx.fillStyle = pixelGrid[u][v];
            ctx.fillRect(u * pixelSize, v * pixelSize, pixelSize, pixelSize);

            if (seePixelOutline) {
                ctx.strokeRect(u * pixelSize, v * pixelSize, pixelSize, pixelSize);
            }
        }
    }
}


//this is how we detect events- 

// do nothing for now....
let keysPressed = {ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false};

document.addEventListener("keydown", (event) => {

    event.preventDefault();
    switch (event.key) {
    case "ArrowUp":
    case "ArrowDown":
    case "ArrowLeft":
    case "ArrowRight":
        if (!keysPressed[event.key]) {
            console.log(`${event.key} pressed`);
        }
        keysPressed[event.key] = true;
        break;
    case "r":
        camera.x = 0;
        camera.z = -8;
        update_camera_y();
        update_car();
        console.log("Reset");
        draw_object(camera);
        break;
    default:
        return;
    }
});

document.addEventListener("keyup", (event) => {
    if (event.key in keysPressed) {
        keysPressed[event.key] = false;
    }
});

window.addEventListener("blur", () => {
    for (let key in keysPressed) {
        keysPressed[key] = false;
    }
});

function update_movement() {
    let moved = false;

    if (keysPressed.ArrowUp) {
        camera.z += 1;
        moved = true;
    }
    if (keysPressed.ArrowDown) {
        camera.z -= 1;
        moved = true;
    }
    if (keysPressed.ArrowLeft) {
        camera.x -= 0.3;
        moved = true;
    }
    if (keysPressed.ArrowRight) {
        camera.x += 0.3;
        moved = true;
    }

    if (moved) {
        update_camera_y();
        update_car();
        draw_object(camera);
    }

    requestAnimationFrame(update_movement);
}

function resize_canvas() {
    canvas.width = cols * pixelSize;
    canvas.height = rows * pixelSize;
    draw_object(camera);
}


window.addEventListener("resize", resize_canvas);
resize_canvas();
update_movement();