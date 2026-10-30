import * as THREE from 'three'

// Ready-made snow mound beside the board (tree + gifts stand on it)
export const PAD = { x: 8.2, z: -27, r: 6.5, h: 1.5 }
export const PAD2 = { x: 0, z: 100000, r: 1, h: 0 } // unused (far away)

const NOISE = /* glsl */ `
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y);
}
float fbm2(vec2 p){ return noise(p)*.67 + noise(p*2.03)*.33; }
float fbm(vec2 p){ float a=.5,s=0.; for(int i=0;i<4;i++){ s+=a*noise(p); p*=2.03; a*=.5; } return s; }
`

interface SnowGroundOptions {
  y?: number
  seconds?: number
  fogColor: number
  fogDensity: number
}

export function createSnowGround({ y = 0, seconds = 150, fogColor, fogDensity }: SnowGroundOptions) {
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: true,
    uniforms: {
      uP: { value: 0 },
      uDepth: { value: 0 },
      uTime: { value: 0 },
      uFogColor: { value: new THREE.Color(fogColor) },
      uFogD: { value: fogDensity },
      uPad: { value: new THREE.Vector4(PAD.x, PAD.z, PAD.r, PAD.h) },
      uPad2: { value: new THREE.Vector4(PAD2.x, PAD2.z, PAD2.r, PAD2.h) },
      uWarm: { value: new THREE.Vector3(PAD.x, y + PAD.h + 4, PAD.z) },
      uLampPos: { value: new THREE.Vector3(-2.4, y + 8.18, -21.42) },
      uLampColor: { value: new THREE.Color(0xffbb3d) },
      uLampIntensity: { value: 1.0 },
    },
    vertexShader: /* glsl */ `
      uniform float uDepth;
      uniform vec4 uPad, uPad2;
      varying vec3 vW, vN;
      ${NOISE}
      float H(vec2 p){
        float drift = fbm2(p*0.07) + fbm2(p*0.17+7.0)*0.45;
        vec2 w = vec2(p.x*0.55 + p.y*0.18, p.y*0.06);
        float r = noise(w*1.1); r = r*r*(3.0-2.0*r);
        float g = uDepth * (0.1 + drift*0.8 + r*0.35);
        float m = 1.0 - smoothstep(uPad.z*0.55, uPad.z, length(p-uPad.xy));
        float v = mix(g, uPad.w + noise(p*2.5)*0.05, m);
        float m2 = 1.0 - smoothstep(uPad2.z*0.55, uPad2.z, length(p-uPad2.xy));
        return mix(v, uPad2.w + noise(p*2.5)*0.05, m2);
      }
      void main(){
        vec4 w = modelMatrix * vec4(position, 1.0);
        float e = 0.9, h = H(w.xz);
        vN = normalize(vec3(H(w.xz-vec2(e,0.))-H(w.xz+vec2(e,0.)), 2.0*e, H(w.xz-vec2(0.,e))-H(w.xz+vec2(0.,e))));
        w.y += h;
        vW = w.xyz;
        gl_Position = projectionMatrix * viewMatrix * w;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uP, uTime, uFogD;
      uniform vec3 uFogColor, uWarm, uLampPos, uLampColor;
      uniform float uLampIntensity;
      uniform vec4 uPad, uPad2;
      varying vec3 vW, vN;
      ${NOISE}
      float D(vec2 p){ return noise(p*9.0)*.65 + noise(p*27.0)*.35; }
      void main(){
        vec2 p = vW.xz;
        float dist = length(cameraPosition - vW);
        float cell = 0.07;
        vec2 c = floor(p/cell), f = fract(p/cell) - 0.5;
        float land = hash(c)*0.93 + noise(p*0.3)*0.07;
        float rad = 0.28 + 0.6*uP;
        float fine = step(land, uP) * (1.0 - smoothstep(rad-0.08, rad, length(f)));
        float far = smoothstep(cell*0.6, cell*2.5, length(fwidth(p)));
        float cover = mix(fine, clamp(uP/0.93, 0.0, 1.0), far);
        float pad = 1.0 - smoothstep(uPad.z*0.55, uPad.z, length(p-uPad.xy));
        cover = max(cover, max(pad, 1.0 - smoothstep(uPad2.z*0.55, uPad2.z, length(p-uPad2.xy))));
        cover *= 1.0 - smoothstep(90.0, 118.0, length(p));
        if (cover < 0.01) discard;

        float k = 0.9 * (1.0 - smoothstep(15.0, 70.0, dist)), e = 0.015;
        float d0 = D(p);
        vec3 N = normalize(vN + vec3(-(D(p+vec2(e,0.))-d0), 0., -(D(p+vec2(0.,e))-d0)) / e * 0.02 * k);
        vec3 V = normalize(cameraPosition - vW), L = normalize(vec3(20., 30., 10.));
        float ndl = dot(N, L);
        float diff = max(ndl*0.75 + 0.25, 0.0);
        
        // Surrounding atmosphere: deeper, moodier winter night shade
        vec3 shadow = vec3(0.04, 0.08, 0.19);
        vec3 lit = vec3(0.55, 0.68, 0.88) * 1.1;
        float ao = 0.7 + 0.3*d0;
        vec3 col = mix(shadow, lit, diff) * ao * 0.75;
        col += vec3(0.18, 0.28, 0.52) * pow(1.0 - max(dot(N, V), 0.0), 3.0) * 0.3;
        
        float g = hash(floor(p*38.));
        col += vec3(1.0) * step(0.993, g) * (0.5 + 0.5*sin(uTime*3.0 + g*600.)) * 2.0 * (1.0 - smoothstep(10.0, 45.0, dist));
        
        // 1. Warm glow from the Christmas tree lights
        vec3 tl = uWarm - vW;
        col += vec3(1.0, 0.5, 0.2) * 1.8 / (1.0 + dot(tl,tl)*0.08) * (0.35 + 0.65*max(dot(N, normalize(tl)), 0.0));

        // 2. Focused downward golden street lamppost pool
        vec3 toGround = vW - uLampPos;
        float lampDist = length(toGround);
        vec3 lampDir = normalize(toGround);
        vec3 spotDown = vec3(0.0, -1.0, 0.0);
        float cosTheta = dot(lampDir, spotDown);
        
        // Spotlight cone angle (~60 deg total spread, smooth penumbra)
        float spotFactor = smoothstep(0.45, 0.82, cosTheta);
        float lampAtten = spotFactor * (36.0 / (1.0 + lampDist * lampDist * 0.45));
        
        // Surface diffuse facing up toward lamp
        float lampNdl = max(dot(N, -lampDir), 0.0);
        vec3 lampGlow = uLampColor * uLampIntensity * lampAtten * (0.35 + 0.65 * lampNdl);
        col += lampGlow;

        col = mix(col, uFogColor, clamp(1.0 - exp(-dist*dist*uFogD*uFogD), 0.0, 1.0));
        gl_FragColor = vec4(col, cover);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  })

  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(240, 240, 240, 240), mat)
  mesh.rotation.x = -Math.PI / 2
  mesh.position.y = y + 0.02
  mesh.receiveShadow = true

  return {
    mesh,
    setLampUniforms(pos: THREE.Vector3, intensity: number) {
      mat.uniforms.uLampPos.value.copy(pos)
      mat.uniforms.uLampIntensity.value = intensity
    },
    update(t: number) {
      mat.uniforms.uP.value = 1
      mat.uniforms.uDepth.value = 2.6
      mat.uniforms.uTime.value = t
    },
  }
}
