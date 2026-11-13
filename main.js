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
import { createLuffy } from './scene/luffy.js'
import { createSkydome, HORIZON_COLOR } from './scene/skydome.js'
import { createBirdcage } from './scene/birdcage.js'
import { createDebris } from './scene/debris.js'
import { createParticles } from './scene/particles.js'

const UNIFORMS = [
    'u_model', 'u_view', 'u_projection',
    'u_texture', 'u_baseColor',
    'u_lightDirection', 'u_lightColor', 'u_cameraPosition', 'u_lightingEnabled',
    'u_ambient', 'u_diffuse', 'u_specular', 'u_shininess',
    'u_fogEnabled', 'u_fogColor', 'u_fogDensity', 'u_fogStart', 'u_fogHeightFalloff', 'u_fogAmount'
]
// o programa do Luffy usa os mesmos uniformes, mais as matrizes dos ossos
const SKIN_UNIFORMS = [...UNIFORMS, 'u_bones']

const state = {
    program: null,
    locations: {},
    skinProgram: null,
    skinLocations: {},
    luffy: null,
    projectionMatrix: m4.identity(),
    whiteTexture: null,
    // luz do fim de tarde: vem de cima e um pouco de lado, tom quente
    light: {
        direction: [-0.4, -1.0, -0.3],
        color: [1.0, 0.88, 0.72],
        enabled: true
    },
    // Névoa baixa: preserva o primeiro plano e perde densidade com a altura.
    fog: {
        enabled: false,
        color: [0.75, 0.78, 0.80],
        density: 0.085,
        start: 4,
        heightFalloff: 0.45,
        amount: 0
    },
    scene: null,
    sky: null,
    cage: null,
    cageVisible: true,
    particles: null,
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

function updateControls() {
    const names = { 1: 'automática', 2: 'orbital', 3: 'livre' }
    document.querySelector('#scene-status').textContent = `Câmera ${names[camera.mode]} · Neblina ${state.fog.enabled ? 'ligada' : 'desligada'} · Luz ${state.light.enabled ? 'ligada' : 'desligada'} · Gaiola ${state.cageVisible ? 'visível' : 'oculta'}`
    document.querySelector('#camera-help').hidden = camera.mode === 3
    document.querySelector('#free-help').hidden = camera.mode !== 3
}

function setupKeyboard() {
    window.addEventListener('keydown', (e) => {
        if (e.repeat) return
        if (e.code === 'Digit1') selectCamera(1)
        if (e.code === 'Digit2') selectCamera(camera.mode === 2 ? 1 : 2)
        if (e.code === 'Digit3') selectCamera(3)
        if (e.code === 'KeyL') state.light.enabled = !state.light.enabled
        if (e.code === 'KeyN') state.fog.enabled = !state.fog.enabled
        if (e.code === 'KeyG') state.cageVisible = !state.cageVisible
        if (e.code === 'KeyP') state.luffy.nextPose()
        updateControls()
    })
}

async function initialize(gl) {
    state.program = await createProgramFromFiles(gl, 'shaders/phong.vertex.glsl', 'shaders/phong.fragment.glsl')
    state.locations = getUniformLocations(gl, state.program, UNIFORMS)
    state.whiteTexture = createColorTexture(gl)
    state.skinProgram = await createProgramFromFiles(gl, 'shaders/skin.vertex.glsl', 'shaders/phong.fragment.glsl')
    state.skinLocations = getUniformLocations(gl, state.skinProgram, SKIN_UNIFORMS)
    state.luffy = await createLuffy(gl)

    state.scene = createNode({
        children: await Promise.all([
            createGround(gl),
            createRocks(gl),
            createRuin(gl),
            createSunflower(gl),
            createPinwheel(gl),
            createDebris(gl)
        ])
    })

    state.sky = await createSkydome(gl)
    state.cage = await createBirdcage(gl)
    state.particles = await createParticles(gl)

    gl.enable(gl.DEPTH_TEST)
    gl.enable(gl.CULL_FACE)

    setupCameraControls(gl.canvas)
    setupKeyboard()
    updateControls()
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

// uniformes de câmera, luz e neblina: iguais para o programa Phong e o de skinning
function setSceneUniforms(gl, locations) {
    const { light, fog } = state
    gl.uniformMatrix4fv(locations.u_view, false, camera.viewMatrix)
    gl.uniformMatrix4fv(locations.u_projection, false, state.projectionMatrix)
    gl.uniform3fv(locations.u_cameraPosition, camera.position)
    gl.uniform3fv(locations.u_lightDirection, light.direction)
    gl.uniform3fv(locations.u_lightColor, light.color)
    gl.uniform1i(locations.u_lightingEnabled, light.enabled)
    gl.uniform1i(locations.u_fogEnabled, fog.amount > 0.001)
    gl.uniform3fv(locations.u_fogColor, fog.color)
    gl.uniform1f(locations.u_fogDensity, fog.density)
    gl.uniform1f(locations.u_fogStart, fog.start)
    gl.uniform1f(locations.u_fogHeightFalloff, fog.heightFalloff)
    gl.uniform1f(locations.u_fogAmount, fog.amount)
    gl.uniform1i(locations.u_texture, 0)
}

function render(gl) {
    const { fog } = state

    const background = HORIZON_COLOR.map((value, k) => value + (fog.color[k] - value) * 0.55 * fog.amount)
    gl.clearColor(...background, 1)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    const view = { camera, projectionMatrix: state.projectionMatrix, fog, time: state.time }
    state.sky.draw(gl, view)

    gl.useProgram(state.program)
    setSceneUniforms(gl, state.locations)
    gl.activeTexture(gl.TEXTURE0)

    drawNode(gl, state.scene, m4.identity())

    gl.useProgram(state.skinProgram)
    setSceneUniforms(gl, state.skinLocations)
    state.luffy.draw(gl, state.skinLocations)

    // Gaiola e partículas envolvem a cena: fundo, vapor e fios da frente.
    if (state.cageVisible) state.cage.draw(gl, view, 'back')
    state.particles.draw(gl, view, state.luffy.position)
    if (state.cageVisible) state.cage.draw(gl, view, 'front')
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
    state.fog.amount += ((state.fog.enabled ? 1 : 0) - state.fog.amount) * (1 - Math.exp(-4 * dt))

    resize(gl)
    updateCamera(dt)
    updateNode(state.scene, dt)
    state.luffy.update(state.time)
    render(gl)
    requestAnimationFrame(frame)
}
requestAnimationFrame(frame)
