<template>
    <Button v-if="puedeUsarChat" icon="pi pi-comments" text rounded class="chat-acceso" :badge="sinLeer ? (sinLeer > 99 ? '99+' : String(sinLeer)) : undefined" badgeSeverity="danger" :aria-label="'Mensajes: ' + sinLeer + ' sin leer'" title="Mensajes" @click="handleMostrar" />
    <Dialog v-model:visible="mostrar" modal position="topright" class="chat-dialogo" :style="{ width: '760px', maxWidth: 'calc(100vw - 24px)', margin: '64px 12px 12px', height: 'calc(100dvh - 88px)', maxHeight: 'calc(100dvh - 88px)' }" :contentStyle="{ display: 'flex', flexDirection: 'column', minHeight: '0', overflow: 'hidden' }" :draggable="false" :breakpoints="{ '640px': '100vw' }">
        <template #header>
            <div class="chat-titulo"><i class="pi pi-comments" aria-hidden="true" /><div><strong>Mensajes</strong><small>Conversaciones privadas</small></div></div>
        </template>
        <Message v-if="error" severity="warn" :closable="false" class="chat-error">{{ error }}</Message>
        <div class="chat-paneles" :class="{ 'chat-en-conversacion': !!conversacion || mostrarAgenda }">
            <aside class="chat-bandeja" aria-label="Conversaciones">
                <div class="chat-bandeja-titulo"><strong>{{ busqueda.trim().length >= 2 ? 'Usuarios' : verArchivadas ? 'Archivadas' : 'Conversaciones' }}</strong><div class="chat-bandeja-acciones"><Badge v-if="sinLeer" :value="sinLeer" /><Button icon="pi pi-inbox" text rounded size="small" :class="{ 'chat-accion-activa': verArchivadas }" :title="verArchivadas ? 'Ver conversaciones' : 'Ver archivadas'" aria-label="Cambiar vista de archivadas" @click="handleVerArchivadas" /><Button icon="pi pi-address-book" text rounded size="small" title="Agenda de contactos" aria-label="Abrir agenda de contactos" @click="handleAbrirAgenda" /></div></div>
                <IconField><InputIcon class="pi pi-search" /><InputText v-model="busqueda" :maxlength="80" placeholder="Buscar persona..." aria-label="Buscar conversaciones" /></IconField>
                <Listbox :loading="buscando || cargandoConversaciones" v-model="conversacion" :options="conversacionesFiltradas" optionLabel="nombre" dataKey="id" class="chat-lista" aria-label="Elegir conversacion" @change="handleSeleccionar">
                    <template #option="{ option }">
                        <div class="chat-contacto" @contextmenu.prevent.stop="handleMenuContacto($event, option)">
                            <span class="chat-avatar-contenedor"><Avatar :image="fotosUsuarios[option.id]" :label="fotosUsuarios[option.id] ? undefined : handleIniciales(option.nombre)" shape="circle" class="chat-avatar" /><span class="chat-presencia" :class="{ 'chat-presencia-conectado': handleEstaConectado(option) }" role="img" :aria-label="handleEstadoConexion(option)" :title="handleEstadoConexion(option)" /></span>
                            <div class="chat-contacto-datos"><div class="chat-contacto-linea"><strong>{{ option.nombre }}</strong><small>{{ handleHoraLista(option.ultimo?.fecha) }}</small></div><div class="chat-contacto-linea"><span>{{ option.ultimo?.texto || 'Iniciar conversación' }}</span><Badge v-if="option.sinLeer" :value="option.sinLeer" /></div></div><Button v-if="option.ultimo?.id" icon="pi pi-ellipsis-v" text rounded size="small" class="chat-opciones-contacto" aria-label="Opciones de conversación" @click.stop="handleMenuContacto($event, option)" @mousedown.stop />
                        </div>
                    </template>
                    <template #empty>{{ buscando || cargandoConversaciones ? 'Cargando...' : busqueda.trim().length >= 2 ? 'No se encontraron usuarios.' : 'Busca una persona para iniciar una conversación.' }}</template>
                </Listbox>
                <Button v-if="hayMasConversaciones && busqueda.trim().length < 2" label="Ver más conversaciones" text size="small" :loading="cargandoConversaciones" @click="handleCargarConversaciones(true)" />
                <small class="chat-bandeja-pie"><i class="pi pi-lock" aria-hidden="true" /> Usuario a usuario</small>
            </aside>
            <section v-if="mostrarAgenda" class="chat-agenda" aria-label="Agenda de contactos">
                <div class="chat-agenda-cabecera"><div><strong><i class="pi pi-address-book" aria-hidden="true" /> Agenda de contactos</strong><small>Usuarios con acceso al chat</small></div><Button icon="pi pi-times" text rounded aria-label="Cerrar agenda" @click="handleCerrarAgenda" /></div>
                <div class="chat-agenda-buscar"><IconField><InputIcon class="pi pi-search" /><InputText v-model="busquedaAgenda" :maxlength="80" placeholder="Buscar en la agenda..." aria-label="Buscar en agenda" /></IconField></div>
                <nav class="chat-abecedario" aria-label="Filtrar contactos por inicial"><Button v-for="letra in letrasAgenda" :key="letra" :label="letra || 'Todos'" text size="small" :class="{ 'chat-letra-activa': letraAgenda === letra }" :aria-pressed="letraAgenda === letra" @click="handleLetraAgenda(letra)" /></nav>
                <div class="chat-agenda-lista" :aria-busy="cargandoAgenda">
                    <div v-if="!contactosAgenda.length" class="chat-dia-vacio"><i class="pi pi-address-book" aria-hidden="true" /><span>{{ cargandoAgenda ? 'Cargando contactos...' : 'No hay contactos para esta búsqueda.' }}</span></div>
                    <Button v-for="usuario in contactosAgenda" :key="usuario.id" text severity="secondary" class="chat-agenda-contacto" @click="handleElegirContacto(usuario)">
                        <span class="chat-avatar-contenedor"><Avatar :image="fotosUsuarios[usuario.id]" :label="fotosUsuarios[usuario.id] ? undefined : handleIniciales(usuario.nombre)" shape="circle" class="chat-avatar" /><span class="chat-presencia" :class="{ 'chat-presencia-conectado': handleEstaConectado(usuario) }" /></span>
                        <span class="chat-agenda-nombre"><strong>{{ usuario.nombre }}</strong><small>{{ handleEstadoConexion(usuario) }}</small></span><i class="pi pi-comment" aria-hidden="true" />
                    </Button>
                    <Button v-if="hayMasAgenda" label="Ver más contactos" text :loading="cargandoAgenda" @click="handleCargarAgenda(true)" />
                </div>
            </section>
            <section v-else-if="conversacion" class="chat-conversacion" aria-label="Conversacion seleccionada">
                <div class="chat-conversacion-cabecera">
                    <Button icon="pi pi-arrow-left" text rounded class="chat-volver" aria-label="Volver a conversaciones" @click="handleVolver" />
                    <span class="chat-avatar-contenedor"><Avatar :image="fotosUsuarios[conversacion.id]" :label="fotosUsuarios[conversacion.id] ? undefined : handleIniciales(conversacion.nombre)" shape="circle" class="chat-avatar" /><span class="chat-presencia" :class="{ 'chat-presencia-conectado': handleEstaConectado(conversacion) }" role="img" :aria-label="handleEstadoConexion(conversacion)" :title="handleEstadoConexion(conversacion)" /></span>
                    <div><strong>{{ conversacion.nombre }}</strong><small>{{ conversacion.activo === false || conversacion.chat_habilitado === false ? 'Chat no disponible para este usuario' : handleEstadoConexion(conversacion) }}</small></div>
                </div>
                <div class="chat-historial-herramientas">
                    <span>{{ etiquetaFecha }}</span>
                    <div><Button v-if="!viendoHoy" label="Hoy" text size="small" @click="handleIrHoy" /><Button icon="pi pi-calendar" text rounded aria-label="Consultar mensajes por fecha" title="Consultar otro día" @click="handleMostrarCalendario" /></div>
                </div>
                <Popover ref="calendario"><div class="chat-calendario"><strong>Consultar mensajes</strong><small>Selecciona hoy o un día anterior.</small><DatePicker :modelValue="fechaSeleccionada" :maxDate="hoy" inline :manualInput="false" @update:modelValue="handleCambiarFecha" /></div></Popover>
                <div ref="contenedorMensajes" class="chat-mensajes" @scroll.passive="handleDesplazamiento" :aria-busy="cargandoMensajes" aria-live="polite" aria-relevant="additions">
                    <Button v-if="hayMasMensajes" label="Mensajes anteriores de este día" icon="pi pi-angle-up" text size="small" :loading="cargandoMensajes" @click="handleCargarMensajes(true)" />
                    <div v-if="!mensajesDelDia.length && !cargandoMensajes" class="chat-dia-vacio"><i class="pi pi-calendar" aria-hidden="true" /><span>No hay mensajes de este día.</span></div>
                    <div v-for="mensaje in mensajesDelDia" :key="mensaje.id" :data-mensaje-id="mensaje.id" class="chat-mensaje" :class="{ 'chat-mensaje-propio': mensaje.propio }"><p>{{ mensaje.texto }}</p><small>{{ handleHora(mensaje.fecha) }}<i v-if="mensaje.propio" :class="mensaje.leido ? 'pi pi-check-circle' : 'pi pi-check'" :title="mensaje.leido ? 'Leído' : 'Enviado'" /></small></div>
                </div>
                <form class="chat-redactar" @submit.prevent="handleEnviar">
                    <Textarea :disabled="enviando || conversacion.activo === false || conversacion.chat_habilitado === false" v-model="borrador" placeholder="Escribe un mensaje..." aria-label="Mensaje" rows="2" :maxlength="2000" @keydown.enter.exact.prevent="handleEnviar" />
                    <Button type="submit" icon="pi pi-send" rounded aria-label="Enviar mensaje" title="Enviar mensaje" :loading="enviando" :disabled="!borrador.trim() || conversacion.activo === false || conversacion.chat_habilitado === false" />
                    <small v-if="conversacion.activo === false || conversacion.chat_habilitado === false">Este usuario no recibe nuevos mensajes.</small>
                    <small v-else-if="!viendoHoy">Al enviar, volverás a la conversación de hoy.</small>
                    <small v-else>Enter para enviar · Mayús + Enter para otra línea</small>
                </form>
            </section>
            <section v-else class="chat-vacio"><i class="pi pi-comments" aria-hidden="true" /><strong>Tu equipo, a un mensaje</strong><p>Selecciona una persona para ver la conversación.</p></section>
        </div>
    </Dialog>
    <ContextMenu ref="menuContacto" :model="opcionesContacto" />
    <Dialog v-model:visible="confirmarEliminar" modal header="Eliminar conversación" :style="{ width: '29rem' }" :breakpoints="{ '640px': '95vw' }" :closable="!procesandoAccion" :closeOnEscape="!procesandoAccion">
        <div class="chat-confirmar-eliminar"><strong>{{ contactoMenu?.nombre }}</strong><p>Se ocultará para ti el historial actual de esta conversación. El historial de la otra persona se conserva.</p><p>Los mensajes nuevos volverán a aparecer. Para conservar la conversación y retirarla de la lista principal, usa Archivar.</p></div>
        <template #footer><Button label="Cancelar" outlined :disabled="procesandoAccion" @click="confirmarEliminar = false" /><Button label="Eliminar para mí" icon="pi pi-trash" severity="danger" :loading="procesandoAccion" @click="handleAplicarAccion('eliminar')" /></template>
    </Dialog>
</template>
<script>
import proceso from './js/proceso.js';
export default { name: 'ChatPrivado', setup() { return { ...proceso() }; } };
</script>
<style scoped>
@import './css/estilo.css';
</style>
