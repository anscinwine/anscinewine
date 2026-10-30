import * as THREE from 'three'

// Bảng giới thiệu lơ lửng ở cuối đường, xa tít. Chỉnh ANCHOR để dời bảng.
export const ANCHOR = new THREE.Vector3(0, 4, -28)

const POS = [
  [0, 5, 44],
  [5, 4.6, 32],
  [-3, 4.2, 18],
  [0, 3.9, 3],
  [0, 3.9, -14],
].map(p => new THREE.Vector3(p[0], p[1], p[2]))

const LOOK = [
  [0, 6, 0],
  [0, 5, -6],
  [0, 4.5, -14],
  [0, 4.2, -24],
  [0, 4, -28],
].map(p => new THREE.Vector3(p[0], p[1], p[2]))

// khoảng cách camera -> bảng ở cuối hành trình: lúc đó bảng hiện đúng cỡ 100%
export const END_DIST = POS[POS.length - 1].distanceTo(ANCHOR)

const posCurve = new THREE.CatmullRomCurve3(POS, false, 'catmullrom', 0.5)
const lookCurve = new THREE.CatmullRomCurve3(LOOK, false, 'catmullrom', 0.5)
const _p = new THREE.Vector3()
const _l = new THREE.Vector3()

export function applyCameraAt(camera: THREE.Camera, t: number) {
  t = THREE.MathUtils.clamp(t, 0, 1)
  posCurve.getPoint(t, _p)
  lookCurve.getPoint(t, _l)
  camera.position.copy(_p)
  camera.lookAt(_l)
}
