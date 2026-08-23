<script setup>
import FloatingConfigurator from '@/components/FloatingConfigurator.vue';
</script>

<template>
    <FloatingConfigurator />

    <main class="not-found-page">
        <div class="not-found-card">
            <div class="icon-wrapper">
                <font-icon icon="fa-solid fa-compass" />
            </div>

            <span class="error-code">ERROR 404</span>

            <h1>Página no encontrada</h1>

            <p class="description">La página que estás buscando no existe, fue movida o ya no se encuentra disponible.</p>

            <div class="actions">
                <Button as="router-link" to="/principal" class="home-button">
                    <font-icon icon="fa-solid fa-house" />
                    <span>Volver al inicio</span>
                </Button>

                <button type="button" class="back-button" @click="$router.back()">
                    <font-icon icon="fa-solid fa-arrow-left" />
                    <span>Regresar</span>
                </button>
            </div>

            <div class="help-text">
                <!-- <font-icon icon="fa-regular fa-circle-question" /> -->
                <span>Verifica la dirección o regresa al menú principal.</span>
            </div>
        </div>

        <div class="background-number">404</div>
    </main>
</template>

<style lang="scss" scoped>
.not-found-page {
    position: relative;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    overflow: hidden;
    background:
        radial-gradient(circle at 20% 20%, color-mix(in srgb, var(--primary-color), transparent 88%), transparent 32%), radial-gradient(circle at 80% 75%, color-mix(in srgb, var(--primary-color), transparent 92%), transparent 30%),
        var(--surface-ground);
}

.not-found-card {
    position: relative;
    z-index: 2;
    width: min(100%, 620px);
    padding: 3.5rem 3rem;
    text-align: center;
    border: 1px solid var(--surface-border);
    border-radius: 28px;
    background: color-mix(in srgb, var(--surface-card), transparent 4%);
    box-shadow: 0 24px 70px rgba(0, 0, 0, 0.08);
    backdrop-filter: blur(12px);
}

.icon-wrapper {
    width: 92px;
    height: 92px;
    margin: 0 auto 1.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 24px;
    color: var(--primary-color);
    background: color-mix(in srgb, var(--primary-color), transparent 88%);
    font-size: 2.6rem;
    transform: rotate(-5deg);
}

.error-code {
    display: inline-block;
    margin-bottom: 0.8rem;
    color: var(--primary-color);
    font-size: 0.8rem;
    font-weight: 800;
    letter-spacing: 0.18em;
}

h1 {
    margin: 0;
    color: var(--text-color);
    font-size: clamp(2rem, 5vw, 3.6rem);
    font-weight: 800;
    line-height: 1.05;
}

.description {
    max-width: 480px;
    margin: 1.25rem auto 2rem;
    color: var(--text-color-secondary);
    font-size: 1.05rem;
    line-height: 1.7;
}

.actions {
    display: flex;
    justify-content: center;
    gap: 0.8rem;
    flex-wrap: wrap;
}

.home-button,
.back-button {
    min-height: 46px;
    padding: 0.8rem 1.3rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.65rem;
    border-radius: 12px;
    font-weight: 600;
    text-decoration: none;
    cursor: pointer;
}

.back-button {
    border: 1px solid var(--surface-border);
    color: var(--text-color);
    background: var(--surface-card);
    transition: 0.2s ease;
}

.back-button:hover {
    border-color: var(--primary-color);
    color: var(--primary-color);
    transform: translateY(-1px);
}

.help-text {
    margin-top: 2rem;
    padding-top: 1.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    border-top: 1px solid var(--surface-border);
    color: var(--text-color-secondary);
    font-size: 0.9rem;
}

.background-number {
    position: absolute;
    z-index: 0;
    left: 50%;
    bottom: -7vw;
    transform: translateX(-50%);
    color: color-mix(in srgb, var(--text-color), transparent 96%);
    font-size: clamp(12rem, 32vw, 34rem);
    font-weight: 900;
    line-height: 0.8;
    user-select: none;
    pointer-events: none;
}

@media (max-width: 640px) {
    .not-found-page {
        padding: 1rem;
    }

    .not-found-card {
        padding: 2.5rem 1.4rem;
        border-radius: 22px;
    }

    .icon-wrapper {
        width: 76px;
        height: 76px;
        font-size: 2rem;
    }

    .actions {
        flex-direction: column;
    }

    .home-button,
    .back-button {
        width: 100%;
    }
}
</style>
