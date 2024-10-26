'use strict';
import { get_shader, init_shaders } from './shaders.js';

const [vertex_shader, fragment_shader] = [
	'shaders/teapot/vertex-shader.glsl',
	'shaders/teapot/fragment-shader.glsl'
].map(get_shader);

let canvas;
let gl;
let program

let index = 0;

const pointsArray = [];
const normalsArray = [];

let points;
let normals;

let movement = false; // Do we rotate?
let spinX = 0;
let spinY = 0;
let origX;
let origY;

let zDist = -4.0;

const fovy = 60.0;
const near = 0.2;
const far = 100.0;

const lightPosition = vec4(10.0, 10.0, 10.0, 1.0);
const lightAmbient = vec4(1.0, 1.0, 1.0, 1.0);
const lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
const lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);

const materialAmbient = vec4(0.2, 0.0, 0.2, 1.0);
const materialDiffuse = vec4(1.0, 0.8, 0.0, 1.0);
const materialSpecular = vec4(1.0, 1.0, 1.0, 1.0);
const materialShininess = 50.0;

let ctm;
let ambientColor, diffuseColor, specularColor;

let modelViewMatrix, projectionMatrix;
let modelViewMatrixLoc, projectionMatrixLoc;

let normalMatrix, normalMatrixLoc;

let eye;
let at = vec3(0.0, 0.0, 0.0);
let up = vec3(0.0, 1.0, 0.0);

export async function init() {

	canvas = document.querySelector("#teapot-canvas");

	gl = WebGLUtils.setupWebGL(canvas);
	if (!gl) { alert("WebGL isn't available"); }

	gl.viewport(0, 0, canvas.width, canvas.height);
	gl.clearColor(0.9, 1.0, 1.0, 1.0);

	gl.enable(gl.DEPTH_TEST);
	//gl.enable(gl.CULL_FACE);
	//gl.cullFace(gl.BACK);


	const myTeapot = teapot(15);
	myTeapot.scale(0.5, 0.5, 0.5);

	console.log(myTeapot.TriangleVertices.length);

	points = myTeapot.TriangleVertices;
	normals = myTeapot.Normals;

	program = await init_shaders(gl, await vertex_shader, await fragment_shader);
	gl.useProgram(program);


	const ambientProduct = mult(lightAmbient, materialAmbient);
	const diffuseProduct = mult(lightDiffuse, materialDiffuse);
	const specularProduct = mult(lightSpecular, materialSpecular);

	const nBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW);

	const vNormal = gl.getAttribLocation(program, "vNormal");
	gl.vertexAttribPointer(vNormal, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vNormal);

	const vBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

	const vPosition = gl.getAttribLocation(program, "vPosition");
	gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vPosition);

	modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
	projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");
	normalMatrixLoc = gl.getUniformLocation(program, "normalMatrix");

	projectionMatrix = perspective(fovy, 1.0, near, far);
	gl.uniformMatrix4fv(
		projectionMatrixLoc,
		false,
		flatten(projectionMatrix)
	);

	gl.uniform4fv(
		gl.getUniformLocation(program, "ambientProduct"),
		flatten(ambientProduct)
	);
	gl.uniform4fv(
		gl.getUniformLocation(program, "diffuseProduct"),
		flatten(diffuseProduct)
	);
	gl.uniform4fv(
		gl.getUniformLocation(program, "specularProduct"),
		flatten(specularProduct)
	);
	gl.uniform4fv(
		gl.getUniformLocation(program, "lightPosition"),
		flatten(lightPosition)
	);
	gl.uniform1f(
		gl.getUniformLocation(program, "shininess"),
		materialShininess
	);

	//event listeners for mouse
	canvas.addEventListener("mousedown", function(e){
		movement = true;
		origX = e.clientX;
		origY = e.clientY;
		e.preventDefault(); // Disable drag and drop
	});

	canvas.addEventListener("mouseup", function(e){
		movement = false;
	});

	canvas.addEventListener("mousemove", function(e){
		if(movement) {
			spinY = (spinY + (origX - e.clientX)) % 360;
			spinX = (spinX + (origY - e.clientY)) % 360;
			origX = e.clientX;
			origY = e.clientY;
		}
	});

	// Event listener for mousewheel
	window.addEventListener("wheel", function(e){
		if(e.deltaY > 0.0) {
			zDist += 0.2;
		} else {
			zDist -= 0.2;
		}
	});

	render();
}


function render() {

	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	modelViewMatrix = lookAt(vec3(0.0, 0.0, zDist), at, up);
	modelViewMatrix = mult(modelViewMatrix, rotateY(-spinY));
	modelViewMatrix = mult(modelViewMatrix, rotateX(spinX));

	normalMatrix = [
		vec3(modelViewMatrix[0][0], modelViewMatrix[0][1], modelViewMatrix[0][2]),
		vec3(modelViewMatrix[1][0], modelViewMatrix[1][1], modelViewMatrix[1][2]),
		vec3(modelViewMatrix[2][0], modelViewMatrix[2][1], modelViewMatrix[2][2])
	];
	normalMatrix.matrix = true;

	gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
	gl.uniformMatrix3fv(normalMatrixLoc, false, flatten(normalMatrix));

	gl.drawArrays(gl.TRIANGLES, 0, points.length);
	window.requestAnimFrame(render);
}
