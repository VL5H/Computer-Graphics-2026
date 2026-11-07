# Project 2: Cube World

## Initial Design Plan

The initial design of this project was an interactive landscape that the user could view, rotate, zoom, and traverse through.

Design sketches and ideation was completed on paper as seen below:

<img width="609" height="796" alt="image" src="https://github.com/user-attachments/assets/206acf9c-19cf-4b2e-8560-e11e9391230e" />

Preliminary code implementation was done using the example code from the in-class activities "webgl-cubes-v3" and "camera-move".

## Project Description and Usage

The project features 5 distinct levels, each with their own unique scenery and features.

### Level 0

Level 0 features a single blue cube places on top of a grey floor. The user has the ability to orbit the camera left and right via the left and right arrow keys, as well as move the camera up and down via the up and down arrow keys. Pressing the "r" key resets the camera to its original position which is directly facing the cube and slightly above.

<img width="1917" height="937" alt="image" src="https://github.com/user-attachments/assets/cf3baa71-a66c-4a0f-84aa-ad357b994cee" />

### Level 1

Level 1 features an entire landscape generated out of cubes. The landscape features a mountainous region on the left depicted by tall grey and white cubes, where the grey cubes and the edges model the mountains' stone and the center white cubes model the snowcapped peaks. and the white The canvas size in level 1 is defaulted to 100x100 or 10,000 cubes in total. The camera controls are the exact same as in level 0 above.

<img width="1917" height="945" alt="image" src="https://github.com/user-attachments/assets/b03b707a-6db3-4ba4-b57e-8e362c012ac8" />

### Level 2

Level 2 features another landscape generated out of cubes. This time, the landscape is based on the reference image [L2_color_map.png](L2_color_map.png) (present in this repo):

<img width="710" height="710" alt="image" src="https://github.com/user-attachments/assets/799768ed-0f8d-4825-9282-ae8ca93f1eb6" />

While the camera control are the same, this level features a new resolution selection menu directly underneath the page instructions (boxed in red below). The default resolution for this level is 200x200 (20,000 cubes) but users have the option of decreasing it back down to 100x100 or increasing it to 300x300 (30,000 cubes), 400x400 (40,000 cubes), and 500x500 (50,000 cubes) as their device performance permits. 

<img width="1917" height="947" alt="image" src="https://github.com/user-attachments/assets/6b7b2c90-606f-461f-aa78-55873ad1669e" />

### Level 3

Level 3 features the same landscape as level 2 but with added objects moving through the sky. In this level the resolution is locked at 200x200 to ensure an adequate frame-rate for the moving objects on most devices. The moving objects are as follows:
1. An airship
2. The sun
3. Two white clouds
The sun and airship move according to cubic Bézier Curves while the two clouds simply move horizontally across the canvas. All objects follow their set paths in a continuous animation loop where they "disappear" at the edge of the canvas and "reappear" back where they started. The clouds and sun move at a relatively similar rate while the airship is significantly faster completing around 2 animation cycles during 1 animation cycle of the other objects.

<img width="1917" height="946" alt="image" src="https://github.com/user-attachments/assets/988af091-144e-41b5-a45f-798294740bdd" />

### Level 4

Level 4 features the same landscape and objects as level 3 but instead places the user's camera POV directly within the landscape. The controls for this level are as follows:
- Up/Down Arrow: Move Forward/Backward
- Left/Right Arrow: Turn Left/Right
- Space Bar: Jump
- Shift Key: Look Up
- R Key: Reset Position to Spawn
The resolution selector is also available in this level with the same resolutions as before.

<img width="1917" height="947" alt="image" src="https://github.com/user-attachments/assets/fa8e5b8b-1724-46a5-a41e-6ce40db609f4" />

## Implementation Documentation and Course Concept Connection

### General Graphics/WebGL Concepts

This project is implemented entirely in HTML, CSS, and JavaScript with the JavaScript native WebGL library as the main driver (in this case we are using WebGL 1.0). 

The majority of the needed WebGL functions are all located in the file [gl_helpers.js](gl_helpers.js). This includes critical constants like:
1. vertexShaderSource - defines the GLSL vertex shader which handles the lighting by pixel for each surface of the cubes
2. fragmentShaderSource - defines the GLSL fragment shader which handles the coloration by pixel for each surface of the cubes
3. cubeVerticies - defines all the verticies for a standard cube (all cubes will be tranformations and scales of this original cube)
4. VERTEX_COUNT - defines the number of verticies for a standard cube
5. buffer - copies all cube vertex data into the GPU memory

And critical functions like:
1. compileShader() - complies the shaders using the pre-defined source
2. program() - defines the WebGL "program" for the GPU to run (both shaders linked together)
3. translation() - translates a given point by x, y, z using the translation matrix learned in class
4. scaling() - scales a given point by x, y, z using the scaling matrix learned in class
5. mutiply() - multiplies two given matrices together using matrix multiplcation
6. perspective() - calculates how much shrinkage an object should have as it gets farther away
7. makeModelMatrix() - takes a given cube and scales it, then "moves" it to the required position
8. lookAt() - main camera function which calculates what the camera be seeing at a given point
9. draw() - main draw loop by which all cubes are drawn

gl_helpers.js is imported in each level alongside the main level script file.

All levels use some combination of these above functions to render, position, scale, and then draw each cube.

### Image and Height Sampling

In level 2 image sampling is done using a combination of two versions of the same reference image.
[L2_color_map.png](L2_color_map.png) serves as the color map for the canvas.

<img width="710" height="710" alt="image" src="https://github.com/user-attachments/assets/799768ed-0f8d-4825-9282-ae8ca93f1eb6" />

The grey-scale version of the same image [L2_height_map.png](L2_height_map.png) serves as the height map for the cubes on the canvas.

<img width="710" height="710" alt="image" src="https://github.com/user-attachments/assets/ed6c1ce9-fa87-4986-b204-a049f169cf62" />

Both images are loaded and then sampled in order to extract color and height data.

The actual color sampling is handled by the sampleImage() function:
```javascript
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
```
The 710x710 images are first shrunk down to the current canvas size (the resolution that the user selected) and then the browser's native smoothing protocols average the colors for the pixels in each cell. The color data for each pixel is then returned.

The heights for each cube are calculate in the buildGrid() function where all cubes are scaled, and translated into the correct positions. 
```javascript
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
```
For this level a black pixel is interpreted as a height of 0.5 so that all cubes have a height of some kind (a height of zero results in a non-existent cube which throws errors) and a pure white pixel in interpreted as a height of 2.0 (as opposed to the maximum of 255 which would result in excessively tall cubes) as defined by the height constants:
```javascript
const MIN_CUBE_HEIGHT = 0.5;
const MAX_CUBE_HEIGHT = 2.0;
```

### Bézier Curves

In level 3, both the airship and sun objects move on paths calculated according to cubic Bézier Curves via the formula ```math B(t) = (1-t)^3 P0 + 3t(1-t)^2 P1 + 3t^2(1-t) P2 + t^3 P3``` 

These curves and points are calculated via these helper functions:
```javascript
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
```
Which calculates the points on the curve and combines them into an array.

### Extra Experiments

Level 4 served as a platform for us to experiment with other features that we wished to include in this project.

For this level, I choose to experiment with a 1st person perspective that places the user's camera POV directly on the canvas within the landscape scene. 

This was achieved by manipulating the camera's initial perspective and providing a few extra controls such as jumping via the spacebar and looking "up" (to view sky objects) via the shift key to enhance to user experience.

The camera height was defined as 0.2 of a standard cube and and the jump height was defined as a single standard cube:
```javascript
const CUBE_SIZE = 0.1; //0.1 a standard cube
const EYE_HEIGHT = 2 * CUBE_SIZE; // camera perspective is 0.2 cubes tall
const JUMP_HEIGHT = 10 * CUBE_SIZE; // jump rises one cube
```

The "look up" angle was set at 30 degrees:
```javascript
const LOOK_UP_ANGLE = 30 * Math.PI / 180; // look up 30 degrees
```

These values were decided after some experimentation to see what looked the most realistic/smooth.

Additionally, the the up/down keys were remapped to move the camera perspective forward and backward rather than up and down.

## Future Plans

In future iterations of the project I plan to add the following features to create a more complex user experience:
1. Collision Detection - currently the user's camera automatically jumps over any cubes in level 4. In the future, I intend to add some sort of collision detection logic so that the user will actually have to jump and move around the cubes in the landscape.
2. Complex Lighting and Shading - I plan to add some more complex shading and lighting effects possibly using some WebGL 2.0 tools to create a more realistic look for the canvas.
3. Extra User Controls - I plan to add some extra user controls to level 4 to allow the user's to interact with the landscape in some way.
4. Sun Light Effects - Currently the sun exists as a normal object in this project. In future iterations, I plan to make the sun the primary light source for the canvas and have all shading and lighting calculations be based on its position and level of illumination.

## Demo Video

[Demo Video](Project_2_Demo_Video_11_06_2026.mp4)

Note: File is a bit large so you may have to download and then view.


