import * as THREE from 'three'
import { ref, reactive } from 'vue'

export function useParticleSystem() {
  const particles = reactive<THREE.Points[]>([])
  const diskGeometry = ref<THREE.BufferGeometry | null>(null)
  const jetGeometry = ref<THREE.BufferGeometry | null>(null)

  function createBlackHoleCore(scene: THREE.Scene) {
  // 加大黑洞中心的尺寸，增加黑暗度
  const geometry = new THREE.SphereGeometry(1.2, 32, 32)
  const material = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 1 // 提高不透明度
  })
  const blackHole = new THREE.Mesh(geometry, material)
  scene.add(blackHole)

  // 调整光晕效果，降低亮度
  const glowGeometry = new THREE.SphereGeometry(1.3, 32, 32)
  const glowMaterial = new THREE.ShaderMaterial({
    uniforms: {
      color: { value: new THREE.Color(0x220022) } // 降低光晕颜色强度
    },
    vertexShader: `
      varying vec3 vNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 color;
      varying vec3 vNormal;
      void main() {
        float intensity = pow(0.8 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
        gl_FragColor = vec4(color, intensity * 0.5); // 降低整体强度
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending
  })
  const glow = new THREE.Mesh(glowGeometry, glowMaterial)
  glow.scale.multiplyScalar(1.1)
  scene.add(glow)
}

  function createDiskParticles(particleCount: number, radius: number) {
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)
    const sizes = new Float32Array(particleCount)

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 20
      // 调整粒子分布，使其更集中在中心区域
      const radiusVariation = radius * (Math.pow(Math.random(), 2) * 0.8 + 0.2)
      const r = Math.sqrt(Math.random()) * radiusVariation

      positions[i * 3] = Math.cos(angle) * r
      positions[i * 3 + 1] = (Math.random() - 0.5) * 0.3 // 降低厚度
      positions[i * 3 + 2] = Math.sin(angle) * r

      const distanceFromCenter = Math.sqrt(
        positions[i * 3] ** 2 +
        positions[i * 3 + 2] ** 2
      )
      const temperature = 1 - (distanceFromCenter / radius)

      // 调整颜色，使其更暗淡
      colors[i * 3] = Math.min(1, temperature * 0.8)     // R - 降低红色分量
      colors[i * 3 + 1] = temperature * 0.15             // G - 降低绿色分量
      colors[i * 3 + 2] = temperature * 0.3              // B - 降低蓝色分量

      // 减小粒子大小
      sizes[i] = Math.random() * 1.2 + 0.3
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

    return geometry
  }

  function createParticleMaterial() {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        size: { value: 2 },
      },
      vertexShader: `
        attribute float size;
        varying vec3 vColor;
        uniform float time;
        
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (250.0 / -mvPosition.z); // 减小整体粒子大小
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        
        void main() {
          vec2 xy = gl_PointCoord.xy - vec2(0.5);
          float r = length(xy);
          if (r > 0.5) discard;
          
          float alpha = smoothstep(0.5, 0.0, r) * 0.6; // 降低透明度
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true
    })
  }

  function createJetParticles(particleCount: number, height: number) {
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)
    const sizes = new Float32Array(particleCount)

    for (let i = 0; i < particleCount; i++) {
      const y = (Math.random() - 0.5) * height
      const angle = Math.random() * Math.PI * 2
      const radiusAtHeight = 0.3 * Math.abs(y / height)

      positions[i * 3] = Math.cos(angle) * radiusAtHeight
      positions[i * 3 + 1] = y
      positions[i * 3 + 2] = Math.sin(angle) * radiusAtHeight

      const heightFactor = Math.abs(y / height)
      colors[i * 3] = 0.5 + heightFactor * 0.5
      colors[i * 3 + 1] = 0.2 + heightFactor * 0.3
      colors[i * 3 + 2] = 0.8 - heightFactor * 0.3

      sizes[i] = (1 - heightFactor) * 2 + 0.5
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

    return geometry
  }


  function initParticleSystems(scene: THREE.Scene, options: {
    diskParticleCount: number,
    jetParticleCount: number,
    radius: number,
    height: number
  }) {
    // 创建中心黑洞
    createBlackHoleCore(scene)

    // 创建吸积盘
    diskGeometry.value = createDiskParticles(options.diskParticleCount, options.radius)
    const diskParticles = new THREE.Points(diskGeometry.value, createParticleMaterial())

    // 创建双极喷流
    jetGeometry.value = createJetParticles(options.jetParticleCount, options.height)
    const jetParticles1 = new THREE.Points(jetGeometry.value, createParticleMaterial())
    const jetParticles2 = new THREE.Points(jetGeometry.value, createParticleMaterial())

    jetParticles1.rotation.x = Math.PI / 2
    jetParticles2.rotation.x = -Math.PI / 2

    scene.add(diskParticles)
    scene.add(jetParticles1)
    scene.add(jetParticles2)

    particles.push(diskParticles, jetParticles1, jetParticles2)

    return {
      diskParticles,
      jetParticles1,
      jetParticles2
    }
  }

  function updateParticles(time: number) {
    particles.forEach((particle, index) => {
      if (particle.material instanceof THREE.ShaderMaterial) {
        particle.material.uniforms.time.value = time
      }

      if (index === 0) { // 吸积盘旋转
        particle.rotation.y += 0.001
      } else { // 喷流波动
        const offset = index === 1 ? 0 : Math.PI
        particle.position.x = Math.sin(time + offset) * 0.1
        particle.position.z = Math.cos(time + offset) * 0.1
      }
    })
  }

  return {
    initParticleSystems,
    updateParticles
  }
}