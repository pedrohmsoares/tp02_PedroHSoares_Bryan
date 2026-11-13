import { m4 } from './twgl.full.module.js'

// câmera 1: a 45° do chão, girando sozinha em volta do centro
// câmera 2: orbital, o usuário gira arrastando o mouse
// câmera 3: livre, com WASD, Q/E e mouse para olhar
const cameras = {
    active: 1,
    target: [0, 0, 0],
    minDistance: 4,
    maxDistance: 30,
    1: { azimuth: 0, elevation: Math.PI / 4, distance: 14, speed: 0.2 },
    2: { azimuth: Math.PI / 6, elevation: 0.4, distance: 14 },
    3: { position: [0, 8, 12], yaw: 0, pitch: -0.5, speed: 4 }
}
const keys = new Set()

export const camera = {
    mode: 1,
    position: [0, 0, 0],
    viewMatrix: m4.identity()
}

export function selectCamera(number) {
    if (!cameras[number] || number === cameras.active) return
    if (number === 3) {
        const free = cameras[3]
        free.position = [...camera.position]
        const [x, y, z] = cameras.target.map((value, k) => value - camera.position[k])
        free.yaw = Math.atan2(x, -z)
        free.pitch = Math.atan2(y, Math.hypot(x, z))
    }
    cameras.active = number
    camera.mode = number
}

function orbit(deltaAzimuth, deltaElevation) {
    const cam = cameras[2]
    cam.azimuth += deltaAzimuth
    const limit = Math.PI / 2 - 0.05
    cam.elevation = Math.max(-limit, Math.min(limit, cam.elevation + deltaElevation))
}

function zoom(factor) {
    if (cameras.active === 3) return
    const cam = cameras[cameras.active]
    cam.distance = Math.max(cameras.minDistance, Math.min(cameras.maxDistance, cam.distance * factor))
}

export function setupCameraControls(canvas) {
    let last = null
    const movementKeys = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyQ', 'KeyE', 'ShiftLeft', 'ShiftRight']
    window.addEventListener('keydown', (e) => {
        if (e.target?.closest?.('input, textarea, select, [contenteditable="true"]')) return
        if (!movementKeys.includes(e.code)) return
        keys.add(e.code)
        if (cameras.active === 3) e.preventDefault()
    })
    window.addEventListener('keyup', (e) => keys.delete(e.code))
    window.addEventListener('blur', () => { keys.clear(); last = null })

    canvas.addEventListener('pointerdown', (e) => {
        if (e.button !== 0) return
        canvas.setPointerCapture(e.pointerId)
        last = { x: e.clientX, y: e.clientY }
    })
    canvas.addEventListener('pointermove', (e) => {
        if (!last) return
        const dx = e.clientX - last.x
        const dy = e.clientY - last.y
        if (cameras.active === 2) orbit(-dx * 0.01, dy * 0.01)
        if (cameras.active === 3) {
            const free = cameras[3]
            free.yaw += dx * 0.005
            const limit = Math.PI / 2 - 0.05
            free.pitch = Math.max(-limit, Math.min(limit, free.pitch - dy * 0.005))
        }
        last = { x: e.clientX, y: e.clientY }
    })
    canvas.addEventListener('pointerup', () => last = null)
    canvas.addEventListener('pointercancel', () => last = null)
    canvas.addEventListener('lostpointercapture', () => last = null)

    canvas.addEventListener('wheel', (e) => {
        e.preventDefault()
        zoom(Math.exp(e.deltaY * 0.001))
    }, { passive: false })
}

export function updateCamera(dt) {
    cameras[1].azimuth += cameras[1].speed * dt

    if (cameras.active === 3) {
        const free = cameras[3]
        const forward = [Math.sin(free.yaw) * Math.cos(free.pitch), Math.sin(free.pitch), -Math.cos(free.yaw) * Math.cos(free.pitch)]
        const right = [Math.cos(free.yaw), 0, Math.sin(free.yaw)]
        const front = Number(keys.has('KeyW')) - Number(keys.has('KeyS'))
        const side = Number(keys.has('KeyD')) - Number(keys.has('KeyA'))
        const up = Number(keys.has('KeyE')) - Number(keys.has('KeyQ'))
        const movement = forward.map((value, k) => value * front + right[k] * side + (k === 1 ? up : 0))
        const length = Math.hypot(...movement)
        const speed = free.speed * (keys.has('ShiftLeft') || keys.has('ShiftRight') ? 3 : 1)
        if (length > 0) free.position = free.position.map((value, k) => value + movement[k] / length * speed * dt)
        camera.position = [...free.position]
        const target = free.position.map((value, k) => value + forward[k])
        camera.viewMatrix = m4.inverse(m4.lookAt(camera.position, target, [0, 1, 0]))
        return
    }

    const { azimuth, elevation, distance } = cameras[cameras.active]
    const target = cameras.target
    camera.position = [
        target[0] + distance * Math.cos(elevation) * Math.sin(azimuth),
        target[1] + distance * Math.sin(elevation),
        target[2] + distance * Math.cos(elevation) * Math.cos(azimuth)
    ]
    camera.viewMatrix = m4.inverse(m4.lookAt(camera.position, target, [0, 1, 0]))
}
