import { primitives } from '../twgl.full.module.js'
import { createMesh } from '../utils/buffers.js'
import { loadTexture } from '../utils/texture.js'
import { createNode } from '../utils/scene.js'

export const GROUND_RADIUS = 6

// o disco da TWGL vem com coordenadas de textura polares (ângulo, raio), o que
// deixaria a textura "girando" em volta do centro. Trocamos por um mapeamento
// planar: o (x, z) de cada vértice vira o (s, t), repetindo a textura `repeat` vezes
function planarTexcoords(vertices, radius, repeat) {
    const { position, texcoord } = vertices
    const count = position.length / 3
    for (let i = 0; i < count; i++) {
        const x = position[i * 3]
        const z = position[i * 3 + 2]
        texcoord[i * 2] = (x / (2 * radius) + 0.5) * repeat
        texcoord[i * 2 + 1] = (z / (2 * radius) + 0.5) * repeat
    }
}

// na esfera, s dá a volta inteira (2πr) e t só desce um quarto dela (πr/2),
// então repetimos mais vezes em s para a rocha não ficar esticada
function scaleTexcoords(vertices, scaleS, scaleT) {
    const { texcoord } = vertices
    for (let i = 0; i < texcoord.length; i += 2) {
        texcoord[i] *= scaleS
        texcoord[i + 1] *= scaleT
    }
}

export async function createGround(gl) {
    const [groundTexture, rockTexture] = await Promise.all([
        loadTexture(gl, 'assets/textures/ground.jpg'),
        loadTexture(gl, 'assets/textures/rock.jpg')
    ])

    const disc = primitives.createDiscVertices(GROUND_RADIUS, 64)
    planarTexcoords(disc, GROUND_RADIUS, 3)

    // só a metade de baixo da esfera: latitude de π/2 (equador) até π (polo sul)
    const hemisphere = primitives.createSphereVertices(GROUND_RADIUS, 64, 16, Math.PI / 2, Math.PI)
    scaleTexcoords(hemisphere, 4, 1)

    return createNode({
        children: [
            createNode({
                mesh: createMesh(gl, disc),
                texture: groundTexture,
                material: { ambient: 0.35, diffuse: 0.9, specular: 0.05, shininess: 4 }
            }),
            createNode({
                mesh: createMesh(gl, hemisphere),
                texture: rockTexture,
                // a textura da rocha é bem escura (média ~0.12) e a parte de baixo só
                // recebe luz ambiente, então clareamos a cor base e subimos o ka
                color: [1.8, 1.7, 1.6, 1],
                material: { ambient: 0.8, diffuse: 0.8, specular: 0.15, shininess: 16 }
            })
        ]
    })
}
