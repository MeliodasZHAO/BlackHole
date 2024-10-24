<template>
  <div ref="container"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import * as THREE from 'three';
// 使用 ES 模块导入 SimplexNoise
import SimplexNoise from 'simplex-noise';

const container = ref(null);
let scene, camera, renderer, blackHole, accretionDisk, verticalRing, horizontalRing;

const simplex = new SimplexNoise(); // 实例化 Simplex 噪声

onMounted(() => {
  init();
  window.addEventListener('resize', onWindowResize, false);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', onWindowResize);
  if (renderer) {
    renderer.dispose();
  }
});

function init() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 0.35, 4);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.value.appendChild(renderer.domElement);

  createBlackHole();
  createAccretionDisk();
  createVerticalRing();
  createHorizontalRing();

  animate();
}

function createBlackHole() {
  const geometry = new THREE.CircleGeometry(0.8, 64);
  const material = new THREE.MeshBasicMaterial({ color: 0x000000 });
  blackHole = new THREE.Mesh(geometry, material);
  scene.add(blackHole);
}

function createAccretionDisk() {
  const material = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0.0 },
      resolution: { value: new THREE.Vector2() }
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float time;
      varying vec2 vUv;

      // Simplex noise function
      float snoise(vec2 uv) {
        vec3 p = vec3(uv.xy, time * 0.1);  // Control the flow with time
        return (sin(p.x * 10.0 + cos(p.y * 10.0)) + cos(p.x * 10.0 + sin(p.y * 10.0))) * 0.5;
      }

      // Create soft edges and flowing patterns
      void main() {
        vec2 center = vec2(0.5, 0.5);
        vec2 uv = vUv - center;
        float dist = length(uv);
        float angle = atan(uv.y, uv.x);

        // Add rotation and time evolution for flow
        float rotationSpeed = 0.2;
        angle += time * rotationSpeed;

        vec2 rotatedPos = vec2(cos(angle), sin(angle)) * dist + center;

        // Use Simplex noise to create smooth flow
        float noise = snoise(rotatedPos * 2.0); // Adjust scale for flow detail

        // Soft gradient around edges
        float innerEdge = 0.4;
        float outerEdge = 0.5;
        float edgeGradient = smoothstep(innerEdge, innerEdge + 0.02, dist) * (1.0 - smoothstep(outerEdge - 0.02, outerEdge, dist));

        // Use noise to create flowing patterns
        float alpha = edgeGradient * (1.0 - noise);
        alpha = pow(alpha, 1.5);

        // Color for the flow
        vec3 baseColor = vec3(0.8, 0.8, 1.0);  // Lighter, more ethereal color
        vec3 flowColor = mix(vec3(0.2, 0.4, 1.0), baseColor, noise * 0.5);

        gl_FragColor = vec4(flowColor, alpha * 1.0);  // Adjust alpha for transparency
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const geometry = new THREE.PlaneGeometry(2, 2);
  accretionDisk = new THREE.Mesh(geometry, material);
  scene.add(accretionDisk);
}

function createVerticalRing() {
  const material = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0.0 },
      resolution: { value: new THREE.Vector2() }
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float time;
      varying vec2 vUv;

      float snoise(vec2 uv) {
        vec3 p = vec3(uv.xy, time * 0.1);
        return (sin(p.x * 10.0 + cos(p.y * 10.0)) + cos(p.x * 10.0 + sin(p.y * 10.0))) * 0.5;
      }

      void main() {
        vec2 center = vec2(0.5, 0.5);
        vec2 uv = vUv - center;
        float dist = length(uv);
        float angle = atan(uv.y, uv.x);

        float rotationSpeed = 0.2;
        angle += time * rotationSpeed;

        vec2 rotatedPos = vec2(cos(angle), sin(angle)) * dist + center;

        float noise = snoise(rotatedPos * 2.0);

        float innerEdge = 0.4;
        float outerEdge = 0.5;
        float edgeGradient = smoothstep(innerEdge, innerEdge + 0.02, dist) * (1.0 - smoothstep(outerEdge - 0.02, outerEdge, dist));

        float alpha = edgeGradient * (1.0 - noise);
        alpha = pow(alpha, 1.5);

        vec3 baseColor = vec3(1.0, 0.5, 0.8);  // Light pinkish color for contrast
        vec3 flowColor = mix(vec3(0.8, 0.2, 1.0), baseColor, noise * 0.5);

        gl_FragColor = vec4(flowColor, alpha * 1.0);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const geometry = new THREE.PlaneGeometry(2.2, 2.2);
  verticalRing = new THREE.Mesh(geometry, material);
  verticalRing.rotation.y = Math.PI / 2;
  verticalRing.position.z = -0.1;
  scene.add(verticalRing);
}

function createHorizontalRing() {
  const material = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0.0 },
      resolution: { value: new THREE.Vector2() }
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float time;
      varying vec2 vUv;

      float snoise(vec2 uv) {
        vec3 p = vec3(uv.xy, time * 0.1);
        return (sin(p.x * 10.0 + cos(p.y * 10.0)) + cos(p.x * 10.0 + sin(p.y * 10.0))) * 0.5;
      }

      void main() {
        vec2 center = vec2(0.5, 0.5);
        vec2 uv = vUv - center;
        float dist = length(uv);
        float angle = atan(uv.y, uv.x);

        float rotationSpeed = 0.2;
        angle += time * rotationSpeed;

        vec2 rotatedPos = vec2(cos(angle), sin(angle)) * dist + center;

        float noise = snoise(rotatedPos * 2.0);

        float innerEdge = 0.4;
        float outerEdge = 0.5;
        float edgeGradient = smoothstep(innerEdge, innerEdge + 0.02, dist) * (1.0 - smoothstep(outerEdge - 0.02, outerEdge, dist));

        float alpha = edgeGradient * (1.0 - noise);
        alpha = pow(alpha, 1.5);

        vec3 baseColor = vec3(0.5, 1.0, 0.8);  // Light greenish color for contrast
        vec3 flowColor = mix(vec3(0.2, 0.8, 1.0), baseColor, noise * 0.5);

        gl_FragColor = vec4(flowColor, alpha * 1.0);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const geometry = new THREE.PlaneGeometry(2.5, 2.1);
  horizontalRing = new THREE.Mesh(geometry, material);
  horizontalRing.rotation.x = -Math.PI / 2;
  scene.add(horizontalRing);
}

function animate() {
  requestAnimationFrame(animate);
  const time = performance.now() * 0.002;  // Adjusted for smooth animation
  if (accretionDisk && accretionDisk.material.uniforms) {
    accretionDisk.material.uniforms.time.value = time;
  }
  if (verticalRing && verticalRing.material.uniforms) {
    verticalRing.material.uniforms.time.value = time;
  }
  if (horizontalRing && horizontalRing.material.uniforms) {
    horizontalRing.material.uniforms.time.value = time;
  }
  renderer.render(scene, camera);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
</script>

<style scoped>
div {
  width: 100%;
  height: 100vh;
  margin: 0;
  padding: 0;
  overflow: hidden;
  background-color: #000;
}
</style>