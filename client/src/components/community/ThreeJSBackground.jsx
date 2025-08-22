import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'

const ThreeJSBackground = () => {
  const mountRef = useRef(null)
  const sceneRef = useRef(null)
  const rendererRef = useRef(null)
  const animationIdRef = useRef(null)

  useEffect(() => {
    if (!mountRef.current) return

    // Scene setup
    const scene = new THREE.Scene()
    sceneRef.current = scene

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
    camera.position.z = 5

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ 
      alpha: true, 
      antialias: true,
      powerPreference: "high-performance"
    })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    rendererRef.current = renderer

    mountRef.current.appendChild(renderer.domElement)

    // Create floating particles
    const particlesGeometry = new THREE.BufferGeometry()
    const particlesCount = 150
    const posArray = new Float32Array(particlesCount * 3)

    for (let i = 0; i < particlesCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 20
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3))

    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.005,
      color: 0x7C3AED,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    })

    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial)
    scene.add(particlesMesh)

    // Create floating orbs
    const orbsGeometry = new THREE.SphereGeometry(0.1, 32, 32)
    const orbsMaterial = new THREE.MeshBasicMaterial({
      color: 0x7C3AED,
      transparent: true,
      opacity: 0.3
    })

    const orbs = []
    for (let i = 0; i < 8; i++) {
      const orb = new THREE.Mesh(orbsGeometry, orbsMaterial)
      orb.position.set(
        (Math.random() - 0.5) * 15,
        (Math.random() - 0.5) * 15,
        (Math.random() - 0.5) * 10
      )
      orb.userData = {
        speed: Math.random() * 0.02 + 0.01,
        rotationSpeed: Math.random() * 0.02 + 0.01
      }
      orbs.push(orb)
      scene.add(orb)
    }

    // Create floating lines
    const linesGeometry = new THREE.BufferGeometry()
    const linesCount = 20
    const linePositions = []

    for (let i = 0; i < linesCount; i++) {
      const start = new THREE.Vector3(
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 10
      )
      const end = new THREE.Vector3(
        start.x + (Math.random() - 0.5) * 4,
        start.y + (Math.random() - 0.5) * 4,
        start.z + (Math.random() - 0.5) * 2
      )
      linePositions.push(start.x, start.y, start.z, end.x, end.y, end.z)
    }

    linesGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3))
    const linesMaterial = new THREE.LineBasicMaterial({
      color: 0x7C3AED,
      transparent: true,
      opacity: 0.2
    })
    const linesMesh = new THREE.LineSegments(linesGeometry, linesMaterial)
    scene.add(linesMesh)

    // Animation loop
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate)

      // Rotate particles
      particlesMesh.rotation.y += 0.001
      particlesMesh.rotation.x += 0.0005

      // Animate orbs
      orbs.forEach((orb, index) => {
        orb.position.y += Math.sin(Date.now() * 0.001 + index) * 0.001
        orb.rotation.x += orb.userData.rotationSpeed
        orb.rotation.y += orb.userData.rotationSpeed
      })

      // Animate lines
      linesMesh.rotation.y += 0.0005

      renderer.render(scene, camera)
    }

    animate()

    // Handle resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }

    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
      }
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement)
      }
      renderer.dispose()
    }
  }, [])

  return (
    <div 
      ref={mountRef} 
      className="fixed inset-0 pointer-events-none z-0"
      style={{ zIndex: -1 }}
    />
  )
}

export default ThreeJSBackground
