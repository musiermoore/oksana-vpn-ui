<script setup>
import { watchEffect } from 'vue';

const props = defineProps({ title: String });
watchEffect(() => {
    document.title = props.title ? `${props.title} · OksanaVPN` : 'OksanaVPN';
});
</script>

<template></template>
