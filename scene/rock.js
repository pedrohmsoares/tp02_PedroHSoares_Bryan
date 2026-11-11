import { v3, primitives } from '../twgl.full.module.js'
import { createMesh } from '../utils/buffers.js'
import { loadTexture } from '../utils/texture.js'
import { createNode, transform } from '../utils/scene.js'

// número "aleatório" (0 a 1) fixo para cada posição. Arredondamos antes porque
// a esfera repete vértices na costura e nos polos com diferenças minúsculas de
// ponto flutuante; assim vértices iguais recebem o mesmo deslocamento e a malha não abre
function hash(x, y, z) {
    x = Math.round(x * 1000)
    y = Math.round(y * 1000)
    z = Math.round(z * 1000)
    const n = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453
    return n - Math.floor(n)
}

// pedra low-poly: esfera com poucas divisões, cada vértice empurrado para
// dentro/fora e achatada em y. Depois calculamos a normal de cada triângulo
// (flat shading) para as faces ficarem marcadas
function createRockVertices() {
    const rock = primitives.deindexVertices(primitives.createSphereVertices(1, 9, 6))
    const { position, normal } = rock

    for (let i = 0; i < position.length; i += 3) {
        const scale = 0.75 + 0.4 * hash(position[i], position[i + 1], position[i + 2])
        position[i] *= scale
        position[i + 1] *= scale * 0.7
        position[i + 2] *= scale
    }

    for (let i = 0; i < position.length; i += 9) {
        const a = position.slice(i, i + 3)
        const b = position.slice(i + 3, i + 6)
        const c = position.slice(i + 6, i + 9)
        let n = v3.normalize(v3.cross(v3.subtract(b, a), v3.subtract(c, a)))
        // garante que a normal aponta para fora (mesmo lado do vértice)
        if (v3.dot(n, a) < 0) n = v3.negate(n)
        for (let k = 0; k < 3; k++) {
            normal.set(n, i + k * 3)
        }
    }

    // depois do deindex cada vértice é usado uma vez só: índices 0, 1, 2, ...
    rock.indices = new Uint16Array(position.length / 3).map((_, i) => i)
    return rock
}

// pedra da direita de onde o girassol "nasce" (usada também em sunflower.js)
export const SUNFLOWER_ROCK = { translation: [4.56, 0.18, -0.08], rotation: [0, 0.8, 0], scale: 0.6 }

// a mesma malha é desenhada várias vezes (reaproveitando o VAO, como na aula de
// otimização). y fica em ~1/3 da escala para a pedra parecer meio enterrada
const ROCKS = [
    // grupo da esquerda
    { translation: [-3.6, 0.3, 0.4], rotation: [0, 0.3, 0], scale: 0.9 },
    { translation: [-2.8, 0.15, 1.8], rotation: [0, 1.4, 0.2], scale: 0.5 },
    { translation: [-4.2, 0.12, -0.9], rotation: [0, 2.2, 0], scale: 0.4 },
    // fundo: ao lado da coluna e encostada na ruína
    { translation: [0.4, 0.15, -4.7], rotation: [0, 1.0, 0], scale: 0.45 },
    { translation: [-1.57, 0.17, -3.0], rotation: [0, 2.6, 0.1], scale: 0.5 },
    SUNFLOWER_ROCK,
    // cascalho espalhado perto do centro
    { translation: [0.78, 0.05, -2.23], rotation: [0, 0.5, 0], scale: 0.16 },
    { translation: [1.42, 0.05, -1.92], rotation: [0, 1.7, 0], scale: 0.15 },
    { translation: [0.53, 0.05, -1.77], rotation: [0, 2.9, 0], scale: 0.14 },
    { translation: [-0.05, 0.05, -1.65], rotation: [0, 0.2, 0], scale: 0.16 },
    { translation: [-0.94, 0.05, -1.29], rotation: [0, 1.1, 0], scale: 0.15 },
    { translation: [-0.15, 0.05, -1.14], rotation: [0, 2.3, 0], scale: 0.13 },
    { translation: [1.77, 0.05, -1.04], rotation: [0, 0.9, 0], scale: 0.15 }
]

export async function createRocks(gl) {
    const texture = await loadTexture(gl, 'assets/textures/stone.jpg')
    const mesh = createMesh(gl, createRockVertices())
    const material = { ambient: 0.4, diffuse: 0.9, specular: 0.1, shininess: 8 }

    return createNode({
        children: ROCKS.map(({ translation, rotation, scale }) => createNode({
            mesh,
            texture,
            material,
            matrix: transform({ translation, rotation, scale: [scale, scale, scale] })
        }))
    })
}
