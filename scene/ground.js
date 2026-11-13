import { primitives } from '../twgl.full.module.js'
import { createMesh } from '../utils/buffers.js'
import { loadTexture } from '../utils/texture.js'
import { createNode, transform } from '../utils/scene.js'
import { triangleMesh, createSlabVertices } from '../utils/geometry.js'

export const GROUND_RADIUS = 6

export function groundHeight(x, z) {
    const radius = Math.hypot(x, z)
    const inner = Math.min(1, Math.max(0, (radius - 1.3) / 1.2))
    const edge = Math.min(1, Math.max(0, (GROUND_RADIUS - radius) / 0.8))
    return inner * inner * edge * (0.055 + 0.035 * Math.sin(x * 1.7) * Math.cos(z * 1.3))
}

function addRelief(vertices) {
    const { position, normal } = vertices
    const step = 0.01
    for (let i = 0; i < position.length; i += 3) {
        const x = position[i], z = position[i + 2]
        position[i + 1] = groundHeight(x, z)
        const dx = (groundHeight(x + step, z) - groundHeight(x - step, z)) / (2 * step)
        const dz = (groundHeight(x, z + step) - groundHeight(x, z - step)) / (2 * step)
        const length = Math.hypot(dx, 1, dz)
        normal.set([-dx / length, 1 / length, -dz / length], i)
    }
}

function createCracks() {
    const mesh = triangleMesh()
    const strip = (a, b, width) => {
        const dx = b[0] - a[0], dz = b[1] - a[1]
        const length = Math.hypot(dx, dz)
        const ox = -dz / length * width, oz = dx / length * width
        const point = (x, z) => [x, groundHeight(x, z) + 0.018, z]
        const left = point(a[0] + ox, a[1] + oz), right = point(a[0] - ox, a[1] - oz)
        const farLeft = point(b[0] + ox, b[1] + oz), farRight = point(b[0] - ox, b[1] - oz)
        mesh.triangle(left, farLeft, farRight)
        mesh.triangle(left, farRight, right)
    }
    for (let ray = 0; ray < 13; ray++) {
        const angle = ray * Math.PI * 2 / 13
        const length = 1.8 + (Math.sin(ray * 17.3) + 1) * 1.1
        let previous = [Math.cos(angle) * 0.4, Math.sin(angle) * 0.4]
        for (let step = 1; step <= 18; step++) {
            const radius = 0.4 + length * step / 18
            const bent = angle + Math.sin(step * 1.7 + ray) * 0.055
            const next = [Math.cos(bent) * radius, Math.sin(bent) * radius]
            strip(previous, next, 0.009 + 0.016 * (1 - step / 18))
            if (step === 10) {
                const branchAngle = bent + (ray % 2 ? 0.45 : -0.45)
                strip(next, [next[0] + Math.cos(branchAngle) * 0.65, next[1] + Math.sin(branchAngle) * 0.65], 0.012)
            }
            previous = next
        }
    }
    return mesh.vertices()
}

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

    const disc = primitives.createDiscVertices(GROUND_RADIUS, 128, 24)
    addRelief(disc)
    planarTexcoords(disc, GROUND_RADIUS, 3)

    // só a metade de baixo da esfera: latitude de π/2 (equador) até π (polo sul)
    const hemisphere = primitives.createSphereVertices(GROUND_RADIUS, 64, 16, Math.PI / 2, Math.PI)
    scaleTexcoords(hemisphere, 4, 1)

    const slab = createMesh(gl, createSlabVertices())
    const plates = [[-1.8, 1.2, 0.8], [1.7, 1.6, 0.65], [0.6, 2.7, 0.8],
        [-2.6, -0.7, 0.55], [2.9, -0.4, 0.7], [-1.1, -2.2, 0.5]]

    return createNode({
        children: [
            createNode({
                mesh: createMesh(gl, disc),
                texture: groundTexture,
                color: [1.25, 0.88, 0.58, 1],
                material: { ambient: 0.45, diffuse: 0.85, specular: 0.05, shininess: 4, receivesContactShadow: true }
            }),
            createNode({ mesh: createMesh(gl, createCracks()), color: [0.17, 0.09, 0.045, 1],
                material: { ambient: 0.65, diffuse: 0.5, specular: 0, shininess: 1, receivesContactShadow: true } }),
            ...plates.map(([x, z, size], i) => createNode({
                mesh: slab, texture: groundTexture, color: [1.2, 0.86, 0.57, 1],
                material: { ambient: 0.45, diffuse: 0.85, specular: 0.03, shininess: 4, receivesContactShadow: true },
                matrix: transform({ translation: [x, groundHeight(x, z) + 0.045, z],
                    rotation: [0.1 * Math.sin(i), i * 1.4, 0.08 * Math.cos(i)], scale: [size, 1, size] })
            })),
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
