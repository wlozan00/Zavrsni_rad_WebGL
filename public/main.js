'use strict'

const canvas = document.querySelector('canvas');
const gl = canvas.getContext('webgl');

if (!gl) {
    throw new Error('Error, WebGL not supported');
}

//set the vertex data

const vertexData = [
    0, 0.8, 0,
    0.8, -0.8, 0, -0.8, -0.8, 0
];

//initialize buffer to send the data to the GPU

const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexData), gl.STATIC_DRAW);

const colorData = [
    1, 0, 0,
    0, 1, 0,
    0, 0, 1
];

const colorBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colorData), gl.STATIC_DRAW);

//add shaders

const vertexShader = gl.createShader(gl.VERTEX_SHADER);
gl.shaderSource(vertexShader, `
precision mediump float;
attribute vec3 position;   //attributes are defined in vertex shader source code
attribute vec3 color;
varying vec3 vColor;
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

//draw vertex

gl.useProgram(program);

//get uniform location

const uniformLocation = {
    matrix: gl.getUniformLocation(program, 'matrix')
};

//create matrix

const { mat4 } = glMatrix;
const matrix = mat4.create();

//input transformation (translating, scaling, rotating) data

mat4.translate(matrix, matrix, [0.4, 0.4, 0.4]);
mat4.scale(matrix, matrix, [0.6, 0.6, 0.6]);

//animate rotation

function animate() {
    requestAnimationFrame(animate);
    mat4.rotateY(matrix, matrix, Math.PI / 2 / 50);
    gl.uniformMatrix4fv(uniformLocation.matrix, false, matrix);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
}

animate();