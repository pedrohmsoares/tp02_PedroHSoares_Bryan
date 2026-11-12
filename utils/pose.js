import { m4 } from '../twgl.full.module.js'

// leitor do arquivo de pose do XNALara/XPS (.pose), exportado pelo Blender com o
// add-on XPS Tools. É texto, uma linha por osso:
//   nome do osso: rotX rotY rotZ moveX moveY moveZ escalaX escalaY escalaZ
// com a rotação em graus, nos eixos do mundo (os ossos do XPS não têm orientação
// própria, igual ao que usamos no luffy.js)

// ordem em que as rotações são aplicadas ao vértice
const ROTATION_ORDER = ['y', 'x', 'z']

function rotationMatrix([x, y, z]) {
    const angle = { x, y, z }
    const rotate = { x: m4.rotationX, y: m4.rotationY, z: m4.rotationZ }
    // a primeira rotação aplicada fica mais à direita no produto
    let matrix = m4.identity()
    for (const axis of ROTATION_ORDER) {
        matrix = m4.multiply(rotate[axis](angle[axis] * Math.PI / 180), matrix)
    }
    return matrix
}

// devolve { nome do osso: { matrix, translation, scale } }, no mesmo formato que
// o applyPose do luffy.js aceita
export async function loadPose(url) {
    const text = await fetch(url).then(res => res.text())
    const bones = {}
    for (const line of text.split('\n')) {
        const separator = line.lastIndexOf(':')
        if (separator < 0) continue
        const name = line.slice(0, separator).trim()
        const values = line.slice(separator + 1).trim().split(/\s+/).map(Number)
        if (values.length < 9 || values.some(Number.isNaN)) continue
        bones[name] = {
            matrix: rotationMatrix(values.slice(0, 3)),
            translation: values.slice(3, 6),
            scale: values.slice(6, 9)
        }
    }
    return bones
}
