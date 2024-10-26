precision mediump float;

uniform vec4 ambientProduct;
uniform vec4 diffuseProduct;
uniform vec4 specularProduct;
uniform float shininess;
uniform float discardLength;
varying vec3 N, L, E;

void main()
{
	vec4 fColor;

	vec3 H = normalize(L + E);

	vec4 ambient = ambientProduct;
	vec4 diffuse = max( dot(L, N), 0.0 ) * diffuseProduct;
	vec4 specular = specularProduct * pow(max(dot(N, H), 0.0), shininess );

	if(dot(L, N) < 0.0)
		specular = vec4(0.0, 0.0, 0.0, 1.0);


	// Throw away if too bright:
	vec4 color = ambient + diffuse + specular;
	color.a = 1.0;

	if(length(color) > discardLength)
		discard;
	else
		gl_FragColor = color;

}
