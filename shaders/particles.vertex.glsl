#version 300 es

layout(location = 0) in vec3 a_position;
layout(location = 1) in vec3 a_params;

uniform mat4 u_view;
uniform mat4 u_projection;
uniform float u_pointScale;
uniform float u_maxPointSize;

out vec3 v_worldPos;
out float v_alpha;
out float v_steam;

void main() {
    vec4 eye = u_view * vec4(a_position, 1.0);
    gl_Position = u_projection * eye;
    gl_PointSize = clamp(a_params.x * u_pointScale / max(-eye.z, 0.1), 1.0, u_maxPointSize);
    v_worldPos = a_position;
    v_alpha = a_params.y;
    v_steam = a_params.z;
}
