#version 300 es

precision highp float;

in vec3 v_direction;
out vec4 o_color;

uniform float u_time;
uniform vec3 u_horizonColor;
uniform vec3 u_zenithColor;

uniform bool u_fogEnabled;
uniform vec3 u_fogColor;
uniform float u_fogAmount;

// textura procedural: ruído de valor (valores aleatórios nos cantos de uma
// grade, interpolados suavemente) somado em várias escalas (fbm)
float random(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

float noise(vec2 p) {
    vec2 cell = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float a = random(cell);
    float b = random(cell + vec2(1.0, 0.0));
    float c = random(cell + vec2(0.0, 1.0));
    float d = random(cell + vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
    float sum = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 4; i++) {
        sum += amplitude * noise(p);
        p *= 2.0;
        amplitude *= 0.5;
    }
    return sum;
}

void main() {
    vec3 dir = normalize(v_direction);
    float height = clamp(dir.y, 0.0, 1.0);

    vec3 color = mix(u_horizonColor, u_zenithColor, pow(height, 0.65));
    // O fundo abaixo da ilha também tem um gradiente, sem uma emenda no horizonte.
    color = mix(color, vec3(0.23, 0.31, 0.43), smoothstep(0.0, 1.0, -dir.y));

    vec3 sunDirection = normalize(vec3(0.4, 1.0, 0.3));
    float sun = max(dot(dir, sunDirection), 0.0);
    color += vec3(1.0, 0.77, 0.45) * pow(sun, 28.0) * 0.22;

    // Duas camadas em velocidades diferentes evitam um teto de nuvens uniforme.
    vec2 uv = dir.xz / (max(dir.y, 0.0) + 0.25);
    vec2 wind = vec2(u_time * 0.012, u_time * 0.003);
    float wisps = smoothstep(0.42, 0.7, fbm(uv * 3.2 + wind * 0.45));
    color = mix(color, vec3(0.86, 0.92, 1.0), wisps * 0.3 * smoothstep(0.0, 0.2, dir.y));

    vec2 cloudUV = uv * 1.4 + wind;
    float cloudNoise = fbm(cloudUV + vec2(fbm(cloudUV * 0.6)) * 0.7);
    float clouds = smoothstep(0.43, 0.59, cloudNoise) * smoothstep(0.0, 0.14, dir.y);
    float cloudLight = smoothstep(0.43, 0.68, cloudNoise);
    vec3 cloudColor = mix(vec3(0.62, 0.73, 0.86), vec3(1.0, 0.98, 0.92), cloudLight);
    color = mix(color, cloudColor, clouds * 0.94);
    float sunDisc = smoothstep(0.9987, 0.9993, sun) * (1.0 - clouds * 0.9);
    color = mix(color, vec3(1.0, 0.95, 0.77), sunDisc);

    // Névoa no horizonte, mantendo o azul e as nuvens no alto.
    if (u_fogEnabled) {
        float fogAmount = mix(0.55, 0.02, smoothstep(0.0, 0.55, height));
        color = mix(color, u_fogColor, fogAmount * u_fogAmount);
    }

    o_color = vec4(color, 1.0);
}
