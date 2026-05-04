/**
 * ElevenLabsService.js — High-end AI voice synthesis for the "Mr. Worden" concierge.
 *
 * This service uses ElevenLabs (Flash v2.5 models) to generate premium,
 * human-like speech that matches the high-end minimalist UI.
 *
 * Requirements:
 * - VITE_ELEVENLABS_API_KEY (Client-side usage for low-latency, though server-side is safer)
 * - VITE_ELEVENLABS_VOICE_ID (Default: 'JBFqnCBsd6RMkjVDRZzb' — "George" style, or a custom clone)
 */

const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY
const VOICE_ID = import.meta.env.VITE_ELEVENLABS_VOICE_ID || 'pNInz6obpgH9PthW4RUI' // "George" - Mature, professional, authoritative

// Map of voice styles if we want to switch contextually
export const VOICES = {
  PREMIUM_MALE: 'pNInz6obpgH9PthW4RUI', // George - Deep, professional
  FRIENDLY_MALE: 'N2lVS1wzCLpce5hCq99G', // Callum - Friendly, relatable
  ELDER_MALE: 'JBFqnCBsd6RMkjVDRZzb', // George (Alternate)
}

class ElevenLabsService {
  constructor() {
    this.audioContext = null
    this.currentAudio = null
    this.cache = new Map()
    this.queue = []
    this.isPlaying = false
  }

  async play(text, voiceId = VOICE_ID) {
    if (!text || !ELEVENLABS_API_KEY) {
      console.warn('ElevenLabs API Key or text missing. Falling back to silent mode.')
      return
    }

    try {
      this.stop()

      // Simple cache to save credits/latency on repeat greetings
      if (this.cache.has(text)) {
        this._playBlob(this.cache.get(text))
        return
      }

      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'xi-api-key': ELEVENLABS_API_KEY,
          },
          body: JSON.stringify({
            text: text,
            model_id: 'eleven_flash_v2_5', // Ultra low latency high quality model
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
              style: 0.05,
              use_speaker_boost: true,
            },
          }),
        }
      )

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.statusText}`)
      }

      const blob = await response.blob()
      this.cache.set(text, blob)
      this._playBlob(blob)
    } catch (error) {
      console.error('Failed to play ElevenLabs voice:', error)
    }
  }

  _playBlob(blob) {
    const url = URL.createObjectURL(blob)
    this.currentAudio = new Audio(url)
    
    // Dispatch event for UI synchronization (visualizer sparks)
    this.currentAudio.addEventListener('play', () => {
      window.dispatchEvent(new CustomEvent('mrworden:audio-start'))
    })

    this.currentAudio.addEventListener('ended', () => {
      window.dispatchEvent(new CustomEvent('mrworden:audio-end'))
      this.currentAudio = null
    })

    this.currentAudio.play().catch(err => {
      console.error('Audio playback failed:', err)
    })
  }

  stop() {
    if (this.currentAudio) {
      this.currentAudio.pause()
      this.currentAudio.currentTime = 0
      window.dispatchEvent(new CustomEvent('mrworden:audio-end'))
      this.currentAudio = null
    }
  }
}

export const voiceService = new ElevenLabsService()
