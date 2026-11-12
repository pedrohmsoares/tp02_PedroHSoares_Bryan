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
    v_texcoord = a_texcoord;
    gl_Position = u_projection * u_view * vec4(v_worldPos, 1.0);
}
