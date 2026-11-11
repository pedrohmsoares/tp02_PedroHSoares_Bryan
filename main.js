import { m4 } from './twgl.full.module.js'
import { setupWebGL, createProgramFromFiles, getUniformLocations } from './utils/shader.js'
import { createColorTexture } from './utils/texture.js'
import { camera, selectCamera, setupCameraControls, updateCamera } from './camera.js'
import { createNode, updateNode } from './utils/scene.js'
import { createGround } from './scene/ground.js'
import { createRocks } from './scene/rock.js'
import { createRuin } from './scene/ruin.js'
import { createSunflower } from './scene/sunflower.js'
import { createPinwheel } from './scene/pinwheel.js'
import { createSkydome, HORIZON_COLOR } from './scene/skydome.js'
import { createBirdcage } from './scene/birdcage.js'

const UNIFORMS = [
    'u_model', 'u_view', 'u_projection',
    'u_texture', 'u_baseColor',
    'u_lightDirection', 'u_lightColor', 'u_cameraPosition', 'u_lightingEnabled',
    'u_ambient', 'u_diffuse', 'u_specular', 'u_shininess',
    'u_fogEnabled', 'u_fogColor', 'u_fogDensity'
]

const state = {
    program: null,
    locations: {},
    projectionMatrix: m4.identity(),
    whiteTexture: null,
    // luz do fim de tarde: vem de cima e um pouco de lado, tom quente
    light: {
        direction: [-0.4, -1.0, -0.3],
        color: [1.0, 0.88, 0.72],
        enabled: true
    },
    // cinza-poeira, combinando com o clima de destruição
    fog: {
        enabled: false,
        color: [0.55, 0.52, 0.48],
        density: 0.06
    },
    scene: null,
    sky: null,
    cage: null,
    time: 0
}

function resize(gl) {
    const canvas = gl.canvas
    const width = Math.floor(canvas.clientWidth * window.devicePixelRatio)
    const height = Math.floor(canvas.clientHeight * window.devicePixelRatio)
    if (canvas.width === width && canvas.height === height) return

    canvas.width = width
    canvas.height = height
    gl.viewport(0, 0, width, height)
    state.projectionMatrix = m4.perspective(Math.PI / 3, width / height, 0.1, 100)
}

function setupKeyboard() {
    window.addEventListener('keydown', (e) => {
        if (e.repeat) return
        if (e.code === 'Digit1') selectCamera(1)
        if (e.code === 'Digit2') selectCamera(2)
        if (e.code === 'KeyL') state.light.enabled = !state.light.enabled
        if (e.code === 'KeyN') state.fog.enabled = !state.fog.enabled
    })
}

async function initialize(gl) {
    state.program = await createProgramFromFiles(gl, 'shaders/phong.vertex.glsl', 'shaders/phong.fragment.glsl')
    state.locations = getUniformLocations(gl, state.program, UNIFORMS)
    state.whiteTexture = createColorTexture(gl)

    state.scene = createNode({
        children: await Promise.all([
            createGround(gl),
            createRocks(gl),
            createRuin(gl),
            createSunflower(gl),
            createPinwheel(gl)
        ])
    })

    state.sky = await createSkydome(gl)
    state.cage = await createBirdcage(gl)

    gl.enable(gl.DEPTH_TEST)
    gl.enable(gl.CULL_FACE)

    setupCameraControls(gl.canvas)
    setupKeyboard()
}

// percorre o grafo de cena: a matriz do mundo de cada nó é a do pai vezes a sua
function drawNode(gl, node, parentMatrix) {
    const { locations } = state
    const worldMatrix = m4.multiply(parentMatrix, node.matrix)

    if (node.mesh) {
        const { material } = node
        gl.bindTexture(gl.TEXTURE_2D, node.texture ?? state.whiteTexture)
        gl.uniformMatrix4fv(locations.u_model, false, worldMatrix)
        gl.uniform4fv(locations.u_baseColor, node.color)
        gl.uniform1f(locations.u_ambient, material.ambient)
        gl.uniform1f(locations.u_diffuse, material.diffuse)
        gl.uniform1f(locations.u_specular, material.specular)
        gl.uniform1f(locations.u_shininess, material.shininess)
        node.mesh.draw(gl)
    }

    for (const child of node.children) {
        drawNode(gl, child, worldMatrix)
    }
}

function render(gl) {
    const { locations, light, fog } = state

    // abaixo do horizonte do skydome aparece a cor de fundo: a do horizonte do céu,
    // ou a da neblina quando ela está ligada (como no glFog visto em aula)
    gl.clearColor(...(fog.enabled ? fog.color : HORIZON_COLOR), 1)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    const view = { camera, projectionMatrix: state.projectionMatrix, fog, time: state.time }
    state.sky.draw(gl, view)

    gl.useProgram(state.program)
    gl.uniformMatrix4fv(locations.u_view, false, camera.viewMatrix)
    gl.uniformMatrix4fv(locations.u_projection, false, state.projectionMatrix)
    gl.uniform3fv(locations.u_cameraPosition, camera.position)
    gl.uniform3fv(locations.u_lightDirection, light.direction)
    gl.uniform3fv(locations.u_lightColor, light.color)
    gl.uniform1i(locations.u_lightingEnabled, light.enabled)
    gl.uniform1i(locations.u_fogEnabled, fog.enabled)
    gl.uniform3fv(locations.u_fogColor, fog.color)
    gl.uniform1f(locations.u_fogDensity, fog.density)
    gl.uniform1i(locations.u_texture, 0)

    gl.activeTexture(gl.TEXTURE0)

    drawNode(gl, state.scene, m4.identity())

    // transparentes por último
    state.cage.draw(gl, view)
    gl.bindVertexArray(null)
}

const gl = setupWebGL('#canvas')
await initialize(gl)

let lastTime = performance.now()
function frame(now) {
    // limita o dt para não dar saltos quando a aba fica em segundo plano
    const dt = Math.min((now - lastTime) / 1000, 0.1)
    lastTime = now
    state.time += dt

    resize(gl)
    updateCamera(dt)
    updateNode(state.scene, dt)
    render(gl)
    requestAnimationFrame(frame)
}
requestAnimationFrame(frame)
