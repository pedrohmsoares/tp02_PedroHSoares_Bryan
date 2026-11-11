#version 300 es

layout(location = 0) in vec3 a_coords;
layout(location = 1) in vec3 a_normal;

uniform mat4 u_model;
uniform mat4 u_view;
uniform mat4 u_projection;

out vec3 v_localPos;
out vec3 v_worldPos;
out vec3 v_normal;

void main() {
    v_localPos = a_coords;
    v_worldPos = (u_model * vec4(a_coords, 1.0)).xyz;
    v_normal = transpose(inverse(mat3(u_model))) * a_normal;
    gl_Position = u_projection * u_view * vec4(v_worldPos, 1.0);
}
