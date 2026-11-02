import { onMounted, onBeforeUnmount } from 'vue';

export default () => {
    const metas = [];
    onMounted(() => {
        for (const [name, content] of [['robots', 'noindex, nofollow'], ['referrer', 'no-referrer']]) {
            const previous = document.querySelector(`meta[name="${name}"]`);
            const element = previous || document.createElement('meta');
            metas.push({ element, previous: previous?.getAttribute('content'), existed: Boolean(previous) });
            element.setAttribute('name', name); element.setAttribute('content', content);
            if (!previous) document.head.appendChild(element);
        }
    });
    onBeforeUnmount(() => {
        for (const meta of metas) {
            if (meta.existed) meta.element.setAttribute('content', meta.previous || '');
            else meta.element.remove();
        }
    });
    return {};
};
