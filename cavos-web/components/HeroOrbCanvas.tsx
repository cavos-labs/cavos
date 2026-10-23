'use client'

import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { MeshDistortMaterial, Sphere, Environment, Lightformer } from '@react-three/drei'
import { useEffect, useMemo, useRef } from 'react'
import { ACESFilmicToneMapping, CanvasTexture, SRGBColorSpace, RepeatWrapping, type Group, type Mesh, type Texture } from 'three'

const MOBILE_FPS = 24
const DESKTOP_FPS = 30

/**
 * Same silk field as the OG card / X banner. Built once on the client on a
 * modest canvas — large enough to read as brushed indigo, small enough that
 * the WebGL upload does not stall first paint.
 */
function useSilkTexture(): Texture | null {
    return useMemo(() => {
        if (typeof document === 'undefined') return null
        const S = 768
        const c = document.createElement('canvas')
        c.width = c.height = S
        const ctx = c.getContext('2d')!

        let seed = 0xc0ffee
        const rnd = (a: number, b: number) => {
            seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
            return a + (seed / 0x1_0000_0000) * (b - a)
        }
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
            context.strokeStyle = cols[(rnd(0, cols.length)) | 0]
            context.lineWidth = rnd(wMin, wMax)
            context.lineCap = 'round'
            context.beginPath()
            context.moveTo(x1, y1)
            context.lineTo(x1 - Math.cos(ang) * len, y1 - Math.sin(ang) * len)
            context.stroke()
            context.restore()
        }

        const softSize = 192
        const soft = document.createElement('canvas')
        soft.width = soft.height = softSize
        const sctx = soft.getContext('2d')!
        fillBase(sctx, softSize)
        for (let i = 0; i < 16; i++) drawStrand(sctx, softSize, 0.08, 0.16, 4, 10, light, 3)
        for (let i = 0; i < 10; i++) drawStrand(sctx, softSize, 0.08, 0.16, 4, 10, dark, 3)
        ctx.drawImage(soft, 0, 0, S, S)

        for (let i = 0; i < 140; i++) drawStrand(ctx, S, 0.06, 0.16, 1, 2.6, light, 0)
        for (let i = 0; i < 40; i++) drawStrand(ctx, S, 0.05, 0.1, 1, 2.2, dark, 0)

        const tex = new CanvasTexture(c)
        tex.colorSpace = SRGBColorSpace
        tex.wrapS = tex.wrapT = RepeatWrapping
        tex.anisotropy = 4
        return tex
    }, [])
}

function Orb({ animate, mobile }: { animate: boolean; mobile: boolean }) {
    const mesh = useRef<Mesh>(null)
    const group = useRef<Group>(null)
    const silk = useSilkTexture()
    const acc = useRef(0)

    const pos: [number, number, number] = mobile ? [1.3, 2.9, 0] : [4.5, 0.1, 0]
    const scale = mobile ? 1.15 : 2.2
    const baseY = pos[1]
    const interval = 1 / (mobile ? MOBILE_FPS : DESKTOP_FPS)
    // Distorted silk reads the same well below 256 segments; the extra
    // tessellation only fed the render loop.
    const segments = mobile ? 64 : 96

    useFrame((state, delta) => {
        if (!animate) return
        acc.current += delta
        if (acc.current < interval) return
        acc.current %= interval
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
            <Sphere ref={mesh} args={[1.5, segments, segments]}>
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

function FrameGate({ playing, fps }: { playing: boolean; fps: number }) {
    const invalidate = useThree((state) => state.invalidate)
    useEffect(() => {
        if (!playing) return
        let raf = 0
        let last = 0
        const interval = 1000 / fps
        const tick = (now: number) => {
            if (now - last >= interval) {
                invalidate()
                last = now
            }
            raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(raf)
    }, [playing, fps, invalidate])
    return null
}

export function HeroOrbCanvas({
    playing,
    mobile,
    onReady,
}: {
    playing: boolean
    mobile: boolean
    onReady?: () => void
}) {
    return (
        <Canvas
            className="!absolute inset-0"
            camera={{ position: [0, 0, 4.2], fov: 45 }}
            dpr={mobile ? 1 : [1, 1.25]}
            frameloop="demand"
            gl={{
                antialias: !mobile,
                alpha: true,
                toneMapping: ACESFilmicToneMapping,
                toneMappingExposure: 1.05,
                powerPreference: 'low-power',
            }}
            onCreated={() => onReady?.()}
        >
            <FrameGate playing={playing} fps={mobile ? MOBILE_FPS : DESKTOP_FPS} />
            <ambientLight intensity={1.6} />
            <directionalLight position={[1, 1, 5]} intensity={0.7} color="#ffffff" />
            <Environment resolution={128}>
                <Lightformer intensity={1} position={[0, 0, 4]} scale={[14, 14, 1]} color="#6655ff" />
            </Environment>
            <Orb animate={playing} mobile={mobile} />
        </Canvas>
    )
}
