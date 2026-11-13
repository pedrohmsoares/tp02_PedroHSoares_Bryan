import { primitives } from '../twgl.full.module.js'
import { createMesh } from '../utils/buffers.js'
import { createProgramFromFiles, getUniformLocations } from '../utils/shader.js'

const SKY_RADIUS = 50

// azul claro no horizonte e mais forte no alto, como o céu fora da gaiola
export const HORIZON_COLOR = [0.79, 0.86, 0.94]
const ZENITH_COLOR = [0.07, 0.32, 0.66]

const UNIFORMS = [
    'u_view', 'u_projection', 'u_cameraPosition', 'u_time',
    'u_horizonColor', 'u_zenithColor', 'u_fogEnabled', 'u_fogColor', 'u_fogAmount'
]

export async function createSkydome(gl) {
    const program = await createProgramFromFiles(gl, 'shaders/sky.vertex.glsl', 'shaders/sky.fragment.glsl')
    const locations = getUniformLocations(gl, program, UNIFORMS)
    // Esfera completa para a câmera livre também ter fundo ao olhar para baixo.
    const mesh = createMesh(gl, primitives.createSphereVertices(SKY_RADIUS, 48, 32))

    return {
        // desenhado antes de tudo, sem teste de profundidade: qualquer objeto fica na frente.
        // Sem culling porque vemos as faces de dentro da esfera
        draw(gl, { camera, projectionMatrix, fog, time }) {
            gl.disable(gl.DEPTH_TEST)
            gl.disable(gl.CULL_FACE)
            gl.useProgram(program)
            gl.uniformMatrix4fv(locations.u_view, false, camera.viewMatrix)
            gl.uniformMatrix4fv(locations.u_projection, false, projectionMatrix)
            gl.uniform3fv(locations.u_cameraPosition, camera.position)
            gl.uniform1f(locations.u_time, time)
            gl.uniform3fv(locations.u_horizonColor, HORIZON_COLOR)
            gl.uniform3fv(locations.u_zenithColor, ZENITH_COLOR)
            gl.uniform1i(locations.u_fogEnabled, fog.amount > 0.001)
            gl.uniform3fv(locations.u_fogColor, fog.color)
            gl.uniform1f(locations.u_fogAmount, fog.amount)
            mesh.draw(gl)
            gl.enable(gl.DEPTH_TEST)
            gl.enable(gl.CULL_FACE)
        }
    }
}
