const canvas = document.querySelector('canvas');
//A canvas context is an object with properties and methods that you can use to render graphics inside the canvas element
const gl = canvas.getContext('webgl'); //method returns a rendering context on the canvas

if (!gl) {
    throw new Error('Error, WebGL not supported');
}

const vertexData = [
    0, 1, 0, -1, -1, 0,
    1, -1, 0
];

const colorData = [
    1, 0, 0,
    0, 1, 0,
    0, 0, 1
];

//Creating a buffer to send data to the GPU
//gl.ARRAY_BUFFER - Buffer containing vertex attributes, such as vertex coordinates, texture coordinate data, or vertex color data.

const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer); //bindBuffer(target, buffer)
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexData), gl.STATIC_DRAW); //initializes and creates the buffer objects data store

const colorBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colorData), gl.STATIC_DRAW);

//The GPU begins by reading each selected vertex out of the vertex buffer and running it through the vertex shader
//Attributes are used to specify how to pull data out of your buffers and provide them to your vertex shader.
const vertexShader = gl.createShader(gl.VERTEX_SHADER);
//In WebGL, values that apply to a specific vertex are stored in attributes
gl.shaderSource(vertexShader, `
precision mediump float;  
attribute vec3 position;
attribute vec3 color;
varying vec3 vColor;    
uniform mat4 matrix;

void main() {
    vColor = color;
    gl_Position = vec4(position, 1);
}`);
gl.compileShader(vertexShader); //compiles a GLSL shader into binary data so that it can be used by a WebGLProgram.

const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(fragmentShader, `
precision mediump float;
varying vec3 vColor;

void main() {
    gl_FragColor = vec4(vColor, 1);
}`);
gl.compileShader(fragmentShader);

const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);

//returns the location of an attribute variable in a given WebGL program
const positionLocation = gl.getAttribLocation(program, 'position');
//turns on the generic vertex attribute array at the specified index into the list of attribute arrays
// in other words it enables individual attributes so that they can be used
gl.enableVertexAttribArray(positionLocation); //Attributes are referenced by an index number into the list of attributes maintained by the GPU

gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer); //Need to rebind buffer incase there are more information buffers

//binds the buffer curently boudn to a gl_ARRAY_BUFFER to a generic vertex attribute of the current vertex buffer object and
//specifies its layout (order in wich attributes are stored and what data type they are in)
gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);

const colorLocation = gl.getAttribLocation(program, `color`);
gl.enableVertexAttribArray(colorLocation);
gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false, 0, 0);

gl.useProgram(program); //creates an executable program on the graphics card

gl.enable(gl.DEPTH_TEST) //If enabled, do depth comparisons and update the depth buffer. 
    //Note that even if the depth buffer exists and the depth mask is non-zero, the depth buffer is not updated if the depth test is disabled. 

//a matrix stores transformations and replays them on to any number of verticies
//you can only do this after the useProgram() method

const { mat4 } = glMatrix; //object destruction
const matrix = mat4.create(); //array elements 12, 13, 14 (x, y, z) tell where the vertex currently is - translation coordinates
//aray elements 0, 1, 2, 4, 5, 6, 8, 9, 10 collectively represent the rotation of the object
const uniformLocation = {
    matrix: gl.getUniformLocation(program, 'matrix') //returns the location of a specific uniform variable 
}

mat4.translate(matrix, matrix, [0.5, 0.3, 0]); //transforms vertex position
mat4.scale(matrix, matrix, [0.5, 0.5, 0.5]); //transforms vertex size
console.log(matrix);

function rotate_triangle() {
    //tells the browser you wish to perform an animation and request that the browser
    //calls a speicfied function to update an animation before the next repaint
    //the callback is invoked before the repaint
    //CPU friendly
    requestAnimationFrame(rotate_triangle);

    mat4.rotateY(matrix, matrix, Math.PI / 2 / 70);
    gl.uniformMatrix4fv(uniformLocation.matrix, false, matrix); //specifies matrix values for uniform variables
    gl.drawArrays(gl.TRIANGLES, 0, 3); //when changing the math of your object you have to tell it to rerender
};

rotate_triangle();
//the transformations applied to the matrix are replayed on the vertex in the reverse order
//rotate and scale before translations (in reverse)


gl.drawArrays(gl.TRIANGLES, 0, 3); //executes shaders on the GPU