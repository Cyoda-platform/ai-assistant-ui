import { useBreakpoints } from '@vueuse/core'

const helperBreakpoints = useBreakpoints({
    xs: 480,
    sm: 768,
    md: 992,
    lg: 1200,
    xl: 1920,
})

export default helperBreakpoints;