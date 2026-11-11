#version 300 es

precision highp float;

in vec3 v_direction;
out vec4 o_color;

uniform float u_time;
uniform vec3 u_horizonColor;
uniform vec3 u_zenithColor;

uniform bool u_fogEnabled;
uniform vec3 u_fogColor;

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

    vec3 color = mix(u_horizonColor, u_zenithColor, sqrt(height));

    // nuvens: projeta a direção num "teto" plano acima da cena e aplica o ruído.
    // O smoothstep estreito deixa a borda das nuvens bem definida, com cara de desenho
    vec2 uv = dir.xz / (dir.y + 0.2) * 1.5 + vec2(u_time * 0.01, 0.0);
    float clouds = smoothstep(0.55, 0.62, fbm(uv)) * smoothstep(0.02, 0.2, dir.y);
    color = mix(color, vec3(1.0), clouds * 0.9);

    // com neblina, o horizonte vira a cor da neblina e os objetos somem no fundo
    if (u_fogEnabled) {
        float fogAmount = mix(1.0, 0.5, smoothstep(0.0, 0.5, height));
        color = mix(color, u_fogColor, fogAmount);
    }

    o_color = vec4(color, 1.0);
}
