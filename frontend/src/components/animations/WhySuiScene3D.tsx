"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

const BG_COLOR = 0x020a18;
const SUI_BLUE = 0x1a6fff;
const ICE_BLUE = 0x4da6ff;
const WHITE_BLUE = 0xc8deff;

export function WhySuiScene3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const isMobile = window.innerWidth < 768;
    const dpr = Math.min(window.devicePixelRatio, 2);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(BG_COLOR, 0.012);

    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      800
    );
    camera.position.set(0, 0, 18);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(dpr);
    renderer.setClearColor(BG_COLOR, 1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0x1a3a6a, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x6699ff, 1.0);
    dirLight.position.set(-8, 12, 8);
    scene.add(dirLight);

    const centerLight = new THREE.PointLight(SUI_BLUE, 2.5, 160);
    centerLight.position.set(0, 0, 10);
    scene.add(centerLight);

    const accentLight = new THREE.PointLight(ICE_BLUE, 1.5, 140);
    accentLight.position.set(10, -5, 5);
    scene.add(accentLight);

    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    const dodecaGeom = new THREE.DodecahedronGeometry(7, 0);
    const dodecaMat = new THREE.MeshStandardMaterial({
      color: SUI_BLUE,
      emissive: new THREE.Color(SUI_BLUE).multiplyScalar(0.4),
      emissiveIntensity: 0.6,
      metalness: 1,
      roughness: 0.05,
      wireframe: true,
      transparent: true,
      opacity: 0.5,
    });
    const dodecaMesh = new THREE.Mesh(dodecaGeom, dodecaMat);
    mainGroup.add(dodecaMesh);

    const dodecaInnerGeom = new THREE.DodecahedronGeometry(5.6, 0);
    const dodecaInnerMat = new THREE.MeshStandardMaterial({
      color: ICE_BLUE,
      emissive: new THREE.Color(ICE_BLUE).multiplyScalar(0.6),
      emissiveIntensity: 0.8,
      metalness: 1,
      roughness: 0,
      wireframe: true,
      transparent: true,
      opacity: 0.3,
    });
    const dodecaInner = new THREE.Mesh(dodecaInnerGeom, dodecaInnerMat);
    dodecaInner.rotation.set(0.3, 0.5, 0.2);
    mainGroup.add(dodecaInner);

    const coreSphereGeom = new THREE.SphereGeometry(3, 32, 32);
    const coreSphereMat = new THREE.MeshStandardMaterial({
      color: SUI_BLUE,
      emissive: new THREE.Color(SUI_BLUE).multiplyScalar(1.0),
      emissiveIntensity: 1.2,
      metalness: 1,
      roughness: 0,
      transparent: true,
      opacity: 0.15,
    });
    const coreSphere = new THREE.Mesh(coreSphereGeom, coreSphereMat);
    mainGroup.add(coreSphere);

    const hexCount = isMobile ? 32 : 64;
    const hexGeom = new THREE.CylinderGeometry(1, 1, 0.16, 6);
    const hexTiles: { mesh: THREE.Mesh; basePos: THREE.Vector3; floatPhase: number; floatSpeed: number; rotSpeed: number }[] = [];

    for (let i = 0; i < hexCount; i++) {
      const hue = 0.57 + (Math.random() - 0.5) * 0.06;
      const color = new THREE.Color().setHSL(hue, 0.7, 0.4 + Math.random() * 0.15);
      const mat = new THREE.MeshStandardMaterial({
        color,
        emissive: color.clone().multiplyScalar(0.3),
        emissiveIntensity: 0.5,
        metalness: 0.9,
        roughness: 0.1,
        transparent: true,
        opacity: 0.6,
      });
      const mesh = new THREE.Mesh(hexGeom, mat);
      const spread = isMobile ? 64 : 88;
      const pos = new THREE.Vector3(
        (Math.random() - 0.5) * spread,
        (Math.random() - 0.5) * spread * 0.6,
        (Math.random() - 0.5) * 20,
      );
      mesh.position.copy(pos);
      mesh.rotation.x = Math.PI / 2 + (Math.random() - 0.5) * 0.4;
      mesh.rotation.z = Math.random() * Math.PI;
      mainGroup.add(mesh);
      hexTiles.push({
        mesh,
        basePos: pos.clone(),
        floatPhase: Math.random() * Math.PI * 2,
        floatSpeed: 0.3 + Math.random() * 0.5,
        rotSpeed: (Math.random() - 0.5) * 0.4,
      });
    }

    const streamCount = isMobile ? 300 : 800;
    const streamGeom = new THREE.BufferGeometry();
    const streamPos = new Float32Array(streamCount * 3);
    const streamAlpha = new Float32Array(streamCount);
    const streamData: { angle: number; radius: number; z: number; speed: number; arcSpeed: number; drift: number; life: number; maxLife: number }[] = [];

    for (let i = 0; i < streamCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 8 + Math.random() * 24;
      const z = (Math.random() - 0.5) * 16;
      streamPos[i * 3] = Math.cos(angle) * radius;
      streamPos[i * 3 + 1] = Math.sin(angle) * radius;
      streamPos[i * 3 + 2] = z;
      streamAlpha[i] = Math.random();
      streamData.push({
        angle,
        radius,
        z,
        speed: 0.3 + Math.random() * 0.8,
        arcSpeed: (0.15 + Math.random() * 0.3) * (Math.random() > 0.5 ? 1 : -1),
        drift: (Math.random() - 0.5) * 0.1,
        life: Math.random() * 8,
        maxLife: 4 + Math.random() * 6,
      });
    }
    streamGeom.setAttribute("position", new THREE.BufferAttribute(streamPos, 3));

    const streamMat = new THREE.PointsMaterial({
      color: WHITE_BLUE,
      size: 0.36,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });
    const streamPoints = new THREE.Points(streamGeom, streamMat);
    mainGroup.add(streamPoints);

    const silkCount = isMobile ? 4 : 8;
    const silks: { points: THREE.Vector3[]; line: THREE.Line; speed: number; offset: number }[] = [];

    for (let s = 0; s < silkCount; s++) {
      const segCount = 80;
      const pts: THREE.Vector3[] = [];
      const baseAngle = (s / silkCount) * Math.PI * 2;
      const baseR = 10 + s * 2.4;
      for (let j = 0; j < segCount; j++) {
        const t = j / segCount;
        const a = baseAngle + t * Math.PI * 1.5;
        const r = baseR + Math.sin(t * Math.PI * 4) * 4;
        pts.push(new THREE.Vector3(
          Math.cos(a) * r,
          Math.sin(a) * r,
          (t - 0.5) * 16
        ));
      }
      const curve = new THREE.CatmullRomCurve3(pts);
      const curvePoints = curve.getPoints(120);
      const lineGeom = new THREE.BufferGeometry().setFromPoints(curvePoints);
      const hue = 0.57 + s * 0.015;
      const color = new THREE.Color().setHSL(hue, 0.8, 0.5);
      const lineMat = new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: 0.15,
        blending: THREE.AdditiveBlending,
      });
      const line = new THREE.Line(lineGeom, lineMat);
      mainGroup.add(line);
      silks.push({ points: pts, line, speed: 0.2 + s * 0.05, offset: s * 0.8 });
    }

    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    const onMouse = (e: MouseEvent) => {
      mouse.tx = ((e.clientX / window.innerWidth) - 0.5) * 2;
      mouse.ty = -((e.clientY / window.innerHeight) - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMouse);

    const timer = new THREE.Timer();

    function animate() {
      requestAnimationFrame(animate);
      timer.update();
      const dt = timer.getDelta();
      const t = timer.getElapsed();

      mouse.x += (mouse.tx - mouse.x) * 0.03;
      mouse.y += (mouse.ty - mouse.y) * 0.03;

      if (!reducedMotion) {
        mainGroup.rotation.y += (mouse.x * 0.06 - mainGroup.rotation.y) * 0.025;
        mainGroup.rotation.x += (mouse.y * 0.04 - mainGroup.rotation.x) * 0.025;
      }

      dodecaMesh.rotation.y += dt * 0.12;
      dodecaMesh.rotation.x += dt * 0.06;
      const dScale = 1 + Math.sin(t * 0.8) * 0.06;
      dodecaMesh.scale.setScalar(dScale);
      dodecaMat.opacity = 0.4 + Math.sin(t * 1.2) * 0.1;

      dodecaInner.rotation.y -= dt * 0.15;
      dodecaInner.rotation.z += dt * 0.08;
      dodecaInner.rotation.x += dt * 0.04;

      coreSphereMat.emissiveIntensity = 1.0 + Math.sin(t * 1.5) * 0.4;
      coreSphereMat.opacity = 0.12 + Math.sin(t * 0.9) * 0.05;

      for (const hex of hexTiles) {
        hex.floatPhase += dt * hex.floatSpeed;
        hex.mesh.position.y = hex.basePos.y + Math.sin(hex.floatPhase) * 1.2;
        hex.mesh.position.x = hex.basePos.x + Math.cos(hex.floatPhase * 0.7) * 0.6;
        hex.mesh.rotation.z += dt * hex.rotSpeed;
      }

      for (let i = 0; i < streamCount; i++) {
        const d = streamData[i];
        d.angle += d.arcSpeed * dt;
        d.radius += d.drift * dt;
        d.life += dt;
        if (d.life > d.maxLife || d.radius < 4 || d.radius > 50) {
          d.angle = Math.random() * Math.PI * 2;
          d.radius = 8 + Math.random() * 20;
          d.z = (Math.random() - 0.5) * 16;
          d.life = 0;
          d.maxLife = 4 + Math.random() * 6;
          d.drift = (Math.random() - 0.5) * 0.3;
        }
        streamPos[i * 3] = Math.cos(d.angle) * d.radius;
        streamPos[i * 3 + 1] = Math.sin(d.angle) * d.radius;
        streamPos[i * 3 + 2] = d.z + Math.sin(t * d.speed + d.angle) * 1.5;
      }
      streamGeom.attributes.position.needsUpdate = true;

      for (const silk of silks) {
        silk.line.rotation.y = t * silk.speed * 0.1 + silk.offset;
        silk.line.rotation.x = Math.sin(t * silk.speed * 0.2 + silk.offset) * 0.15;
        const mat = silk.line.material as THREE.LineBasicMaterial;
        mat.opacity = 0.1 + Math.sin(t * 0.5 + silk.offset) * 0.05;
      }

      centerLight.intensity = 2.5 + Math.sin(t * 1.2) * 0.8;
      accentLight.intensity = 1.5 + Math.cos(t * 0.9) * 0.5;

      renderer.render(scene, camera);
    }

    if (reducedMotion) {
      renderer.render(scene, camera);
    } else {
      animate();
    }

    const onResize = () => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [reducedMotion]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full"
      style={{ zIndex: 1 }}
    />
  );
}
