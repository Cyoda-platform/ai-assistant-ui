import { useState, useEffect } from 'react';

// Breakpoint definitions
const breakpoints = {
    xs: 480,
    sm: 768,
    md: 992,
    lg: 1200,
    xl: 1920,
};

// React hook for breakpoints
export function useBreakpoints() {
    const [windowWidth, setWindowWidth] = useState(
        typeof window !== 'undefined' ? window.innerWidth : 0
    );

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleResize = () => {
            setWindowWidth(window.innerWidth);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isXs = windowWidth < breakpoints.sm;
    const isSm = windowWidth >= breakpoints.sm && windowWidth < breakpoints.md;
    const isMd = windowWidth >= breakpoints.md && windowWidth < breakpoints.lg;
    const isLg = windowWidth >= breakpoints.lg && windowWidth < breakpoints.xl;
    const isXl = windowWidth >= breakpoints.xl;

    const isSmaller = (breakpoint: keyof typeof breakpoints) => {
        return windowWidth < breakpoints[breakpoint];
    };

    const isGreater = (breakpoint: keyof typeof breakpoints) => {
        return windowWidth >= breakpoints[breakpoint];
    };

    return {
        xs: isXs,
        sm: isSm,
        md: isMd,
        lg: isLg,
        xl: isXl,
        isSmaller,
        isGreater,
        current: windowWidth,
        breakpoints
    };
}

// For backward compatibility, export a default object with breakpoint values
const helperBreakpoints = {
    breakpoints,
    useBreakpoints
};

export default helperBreakpoints;
