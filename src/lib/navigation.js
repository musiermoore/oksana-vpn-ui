import { shallowRef } from 'vue';

const snapshot = () => ({
    pathname: window.location.pathname.replace(/\/+$/, '') || '/',
    search: window.location.search,
});

export const currentRoute = shallowRef(snapshot());

export const syncRoute = () => {
    currentRoute.value = snapshot();
};

window.addEventListener('popstate', syncRoute);

export const navigate = (href, { replace = false } = {}) => {
    const target = new URL(href, window.location.href);

    if (target.origin !== window.location.origin) {
        window.location.assign(target.href);
        return;
    }

    window.history[replace ? 'replaceState' : 'pushState']({}, '', target.href);
    syncRoute();
    window.scrollTo(0, 0);
};
