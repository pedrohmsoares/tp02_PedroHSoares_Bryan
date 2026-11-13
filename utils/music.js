const TRACK_NAME = 'Five Armies · Kevin MacLeod'

export function setupMusicControls() {
    const audio = new Audio(new URL('../assets/sounds/five-armies.mp3', import.meta.url).href)
    audio.loop = true
    audio.preload = 'none'

    const button = document.querySelector('#music-toggle')
    const status = document.querySelector('#music-status')
    const volume = document.querySelector('#music-volume')
    const volumeValue = document.querySelector('#music-volume-value')
    let starting = false

    function updateVolume() {
        audio.volume = Number(volume.value) / 100
        volumeValue.value = `${volume.value}%`
    }

    function updatePlayback() {
        button.textContent = audio.paused ? 'Tocar música' : 'Pausar música'
        button.setAttribute('aria-pressed', String(!audio.paused))
        status.textContent = TRACK_NAME
    }

    async function toggle() {
        if (starting) return
        if (!audio.paused) {
            audio.pause()
            return
        }

        starting = true
        button.disabled = true
        try {
            await audio.play()
        } catch {
            status.textContent = 'Não foi possível tocar a música. Tente novamente.'
        } finally {
            starting = false
            button.disabled = false
        }
    }

    button.addEventListener('click', toggle)
    volume.addEventListener('input', updateVolume)
    audio.addEventListener('play', updatePlayback)
    audio.addEventListener('pause', updatePlayback)
    audio.addEventListener('error', () => {
        updatePlayback()
        status.textContent = 'Não foi possível carregar a música. Tente novamente.'
    })
    updateVolume()
    updatePlayback()

    return { toggle }
}
