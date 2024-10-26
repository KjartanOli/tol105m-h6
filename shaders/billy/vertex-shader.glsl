attribute vec4 vPosition;
attribute vec4 vNormal;
varying vec3 N, L, E;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform vec4 lightPosition;
uniform mat3 normalMatrix;

void main()
{
	vec3 pos = (modelViewMatrix * vPosition).xyz;

	// check for directional light
	if(lightPosition.w == 0.0)
		L = normalize(lightPosition.xyz);
	else
		L = normalize( lightPosition.xyz - pos );

	E = -normalize(pos);
	N = normalize(normalMatrix*vNormal.xyz);

	gl_Position = projectionMatrix * modelViewMatrix * vPosition;
}
