import * as THREE           from 'three';
import { GLTFLoader }       from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls }    from 'three/addons/controls/OrbitControls.js';
import { AudioListener, Audio, AudioLoader } from 'three';


let dogMesh; 
let dogBaseY = 0;

// — Scene, Camera, Renderer —
const scene    = new THREE.Scene();
const camera   = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 10000);
// Camera now at (0, 0, 1500)
camera.position.set(200, 150, -200);

const listener = new AudioListener();
camera.add(listener);

// 2) Create a global (non-positional) Audio source
const bgSound = new Audio(listener);

// 3) Preload the MP3 buffer
const audioLoader = new AudioLoader();
let isBufferLoaded = false;

audioLoader.load(
  'bksound.mp3',       // path relative to your served main.js
  buffer => {
    bgSound.setBuffer(buffer);
    bgSound.setLoop(true);
    bgSound.setVolume(0.3);
    isBufferLoaded = true;
    console.log('Background audio buffer ready. Click/tap to start.');
  },
  undefined,
  err => console.error('Audio load error:', err)
);

// 4) Wait for first user gesture to play
function tryPlayBackgroundSound() {
  if (isBufferLoaded && !bgSound.isPlaying) {
    bgSound.play();
    console.log('Background audio playing.');
    // Remove this handler so it only triggers once
    window.removeEventListener('pointerdown', tryPlayBackgroundSound);
  }
}

// Listen for any pointer (mouse/touch) event
window.addEventListener('pointerdown', tryPlayBackgroundSound);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
renderer.setClearColor(0x050505, 1);

renderer.outputEncoding    = THREE.sRGBEncoding;
// (optional) use better tone mapping for PBR
renderer.toneMapping       = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;  // tune if it’s too bright/dark

// — Controls —
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;

controls.autoRotate       = true;   // enable
controls.autoRotateSpeed  = 0.7;    // degrees per second (try 0.1–1.0 for a slow spin)


// limit zoom‐out (max distance from target)
controls.maxDistance = 1250;

controls.target.set(0, 0, 0);
controls.update();

const clock    = new THREE.Clock();
const dogGroup = new THREE.Group();
scene.add(dogGroup);


// — Lights —
const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 3.5);
scene.add(hemi);

const sun = new THREE.SpotLight(0xffffff, 3, 0, Math.PI / 16, 0.2);
sun.position.set(0, 0, 0);
sun.target.position.set(0, 0, 0);
scene.add(sun.target);
scene.add(sun);

const rim = new THREE.PointLight(0xffffff, 3, 0);
rim.position.set(-500, 100, -200);
scene.add(rim);





// — Load your GLTF (for background & lights) —
const loader = new GLTFLoader();
loader.load(
  'FP.gltf',
  gltf => {
    // — Remove old planet; add new Three.js sphere —

    // 1) Sphere parameters (from your Spline data)
    const radius        = (14 / 2) * 6; // 3600
    const widthSegments = 64;
    const heightSegments= 64;

    // 2) Make the geometry
    const planetGeo = new THREE.SphereGeometry(radius, widthSegments, heightSegments);

    // 3) Load your texture
    const texLoader     = new THREE.TextureLoader();
    const planetTexture = texLoader.load('p1.png');
    
    // 4) Create a ShaderMaterial with object-space normal gradient
    // 1) When you build your ShaderMaterial, add:
    // choose your rotation angle (e.g. 45° = PI/4)
const θ = Math.PI / 4;

// recompute the axis
const x = Math.sin(θ);
const y = 0.6;    // preserve your vertical tilt
const z = Math.cos(θ);

const planetMat = new THREE.ShaderMaterial({
  uniforms: {
    map:       { value: planetTexture },
    gradAxis:  { value: new THREE.Vector3(x, y, z).normalize() },
    darkStart: { value: 0.1 },
    darkEnd:   { value: 0.6 },
    minAlpha:  { value: 0.56 }
  },
  vertexShader: `
    varying vec3 vNormal;
    varying vec2 vUv;
    void main() {
      vUv     = uv;
      vNormal = normal;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D map;
    uniform vec3    gradAxis;
    uniform float   darkStart;
    uniform float   darkEnd;
    uniform float   minAlpha;

    varying vec3 vNormal;
    varying vec2 vUv;

    void main() {
      vec4 color = texture2D(map, vUv);

      float dotA = dot(normalize(vNormal), gradAxis);
      float d    = (1.0 - dotA) * 0.5;

      float m = smoothstep(darkStart, darkEnd, d);
      m       = pow(m, 1.0);

      vec3 shaded = mix(color.rgb, vec3(0.0), m * 0.8);
      float alpha = mix(0.7, minAlpha, m);

      gl_FragColor = vec4(shaded, alpha);
    }
  `

  
  


    });
    
    planetMat.transparent = true;

   
      
    const planetRadius = (14 / 2) * 6;  // 42
    const gap          = 28;
    const dogX         = -(planetRadius + gap); // -62
    
    // 2) Load the dog glTF (from models/scene.gltf)
    new GLTFLoader().load(
        'models/scene.gltf',
        gltf => {
          const dog = gltf.scene;
          dog.scale.set(1.5, 1.5, 1.5);
          dog.position.set(dogX, 0, 0);
      
          // safely set encoding if map exists
          dog.traverse(child => {
            if (child.isMesh && child.material.map) {
              child.material.map.encoding = THREE.sRGBEncoding;
              child.material.needsUpdate = true;
          }
        });
    
        // add to your Three.js scene
       // after you set dog.scale and dog.position…
dogGroup.add(dog);
dogMesh = dog;
dogBaseY = dogMesh.position.y;


      },
      undefined,
      err => console.error('Dog load error:', err)
    );
      
      


    // 5) Build the mesh, position at (0,0,0), and add it
    const planetMesh = new THREE.Mesh(planetGeo, planetMat);
    planetMesh.position.set(0, 0, 0);
   
    scene.add(planetMesh);

    // OrbitControls target at (0, 0, 0)
    controls.target.set(0, 0, 0);
    controls.update();

    // Ensure camera looks at (0, 0, 0)
    camera.lookAt(0, 0, 0);

    // 1) load the background texture
    const bgTex = new THREE.TextureLoader().load('space.jpg');
    bgTex.magFilter   = THREE.LinearFilter;
    bgTex.minFilter   = THREE.LinearMipMapLinearFilter;
    bgTex.anisotropy  = renderer.capabilities.getMaxAnisotropy();
    bgTex.needsUpdate = true;

    // 2) big sphere geometry for sky
    const bgGeo = new THREE.SphereGeometry(1000, 1024, 1024);

    // 3) basic material for the inside
    const bgMat = new THREE.MeshStandardMaterial({
      map:       bgTex,
      side:      THREE.BackSide,
      roughness: 1,
      metalness: 0,
      transparent: true,
      opacity: 0.65
    });

    // 4) assemble & add sky sphere
    const skySphere = new THREE.Mesh(bgGeo, bgMat);
    scene.add(skySphere);

    // Pink “key” light
    const pinkLight = new THREE.DirectionalLight(0xfc9003, 0.7);
    pinkLight.position.set(-1000, 300, 500);
    scene.add(pinkLight);

    // Blue “fill” light
    const blueLight = new THREE.DirectionalLight(0xfcdb03, 0.6);
    blueLight.position.set(1000, -200, -400);
    scene.add(blueLight);
  },
  undefined,
  err => console.error('GLTF load error:', err)
);

// — Handle Resizing —
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// — Animation Loop —
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);

  function animate() {
    requestAnimationFrame(animate);
  
    const delta   = clock.getDelta();         // time since last frame
    const elapsed = clock.getElapsedTime();   // total run time
  
    // 1) Orbit the group around the planet
    const orbitSpeed    = 0.2;                // revolutions per second
    dogGroup.rotation.y = elapsed * orbitSpeed;
  
    // 2) Spin the dog itself on its own Y axis
    const spinSpeed = Math.PI * 0.5;            // radians per second (2π = 360°)
    // grab the dog mesh from the group
    const dogMesh = dogGroup.children[0];
    if (dogMesh) {
      dogMesh.rotation.y += spinSpeed * delta;


      if (dogMesh) {
        const floatFreq = 0.2;   // cycles per second
        const floatAmp  = 10;    // peak displacement
        // smooth sine: goes from -1 to +1, centered at 0
        dogMesh.position.y = dogBaseY + Math.sin(elapsed * Math.PI * 2 * floatFreq) * floatAmp;
      }

    }
  
    controls.update();
    renderer.render(scene, camera);
  }
  animate();
  
}
animate();
