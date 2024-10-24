<template>
  <div class="black-hole-container">
    <div class="controls">
      <div class="control-item">
        <label>盘粒子数量: {{ diskParticleCount }}</label>
        <input
          type="range"
          :min="1000"
          :max="10000"
          v-model.number="diskParticleCount"
        >
      </div>
      <div class="control-item">
        <label>喷流粒子数量: {{ jetParticleCount }}</label>
        <input
          type="range"
          :min="1000"
          :max="5000"
          v-model.number="jetParticleCount"
        >
      </div>
      <div class="control-item">
        <label>吸积盘半径: {{ radius }}</label>
        <input
          type="range"
          :min="5"
          :max="15"
          step="0.5"
          v-model.number="radius"
        >
      </div>
    </div>
    <div ref="containerRef" class="scene-container" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useThree } from '../composables/useThree'
import { useParticleSystem } from '../composables/useParticleSystem'

const containerRef = ref<HTMLDivElement>()
const diskParticleCount = ref(5000)
const jetParticleCount = ref(2000)
const radius = ref(8)
const height = ref(20)

const { initThree, animate } = useThree()
const { initParticleSystems, updateParticles } = useParticleSystem()

let time = 0

onMounted(() => {
  if (!containerRef.value) return

  const { scene, camera, renderer } = initThree(containerRef.value)

  // 初始化粒子系统
  initParticleSystems(scene, {
    diskParticleCount: diskParticleCount.value,
    jetParticleCount: jetParticleCount.value,
    radius: radius.value,
    height: height.value
  })

  // 动画循环
  function animateLoop() {
    time += 0.005
    updateParticles(time)

    // 相机轻微运动
    camera.position.x = Math.cos(time * 0.1) * 15
    camera.position.z = Math.sin(time * 0.1) * 15
    camera.lookAt(0, 0, 0)

    animate()
    requestAnimationFrame(animateLoop)
  }

  animateLoop()
})

// 监听参数变化
watch([diskParticleCount, jetParticleCount, radius], () => {
  // TODO: 添加重新生成粒子系统的逻辑
})
</script>

<style scoped>
.black-hole-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.scene-container {
  width: 100%;
  height: 100%;
}

.controls {
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.7);
  padding: 20px;
  border-radius: 10px;
  color: white;
  z-index: 100;
}

.control-item {
  margin-bottom: 15px;
}

.control-item label {
  display: block;
  margin-bottom: 5px;
  font-size: 14px;
}

.control-item input {
  width: 200px;
}
</style>