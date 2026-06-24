'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { MeshDistortMaterial, Sphere, Environment, Lightformer } from '@react-three/drei'
import { useRef, useState, useEffect, useMemo } from 'react'
import { ACESFilmicToneMapping, CanvasTexture, SRGBColorSpace, RepeatWrapping, type Mesh, type Group, type Texture } from 'three'

/**
 * Procedurally paints the Cavos "silk" texture (electric-indigo field with
 * brushed diagonal light strands) onto a canvas and returns it as a tileable
 * 3D texture. Same visual language as the OG card / X banner so the orb reads
 * as the same brand surface. Runs once on the client; no external asset.
 */
function useSilkTexture(): Texture | null {
    return useMemo(() => {
        if (typeof document === 'undefined') return null
        const S = 1536
        const c = document.createElement('canvas')
        c.width = c.height = S
        const ctx = c.getContext('2d')!
        // base indigo gradient (matches og-image #3826E6 → #402AFF → #4E3BFF)
        const g = ctx.createLinearGradient(0, 0, S, S)
        g.addColorStop(0, '#3826E6')
        g.addColorStop(0.5, '#402AFF')
        g.addColorStop(1, '#4E3BFF')
        ctx.fillStyle = g
        ctx.fillRect(0, 0, S, S)

        const rnd = (a: number, b: number) => a + Math.random() * (b - a)
        const ang = -0.42
        const drawStrand = (opMin: number, opMax: number, wMin: number, wMax: number, cols: string[], blur: number) => {
            const x1 = rnd(-S * 0.3, S * 1.3), y1 = rnd(-S * 0.3, S * 1.3)
            const len = S * 2.4
            const x2 = x1 - Math.cos(ang) * len, y2 = y1 - Math.sin(ang) * len
            ctx.save()
            ctx.globalAlpha = rnd(opMin, opMax)
            ctx.filter = blur ? `blur(${blur}px)` : 'none'
            ctx.strokeStyle = cols[(Math.random() * cols.length) | 0]
            ctx.lineWidth = rnd(wMin, wMax)
            ctx.lineCap = 'round'
            ctx.beginPath()
            ctx.moveTo(x1, y1)
            ctx.lineTo(x2, y2)
            ctx.stroke()
            ctx.restore()
        }
        const light = ['#FFFFFF', '#E2D8FF']
        const dark = ['#2616A0', '#3422C9']
        // broad soft sheen bands
        for (let i = 0; i < 28; i++) drawStrand(0.05, 0.11, 30, 80, light, 30)
        for (let i = 0; i < 18; i++) drawStrand(0.05, 0.11, 30, 80, dark, 30)
        // crisp high-frequency silk threads — readable density without overloading the canvas
        for (let i = 0; i < 280; i++) drawStrand(0.05, 0.16, 1.5, 5, light, 1.2)
        for (let i = 0; i < 80; i++) drawStrand(0.04, 0.1, 1.5, 4, dark, 1)

        const tex = new CanvasTexture(c)
        tex.colorSpace = SRGBColorSpace
        tex.wrapS = tex.wrapT = RepeatWrapping
        tex.anisotropy = 16
        return tex
    }, [])
}

/**
 * Glossy morphing 3D orb in Cavos indigo. A high-poly sphere distorts with
 * noise, rotates and bobs; lit with indigo/violet/blue lightformers for a
 * polished, reflective gradient surface. Sits on the right and, together with a
 * soft glow, fills the whole right column. Honors prefers-reduced-motion.
 */
function Orb({ animate, mobile }: { animate: boolean; mobile: boolean }) {
    const mesh = useRef<Mesh>(null)
    const group = useRef<Group>(null)
    const silk = useSilkTexture()

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
                    color={silk ? '#ffffff' : '#402AFF'}
                    map={silk ?? undefined}
                    emissiveMap={silk ?? undefined}
                    emissive={silk ? '#241499' : '#000000'}
                    emissiveIntensity={silk ? 0.3 : 0}
                    roughnessMap={silk ?? undefined}
                    distort={animate ? 0.4 : 0.28}
                    speed={animate ? 2.0 : 0}
                    roughness={0.92}
                    metalness={0}
                    envMapIntensity={0.2}
                    clearcoat={0}
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
                        ? 'radial-gradient(70% 38% at 74% 4%, rgba(64,42,255,0.30) 0%, rgba(64,42,255,0.14) 46%, rgba(255,255,255,0) 78%)'
                        : 'radial-gradient(70% 100% at 100% 50%, rgba(64,42,255,0.32) 0%, rgba(64,42,255,0.15) 38%, rgba(255,255,255,0) 66%)',
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
                <ambientLight intensity={1.6} />
                <directionalLight position={[1, 1, 5]} intensity={0.7} color="#ffffff" />

                {/* soft even indigo fill — matte surface, no reflections to catch */}
                <Environment resolution={256}>
                    <Lightformer intensity={1} position={[0, 0, 4]} scale={[14, 14, 1]} color="#6655ff" />
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
