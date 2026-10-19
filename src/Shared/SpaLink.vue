<script setup>
import { navigate } from '../lib/navigation';

const props = defineProps({
    href: { type: String, required: true },
});

const follow = (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
    }

    const anchor = event.currentTarget;
    if (anchor.target && anchor.target !== '_self') {
        return;
    }

    const target = new URL(props.href, window.location.href);
    if (target.origin !== window.location.origin) {
        return;
    }

    event.preventDefault();
    navigate(target.href);
};
</script>

<template>
    <a :href="href" @click="follow"><slot /></a>
</template>
