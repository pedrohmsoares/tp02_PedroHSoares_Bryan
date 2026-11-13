import { createProgramFromFiles, getUniformLocations } from '../utils/shader.js'

const STEAM_COUNT = 48
const DUST_COUNT = 64
const IMPACT_COUNT = 32
const COUNT = STEAM_COUNT + DUST_COUNT + IMPACT_COUNT
const UNIFORMS = [
    'u_view', 'u_projection', 'u_pointScale', 'u_maxPointSize',
    'u_cameraPosition', 'u_fogEnabled', 'u_fogColor', 'u_fogDensity',
    'u_fogStart', 'u_fogHeightFalloff', 'u_fogAmount'
]

// Sementes fixas: o efeito é reproduzível e não muda ao trocar a câmera.
function random(i) {
    const value = Math.sin(i * 127.1 + 311.7) * 43758.5453
    return value - Math.floor(value)
}

export async function createParticles(gl) {
    const program = await createProgramFromFiles(gl, 'shaders/particles.vertex.glsl', 'shaders/particles.fragment.glsl')
    const locations = getUniformLocations(gl, program, UNIFORMS)
    const maxPointSize = gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE)[1]
    const data = new Float32Array(COUNT * 6)
    const vao = gl.createVertexArray()
    gl.bindVertexArray(vao)
    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, data.byteLength, gl.DYNAMIC_DRAW)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 24, 0)
    gl.enableVertexAttribArray(1)
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 24, 12)
    gl.bindVertexArray(null)

    const particles = Array.from({ length: COUNT }, (_, i) => ({
        kind: i < STEAM_COUNT ? 1 : i < STEAM_COUNT + DUST_COUNT ? 0 : 2,
        phase: random(i), angle: random(i + COUNT) * Math.PI * 2,
        seed: random(i + 2 * COUNT), position: [0, 0, 0], size: 0, alpha: 0, depth: 0
    }))
    let impactStart = -1
    let impactPosition = [0, 0, 0]

    return {
        emitImpact(position, time) {
            impactStart = time
            impactPosition = [position[0], 0, position[2]]
        },

        draw(gl, { camera, projectionMatrix, fog, time }, characterPosition) {
            for (const p of particles) {
                if (p.kind === 2) {
                    const age = (time - impactStart) / 0.9
                    const active = impactStart >= 0 && age >= 0 && age < 1
                    const t = Math.max(0, Math.min(1, age))
                    const radius = 0.3 + t * (0.8 + p.seed * 0.8)
                    p.position = [impactPosition[0] + Math.cos(p.angle) * radius,
                        0.08 + Math.sin(Math.PI * t) * 0.25 + t * 0.15,
                        impactPosition[2] + Math.sin(p.angle) * radius]
                    p.size = 0.25 + t * 0.7
                    p.alpha = active ? Math.sin(Math.PI * t) * (1 - t) * 0.65 : 0
                } else {
                    const steam = p.kind === 1
                    const age = (time / (steam ? 3.6 : 7) + p.phase) % 1
                    const angle = p.angle + time * (steam ? 0.45 : 0.06)
                    const radius = steam ? 0.72 + age * 0.55 : 1.8 + p.seed * 3
                    const origin = steam ? characterPosition : [0, 0, 0]
                    p.position = [origin[0] + Math.cos(angle) * radius,
                        origin[1] + (steam ? 0.35 + age * 2.3 : 0.12 + age * 2.6),
                        origin[2] + Math.sin(angle) * radius]
                    p.size = steam ? 0.3 + age * 0.5 : 0.035 + p.seed * 0.035
                    p.alpha = Math.sin(Math.PI * age) ** 2 * (steam ? 0.22 : 0.65)
                }
                const view = camera.viewMatrix
                p.depth = -(view[2] * p.position[0] + view[6] * p.position[1] + view[10] * p.position[2] + view[14])
            }
            // Transparências: partículas distantes primeiro, sem gravar profundidade.
            particles.sort((a, b) => b.depth - a.depth)
            particles.forEach((p, i) => data.set([...p.position, p.size, p.alpha, p.kind], i * 6))
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, data)
            gl.useProgram(program)
            gl.uniformMatrix4fv(locations.u_view, false, camera.viewMatrix)
            gl.uniformMatrix4fv(locations.u_projection, false, projectionMatrix)
            gl.uniform1f(locations.u_pointScale, gl.canvas.height * 0.5 * projectionMatrix[5])
            gl.uniform1f(locations.u_maxPointSize, maxPointSize)
            gl.uniform3fv(locations.u_cameraPosition, camera.position)
            gl.uniform1i(locations.u_fogEnabled, fog.amount > 0.001)
            gl.uniform3fv(locations.u_fogColor, fog.color)
            gl.uniform1f(locations.u_fogDensity, fog.density)
            gl.uniform1f(locations.u_fogStart, fog.start)
            gl.uniform1f(locations.u_fogHeightFalloff, fog.heightFalloff)
            gl.uniform1f(locations.u_fogAmount, fog.amount)
            gl.enable(gl.BLEND)
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
            gl.depthMask(false)
            gl.bindVertexArray(vao)
            gl.drawArrays(gl.POINTS, 0, COUNT)
            gl.depthMask(true)
            gl.disable(gl.BLEND)
            gl.bindVertexArray(null)
        }
    }
}
