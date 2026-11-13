// +Z é a frente do modelo: a luz começa um pouco de lado, iluminando o rosto.
export const INITIAL_SUN = { azimuth: 35, elevation: 38, moving: true }
const ORBIT_SPEED = 3 // graus por segundo: uma volta em dois minutos

export function advanceSun(sun, dt) {
    if (!sun.moving || dt <= 0) return
    const previous = sun.azimuth * Math.PI / 180
    const next = previous + ORBIT_SPEED * dt * Math.PI / 180
    // Integrar a diferença do seno mantém o percurso suave ao pausar,
    // reposicionar e retomar, sem reiniciar uma animação em outro lugar.
    sun.elevation = Math.max(8, Math.min(70, sun.elevation + 12 * (Math.sin(next) - Math.sin(previous))))
    sun.azimuth = ((sun.azimuth + ORBIT_SPEED * dt + 180) % 360 + 360) % 360 - 180
}

// Azimute em torno de Y; altura em relação ao horizonte, em graus.
export function sunDirection({ azimuth, elevation }) {
    const angle = azimuth * Math.PI / 180
    const height = elevation * Math.PI / 180
    return [Math.sin(angle) * Math.cos(height), Math.sin(height), Math.cos(angle) * Math.cos(height)]
}

export function sunColor({ elevation }) {
    const daylight = Math.min(1, Math.max(0, (elevation - 8) / 40))
    return [1, 0.83 + daylight * 0.12, 0.65 + daylight * 0.23]
}

export function setupSunControls(sun, onChange) {
    const motion = document.querySelector('#sun-motion')
    const inputs = ['azimuth', 'elevation'].map(name => ({
        name,
        slider: document.querySelector(`#sun-${name}`),
        output: document.querySelector(`#sun-${name}-value`)
    }))

    function sync() {
        for (const { name, slider, output } of inputs) {
            const value = String(Math.round(sun[name]))
            if (slider.value !== value) slider.value = value
            if (output.value !== `${value}°`) output.value = `${value}°`
        }
        const label = sun.moving ? 'Pausar sol' : 'Animar sol'
        if (motion.textContent !== label) motion.textContent = label
        if (motion.getAttribute('aria-pressed') !== String(sun.moving)) {
            motion.setAttribute('aria-pressed', String(sun.moving))
        }
        onChange()
    }

    for (const { name, slider } of inputs) {
        slider.addEventListener('input', () => {
            sun[name] = Number(slider.value)
            // O ajuste manual deixa o sol parado exatamente onde foi colocado.
            sun.moving = false
            sync()
        })
    }
    motion.addEventListener('click', () => {
        sun.moving = !sun.moving
        sync()
    })
    document.querySelector('#sun-front').addEventListener('click', () => {
        Object.assign(sun, INITIAL_SUN, { moving: false })
        sync()
    })
    sync()

    return {
        update(dt) {
            if (!sun.moving) return
            advanceSun(sun, dt)
            sync()
        }
    }
}
