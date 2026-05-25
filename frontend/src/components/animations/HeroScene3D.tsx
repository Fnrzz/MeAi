"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

const BRAND_BLUE = 0x1a6fff;
const ELECTRIC_BLUE = 0x00aaff;
const TRAIL_COLOR = 0xc8deff;
const BG_COLOR = 0x020a18;

interface NodeData {
  mesh: THREE.Mesh;
  basePos: THREE.Vector3;
  connections: number[];
  pulsePhase: number;
  scale: number;
}

export function HeroScene3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const reducedMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const isMobile = window.innerWidth < 768;
    const dpr = Math.min(window.devicePixelRatio, 2);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(BG_COLOR, 0.012);

    const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 800);
    camera.position.set(0, 0, 18);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(dpr);
    renderer.setClearColor(BG_COLOR, 1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0x1a3a6a, 0.4);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x4488ff, 1.2);
    dirLight.position.set(-10, 15, 10);
    scene.add(dirLight);

    const pointLight1 = new THREE.PointLight(BRAND_BLUE, 2, 160);
    pointLight1.position.set(5, 3, 8);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(ELECTRIC_BLUE, 1.5, 140);
    pointLight2.position.set(-6, -4, 6);
    scene.add(pointLight2);

    const nodeCount = isMobile ? 36 : 64;
    const nodes: NodeData[] = [];
    const nodeGroup = new THREE.Group();
    scene.add(nodeGroup);

    const nodeGeom = new THREE.OctahedronGeometry(1.12, 0);

    for (let i = 0; i < nodeCount; i++) {
      const hue = 0.58 + (Math.random() - 0.5) * 0.08;
      const color = new THREE.Color().setHSL(hue, 0.85, 0.45 + Math.random() * 0.15);
      const mat = new THREE.MeshStandardMaterial({
        color,
        emissive: color.clone().multiplyScalar(0.4),
        emissiveIntensity: 0.6,
        metalness: 0.7,
        roughness: 0.2,
      });

      const mesh = new THREE.Mesh(nodeGeom, mat);
      const spread = isMobile ? 64 : 88;
      const pos = new THREE.Vector3(
        (Math.random() - 0.5) * spread,
        (Math.random() - 0.5) * spread * 0.7,
        (Math.random() - 0.5) * spread * 0.4,
      );
      mesh.position.copy(pos);
      const s = 0.6 + Math.random() * 0.8;
      mesh.scale.setScalar(s);
      nodeGroup.add(mesh);

      nodes.push({
        mesh,
        basePos: pos.clone(),
        connections: [],
        pulsePhase: Math.random() * Math.PI * 2,
        scale: s,
      });
    }

    const edges: { from: number; to: number; pulseOffset: number }[] = [];
    const edgeGroup = new THREE.Group();
    scene.add(edgeGroup);

    const maxDist = isMobile ? 40 : 44;
    for (let i = 0; i < nodeCount; i++) {
      for (let j = i + 1; j < nodeCount; j++) {
        const d = nodes[i].basePos.distanceTo(nodes[j].basePos);
        if (d < maxDist && Math.random() > 0.35) {
          nodes[i].connections.push(j);
          nodes[j].connections.push(i);
          edges.push({ from: i, to: j, pulseOffset: Math.random() * Math.PI * 2 });
        }
      }
    }

    const edgePositions = new Float32Array(edges.length * 6);
    const edgeColors = new Float32Array(edges.length * 6);
    const edgeGeom = new THREE.BufferGeometry();
    edgeGeom.setAttribute("position", new THREE.BufferAttribute(edgePositions, 3));
    edgeGeom.setAttribute("color", new THREE.BufferAttribute(edgeColors, 3));
    const edgeMat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.6 });
    const edgeLines = new THREE.LineSegments(edgeGeom, edgeMat);
    edgeGroup.add(edgeLines);

    const particleCount = isMobile ? 120 : 400;
    const particleGeom = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);
    const particleSizes = new Float32Array(particleCount);
    const particleData: { edgeIdx: number; progress: number; speed: number; direction: number }[] = [];

    for (let i = 0; i < particleCount; i++) {
      if (edges.length > 0) {
        const ei = Math.floor(Math.random() * edges.length);
        particleData.push({
          edgeIdx: ei,
          progress: Math.random(),
          speed: 0.60 + Math.random() * 1.00,
          direction: Math.random() > 0.5 ? 1 : -1,
        });
      } else {
        particleData.push({ edgeIdx: 0, progress: 0, speed: 0, direction: 1 });
      }
      particlePos[i * 3] = 0;
      particlePos[i * 3 + 1] = 0;
      particlePos[i * 3 + 2] = 0;
      particleSizes[i] = 1.5 + Math.random() * 2;
    }

    particleGeom.setAttribute("position", new THREE.BufferAttribute(particlePos, 3));
    particleGeom.setAttribute("size", new THREE.BufferAttribute(particleSizes, 1));

    const pMat = new THREE.PointsMaterial({
      color: TRAIL_COLOR,
      size: 0.08,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });
    const particlePoints = new THREE.Points(particleGeom, pMat);
    scene.add(particlePoints);

    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    const onMouse = (e: MouseEvent) => {
      mouse.tx = ((e.clientX / window.innerWidth) - 0.5) * 2;
      mouse.ty = -((e.clientY / window.innerHeight) - 0.5) * 2;
    };
    const onTouch = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        mouse.tx = ((e.touches[0].clientX / window.innerWidth) - 0.5) * 2;
        mouse.ty = -((e.touches[0].clientY / window.innerHeight) - 0.5) * 2;
      }
    };
    window.addEventListener("mousemove", onMouse);
    window.addEventListener("touchmove", onTouch, { passive: true });

    let scrollY = 0;
    const onScroll = () => { scrollY = window.scrollY; };
    window.addEventListener("scroll", onScroll, { passive: true });

    const timer = new THREE.Timer();
    let prevTime = 0;

    function animate() {
      requestAnimationFrame(animate);
      timer.update();
      const dt = timer.getDelta();
      const t = timer.getElapsed();

      mouse.x += (mouse.tx - mouse.x) * 0.05;
      mouse.y += (mouse.ty - mouse.y) * 0.05;

      if (!reducedMotion) {
        nodeGroup.rotation.y += (mouse.x * 0.12 - nodeGroup.rotation.y) * 0.03;
        nodeGroup.rotation.x += (mouse.y * 0.08 - nodeGroup.rotation.x) * 0.03;
      }
      nodeGroup.rotation.y += dt * 0.12;

        const scrollFactor = Math.min(scrollY / 800, 1);
      camera.position.z = 18 - scrollFactor * 6;

      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        n.pulsePhase += dt * 6.0;
        const pulse = 1 + Math.sin(n.pulsePhase) * 0.15;
        n.mesh.scale.setScalar(n.scale * pulse);
        n.mesh.rotation.y += dt * 2.0;

        const breathe = Math.sin(t * 1.0 + i * 0.3) * 0.30;
        n.mesh.position.y = n.basePos.y + breathe;

        const mat = n.mesh.material as THREE.MeshStandardMaterial;
        mat.emissiveIntensity = 0.5 + Math.sin(n.pulsePhase) * 0.3;
      }

      for (let i = 0; i < edges.length; i++) {
        const e = edges[i];
        const a = nodes[e.from].mesh.position;
        const b = nodes[e.to].mesh.position;
        edgePositions[i * 6] = a.x;
        edgePositions[i * 6 + 1] = a.y;
        edgePositions[i * 6 + 2] = a.z;
        edgePositions[i * 6 + 3] = b.x;
        edgePositions[i * 6 + 4] = b.y;
        edgePositions[i * 6 + 5] = b.z;

        const pulse = 0.3 + Math.sin(t * 2 + e.pulseOffset) * 0.2;
        const c = new THREE.Color(BRAND_BLUE).lerp(new THREE.Color(ELECTRIC_BLUE), pulse);
        edgeColors[i * 6] = c.r;
        edgeColors[i * 6 + 1] = c.g;
        edgeColors[i * 6 + 2] = c.b;
        edgeColors[i * 6 + 3] = c.r * 0.6;
        edgeColors[i * 6 + 4] = c.g * 0.6;
        edgeColors[i * 6 + 5] = c.b * 0.6;
      }
      edgeGeom.attributes.position.needsUpdate = true;
      edgeGeom.attributes.color.needsUpdate = true;

      for (let i = 0; i < particleCount; i++) {
        const p = particleData[i];
        if (edges.length === 0) continue;
        p.progress += p.speed * dt * p.direction;
        if (p.progress > 1) { p.progress = 0; p.direction = 1; }
        if (p.progress < 0) { p.progress = 1; p.direction = -1; }

        const e = edges[p.edgeIdx % edges.length];
        const a = nodes[e.from].mesh.position;
        const b = nodes[e.to].mesh.position;
        particlePos[i * 3] = a.x + (b.x - a.x) * p.progress;
        particlePos[i * 3 + 1] = a.y + (b.y - a.y) * p.progress;
        particlePos[i * 3 + 2] = a.z + (b.z - a.z) * p.progress;
      }
      particleGeom.attributes.position.needsUpdate = true;

      pointLight1.intensity = 2 + Math.sin(t * 1.5) * 0.5;
      pointLight2.intensity = 1.5 + Math.cos(t * 1.2) * 0.4;

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
      window.removeEventListener("touchmove", onTouch);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [reducedMotion]);

  return <div ref={containerRef} className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }} />;
}
