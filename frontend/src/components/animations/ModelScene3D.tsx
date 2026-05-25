"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

const BG_COLOR = 0x020a18;
const CYAN = 0x00d4ff;
const BLUE = 0x1a6fff;
const PURPLE = 0x6366f1;

interface RingData {
  mesh: THREE.Mesh;
  baseRotX: number;
  baseRotY: number;
  baseRotZ: number;
  rotSpeedX: number;
  rotSpeedY: number;
  rotSpeedZ: number;
  radius: number;
}

interface OrbData {
  mesh: THREE.Mesh;
  angle: number;
  radius: number;
  speed: number;
  yOffset: number;
  ySpeed: number;
  pulsePhase: number;
}

export function ModelScene3D() {
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
      50,
      container.clientWidth / container.clientHeight,
      0.1,
      800
    );
    camera.position.set(0, 0, 20);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(dpr);
    renderer.setClearColor(BG_COLOR, 1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.4;
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0x1a3a6a, 0.5);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x4488ff, 1.5);
    dirLight.position.set(-10, 15, 10);
    scene.add(dirLight);

    const coreLight1 = new THREE.PointLight(CYAN, 3, 160);
    coreLight1.position.set(0, 0, 5);
    scene.add(coreLight1);

    const coreLight2 = new THREE.PointLight(PURPLE, 2, 140);
    coreLight2.position.set(0, 0, -3);
    scene.add(coreLight2);

    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    const coreGeom = new THREE.IcosahedronGeometry(4.4, 1);
    const coreMat = new THREE.MeshStandardMaterial({
      color: CYAN,
      emissive: new THREE.Color(CYAN).multiplyScalar(0.6),
      emissiveIntensity: 0.8,
      metalness: 0.9,
      roughness: 0.1,
      wireframe: true,
    });
    const coreMesh = new THREE.Mesh(coreGeom, coreMat);
    mainGroup.add(coreMesh);

    const innerGlowGeom = new THREE.IcosahedronGeometry(3.2, 2);
    const innerGlowMat = new THREE.MeshStandardMaterial({
      color: BLUE,
      emissive: new THREE.Color(BLUE).multiplyScalar(0.8),
      emissiveIntensity: 1.0,
      metalness: 1,
      roughness: 0,
      transparent: true,
      opacity: 0.4,
    });
    const innerGlow = new THREE.Mesh(innerGlowGeom, innerGlowMat);
    mainGroup.add(innerGlow);

    const rings: RingData[] = [];
    const ringConfigs = [
      { radius: 12, tube: 0.12, color: CYAN, emissive: 0.3, rotX: 0, rotY: 0, rotZ: 0, spX: 0.3, spY: 0.5, spZ: 0 },
      { radius: 17, tube: 0.10, color: BLUE, emissive: 0.25, rotX: Math.PI / 3, rotY: 0, rotZ: 0.3, spX: -0.2, spY: 0.3, spZ: 0.15 },
      { radius: 22, tube: 0.08, color: PURPLE, emissive: 0.2, rotX: -Math.PI / 4, rotY: Math.PI / 6, rotZ: -0.2, spX: 0.15, spY: -0.25, spZ: 0.1 },
    ];

    for (const rc of ringConfigs) {
      const geom = new THREE.TorusGeometry(rc.radius, rc.tube, 16, 100);
      const mat = new THREE.MeshStandardMaterial({
        color: rc.color,
        emissive: new THREE.Color(rc.color).multiplyScalar(rc.emissive),
        emissiveIntensity: 0.6,
        metalness: 0.8,
        roughness: 0.15,
        transparent: true,
        opacity: 0.7,
      });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.rotation.set(rc.rotX, rc.rotY, rc.rotZ);
      mainGroup.add(mesh);
      rings.push({
        mesh,
        baseRotX: rc.rotX,
        baseRotY: rc.rotY,
        baseRotZ: rc.rotZ,
        rotSpeedX: rc.spX,
        rotSpeedY: rc.spY,
        rotSpeedZ: rc.spZ,
        radius: rc.radius,
      });
    }

    const orbs: OrbData[] = [];
    const orbCount = isMobile ? 24 : 48;
    const orbGeom = new THREE.SphereGeometry(0.3, 8, 8);

    for (let i = 0; i < orbCount; i++) {
      const ringIdx = Math.floor(Math.random() * ringConfigs.length);
      const rc = ringConfigs[ringIdx];
      const hue = 0.52 + Math.random() * 0.15;
      const color = new THREE.Color().setHSL(hue, 0.9, 0.55);
      const mat = new THREE.MeshStandardMaterial({
        color,
        emissive: color.clone().multiplyScalar(0.5),
        emissiveIntensity: 0.8,
        metalness: 0.6,
        roughness: 0.2,
      });
      const mesh = new THREE.Mesh(orbGeom, mat);
      const angle = Math.random() * Math.PI * 2;
      mainGroup.add(mesh);
      orbs.push({
        mesh,
        angle,
        radius: rc.radius,
        speed: (0.4 + Math.random() * 0.6) * (Math.random() > 0.5 ? 1 : -1),
        yOffset: (Math.random() - 0.5) * 2,
        ySpeed: 0.5 + Math.random() * 0.5,
        pulsePhase: Math.random() * Math.PI * 2,
      });
    }

    const particleCount = isMobile ? 200 : 600;
    const pGeom = new THREE.BufferGeometry();
    const pPos = new Float32Array(particleCount * 3);
    const pVel: { vx: number; vy: number; vz: number; life: number; maxLife: number }[] = [];

    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 6 + Math.random() * 30;
      pPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pPos[i * 3 + 2] = r * Math.cos(phi);
      pVel.push({
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        vz: (Math.random() - 0.5) * 0.6,
        life: Math.random() * 5,
        maxLife: 3 + Math.random() * 4,
      });
    }
    pGeom.setAttribute("position", new THREE.BufferAttribute(pPos, 3));

    const pMat = new THREE.PointsMaterial({
      color: 0xc8deff,
      size: 0.24,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });
    const particlePoints = new THREE.Points(pGeom, pMat);
    mainGroup.add(particlePoints);

    const beamCount = 6;
    const beamGroup = new THREE.Group();
    scene.add(beamGroup);
    const beams: { mesh: THREE.Mesh; angle: number; speed: number; length: number }[] = [];

    for (let i = 0; i < beamCount; i++) {
      const length = 40 + Math.random() * 30;
      const geom = new THREE.CylinderGeometry(0.03, 0.03, length, 4, 1, true);
      const hue = 0.52 + i * 0.03;
      const color = new THREE.Color().setHSL(hue, 0.9, 0.5);
      const mat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.25,
        blending: THREE.AdditiveBlending,
      });
      const mesh = new THREE.Mesh(geom, mat);
      const angle = (i / beamCount) * Math.PI * 2;
      mesh.position.set(
        Math.cos(angle) * 8,
        Math.sin(angle) * 8,
        0
      );
      mesh.rotation.z = angle + Math.PI / 2;
      beamGroup.add(mesh);
      beams.push({ mesh, angle, speed: 0.1 + Math.random() * 0.15, length });
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

      mouse.x += (mouse.tx - mouse.x) * 0.04;
      mouse.y += (mouse.ty - mouse.y) * 0.04;

      if (!reducedMotion) {
        mainGroup.rotation.y += (mouse.x * 0.08 - mainGroup.rotation.y) * 0.03;
        mainGroup.rotation.x += (mouse.y * 0.05 - mainGroup.rotation.x) * 0.03;
      }

      coreMesh.rotation.y += dt * 0.4;
      coreMesh.rotation.x += dt * 0.2;
      const coreScale = 1 + Math.sin(t * 1.5) * 0.08;
      coreMesh.scale.setScalar(coreScale);

      innerGlow.rotation.y -= dt * 0.3;
      innerGlow.rotation.z += dt * 0.15;
      const glowScale = 1 + Math.sin(t * 2) * 0.05;
      innerGlow.scale.setScalar(glowScale);
      innerGlowMat.emissiveIntensity = 0.8 + Math.sin(t * 2.5) * 0.4;

      for (const ring of rings) {
        ring.mesh.rotation.x = ring.baseRotX + t * ring.rotSpeedX;
        ring.mesh.rotation.y = ring.baseRotY + t * ring.rotSpeedY;
        ring.mesh.rotation.z = ring.baseRotZ + t * ring.rotSpeedZ;
      }

      for (const orb of orbs) {
        orb.angle += orb.speed * dt;
        orb.pulsePhase += dt * 3;
        const x = Math.cos(orb.angle) * orb.radius;
        const z = Math.sin(orb.angle) * orb.radius;
        const y = orb.yOffset + Math.sin(t * orb.ySpeed + orb.angle) * 0.8;
        orb.mesh.position.set(x, y, z);
        const pulse = 1 + Math.sin(orb.pulsePhase) * 0.2;
        orb.mesh.scale.setScalar(pulse);
      }

      for (let i = 0; i < particleCount; i++) {
        const v = pVel[i];
        pPos[i * 3] += v.vx * dt;
        pPos[i * 3 + 1] += v.vy * dt;
        pPos[i * 3 + 2] += v.vz * dt;
        v.life += dt;
        if (v.life > v.maxLife) {
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(2 * Math.random() - 1);
          const r = 6 + Math.random() * 10;
          pPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
          pPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
          pPos[i * 3 + 2] = r * Math.cos(phi);
          v.vx = (Math.random() - 0.5) * 0.6;
          v.vy = (Math.random() - 0.5) * 0.6;
          v.vz = (Math.random() - 0.5) * 0.6;
          v.life = 0;
          v.maxLife = 3 + Math.random() * 4;
        }
      }
      pGeom.attributes.position.needsUpdate = true;

      beamGroup.rotation.z += dt * 0.15;
      beamGroup.rotation.x += dt * 0.08;
      for (const beam of beams) {
        const mat = beam.mesh.material as THREE.MeshBasicMaterial;
        mat.opacity = 0.15 + Math.sin(t * 2 + beam.angle * 3) * 0.1;
      }

      coreLight1.intensity = 3 + Math.sin(t * 2) * 1;
      coreLight2.intensity = 2 + Math.cos(t * 1.5) * 0.8;

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
