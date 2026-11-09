<script setup>
import { useLayout } from '@/layout/composables/layout';
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const { layoutState, isDesktop } = useLayout();
const route = useRoute();
const router = useRouter();

const props = defineProps({
    item: {
        type: Object,
        default: () => ({})
    },
    root: {
        type: Boolean,
        default: true
    },
    parentKey: {
        type: String,
        default: null
    }
});

// La expansion representa la rama del menu, no una URL de la aplicacion.
// Los agrupadores movidos pueden no tener path y las rutas hijas no necesitan
// compartir el prefijo del padre.
const branchKey = computed(() => {
    const identidad = props.item.id_menu ?? props.item.path ?? props.item.to ?? props.item.label;
    return `${props.parentKey || 'menu'}/${encodeURIComponent(String(identidad || 'opcion'))}`;
});

const handlePathMatches = (current, target) => !!target && (current === target || (target !== '/' && current?.startsWith(`${target}/`)));
const handleContainsRoute = (item) => {
    if (item.visible === false) return false;
    if (item.to && handlePathMatches(route.path, router.resolve(item.to).path)) return true;
    return (item.items || []).some(handleContainsRoute);
};

const isActive = computed(() => {
    // Keep the current page's branch visible even while another branch is explored.
    if (handleContainsRoute(props.item)) return true;
    return !!props.item.items && handlePathMatches(layoutState.activePath, branchKey.value);
});

const itemClick = (event, item) => {
    if (item.disabled) {
        event.preventDefault();
        return;
    }

    if (item.command) {
        item.command({ originalEvent: event, item: item });
    }

    if (item.items) {
        if (isActive.value) {
            layoutState.activePath = props.parentKey || null;
        } else {
            layoutState.activePath = branchKey.value;
            layoutState.menuHoverActive = true;
        }
    } else {
        layoutState.overlayMenuActive = false;
        layoutState.mobileMenuActive = false;
        layoutState.menuHoverActive = false;
    }
};

const onMouseEnter = () => {
    if (isDesktop() && props.root && props.item.items && layoutState.menuHoverActive) {
        layoutState.activePath = branchKey.value;
    }
};
</script>

<template>
    <li :class="{ 'layout-root-menuitem': root, 'active-menuitem': isActive }">
        <div v-if="root && item.visible !== false" class="layout-menuitem-root-text">{{ item.label }}</div>
        <a v-if="(!item.to || item.items) && item.visible !== false" :href="item.url" @click="itemClick($event, item)" :class="item.class" :target="item.target" tabindex="0" @mouseenter="onMouseEnter">
            <font-icon :icon="item.icon" class="layout-menuitem-icon" />
            <span class="layout-menuitem-text">{{ item.label }}</span>
            <i class="pi pi-fw pi-angle-down layout-submenu-toggler" v-if="item.items" />
        </a>
        <router-link v-if="item.to && !item.items && item.visible !== false" @click="itemClick($event, item)" exactActiveClass="active-route" :class="item.class" tabindex="0" :to="item.to" @mouseenter="onMouseEnter">
            <font-icon :icon="item.icon" class="layout-menuitem-icon" />
            <span class="layout-menuitem-text">{{ item.label }}</span>
            <i class="pi pi-fw pi-angle-down layout-submenu-toggler" v-if="item.items" />
        </router-link>
        <Transition v-if="item.items && item.visible !== false" name="layout-submenu">
            <ul v-show="root ? true : isActive" class="layout-submenu">
                <app-menu-item v-for="child in item.items" :key="child.id_menu || child.to || child.path || child.label" :item="child" :root="false" :parentKey="branchKey" />
            </ul>
        </Transition>
    </li>
</template>

<style scoped>
.icon-cyan .layout-menuitem-icon {
    color: var(--p-primary-color) !important;
}
</style>
