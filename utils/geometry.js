import { v3 } from '../twgl.full.module.js'

// Cada face tem seus próprios vértices para manter as quinas bem marcadas.
export function triangleMesh() {
    const position = [], normal = [], texcoord = []
    return {
        triangle(a, b, c, uv = [[0, 0], [1, 0], [1, 1]]) {
            const n = v3.normalize(v3.cross(v3.subtract(b, a), v3.subtract(c, a)))
            for (const [i, vertex] of [a, b, c].entries()) {
                position.push(...vertex)
                normal.push(...n)
                texcoord.push(...uv[i])
            }
        },
        vertices() {
            return {
                position: new Float32Array(position), normal: new Float32Array(normal),
                texcoord: new Float32Array(texcoord),
                indices: Uint16Array.from({ length: position.length / 3 }, (_, i) => i)
            }
        }
    }
}

// Parede de espessura 1, com um perfil quebrado no topo.
export function createBrokenWallVertices() {
    const mesh = triangleMesh()
    const profile = [[-0.5, 0.1], [-0.4, 0.25], [-0.28, 0.18], [-0.18, 0.45],
        [-0.05, 0.3], [0.08, 0.42], [0.18, 0.35], [0.28, 0.5], [0.36, 0.5], [0.5, 0.15]]
    const quad = (a, b, c, d) => {
        const n = v3.cross(v3.subtract(b, a), v3.subtract(c, a)).map(Math.abs)
        const uv = ([x, y, z]) => n[2] >= n[0] && n[2] >= n[1] ? [x + 0.5, y + 0.5]
            : n[1] >= n[0] ? [x + 0.5, z + 0.5] : [z + 0.5, y + 0.5]
        mesh.triangle(a, b, c, [uv(a), uv(b), uv(c)])
        mesh.triangle(a, c, d, [uv(a), uv(c), uv(d)])
    }
    for (let i = 1; i < profile.length; i++) {
        const [x0, h0] = profile[i - 1], [x1, h1] = profile[i]
        quad([x0, -0.5, 0.5], [x1, -0.5, 0.5], [x1, h1, 0.5], [x0, h0, 0.5])
        quad([x1, -0.5, -0.5], [x0, -0.5, -0.5], [x0, h0, -0.5], [x1, h1, -0.5])
        quad([x0, h0, 0.5], [x1, h1, 0.5], [x1, h1, -0.5], [x0, h0, -0.5])
    }
    const [left, lh] = profile[0], [right, rh] = profile.at(-1)
    quad([left, -0.5, -0.5], [left, -0.5, 0.5], [left, lh, 0.5], [left, lh, -0.5])
    quad([right, -0.5, 0.5], [right, -0.5, -0.5], [right, rh, -0.5], [right, rh, 0.5])
    quad([left, -0.5, -0.5], [right, -0.5, -0.5], [right, -0.5, 0.5], [left, -0.5, 0.5])
    return mesh.vertices()
}

// Placa de pedra pentagonal, com topo e laterais fechados.
export function createSlabVertices() {
    const mesh = triangleMesh()
    const points = [[-0.55, -0.25], [-0.12, -0.5], [0.48, -0.3], [0.43, 0.35], [-0.32, 0.48]]
    for (let i = 0; i < points.length; i++) {
        const [x, z] = points[i], [nx, nz] = points[(i + 1) % points.length]
        mesh.triangle([0, 0.1, 0], [nx, 0.1, nz], [x, 0.1, z])
        mesh.triangle([0, -0.1, 0], [x, -0.1, z], [nx, -0.1, nz])
        mesh.triangle([x, -0.1, z], [x, 0.1, z], [nx, 0.1, nz])
        mesh.triangle([x, -0.1, z], [nx, 0.1, nz], [nx, -0.1, nz])
    }
    return mesh.vertices()
}
