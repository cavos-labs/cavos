'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { MeshDistortMaterial, Sphere, Environment, Lightformer } from '@react-three/drei'
import { useRef, useState, useEffect } from 'react'
import { ACESFilmicToneMapping, type Mesh, type Group } from 'three'

/**
 * Glossy morphing 3D orb in Cavos indigo. A high-poly sphere distorts with
 * noise, rotates and bobs; lit with indigo/violet/blue lightformers for a
 * polished, reflective gradient surface. Sits on the right and, together with a
 * soft glow, fills the whole right column. Honors prefers-reduced-motion.
 */
function Orb({ animate, mobile }: { animate: boolean; mobile: boolean }) {
    const mesh = useRef<Mesh>(null)
    const group = useRef<Group>(null)

    const pos: [number, number, number] = mobile ? [1.3, 2.9, 0] : [4.5, 0.1, 0]
    const scale = mobile ? 1.15 : 2.2
    const baseY = pos[1]

    useFrame((state) => {
        if (!animate) return
        const t = state.clock.elapsedTime
        if (mesh.current) {
            mesh.current.rotation.y = t * 0.3
            mesh.current.rotation.x = Math.sin(t * 0.25) * 0.18
        }
        if (group.current) {
            group.current.position.y = baseY + Math.sin(t * 0.5) * 0.2
        }
    })

    return (
        <group ref={group} position={pos} scale={scale}>
            <Sphere ref={mesh} args={[1.5, 256, 256]}>
                <MeshDistortMaterial
                    color="#4733FF"
                    distort={animate ? 0.42 : 0.28}
                    speed={animate ? 2.2 : 0}
                    roughness={0.1}
                    metalness={0.65}
                    envMapIntensity={1.5}
                    clearcoat={1}
                    clearcoatRoughness={0.12}
                    dithering
                />
            </Sphere>
        </group>
    )
}

export function HeroOrb({ fixed = false }: { fixed?: boolean }) {
    const [animate, setAnimate] = useState(true)
    const [mobile, setMobile] = useState(false)

    useEffect(() => {
        const motionMq = window.matchMedia('(prefers-reduced-motion: reduce)')
        const mobileMq = window.matchMedia('(max-width: 767px)')
        const sync = () => {
            setAnimate(!motionMq.matches)
            setMobile(mobileMq.matches)
        }
        sync()
        motionMq.addEventListener('change', sync)
        mobileMq.addEventListener('change', sync)
        return () => {
            motionMq.removeEventListener('change', sync)
            mobileMq.removeEventListener('change', sync)
        }
    }, [])

    return (
        <div aria-hidden="true" className={`${fixed ? 'fixed' : 'absolute'} top-0 left-0 w-screen h-screen overflow-hidden pointer-events-none -z-10 bg-white`}>
            {/* indigo glow — from the top on mobile, from the right edge on desktop */}
            <div
                className="absolute inset-0"
                style={{
                    background: mobile
                        ? 'radial-gradient(70% 38% at 74% 4%, rgba(64,42,255,0.30) 0%, rgba(124,92,255,0.15) 46%, rgba(255,255,255,0) 78%)'
                        : 'radial-gradient(70% 100% at 100% 50%, rgba(64,42,255,0.32) 0%, rgba(124,92,255,0.16) 38%, rgba(255,255,255,0) 66%)',
                }}
            />

            <Canvas
                className="!absolute inset-0"
                camera={{ position: [0, 0, 4.2], fov: 45 }}
                dpr={[1, 2]}
                gl={{
                    antialias: true,
                    alpha: true,
                    toneMapping: ACESFilmicToneMapping,
                    toneMappingExposure: 1.05,
                }}
                frameloop={animate ? 'always' : 'demand'}
            >
                <ambientLight intensity={0.7} />
                <directionalLight position={[3, 4, 5]} intensity={2.6} color="#ffffff" />
                <pointLight position={[-5, -2, 2]} intensity={5} color="#8B6BFF" />
                <pointLight position={[4, -4, -1]} intensity={3} color="#2E7BFF" />

                {/* self-contained environment for glossy reflections (no external HDR) */}
                <Environment resolution={512}>
                    <Lightformer intensity={3} position={[-3, 2, 4]} scale={[7, 7, 1]} color="#9B82FF" />
                    <Lightformer intensity={2.4} position={[3, -2, 3]} scale={[7, 7, 1]} color="#2E7BFF" />
                    <Lightformer intensity={4} position={[0, 4, -2]} scale={[12, 2, 1]} color="#ffffff" />
                    <Lightformer intensity={2} position={[2, 0, -4]} scale={[8, 8, 1]} color="#402AFF" />
                </Environment>

                <Orb animate={animate} mobile={mobile} />
            </Canvas>

            {/* legibility fade — bottom on mobile, left on desktop */}
            <div
                className="absolute inset-0"
                style={{
                    background: mobile
                        ? 'linear-gradient(to bottom, rgba(255,255,255,0) 24%, rgba(255,255,255,0.75) 46%, #FFFFFF 60%)'
                        : 'linear-gradient(100deg, #FFFFFF 0%, rgba(255,255,255,0.95) 30%, rgba(255,255,255,0.5) 52%, rgba(255,255,255,0) 70%)',
                }}
            />
        </div>
    )
}
