#version 300 es

precision highp float;

in vec3 v_localPos;
in vec3 v_worldPos;
in vec3 v_normal;
out vec4 o_color;

uniform vec3 u_cameraPosition;
uniform float u_lineCount;
uniform vec3 u_lineColor;

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
    float line = 1.0 - smoothstep(0.04, 0.08, distanceToLine);

    // perto do topo as linhas se juntam: deixamos o topo mais branco, como na imagem
    float height = normalize(v_localPos).y;
    line = max(line, smoothstep(0.9, 1.0, height) * 0.8);

    // o "vidro" fica mais visível na borda (onde a superfície é vista de lado)
    vec3 N = normalize(v_normal);
    vec3 V = normalize(u_cameraPosition - v_worldPos);
    float rim = 1.0 - abs(dot(N, V));

    float alpha = mix(0.05 + 0.15 * rim, 0.65, line);
    vec3 color = u_lineColor;

    if (u_fogEnabled) {
        color = mix(color, u_fogColor, fogOpacity(v_worldPos));
    }

    o_color = vec4(color, alpha);
}
