<template>
    <main class="compartido-pagina">
        <section class="compartido-tarjeta" aria-labelledby="compartido-titulo" :aria-busy="cargando || descargando">
            <div class="compartido-marca"><img src="@/assets/images/logo_gekko.png" alt="Gekko" /><span>SYNC</span></div>
            <div class="compartido-icono" aria-hidden="true"><i :class="error ? 'pi pi-link' : 'pi pi-file'" /></div>
            <template v-if="cargando">
                <ProgressSpinner class="compartido-cargando" aria-label="Consultando enlace" />
                <h1 id="compartido-titulo">Consultando archivo</h1>
                <p class="compartido-descripcion">Estamos comprobando la disponibilidad del enlace.</p>
            </template>
            <template v-else-if="error">
                <span class="compartido-etiqueta">ENLACE NO DISPONIBLE</span>
                <h1 id="compartido-titulo">Este enlace no está disponible</h1>
                <Message severity="warn" :closable="false">{{ error }}</Message>
                <p class="compartido-descripcion">Solicita un nuevo enlace a la persona que compartió el archivo.</p>
                <Button label="Volver a comprobar" icon="pi pi-refresh" outlined :disabled="descargando" @click="handleCargar" />
            </template>
            <template v-else-if="archivo">
                <span class="compartido-etiqueta">COMPARTIDO CONTIGO</span>
                <h1 id="compartido-titulo">Tu archivo está listo</h1>
                <p class="compartido-descripcion">Descarga la versión que han compartido contigo.</p>
                <div class="compartido-archivo"><i class="pi pi-file" aria-hidden="true" /><div><strong>{{ archivo.nombre }}</strong><span>{{ handleTamano(archivo.bytes) }} · Versión compartida</span></div></div>
                <dl class="compartido-condiciones">
                    <div><dt>Disponible hasta</dt><dd>{{ archivo.vence ? handleFecha(archivo.vence) : 'Según límite de descargas' }}</dd></div>
                    <div><dt>Descargas restantes</dt><dd>{{ archivo.restantes ?? 'Sin límite de cantidad' }}</dd></div>
                </dl>
                <Button label="Descargar archivo" icon="pi pi-download" :loading="descargando" :disabled="cargando || descargando || agotado" @click="handleDescargar" />
                <Message v-if="descargaError" severity="error" :closable="false">{{ descargaError }}</Message>
                <Message v-if="descargaIniciada" severity="success" :closable="false">La descarga se envió al navegador. {{ agotado ? 'El enlace ya no admite nuevas descargas.' : 'Consulta tus descargas para ver el archivo.' }}</Message>
                <p class="compartido-nota">Cada inicio de descarga cuenta, aunque se interrumpa.<br>Abrir esta página no consume descargas.</p>
            </template>
            <footer>Documentos compartidos con Gekko</footer>
        </section>
    </main>
</template>

<script>
import proceso from './js/proceso';
export default { name: 'ArchivoCompartido', setup() { return { ...proceso() }; } };
</script>

<style scoped>
@import './css/estilo.css';
</style>
