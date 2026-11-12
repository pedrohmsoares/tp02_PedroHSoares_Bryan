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
        wrist: 'Hand01_L01',
        bone: 'Bip001 L Hand'
    },
    {
        side: -1,
        fingers: [['Hand01_R15', 'Hand01_R16', 'Hand01_R17'], ['Hand01_R03', 'Hand01_R04', 'Hand01_R05'],
                  ['Hand01_R06', 'Hand01_R07', 'Hand01_R08'], ['Hand01_R09', 'Hand01_R10', 'Hand01_R11']],
        thumb: ['Hand01_R12', 'Hand01_R13', 'Hand01_R14'],
        wrist: 'Hand01_R02',
        bone: 'Bip001 R Hand'
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

// cotovelo: dobra o antebraço para a frente em torno do eixo da própria articulação.
// d é a direção do antebraço no bind; o eixo d x (0, 0, 1) é perpendicular a ela, e
// um ângulo positivo leva o antebraço para +z (para a frente). Girar em torno de um
// eixo do mundo (y, por exemplo) misturaria a dobra com uma torção do antebraço.
// twist gira o antebraço já dobrado em torno do eixo do braço (ombro -> cotovelo),
// levando o punho para fora ou para dentro do corpo
function elbowBend(position, side, angle, twist = 0) {
    const d = v3.normalize(v3.subtract(position[`Bip001 ${side} Hand`], position[`Bip001 ${side} Forearm`]))
    const upperArm = v3.normalize(v3.subtract(position[`Bip001 ${side} Forearm`], position[`Bip001 ${side} UpperArm`]))
    const bend = m4.axisRotation(v3.normalize(v3.cross(d, [0, 0, 1])), angle)
    return { matrix: m4.multiply(m4.axisRotation(upperArm, twist), bend) }
}

// giro da mão em torno do eixo do antebraço (cotovelo -> pulso)
function forearmAxis(position, side) {
    return v3.normalize(v3.subtract(position[`Bip001 ${side} Hand`], position[`Bip001 ${side} Forearm`]))
}

// mão aberta em palma de kung fu: dedos quase retos, polegar junto da mão e o pulso
// dobrado para as costas da mão (sinal contrário ao do punho) a ~86°. Depois a mão
// gira ~86° em torno do antebraço, e os dedos ficam na horizontal, apontando para
// o centro do corpo, com a palma para a frente
const PALM = { wrist: 1.5, twist: 1.5, curl: 0.1, thumb: 0.3 }

function palmBones(position, hand) {
    const knuckles = v3.normalize(v3.subtract(position[hand.fingers[0][0]], position[hand.fingers[3][0]]))
    const along = v3.normalize(v3.subtract(position[hand.fingers[1][0]], position[hand.wrist]))
    const forearm = forearmAxis(position, hand.side > 0 ? 'L' : 'R')
    const bend = m4.axisRotation(knuckles, PALM.wrist * hand.side)
    const result = {
        [hand.bone]: { matrix: m4.multiply(m4.axisRotation(forearm, PALM.twist * hand.side), bend) }
    }
    for (const finger of hand.fingers) {
        finger.forEach((name, k) => {
            result[name] = { matrix: m4.axisRotation(knuckles, -(k === 0 ? PALM.curl : PALM.curl / 2) * hand.side) }
        })
    }
    const [base, middle, tip] = hand.thumb
    result[base] = { matrix: m4.axisRotation(along, PALM.thumb * hand.side) }
    result[middle] = { matrix: m4.identity() }
    result[tip] = { matrix: m4.identity() }
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

// quique do Gear 4, copiado do vídeo de referência (altura do topo da cabeça medida
// quadro a quadro): a cada 1,5 s ele fica parado no alto, desce acelerando em 0,25 s,
// volta num tranco em 0,05 s até 1/4 da descida e se acomoda em mais 0,25 s.
// Quadros-chave [tempo (s), profundidade de 0 a 1], interpolados com o tempo
const BOUNCE = { period: 1.5, drop: 0.35, armDelay: 0.05 }
const BOUNCE_KEYS = [[0, 0], [0.25, 1], [0.3, 0.25], [0.55, 0], [1.5, 0]]

// som do quique (só na pose 2). As batidas do arquivo começam em 1,40 s, 2,90 s e
// 4,40 s, também a cada 1,5 s. Usamos o trecho de 1,0 s a 4,0 s (dois ciclos inteiros)
// e alinhamos a batida de 1,40 s com o instante 0,22 s do ciclo, logo antes do fundo
// da descida, para o pico do som (~0,1 s depois) cair no tranco de volta.
// lead = 0,4 - 0,22: quanto o áudio está adiantado em relação ao começo do ciclo
const BOUNCE_SOUND = {
    file: 'assets/sounds/luffyBouncing.mp3',
    start: 1.0, length: 2 * BOUNCE.period, lead: 0.4 - 0.22, tolerance: 0.08
}

function bounceDepth(time) {
    const t = ((time % BOUNCE.period) + BOUNCE.period) % BOUNCE.period
    for (let k = 1; k < BOUNCE_KEYS.length; k++) {
        const [t0, d0] = BOUNCE_KEYS[k - 1]
        const [t1, d1] = BOUNCE_KEYS[k]
        if (t > t1) continue
        let s = (t - t0) / (t1 - t0)
        // a descida acelera como uma queda (s²); os outros trechos suavizam (smoothstep)
        s = k === 1 ? s * s : s * s * (3 - 2 * s)
        return d0 + (d1 - d0) * s
    }
    return 0
}

// na descida o corpo baixa, as pernas encolhem mais (molas comprimidas) e o tronco
// inclina para a frente; os braços vão junto com um pequeno atraso (inércia dos punhos)
function bouncingBones(pose, time) {
    const depth = bounceDepth(time)
    const arms = bounceDepth(time - BOUNCE.armDelay)
    const add = (name, delta) => pose.bones[name].map((value, k) => value + delta[k])
    const [x, y, z] = pose.root.translation
    return {
        root: { ...pose.root, translation: [x, y - BOUNCE.drop * depth, z] },
        bones: {
            'Bip001 Spine1': add('Bip001 Spine1', [0.15 * depth, 0, 0]),
            'Bip001 R Thigh': add('Bip001 R Thigh', [-0.4 * depth, 0, 0]),
            'Bip001 L Thigh': add('Bip001 L Thigh', [-0.4 * depth, 0, 0]),
            'Bip001 R Calf': add('Bip001 R Calf', [0.6 * depth, 0, 0]),
            'Bip001 L Calf': add('Bip001 L Calf', [0.6 * depth, 0, 0]),
            'Bip001 R UpperArm': add('Bip001 R UpperArm', [0, 0, 0.15 * arms]),
            'Bip001 L UpperArm': add('Bip001 L UpperArm', [0, 0, -0.15 * arms])
        }
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
        // Gear 4 quicando no ar, de frente para a câmera. O braço direito vem para a
        // frente com a mão aberta em palma; o esquerdo fica recuado, armando o soco
        root: { translation: [0, 0.5, 0], rotation: [0, 0, 0] },
        gunArms: false,
        fists: true,
        bouncing: true,
        // ossos que dependem das posições do bind (calculados no createLuffy)
        build: position => ({
            // sem dobra: o antebraço direito segue reto a linha do braço
            'Bip001 R Forearm': elbowBend(position, 'R', 0),
            // cotovelo bem dobrado, com o punho colado ao corpo perto do ombro,
            // e a mão girada no antebraço para a palma (dedos dobrados) ficar para fora
            'Bip001 L Forearm': elbowBend(position, 'L', 2.6, 0.4),
            'Bip001 L Hand': { matrix: m4.axisRotation(forearmAxis(position, 'L'), 1.6) },
            ...palmBones(position, HANDS[1])
        }),
        bones: {
            ...ANGRY_FACE,
            'facebone_01': [0.3, 0, 0],     // boca mais aberta que na pose 1 (grito)
            // tronco torcido para a esquerda da tela e cabeça inclinada para a frente
            'Bip001 Spine1': [0.1, -0.2, 0],
            // cabeça olhando ao longo do braço da palma: o braço aponta ~50° para a
            // direita dele; o tronco já gira 0,2, a cabeça gira o resto. Quase sem
            // inclinar para baixo, para o queixo não encostar no peito
            'Bip001 Head': [0.05, -0.67, 0],
            // braço direito para o lado e para a frente; esquerdo erguido e para trás
            'Bip001 R UpperArm': [0, 0.9, -0.4],
            'Bip001 L UpperArm': [0, 0.6, 1.4],
            // pernas encolhidas como molas: joelhos para a frente e para fora,
            // canelas dobradas para trás e pés esticados para baixo
            'Bip001 R Thigh': [-1.0, 0, -0.7],
            'Bip001 R Calf': [2.0, 0, 0],
            'Bip001 R Foot': [0.8, 0, 0.3],
            'Bip001 L Thigh': [-0.8, 0, 0.6],
            'Bip001 L Calf': [1.8, 0, 0],
            'Bip001 L Foot': [0.9, 0, -0.2]
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
    const position = Object.fromEntries(bones.map(bone => [bone.name, bone.position]))
    for (const pose of POSES) {
        if (pose.build) pose.bones = { ...pose.bones, ...pose.build(position) }
    }
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

    const bounceSound = new Audio(BOUNCE_SOUND.file)

    // o som acompanha o tempo da animação: o instante certo do áudio é calculado a
    // partir do tempo e, se o som estiver adiantado ou atrasado (ou passou do fim do
    // trecho), ele é reposicionado. Assim o trecho de 3 s se repete sem perder o ritmo
    function syncBounceSound(time) {
        if (bounceSound.paused) return
        const { start, length, lead } = BOUNCE_SOUND
        const expected = start + ((((time + lead) % length) + length) % length)
        if (Math.abs(bounceSound.currentTime - expected) > BOUNCE_SOUND.tolerance) {
            bounceSound.currentTime = expected
        }
    }

    return {
        nextPose() {
            poseIndex = (poseIndex + 1) % POSES.length
            applyPose(POSES[poseIndex])
            // o navegador só deixa tocar som depois de uma ação do usuário; a troca de
            // pose vem da tecla P, então o play() é chamado aqui
            if (POSES[poseIndex].bouncing) bounceSound.play().catch(() => {})
            else bounceSound.pause()
        },

        // poses animadas (respiração e quique): recalcula a pose a cada quadro
        update(time) {
            const pose = POSES[poseIndex]
            if (pose.breathing) applyPose(pose, breathingBones(time))
            if (pose.bouncing) {
                const { root, bones } = bouncingBones(pose, time)
                applyPose({ ...pose, root }, bones)
                syncBounceSound(time)
            }
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

