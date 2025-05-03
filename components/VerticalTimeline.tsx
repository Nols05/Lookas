"use client"

import { useEffect, useState, useCallback } from "react"

export default function VerticalTimeline() {
    const [scrollProgress, setScrollProgress] = useState(0)
    const [windowHeight, setWindowHeight] = useState(0)

    // Debounced scroll handler using requestAnimationFrame
    const handleScroll = useCallback(() => {
        let animationFrameId: number | null = null;

        const updateScroll = () => {
            const totalHeight = document.documentElement.scrollHeight - window.innerHeight
            const progress = (window.scrollY / totalHeight) * 100
            setScrollProgress(Math.min(progress, 100))
            animationFrameId = null
        }

        return () => {
            if (!animationFrameId) {
                animationFrameId = requestAnimationFrame(updateScroll)
            }
        }
    }, [])

    useEffect(() => {
        // Set initial window height
        setWindowHeight(window.innerHeight)

        const scrollListener = handleScroll()

        const handleResize = () => {
            setWindowHeight(window.innerHeight)
        }

        // Add event listeners
        window.addEventListener("scroll", scrollListener)
        window.addEventListener("resize", handleResize)

        // Initial calculation
        scrollListener()

        return () => {
            window.removeEventListener("scroll", scrollListener)
            window.removeEventListener("resize", handleResize)
        }
    }, [handleScroll])

    // Calculate the circle's position
    const circlePosition = windowHeight ? 120 + (scrollProgress * (windowHeight - 120) / 100) : 120

    return (
        <div className="fixed left-[30px] md:left-[60px] top-0 h-full z-10 flex justify-center items-start pointer-events-none">
            <div className="relative h-full w-[1px] bg-gray-200">
                {/* Progress line */}
                <div
                    className="absolute top-[120px] left-0 w-[1px] bg-black origin-top transition-all duration-300 ease-out"
                    style={{
                        height: `${circlePosition - 120}px`,
                    }}
                ></div>

                {/* Moving circle */}
                <div
                    className="absolute left-1/2 transform -translate-x-1/2 w-3 h-3 rounded-full bg-black transition-all duration-300 ease-out"
                    style={{
                        top: `${circlePosition}px`,
                    }}
                ></div>
            </div>
        </div>
    )
}
