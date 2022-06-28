'use strict'

const canvas = document.querySelector('canvas');
const gl = canvas.getContext('webgl');

if (!gl) {
    throw new Error('Error, WebGL not supported');
}

//set the vertex data

const vertexData = [
    // Front face
    -1.0, -1.0, 1.0,
    1.0, -1.0, 1.0,
    1.0, 1.0, 1.0, -1.0, -1.0, 1.0,
    1.0, 1.0, 1.0, -1.0, 1.0, 1.0,

    // Back face
    -1.0, -1.0, -1.0, -1.0, 1.0, -1.0,
    1.0, 1.0, -1.0, -1.0, -1.0, -1.0,
    1.0, 1.0, -1.0,
    1.0, -1.0, -1.0,

    // Top face
    -1.0, 1.0, -1.0, -1.0, 1.0, 1.0,
    1.0, 1.0, 1.0, -1.0, 1.0, -1.0,
    1.0, 1.0, 1.0,
    1.0, 1.0, -1.0,

    // Bottom face
    -1.0, -1.0, -1.0,
    1.0, -1.0, -1.0,
    1.0, -1.0, 1.0, -1.0, -1.0, -1.0,
    1.0, -1.0, 1.0, -1.0, -1.0, 1.0,

    // Right face
    1.0, -1.0, -1.0,
    1.0, 1.0, -1.0,
    1.0, 1.0, 1.0,
    1.0, -1.0, -1.0,
    1.0, 1.0, 1.0,
    1.0, -1.0, 1.0,

    // Left face
    -1.0, -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, -1.0,
];

//initialize buffer to send the data to the GPU

const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexData), gl.STATIC_DRAW);

//set the color data

function randomColor() {
    return [Math.random(), Math.random(), Math.random()];
};

const colorData = [];
for (let i = 0; i < 6; i++) {
    let faceColor = randomColor();
    for (let y = 0; y < 6; y++) {
        colorData.push(...faceColor);
    }
}

const colorBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colorData), gl.STATIC_DRAW);

//add shaders

const vertexShader = gl.createShader(gl.VERTEX_SHADER);
gl.shaderSource(vertexShader, `
precision mediump float;
attribute vec3 position;   //attributes are defined in vertex shader source code
attribute vec3 color;
varying vec3 vColor;        //calculates the values inbetween vertecies
uniform mat4 matrix;        //a global variable, has the same value in the shader program and in JS

void main(){
    gl_Position = matrix * vec4(position, 1);  //matrix values manipulate the vertex positions
    vColor = color;
}`);
gl.compileShader(vertexShader);

const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(fragmentShader, `
precision mediump float;
varying vec3 vColor;

void main() {
    gl_FragColor = vec4(vColor, 1);
}`);
gl.compileShader(fragmentShader);

//create program

const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);

//enable attributes

const positionLocation = gl.getAttribLocation(program, `position`);
gl.enableVertexAttribArray(positionLocation);
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);

const colorLocation = gl.getAttribLocation(program, `color`);
gl.enableVertexAttribArray(colorLocation);
gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false, 0, 0);

//draw vertecies

gl.useProgram(program);
gl.enable(gl.DEPTH_TEST);

//get uniform location

const uniformLocation = {
    matrix: gl.getUniformLocation(program, 'matrix')
};

//create transformation matrix 

const { mat4 } = glMatrix;
const matrix = mat4.create();

//create perspective projection matrix

const projectionMatrix = mat4.create();
mat4.perspective(projectionMatrix, Math.PI / 2, canvas.width / canvas.height, 1e-4, 1e4);

//combine the perspective matrix and the transformatin matrix and upload it to the shader program

const resultMatrix = mat4.create();


//input transformation (translating, scaling, rotating) data

mat4.translate(matrix, matrix, [0.3, 0.3, -1]);
mat4.scale(matrix, matrix, [0.3, 0.3, 0.3]);

//animate rotation

function animate() {
    requestAnimationFrame(animate);
    mat4.rotateX(matrix, matrix, Math.PI / 2 / 80);
    mat4.rotateZ(matrix, matrix, Math.PI / 2 / 80);
    mat4.multiply(resultMatrix, projectionMatrix, matrix); //order matters
    gl.uniformMatrix4fv(uniformLocation.matrix, false, resultMatrix);
    gl.drawArrays(gl.TRIANGLES, 0, vertexData.length / 3);
}

animate();