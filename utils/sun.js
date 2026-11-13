export const INITIAL_SUN = { azimuth: -155, elevation: 12 }

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
    for (const name of ['azimuth', 'elevation']) {
        const slider = document.querySelector(`#sun-${name}`)
        const output = document.querySelector(`#sun-${name}-value`)
        slider.value = String(sun[name])
        const update = () => {
            sun[name] = Number(slider.value)
            output.value = `${sun[name]}°`
            onChange()
        }
        slider.addEventListener('input', update)
        update()
    }
}
