"use client"

import { AspectRatio } from "@/components/ui/aspect-ratio"
import { useRef } from "react"
import NextImage from "next/image"
import { Rnd } from "react-rnd"
import HandleComponent from "@/components/HandleComponent"

const DesignConfigurator = () => {

    const containerRef = useRef<HTMLDivElement>(null)
    return (
        <div className='relative mt-20 grid grid-cols-1 lg:grid-cols-3 mb-20 pb-20'>
            <div ref={containerRef} className='relative h-[37.5rem] bg-gray-100 overflow-hidden col-span-2 w-full max-w-4xl flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-12 text-center focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'>
                <div className='relative w-[34rem] bg-opacity-50 pointer-events-none aspect-[7234/7638]'>

                    <AspectRatio ref={containerRef} ratio={7234 / 7638} className='pointer-events-none relative z-50 aspect-[7234/7638] w-full'>
                        <NextImage src="/t-shirt.png" alt="Image" className="pointer-events-none z-50 select-none h-full" fill />
                    </AspectRatio>
                </div>
                <Rnd default={
                    {
                        x: 150,
                        y: 205,
                        width: 105,
                        height: 105,
                    }
                }
                    onResizeStop={(_, __, ref, ___, { x, y }) => {
                        // setRenderedDimensions({
                        //     width: parseInt(ref.style.width.slice(0, -2)),
                        //     height: parseInt(ref.style.height.slice(0, -2)),
                        // })

                        // setRenderedPosition({ x, y })
                    }}

                    onDragStop={(_, data) => {
                        const { x, y } = data
                        // setRenderedPosition({ x, y })
                    }}
                    className='absolute z-20 border-[1px] border-dashed border-primary'
                    lockAspectRatio
                    resizeHandleComponent={{
                        bottomLeft: <HandleComponent />,
                        bottomRight: <HandleComponent />,
                        topLeft: <HandleComponent />,
                        topRight: <HandleComponent />
                    }}
                >
                    
                </Rnd>
            </div>
        </div>
    )
}

export default DesignConfigurator