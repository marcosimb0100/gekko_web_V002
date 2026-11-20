<template>
    <div class="principal">
        <section class="bienvenida">
            <div class="bienvenida-identidad">
                <Avatar :image="fotoUsuario || perfil" shape="circle" class="principal-avatar" @error="handleErrorFoto" />
                <div><span class="principal-etiqueta">RESUMEN DE TRABAJO</span><h1>Hola, {{ nombreUsuario }}</h1><p>{{ fechaActual }}</p></div>
            </div>
            <Button label="Actualizar" icon="pi pi-refresh" outlined :loading="cargando" :disabled="cargando" @click="handleCargar" />
        </section>
        <div class="resumen-cabecera">
            <div><h2>Lo que requiere tu atenci&oacute;n</h2><p>Pendientes, pr&oacute;ximos compromisos y saldos de tus m&oacute;dulos autorizados.</p></div>
            <span v-if="actualizado" class="resumen-actualizado"><i class="pi pi-clock" aria-hidden="true" /> Consultado a las {{ handleHora(actualizado) }}</span>
        </div>
        <Message v-if="error" severity="error" :closable="false">{{ error }} Pulsa Actualizar para reintentar.</Message>
        <div v-if="cargando && !secciones.length" class="principal-cargando"><ProgressSpinner style="width:36px;height:36px" /><span>Consultando tus pendientes y saldos...</span></div>
        <div v-else-if="secciones.length" class="resumen-grid" :aria-busy="cargando">
            <section v-for="bloque in secciones" :key="bloque.id" :class="['resumen-bloque', 'modulo-' + bloque.id]" :aria-labelledby="'titulo-' + bloque.id">
                <header class="bloque-cabecera">
                    <span class="bloque-icono"><i :class="bloque.icono" aria-hidden="true" /></span>
                    <div class="bloque-identidad"><h2 :id="'titulo-' + bloque.id">{{ bloque.titulo }}</h2><p>{{ handleSubtitulo(bloque) }}</p></div>
                    <Tag v-if="bloque.error" value="Sin consultar" severity="warn" />
                    <Button v-else-if="bloque.nota" icon="pi pi-info-circle" text rounded class="bloque-ayuda" :aria-label="'Informaci&oacute;n de ' + bloque.titulo" title="Acerca de estos datos" @click="handleAyuda(bloque)" />
                </header>
                <Message v-if="bloque.error" severity="warn" :closable="false" class="bloque-error">{{ bloque.error }}</Message>
                <template v-else>
                    <div v-if="bloque.periodo" class="bloque-periodo"><i class="pi pi-calendar" aria-hidden="true" /><span>{{ bloque.periodo }}</span></div>
                    <div v-if="bloque.indicadores.length" class="indicadores" :class="{ 'indicadores-cuatro': bloque.indicadores.length === 4 }">
                        <div v-for="item in bloque.indicadores" :key="item.etiqueta" class="indicador" :class="'tono-' + handleTono(item)"><span>{{ item.etiqueta }}</span><strong>{{ handleValor(item) }}</strong><small v-if="item.detalle">{{ item.detalle }}</small></div>
                    </div>
                    <h3 v-if="bloque.registros.length" class="lista-titulo">{{ handleTituloLista(bloque) }}</h3>
                    <div v-if="bloque.registros.length" class="registros" :class="{ 'registros-repositorios': bloque.id === 'nube' }">
                        <article v-for="(item, indice) in bloque.registros" :key="item.id || indice" class="registro">
                            <div class="registro-datos"><strong><i v-if="bloque.id === 'nube'" class="pi pi-folder repositorio-icono" aria-hidden="true" />{{ item.titulo }}</strong><span v-if="item.detalle">{{ item.detalle }}</span><span v-if="item.fecha" class="registro-fecha"><i class="pi pi-calendar" aria-hidden="true" /> {{ handleFecha(item.fecha) }}</span></div>
                            <div class="registro-estado"><strong v-if="handleImporte(item)" class="registro-importe">{{ item.importe === null ? (bloque.id === 'bancos' ? 'Sin saldo registrado' : 'Por definir') : handleMoneda(item.importe) }}</strong><Tag v-if="item.estado" :value="item.estado" :severity="item.tono === 'peligro' ? 'danger' : item.tono === 'aviso' ? 'warn' : 'secondary'" /></div>
                        </article>
                    </div>
                    <div v-else-if="bloque.id === 'pagos' || bloque.id === 'solicitudes_pago' || bloque.id === 'juridico' || bloque.id === 'bancos' || bloque.id === 'efectivo' || bloque.id === 'nube'" class="bloque-vacio"><i class="pi pi-inbox" aria-hidden="true" /><span>{{ bloque.mensaje_vacio || 'No hay registros para mostrar en este resumen.' }}</span></div>
                    
                </template>
                <footer class="bloque-pie"><Button :label="bloque.id === 'nube' ? 'Ir al kiosco' : 'Ver detalle'" icon="pi pi-arrow-right" iconPos="right" text :disabled="cargando" :aria-label="'Ver detalle de ' + bloque.titulo" @click="handleIrModulo(bloque)" /></footer>
            </section>
        </div>
        <div v-else-if="!error" class="principal-vacio"><i class="pi pi-check-circle" aria-hidden="true" /><h2>Tu espacio de trabajo</h2><p>Tu perfil a&uacute;n no tiene m&oacute;dulos con resumen operativo. Las opciones autorizadas siguen disponibles en el men&uacute; lateral.</p></div>
        <Dialog :visible="!!ayuda" :header="ayuda?.titulo || 'Informaci&oacute;n del resumen'" modal :style="{ width: '30rem' }" :breakpoints="{ '600px': '94vw' }" @update:visible="ayuda = null">
            <p class="ayuda-descripcion">{{ ayuda?.nota }}</p>
            <template #footer><Button label="Entendido" icon="pi pi-check" @click="ayuda = null" /></template>
        </Dialog>
    </div>
</template>
<script>
import Avatar from 'primevue/avatar';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import Message from 'primevue/message';
import ProgressSpinner from 'primevue/progressspinner';
import perfil from '../../../assets/images/Perfil.jpg';
import proceso from './js/proceso.js';
export default {
    name: 'Principal',
    components: { Dialog, Avatar, Button, Tag, Message, ProgressSpinner },
    setup() { return { ...proceso(), perfil }; }
};
</script>
<style scoped>
@import './css/estilo.css';
</style>
