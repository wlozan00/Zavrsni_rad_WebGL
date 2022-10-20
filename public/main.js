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
     1.0,  1.0, 1.0,
    -1.0, -1.0, 1.0,
     1.0,  1.0, 1.0, 
    -1.0,  1.0, 1.0,
    // Back face
    -1.0, -1.0, -1.0,
    -1.0,  1.0, -1.0,
     1.0,  1.0, -1.0,
    -1.0, -1.0, -1.0,
     1.0,  1.0, -1.0,
     1.0, -1.0, -1.0,
    // Top face
    -1.0, 1.0, -1.0,
    -1.0, 1.0,  1.0,
     1.0, 1.0,  1.0,
    -1.0, 1.0, -1.0,
     1.0, 1.0,  1.0,
     1.0, 1.0, -1.0,
    // Bottom face
    -1.0, -1.0, -1.0,
     1.0, -1.0, -1.0,
     1.0, -1.0,  1.0,
    -1.0, -1.0, -1.0,
     1.0, -1.0,  1.0, 
    -1.0, -1.0,  1.0,
    // Right face
    1.0, -1.0, -1.0,
    1.0,  1.0, -1.0,
    1.0,  1.0,  1.0,
    1.0, -1.0, -1.0,
    1.0,  1.0,  1.0,
    1.0, -1.0,  1.0,
    // Left face
    -1.0, -1.0, -1.0,
    -1.0, -1.0,  1.0, 
    -1.0,  1.0,  1.0, 
    -1.0, -1.0, -1.0, 
    -1.0,  1.0,  1.0, 
    -1.0,  1.0, -1.0,
];

//Construct an Array by repeating a pattern n times

function repeat(n, pattern) {
    return [...Array(n)].reduce(sum => sum.concat(pattern), []);
}

//add the uv texture coordinates
const uvData = repeat(6, [
    0, 0,
    1, 0,
    1, 1,
    
    0, 0,
    1, 1,
    0, 1,
]);

//add the normal data coordinates
const normalData = [
    ...repeat(6, [ 0, 0, 1]),
    ...repeat(6, [ 0, 0,-1]),
    ...repeat(6, [ 0, 1, 0]),
    ...repeat(6, [ 0,-1, 0]),
    ...repeat(6, [ 1, 0, 0]),
    ...repeat(6, [-1, 0, 0]),
];

//initialize buffer to send the data to the GPU

const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexData), gl.STATIC_DRAW);

const uvBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvData), gl.STATIC_DRAW);

const normalBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normalData), gl.STATIC_DRAW);

//load a texture image

function loadTexture (url) {
    const texture = gl.createTexture();
    const image = new Image();

    image.onload = e => {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

        if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
            gl.generateMipmap(gl.TEXTURE_2D);
        }
        else {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        }

        function isPowerOf2 (value) {
            return value & (value -1) === 0;
        }
    }

    image.src = url;
    return texture;
}
const crate = loadTexture('cratetex.png');
gl.activeTexture(gl.TEXTURE0);
gl.bindTexture(gl.TEXTURE_2D, crate);

//add shaders

const vertexShader = gl.createShader(gl.VERTEX_SHADER);
gl.shaderSource(vertexShader, `
precision mediump float;
const vec3 lightDirection = normalize(vec3(-1, 0.8, 0.1));
const float ambient = 0.4;

attribute vec3 position;   
attribute vec2 UV;
attribute vec3 normal;

varying vec2 vUV;
varying float vBrightness;

uniform mat4 matrix;
uniform mat4 normalMatrix;

void main(){
    vec3 worldNormal = (normalMatrix * vec4(normal, 1.0)).xyz;
    float diffuse = max(0.0, dot(worldNormal, lightDirection));

    vBrightness = diffuse + ambient;
    vUV = UV;
    gl_Position = matrix * vec4(position, 1);
}`);
gl.compileShader(vertexShader);

const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(fragmentShader, `
precision mediump float;

varying vec2 vUV;
varying float vBrightness;

uniform sampler2D textureID;

void main() {
    vec4 texel = texture2D(textureID, vUV);
    texel.xyz *= vBrightness;
    gl_FragColor = texel;
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

const uvLocation = gl.getAttribLocation(program, `UV`);
gl.enableVertexAttribArray(uvLocation);
gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
gl.vertexAttribPointer(uvLocation, 2, gl.FLOAT, false, 0, 0);

const normalLocation = gl.getAttribLocation(program, `normal`);
gl.enableVertexAttribArray(normalLocation);
gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 0, 0);

//draw vertecies

gl.useProgram(program);
gl.enable(gl.DEPTH_TEST);

//get uniform location

const uniformLocation = {
    matrix: gl.getUniformLocation(program, 'matrix'),
    normalMatrix: gl.getUniformLocation(program, 'normalMatrix'),
    textureID: gl.getUniformLocation(program, 'textureID'),
};

//get the texture uniform

gl.uniform1i(uniformLocation.textureID, 0);

//create matrices 

const { mat4 } = glMatrix;
const modelMatrix = mat4.create();

mat4.translate(modelMatrix, modelMatrix, [0.3, 0, -1]);
mat4.scale(modelMatrix, modelMatrix, [0.3, 0.3, 0.3]);

const viewMatrix = mat4.create();

const projectionMatrix = mat4.create();
mat4.perspective(projectionMatrix, Math.PI / 2, canvas.width / canvas.height, 1e-4, 1e4);

const mvMatrix = mat4.create();
const mvpMatrix = mat4.create();

const normalMatrix = mat4.create();

//animate rotation

function animate() {
    requestAnimationFrame(animate);
    mat4.rotateX(modelMatrix, modelMatrix, Math.PI / 2 / 180);
    mat4.rotateY(modelMatrix, modelMatrix, Math.PI / 2 / 180);
    
    mat4.multiply(mvMatrix, viewMatrix, modelMatrix);
    mat4.multiply(mvpMatrix, projectionMatrix, mvMatrix);
    
    mat4.invert(normalMatrix, mvMatrix);
    mat4.transpose(normalMatrix, normalMatrix);
    
    gl.uniformMatrix4fv(uniformLocation.matrix, false, mvpMatrix);
    gl.uniformMatrix4fv(uniformLocation.normalMatrix, false, normalMatrix);
    
    gl.drawArrays(gl.TRIANGLES, 0, vertexData.length / 3);
}

animate();