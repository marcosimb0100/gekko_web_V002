<template>
    <main class="archivos-acceso">
        <div class="archivos-marca"><i class="pi pi-cloud" aria-hidden="true" /><span>GEKKO <strong>SYNC</strong></span></div>
        <section class="archivos-presentacion"><span class="archivos-eyebrow">TU ESPACIO DE ARCHIVOS</span><h1>Todo en su lugar.<br />Siempre a tu alcance.</h1><p>Consulta tus documentos y trabaja con las carpetas que tu equipo comparte contigo.</p><div><i class="pi pi-folder-open" /> Carpetas compartidas <span>·</span> <i class="pi pi-shield" /> Acceso privado</div></section>
        <section class="archivos-acceso-tarjeta" aria-labelledby="archivos-titulo">
            <div class="archivos-tarjeta-linea" />
            <img src="@/assets/images/logo_empresa_cliente.png" alt="Gekko" class="archivos-logo" />
            <p class="archivos-tarjeta-subtitulo">GEKKO ARCHIVOS</p>
            <h2 id="archivos-titulo">{{ paso === 1 ? 'Iniciar sesión' : 'Bienvenido de nuevo' }}</h2>
            <p class="archivos-indicacion">{{ paso === 1 ? 'Ingresa con tu cuenta de Gekko.' : correo }}</p>
            <Message v-if="mensaje" severity="error" :closable="false" role="alert">{{ mensaje }}</Message>
            <form @submit.prevent="continuar" class="archivos-formulario">
                <template v-if="paso === 1"><label for="archivos-correo">Correo electrónico</label><InputText id="archivos-correo" v-model="correo" type="email" autocomplete="username" placeholder="tu@empresa.com" required autofocus :disabled="entrando" /></template>
                <template v-else><label for="archivos-clave">Contraseña</label><Password ref="claveInput" v-model="clave" inputId="archivos-clave" autocomplete="current-password" :feedback="false" toggleMask :inputProps="{ required: true }" :disabled="entrando" fluid /><Button type="button" label="Usar otra cuenta" text size="small" :disabled="entrando" @click="paso = 1; clave = ''; mensaje = ''" /></template>
                <Button type="submit" :label="paso === 1 ? 'Continuar' : 'Entrar a mis archivos'" icon="pi pi-arrow-right" iconPos="right" :loading="entrando" :disabled="entrando || !correo.trim() || (paso === 2 && !clave)" class="archivos-entrar" />
            </form>
            <router-link v-if="sesionExistente && !route.query.motivo" :to="{ name: 'archivos_portal', query: consultaCarpeta(route.query) }" class="archivos-continuar">Continuar con mi sesión actual</router-link>
            <div class="archivos-privacidad"><i class="pi pi-lock" aria-hidden="true" /><span>Solo verás los archivos a los que tienes acceso.</span></div>
        </section>
        <footer>Gekko Sync · Espacio privado de documentos</footer>
    </main>
</template>
<script setup>
import { nextTick, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useStore } from 'vuex';
import { consultaCarpeta } from '../../../helpers/archivosPortal';
const route = useRoute(), store = useStore();
const paso = ref(1), correo = ref(''), clave = ref(''), entrando = ref(false), claveInput = ref(null);
const sesionExistente = !!localStorage.getItem('token');
const mensajes = { sin_acceso: 'Tu cuenta necesita un perfil con acceso al kiosco de Nube. Solicítalo al administrador.', sesion: 'Tu sesión terminó. Inicia sesión para continuar.', conexion: 'No fue posible abrir tus archivos. Comprueba la conexión e intenta nuevamente.' };
const mensaje = ref(mensajes[route.query.motivo] || '');
watch(() => route.query.motivo, motivo => { mensaje.value = mensajes[motivo] || ''; });
const continuar = async () => {
    if (entrando.value) return;
    mensaje.value = '';
    if (paso.value === 1) {
        paso.value = 2; await nextTick();
        const input = claveInput.value?.$el?.querySelector('input'); input?.focus();
        return;
    }
    entrando.value = true;
    try {
        const respuesta = await store.dispatch('api/apiPostAcceso', { direccion: 'usuarios/acceso',
            datosJson: { correo_electronico: correo.value.trim().toLowerCase(), clave: clave.value },
            accesoArchivos: true, carpetaDestino: consultaCarpeta(route.query) });
        if (respuesta.estatus !== 200) { mensaje.value = respuesta.mensaje || 'No fue posible iniciar sesión.'; clave.value = ''; }
    } catch { mensaje.value = 'No fue posible conectar. Intenta nuevamente.'; }
    finally { entrando.value = false; clave.value = ''; }
};
</script>
<style scoped>
.archivos-acceso { min-height: 100dvh; padding: 3rem 7vw; display: grid; grid-template-columns: minmax(0, 1fr) 410px; align-items: center; gap: 6vw; position: relative; isolation: isolate; color: white; background: #10283e url('../../../assets/images/image_login.jpg') center / cover; }
.archivos-acceso::before { content: ''; position: absolute; inset: 0; z-index: -1; background: linear-gradient(90deg, rgba(5, 23, 40, .8), rgba(8, 36, 60, .22)); }
.archivos-marca { position: absolute; left: 7vw; top: 2.5rem; display: flex; gap: .8rem; align-items: center; font-size: 1.3rem; letter-spacing: .2em; }.archivos-marca i { font-size: 2rem; }.archivos-marca strong { font-weight: 300; }
.archivos-eyebrow { font-size: .75rem; letter-spacing: .22em; color: #a4dbf5; }.archivos-presentacion h1 { color: white; font-size: clamp(2.3rem, 4vw, 4.5rem); line-height: 1.12; margin: 1.4rem 0; font-weight: 500; }.archivos-presentacion p { max-width: 31rem; font-size: 1.1rem; line-height: 1.7; color: #d2dfeb; }.archivos-presentacion > div { margin-top: 2rem; display: flex; align-items: center; gap: .6rem; color: #c5d8e8; font-size: .85rem; }
.archivos-acceso-tarjeta { position: relative; color: #253746; background: white; border-radius: 1rem; box-shadow: 0 24px 80px #00132166; padding: 3rem 2.5rem 2rem; overflow: hidden; min-height: 32rem; }.archivos-tarjeta-linea { height: 4px; width: 5rem; background: #008fd3; position: absolute; top: 0; left: 2.5rem; }.archivos-logo { max-width: 150px; max-height: 50px; object-fit: contain; object-position: left; margin-bottom: 1.5rem; }.archivos-tarjeta-subtitulo { font-size: .7rem; letter-spacing: .16em; color: #568199; margin: 0 0 .75rem; }.archivos-acceso-tarjeta h2 { font-size: 1.7rem; color: #16364e; margin: 0 0 .75rem; }.archivos-indicacion { color: #6d7e8d; line-height: 1.5; overflow-wrap: anywhere; margin-bottom: 1.8rem; }
.archivos-formulario { display: flex; flex-direction: column; gap: .65rem; margin-top: 1rem; }.archivos-formulario label { font-size: .8rem; font-weight: 600; color: #41596b; }.archivos-formulario :deep(input) { background: #f8fafc; color: #253746; border: 1px solid #d6e0e7; padding: .9rem 1rem; width: 100%; }.archivos-entrar { margin-top: 1.2rem; background: #058ccb; border-color: #058ccb; color: white; padding: .9rem 1rem; }.archivos-privacidad { display: flex; gap: .6rem; align-items: center; margin-top: 2rem; padding-top: 1.25rem; border-top: 1px solid #e9eef2; color: #8393a0; font-size: .75rem; }.archivos-continuar { display: inline-block; color: #087eb4; font-size: .8rem; margin-top: 1rem; }.archivos-acceso footer { position: absolute; bottom: 1.5rem; left: 7vw; color: #aec4d6; font-size: .75rem; }
@media(max-width: 850px) { .archivos-acceso { grid-template-columns: 1fr; padding: 7rem 1.25rem 4rem; }.archivos-presentacion { display: none; }.archivos-acceso-tarjeta { width: min(100%, 430px); justify-self: center; }.archivos-marca { left: 1.5rem; top: 2rem; }.archivos-acceso footer { left: 1.5rem; } }
</style>
