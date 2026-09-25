# Project 1: Pinhole Camera, Rasterized Display

## Initial Design Plan
The initial design of this project was inspired by the classic Star Wars Trench Run example that is often used to describe computer graphics concepts.

<img width="640" height="512" alt="trench_run" src="https://github.com/user-attachments/assets/cc518ad0-a6c5-4ba1-b23e-6ceb7ee1334a" />

However, instead of the standard Sci-Fi setting, I opted for a much more familiar concept of a car driving through a canyon while avoiding natural obstacles in the form of bushes.

<img width="1915" height="943" alt="familiar_objects" src="https://github.com/user-attachments/assets/a085c96d-f8a2-4bc1-b931-20a1cf02fd13" />

I began with an initial sketch of my designs in which I decided which objects would be static, single-draw elements on the screen and which objects would be projected, moving elements.

<img width="675" height="765" alt="inital_design" src="https://github.com/user-attachments/assets/40343a48-19aa-4052-b866-67a79f167d60" />

Once I had a good initial design I moved to the implementation step using the starter code we received from Homework 2 as the basis for my level 1 wire-frame design.

## Project Description and Usage
The project itself is an infinite runner style game were the user controls a car that drives through an infinite canyon. The user must use the the arrow keys to move through the canyon and avoid the obstacles in the form of green bushes. The pressing the "r" key resets the car back to the beginning of the canyon.

Starting Position:

<img width="1915" height="943" alt="familiar_objects" src="https://github.com/user-attachments/assets/fabe3480-ac45-4a66-b08d-1659d0cc4f5a" />

Up Arrow Key pressed:

<img width="1911" height="1031" alt="up_arrow" src="https://github.com/user-attachments/assets/45f91e15-055d-4c44-8a9b-5c788f317b91" />

Right Arrow Key pressed:

<img width="1912" height="1026" alt="right_arrow" src="https://github.com/user-attachments/assets/df242d17-a300-46ef-b48d-4b423faf19d9" />

Left Arrow Key pressed:

<img width="1907" height="1027" alt="left_arrow" src="https://github.com/user-attachments/assets/882e0e4a-21ed-48c4-80c6-68664196ddd8" />

Down Arrow Key pressed:

<img width="1908" height="1026" alt="down_arrow" src="https://github.com/user-attachments/assets/61f91677-05fe-42d8-a633-080f424a813a" />

"r" Key pressed:

<img width="1915" height="943" alt="familiar_objects" src="https://github.com/user-attachments/assets/4e5c3a27-e246-43e9-aa8d-d801b2630317" />

The user can also select the different levels of graphics with the drop-down selector at the top right of the screen. Changing the graphics level via the drop-down opens a new tab with new graphics level rendered.

Graphics Level 1:

<img width="1915" height="943" alt="familiar_objects" src="https://github.com/user-attachments/assets/1b2ef143-ff1d-4371-8869-f9c220569251" />

Graphics Level 2:

<img width="1912" height="1031" alt="image" src="https://github.com/user-attachments/assets/a94eba2d-553f-4345-b5f7-29cae87b32ab" />

Graphics Level 3:

<img width="1911" height="1029" alt="image" src="https://github.com/user-attachments/assets/d3bd372d-3410-4423-9f30-da4897140eb6" />

The controls and other features all remain the same on each level of graphics.

## Implementation Documentation and Course Concept Connection
This project was implemented entirely in HTML, CSS, and JavaScript, with JavaScript serving as its core runner. 

It is based of the template code we received in our second homework assignment where we drew a simple line art cube that can be moved around screen.
<img width="1912" height="1023" alt="image" src="https://github.com/user-attachments/assets/3f45f794-0ff2-4129-b195-7ac5bdedae5e" />

I stretched the original cube and removed its top edges in order to create a single segment of the canyon in the function "render_canyon(cameraZ)", each segment is 4 units deep. 
The same canyon segment is then scaled down by "const scale = 1 / (1 + seg * 0.08);" rendered directly in front of the camera as the camera's position is adjusted. Since each segment is smaller the the previous, I also render small connector edges in between so that the lines touch via "[prevBase + 4, baseIdx + 0]".
The car and bush objects also receive the same treatment where they are also gradually scaled down as the camera moves to create the infinite, shrinking into the distance effect.

Every object in graphics level 1 and 2 defined as an array containing sets of 3D vertices and edges. The vertices are first adjusted for the camera's position by subtracting the camera's coordinates from each vertex's coordinates. The vertices are then projected from 3D x, y, z coordinates into 2D u, v coordinates using the equations x/z and y/z derived in class. A line is then drawn between these two final vertices using JavaScript's native canvas line drawing functions. 

This only changes slightly in Graphics Level 2 where the coordinate projection and camera adjustment process remains the same while the line draw function changes. In this level we use a much lower resolution canvas and draw each line pixel by pixel via pseudo code from class:
<img width="438" height="255" alt="image" src="https://github.com/user-attachments/assets/02fc3c1b-2b77-4c28-b307-cb01c5e5b8fb" />

Note: a few adjustments had to made to this pseudo-code to account for the infinite canyon and object rendering, but the basic principle remains the same.

In both levels the sun and horizon line are static objects and never move. As such, they do not go through the above projection and adjustment process and are simply drawn directly onto the screen.

The implementation is completely different in Graphics Level 3. Here every object that needs to be rendered is split into triangles. The barycentric coordinates are then calculated for every pixel inside these triangles via "const w0 = triangle_area(center, b, c) / totalArea;", etc. and then colored in based on whether or not they fall inside the triangle.

The key press listeners are also adjusted to allow users to press multiple keys at once via tracking the press and release of each key and then calling "update_movement()".

The original HTML and CSS from Homework1 remain unchanged with the only addition being the script tag at the bottom of each HTML file which contains the listeners and links for the graphics level selector drop down.

## Future Plans
As this project continues development I plan to add the following features to create a more cohesive feel:

1. Collision Detection:
   Currently the car can phase through both the bushes and canyon walls. Adding collision detection will make it more obvious when the car touches another object.
   <img width="1911" height="1031" alt="up_arrow" src="https://github.com/user-attachments/assets/680b7b39-713d-47f7-ba0c-f55d065f00c2" />
   <img width="1908" height="1024" alt="image" src="https://github.com/user-attachments/assets/93b6cff1-e045-4e25-9861-d4d0444fe0f6" />

3. Enhanced Graphics:
   Currently the sky as well as the surrounding terrain remain uncolored. I plan to add some textures to both these areas as well as creating some kind of road texture on the canyon floor for the car to follow:
   <img width="1913" height="1027" alt="image" src="https://github.com/user-attachments/assets/9ff82bdc-90ca-4995-a781-5ef61eb53253" />

5. Points Tracking:
   Successfully avoiding obstacles does not actually impact the user in any way. Adding some kind of points tracking will help make the project more engaging.
   <img width="1913" height="1022" alt="image" src="https://github.com/user-attachments/assets/bc98b39c-c3dc-410a-a3a0-b17cd914fdb5" />


## Demo Video
https://github.com/user-attachments/assets/36870051-f942-4d12-bcd6-196b0f8f7d89


