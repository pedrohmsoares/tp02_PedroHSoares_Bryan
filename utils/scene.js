import { m4 } from '../twgl.full.module.js'

// nó do grafo de cena (aula de otimização de cenas): matriz local em relação
// ao pai, mesh opcional e filhos. Um nó sem mesh só agrupa/transforma os filhos
export function createNode({
    mesh = null,
    texture = null,
    color = [1, 1, 1, 1],
    material = null,
    matrix = m4.identity(),
    children = [],
    update = null
} = {}) {
    return { mesh, texture, color, material, matrix, children, update }
}

// translação, rotação (em radianos, ordem Y, X, Z) e escala numa matriz só
export function transform({ translation = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1] } = {}) {
    let matrix = m4.translation(translation)
    matrix = m4.rotateY(matrix, rotation[1])
    matrix = m4.rotateX(matrix, rotation[0])
    matrix = m4.rotateZ(matrix, rotation[2])
    return m4.scale(matrix, scale)
}

export function updateNode(node, dt) {
    if (node.update) node.update(node, dt)
    for (const child of node.children) {
        updateNode(child, dt)
    }
}
