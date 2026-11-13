#version 300 es

layout(location = 0) in vec3 a_coords;

// o domo acompanha a posição da câmera (mas não gira com ela),
// então nunca dá para chegar perto do céu
uniform mat4 u_view;
uniform mat4 u_projection;
uniform vec3 u_cameraPosition;
uniform vec3 u_sunDirection;
uniform bool u_sunPass;

// direção do centro do domo até o vértice
out vec3 v_direction;

void main() {
    v_direction = a_coords;
    vec3 position = u_sunPass
        ? a_coords * 0.022 + normalize(u_sunDirection) * 40.0
        : a_coords;
    gl_Position = u_projection * u_view * vec4(position + u_cameraPosition, 1.0);
}
