//we add shapes (like lines) to this canvas
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

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
    let edges = [];
    let vertexIndex = 0;

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

        edges.push(
            [baseIdx + 0, baseIdx + 2],
            [baseIdx + 1, baseIdx + 3],
            [baseIdx + 0, baseIdx + 4],
            [baseIdx + 2, baseIdx + 6],
            [baseIdx + 1, baseIdx + 5],
            [baseIdx + 3, baseIdx + 7],
            [baseIdx + 4, baseIdx + 6],
            [baseIdx + 5, baseIdx + 7],
            [baseIdx + 6, baseIdx + 7]
        );

        if (seg > startSeg) {
            const prevBase = (seg - startSeg - 1) * 8;
            edges.push(
                [prevBase + 4, baseIdx + 0],
                [prevBase + 5, baseIdx + 1],
                [prevBase + 6, baseIdx + 2],
                [prevBase + 7, baseIdx + 3]
            );
        }
    }

    return { vertices, edges };
}

function render_bushes(cameraZ) {
    let vertices = [];
    let edges = [];

    let startSeg = Math.max(0, Math.floor(cameraZ / segmentSize) + 1);
    let firstSeg = Math.ceil(startSeg / bushInterval) * bushInterval;

    for (let seg = firstSeg; seg < startSeg + numVisibleSegments; seg += bushInterval) {
        const scale = 1 / (1 + seg * 0.08);
        const radius = 0.8 * scale;
        const side = (seg / bushInterval) % 2 === 0 ? -1 : 1;
        const centerX = side * 1 * scale;
        const centerY = -2 * scale + radius;
        const centerZ = seg * segmentSize + segmentSize / 2;

        const baseIdx = vertices.length;

        for (let i = 0; i < 8; i++) {
            const angle = Math.PI / 8 + i * Math.PI / 4;
            vertices.push({ x: centerX + radius * Math.cos(angle), y: centerY + radius * Math.sin(angle), z: centerZ });
            edges.push([baseIdx + i, baseIdx + (i + 1) % 8]);
        }
    }

    return { vertices, edges };
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

    let vertices = [];
    let edges = [];

    for (let i = 0; i < profile.length; i++) {
        vertices.push(
            { x: car.x + halfWidth, y: car.y + profile[i].y, z: car.z + profile[i].z },
            { x: car.x - halfWidth, y: car.y + profile[i].y, z: car.z + profile[i].z }
        );
    }

    for (let i = 0; i < profile.length; i++) {
        const next = (i + 1) % profile.length;
        edges.push(
            [i * 2, next * 2],
            [i * 2 + 1, next * 2 + 1],
            [i * 2, i * 2 + 1]
        );
    }

    return { vertices, edges };
}


function draw_object(camera){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#050510";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw the horizon line
    draw_line(0, canvas.height/2, canvas.width, canvas.height/2, "#a84300");

    draw_the_sun();

    let { vertices, edges } = render_canyon(camera.z);

    let canyonEdgeCount = edges.length;

    let bushShape = render_bushes(camera.z);
    let bushOffset = vertices.length;
    vertices = vertices.concat(bushShape.vertices);
    for(let e = 0; e < bushShape.edges.length; e++){
        edges.push([bushShape.edges[e][0] + bushOffset, bushShape.edges[e][1] + bushOffset]);
    }

    let carShape = render_car(car);
    let carOffset = vertices.length;
    let bushEdgeEnd = edges.length;
    vertices = vertices.concat(carShape.vertices);
    for(let e = 0; e < carShape.edges.length; e++){
        edges.push([carShape.edges[e][0] + carOffset, carShape.edges[e][1] + carOffset]);
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

        projectedVertices.push(canvasPos);
    }

    for(let e = 0; e < edges.length; e++){
        
        let e1 = edges[e][0];
        let u1 = projectedVertices[ e1 ].u; 
        let v1 = canvas.height - projectedVertices[ e1 ].v;

        let e2 = edges[e][1];
        let u2 = projectedVertices[ e2 ].u;
        let v2 = canvas.height - projectedVertices[ e2 ].v;

        let color = "white";
        if (e < canyonEdgeCount) {
            color = "#a84300";
        } else if (e < bushEdgeEnd) {
            color = "#459900";
        }

        draw_line(u1, v1, u2, v2, color);
    }
}


function draw_the_sun(){
    const centerX = canvas.width/2;
    const centerY = canvas.height/2;
    const radius = Math.min(canvas.width, canvas.height) * 0.2;

    let points = [{ x: centerX + radius * Math.cos(Math.PI / 8), y: centerY }];
    for(let i = 0; i < 4; i++){
        const angle = Math.PI / 8 + i * Math.PI / 4;
        points.push({ x: centerX + radius * Math.cos(angle), y: centerY - radius * Math.sin(angle) });
    }
    points.push({ x: centerX - radius * Math.cos(Math.PI / 8), y: centerY });

    for(let p = 0; p < points.length - 1; p++){
        draw_line(points[p].x, points[p].y, points[p + 1].x, points[p + 1].y, "yellow");
    }
}


//This uses a built in 'drawLine' function, provided by the javascript canvas
function draw_line(x1, y1, x2, y2, color){
    ctx.lineWidth = 2;
    ctx.strokeStyle = color;

    //this is how you draw a line on the canvas 
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
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
        camera.z += 0.3;
        moved = true;
    }
    if (keysPressed.ArrowDown) {
        camera.z -= 0.3;
        moved = true;
    }
    if (keysPressed.ArrowLeft) {
        camera.x -= 0.05;
        moved = true;
    }
    if (keysPressed.ArrowRight) {
        camera.x += 0.05;
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
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    draw_object(camera);
}


window.addEventListener("resize", resize_canvas);
resize_canvas();
update_movement();