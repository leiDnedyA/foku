import * as THREE from 'three';

export function initClickLogger(scene, camera) {
  // 1. Create a global raycaster and mouse vector (do this once, outside the loop)
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  // 2. Listen for the window click event
  window.addEventListener('click', (event) => {

    // 3. Convert mouse click screen position to Normalized Device Coordinates (NDC)
    // Both X and Y must be mapped between -1 and +1
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // 4. Update the raycaster with the camera and mouse position
    raycaster.setFromCamera(mouse, camera);

    // 5. Calculate objects intersecting the picking ray
    // Set recursive (second parameter) to true to check nested children
    const intersects = raycaster.intersectObjects(scene.children, true);

    // 6. If we hit something, log the exact 3D position vector
    if (intersects.length > 0) {
      const hitPoint = intersects[0].point; // This is a THREE.Vector3

      console.log(`3D Click Position -> X: ${hitPoint.x}, Y: ${hitPoint.y}, Z: ${hitPoint.z}`);
      console.log("Full Vector object:", hitPoint);
    } else {
      console.log("Clicked on empty 3D space.");
    }
  });
}

