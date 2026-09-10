<template>
    <Encabezado titulo="Movimientos Bancarios" subtitulo="Consulta y exportación de movimientos de estados de cuenta" icono="pi pi-money-bill">
        <Button type="button" label="Exportar Excel" class="btn-exportar" :disabled="movimientos.length === 0" @click="handleExportarExcel">
            <template #icon>
                <font-icon icon="fa-solid fa-file-excel" class="mr-2" />
            </template>
        </Button>
    </Encabezado>

    <div class="card card-movimientos">
        <div class="panel-filtros">
            <div class="encabezado-filtros">
                <div class="icono-filtros">
                    <font-icon icon="fa-solid fa-building-columns" />
                </div>

                <div>
                    <div class="titulo-filtros">Consulta de Movimientos Bancarios</div>
                    <div class="subtitulo-filtros">Selecciona empresa, cuenta bancaria y periodo a consultar.</div>
                </div>
            </div>

            <div class="separador"></div>

            <div class="grid-filtros">
                <div class="campo-filtro campo-empresa">
                    <label>Empresa</label>

                    <Dropdown
                        v-model="empresaSeleccionada"
                        :options="empresas"
                        optionLabel="razon_social"
                        placeholder="Seleccione una empresa"
                        filter
                        showClear
                        :loading="cargandoEmpresas"
                        :disabled="consultando"
                        class="w-full"
                        @change="handleCambiarEmpresa"
                    >
                        <template #option="slotProps">
                            <div class="opcion-empresa">
                                <strong>{{ slotProps.option.razon_social }}</strong>
                                <small> RFC: {{ slotProps.option.rfc || 'Sin RFC' }} </small>
                            </div>
                        </template>
                    </Dropdown>
                </div>

                <div class="campo-filtro campo-cuenta">
                    <label>Banco / Cuenta Bancaria</label>

                    <Dropdown
                        v-model="cuentaSeleccionada"
                        :options="cuentasBancarias"
                        placeholder="Seleccione una cuenta bancaria"
                        filter
                        showClear
                        :loading="cargandoCuentas"
                        :disabled="!empresaSeleccionada || consultando"
                        class="w-full"
                        @change="handleCambiarCuenta"
                    >
                        <template #option="slotProps">
                            <div class="opcion-cuenta">
                                <div class="opcion-cuenta-superior">
                                    <span class="clave-banco">
                                        {{ slotProps.option.clave_banco }}
                                    </span>

                                    <div class="datos-opcion-cuenta">
                                        <strong>{{ slotProps.option.banco }}</strong>
                                        <small> Cuenta: {{ slotProps.option.cuenta_banco || 'Sin número' }} </small>
                                    </div>
                                </div>

                                <small class="clabe-opcion"> CLABE: {{ slotProps.option.clabe_bancaria }} </small>
                            </div>
                        </template>

                        <template #value="slotProps">
                            <span v-if="!slotProps.value">
                                {{ slotProps.placeholder }}
                            </span>

                            <div v-else class="valor-cuenta">
                                <strong>{{ slotProps.value.clave_banco }}</strong>
                                <span>{{ slotProps.value.banco }}</span>
                                <span class="cuenta-separador">-</span>
                                <span>{{ slotProps.value.cuenta_banco || 'Sin cuenta' }}</span>
                            </div>
                        </template>
                    </Dropdown>
                </div>

                <div class="campo-filtro">
                    <label>Fecha Inicial</label>

                    <Calendar v-model="fechaInicial" dateFormat="dd/mm/yy" showIcon :showOnFocus="false" :maxDate="fechaFinal" :disabled="consultando" class="w-full" />
                </div>

                <div class="campo-filtro">
                    <label>Fecha Final</label>

                    <Calendar v-model="fechaFinal" dateFormat="dd/mm/yy" showIcon :showOnFocus="false" :minDate="fechaInicial" :disabled="consultando" class="w-full" />
                </div>
            </div>

            <div class="acciones-filtros">
                <Button type="button" label="Limpiar" class="btn-cancelar" :disabled="consultando" @click="handleRestablecer">
                    <template #icon>
                        <font-icon icon="fa-solid fa-filter-circle-xmark" class="mr-2" />
                    </template>
                </Button>

                <Button type="button" label="Consultar" class="btn-guardar" :loading="consultando" :disabled="!empresaSeleccionada || !cuentaSeleccionada || !fechaInicial || !fechaFinal || consultando" @click="handleConsultar">
                    <template #icon>
                        <font-icon icon="fa-solid fa-magnifying-glass" class="mr-2" />
                    </template>
                </Button>
            </div>
        </div>

        <template v-if="consultado">
            <div class="grid-resumen">
                <div class="tarjeta-resumen">
                    <span>Movimientos</span>
                    <strong>{{ resumen.movimientos }}</strong>
                </div>

                <div class="tarjeta-resumen">
                    <span>Ingresos</span>
                    <strong class="importe-ingreso">
                        {{ handleFormatoMoneda(resumen.total_ingresos) }}
                    </strong>
                </div>

                <div class="tarjeta-resumen">
                    <span>Egresos</span>
                    <strong class="importe-egreso">
                        {{ handleFormatoMoneda(resumen.total_egresos) }}
                    </strong>
                </div>

                <div class="tarjeta-resumen">
                    <span>Banco / Cuenta</span>
                    <strong> {{ cuentaSeleccionada?.clave_banco }} - {{ cuentaSeleccionada?.banco }} </strong>
                    <small>
                        {{ cuentaSeleccionada?.cuenta_banco || handleCuentaEnmascarada(cuentaSeleccionada?.clabe_bancaria) }}
                    </small>
                </div>
            </div>

            <div class="contenedor-tabla">
                <div class="barra-tabla">
                    <Button type="button" icon="pi pi-filter-slash" label="Limpiar" outlined @click="handleLimpiarFiltrosTabla" />

                    <IconField iconPosition="left">
                        <InputIcon>
                            <i class="pi pi-search" />
                        </InputIcon>

                        <InputText v-model="filtros.global.value" placeholder="Buscar..." class="buscador" />
                    </IconField>

                    <div class="acciones-tabla-superior">
                        <span class="contador-registros"> {{ movimientos.length }} movimiento(s) </span>

                        <Button type="button" label="Exportar Excel" class="btn-exportar-tabla" :disabled="movimientos.length === 0" @click="handleExportarExcel">
                            <template #icon>
                                <font-icon icon="fa-solid fa-file-excel" class="mr-2" />
                            </template>
                        </Button>
                    </div>
                </div>

                <DataTable
                    v-model:filters="filtros"
                    :value="movimientos"
                    :globalFilterFields="camposBusqueda"
                    paginator
                    :rows="100"
                    :rowsPerPageOptions="[50, 100, 250, 500, 700]"
                    scrollable
                    scrollHeight="55vh"
                    size="small"
                    class="tabla-encabezados"
                    style="font-size: 12px"
                >
                    <template #empty> No se encontraron movimientos para el periodo seleccionado. </template>

                    <Column v-for="columna in columnasMovimientos" :key="columna.field" :field="columna.field" :header="columna.header" headerClass="encabezado-columna" :style="columna.style">
                        <template #body="slotProps">
                            <span v-if="columna.tipo === 'moneda'" :class="handleClaseImporte(columna.field, slotProps.data[columna.field])">
                                {{ handleFormatoMoneda(slotProps.data[columna.field]) }}
                            </span>

                            <span v-else>
                                {{ slotProps.data[columna.field] ?? '-' }}
                            </span>
                        </template>
                    </Column>
                </DataTable>
            </div>
        </template>
    </div>
</template>

<script>
import Encabezado from '../../../components/encabezado/Encabezado.vue';
import proceso from './js/proceso.js';

export default {
    name: 'MovimientosBancarios',

    components: {
        Encabezado
    },

    setup() {
        return {
            ...proceso()
        };
    }
};
</script>

<style scoped>
@import './css/estilo.css';
</style>
