// baseado no vanilla-utils/shader.js da aula de iluminação dinâmica

export function setupWebGL(selector) {
    const canvas = document.querySelector(selector)
    const gl = canvas.getContext('webgl2')
    if (!gl) {
        throw new Error('WebGL2 não suportado')
    }
    return gl
}

function createShader(gl, type, source, name) {
    const shader = gl.createShader(type)
    gl.shaderSource(shader, source.trim())
    gl.compileShader(shader)
    if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        return shader
    }

    const log = gl.getShaderInfoLog(shader)
    gl.deleteShader(shader)
    throw new Error(`Erro ao compilar ${name}: ${log}`)
}

function createProgram(gl, vertexShader, fragmentShader) {
    const program = gl.createProgram()
    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)
    if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
        return program
    }

    const log = gl.getProgramInfoLog(program)
    gl.deleteProgram(program)
    throw new Error(`Erro ao linkar o programa: ${log}`)
}

export async function createProgramFromFiles(gl, vertexPath, fragmentPath) {
    const [vsSource, fsSource] = await Promise.all([
        fetch(vertexPath).then(res => res.text()),
        fetch(fragmentPath).then(res => res.text())
    ])
    const vs = createShader(gl, gl.VERTEX_SHADER, vsSource, vertexPath)
    const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource, fragmentPath)
    return createProgram(gl, vs, fs)
}

export function getUniformLocations(gl, program, names) {
    const locations = {}
    for (const name of names) {
        locations[name] = gl.getUniformLocation(program, name)
    }
    return locations
}
