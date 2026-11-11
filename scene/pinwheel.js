import { m4, primitives } from '../twgl.full.module.js'
import { createMesh } from '../utils/buffers.js'
import { createNode, transform } from '../utils/scene.js'
import { MAIN_RUIN, MAIN_WALL_TOP } from './ruin.js'

// mastro mais curto: o catavento fica em cima da parede da ruína (2.4 de altura)
const MAST_HEIGHT = 1.4
const ROTOR_SPEED = 2.0     // radianos por segundo

// catavento hierárquico:
//   catavento
//   ├── mastro (fixo)
//   └── rotor (gira em z)
//       ├── eixo
//       └── 4 pás (filhas do rotor, giram junto)
export function createPinwheel(gl) {
    const cube = createMesh(gl, primitives.createCubeVertices(1))
    const sphere = createMesh(gl, primitives.createSphereVertices(1, 16, 8))
    const cylinder = createMesh(gl, primitives.createCylinderVertices(1, 1, 12, 1, true, true))

    const red = [0.85, 0.1, 0.1, 1]
    const bladeMaterial = { ambient: 0.35, diffuse: 0.8, specular: 0.5, shininess: 32 }
    const woodMaterial = { ambient: 0.35, diffuse: 0.85, specular: 0.1, shininess: 8 }

    const mast = createNode({
        mesh: cylinder,
        color: [0.45, 0.3, 0.18, 1],
        material: woodMaterial,
        matrix: transform({ translation: [0, MAST_HEIGHT / 2, 0], scale: [0.06, MAST_HEIGHT, 0.06] })
    })

    const hub = createNode({
        mesh: sphere,
        color: [0.95, 0.8, 0.2, 1],
        material: bladeMaterial,
        matrix: transform({ scale: [0.1, 0.1, 0.1] })
    })

    // cada pá: gira k * 90° em z, sobe a partir do eixo e inclina um pouco em y
    // (como as pás de um catavento de papel)
    const blades = [0, 1, 2, 3].map(k => createNode({
        matrix: transform({ rotation: [0, 0, k * Math.PI / 2] }),
        children: [createNode({
            mesh: cube,
            color: red,
            material: bladeMaterial,
            matrix: transform({ translation: [0, 0.38, 0], rotation: [0, 0.35, 0], scale: [0.22, 0.6, 0.02] })
        })]
    }))

    const rotorPosition = [0, MAST_HEIGHT - 0.1, 0.1]
    const rotor = createNode({
        matrix: m4.translation(rotorPosition),
        children: [hub, ...blades],
        update(node, dt) {
            node.angle = (node.angle ?? 0) + ROTOR_SPEED * dt
            node.matrix = m4.rotateZ(m4.translation(rotorPosition), node.angle)
        }
    })

    return createNode({
        // em cima da parede principal da ruína, virado para o mesmo lado que ela
        matrix: m4.translate(MAIN_RUIN, MAIN_WALL_TOP),
        children: [mast, rotor]
    })
}
