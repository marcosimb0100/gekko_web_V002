<template>
    <Encabezado titulo="Configuración de Nube" subtitulo="Almacenamiento, permisos y administración" icono="pi pi-cog">
        <Button label="Actualizar" icon="pi pi-refresh" outlined :disabled="cargando" @click="handleActualizar" />
        <Button type="submit" form="formConfiguracionNube" label="Guardar" icon="pi pi-save" class="btn-guardar" :disabled="cargando || !formulario.revision || !formulario.administradores.length" />
    </Encabezado>
    <div class="card configuracion-nube">
        <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>
        <section v-if="formulario.revision" class="almacenamiento-resumen" aria-label="Uso del almacenamiento">
            <div class="almacenamiento-grafica" v-if="cuotaGuardadaBytes > 0">
                <Chart type="doughnut" :data="graficaDatos" :options="graficaOpciones" class="almacenamiento-anillo" :canvasProps="{ role: 'img', 'aria-label': `Almacenamiento ocupado: ${porcentajeTexto}` }" />
                <div class="almacenamiento-centro"><strong>{{ porcentajeTexto }}</strong><span>ocupado</span></div>
            </div>
            <div v-else class="almacenamiento-ilimitado"><i class="pi pi-database" aria-hidden="true" /><span>Sin límite global</span></div>
            <div class="almacenamiento-detalle">
                <div class="almacenamiento-titulo"><h2>Uso de almacenamiento</h2><Tag :value="cuotaGuardadaBytes ? 'Cuota asignada' : 'Sin límite'" severity="secondary" /></div>
                <div class="almacenamiento-metricas">
                    <div><span><i class="almacenamiento-punto ocupado" />Ocupado</span><strong>{{ handleFormatoCapacidad(usoBytes) }}</strong></div>
                    <div><span><i class="almacenamiento-punto disponible" />Disponible</span><strong>{{ cuotaGuardadaBytes ? handleFormatoCapacidad(disponibleBytes) : 'Sin límite' }}</strong></div>
                    <div><span>Cuota global guardada</span><strong>{{ cuotaGuardadaBytes ? handleFormatoCapacidad(cuotaGuardadaBytes) : 'Sin límite' }}</strong></div>
                </div>
                <small>Incluye archivos, versiones y papelera. Pulsa Actualizar para consultar la ocupación reciente.</small>
            </div>
        </section>

        <form id="formConfiguracionNube" @submit.prevent="handleGuardar" class="configuracion-formulario">
            <Fieldset legend="Servicio y sincronización">
                <small>Requiere equipos autorizados, permisos Sync local y el programa Windows. El cliente aún está pendiente.</small>
                <div class="configuracion-campo configuracion-switch"><ToggleSwitch v-model="formulario.activo" inputId="nube-activa" :disabled="cargando" /><label for="nube-activa">Habilitar kiosco Nube</label></div>
                <div class="configuracion-campo configuracion-switch"><ToggleSwitch v-model="formulario.mostrar_sync_local" inputId="mostrar-sync" :disabled="cargando" /><label for="mostrar-sync">Mostrar columnas Sync local y Editar local</label></div>
                <div class="configuracion-campo configuracion-switch"><ToggleSwitch v-model="formulario.sincronizacion_activa" inputId="activar-sync" :disabled="cargando || !apiWindowsDisponible" /><label for="activar-sync">Habilitar API de sincronización Windows</label><Tag :value="apiWindowsDisponible ? 'API disponible' : 'Inicialización pendiente'" :severity="apiWindowsDisponible ? 'success' : 'secondary'" /></div>
            </Fieldset>
            <Fieldset legend="Almacenamiento">
                <div class="configuracion-rejilla">
                    <div class="configuracion-campo"><label for="limite-archivo">Máximo por archivo (MB)</label><InputNumber v-model="formulario.limiteArchivoMB" inputId="limite-archivo" :min="0.001" :max="8589934591" :maxFractionDigits="3" :disabled="cargando" required /></div>
                    <div class="configuracion-campo"><label for="limite-global">Cuota global (MB)</label><InputNumber v-model="formulario.limiteGlobalMB" inputId="limite-global" :min="0" :max="8589934591" :maxFractionDigits="3" :disabled="cargando" required /><small>0 = sin límite. Incluye versiones y papelera.</small></div>
                </div>
                <p>Ocupación contabilizada: <strong>{{ handleFormatoBytes(usoBytes) }}</strong></p>
            </Fieldset>
            <Fieldset legend="Modelo de permisos">
                <div class="configuracion-campo"><label for="modelo-permisos">Asignar permisos exclusivamente</label><Select v-model="formulario.modelo_permisos" inputId="modelo-permisos" :options="modelos" optionLabel="nombre" optionValue="valor" :disabled="cargando" /></div>
                <p>La herencia entre carpetas se conserva en ambos modelos. Cambiar el modelo puede cambiar el acceso de los usuarios.</p>
            </Fieldset>
            <Fieldset legend="Usuarios que pueden configurar Nube">
                <div class="configuracion-busqueda"><InputText v-model="buscar" placeholder="Buscar usuario activo" aria-label="Buscar usuario activo" :disabled="cargando" @keydown.enter.prevent="handleBuscarUsuarios" /><Button type="button" label="Buscar" icon="pi pi-search" :disabled="cargando" @click="handleBuscarUsuarios" /><Button v-if="hayMasUsuarios" type="button" label="Más resultados" text :disabled="cargando" @click="handleMasUsuarios" /></div>
                <div class="configuracion-campo"><label for="nube-administradores">Administradores</label><MultiSelect v-model="formulario.administradores" inputId="nube-administradores" :options="usuarios" optionLabel="nombre" optionValue="_id" display="chip" filter :disabled="cargando" placeholder="Selecciona al menos un usuario" /></div>
                <small>Estos usuarios administran configuración y permisos y tienen acceso completo a los repositorios. Su perfil Gekko debe permitir también las rutas de Nube.</small>
            </Fieldset>
        </form>
    </div>
    <Dialog v-model:visible="confirmarVisible" modal header="Cambiar modelo de permisos" :closable="!cargando" class="configuracion-confirmacion">
        <p>Se aplicarán únicamente las reglas {{ formulario.modelo_permisos === 'usuarios' ? 'por usuario' : 'por perfil' }}. Las reglas del modelo anterior se conservan, pero dejarán de conceder acceso. Algunos usuarios podrían obtener o perder acceso.</p>
        <p>Se guardará toda la configuración del formulario. Revisa las asignaciones antes de continuar.</p>
        <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>
        <template #footer><Button label="Cancelar" outlined :disabled="cargando" @click="confirmarVisible = false" /><Button label="Confirmar y guardar" icon="pi pi-check" :disabled="cargando" @click="handleConfirmarModelo" /></template>
    </Dialog>
</template>

<script>
import Encabezado from '../../../components/encabezado/Encabezado.vue';
import proceso from './js/proceso.js';
import Chart from 'primevue/chart';
export default { name: 'ConfiguracionNube', components: { Encabezado, Chart }, setup() { return { ...proceso() }; } };
</script>

<style scoped>
@import './css/estilo.css';
</style>
