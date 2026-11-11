import { primitives } from '../twgl.full.module.js'
import { createMesh } from '../utils/buffers.js'
import { createNode, transform } from '../utils/scene.js'
import { SUNFLOWER_ROCK } from './rock.js'

const STEM_HEIGHT = 1.6

// das 12 posições de pétala, só algumas sobraram (girassol "destruído")
const PETAL_SLOTS = 12
const REMAINING_PETALS = [0, 2, 3, 6, 9]

export function createSunflower(gl) {
    const sphere = createMesh(gl, primitives.createSphereVertices(1, 16, 8))
    const cylinder = createMesh(gl, primitives.createCylinderVertices(1, 1, 12, 1, true, true))

    const green = [0.3, 0.5, 0.15, 1]
    const leafMaterial = { ambient: 0.35, diffuse: 0.8, specular: 0.2, shininess: 16 }
    const petalMaterial = { ambient: 0.35, diffuse: 0.8, specular: 0.4, shininess: 32 }
    const centerMaterial = { ambient: 0.35, diffuse: 0.9, specular: 0.05, shininess: 4 }

    const stem = createNode({
        mesh: cylinder,
        color: green,
        material: leafMaterial,
        matrix: transform({ translation: [0, STEM_HEIGHT / 2, 0], scale: [0.05, STEM_HEIGHT, 0.05] })
    })

    const leaves = [
        { translation: [0.18, 0.6, 0], rotation: [0, 0, -0.4] },
        { translation: [-0.18, 0.95, 0], rotation: [0, 0, 0.4] }
    ].map(({ translation, rotation }) => createNode({
        mesh: sphere,
        color: green,
        material: leafMaterial,
        matrix: transform({ translation, rotation, scale: [0.22, 0.03, 0.1] })
    }))

    // miolo: cilindro curto deitado, com a face virada para +z
    const center = createNode({
        mesh: cylinder,
        color: [0.35, 0.2, 0.08, 1],
        material: centerMaterial,
        matrix: transform({ rotation: [Math.PI / 2, 0, 0], scale: [0.22, 0.08, 0.22] })
    })

    // cada pétala: gira em z até sua posição e se afasta do centro
    const petals = REMAINING_PETALS.map(slot => createNode({
        matrix: transform({ rotation: [0, 0, slot / PETAL_SLOTS * Math.PI * 2] }),
        children: [createNode({
            mesh: sphere,
            color: [0.95, 0.75, 0.1, 1],
            material: petalMaterial,
            matrix: transform({ translation: [0, 0.36, 0], scale: [0.08, 0.17, 0.02] })
        })]
    }))

    // cabeça no topo do caule, um pouco inclinada para frente
    const head = createNode({
        matrix: transform({ translation: [0, STEM_HEIGHT, 0.03], rotation: [-0.3, 0, 0] }),
        children: [center, ...petals]
    })

    return createNode({
        // a base fica dentro da pedra da direita, como se o girassol saísse de uma fresta
        matrix: transform({ translation: [SUNFLOWER_ROCK.translation[0], 0.35, SUNFLOWER_ROCK.translation[2]], rotation: [0, -0.9, 0] }),
        children: [stem, ...leaves, head]
    })
}
