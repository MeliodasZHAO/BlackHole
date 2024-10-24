import * as THREE from 'three'
import { ref, reactive } from 'vue'

export function useParticleSystem() {
  const particles = reactive<THREE.Points[]>([])
  const sceneRef = ref<THREE.Scene | null>(null)
  const ringRef = ref<THREE.Mesh | null>(null)

  function createBlackHoleCore(scene: THREE.Scene) {
    // 黑洞核心 - 完全黑色的球体
    const coreGeometry = new THREE.SphereGeometry(3, 128, 128)
    const coreMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 1
    })
    const blackHole = new THREE.Mesh(coreGeometry, coreMaterial)
    scene.add(blackHole)

    // 主光环 - 明亮的白色环
    const primaryRingGeometry = new THREE.RingGeometry(3.02, 3.04, 180, 1)
    const primaryRingMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        void main() {
          vec3 color = vec3(1.0, 1.0, 1.0);
          float intensity = 1.0 - abs(vUv.y - 0.5) * 2.0;
          intensity = pow(intensity, 10.0);
          gl_FragColor = vec4(color, intensity);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false
    })
    const primaryRing = new THREE.Mesh(primaryRingGeometry, primaryRingMaterial)
    scene.add(primaryRing)
    ringRef.value = primaryRing

    // 次级光环 - 制造光晕效果
    const secondaryRingGeometry = new THREE.RingGeometry(3.0, 3.06, 180, 1)
    const secondaryRingMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        void main() {
          vec3 color = vec3(0.9, 0.95, 1.0);
          float intensity = 1.0 - abs(vUv.y - 0.5) * 2.0;
          intensity = pow(intensity, 8.0) * 0.5;
          gl_FragColor = vec4(color, intensity);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false
    })
    const secondaryRing = new THREE.Mesh(secondaryRingGeometry, secondaryRingMaterial)
    scene.add(secondaryRing)
  }

  function createAccretionDisk(scene: THREE.Scene, radius: number = 15) {
    const geometry = new THREE.BufferGeometry()
    const particleCount = 500000 // 大量粒子以获得更细腻的效果
    const positions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)
    const sizes = new Float32Array(particleCount)
    const opacities = new Float32Array(particleCount)

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3

      // 使用对数螺旋分布获得更自然的密度
      const t = Math.random()
      const spiralAngle = 50 * t * Math.PI * 2
      const r = 3.1 + Math.exp(t * Math.log(radius))

      // 计算高度偏移，使其在远离中心时逐渐展开
      const heightScale = Math.pow((r - 3.1) / radius, 2) * 0.8
      const height = (Math.random() - 0.5) * heightScale

      positions[i3] = Math.cos(spiralAngle) * r
      positions[i3 + 1] = height
      positions[i3 + 2] = Math.sin(spiralAngle) * r

      // 基于距离计算颜色
      const distanceRatio = (r - 3.1) / radius
      let color = new THREE.Color()

      if (distanceRatio < 0.1) {
        // 最内圈 - 明亮的白色
        color.setHSL(0.5, 0.1, 0.9)
      } else if (distanceRatio < 0.3) {
        // 内圈 - 淡蓝色
        color.setHSL(0.6, 0.7, 0.7)
      } else if (distanceRatio < 0.6) {
        // 中圈 - 蓝色到黄色的过渡
        const hue = THREE.MathUtils.lerp(0.6, 0.15, (distanceRatio - 0.3) / 0.3)
        color.setHSL(hue, 0.8, 0.5)
      } else {
        // 外圈 - 暗淡的黄褐色
        color.setHSL(0.15, 0.7, 0.3)
      }

      colors[i3] = color.r
      colors[i3 + 1] = color.g
      colors[i3 + 2] = color.b

      // 粒子大小随距离变化
      sizes[i] = Math.max(0.01, 0.03 * (1 - Math.pow(distanceRatio, 0.5)))

      // 不透明度随距离衰减
      opacities[i] = Math.pow(1 - distanceRatio, 1.5) * 0.6
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    geometry.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1))

    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        pixelRatio: { value: window.devicePixelRatio }
      },
      vertexShader: `
        attribute float size;
        attribute float opacity;
        varying vec3 vColor;
        varying float vOpacity;
        uniform float time;
        uniform float pixelRatio;
        
        void main() {
          vColor = color;
          vOpacity = opacity;
          
          // 计算位置
          vec3 pos = position;
          
          // 添加微小的波动
          float wave = sin(time * 2.0 + pos.x * 0.05 + pos.z * 0.05) * 0.02;
          pos.y += wave * (1.0 - min(abs(pos.y), 1.0));
          
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = size * (2000.0 / -mvPosition.z) * pixelRatio;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vOpacity;
        
        void main() {
          vec2 xy = gl_PointCoord.xy - vec2(0.5);
          float r = length(xy);
          if (r > 0.5) discard;
          
          // 柔和的粒子边缘
          float intensity = smoothstep(0.5, 0.0, r);
          gl_FragColor = vec4(vColor, intensity * vOpacity);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true
    })

    const points = new THREE.Points(geometry, material)
    scene.add(points)
    particles.push(points)
  }

  function initParticleSystem(scene: THREE.Scene) {
    sceneRef.value = scene
    createBlackHoleCore(scene)
    createAccretionDisk(scene)
  }

  function updateParticles(time: number) {
    // 更新粒子系统
    particles.forEach(particle => {
      if (particle.material instanceof THREE.ShaderMaterial) {
        particle.material.uniforms.time.value = time * 0.2
      }
    })

    // 更新光环
    if (ringRef.value && ringRef.value.material instanceof THREE.ShaderMaterial) {
      ringRef.value.material.uniforms.time.value = time * 0.1
    }
  }

  return {
    initParticleSystem,
    updateParticles
  }
}