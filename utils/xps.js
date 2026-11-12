// leitor do formato binário do XNALara/XPS (.xps), versão 2.x, usado pelo
// modelo do Luffy. Estrutura do arquivo:
//   cabeçalho -> ossos (nome, pai, posição) -> malhas (nome, texturas,
//   vértices com posição/normal/cor/uv/4 ossos/4 pesos, triângulos)

class Reader {
    constructor(buffer) {
        this.view = new DataView(buffer)
        this.bytes = new Uint8Array(buffer)
        this.offset = 0
    }
    u8() { return this.view.getUint8(this.offset++) }
    u16() { const v = this.view.getUint16(this.offset, true); this.offset += 2; return v }
    i16() { const v = this.view.getInt16(this.offset, true); this.offset += 2; return v }
    u32() { const v = this.view.getUint32(this.offset, true); this.offset += 4; return v }
    f32() { const v = this.view.getFloat32(this.offset, true); this.offset += 4; return v }
    skip(n) { this.offset += n }

    // texto: tamanho em "7 bits por byte" (o último byte tem o bit alto = 0)
    string() {
        let length = 0
        let shift = 0
        let byte
        do {
            byte = this.u8()
            length |= (byte & 0x7f) << shift
            shift += 7
        } while (byte & 0x80)
        const text = new TextDecoder().decode(this.bytes.subarray(this.offset, this.offset + length))
        this.offset += length
        return text
    }
}

export async function loadXps(url) {
    const buffer = await fetch(url).then(res => res.arrayBuffer())
    const r = new Reader(buffer)

    // cabeçalho: número mágico, versão e um bloco de configurações que pulamos
    const magic = r.u32()
    if (magic !== 323232) throw new Error(`${url} não é um arquivo XPS`)
    r.u16()
    r.u16()
    r.string()
    const settingsLength = r.u32()
    r.string()
    r.string()
    r.string()
    r.skip(settingsLength * 4)

    const bones = []
    const boneCount = r.u32()
    for (let i = 0; i < boneCount; i++) {
        const name = r.string()
        const parent = r.i16()
        const position = [r.f32(), r.f32(), r.f32()]
        bones.push({ name, parent, position })
    }

    const meshes = []
    const meshCount = r.u32()
    for (let m = 0; m < meshCount; m++) {
        const name = r.string()
        const uvLayers = r.u32()
        const textures = []
        const textureCount = r.u32()
        for (let t = 0; t < textureCount; t++) {
            textures.push(r.string().split('\\').pop())
            r.u32()
        }

        const vertexCount = r.u32()
        const position = new Float32Array(vertexCount * 3)
        const normal = new Float32Array(vertexCount * 3)
        const texcoord = new Float32Array(vertexCount * 2)
        const boneIndices = new Float32Array(vertexCount * 4)
        const boneWeights = new Float32Array(vertexCount * 4)
        for (let v = 0; v < vertexCount; v++) {
            for (let k = 0; k < 3; k++) position[v * 3 + k] = r.f32()
            for (let k = 0; k < 3; k++) normal[v * 3 + k] = r.f32()
            r.skip(4)                                   // cor do vértice (não usamos)
            texcoord[v * 2] = r.f32()
            texcoord[v * 2 + 1] = r.f32()
            r.skip(8 * (uvLayers - 1))                  // camadas de uv extras
            for (let k = 0; k < 4; k++) boneIndices[v * 4 + k] = Math.max(0, r.i16())
            for (let k = 0; k < 4; k++) boneWeights[v * 4 + k] = r.f32()
        }

        // o XPS guarda os triângulos em sentido horário (padrão do DirectX); o
        // WebGL considera frente o sentido anti-horário e, com o culling ligado,
        // descartaria as faces da frente. Trocamos a ordem do 2º e 3º vértices
        const triangleCount = r.u32()
        const indices = new Uint32Array(triangleCount * 3)
        for (let t = 0; t < triangleCount; t++) {
            indices[t * 3] = r.u32()
            indices[t * 3 + 2] = r.u32()
            indices[t * 3 + 1] = r.u32()
        }

        meshes.push({ name, textures, position, normal, texcoord, boneIndices, boneWeights, indices })
    }

    return { bones, meshes }
}
