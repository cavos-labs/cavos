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
 *
 * The soft sheen is blurred on a tiny buffer and scaled up. Blurring hundreds
 * of strokes on a 1536px canvas looks free until WebGL uploads the texture —
 * that readback blocked the main thread for several seconds on entry.
 */
function useSilkTexture(): Texture | null {
    return useMemo(() => {
        if (typeof document === 'undefined') return null
        const S = 768
        const c = document.createElement('canvas')
        c.width = c.height = S
        const ctx = c.getContext('2d')!

        const rnd = (a: number, b: number) => a + Math.random() * (b - a)
        const ang = -0.42
        const light = ['#FFFFFF', '#E2D8FF']
        const dark = ['#2616A0', '#3422C9']

        const fillBase = (context: CanvasRenderingContext2D, size: number) => {
            const g = context.createLinearGradient(0, 0, size, size)
            g.addColorStop(0, '#3826E6')
            g.addColorStop(0.5, '#402AFF')
            g.addColorStop(1, '#4E3BFF')
            context.fillStyle = g
            context.fillRect(0, 0, size, size)
        }

        const drawStrand = (
            context: CanvasRenderingContext2D,
            size: number,
            opMin: number,
            opMax: number,
            wMin: number,
            wMax: number,
            cols: string[],
            blur: number,
        ) => {
            const x1 = rnd(-size * 0.3, size * 1.3)
            const y1 = rnd(-size * 0.3, size * 1.3)
            const len = size * 2.4
            context.save()
            context.globalAlpha = rnd(opMin, opMax)
            if (blur) context.filter = `blur(${blur}px)`
            context.strokeStyle = cols[(Math.random() * cols.length) | 0]
            context.lineWidth = rnd(wMin, wMax)
            context.lineCap = 'round'
            context.beginPath()
            context.moveTo(x1, y1)
            context.lineTo(x1 - Math.cos(ang) * len, y1 - Math.sin(ang) * len)
            context.stroke()
            context.restore()
        }

        // Soft sheen: blur is cheap at this size, then scaled onto the texture.
        const softSize = 192
        const soft = document.createElement('canvas')
        soft.width = soft.height = softSize
        const sctx = soft.getContext('2d')!
        fillBase(sctx, softSize)
        for (let i = 0; i < 16; i++) drawStrand(sctx, softSize, 0.08, 0.16, 4, 10, light, 3)
        for (let i = 0; i < 10; i++) drawStrand(sctx, softSize, 0.08, 0.16, 4, 10, dark, 3)
        ctx.drawImage(soft, 0, 0, S, S)

        // Crisp threads at texture resolution, with no filter.
        for (let i = 0; i < 140; i++) drawStrand(ctx, S, 0.06, 0.16, 1, 2.6, light, 0)
        for (let i = 0; i < 40; i++) drawStrand(ctx, S, 0.05, 0.1, 1, 2.2, dark, 0)

        const tex = new CanvasTexture(c)
        tex.colorSpace = SRGBColorSpace
        tex.wrapS = tex.wrapT = RepeatWrapping
        tex.anisotropy = 8
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
