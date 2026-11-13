import { primitives } from '../twgl.full.module.js'
import { createMesh } from '../utils/buffers.js'
import { loadTexture } from '../utils/texture.js'
import { createNode, transform } from '../utils/scene.js'

// Fragmentos suspensos pelo impacto, nas laterais e no fundo da ilha.
// A faixa central fica livre para as poses do Luffy.
const FRAGMENTS = [
    [-3.8, 1.6, -1.0, 0.28], [-3.1, 2.7, -2.0, 0.18],
    [-2.0, 3.5, -3.1, 0.22], [-0.5, 3.0, -3.8, 0.12],
    [1.8, 2.4, -3.4, 0.24], [3.0, 3.2, -2.3, 0.18],
    [4.1, 1.5, -0.6, 0.3], [3.6, 2.2, 1.0, 0.14],
    [-3.4, 1.2, 2.0, 0.16], [2.8, 0.9, 2.5, 0.12]
]

export async function createDebris(gl) {
    const texture = await loadTexture(gl, 'assets/textures/ruin.jpg')
    const mesh = createMesh(gl, primitives.createCubeVertices(1))
    const material = { ambient: 0.4, diffuse: 0.85, specular: 0.12, shininess: 8 }

    return createNode({
        children: FRAGMENTS.map(([x, y, z, size], i) => {
            let time = i * 1.7
            const matrixAt = () => transform({
                translation: [x + Math.sin(time * 0.4) * 0.09, y + Math.sin(time * 0.8) * 0.15, z],
                rotation: [time * 0.17, time * 0.25, i + time * 0.12],
                scale: [size, size * 0.65, size * 1.3]
            })
            return createNode({
                mesh, texture, material,
                matrix: matrixAt(),
                update(node, dt) {
                    time += dt
                    node.matrix = matrixAt()
                }
            })
        })
    })
}
