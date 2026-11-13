#version 300 es

precision highp float;

in vec3 v_localPos;
in vec3 v_worldPos;
in vec3 v_normal;
out vec4 o_color;

uniform vec3 u_cameraPosition;
uniform float u_lineCount;
uniform vec3 u_lineColor;
uniform float u_time;

uniform bool u_fogEnabled;
uniform vec3 u_fogColor;
uniform float u_fogDensity;
uniform float u_fogStart;
uniform float u_fogHeightFalloff;
uniform float u_fogAmount;

float fogOpacity(vec3 point) {
    float d = distance(u_cameraPosition, point);
    float density = 0.0;
    for (int i = 0; i < 6; i++) {
        float t = (float(i) + 0.5) / 6.0;
        float height = mix(u_cameraPosition.y, point.y, t);
        density += exp(-max(height, 0.0) * u_fogHeightFalloff);
    }
    float depth = max(d - u_fogStart, 0.0) * u_fogDensity * density / 6.0;
    return min(1.0 - exp(-depth), 0.7) * u_fogAmount;
}

const float PI = 3.14159265;

void main() {
    // as linhas da gaiola são meridianos: dependem só da longitude do ponto,
    // por isso todas descem do topo até a borda
    float longitude = atan(v_localPos.z, v_localPos.x);
    float t = fract(longitude / (2.0 * PI) * u_lineCount);
    float distanceToLine = min(t, 1.0 - t);
    // A largura cresce só o necessário para evitar serrilhado quando a câmera afasta.
    float pixelWidth = min(fwidth(longitude) / (2.0 * PI) * u_lineCount, 0.08);
    float line = 1.0 - smoothstep(0.018, 0.018 + max(pixelWidth, 0.008), distanceToLine);
    if (line < 0.01) discard;

    // Os fios laterais ficam mais discretos para não esconder o personagem.
    vec3 N = normalize(v_normal);
    vec3 V = normalize(u_cameraPosition - v_worldPos);
    float rim = 1.0 - abs(dot(N, V));

    float height = normalize(v_localPos).y;
    float alpha = line * mix(0.8, 0.35, rim) * (gl_FrontFacing ? 1.0 : 0.45);
    alpha *= 1.0 - smoothstep(0.97, 1.0, height) * 0.7;
    float glint = pow(max(0.0, sin(height * 18.0 - u_time * 1.6 + longitude * 2.0)), 18.0);
    vec3 color = mix(u_lineColor, vec3(1.0, 0.88, 0.66), glint * 0.4);

    if (u_fogEnabled) {
        color = mix(color, u_fogColor, fogOpacity(v_worldPos));
    }

    o_color = vec4(color, alpha);
}
