import { useEffect, useRef, useState } from "react"



export const useIntersectionObserver = (options?: IntersectionObserverInit) => {
  
    const [isInter, setInter] = useState(false);
    const targetRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const obeserver = new IntersectionObserver(([entry]) =>{
            setInter(entry.isIntersecting);
        }, options)

        if (targetRef.current) {
             obeserver.observe(targetRef.current)
        }

        return () => obeserver.disconnect()

    },[options])

    return {targetRef, isInter}
}
