<script setup>
import { watchEffect } from 'vue';

const props = defineProps({ title: String });
watchEffect(() => {
    document.title = props.title ? `${props.title} · Oksana VPN` : 'Oksana VPN';
});
</script>

<template></template>
