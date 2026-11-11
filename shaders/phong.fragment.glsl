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

// neblina exponencial ao quadrado (GL_EXP2)
uniform bool u_fogEnabled;
uniform vec3 u_fogColor;
uniform float u_fogDensity;

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
        float d = distance(u_cameraPosition, v_worldPos);
        float fogFactor = exp(-pow(u_fogDensity * d, 2.0));
        color = mix(u_fogColor, color, fogFactor);
    }

    o_color = vec4(color, 1.0);
}
