import { m4, primitives } from '../twgl.full.module.js'
import { createMesh } from '../utils/buffers.js'
import { createProgramFromFiles, getUniformLocations } from '../utils/shader.js'
import { GROUND_RADIUS } from './ground.js'

const LINE_COUNT = 64
const LINE_COLOR = [0.92, 0.96, 1.0]
// um pouco mais alta que meia esfera para o catavento (em cima da ruína) caber
const HEIGHT_SCALE = 1.15

const UNIFORMS = [
    'u_model', 'u_view', 'u_projection', 'u_cameraPosition',
    'u_lineCount', 'u_lineColor', 'u_fogEnabled', 'u_fogColor', 'u_fogDensity',
    'u_fogStart', 'u_fogHeightFalloff', 'u_fogAmount'
]

// gaiola do Doflamingo: metade de cima de uma esfera com o mesmo raio do chão,
// translúcida e com linhas descendo do topo
export async function createBirdcage(gl) {
    const program = await createProgramFromFiles(gl, 'shaders/cage.vertex.glsl', 'shaders/cage.fragment.glsl')
    const locations = getUniformLocations(gl, program, UNIFORMS)
    const mesh = createMesh(gl, primitives.createSphereVertices(GROUND_RADIUS, 64, 32, 0, Math.PI / 2))
    const model = m4.scaling([1, HEIGHT_SCALE, 1])

    return {
        // objeto transparente: desenhado por último, misturando com o que já está
        // na tela. Não grava profundidade (para não esconder a outra metade da gaiola)
        // e sem culling para aparecerem as faces da frente e de trás
        draw(gl, { camera, projectionMatrix, fog }) {
            gl.enable(gl.BLEND)
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
            gl.depthMask(false)
            gl.disable(gl.CULL_FACE)

            gl.useProgram(program)
            gl.uniformMatrix4fv(locations.u_model, false, model)
            gl.uniformMatrix4fv(locations.u_view, false, camera.viewMatrix)
            gl.uniformMatrix4fv(locations.u_projection, false, projectionMatrix)
            gl.uniform3fv(locations.u_cameraPosition, camera.position)
            gl.uniform1f(locations.u_lineCount, LINE_COUNT)
            gl.uniform3fv(locations.u_lineColor, LINE_COLOR)
            gl.uniform1i(locations.u_fogEnabled, fog.amount > 0.001)
            gl.uniform3fv(locations.u_fogColor, fog.color)
            gl.uniform1f(locations.u_fogDensity, fog.density)
            gl.uniform1f(locations.u_fogStart, fog.start)
            gl.uniform1f(locations.u_fogHeightFalloff, fog.heightFalloff)
            gl.uniform1f(locations.u_fogAmount, fog.amount)
            mesh.draw(gl)

            gl.enable(gl.CULL_FACE)
            gl.depthMask(true)
            gl.disable(gl.BLEND)
        }
    }
}
