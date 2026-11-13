#version 300 es

precision highp float;

in vec3 v_normal;
in vec3 v_worldPos;
in vec2 v_texcoord;
out vec4 o_color;

uniform sampler2D u_texture;
uniform vec4 u_baseColor;

// luz direcional: só importa a direção (para onde a luz aponta)
uniform vec3 u_lightDirection;
uniform vec3 u_lightColor;
uniform vec3 u_cameraPosition;
uniform bool u_lightingEnabled;
uniform vec3 u_shadowPosition;
uniform bool u_receivesContactShadow;
uniform bool u_shadowPass;

// material do objeto
uniform float u_ambient;
uniform float u_diffuse;
uniform float u_specular;
uniform float u_shininess;

// Neblina com densidade decrescente conforme a altura.
uniform bool u_fogEnabled;
uniform vec3 u_fogColor;
uniform float u_fogDensity;
uniform float u_fogStart;
uniform float u_fogHeightFalloff;
uniform float u_fogAmount;

float fogOpacity(vec3 point) {
    float d = distance(u_cameraPosition, point);
    // Integra a densidade em seis pontos do caminho entre câmera e superfície.
    float density = 0.0;
    for (int i = 0; i < 6; i++) {
        float t = (float(i) + 0.5) / 6.0;
        float height = mix(u_cameraPosition.y, point.y, t);
        density += exp(-max(height, 0.0) * u_fogHeightFalloff);
    }
    float depth = max(d - u_fogStart, 0.0) * u_fogDensity * density / 6.0;
    return min(1.0 - exp(-depth), 0.7) * u_fogAmount;
}

void main() {
    if (u_shadowPass) {
        float opacity = 0.38;
        if (u_fogEnabled) opacity *= 1.0 - fogOpacity(v_worldPos);
        o_color = vec4(0.09, 0.07, 0.06, opacity);
        return;
    }
    vec3 albedo = (texture(u_texture, v_texcoord) * u_baseColor).rgb;
    vec3 color = albedo;

    if (u_lightingEnabled) {
        vec3 N = normalize(v_normal);
        vec3 L = normalize(-u_lightDirection);
        vec3 V = normalize(u_cameraPosition - v_worldPos);
        vec3 R = reflect(-L, N);

        vec3 ambient = u_ambient * u_lightColor * albedo;

        float diffuseFactor = max(dot(N, L), 0.0);
        vec3 diffuse = u_diffuse * diffuseFactor * u_lightColor * albedo;

        float specularFactor = diffuseFactor > 0.0 ? pow(max(dot(R, V), 0.0), u_shininess) : 0.0;
        vec3 specular = u_specular * specularFactor * u_lightColor;

        color = ambient + diffuse + specular;
    }

    // Sombra de contato aproximada, aplicada só ao chão e antes da neblina.
    // Ao subir, ela se espalha e enfraquece; ao descer, fica mais concentrada.
    if (u_lightingEnabled && u_receivesContactShadow) {
        float lift = max(u_shadowPosition.y, 0.0);
        vec2 center = u_shadowPosition.xz + u_lightDirection.xz * lift / max(abs(u_lightDirection.y), 0.1);
        vec2 radius = vec2(0.78, 0.58) + lift * 0.45;
        vec2 offset = (v_worldPos.xz - center) / radius;
        float r2 = dot(offset, offset);
        float shadow = exp(-r2 * 2.0) * (1.0 - smoothstep(2.0, 4.0, r2));
        color *= 1.0 - shadow * 0.18 / (1.0 + lift * 1.6);
    }

    if (u_fogEnabled) {
        color = mix(color, u_fogColor, fogOpacity(v_worldPos));
    }

    o_color = vec4(color, 1.0);
}
