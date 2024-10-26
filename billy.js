'use strict';
import { get_shader, init_shaders } from './shaders.js';

const [vertex_shader, fragment_shader] = [
	'shaders/billy/vertex-shader.glsl',
	'shaders/billy/fragment-shader.glsl'
].map(get_shader);

let canvas;
let gl;
let program = null;

const numVertices = 36;

const pointsArray = [];
const normalsArray = [];

let movement = false; // Do we rotate?
let spinX = 0;
let spinY = 0;
let origX;
let origY;

let zDist = -3.0;

var fovy = 50.0;
var near = 0.2;
var far = 100.0;

var va = vec4(0.0, 0.0, -1.0,1);
var vb = vec4(0.0, 0.942809, 0.333333, 1);
var vc = vec4(-0.816497, -0.471405, 0.333333, 1);
var vd = vec4(0.816497, -0.471405, 0.333333,1);

const light = {
	position: vec4(1.0, 1.0, 1.0, 0.0),
	ambient: vec4(0.2, 0.2, 0.2, 1.0),
	diffuse: vec4(1.0, 1.0, 1.0, 1.0),
	specular: vec4(1.0, 1.0, 1.0, 1.0)
};

const material = {
	ambient: vec4(1.0, 0.0, 1.0, 1.0),
	diffuse: vec4(1.0, 0.8, 0.0, 1.0),
	specular: vec4(1.0, 1.0, 1.0, 1.0),
	shininess: 150.0
};

let ctm;
let ambientColor, diffuseColor, specularColor;

let mv, projectionMatrix;
let modelViewMatrixLoc, projectionMatrixLoc;

let normalMatrix, normalMatrixLoc;

let at = vec3(0.0, 0.0, 0.0);
let up = vec3(0.0, 1.0, 0.0);

export async function init() {
	const canvas = document.querySelector('#billy-canvas');
	gl = WebGLUtils.setupWebGL(canvas);
	if (!gl) { alert("WebGL isn't available"); }

	gl.viewport(0, 0, canvas.width, canvas.height);
	gl.clearColor(0.9, 1.0, 1.0, 1.0);
	gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL);

	const dypi = gl.getParameter(gl.DEPTH_BITS);
	const gildi = gl.getParameter(gl.DEPTH_CLEAR_VALUE);
	const bil = gl.getParameter(gl.DEPTH_RANGE);
	//gl.enable(gl.CULL_FACE);
	//gl.cullFace(gl.BACK);

	//
	// Load shaders and initialize attribute buffers
	//
	program = await init_shaders(gl, await vertex_shader, await fragment_shader);
	gl.useProgram(program);

	const ambientProduct = mult(light.ambient, material.ambient);
	const diffuseProduct = mult(light.diffuse, material.diffuse);
	const specularProduct = mult(light.specular, material.specular);

	normalCube();

	const nBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW);

	const  vNormal = gl.getAttribLocation(program, "vNormal");
	gl.vertexAttribPointer(vNormal, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vNormal);

	const vBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

	const  vPosition = gl.getAttribLocation(program, "vPosition");
	gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vPosition);

	modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
	projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");
	normalMatrixLoc = gl.getUniformLocation(program, "normalMatrix");

	projectionMatrix = perspective(fovy, 1.0, near, far);

	gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"), flatten(ambientProduct));
	gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"), flatten(diffuseProduct));
	gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"), flatten(specularProduct));	
	gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), flatten(light.position));
	gl.uniform1f(gl.getUniformLocation(program, "shininess"), material.shininess);

	//event listeners for mouse
	canvas.addEventListener("mousedown", function(e){
		movement = true;
		origX = e.clientX;
		origY = e.clientY;
		e.preventDefault();					// Disable drag and drop
	});

	canvas.addEventListener("mouseup", function(e){
		movement = false;
	});

	canvas.addEventListener("mousemove", function(e){
		if(movement) {
			spinY = (spinY + (e.clientX - origX)) % 360;
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
	}	);	 

	render();
}


function normalCube()
	{
		quad(1, 0, 3, 2, 0);
		quad(2, 3, 7, 6, 1);
		quad(3, 0, 4, 7, 2);
		quad(6, 5, 1, 2, 3);
		quad(4, 5, 6, 7, 4);
		quad(5, 4, 0, 1, 5);
	}

function quad(a, b, c, d, n) 
	{
		var vertices = [
			vec4(-0.5, -0.5,	 0.5, 1.0),
			vec4(-0.5,	 0.5,	 0.5, 1.0),
			vec4(	 0.5,	 0.5,	 0.5, 1.0),
			vec4(	 0.5, -0.5,	 0.5, 1.0),
			vec4(-0.5, -0.5, -0.5, 1.0),
			vec4(-0.5,	 0.5, -0.5, 1.0),
			vec4(	 0.5,	 0.5, -0.5, 1.0),
			vec4(	 0.5, -0.5, -0.5, 1.0)
		];

		var faceNormals = [
			vec4(0.0, 0.0,	 1.0, 0.0),	// front
			vec4(	 1.0, 0.0, 0.0, 0.0),	// right
			vec4(0.0, -1.0, 0.0, 0.0),	// down
			vec4(0.0,	1.0, 0.0, 0.0),	// up
			vec4(0.0, 0.0, -1.0, 0.0),	// back
			vec4(-1.0, 0.0, 0.0, 0.0)		// left
		];

		// We need to partition the quad into two triangles in order for
		// WebGL to be able to render it.	 In this case, we create two
		// triangles from the quad indices
		//fece normals assigned using the parameter n
		var indices = [ a, b, c, a, c, d ];

		for (var i = 0; i < indices.length; ++i) {
			pointsArray.push(vertices[indices[i]]);
			normalsArray.push(faceNormals[n]);
		}
	}


function render() {
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	mv = lookAt(vec3(0.0, 0.0, zDist), at, up);
	mv = mult(mv, rotateX(spinX));
	mv = mult(mv, rotateY(spinY));

	// normal matrix only really need if there is nonuniform scaling
	// it's here for generality but since there is
	// no scaling in this example we could just use modelView matrix in shaders
	normalMatrix = [
		vec3(mv[0][0], mv[0][1], mv[0][2]),
		vec3(mv[1][0], mv[1][1], mv[1][2]),
		vec3(mv[2][0], mv[2][1], mv[2][2])
	];
	normalMatrix.matrix = true;
	gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(mv));
	gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));
	gl.uniformMatrix3fv(normalMatrixLoc, false, flatten(normalMatrix));
	// gl.drawArrays(gl.TRIANGLES, 0, NumVertices);

	const thickness = 0.02;
	const depth = 0.28;
	const width = 0.80;
	const height = 1.06;
	const internal_depth = 0.26;
	const internal_width = 0.76 + 0.01;
	const internal_height = 0.96;
	const foot_height = 0.09;

	const side = scalem(thickness, height, depth);
	const shelf = scalem(internal_width, thickness, depth);
	const backside = scalem(width, height, 0.005);

	// Right side
	gl.uniformMatrix4fv(
		modelViewMatrixLoc,
		false,
		flatten(
			mult(mult(mv, translate(-((width - thickness / 2) / 2), 0.0, 0.0)), side)
		)
	);
	gl.drawArrays(gl.TRIANGLES, 0, numVertices);

	// Left side
	gl.uniformMatrix4fv(
		modelViewMatrixLoc,
		false,
		flatten(
			mult(mult(mv, translate(((width - thickness / 2) / 2), 0.0, 0.0)), side)
		)
	);
	gl.drawArrays(gl.TRIANGLES, 0, numVertices);

	// Lower shelf
	gl.uniformMatrix4fv(
		modelViewMatrixLoc,
		false,
		flatten(
			mult(
				mult(mv, translate(0, -0.15, 0)),
				shelf
			)
		)
	);
	gl.drawArrays(gl.TRIANGLES, 0, numVertices);

	// Upper shelf
	gl.uniformMatrix4fv(
		modelViewMatrixLoc,
		false,
		flatten(
			mult(
				mult(mv, translate(0, 0.15, 0)),
				shelf
			)
		)
	);
	gl.drawArrays(gl.TRIANGLES, 0, numVertices);

	// Bottom shelf
	gl.uniformMatrix4fv(
		modelViewMatrixLoc,
		false,
		flatten(
			mult(
				mult(mv, translate(0, -((height / 2) - foot_height), 0)),
				shelf
			)
		)
	);
	gl.drawArrays(gl.TRIANGLES, 0, numVertices);

	// Top
	gl.uniformMatrix4fv(
		modelViewMatrixLoc,
		false,
		flatten(
			mult(
				mult(mv, translate(0, ((height / 2) - thickness / 2), 0)),
				shelf
			)
		)
	);
	gl.drawArrays(gl.TRIANGLES, 0, numVertices);

	// Backside
	gl.uniformMatrix4fv(
		modelViewMatrixLoc,
		false,
		flatten(
			mult(
				mult(mv, translate(0, 0, (depth / 2))),
				backside
			)
		)
	);
	gl.drawArrays(gl.TRIANGLES, 0, numVertices);

	gl.uniformMatrix4fv(
		modelViewMatrixLoc,
		false,
		flatten(
			mult(
				mult(mv, translate(0, -((height / 2) - (foot_height / 2)), -((depth / 2) - 0.02))),
				scalem(internal_width, foot_height, thickness)
			)
		)
	);
	gl.drawArrays(gl.TRIANGLES, 0, numVertices);

	window.requestAnimFrame(render);
}
