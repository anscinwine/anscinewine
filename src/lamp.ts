import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

export interface StreetLamp {
  group: THREE.Group
  modelGroup: THREE.Group
  spotLight: THREE.SpotLight
  bulbLight: THREE.PointLight
  position: THREE.Vector3
  lightPos: THREE.Vector3
  update: (t: number) => void
  getCurrentIntensity: () => number
  ready: Promise<void>
}

export function createStreetLamp(groundY = 0): StreetLamp {
  const group = new THREE.Group()
  // Position lamppost base rooted on the left bank of the trail
  const basePos = new THREE.Vector3(-6.0, groundY, -22.0)
  group.position.copy(basePos)

  const modelGroup = new THREE.Group()
  group.add(modelGroup)

  // Exact calculated world position of lantern head:
  // Base at (-6.0, 0, -22.0), model scale 0.32, rotation y = Math.PI * 0.95 (arm extends to +X)
  // x = -6.0 + 3.60 = -2.40, y = 8.18, z = -22.0 + 0.58 = -21.42
  const absLightPos = new THREE.Vector3(-2.4, groundY + 8.18, -21.42)

  // 1. Primary High-Quality SpotLight pointing downward from the lantern
  // Warm yellow color (2700K electric street tungsten lamp)
  const spotLight = new THREE.SpotLight(0xffbe3b, 220, 50, Math.PI / 3.0, 0.6, 1.35)
  spotLight.position.copy(absLightPos)
  // Target points STRAIGHT DOWN directly beneath the lantern head onto the ground
  spotLight.target.position.set(absLightPos.x, groundY, absLightPos.z)
  spotLight.castShadow = true

  // Highest quality soft shadow configuration
  spotLight.shadow.mapSize.width = 4096
  spotLight.shadow.mapSize.height = 4096
  spotLight.shadow.camera.near = 0.4
  spotLight.shadow.camera.far = 45
  spotLight.shadow.bias = -0.0001
  spotLight.shadow.normalBias = 0.02
  spotLight.shadow.radius = 2.5

  // 2. Localized bulb omnidirectional light right inside the lantern casing
  const bulbLight = new THREE.PointLight(0xffaa2b, 45, 18, 1.8)
  bulbLight.position.copy(absLightPos)
  bulbLight.castShadow = false

  let bulbMeshMat: THREE.MeshBasicMaterial | null = null

  // 3. Load user's Streetlamp.glb model
  const glbUrl = import.meta.env.BASE_URL + 'models/Streetlamp.glb'
  const loader = new GLTFLoader()

  const ready = new Promise<void>((resolve) => {
    loader.load(
      glbUrl,
      gltf => {
        const model = gltf.scene
        // Scale to 0.32 for realistic tall street lamp (~8.4m height)
        model.scale.setScalar(0.32)
        // Rotate so arm points toward +X (over the trail toward the center)
        model.rotation.y = Math.PI * 0.95
        modelGroup.add(model)

        let glassNode: THREE.Object3D | null = null

        model.traverse(o => {
          const mesh = o as THREE.Mesh
          if (mesh.isMesh) {
            mesh.castShadow = true
            mesh.receiveShadow = true

            const name = mesh.name.toLowerCase()
            if (name.includes('glass')) {
              glassNode = mesh
              // Give lantern glass realistic warm frosted translucency
              mesh.material = new THREE.MeshStandardMaterial({
                color: 0xffea85,
                roughness: 0.1,
                metalness: 0.1,
                transparent: true,
                opacity: 0.6,
              })
            } else if (name.includes('interior') || name.includes('sensor')) {
              // Glowing yellow bulb interior
              bulbMeshMat = new THREE.MeshBasicMaterial({
                color: 0xffea85,
                toneMapped: false,
              })
              mesh.material = bulbMeshMat
            } else {
              // Metal pole, base, arm, plate
              if (mesh.material && (mesh.material as any).isMeshStandardMaterial) {
                const sm = mesh.material as THREE.MeshStandardMaterial
                sm.metalness = Math.max(sm.metalness, 0.75)
                sm.roughness = Math.min(sm.roughness, 0.42)
              }
            }
          }
        })

        // Read exact world position of the lamp glass to lock light coordinates
        group.updateMatrixWorld(true)
        if (glassNode) {
          const wp = new THREE.Vector3()
          ;(glassNode as THREE.Object3D).getWorldPosition(wp)
          absLightPos.copy(wp)
          spotLight.position.copy(wp)
          spotLight.target.position.set(wp.x, groundY, wp.z)
          bulbLight.position.copy(wp)
        }
        resolve()
      },
      undefined,
      err => {
        console.warn('Could not load Streetlamp.glb:', err)
        resolve()
      }
    )
  })

  // 4. Electrical flickering logic: mostly warm and steady, with occasional natural voltage dips
  let currentIntensityMul = 1.0
  let nextFlickerTime = 3.2
  let flickerDuration = 0
  let flickerStartTime = 0

  return {
    group,
    modelGroup,
    spotLight,
    bulbLight,
    position: basePos,
    lightPos: absLightPos,
    ready,
    getCurrentIntensity: () => currentIntensityMul,
    update: (t: number) => {
      // Trigger occasional electrical stutter
      if (t > nextFlickerTime) {
        flickerStartTime = t
        flickerDuration = 0.16 + Math.random() * 0.28 // 160ms - 440ms flicker event
        nextFlickerTime = t + 3.5 + Math.random() * 5.5 // next flicker in 3.5 - 9.0s
      }

      if (t - flickerStartTime < flickerDuration) {
        // Active flicker event: randomized voltage oscillations
        const phase = (t - flickerStartTime) * 36.0
        const dip = (Math.sin(phase) + Math.sin(phase * 2.3) + (Math.random() - 0.5) * 0.7) / 2.7
        currentIntensityMul = Math.max(0.12, Math.min(1.15, 0.52 + dip * 0.48))
      } else {
        // Subtle organic voltage hum when steady
        currentIntensityMul = 1.0 + Math.sin(t * 3.8) * 0.03 + Math.cos(t * 7.2) * 0.02
      }

      spotLight.intensity = 220 * currentIntensityMul
      bulbLight.intensity = 45 * currentIntensityMul

      // Sync glowing bulb mesh brightness
      if (bulbMeshMat) {
        const b = 0.5 + 0.5 * currentIntensityMul
        bulbMeshMat.color.setRGB(1.0 * b, 0.9 * b, 0.4 * b)
      }
    },
  }
}
