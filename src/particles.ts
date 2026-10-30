import * as THREE from 'three'

// Individual flakes: each has its own speed, sway and size, and vanishes where it hits the ground.
export function createSnowfall(count = 14000): THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial> {
  const geo = new THREE.BufferGeometry()
  const pos = new Float32Array(count * 3)
  const rnd = new Float32Array(count)

  for (let i = 0; i < count; i++) {
    pos[i * 3] = Math.random() * 80
    pos[i * 3 + 1] = Math.random() * 34
    pos[i * 3 + 2] = Math.random() * 100
    rnd[i] = Math.random()
  }

  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  geo.setAttribute('aRnd', new THREE.BufferAttribute(rnd, 1))

  const pixelRatio = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 2) : 1

  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uCam: { value: new THREE.Vector3() },
      uBoard: { value: new THREE.Vector4() },
      uBoardDepth: { value: 0 },
      uMode: { value: 0 },
      uPR: { value: pixelRatio },
    },
    vertexShader: /* glsl */ `
      uniform float uTime, uPR, uBoardDepth, uMode;
      uniform vec3 uCam;
      uniform vec4 uBoard;
      attribute float aRnd;
      varying float vA;

      void main() {
        float speed = 0.7 + aRnd * 1.3;
        vec3 p = position;
        p.y = mod(position.y - uTime * speed, 34.0);
        p.x += sin(uTime * (0.3 + aRnd * 0.4) + aRnd * 50.0) * (0.4 + aRnd);
        p.z += cos(uTime * (0.25 + aRnd * 0.3) + aRnd * 30.0) * 0.5;

        float zc = uCam.z - 30.0;
        p.x = mod(p.x - uCam.x + 40.0, 80.0) - 40.0 + uCam.x; // box follows the camera
        p.z = mod(p.z - zc + 50.0, 100.0) - 50.0 + zc;

        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        
        // Front snowfall has prominent point size so flakes visibly occlude the board
        float sz = (uMode > 0.5) 
          ? clamp(uPR * (0.9 + aRnd * 1.6) * (62.0 / -mv.z), 2.5, 16.0 * uPR)
          : clamp(uPR * (0.5 + aRnd * 1.1) * (55.0 / -mv.z), 1.0, 12.0 * uPR);
        gl_PointSize = sz;

        float baseAlpha = (0.45 + aRnd * 0.55) * smoothstep(0.0, 0.4, p.y);
        gl_Position = projectionMatrix * mv;

        // Determine if flake is closer to camera than the board
        bool isCloserThanBoard = -mv.z < (uBoardDepth + 0.8);
        
        if (uMode > 0.5) {
          // Front canvas: render all flakes that fall in front of the board so they visibly occlude it
          vA = isCloserThanBoard ? (baseAlpha * (0.7 + 0.3 * aRnd)) : 0.0;
        } else {
          // Main 3D background canvas
          vA = baseAlpha;
        }
      }
    `,
    fragmentShader: /* glsl */ `
      varying float vA;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = (smoothstep(0.5, 0.25, d) * 0.75 + smoothstep(0.2, 0.0, d) * 0.55) * vA;
        if (a < 0.008) discard;
        gl_FragColor = vec4(0.96, 0.98, 1.0, a);
      }
    `,
  })

  const pts = new THREE.Points(geo, mat)
  pts.frustumCulled = false
  return pts
}

// same flakes, drawn on a second transparent canvas above the board to occlude it
export function createSnowfallFront(
  pts: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>
): THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial> {
  const m = pts.material.clone()
  m.uniforms.uMode.value = 1
  const f = new THREE.Points(pts.geometry, m)
  f.frustumCulled = false
  return f
}
