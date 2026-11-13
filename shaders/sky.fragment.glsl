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
        // Rotacionar cada oitava disfarça os eixos da grade de ruído.
        p = mat2(0.8, -0.6, 0.6, 0.8) * p * 2.03 + vec2(13.7, 9.2);
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
    // Halo amplo e discreto, com núcleo mais quente perto do disco solar.
    color = mix(color, vec3(1.0, 0.87, 0.67), pow(sun, 8.0) * 0.13);
    color += vec3(1.0, 0.74, 0.42) * pow(sun, 48.0) * 0.16;

    // A distância clareia o horizonte, com um toque dourado voltado ao sol.
    float horizonHaze = exp(-abs(dir.y) * 13.0) * 0.35;
    float sunSide = max(dot(normalize(dir.xz + vec2(0.0001)), normalize(sunDirection.xz)), 0.0);
    vec3 hazeColor = mix(u_horizonColor, vec3(0.98, 0.88, 0.73), pow(sunSide, 3.0) * 0.4);
    color = mix(color, hazeColor, horizonHaze);

    // Duas camadas em velocidades diferentes evitam um teto de nuvens uniforme.
    vec2 uv = dir.xz / (max(dir.y, 0.0) + 0.25);
    vec2 wind = vec2(u_time * 0.009, u_time * 0.002);
    float wisps = smoothstep(0.48, 0.73, fbm(uv * 3.8 + wind * 0.45));
    color = mix(color, vec3(0.88, 0.93, 1.0), wisps * 0.22 * smoothstep(0.0, 0.2, dir.y));

    vec2 cloudUV = uv * 1.15 + wind;
    float warp = fbm(cloudUV * 0.65);
    vec2 cloudPoint = cloudUV + vec2(warp, warp * 0.7) * 0.85;
    float cloudNoise = fbm(cloudPoint);
    float coverage = fbm(cloudUV * 0.35 + vec2(21.0, 7.0));
    float density = cloudNoise + (coverage - 0.5) * 0.22;
    float clouds = smoothstep(0.45, 0.59, density) * smoothstep(0.015, 0.18, dir.y);

    // Uma amostra na direção do sol aproxima o relevo iluminado das nuvens.
    // Mantemos só cinco avaliações de fbm no total, sem ray marching.
    vec2 toSun = sunDirection.xz / max(sunDirection.y, 0.2);
    float sunwardDensity = fbm(cloudPoint + toSun * 0.28);
    float relief = clamp(0.55 + (cloudNoise - sunwardDensity) * 4.5, 0.0, 1.0);
    float thickness = smoothstep(0.47, 0.72, density);
    vec3 cloudBase = mix(vec3(0.72, 0.79, 0.88), vec3(0.58, 0.68, 0.81), thickness);
    vec3 cloudColor = mix(cloudBase, vec3(1.0, 0.97, 0.88), relief);
    float rim = (1.0 - smoothstep(0.47, 0.57, density)) * pow(sun, 10.0);
    cloudColor += vec3(1.0, 0.77, 0.43) * rim * 0.18;
    color = mix(color, cloudColor, clouds * 0.96);
    float sunDisc = smoothstep(0.9987, 0.9993, sun) * (1.0 - clouds * 0.9);
    color = mix(color, vec3(1.0, 0.95, 0.77), sunDisc);

    // Névoa no horizonte, mantendo o azul e as nuvens no alto.
    if (u_fogEnabled) {
        float fogAmount = mix(0.55, 0.02, smoothstep(0.0, 0.55, height));
        color = mix(color, u_fogColor, fogAmount * u_fogAmount);
    }

    o_color = vec4(color, 1.0);
}
