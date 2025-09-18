<template>
  <svg v-if="name === 'zoom-in'" width="16" height="16" viewBox="0 0 24 24">
    <path d="M11 11V5h2v6h6v2h-6v6h-2v-6H5v-2h6z"/>
  </svg>

  <svg v-if="name === 'zoom-out'" xmlns="http://www.w3.org/2000/svg" viewBox="-0.375 -0.375 12 12" stroke-linecap="round" stroke-linejoin="round" stroke="currentColor" id="Minus--Streamline-Mynaui" height="12" width="12">
    <path d="M2.8125 5.625h5.625" stroke-width="0.75"></path>
  </svg>

  <svg v-if="name === 'fit-view'" id="Fit-To-Screen--Streamline-Carbon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" height="12" width="12">
    <path d="m8.25 6 0.75 0 0 -3 -3 0 0 0.75 2.25 0 0 2.25z" fill="currentColor" stroke-width="0.375"></path>
    <path d="m3 9 3 0 0 -0.75 -2.25 0 0 -2.25 -0.75 0 0 3z" fill="currentColor" stroke-width="0.375"></path>
    <path d="M9.75 10.5H2.25a0.7508625 0.7508625 0 0 1 -0.75 -0.75V2.25a0.7508625 0.7508625 0 0 1 0.75 -0.75h7.5a0.7508625 0.7508625 0 0 1 0.75 0.75v7.5a0.7508625 0.7508625 0 0 1 -0.75 0.75ZM2.25 2.25v7.5h7.500450000000001L9.75 2.25Z" fill="currentColor" stroke-width="0.375"></path>
    <path id="_Transparent_Rectangle_" d="M0 0h12v12H0Z" fill="none" stroke-width="0.375"></path>
  </svg>

  <svg  v-if="name === 'lock'" id="Locked--Streamline-Carbon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" height="12" width="12">
    <defs></defs>
    <title>locked</title>
    <path d="M9 5.25h-0.75V3a2.25 2.25 0 0 0 -4.5 0v2.25H3a0.75 0.75 0 0 0 -0.75 0.75v4.5a0.75 0.75 0 0 0 0.75 0.75h6a0.75 0.75 0 0 0 0.75 -0.75V6a0.75 0.75 0 0 0 -0.75 -0.75ZM4.5 3a1.5 1.5 0 0 1 3 0v2.25h-3Zm4.5 7.5H3V6h6Z" fill="currentColor" stroke-width="0.375"></path>
    <path id="_Transparent_Rectangle_" d="M0 0h12v12H0Z" fill="none" stroke-width="0.375"></path>
  </svg>

  <svg v-if="name === 'unlock'"  id="Unlocked--Streamline-Carbon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" height="12" width="12">
    <path d="M9 5.25H4.5V3a1.5 1.5 0 0 1 3 0h0.75a2.25 2.25 0 0 0 -4.5 0v2.25H3a0.75 0.75 0 0 0 -0.75 0.75v4.5a0.75 0.75 0 0 0 0.75 0.75h6a0.75 0.75 0 0 0 0.75 -0.75V6a0.75 0.75 0 0 0 -0.75 -0.75Zm0 5.25H3V6h6Z" fill="currentColor" stroke-width="0.375"></path>
    <path id="_Transparent_Rectangle_" d="M0 0h12v12H0Z" fill="none" stroke-width="0.375"></path>
  </svg>

  <svg v-if="name === 'reset'" id="Reset--Streamline-Carbon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" height="12" width="12">
    <path d="M6.75 10.5A4.5 4.5 0 1 0 2.25 6v2.325l-1.35 -1.35L0.375 7.5l2.25 2.25 2.25 -2.25 -0.5249999999999999 -0.5249999999999999L3 8.325V6a3.75 3.75 0 1 1 3.75 3.75Z" fill="currentColor" stroke-width="0.375"></path>
    <path id="_Transparent_Rectangle_" d="M0 0h12v12H0Z" fill="none" stroke-width="0.375"></path>
  </svg>

  <svg v-if="name === 'undo'" id="Undo--Streamline-Carbon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" height="12" width="12">
    <path d="M7.5 3.75H2.9305874999999997l1.345275 -1.3447125L3.75 1.875l-2.25 2.25 2.25 2.25 0.5258625 -0.530475L2.9317124999999997 4.5H7.5a2.25 2.25 0 0 1 0 4.5h-3v0.75h3a3 3 0 0 0 0 -6Z" fill="currentColor" stroke-width="0.375"></path>
    <path id="_Transparent_Rectangle_" d="M0 0h12v12H0Z" fill="none" stroke-width="0.375"></path>
  </svg>

  <svg v-if="name === 'redo'" id="Redo--Streamline-Carbon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" height="12" width="12">
    <path d="M4.5 3.75h4.5694125l-1.345275 -1.3447125L8.25 1.875l2.25 2.25 -2.25 2.25 -0.5258625 -0.530475L9.0682875 4.5H4.5a2.25 2.25 0 0 0 0 4.5h3v0.75h-3a3 3 0 0 1 0 -6Z" fill="currentColor" stroke-width="0.375"></path>
    <path id="_Transparent_Rectangle_" d="M0 0h12v12H0Z" fill="none" stroke-width="0.375"></path>
  </svg>

  <svg v-if="name === 'update'" id="Shuffle--Streamline-Carbon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" height="12" width="12">
    <path d="M8.47125 7.2787500000000005 9.81375 8.625h-2.4825l-1.63875 -2.625 1.63875 -2.625h2.4825l-1.3425 1.34625L9 5.25l2.25 -2.25 -2.25 -2.25 -0.5287499999999999 0.5287499999999999L9.81375 2.625h-2.4825a0.75 0.75 0 0 0 -0.63375 0.3525L5.25 5.29125l-1.4475 -2.3137499999999998A0.75 0.75 0 0 0 3.1687499999999997 2.625H0.75v0.75h2.41875l1.63875 2.625 -1.63875 2.625H0.75v0.75h2.41875a0.75 0.75 0 0 0 0.63375 -0.3525L5.25 6.70875l1.4475 2.3137499999999998a0.75 0.75 0 0 0 0.63375 0.3525h2.4825l-1.3425 1.34625L9 11.25l2.25 -2.25 -2.25 -2.25Z" fill="currentColor" stroke-width="0.375"></path>
    <path id="_Transparent_Rectangle_" d="M0 0h12v12H0Z" fill="none" stroke-width="0.375"></path>
  </svg>

  <svg v-if="name === 'plus'" xmlns="http://www.w3.org/2000/svg" viewBox="-0.5 -0.5 12 12" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" id="Layout-Grid-Add--Streamline-Tabler" height="12" width="12">
    <path d="M1.8333333333333333 2.2916666666666665a0.4583333333333333 0.4583333333333333 0 0 1 0.4583333333333333 -0.4583333333333333h1.8333333333333333a0.4583333333333333 0.4583333333333333 0 0 1 0.4583333333333333 0.4583333333333333v1.8333333333333333a0.4583333333333333 0.4583333333333333 0 0 1 -0.4583333333333333 0.4583333333333333H2.2916666666666665a0.4583333333333333 0.4583333333333333 0 0 1 -0.4583333333333333 -0.4583333333333333z" stroke-width="1"></path>
    <path d="M6.416666666666666 2.2916666666666665a0.4583333333333333 0.4583333333333333 0 0 1 0.4583333333333333 -0.4583333333333333h1.8333333333333333a0.4583333333333333 0.4583333333333333 0 0 1 0.4583333333333333 0.4583333333333333v1.8333333333333333a0.4583333333333333 0.4583333333333333 0 0 1 -0.4583333333333333 0.4583333333333333h-1.8333333333333333a0.4583333333333333 0.4583333333333333 0 0 1 -0.4583333333333333 -0.4583333333333333z" stroke-width="1"></path>
    <path d="M1.8333333333333333 6.875a0.4583333333333333 0.4583333333333333 0 0 1 0.4583333333333333 -0.4583333333333333h1.8333333333333333a0.4583333333333333 0.4583333333333333 0 0 1 0.4583333333333333 0.4583333333333333v1.8333333333333333a0.4583333333333333 0.4583333333333333 0 0 1 -0.4583333333333333 0.4583333333333333H2.2916666666666665a0.4583333333333333 0.4583333333333333 0 0 1 -0.4583333333333333 -0.4583333333333333z" stroke-width="1"></path>
    <path d="M6.416666666666666 7.791666666666666h2.75m-1.375 -1.375v2.75" stroke-width="1"></path>
  </svg>

  <svg v-if="name === 'cogs'" id="Settings--Streamline-Carbon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" height="12" width="12">
    <path d="m10.125 6.285 0 -0.28500000000000003 0 -0.28875 0.72 -0.63A0.75 0.75 0 0 0 10.9875 4.125l-0.885 -1.5a0.75 0.75 0 0 0 -0.6487499999999999 -0.375 0.75 0.75 0 0 0 -0.24 0.037500000000000006l-0.9112500000000001 0.3075a4.25625 4.25625 0 0 0 -0.49125 -0.28125l-0.19125 -0.9450000000000001a0.75 0.75 0 0 0 -0.75 -0.60375h-1.755a0.75 0.75 0 0 0 -0.75 0.60375l-0.19125 0.9450000000000001a4.305 4.305 0 0 0 -0.495 0.28125l-0.8925 -0.3225A0.75 0.75 0 0 0 2.54625 2.25a0.75 0.75 0 0 0 -0.6487499999999999 0.375L1.0125000000000002 4.125a0.75 0.75 0 0 0 0.15375 0.9412499999999999L1.875 5.715 1.875 6l0 0.28875 -0.70875 0.63A0.75 0.75 0 0 0 1.0125000000000002 7.875l0.885 1.5a0.75 0.75 0 0 0 0.6487499999999999 0.375 0.75 0.75 0 0 0 0.24 -0.037500000000000006l0.9112500000000001 -0.3075a4.25625 4.25625 0 0 0 0.49125 0.28125l0.19125 0.9450000000000001a0.75 0.75 0 0 0 0.75 0.60375h1.77a0.75 0.75 0 0 0 0.75 -0.60375l0.19125 -0.9450000000000001a4.305 4.305 0 0 0 0.495 -0.28125l0.9075 0.3075a0.75 0.75 0 0 0 0.24 0.037500000000000006 0.75 0.75 0 0 0 0.6487499999999999 -0.375l0.855 -1.5a0.75 0.75 0 0 0 -0.15375 -0.9412499999999999ZM9.45375 9l-1.2862500000000001 -0.43499999999999994a3.3225 3.3225 0 0 1 -1.0162499999999999 0.58875L6.885 10.5h-1.77l-0.26625 -1.3312499999999998a3.51 3.51 0 0 1 -1.0125000000000002 -0.58875L2.54625 9l-0.885 -1.5 1.02 -0.8999999999999999a3.3375000000000004 3.3375000000000004 0 0 1 0 -1.17375L1.66125 4.5l0.885 -1.5 1.2862500000000001 0.43499999999999994a3.3225 3.3225 0 0 1 1.0162499999999999 -0.58875L5.115 1.5h1.77l0.26625 1.3312499999999998a3.51 3.51 0 0 1 1.0125000000000002 0.58875L9.45375 3l0.885 1.5 -1.02 0.8999999999999999a3.3375000000000004 3.3375000000000004 0 0 1 0 1.17375L10.338750000000001 7.5Z" fill="currentColor" stroke-width="0.375"></path>
    <path d="M6 8.25a2.25 2.25 0 1 1 2.25 -2.25 2.2275 2.2275 0 0 1 -2.25 2.25Zm0 -3.75a1.46625 1.46625 0 0 0 -1.5 1.5 1.46625 1.46625 0 0 0 1.5 1.5 1.46625 1.46625 0 0 0 1.5 -1.5 1.46625 1.46625 0 0 0 -1.5 -1.5Z" fill="currentColor" stroke-width="0.375"></path>
    <path id="_Transparent_Rectangle_" d="M0 0h12v12H0Z" fill="none" stroke-width="0.375"></path>
  </svg>

  <svg v-if="name === 'vertical'" id="Pan-Vertical--Streamline-Carbon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" height="12" width="12">
    <path d="m3.75 3 0.53025 0.53025L5.625 2.1855l0 7.6290000000000004 -1.34475 -1.34475L3.75 9l2.25 2.25 2.25 -2.25 -0.53025 -0.53025L6.375 9.8145l0 -7.6290000000000004 1.34475 1.34475L8.25 3l-2.25 -2.25 -2.25 2.25z" fill="currentColor" stroke-width="0.375"></path>
    <path id="_Transparent_Rectangle_" d="M0 0h12v12H0Z" fill="none" stroke-width="0.375"></path>
  </svg>

  <svg  v-if="name === 'horizontal'" id="Pan-Horizontal--Streamline-Carbon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" height="12" width="12">
    <defs></defs>
    <path d="m9 3.75 -0.53025 0.53025L9.8145 5.625 2.1855 5.625l1.34475 -1.34475L3 3.75l-2.25 2.25 2.25 2.25 0.53025 -0.53025L2.1855 6.375l7.6290000000000004 0 -1.34475 1.34475L9 8.25l2.25 -2.25 -2.25 -2.25z" fill="currentColor" stroke-width="0.375"></path>
    <path id="_Transparent_Rectangle_" d="M0 0h12v12H0Z" fill="none" stroke-width="0.375"></path>
  </svg>

  <svg v-if="name === 'question'" id="Help--Streamline-Carbon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" height="12" width="12">
    <path d="M6 1.5A4.5 4.5 0 1 1 1.5 6 4.505 4.505 0 0 1 6 1.5ZM6 0.75a5.25 5.25 0 1 0 5.25 5.25A5.25 5.25 0 0 0 6 0.75Z" fill="currentColor"></path>
    <path d="M6 9.75a0.75 0.75 0 1 1 0.75 -0.75 0.75 0.75 0 0 1 -0.75 0.75Z" fill="currentColor"></path>
    <path d="M6 8.25a0.375 0.375 0 0 1 -0.375 -0.375V7.5a1.125 1.125 0 0 1 1.125 -1.125 0.75 0.75 0 0 0 0 -1.5 0.75 0.75 0 0 0 -0.75 0.75 0.375 0.375 0 0 1 -0.75 0 1.5 1.5 0 0 1 3 0 1.485 1.485 0 0 1 -0.375 0.9825A1.875 1.875 0 0 1 6.375 7.875v0.375A0.375 0.375 0 0 1 6 8.25Z" fill="currentColor"></path>
    <path id="_Transparent_Rectangle_" d="M0 0h12v12H0Z" fill="none"></path>
  </svg>
</template>

<script setup lang="ts">
defineProps({
  name: {
    type: String,
    required: true,
  },
})
</script>
