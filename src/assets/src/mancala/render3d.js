import * as THREE from 'three';

const BOARD_LENGTH = 17;
const BOARD_WIDTH = 7.5;
const BOARD_HEIGHT = 1.2;
const PIT_RADIUS = 0.85;
const POT_RADIUS = 1.15;
const PIT_SPACING = 2.1;
const ROW_Z = 1.7;
const SHOW_STONE_COUNT = false;

// can be null, 0, or 1 => nobody's turn, player 1, player 2
let turnViewState = null;

const TURN_CAMERA_POSITIONS = {
  null: [0, 13, 11],
  0: [-13, 13, 11],
  1: [13, 13, 11],
}

const CAMERA_LOOKAT = [0, 0, 0.5];

/**
 * Board index -> world position on top of the board.
 * Pot 0 sits at -x, pot 7 at +x. Pits 1-6 run along the near row
 * (+z) towards pot 7; pits 8-13 run back along the far row (-z).
 */
function positionForIndex(index) {
  if (index === 0) return { x: -(BOARD_LENGTH / 2 - 1.6), z: 0, isPot: true };
  if (index === 7) return { x: BOARD_LENGTH / 2 - 1.6, z: 0, isPot: true };
  if (index >= 1 && index <= 6) {
    return { x: (index - 3.5) * PIT_SPACING, z: ROW_Z, isPot: false };
  }
  // 8..13
  return { x: (10.5 - index) * PIT_SPACING, z: -ROW_Z, isPot: false };
}

function makeCountLabel() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(1.1, 1.1, 1);
  return {
    sprite,
    lastValue: null,
    set(value) {
      if (value === this.lastValue) return;
      this.lastValue = value;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, 128, 128);
      ctx.font = 'bold 72px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineWidth = 10;
      ctx.strokeStyle = 'rgba(0,0,0,0.85)';
      ctx.strokeText(String(value), 64, 64);
      ctx.fillStyle = '#f5f0e6';
      ctx.fillText(String(value), 64, 64);
      texture.needsUpdate = true;
    }
  };
}

/** Deterministic stone layout: golden-angle spiral, layered when full. */
function stoneLocalPosition(stoneIndex, maxRadius) {
  const perLayer = maxRadius > 1 ? 14 : 9;
  const layer = Math.floor(stoneIndex / perLayer);
  const inLayer = stoneIndex % perLayer;
  const angle = inLayer * 2.399963 + layer * 0.7;
  const radius = (maxRadius - 0.32) * Math.sqrt((inLayer + 0.5) / perLayer);
  return new THREE.Vector3(
    Math.cos(angle) * radius,
    0.22 + layer * 0.34,
    Math.sin(angle) * radius
  );
}

export function createRenderer3D(container) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x111111);

  const targetCameraPosition = new THREE.Vector3();
  const targetCameraLookAt = new THREE.Vector3();
  const currentCameraLookAt = new THREE.Vector3();

  function moveCameraTo(position, lookAt) {
    targetCameraPosition.copy(position);
    targetCameraLookAt.copy(lookAt);
  }

  const camera = new THREE.PerspectiveCamera(
    45,
    container.clientWidth / container.clientHeight,
    0.1,
    100
  );

  camera.position.set(...TURN_CAMERA_POSITIONS[null]);
  camera.lookAt(...CAMERA_LOOKAT);
  moveCameraTo(camera.position, new THREE.Vector3(...CAMERA_LOOKAT))

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  });

  // Lighting
  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const sun = new THREE.DirectionalLight(0xfff2dd, 1.6);
  sun.position.set(6, 12, 5);
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0x8899ff, 0.4);
  fill.position.set(-6, 8, -6);
  scene.add(fill);

  // Table surface
  const table = new THREE.Mesh(
    new THREE.PlaneGeometry(60, 60),
    new THREE.MeshStandardMaterial({ color: 0x1c1c22, roughness: 0.95 })
  );
  table.rotation.x = -Math.PI / 2;
  table.position.y = -BOARD_HEIGHT;
  scene.add(table);

  // Board base
  const wood = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.7 });
  const board = new THREE.Mesh(
    new THREE.BoxGeometry(BOARD_LENGTH, BOARD_HEIGHT, BOARD_WIDTH),
    wood
  );
  board.position.y = -BOARD_HEIGHT / 2;
  scene.add(board);

  // Pits, pots, stones, labels
  const pitWell = new THREE.MeshStandardMaterial({ color: 0x4a2d13, roughness: 0.9 });
  const stoneGeometry = new THREE.SphereGeometry(0.26, 20, 14);
  const stoneMaterials = [0x9db4c8, 0x8fa8c0, 0xa8b8b0, 0xb0a493].map(
    color => new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.15 })
  );

  const pitViews = [];
  for (let index = 0; index < 14; index++) {
    const { x, z, isPot } = positionForIndex(index);
    const radius = isPot ? POT_RADIUS : PIT_RADIUS;

    const well = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius * 0.8, 0.35, 32),
      pitWell
    );
    well.position.set(x, -0.15, z);
    scene.add(well);

    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(radius, 0.07, 12, 40),
      wood
    );
    rim.rotation.x = Math.PI / 2;
    rim.position.set(x, 0.04, z);
    scene.add(rim);

    const stones = new THREE.Group();
    stones.position.set(x, 0, z);
    scene.add(stones);

    const label = makeCountLabel();
    label.sprite.position.set(x, 1.6, z + (isPot ? 0 : Math.sign(z) * 0.4));
    scene.add(label.sprite);

    pitViews.push({ radius, stones, label });
  }

  // Selection highlight ring
  const highlight = new THREE.Mesh(
    new THREE.TorusGeometry(PIT_RADIUS + 0.18, 0.07, 12, 40),
    new THREE.MeshStandardMaterial({
      color: 0xffcc33,
      emissive: 0xffaa00,
      emissiveIntensity: 1.4,
      roughness: 0.4
    })
  );
  highlight.rotation.x = Math.PI / 2;
  highlight.visible = false;
  scene.add(highlight);

  function render(state, selectedIndex = null, turn = null) {
    for (let index = 0; index < 14; index++) {
      const view = pitViews[index];
      const count = state[index];

      // Sync stone meshes to count
      while (view.stones.children.length < count) {
        const stoneIndex = view.stones.children.length;
        const stone = new THREE.Mesh(
          stoneGeometry,
          stoneMaterials[(index * 7 + stoneIndex) % stoneMaterials.length]
        );
        stone.position.copy(stoneLocalPosition(stoneIndex, view.radius));
        view.stones.add(stone);
      }
      while (view.stones.children.length > count) {
        view.stones.remove(view.stones.children[view.stones.children.length - 1]);
      }

      if (SHOW_STONE_COUNT) view.label.set(count);
    }

    if (selectedIndex === null) {
      highlight.visible = false;
    } else {
      const { x, z } = positionForIndex(selectedIndex);
      highlight.visible = true;
      highlight.position.set(x, 0.1, z);
    }

    if (turn !== turnViewState) {
      turnViewState = turn;
      moveCameraTo(new THREE.Vector3(...TURN_CAMERA_POSITIONS[turn]), new THREE.Vector3(...CAMERA_LOOKAT))
    }
  }

  // Gentle pulse on the highlight ring so the selection reads from a couch.
  function animate() {
    requestAnimationFrame(animate);
    const t = performance.now() / 1000;
    const pulse = 1 + Math.sin(t * 4) * 0.06;
    highlight.scale.set(pulse, pulse, 1);

    const cameraMoveSpeed = 0.05;

    camera.position.lerp(targetCameraPosition, cameraMoveSpeed);
    currentCameraLookAt.lerp(targetCameraLookAt, cameraMoveSpeed);
    camera.lookAt(currentCameraLookAt);

    renderer.render(scene, camera);
  }

  animate();

  return { render };
}
