#version 300 es
precision highp float;

in vec3 v_worldPos;
in float v_alpha;
in float v_steam;
out vec4 o_color;

uniform vec3 u_cameraPosition;
uniform bool u_fogEnabled;
uniform vec3 u_fogColor;
uniform float u_fogDensity;
uniform float u_fogStart;
uniform float u_fogHeightFalloff;
uniform float u_fogAmount;

float fogOpacity(vec3 point) {
    float density = 0.0;
    for (int i = 0; i < 6; i++) {
        float height = mix(u_cameraPosition.y, point.y, (float(i) + 0.5) / 6.0);
        density += exp(-max(height, 0.0) * u_fogHeightFalloff);
    }
    float depth = max(distance(u_cameraPosition, point) - u_fogStart, 0.0) * u_fogDensity * density / 6.0;
    return min(1.0 - exp(-depth), 0.7) * u_fogAmount;
}

void main() {
    vec2 point = gl_PointCoord * 2.0 - 1.0;
    float radius = length(point);
    float edge = 1.0 - smoothstep(0.2, 1.0, radius);
    float alpha = edge * edge * v_alpha;
    if (alpha < 0.005) discard;
    vec3 color = mix(vec3(1.0, 0.82, 0.53), vec3(0.94, 0.97, 1.0), v_steam);
    if (u_fogEnabled) color = mix(color, u_fogColor, fogOpacity(v_worldPos));
    o_color = vec4(color, alpha);
}
