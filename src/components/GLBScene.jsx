// Adapted from Burger House GLBScene (MIT): Canvas, frame sway and viewport pause.
// Original procedural geometry replaces the upstream GLBs, whose individual
// Creative Commons author/license details were not supplied in that repository.
import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function Disc({ radius, height, color, roughness = 0.8 }) {
  return <mesh><cylinderGeometry args={[radius, radius * 0.98, height, 64]} /><meshStandardMaterial color={color} roughness={roughness} /></mesh>
}

function WavySlice({ color, radius = 1.05, waves = 7, cheese = false }) {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape()
    for (let i = 0; i <= 96; i++) {
      const angle = i / 96 * Math.PI * 2
      const r = radius + Math.sin(angle * waves) * (cheese ? 0.065 : 0.13)
      const x = Math.cos(angle) * r, y = Math.sin(angle) * r
      if (i === 0) shape.moveTo(x, y); else shape.lineTo(x, y)
    }
    const result = new THREE.ExtrudeGeometry(shape, { depth: cheese ? 0.055 : 0.045, bevelEnabled: true, bevelSize: 0.028, bevelThickness: 0.018, bevelSegments: 2, steps: 1 })
    const positions = result.attributes.position
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i), y = positions.getY(i)
      positions.setZ(i, positions.getZ(i) + Math.sin(x * 8) * Math.cos(y * 7) * (cheese ? 0.025 : 0.065))
    }
    result.computeVertexNormals()
    return result
  }, [radius, waves, cheese])
  useEffect(() => () => geometry.dispose(), [geometry])
  return <mesh rotation={[-Math.PI / 2, 0, 0]} geometry={geometry}><meshStandardMaterial color={color} roughness={0.6} side={THREE.DoubleSide} /></mesh>
}

function Patty() {
  const geometry = useMemo(() => {
    const geo = new THREE.CylinderGeometry(1.01, 1.02, 0.3, 72, 8)
    const p = geo.attributes.position
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i)
      const noise = Math.sin(x * 31 + z * 17) * Math.cos(y * 39 + z * 21) * 0.027
      p.setXYZ(i, x + noise, y + noise, z + noise)
    }
    geo.computeVertexNormals()
    return geo
  }, [])
  useEffect(() => () => geometry.dispose(), [geometry])
  return <mesh geometry={geometry}><meshStandardMaterial color="#633619" roughness={1} /></mesh>
}

function TopBun() {
  const seeds = useMemo(() => Array.from({ length: 42 }, (_, i) => {
    const angle = i * 2.399963, r = Math.sqrt((i + 0.5) / 42) * 0.89
    const x = Math.cos(angle) * r, z = Math.sin(angle) * r
    const y = Math.sqrt(1 - r * r) * 0.58
    return { position: [x, y + 0.012, z], rotation: [z * 0.7, angle, -x * 0.7] }
  }), [])
  return <group><mesh scale={[1.07, 0.58, 1.07]}><sphereGeometry args={[1, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#d58329" roughness={0.42} /></mesh><Disc radius={1.065} height={0.05} color="#d18a3b" />{seeds.map((seed, i) => <mesh key={i} position={seed.position} rotation={seed.rotation} scale={[0.022, 0.012, 0.052]}><sphereGeometry args={[1, 8, 6]} /><meshStandardMaterial color="#fff0c5" roughness={0.7} /></mesh>)}</group>
}

const levels = [-0.87, -0.59, -0.32, -0.13, 0.05, 0.28]
function Burger({ paused, exploded, rotation }) {
  const root = useRef(null)
  const layers = useRef([])
  useFrame((state, delta) => {
    if (!root.current) return
    const smoothDelta = Math.min(delta, 0.05)
    const sway = paused ? 0 : Math.sin(state.clock.elapsedTime * 0.5) * 0.13
    root.current.rotation.y = THREE.MathUtils.damp(root.current.rotation.y, rotation + sway, 5, smoothDelta)
    root.current.rotation.z = paused ? 0 : Math.sin(state.clock.elapsedTime * 0.7) * 0.025
    root.current.position.y = paused ? 0 : Math.sin(state.clock.elapsedTime * 1.2) * 0.035
    layers.current.forEach((layer, i) => {
      if (layer) layer.position.y = THREE.MathUtils.damp(layer.position.y, levels[i] + (exploded ? (i - 2.5) * 0.24 : 0), 6, smoothDelta)
    })
  })
  const parts = [
    <mesh key="bottom" scale={[1.05, 0.26, 1.05]}><sphereGeometry args={[1, 64, 32]} /><meshStandardMaterial color="#c88734" roughness={0.56} /></mesh>,
    <WavySlice key="lettuce" color="#65a52f" />,
    <Patty key="patty" />,
    <WavySlice key="cheese" color="#ffbb13" cheese waves={4} />,
    <group key="tomato"><Disc radius={0.91} height={0.12} color="#d93f26" roughness={0.35} /><mesh position={[0.1, 0.095, 0.05]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.66, 0.045, 10, 48]} /><meshStandardMaterial color="#dbb7ca" /></mesh></group>,
    <TopBun key="top" />,
  ]
  return <group ref={root} rotation={[0.12, rotation, 0]}>{parts.map((part, i) => <group key={i} position={[0, levels[i], 0]} ref={element => { layers.current[i] = element }}>{part}</group>)}</group>
}

export default function GLBScene({ paused, exploded, rotation }) {
  const wrapper = useRef(null)
  const [visible, setVisible] = useState(true)
  const [pageVisible, setPageVisible] = useState(!document.hidden)
  const [reduced, setReduced] = useState(matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [contextLost, setContextLost] = useState(false)
  useEffect(() => {
    const query = matchMedia('(prefers-reduced-motion: reduce)')
    const onMotion = () => setReduced(query.matches)
    const onVisibility = () => setPageVisible(!document.hidden)
    query.addEventListener('change', onMotion)
    document.addEventListener('visibilitychange', onVisibility)
    const observer = 'IntersectionObserver' in window ? new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { rootMargin: '100px' }) : null
    if (wrapper.current) observer?.observe(wrapper.current)
    return () => { observer?.disconnect(); query.removeEventListener('change', onMotion); document.removeEventListener('visibilitychange', onVisibility) }
  }, [])
  useEffect(() => {
    const canvas = wrapper.current?.querySelector('canvas')
    if (!canvas) return
    const handleLost = event => { event.preventDefault(); setContextLost(true) }
    canvas.addEventListener('webglcontextlost', handleLost)
    return () => canvas.removeEventListener('webglcontextlost', handleLost)
  }, [])
  if (contextLost) throw new Error('WebGL context lost')
  return <div ref={wrapper} className="scene-wrap" role="img" aria-label="Ilustração 3D de hambúrguer. Use os botões para girar ou separar as camadas."><Canvas camera={{ position: [0, 1.3, 5.8], fov: 38 }} dpr={[1, 1.5]} frameloop={visible && pageVisible ? 'always' : 'never'} gl={{ antialias: true, alpha: true, powerPreference: 'low-power', toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }} fallback={<p className="scene-loading">Este navegador não suporta a experiência 3D.</p>}>
    <ambientLight intensity={1.4} /><directionalLight position={[3, 6, 5]} intensity={3.4} color="#fff1d5" /><directionalLight position={[-4, 2, 2]} intensity={1.6} color="#ffe0a2" /><pointLight position={[0, -2, 4]} intensity={8} color="#ffb433" />
    <Burger paused={paused || reduced} exploded={exploded} rotation={rotation} />
  </Canvas></div>
}
