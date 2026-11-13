#version 300 es

// skinning (aula de animação): cada vértice está preso a até 4 ossos e sua
// posição final é a média, ponderada pelos pesos, das transformações deles.
// O resultado vai para o mesmo phong.fragment.glsl dos outros objetos

layout(location = 0) in vec3 a_coords;
layout(location = 1) in vec3 a_normal;
layout(location = 2) in vec2 a_texcoord;
layout(location = 3) in vec4 a_boneIndices;
layout(location = 4) in vec4 a_boneWeights;

#define MAX_BONES 180
uniform mat4 u_bones[MAX_BONES];

uniform mat4 u_model;
uniform mat4 u_view;
uniform mat4 u_projection;
uniform bool u_shadowPass;
uniform vec3 u_lightDirection;

out vec3 v_normal;
out vec3 v_worldPos;
out vec2 v_texcoord;

void main() {
    ivec4 bone = ivec4(a_boneIndices);
    mat4 skin = a_boneWeights.x * u_bones[bone.x]
              + a_boneWeights.y * u_bones[bone.y]
              + a_boneWeights.z * u_bones[bone.z]
              + a_boneWeights.w * u_bones[bone.w];

    vec4 skinnedPosition = skin * vec4(a_coords, 1.0);
    vec3 skinnedNormal = mat3(skin) * a_normal;

    v_normal = transpose(inverse(mat3(u_model))) * skinnedNormal;
    v_worldPos = (u_model * skinnedPosition).xyz;
    if (u_shadowPass) {
        // Projeção direcional sobre o piso: sol baixo alonga a silhueta.
        float height = max(v_worldPos.y, 0.0);
        v_worldPos.xz += u_lightDirection.xz * height / max(-u_lightDirection.y, 0.1);
        // Mesmo relevo do disco de ground.js; deslocamento evita z-fighting.
        float radius = length(v_worldPos.xz);
        float inner = clamp((radius - 1.3) / 1.2, 0.0, 1.0);
        float edge = clamp((6.0 - radius) / 0.8, 0.0, 1.0);
        v_worldPos.y = inner * inner * edge *
            (0.055 + 0.035 * sin(v_worldPos.x * 1.7) * cos(v_worldPos.z * 1.3)) + 0.025;
    }
    v_texcoord = a_texcoord;
    gl_Position = u_projection * u_view * vec4(v_worldPos, 1.0);
}
