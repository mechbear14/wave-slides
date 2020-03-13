const container = document.getElementById("container");
const camera = new THREE.Camera();
const scene = new THREE.Scene();
const geometry = new THREE.PlaneBufferGeometry(2, 2);
const renderer = new THREE.WebGLRenderer();
const uniforms = {
  u_time: { type: "f", value: 1.0 },
  u_resolution: { type: "v2", value: new THREE.Vector2() }
  //   u_mouse: { type: "v2", value: new THREE.Vector2() }
};
const material = new THREE.ShaderMaterial({
  uniforms: uniforms,
  vertexShader: document.getElementById("vertexShader").textContent,
  fragmentShader: document.getElementById("fragmentShader").textContent
});
const mesh = new THREE.Mesh(geometry, material);

function setup() {
  camera.position.z = 1;
  scene.add(mesh);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);
  onResize();
  window.addEventListener("resize", onResize, false);
}

function render() {
  requestAnimationFrame(render);
  uniforms.u_time.value += 0.05;
  renderer.render(scene, camera);
}

function onResize(event) {
  renderer.setSize(window.innerWidth, window.innerHeight);
  uniforms.u_resolution.value.x = renderer.domElement.width;
  uniforms.u_resolution.value.y = renderer.domElement.height;
}

setup();
render();
