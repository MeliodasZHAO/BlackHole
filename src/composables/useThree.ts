import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass'

export function useThree() {
  let scene: THREE.Scene
  let camera: THREE.PerspectiveCamera
  let renderer: THREE.WebGLRenderer
  let controls: OrbitControls
  let composer: EffectComposer

  function addEnvironmentEffects(scene: THREE.Scene) {
    // 添加星空背景
    const starGeometry = new THREE.BufferGeometry()
    const starVertices = []
    for (let i = 0; i < 1000; i++) {
      const x = THREE.MathUtils.randFloatSpread(100)
      const y = THREE.MathUtils.randFloatSpread(100)
      const z = THREE.MathUtils.randFloatSpread(100)
      starVertices.push(x, y, z)
    }
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3))
    const starMaterial = new THREE.PointsMaterial({
      color: 0xFFFFFF,
      size: 0.1,
      transparent: true,
      opacity: 0.8
    })
    const stars = new THREE.Points(starGeometry, starMaterial)
    scene.add(stars)
  }

  function initThree(container: HTMLElement) {
    // 创建场景
    scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0x000000, 0.01)

    // 创建相机
    camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    )
    camera.position.set(15, 8, 15)

    // 创建渲染器
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    })
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 1)
    container.appendChild(renderer.domElement)

    // 添加轨道控制器
    controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.minDistance = 10
    controls.maxDistance = 50

    // 添加环境光
    const ambientLight = new THREE.AmbientLight(0x404040)
    scene.add(ambientLight)

    // 添加星空背景
    addEnvironmentEffects(scene)

    // 设置后期处理
    composer = new EffectComposer(renderer)
    const renderPass = new RenderPass(scene, camera)
    composer.addPass(renderPass)

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(container.clientWidth, container.clientHeight),
      0.8,
      0.3,
      0.6
    )
    composer.addPass(bloomPass)

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