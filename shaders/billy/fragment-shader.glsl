precision mediump float;

uniform vec4 ambientProduct;
uniform vec4 diffuseProduct;
uniform vec4 specularProduct;
uniform float shininess;
varying vec3 N, L, E;

void main()
{

	vec4 fColor;

	vec3 H = normalize( normalize(L) + normalize(E) );
	vec4 ambient = ambientProduct;

	float Kd = max( dot(normalize(L), normalize(N)), 0.0 );
	vec4 diffuse = Kd*diffuseProduct;

	float Ks = pow( max(dot(normalize(N), H), 0.0), shininess );
	vec4 specular = Ks * specularProduct;

	if(dot(normalize(L), normalize(N)) < 0.0) specular = vec4(0.0, 0.0, 0.0, 1.0);

	fColor = ambient + diffuse +specular;
	fColor.a = 1.0;

	gl_FragColor = fColor;
}
