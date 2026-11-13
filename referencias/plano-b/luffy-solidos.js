import { primitives } from '../twgl.full.module.js'
import { createMesh } from '../utils/buffers.js'
import { createProceduralTexture } from '../utils/texture.js'
import { createNode, transform } from '../utils/scene.js'

// Luffy Gear 4 (Boundman) feito com sólidos da TWGL, em hierarquia.
// Cada articulação é um nó sem mesh: a pose só muda a rotação desses nós.
//
// luffy (posição/orientação no diorama)
// └── quadril
//     ├── short, faixa
//     ├── quadril_E/D → coxa → joelho → canela, pé
//     └── coluna → tronco, colete
//         ├── pescoço → cabeça, cabelo, rosto
//         └── ombro_E/D → braço → cotovelo → antebraço, punho
//
// Ele olha para +z. A esquerda dele fica em +x (side = +1) e a direita em -x (side = -1)

// ângulos [x, y, z] de cada articulação, em radianos
export const POSES = {
    neutral: {
        root: { translation: [0, 0, 0], rotation: [0, 0, 0] },
        joints: {
            spine: [0.05, 0, 0],
            neck: [0.1, 0, 0],
            shoulder_L: [0, 0, 0.28], shoulder_R: [0, 0, -0.28],
            elbow_L: [-0.5, 0, 0.1], elbow_R: [-0.5, 0, -0.1],
            hip_L: [-0.35, 0, 0.12], hip_R: [-0.35, 0, -0.12],
            knee_L: [0.6, 0, 0], knee_R: [0.6, 0, 0]
        }
    }
}

// -- texturas procedurais ----------------------------------------------------

// haki: preto avermelhado com listras vermelhas onduladas ao longo do membro
function hakiColor(s, t) {
    const wave = Math.sin(t * Math.PI * 6) * 0.05
    const stripe = Math.abs(((s * 5 + wave * 5) % 1) - 0.5)
    return stripe < 0.07 ? [150, 18, 18] : [22, 12, 12]
}

// peito: pele com as marcas vermelhas em forma de chama, apontando para baixo,
// na parte de cima do tronco (t pequeno = topo da esfera)
function chestColor(s, t) {
    const skin = [240, 190, 150]
    if (t < 0.12 || t > 0.45) return skin
    const tongue = (s * 12) % 1
    const width = 0.4 * (1 - (t - 0.12) / 0.33)
    return Math.abs(tongue - 0.5) < width ? [170, 40, 35] : skin
}

// -- materiais ----------------------------------------------------------------

const MATERIALS = {
    haki: { ambient: 0.35, diffuse: 0.7, specular: 0.9, shininess: 64 },
    skin: { ambient: 0.4, diffuse: 0.85, specular: 0.15, shininess: 10 },
    cloth: { ambient: 0.4, diffuse: 0.85, specular: 0.05, shininess: 4 },
    shiny: { ambient: 0.4, diffuse: 0.7, specular: 0.6, shininess: 32 }
}

const COLORS = {
    white: [1, 1, 1, 1],
    hair: [0.08, 0.06, 0.06, 1],
    skin: [0.95, 0.76, 0.6, 1],
    shorts: [0.22, 0.32, 0.72, 1],
    sash: [0.95, 0.85, 0.4, 1],
    vest: [0.18, 0.2, 0.42, 1],
    fur: [0.92, 0.92, 0.88, 1],
    rope: [0.9, 0.88, 0.8, 1],
    pupil: [0.05, 0.03, 0.03, 1]
}

export function createLuffy(gl) {
    const meshes = {
        sphere: createMesh(gl, primitives.createSphereVertices(1, 24, 16)),
        cube: createMesh(gl, primitives.createCubeVertices(1)),
        cylinder: createMesh(gl, primitives.createCylinderVertices(1, 1, 16, 1, true, true)),
        cone: createMesh(gl, primitives.createTruncatedConeVertices(1, 0, 1, 12, 1, false, true)),
        torus: createMesh(gl, primitives.createTorusVertices(1, 0.25, 24, 8)),
        // colete: esfera aberta na frente (longitude em volta de +z fica de fora)
        // e sem as tampas de cima e de baixo
        vest: createMesh(gl, primitives.createSphereVertices(1, 24, 12,
            0.15 * Math.PI, 0.75 * Math.PI, Math.PI / 2 + 0.7, Math.PI / 2 + 2 * Math.PI - 0.7))
    }
    const textures = {
        haki: createProceduralTexture(gl, 128, hakiColor),
        chest: createProceduralTexture(gl, 128, chestColor)
    }

    // peça desenhável: mesh + cor + material (+ textura), na posição/escala dada
    function part(mesh, color, material, { translation, rotation, scale }, texture = null) {
        return createNode({
            mesh: meshes[mesh],
            color,
            material: MATERIALS[material],
            texture,
            matrix: transform({ translation, rotation, scale })
        })
    }

    // articulação: nó vazio cuja rotação vem da pose
    const joints = {}
    function joint(name, offset, children) {
        const node = createNode({ children })
        joints[name] = { node, offset }
        return node
    }

    const haki = (transformation) => part('sphere', COLORS.white, 'haki', transformation, textures.haki)

    // -- pernas --------------------------------------------------------------
    function leg(side) {
        const s = side === 'L' ? 1 : -1
        return joint(`hip_${side}`, [0.2 * s, -0.05, 0], [
            // perna do short e o punho de pelo branco
            part('cylinder', COLORS.shorts, 'cloth', { translation: [0, -0.08, 0], scale: [0.15, 0.2, 0.15] }),
            part('torus', COLORS.fur, 'cloth', { translation: [0, -0.19, 0], scale: [0.15, 0.25, 0.15] }),
            haki({ translation: [0, -0.32, 0], scale: [0.1, 0.18, 0.1] }),
            joint(`knee_${side}`, [0, -0.45, 0], [
                haki({ translation: [0, -0.2, 0], scale: [0.09, 0.22, 0.09] }),
                haki({ translation: [0, -0.42, 0.05], scale: [0.09, 0.05, 0.15] })
            ])
        ])
    }

    // -- braços --------------------------------------------------------------
    function arm(side) {
        const s = side === 'L' ? 1 : -1
        return joint(`shoulder_${side}`, [0.58 * s, 0.75, 0], [
            // ombro (deltoide enorme), braço e antebraço inflados
            haki({ translation: [0.04 * s, -0.02, 0], scale: [0.3, 0.28, 0.3] }),
            haki({ translation: [0, -0.35, 0], scale: [0.24, 0.32, 0.24] }),
            joint(`elbow_${side}`, [0, -0.62, 0], [
                haki({ translation: [0, -0.22, 0], scale: [0.22, 0.28, 0.22] }),
                // punho gigante
                haki({ translation: [0, -0.55, 0.02], scale: [0.27, 0.24, 0.3] })
            ])
        ])
    }

    // -- cabeça --------------------------------------------------------------
    // espetos do cabelo: [inclinação para frente/trás, inclinação para os lados]
    const SPIKES = [
        [0, 0], [-0.5, 0], [-1.0, 0], [-0.3, 0.6], [-0.3, -0.6],
        [-0.8, 0.5], [-0.8, -0.5], [0.35, 0.4], [0.35, -0.4], [0.5, 0], [0.1, 0.9], [0.1, -0.9]
    ]
    const hair = SPIKES.map(([forward, sideways]) => createNode({
        matrix: transform({ translation: [0, 0.2, -0.02], rotation: [forward, 0, sideways] }),
        children: [part('cone', COLORS.hair, 'shiny', { translation: [0, 0.26, 0], scale: [0.1, 0.28, 0.1] })]
    }))

    function eye(s) {
        return createNode({
            // olhos inclinados, com cara de bravo
            matrix: transform({ translation: [0.09 * s, 0.22, 0.2], rotation: [0, 0.35 * s, -0.35 * s] }),
            children: [
                part('sphere', COLORS.white, 'shiny', { scale: [0.06, 0.032, 0.02] }),
                part('sphere', COLORS.pupil, 'shiny', { translation: [0, 0, 0.014], scale: [0.022, 0.022, 0.012] })
            ]
        })
    }

    const head = joint('neck', [0, 0.88, 0.08], [
        // corda no pescoço
        part('torus', COLORS.rope, 'cloth', { translation: [0, -0.06, 0], scale: [0.21, 0.12, 0.21] }),
        part('sphere', COLORS.skin, 'skin', { translation: [0, 0.18, 0], scale: [0.24, 0.25, 0.23] }),
        // "touca" de cabelo cobrindo o alto e a parte de trás da cabeça
        part('sphere', COLORS.hair, 'shiny', { translation: [0, 0.27, -0.04], scale: [0.25, 0.22, 0.24] }),
        eye(1),
        eye(-1),
        // sorriso de dentes
        part('cube', COLORS.white, 'shiny', { translation: [0, 0.1, 0.2], scale: [0.17, 0.055, 0.04] }),
        ...hair
    ])

    // -- tronco --------------------------------------------------------------
    const torso = joint('spine', [0, 0.18, 0], [
        // barriga e peito largo (com as marcas vermelhas)
        part('sphere', COLORS.skin, 'skin', { translation: [0, 0.2, 0], scale: [0.38, 0.3, 0.28] }),
        part('sphere', COLORS.white, 'skin', { translation: [0, 0.55, 0], scale: [0.58, 0.4, 0.38] }, textures.chest),
        part('vest', COLORS.vest, 'cloth', { translation: [0, 0.55, 0], scale: [0.6, 0.42, 0.4] }),
        head,
        arm('L'),
        arm('R')
    ])

    const hips = createNode({
        matrix: transform({ translation: [0, 0.8, 0] }),
        children: [
            part('sphere', COLORS.shorts, 'cloth', { scale: [0.38, 0.22, 0.28] }),
            // faixa amarela na cintura e a ponta caindo do lado direito
            part('cylinder', COLORS.sash, 'cloth', { translation: [0, 0.15, 0], scale: [0.39, 0.09, 0.29] }),
            part('cube', COLORS.sash, 'cloth', { translation: [-0.3, -0.05, 0.2], rotation: [0, 0, -0.3], scale: [0.1, 0.38, 0.03] }),
            leg('L'),
            leg('R'),
            torso
        ]
    })

    const luffy = createNode({ children: [hips] })
    luffy.joints = joints
    applyPose(luffy, POSES.neutral)
    return luffy
}

export function applyPose(luffy, pose) {
    luffy.matrix = transform(pose.root)
    for (const [name, { node, offset }] of Object.entries(luffy.joints)) {
        node.matrix = transform({ translation: offset, rotation: pose.joints[name] ?? [0, 0, 0] })
    }
}
