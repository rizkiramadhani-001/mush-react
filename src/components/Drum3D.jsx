/* Model 3D tong fermentasi 50L dengan pil data mengambang.
   Pil hanya cerminan visual; angka resmi tetap di HTML di bawahnya. */
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { useTheme } from "../theme";

const RING_DARK = { ok: "#6fd598", warn: "#eda75f", bad: "#ec8d84" };
const RING_LIGHT = { ok: "#166f42", warn: "#8f550e", bad: "#b3362a" };

export default function Drum3D({ tone = "ok", suhu = "--", hum = "--", berat = "--", status = "", onError }) {
  const [theme] = useTheme();
  const mountRef = useRef(null);
  const layerRef = useRef(null);
  const pillRefs = useRef([]);
  const liveRef = useRef(null);
  const errRef = useRef(null);

  useEffect(() => {
    liveRef.current = { tone, suhu, hum, berat, status, theme };
    errRef.current = onError;
  });

  useEffect(() => {
    const mount = mountRef.current;
    const layer = layerRef.current;
    if (!mount || !layer) return undefined;
    let renderer;
    try {
      if (!window.WebGLRenderingContext) throw new Error("WebGL tidak tersedia");
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      errRef.current?.();
      return undefined;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.domElement.style.touchAction = "pan-y";
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 50);
    camera.position.set(3.8, 2.0, 5.2);
    camera.lookAt(0, 0.1, 0);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x0c4b38, 0.9));
    const sun = new THREE.DirectionalLight(0xffffff, 1.6);
    sun.position.set(3, 5, 4);
    scene.add(sun);

    const drum = new THREE.Group();
    const plastic = new THREE.MeshStandardMaterial({ color: "#3d7ca8", roughness: 0.55, metalness: 0.05 });
    const darkPlastic = new THREE.MeshStandardMaterial({ color: "#1d4568", roughness: 0.6 });
    const lidMat = new THREE.MeshStandardMaterial({ color: "#238055", roughness: 0.5 });
    const ringMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(RING_DARK.ok),
      emissive: new THREE.Color(RING_DARK.ok),
      emissiveIntensity: 0.55,
      roughness: 0.4,
    });

    const add = (geo, mat, y = 0) => {
      const m = new THREE.Mesh(geo, mat);
      m.position.y = y;
      drum.add(m);
      return m;
    };
    add(new THREE.CylinderGeometry(1, 1, 2.2, 48), plastic, 0);
    add(new THREE.CylinderGeometry(1.05, 1.05, 0.22, 48), lidMat, 1.21);
    add(new THREE.CylinderGeometry(0.12, 0.14, 0.24, 24), darkPlastic, 1.43);
    add(new THREE.CylinderGeometry(0.16, 0.16, 0.07, 24), lidMat, 1.56);
    for (const y of [0.55, -0.55]) {
      const rim = add(new THREE.TorusGeometry(1.005, 0.045, 16, 64), darkPlastic, y);
      rim.rotation.x = Math.PI / 2;
    }
    const base = add(new THREE.TorusGeometry(1.3, 0.07, 16, 72), ringMat, -1.18);
    base.rotation.x = Math.PI / 2;
    scene.add(drum);

    // Jangkar pil dalam koordinat dunia (tidak ikut putar).
    const anchors = [
      new THREE.Vector3(0, 1.95, 0),
      new THREE.Vector3(1.55, 0.35, 0),
      new THREE.Vector3(0, -1.18, 1.55),
      new THREE.Vector3(-1.55, 0.35, 0),
    ];

    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.autoRotate = !reduced;
    controls.autoRotateSpeed = 0.8;
    controls.minPolarAngle = Math.PI / 5;
    controls.maxPolarAngle = Math.PI / 2;
    controls.domElement.style.touchAction = "pan-y";

    const resize = () => {
      const w = mount.clientWidth || 1;
      const h = mount.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    const v = new THREE.Vector3();
    const pills = pillRefs.current;
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      controls.update();
      renderer.render(scene, camera);
      const w = mount.clientWidth || 1;
      const h = mount.clientHeight || 1;
      const d = liveRef.current;
      const RING = d.theme === "light" ? RING_LIGHT : RING_DARK;
      const hex = RING[d.tone] ?? RING.ok;
      ringMat.color.set(hex);
      ringMat.emissive.set(hex);
      const texts = [`${d.suhu}°C`, `${d.hum}%`, d.status, `${d.berat} kg`];
      anchors.forEach((a, i) => {
        const el = pills[i];
        if (!el) return;
        v.copy(a).project(camera);
        if (v.z > 1) {
          el.style.opacity = "0";
          return;
        }
        el.style.opacity = "1";
        el.style.transform = `translate(${(v.x * 0.5 + 0.5) * w}px, ${(-v.y * 0.5 + 0.5) * h}px) translate(-50%, -130%)`;
        const label = el.querySelector("[data-v]");
        if (label && label.textContent !== texts[i]) label.textContent = texts[i];
        const dot = el.querySelector("[data-dot]");
        if (dot && i === 2) dot.style.background = hex;
      });
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      controls.dispose();
      drum.traverse((o) => {
        if (o.isMesh) {
          o.geometry.dispose();
          (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose());
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <div ref={mountRef} className="model-stage" role="img" aria-label="Model 3D tong fermentasi dengan data mengambang">
      <div ref={layerRef} className="model-pills" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            ref={(el) => {
              pillRefs.current[i] = el;
            }}
            className="model-pill"
          >
            {i === 2 && <span data-dot className="model-pill-dot" />}
            <span data-v>--</span>
          </div>
        ))}
      </div>
    </div>
  );
}
