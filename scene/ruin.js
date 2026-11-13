import { primitives } from '../twgl.full.module.js'
import { createMesh } from '../utils/buffers.js'
import { loadTexture } from '../utils/texture.js'
import { createNode, transform } from '../utils/scene.js'
import { createBrokenWallVertices } from '../utils/geometry.js'

// ruína principal (fundo, à esquerda). O catavento fica em cima da parede dela
export const MAIN_RUIN = transform({ translation: [-2.4, 0, -3.0], rotation: [0, 0.4, 0] })
export const MAIN_WALL_TOP = [0.9, 2.4, 0]

// peças da ruína principal em relação ao centro dela. O cubo e o cilindro têm
// tamanho 1 e são escalados; y = metade da altura para a peça ficar apoiada no chão
const MAIN_PIECES = [
    // parede principal, mais alta
    { shape: 'wall', translation: [0, 1.2, 0], rotation: [0, 0, 0], scale: [3, 2.4, 0.35] },
    // parede lateral quebrada, mais baixa
    { shape: 'wall', translation: [-1.5, 0.55, 0.85], rotation: [0, Math.PI / 2, 0], scale: [1.6, 1.1, 0.35] },
    // coluna em pé
    { shape: 'cylinder', translation: [1.9, 1.4, 0.5], rotation: [0, 0, 0], scale: [0.45, 2.8, 0.45] },
    // coluna caída, deitada no chão
    { shape: 'cylinder', translation: [0.5, 0.22, 1.6], rotation: [0, 0.3, Math.PI / 2], scale: [0.45, 2.2, 0.45] },
    // blocos soltos
    { shape: 'cube', translation: [-0.5, 0.2, 1.0], rotation: [0, 0.6, 0], scale: [0.4, 0.4, 0.4] },
    { shape: 'cube', translation: [1.3, 0.15, 1.2], rotation: [0.2, 1.1, 0], scale: [0.3, 0.3, 0.3] }
]

// destroços espalhados pelo diorama (já em coordenadas do mundo)
const DEBRIS = [
    // toco de coluna ao fundo
    { shape: 'cylinder', translation: [1.34, 0.35, -3.92], rotation: [0, 0, 0], scale: [0.9, 0.7, 0.9] },
    // bloco tombado à direita
    { shape: 'cube', translation: [3.7, 0.3, -2.1], rotation: [0.3, 0.7, 0.15], scale: [0.8, 0.6, 0.7] },
    // pedaço de parede desabado na frente, à direita
    { shape: 'wall', translation: [3.3, 0.42, 2.28], rotation: [0.25, -0.2, 0], scale: [2.2, 0.9, 0.35] },
    { shape: 'cube', translation: [2.5, 0.18, 2.75], rotation: [0, 0.4, 0.1], scale: [0.4, 0.35, 0.4] },
    { shape: 'cube', translation: [4.1, 0.15, 2.7], rotation: [0.1, 1.2, 0], scale: [0.35, 0.3, 0.3] },
    // blocos pequenos perto do centro
    { shape: 'cube', translation: [0.4, 0.17, -2.05], rotation: [0, 0.8, 0], scale: [0.35, 0.35, 0.35] },
    { shape: 'cube', translation: [-0.46, 0.2, -1.42], rotation: [0.2, 2.1, 0], scale: [0.4, 0.4, 0.4] },
    { shape: 'cube', translation: [1.42, 0.17, -1.52], rotation: [0, 1.4, 0.2], scale: [0.35, 0.35, 0.35] }
]

// muro quebrado acompanhando a borda, do lado esquerdo, passando pelo fundo,
// até o lado direito. Ângulos no plano xz: x = r·cos θ, z = r·sin θ
const WALL_RADIUS = 5.5
const WALL_START = 167 * Math.PI / 180
const WALL_END = 385 * Math.PI / 180
const WALL_SEGMENTS = 24

// número "aleatório" fixo (0 a 1) para cada bloco do muro
function random(i) {
    const n = Math.sin(i * 12.9898) * 43758.5453
    return n - Math.floor(n)
}

function createBorderWall(mesh, texture, material) {
    const step = (WALL_END - WALL_START) / WALL_SEGMENTS
    // um pouco menor que o arco, deixando uma fresta entre os blocos
    const length = step * WALL_RADIUS * 0.92
    const segments = []

    for (let i = 0; i < WALL_SEGMENTS; i++) {
        const r = random(i)
        // alguns blocos caíram de vez: deixam um buraco no muro
        if (r < 0.12) continue

        const height = 0.4 + 1.1 * r
        const angle = WALL_START + (i + 0.5) * step
        segments.push(createNode({
            mesh,
            texture,
            color: [1.35, 1.3, 1.2, 1],
            material,
            matrix: transform({
                translation: [WALL_RADIUS * Math.cos(angle), height / 2, WALL_RADIUS * Math.sin(angle)],
                // gira o bloco para ficar tangente à borda
                rotation: [0, -angle - Math.PI / 2, 0],
                scale: [length, height, 0.3]
            })
        }))
    }
    return segments
}

export async function createRuin(gl) {
    const texture = await loadTexture(gl, 'assets/textures/ruin.jpg')
    const meshes = {
        wall: createMesh(gl, createBrokenWallVertices()),
        cube: createMesh(gl, primitives.createCubeVertices(1)),
        cylinder: createMesh(gl, primitives.createCylinderVertices(0.5, 1, 16, 1, true, true))
    }
    const material = { ambient: 0.4, diffuse: 0.85, specular: 0.2, shininess: 16 }

    const toNode = ({ shape, translation, rotation, scale }) => createNode({
        mesh: meshes[shape],
        texture,
        color: [1.35, 1.3, 1.2, 1],
        material,
        matrix: transform({ translation, rotation, scale })
    })

    const mainRuin = createNode({
        matrix: MAIN_RUIN,
        children: MAIN_PIECES.map(toNode)
    })

    return createNode({
        children: [
            mainRuin,
            ...DEBRIS.map(toNode),
            ...createBorderWall(meshes.wall, texture, material)
        ]
    })
}
