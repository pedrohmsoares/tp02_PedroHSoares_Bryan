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

    if (u_fogEnabled) {
        color = mix(color, u_fogColor, fogOpacity(v_worldPos));
    }

    o_color = vec4(color, 1.0);
}
