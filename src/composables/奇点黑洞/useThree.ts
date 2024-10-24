import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass'

export function useThree() {
  let scene: THREE.Scene
  let camera: THREE.PerspectiveCamera
  let renderer: THREE.WebGLRenderer
  let controls: OrbitControls
  let composer: EffectComposer

  function initThree(container: HTMLElement) {
    // 场景设置
    scene = new THREE.Scene()
    scene.background = new THREE.Color(0x000000)

    // 相机设置 - 确保完美的侧视图
    camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    )
    camera.position.set(20, 0, 0)
    camera.lookAt(0, 0, 0)

    // 渲染器设置
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    })
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1
    container.appendChild(renderer.domElement)

    // 控制器设置
    controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.minDistance = 15
    controls.maxDistance = 25
    controls.enableRotate = true
    controls.enableZoom = true
    controls.enablePan = false
    controls.target.set(0, 0, 0)

    // 后期处理设置
    composer = new EffectComposer(renderer)

    // 基础渲染通道
    const renderPass = new RenderPass(scene, camera)
    composer.addPass(renderPass)

    // 泛光效果 - 针对光环和明亮区域
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(container.clientWidth, container.clientHeight),
      1.0,    // 强度
      0.4,    // 半径
      0.9     // 阈值
    )
    composer.addPass(bloomPass)

    // 自定义光线扭曲效果
    const distortionShader = {
      uniforms: {
        tDiffuse: { value: null },
        time: { value: 0 },
        distortionStrength: { value: 0.4 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float time;
        uniform float distortionStrength;
        varying vec2 vUv;
        
        void main() {
          vec2 center = vec2(0.5, 0.5);
          vec2 delta = vUv - center;
          float dist = length(delta);
          
          // 计算扭曲强度
          float strength = 1.0 - smoothstep(0.0, 0.8, dist);
          strength = pow(strength, 3.0);
          
          // 添加时间变化的扭曲
          float angle = atan(delta.y, delta.x);
          float distortion = strength * distortionStrength;
          
          // 计算扭曲后的UV坐标
          vec2 distortedUv = center + vec2(
            cos(angle) * (dist + distortion),
            sin(angle) * (dist + distortion)
          );
          
          // 采样原始颜色
          vec4 color = texture2D(tDiffuse, distortedUv);
          
          // 在黑洞边缘添加发光效果
          float glow = smoothstep(0.4, 0.0, dist) * 0.5;
          color.rgb += vec3(glow);
          
          gl_FragColor = color;
        }
      `
    }

    const distortionPass = new ShaderPass(distortionShader)
    composer.addPass(distortionPass)

    // 色彩调整
    const colorCorrectionShader = {
      uniforms: {
        tDiffuse: { value: null },
        brightness: { value: 1.1 },
        contrast: { value: 1.2 },
        saturation: { value: 1.1 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float brightness;
        uniform float contrast;
        uniform float saturation;
        varying vec2 vUv;
        
        void main() {
          vec4 color = texture2D(tDiffuse, vUv);
          
          // 亮度调整
          color.rgb *= brightness;
          
          // 对比度调整
          color.rgb = (color.rgb - 0.5) * contrast + 0.5;
          
          // 饱和度调整
          float luminance = dot(color.rgb, vec3(0.299, 0.587, 0.114));
          color.rgb = mix(vec3(luminance), color.rgb, saturation);
          
          gl_FragColor = color;
        }
      `
    }

    const colorCorrectionPass = new ShaderPass(colorCorrectionShader)
    composer.addPass(colorCorrectionPass)

    // 响应窗口大小变化
    window.addEventListener('resize', () => {
      camera.aspect = container.clientWidth / container.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(container.clientWidth, container.clientHeight)
      composer.setSize(container.clientWidth, container.clientHeight)
    })

    return {
      scene,
      camera,
      renderer,
      controls,
      composer
    }
  }

  function animate() {
    controls.update()
    composer.render()
  }

  return {
    initThree,
    animate
  }
}