import * as THREE from 'three'
import { PAD } from './snow-ground.ts'

const rnd = (a: number, b: number) => a + Math.random() * (b - a)

async function fetchBuf(url: string, cb?: (p: number) => void): Promise<ArrayBuffer> {
  const r = await fetch(url)
  const total = Number(r.headers.get('content-length')) || 0
  if (!r.body || !total) {
    const b = await r.arrayBuffer()
    cb?.(1)
    return b
  }
  const rd = r.body.getReader()
  const parts: Uint8Array[] = []
  let got = 0
  for (;;) {
    const { done, value } = await rd.read()
    if (done) break
    if (value) {
      parts.push(value)
      got += value.length
      cb?.(Math.min(1, got / total))
    }
  }
  const out = new Uint8Array(got)
  let o = 0
  for (const p of parts) {
    out.set(p, o)
    o += p.length
  }
  return out.buffer
}

interface TreeManifestEntry {
  k: number
  pos: number
  nor: number
  uv?: number
  col?: number
  idx: number
  nv: number
  nt: number
}

export function createTree(
  groundY: number,
  onProgress?: (p: number) => void,
  renderer?: THREE.WebGLRenderer
) {
  const g = new THREE.Group()
  g.position.set(PAD.x, groundY + 0.02 + PAD.h, PAD.z)

  const std = (o: THREE.MeshStandardMaterialParameters) =>
    new THREE.MeshStandardMaterial({ roughness: 0.85, ...o })

  const base = import.meta.env.BASE_URL + 'tree/'
  const palette = [0xe63946, 0xffc83d, 0x3da5ff, 0xff7bd0, 0xf2f2f2].map(c => new THREE.Color(c))

  const model = new THREE.Group()
  model.rotation.x = -Math.PI / 2
  model.scale.setScalar(2.7)
  g.add(model)

  const ready = Promise.all([
    fetch(base + 'tree.json').then(r => r.json() as Promise<TreeManifestEntry[]>),
    fetchBuf(base + 'tree.bin', onProgress),
    new THREE.TextureLoader().loadAsync(base + 'Branch.png'),
  ])
    .then(([man, buf, tex]) => {
      tex.colorSpace = THREE.SRGBColorSpace
      tex.anisotropy = renderer ? renderer.capabilities.getMaxAnisotropy() : 8

      const mats: Record<number, THREE.Material> = {
        0: std({
          color: 0xe2b650,
          roughness: 0.35,
          metalness: 0.4,
          emissive: 0x3a2808,
          side: THREE.DoubleSide,
        }),
        1: std({ color: 0x4a2c17 }),
        2: std({ roughness: 0.25, metalness: 0.5, vertexColors: true }),
        4: new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false }),
        5: std({
          map: tex,
          alphaTest: 0.45,
          side: THREE.DoubleSide,
          roughness: 0.9,
        }),
      }

      for (const e of man) {
        if (e.k === 0) continue // tinsel strips: 260k triangles, skipped for high performance
        const geo = new THREE.BufferGeometry()
        const P = new Int16Array(buf, e.pos, e.nv * 3)
        const pos = new Float32Array(e.nv * 3)
        for (let i = 0; i < pos.length; i += 3) {
          pos[i] = P[i] / 32767
          pos[i + 1] = P[i + 1] / 32767
          pos[i + 2] = (P[i + 2] / 32767) * 3
        }
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))

        const N = new Int8Array(buf, e.nor, e.nv * 4)
        const nor = new Float32Array(e.nv * 3)
        for (let i = 0; i < e.nv; i++) {
          nor[i * 3] = N[i * 4] / 127
          nor[i * 3 + 1] = N[i * 4 + 1] / 127
          nor[i * 3 + 2] = N[i * 4 + 2] / 127
        }
        geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3))

        if (e.uv !== undefined) {
          const U = new Uint16Array(buf, e.uv, e.nv * 2)
          const uv = new Float32Array(e.nv * 2)
          for (let i = 0; i < uv.length; i++) uv[i] = U[i] / 65535
          geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
        }

        if (e.col !== undefined) {
          const C = new Uint8Array(buf, e.col, e.nv * 4)
          const col = new Float32Array(e.nv * 3)
          for (let i = 0; i < e.nv; i++) {
            const c = palette[C[i * 4] % palette.length]
            col[i * 3] = c.r
            col[i * 3 + 1] = c.g
            col[i * 3 + 2] = c.b
          }
          geo.setAttribute('color', new THREE.BufferAttribute(col, 3))
        }

        geo.setIndex(new THREE.BufferAttribute(new Uint32Array(buf, e.idx, e.nt * 3), 1))
        geo.computeBoundingSphere()

        const mat = mats[e.k] || mats[1]
        const mesh = new THREE.Mesh(geo, mat)
        mesh.castShadow = e.k !== 4
        mesh.receiveShadow = e.k === 5 || e.k === 1 || e.k === 2
        model.add(mesh)
      }
    })
    .catch(err => {
      console.warn('Tree mesh load error, falling back to procedural pine:', err)
      // Fallback procedural festive tree in case buffer fetch has issues
      const pineGroup = new THREE.Group()
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.35, 1.2, 8),
        new THREE.MeshStandardMaterial({ color: 0x4a2c17, roughness: 0.9 })
      )
      trunk.position.y = 0.6
      pineGroup.add(trunk)
      const tiers = [
        { y: 1.5, r: 1.8, h: 1.4 },
        { y: 2.3, r: 1.4, h: 1.3 },
        { y: 3.0, r: 1.0, h: 1.2 },
        { y: 3.6, r: 0.6, h: 1.0 },
      ]
      tiers.forEach(({ y, r, h }) => {
        const cone = new THREE.Mesh(
          new THREE.ConeGeometry(r, h, 8),
          new THREE.MeshStandardMaterial({ color: 0x1d472c, roughness: 0.8, flatShading: true })
        )
        cone.position.y = y
        pineGroup.add(cone)
      })
      g.add(pineGroup)
    })

  // ---- String of lights wound around the tree ----
  const TURNS = 7.5
  const Z0 = 0.34
  const Z1 = 2.78
  const pts: THREE.Vector3[] = []
  const lp: number[] = []
  const lc: number[] = []
  const lph: number[] = []
  const rad = (z: number) => 0.93 * (1 - (z - 0.2) / 2.9) + 0.05
  const bulbCols = [0xff4d5a, 0xffd04d, 0x4db8ff, 0xff8ad8, 0x6dffa0].map(c => new THREE.Color(c))
  const N = 520

  for (let i = 0; i <= N; i++) {
    const f = i / N
    const z = Z0 + (Z1 - Z0) * f
    const a = f * TURNS * Math.PI * 2 + 0.6 * Math.sin(f * 40) * 0.1
    pts.push(new THREE.Vector3(Math.cos(a) * rad(z), Math.sin(a) * rad(z), z - Math.sin(a * 3) * 0.015))
  }

  const wire = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 900, 0.006, 5),
    new THREE.MeshStandardMaterial({ color: 0x14301e, roughness: 0.6 })
  )
  model.add(wire)

  for (let i = 4; i < N; i += 5) {
    const p = pts[i]
    const c = bulbCols[((i / 5) % bulbCols.length) | 0]
    lp.push(p.x, p.y, p.z)
    lc.push(c.r, c.g, c.b)
    lph.push(Math.random() * 6.3)
  }

  const lg = new THREE.BufferGeometry()
  lg.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3))
  lg.setAttribute('aCol', new THREE.Float32BufferAttribute(lc, 3))
  lg.setAttribute('aPh', new THREE.Float32BufferAttribute(lph, 1))

  const pixelRatio = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 2) : 1
  const lmat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uPR: { value: pixelRatio },
    },
    vertexShader: `
      uniform float uTime, uPR;
      attribute vec3 aCol;
      attribute float aPh;
      varying vec3 vC;
      varying float vI;
      void main(){
        vC = aCol;
        vI = 0.5 + 0.5 * sin(uTime * 2.0 + aPh * 3.0);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = clamp((10.0 + 8.0 * vI) * uPR / -mv.z * 6.0, 2.0, 40.0 * uPR);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      varying vec3 vC;
      varying float vI;
      void main(){
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.0, d);
        gl_FragColor = vec4(vC * (1.0 + a * 2.5) * (0.35 + 0.65 * vI), a * a);
      }
    `,
  })

  model.add(new THREE.Points(lg, lmat))

  const glow = new THREE.PointLight(0xffa860, 70, 26, 1.6)
  glow.position.set(0, 5, 2.5)
  g.add(glow)

  // Gift boxes under the tree
  const cols = [0xd62839, 0x2a9d8f, 0xf4c430, 0x3a6ea5, 0xb5179e, 0xe76f51]
  for (let i = 0; i < 7; i++) {
    const s = rnd(0.7, 1.4)
    const a = Math.PI * (0.15 + 0.85 * (i / 6)) + rnd(-0.1, 0.1)
    const radDist = rnd(2.4, 4.2)
    const box = new THREE.Group()

    box.add(
      new THREE.Mesh(
        new THREE.BoxGeometry(s, s * rnd(0.7, 1), s),
        std({ color: cols[i % 6], roughness: 0.45 })
      )
    )

    const rib = std({ color: i % 2 ? 0xffe9a8 : 0xffffff, roughness: 0.3 })
    box.add(new THREE.Mesh(new THREE.BoxGeometry(s * 1.04, s * 1.04, s * 0.16), rib))
    box.add(new THREE.Mesh(new THREE.BoxGeometry(s * 0.16, s * 1.04, s * 1.04), rib))

    for (const sx of [-1, 1]) {
      const b = new THREE.Mesh(new THREE.TorusGeometry(s * 0.16, s * 0.05, 8, 16), rib)
      b.position.set(sx * s * 0.16, s * 0.56, 0)
      b.rotation.x = Math.PI / 2 - sx * 0.5
      box.add(b)
    }

    box.position.set(Math.cos(a) * radDist - 0.5, s / 2, Math.sin(a) * radDist)
    box.rotation.y = rnd(0, 6.3)
    box.traverse(o => {
      o.castShadow = true
      o.receiveShadow = true
    })
    g.add(box)
  }

  return {
    group: g,
    ready,
    update: (t: number) => {
      lmat.uniforms.uTime.value = t
      glow.intensity = 62 + Math.sin(t * 3) * 8
    },
  }
}
