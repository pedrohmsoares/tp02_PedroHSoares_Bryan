import { m4, v3 } from '../twgl.full.module.js'
import { ATTRIBUTES, createMesh } from '../utils/buffers.js'
import { loadTexture } from '../utils/texture.js'
import { transform } from '../utils/scene.js'
import { loadXps } from '../utils/xps.js'
import { loadPose } from '../utils/pose.js'

// Luffy Gear 4 (Boundman), modelo do jogo One Piece Fighting Path (por o_dv89_o).
// Tem esqueleto: cada pose é uma tabela de rotações de ossos, e o shader de
// skinning deforma a malha conforme essas rotações.
//
// O modelo está guardado na "pose de bind" (braços abertos em A). Nela os ossos
// não têm rotação, só posição, então a rotação de cada osso é dada nos eixos do mundo
const FOLDER = 'assets/models/boundman/'
// poses feitas no Blender (script referencias/blender/exportar_pose.py). Uma pose com
// file usa o arquivo no lugar da tabela; o rosto bravo (keepFace) e o punho
// fechado (fists) continuam vindo do código
const POSE_FOLDER = 'assets/poses/'

// partes que não desenhamos: a fumaça do modelo (faremos a nossa com partículas)
const HIDDEN = ['cloud']
// os braços normais e os braços inflados do King Kong Gun são malhas separadas
const ARMS = '+ArmsHands'
const GUN_ARMS = '-ArmsGun'

const SKIN = { ambient: 0.4, diffuse: 0.85, specular: 0.15, shininess: 10 }
const HAKI = { ambient: 0.35, diffuse: 0.75, specular: 0.8, shininess: 48 }

// cada osso da pose recebe uma rotação [x, y, z] (radianos) ou um objeto
// { rotation, translation, scale } (translação em relação à posição de bind, usada
// no rosto) ou { matrix, translation, scale } (rotação já pronta: dedos e .pose).
// Ossos fora da tabela ficam como no bind

// rosto bravo (ossos faciais do modelo): sobrancelhas franzidas, boca aberta
// mostrando os dentes cerrados e cantos da boca puxados para os lados
const ANGRY_FACE = {
    // entre as sobrancelhas: desce e vai para trás (franzir)
    'facebone_15': { translation: [-0.004, -0.012, -0.004] },
    'facebone_050': { translation: [0.004, -0.012, -0.004] },
    // meio das sobrancelhas: desce um pouco
    'facebone_05': { translation: [0, -0.006, 0] },
    'facebone_051': { translation: [0, -0.006, 0] },
    // mandíbula abre (o lábio de baixo é filho dela)
    'facebone_01': [0.22, 0, 0],
    // lábio de cima sobe
    'facebone_22': { translation: [0, 0.008, 0] },
    'facebone_17': { translation: [0, 0.008, 0] },
    'facebone_26': { translation: [0, 0.008, 0] },
    'facebone_14': { translation: [0.003, 0.006, 0] },
    'facebone_29': { translation: [-0.003, 0.006, 0] },
    // cantos da boca para os lados
    'facebone_13': { translation: [0.008, -0.002, -0.002] },
    'facebone_30': { translation: [-0.008, -0.002, -0.002] }
}

// punhos cerrados. Ossos de cada mão: 4 dedos com 3 falanges (do indicador ao
// mindinho), o polegar com 3 falanges, o pulso e a base do dedo médio
const HANDS = [
    {
        side: 1,
        fingers: [['Hand01_L11', 'Hand01_L12', 'Hand01_L13'], ['Hand01_L02', 'Hand01_L03', 'Hand01_L04'],
                  ['Hand01_L05', 'Hand01_L06', 'Hand01_L07'], ['Hand01_L08', 'Hand01_L09', 'Hand01_L10']],
        thumb: ['Hand01_L14', 'Hand01_L15', 'Hand01_L16'],
        wrist: 'Hand01_L01'
    },
    {
        side: -1,
        fingers: [['Hand01_R15', 'Hand01_R16', 'Hand01_R17'], ['Hand01_R03', 'Hand01_R04', 'Hand01_R05'],
                  ['Hand01_R06', 'Hand01_R07', 'Hand01_R08'], ['Hand01_R09', 'Hand01_R10', 'Hand01_R11']],
        thumb: ['Hand01_R12', 'Hand01_R13', 'Hand01_R14'],
        wrist: 'Hand01_R02'
    }
]
const FINGER_CURL = [1.4, 1.5, 1.2]     // ângulo de cada falange (base, meio, ponta)
const THUMB_TURN = 1.0                   // polegar gira para a frente da palma
const THUMB_CURL = [0.5, 0.9]

// as falanges dobram em torno do eixo dos nós dos dedos (linha do mindinho até
// o indicador). Como no bind os ossos não têm rotação, esse eixo vem direto das
// posições dos ossos. O eixo aponta para a frente (+z) nas duas mãos, então o ângulo
// é -side: assim os dedos dobram para o lado da palma (com +side dobravam para as
// costas da mão). Devolve { nome do osso: { matrix } } para a pose
function fistBones(bones) {
    const position = Object.fromEntries(bones.map(bone => [bone.name, bone.position]))
    const result = {}
    for (const hand of HANDS) {
        const index = hand.fingers[0]
        const pinky = hand.fingers[3]
        const knuckles = v3.normalize(v3.subtract(position[index[0]], position[pinky[0]]))
        const along = v3.normalize(v3.subtract(position[hand.fingers[1][0]], position[hand.wrist]))

        for (const finger of hand.fingers) {
            finger.forEach((name, k) => {
                result[name] = { matrix: m4.axisRotation(knuckles, -FINGER_CURL[k] * hand.side) }
            })
        }

        // polegar: a base gira em torno do eixo da mão (vai para a frente da palma)
        // e as outras falanges dobram por cima dos dedos. O eixo das falanges já sai
        // espelhado entre as mãos (produto vetorial com along), então não leva side
        const [base, middle, tip] = hand.thumb
        const thumbDirection = v3.normalize(v3.subtract(position[middle], position[base]))
        const thumbAxis = v3.normalize(v3.cross(thumbDirection, along))
        result[base] = { matrix: m4.axisRotation(along, THUMB_TURN * hand.side) }
        result[middle] = { matrix: m4.axisRotation(thumbAxis, THUMB_CURL[0]) }
        result[tip] = { matrix: m4.axisRotation(thumbAxis, THUMB_CURL[1]) }
    }
    return result
}

// respiração: um ciclo a cada BREATH_PERIOD segundos. breath vai de 0 (ar solto) a
// 1 (peito cheio) com (1 - cos) / 2, que começa e termina devagar. Ao puxar o ar o
// peito inclina um pouco para trás e os ombros sobem; o pescoço desfaz a inclinação
// do peito para a cabeça ficar quase parada
const BREATH_PERIOD = 3.5
const BREATH = { chest: 0.035, shoulders: 0.05 }

function breathingBones(time) {
    const breath = (1 - Math.cos(2 * Math.PI * time / BREATH_PERIOD)) / 2
    const chest = -BREATH.chest * breath
    const shoulders = BREATH.shoulders * breath
    return {
        'Bip001 Spine1': [chest / 2, 0, 0],
        'Bip001 Spine2': [chest / 2, 0, 0],
        'Bip001 Neck': [-chest, 0, 0],
        'Bip001 L Clavicle': [0, 0, shoulders],
        'Bip001 R Clavicle': [0, 0, -shoulders]
    }
}

export const POSES = [
    {
        name: 'neutra',
        root: { translation: [0, 0, 0], rotation: [0, 0, 0] },
        gunArms: false,
        fists: true,
        breathing: true,
        bones: {
            // rosto neutro (o do próprio modelo). Braços arqueados no plano do corpo:
            // o braço sobe 15° (fica a ~60° do tronco; no bind está a 45°) e o
            // cotovelo dobra para dentro, com o punho voltando para perto do quadril
            'Bip001 L UpperArm': [0, 0, 0.26],
            'Bip001 R UpperArm': [0, 0, -0.26],
            'Bip001 L Forearm': [0, 0, -1.4],
            'Bip001 R Forearm': [0, 0, 1.4],
            'Bip001 L Thigh': [-0.15, 0, 0.05],
            'Bip001 R Thigh': [-0.15, 0, -0.05],
            'Bip001 L Calf': [0.3, 0, 0],
            'Bip001 R Calf': [0.3, 0, 0]
        }
    },
    {
        name: 'ataque básico',
        // virado para a esquerda da câmera inicial
        root: { translation: [0.6, 0, 0.4], rotation: [0, -Math.PI / 2, 0] },
        gunArms: false,
        bones: {
            'Bip001 Spine1': [0, -0.35, 0],
            // braço direito esticado para frente (horizontal e girado para +z)
            'Bip001 R UpperArm': [0, Math.PI / 2, -0.7],
            'Bip001 R Forearm': [0, 0, 0.1],
            // braço esquerdo puxado para trás, com o cotovelo dobrado
            'Bip001 L UpperArm': [0, 0.8, 0.5],
            'Bip001 L Forearm': [0, -1.2, 0],
            'Bip001 L Thigh': [-0.5, 0, 0.1],
            'Bip001 L Calf': [0.5, 0, 0],
            'Bip001 R Thigh': [0.3, 0, -0.1],
            'Bip001 R Calf': [0.4, 0, 0]
        }
    },
    {
        name: 'King Kong Gun',
        // virado para a direita da câmera inicial
        root: { translation: [-0.6, 0, 0.4], rotation: [0, Math.PI / 2, 0] },
        gunArms: true,
        bones: {
            'Bip001 Spine1': [0, 0.4, 0],
            // punho gigante do braço direito puxado para trás, pronto para o golpe
            'Hand03_R00': [0, -0.9, 0.6],
            'Hand03_R08': [0, 0, 0],
            // braço esquerdo para frente, mirando
            'Hand03_L00': [0, -Math.PI / 2, 0.75],
            'Bip001 L Thigh': [-0.6, 0, 0.15],
            'Bip001 L Calf': [0.6, 0, 0],
            'Bip001 R Thigh': [0.35, 0, -0.15],
            'Bip001 R Calf': [0.5, 0, 0]
        }
    }
]

export async function createLuffy(gl) {
    const model = await loadXps(FOLDER + 'boundman.xps')
    const bones = model.bones
    const meshes = model.meshes.filter(mesh => !HIDDEN.some(name => mesh.name.includes(name)))

    const textures = {}
    for (const file of new Set(meshes.map(mesh => mesh.textures[0]))) {
        textures[file] = await loadTexture(gl, FOLDER + file)
    }

    const parts = meshes.map(mesh => ({
            name: mesh.name,
            texture: textures[mesh.textures[0]],
            material: mesh.name.includes('Arms') ? HAKI : SKIN,
            mesh: createMesh(gl, mesh, [
                { location: ATTRIBUTES.a_boneIndices, data: mesh.boneIndices, size: 4 },
                { location: ATTRIBUTES.a_boneWeights, data: mesh.boneWeights, size: 4 }
            ])
        }))

    const fists = fistBones(bones)
    for (const pose of POSES) {
        if (!pose.file) continue
        const fileBones = await loadPose(POSE_FOLDER + pose.file)
        // arquivo inexistente (404) não tem nenhuma linha de osso: fica a pose do código
        if (Object.keys(fileBones).length > 0) pose.fileBones = fileBones
    }
    const boneMatrices = new Float32Array(bones.length * 16)
    let modelMatrix = m4.identity()
    let poseIndex = 0
    let gunArms = false

    // matriz de cada osso no mundo = matriz do pai * translação até o osso * rotação da pose.
    // A matriz enviada ao shader desfaz a posição de bind (translação por -posição),
    // aplica a do osso, e assim leva o vértice da pose de bind para a pose atual
    // extra: ossos somados por cima da pose a cada quadro (a respiração)
    function applyPose(pose, extra = {}) {
        const world = []
        // pose do arquivo: os dedos não espelham pelo nome no Blender, então com
        // fists o punho fechado vem do código por cima do arquivo
        const baseBones = pose.fileBones
            ? { ...pose.fileBones, ...(pose.fists ? fists : {}), ...(pose.keepFace ? ANGRY_FACE : {}) }
            : pose.fists ? { ...fists, ...pose.bones } : pose.bones
        const poseBones = { ...baseBones, ...extra }
        bones.forEach((bone, i) => {
            const parent = bone.parent >= 0 ? bones[bone.parent].position : [0, 0, 0]
            const offset = bone.position.map((value, k) => value - parent[k])
            const value = poseBones[bone.name] ?? {}
            const { rotation = [0, 0, 0], translation = [0, 0, 0], scale = [1, 1, 1], matrix } =
                Array.isArray(value) ? { rotation: value } : value
            const moved = offset.map((v, k) => v + translation[k])
            const local = matrix
                ? m4.scale(m4.multiply(m4.translation(moved), matrix), scale)
                : transform({ translation: moved, rotation, scale })
            world[i] = bone.parent >= 0 ? m4.multiply(world[bone.parent], local) : local
            const skin = m4.translate(world[i], bone.position.map(value => -value))
            boneMatrices.set(skin, i * 16)
        })
        modelMatrix = transform(pose.root)
        gunArms = pose.gunArms
    }

    applyPose(POSES[0])

    return {
        nextPose() {
            poseIndex = (poseIndex + 1) % POSES.length
            applyPose(POSES[poseIndex])
        },

        // respiração: só nas poses com breathing, recalcula a pose a cada quadro
        update(time) {
            const pose = POSES[poseIndex]
            if (pose.breathing) applyPose(pose, breathingBones(time))
        },

        // usa o programa de skinning, com os uniformes de luz/câmera já definidos
        draw(gl, locations) {
            gl.uniformMatrix4fv(locations.u_bones, false, boneMatrices)
            gl.uniformMatrix4fv(locations.u_model, false, modelMatrix)
            gl.uniform4fv(locations.u_baseColor, [1, 1, 1, 1])
            for (const part of parts) {
                if (part.name.includes(gunArms ? ARMS : GUN_ARMS)) continue
                gl.bindTexture(gl.TEXTURE_2D, part.texture)
                gl.uniform1f(locations.u_ambient, part.material.ambient)
                gl.uniform1f(locations.u_diffuse, part.material.diffuse)
                gl.uniform1f(locations.u_specular, part.material.specular)
                gl.uniform1f(locations.u_shininess, part.material.shininess)
                part.mesh.draw(gl)
            }
        }
    }
}

