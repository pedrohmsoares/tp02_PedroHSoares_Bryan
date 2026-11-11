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
        float d = distance(u_cameraPosition, v_worldPos);
        float fogFactor = exp(-pow(u_fogDensity * d, 2.0));
        color = mix(u_fogColor, color, fogFactor);
    }

    o_color = vec4(color, alpha);
}
