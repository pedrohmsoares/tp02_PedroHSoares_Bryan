// mesmas posições usadas nos shaders: layout(location = N)
export const ATTRIBUTES = {
    a_coords: 0,
    a_normal: 1,
    a_texcoord: 2
}

function createAttribute(gl, location, data, size) {
    const vbo = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)
    gl.enableVertexAttribArray(location)
    gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0)
}

// recebe o resultado de primitives.createXxxVertices() da TWGL
// ({ position, normal, texcoord, indices }) e cria VAO, VBOs e IBO
export function createMesh(gl, vertices) {
    const vao = gl.createVertexArray()
    gl.bindVertexArray(vao)

    createAttribute(gl, ATTRIBUTES.a_coords, vertices.position, 3)
    createAttribute(gl, ATTRIBUTES.a_normal, vertices.normal, 3)
    createAttribute(gl, ATTRIBUTES.a_texcoord, vertices.texcoord, 2)

    const ibo = gl.createBuffer()
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, vertices.indices, gl.STATIC_DRAW)

    gl.bindVertexArray(null)

    const count = vertices.indices.length
    const indexType = vertices.indices instanceof Uint32Array ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT

    return {
        vao,
        draw(gl) {
            gl.bindVertexArray(vao)
            gl.drawElements(gl.TRIANGLES, count, indexType, 0)
        }
    }
}
