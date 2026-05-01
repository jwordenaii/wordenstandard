import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

const DEFAULT_MODEL_URL = '/models/mr-worden.glb'
const MODEL_PATH_CANDIDATES = [DEFAULT_MODEL_URL, '/mr-worden.glb', '/models/mr-worden.gltf']

function getEnvModelCandidates() {
  const single = (import.meta.env.VITE_CONCIERGE_AVATAR_MODEL_URL || '').trim()
  const list = (import.meta.env.VITE_CONCIERGE_AVATAR_MODEL_URLS || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)

  return [single, ...list].filter(Boolean)
}

function looksLikeGlb(buffer) {
  if (!buffer || buffer.byteLength < 4) return false
  const bytes = new Uint8Array(buffer, 0, 4)
  return bytes[0] === 0x67 && bytes[1] === 0x6c && bytes[2] === 0x54 && bytes[3] === 0x46 // glTF
}

function looksLikeGltfJson(text, contentType) {
  const safeText = (text || '').trim()
  if (!safeText) return false
  if (safeText.startsWith('<!doctype html') || safeText.startsWith('<html')) return false
  if (!safeText.startsWith('{')) return false

  const type = (contentType || '').toLowerCase()
  if (type.includes('model/gltf+json') || type.includes('application/json')) return true

  return safeText.includes('"asset"') && safeText.includes('"version"')
}

async function findValidModelUrl(candidates) {
  for (const candidate of candidates) {
    try {
      const response = await fetch(candidate, { method: 'GET', cache: 'no-store' })
      if (!response.ok) continue

      const contentType = response.headers.get('content-type') || ''
      const buffer = await response.arrayBuffer()

      if (looksLikeGlb(buffer)) return candidate

      const headText = new TextDecoder().decode(buffer.slice(0, 512))
      if (looksLikeGltfJson(headText, contentType)) return candidate
    } catch {
      // Try the next candidate URL.
    }
  }

  return null
}

function createFallbackAvatar() {
  const root = new THREE.Group()

  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.22, 0.5, 6, 12),
    new THREE.MeshStandardMaterial({ color: '#1a1a2e', roughness: 0.7 })
  )
  body.position.y = -0.05

  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.09, 0.12, 16),
    new THREE.MeshStandardMaterial({ color: '#f0b98f', roughness: 0.75 })
  )
  neck.position.y = 0.34

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 24, 24),
    new THREE.MeshStandardMaterial({ color: '#f4c3a1', roughness: 0.75 })
  )
  head.position.y = 0.54

  const hat = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24, 0.2, 0.12, 24),
    new THREE.MeshStandardMaterial({ color: '#f5a623', roughness: 0.6, metalness: 0.05 })
  )
  hat.position.y = 0.76

  const brim = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.3, 0.02, 24),
    new THREE.MeshStandardMaterial({ color: '#d4880a', roughness: 0.7 })
  )
  brim.position.y = 0.7

  const glasses = new THREE.Mesh(
    new THREE.TorusGeometry(0.06, 0.008, 12, 28),
    new THREE.MeshStandardMaterial({ color: '#4a4a4a', roughness: 0.5, metalness: 0.25 })
  )
  glasses.position.set(-0.08, 0.57, 0.19)

  const glasses2 = glasses.clone()
  glasses2.position.x = 0.08

  const bridge = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, 0.008, 0.008),
    new THREE.MeshStandardMaterial({ color: '#4a4a4a' })
  )
  bridge.position.set(0, 0.57, 0.19)

  const mouth = new THREE.Mesh(
    new THREE.BoxGeometry(0.11, 0.022, 0.02),
    new THREE.MeshStandardMaterial({ color: '#9a4f30', roughness: 0.8 })
  )
  mouth.position.set(0, 0.47, 0.205)
  mouth.name = 'lipSyncMouth'

  const tie = new THREE.Mesh(
    new THREE.ConeGeometry(0.04, 0.16, 4),
    new THREE.MeshStandardMaterial({ color: '#f5a623', roughness: 0.5 })
  )
  tie.position.set(0, 0.2, 0.17)
  tie.rotation.x = Math.PI / 5

  root.add(body, neck, head, hat, brim, glasses, glasses2, bridge, mouth, tie)
  return root
}

function findBestMouthTarget(root) {
  const direct = root.getObjectByName('lipSyncMouth')
  if (direct) return direct

  const candidates = []
  root.traverse((node) => {
    if (!node.isMesh) return
    const name = (node.name || '').toLowerCase()
    if (name.includes('mouth') || name.includes('jaw') || name.includes('teeth')) {
      candidates.push(node)
    }
  })

  return candidates[0] || null
}

export default function WebGLPersonaAvatar({
  className = '',
  mode = 'idle',
  speechPulse = 0,
  speechIntensity = 0.6,
  modelUrl,
  onModelModeChange,
}) {
  const mountRef = useRef(null)
  const rendererRef = useRef(null)
  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const rootRef = useRef(null)
  const lipRigRef = useRef(null)
  const clockRef = useRef(new THREE.Clock())
  const disposeFnsRef = useRef([])
  const speakingUntilRef = useRef(0)
  const modeRef = useRef(mode)
  const speechIntensityRef = useRef(speechIntensity)
  const mixerRef = useRef(null)
  const actionsRef = useRef({})
  const activeActionRef = useRef(null)

  const selectClipByMode = (actions, activeMode) => {
    const modeOrder = {
      talking: ['talk', 'speak', 'voice', 'idle'],
      listening: ['listen', 'idle', 'breath'],
      wave: ['wave', 'greet', 'idle'],
      idle: ['idle', 'breath', 'base'],
    }

    const names = modeOrder[activeMode] || modeOrder.idle
    for (const key of names) {
      if (actions[key]) return key
    }
    return null
  }

  const applyActionForMode = (activeMode) => {
    const actions = actionsRef.current
    if (!actions || Object.keys(actions).length === 0) return

    const nextName = selectClipByMode(actions, activeMode)
    if (!nextName) return
    if (activeActionRef.current === nextName) return

    const nextAction = actions[nextName]
    const currentAction = activeActionRef.current ? actions[activeActionRef.current] : null

    if (currentAction && currentAction !== nextAction) {
      currentAction.fadeOut(0.28)
    }

    nextAction.reset().setEffectiveWeight(1).fadeIn(0.28).play()
    activeActionRef.current = nextName
  }

  useEffect(() => {
    modeRef.current = mode
  }, [mode])

  useEffect(() => {
    speechIntensityRef.current = speechIntensity
  }, [speechIntensity])

  const resolvedModelCandidates = useMemo(() => {
    const envCandidates = getEnvModelCandidates()
    const propCandidate = (modelUrl || '').trim()

    const merged = [...envCandidates, propCandidate, ...MODEL_PATH_CANDIDATES]
    return [...new Set(merged.filter(Boolean))]
  }, [modelUrl])

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return undefined

    const scene = new THREE.Scene()
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50)
    camera.position.set(0, 0.45, 2.1)
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    rendererRef.current = renderer
    mount.appendChild(renderer.domElement)

    const ambient = new THREE.AmbientLight('#ffe7b3', 0.9)
    const key = new THREE.DirectionalLight('#fff2d1', 1.15)
    key.position.set(1.6, 2, 2.3)
    const rim = new THREE.DirectionalLight('#8ab7ff', 0.55)
    rim.position.set(-2, 1.4, -1.2)
    scene.add(ambient, key, rim)

    const halo = new THREE.Mesh(
      new THREE.RingGeometry(0.62, 0.73, 48),
      new THREE.MeshBasicMaterial({ color: '#f5a623', transparent: true, opacity: 0.18, side: THREE.DoubleSide })
    )
    halo.position.set(0, 0.38, -0.6)
    scene.add(halo)

    const root = new THREE.Group()
    rootRef.current = root
    scene.add(root)

    let cancelled = false
    const loader = new GLTFLoader()

    const loadFallback = () => {
      if (cancelled) return
      root.clear()
      const fallback = createFallbackAvatar()
      root.add(fallback)
      lipRigRef.current = {
        kind: 'scale',
        mesh: findBestMouthTarget(fallback),
      }

      mixerRef.current = null
      actionsRef.current = {}
      activeActionRef.current = null
      onModelModeChange?.('fallback')
    }

    const pickMorphIndices = (mesh) => {
      const dict = mesh.morphTargetDictionary || {}
      const names = Object.keys(dict)

      const preferred = names.filter((n) => {
        const low = n.toLowerCase()
        return (
          low.includes('viseme') ||
          low.includes('mouth') ||
          low.includes('jaw') ||
          low.includes('aa') ||
          low.includes('oh')
        )
      })

      const selected = preferred.length > 0 ? preferred : names.slice(0, 2)
      return selected.map((name) => dict[name]).filter((idx) => Number.isInteger(idx))
    }

    const findLipRig = (model) => {
      let scaleMesh = null
      let morphMesh = null
      let morphIndices = []

      model.traverse((node) => {
        if (!node.isMesh) return

        if (!scaleMesh) {
          const lowName = (node.name || '').toLowerCase()
          if (lowName.includes('mouth') || lowName.includes('jaw') || lowName.includes('teeth')) {
            scaleMesh = node
          }
        }

        if (!morphMesh && Array.isArray(node.morphTargetInfluences) && node.morphTargetInfluences.length > 0) {
          const indices = pickMorphIndices(node)
          if (indices.length > 0) {
            morphMesh = node
            morphIndices = indices
          }
        }
      })

      if (morphMesh && morphIndices.length > 0) {
        return { kind: 'morph', mesh: morphMesh, indices: morphIndices }
      }

      return { kind: 'scale', mesh: scaleMesh || findBestMouthTarget(model) }
    }

    const buildActions = (mixer, clips) => {
      const map = {}
      const classify = (clip) => {
        const n = clip.name.toLowerCase()
        if (n.includes('talk') || n.includes('speak') || n.includes('voice')) return 'talk'
        if (n.includes('listen') || n.includes('thinking')) return 'listen'
        if (n.includes('wave') || n.includes('greet') || n.includes('hello')) return 'wave'
        if (n.includes('breath')) return 'breath'
        if (n.includes('idle') || n.includes('base')) return 'idle'
        return null
      }

      clips.forEach((clip) => {
        const key = classify(clip)
        if (!key || map[key]) return
        map[key] = mixer.clipAction(clip)
      })

      return map
    }

    const loadModel = async () => {
      const validUrl = await findValidModelUrl(resolvedModelCandidates)
      if (!validUrl) {
        loadFallback()
        return
      }

      loader.load(
        validUrl,
        (gltf) => {
          if (cancelled) return
          root.clear()
          const model = gltf.scene
          model.position.set(0, -0.1, 0)
          model.scale.setScalar(1.05)
          root.add(model)
          lipRigRef.current = findLipRig(model)

          if (Array.isArray(gltf.animations) && gltf.animations.length > 0) {
            const mixer = new THREE.AnimationMixer(model)
            const actions = buildActions(mixer, gltf.animations)
            mixerRef.current = mixer
            actionsRef.current = actions
            activeActionRef.current = null
            applyActionForMode(modeRef.current)
          } else {
            mixerRef.current = null
            actionsRef.current = {}
            activeActionRef.current = null
          }

          onModelModeChange?.('model')
        },
        undefined,
        () => {
          loadFallback()
        }
      )
    }
    loadModel()

    const resize = () => {
      const w = mount.clientWidth || 220
      const h = mount.clientHeight || 220
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    resize()
    window.addEventListener('resize', resize)

    let raf = 0
    const renderLoop = () => {
      const elapsed = clockRef.current.getElapsedTime()
      const rootObj = rootRef.current
      const activeMode = modeRef.current
      const delta = clockRef.current.getDelta()

      if (mixerRef.current) {
        applyActionForMode(activeMode)
        mixerRef.current.update(Math.min(delta, 1 / 30))
      }

      if (rootObj) {
        const idleAmp = activeMode === 'talking' ? 0.028 : 0.018
        rootObj.position.y = Math.sin(elapsed * 1.6) * idleAmp
        rootObj.rotation.y = Math.sin(elapsed * 0.85) * 0.1

        if (activeMode === 'listening') {
          rootObj.rotation.x = Math.sin(elapsed * 1.2) * 0.05
        } else if (activeMode === 'wave') {
          rootObj.rotation.z = Math.sin(elapsed * 3.6) * 0.08
        } else {
          rootObj.rotation.x = Math.sin(elapsed * 0.7) * 0.02
          rootObj.rotation.z = 0
        }
      }

      const haloPulse = 0.16 + Math.max(0, Math.sin(elapsed * 2.4)) * 0.14
      halo.material.opacity = activeMode === 'talking' ? haloPulse + 0.1 : haloPulse

      const lipRig = lipRigRef.current
      if (lipRig) {
        const active = activeMode === 'talking' || Date.now() < speakingUntilRef.current
        const openValue = active ? (0.25 + Math.abs(Math.sin(elapsed * 20)) * (0.5 + speechIntensityRef.current * 0.3)) : 0

        if (lipRig.kind === 'morph' && lipRig.mesh && lipRig.indices) {
          lipRig.indices.forEach((idx) => {
            if (lipRig.mesh.morphTargetInfluences && lipRig.mesh.morphTargetInfluences[idx] !== undefined) {
              lipRig.mesh.morphTargetInfluences[idx] = openValue
            }
          })
        } else if (lipRig.mesh) {
          lipRig.mesh.scale.y = 0.9 + openValue
        }
      }

      renderer.render(scene, camera)
      raf = requestAnimationFrame(renderLoop)
    }
    raf = requestAnimationFrame(renderLoop)

    disposeFnsRef.current.push(() => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(raf)
      renderer.dispose()
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose()
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose())
          else obj.material.dispose()
        }
      })
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement)
    })

    return () => {
      cancelled = true
      disposeFnsRef.current.forEach((fn) => fn())
      disposeFnsRef.current = []
    }
  }, [resolvedModelCandidates, onModelModeChange])

  useEffect(() => {
    const duration = 1200 + Math.round(speechPulse * 18)
    speakingUntilRef.current = Date.now() + duration
  }, [speechPulse])

  return (
    <div className={className}>
      <div ref={mountRef} className="w-full h-full" />
    </div>
  )
}
