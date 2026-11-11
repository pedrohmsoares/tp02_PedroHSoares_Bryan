import { m4 } from './twgl.full.module.js'

// câmera 1: a 45° do chão, girando sozinha em volta do centro
// câmera 2: orbital, o usuário gira arrastando o mouse
// nas duas o alvo é o centro do diorama e o scroll aproxima/afasta
const cameras = {
    active: 1,
    target: [0, 0, 0],
    minDistance: 4,
    maxDistance: 30,
    1: { azimuth: 0, elevation: Math.PI / 4, distance: 14, speed: 0.2 },
    2: { azimuth: Math.PI / 6, elevation: 0.4, distance: 14 }
}

export const camera = {
    position: [0, 0, 0],
    viewMatrix: m4.identity()
}

export function selectCamera(number) {
    cameras.active = number
}

function orbit(deltaAzimuth, deltaElevation) {
    const cam = cameras[2]
    cam.azimuth += deltaAzimuth
    const limit = Math.PI / 2 - 0.05
    cam.elevation = Math.max(-limit, Math.min(limit, cam.elevation + deltaElevation))
}

function zoom(factor) {
    const cam = cameras[cameras.active]
    cam.distance = Math.max(cameras.minDistance, Math.min(cameras.maxDistance, cam.distance * factor))
}

export function setupCameraControls(canvas) {
    let last = null

    canvas.addEventListener('pointerdown', (e) => {
        canvas.setPointerCapture(e.pointerId)
        last = { x: e.clientX, y: e.clientY }
    })
    canvas.addEventListener('pointermove', (e) => {
        if (!last || cameras.active !== 2) return
        orbit(-(e.clientX - last.x) * 0.01, (e.clientY - last.y) * 0.01)
        last = { x: e.clientX, y: e.clientY }
    })
    canvas.addEventListener('pointerup', () => last = null)
    canvas.addEventListener('pointercancel', () => last = null)

    canvas.addEventListener('wheel', (e) => {
        e.preventDefault()
        zoom(Math.exp(e.deltaY * 0.001))
    }, { passive: false })
}

export function updateCamera(dt) {
    cameras[1].azimuth += cameras[1].speed * dt

    const { azimuth, elevation, distance } = cameras[cameras.active]
    const target = cameras.target
    camera.position = [
        target[0] + distance * Math.cos(elevation) * Math.sin(azimuth),
        target[1] + distance * Math.sin(elevation),
        target[2] + distance * Math.cos(elevation) * Math.cos(azimuth)
    ]
    camera.viewMatrix = m4.inverse(m4.lookAt(camera.position, target, [0, 1, 0]))
}
