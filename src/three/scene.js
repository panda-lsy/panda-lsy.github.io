import * as THREE from 'three';

export class PortfolioScene {
  constructor() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x09090f);

    this.camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
    this.camera.position.set(0, 0.25, 3);

    this.renderer = null;
    this.mesh = null;
    this.frameId = null;
    this.container = null;
    this.handleResize = () => this.resize();
  }

  init(container) {
    this.container = container;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    container.append(this.renderer.domElement);

    const key = new THREE.DirectionalLight(0xffffff, 1.3);
    key.position.set(2, 2, 3);
    this.scene.add(key);

    const fill = new THREE.AmbientLight(0x5b6cff, 0.6);
    this.scene.add(fill);

    const geometry = new THREE.IcosahedronGeometry(0.8, 0);
    const material = new THREE.MeshStandardMaterial({
      color: 0x5b6cff,
      metalness: 0.35,
      roughness: 0.2,
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.scene.add(this.mesh);

    window.addEventListener('resize', this.handleResize);
    this.resize();
    this.render();

    return this;
  }

  render = () => {
    if (!this.renderer || !this.mesh) {
      return;
    }

    this.mesh.rotation.x += 0.004;
    this.mesh.rotation.y += 0.007;

    this.renderer.render(this.scene, this.camera);
    this.frameId = window.requestAnimationFrame(this.render);
  };

  resize() {
    if (!this.renderer || !this.container) {
      return;
    }

    const { clientWidth, clientHeight } = this.container;
    this.camera.aspect = clientWidth / clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(clientWidth, clientHeight);
  }

  destroy() {
    if (this.frameId) {
      window.cancelAnimationFrame(this.frameId);
    }

    window.removeEventListener('resize', this.handleResize);

    if (this.mesh) {
      this.mesh.geometry.dispose();
      this.mesh.material.dispose();
      this.scene.remove(this.mesh);
    }

    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.domElement.remove();
    }
  }
}
