<template>
    <div class="principal">
        <!-- =====================================================
             BIENVENIDA
        ====================================================== -->
        <section class="bienvenida">
            <div class="bienvenida-contenido">
                <div class="usuario-avatar">
                    <img :src="fotoUsuario || perfil" alt="Foto de perfil" />
                </div>

                <div class="bienvenida-texto">
                    <span class="bienvenida-etiqueta"> Bienvenido </span>

                    <h1>
                        {{ nombreUsuario }}
                    </h1>

                    <p>Administración y control de operaciones</p>

                    <div class="fecha-actual">
                        <font-icon icon="fa-solid fa-calendar-days" />
                        {{ fechaActual }}
                    </div>
                </div>
            </div>

            <div class="bienvenida-icono">
                <font-icon icon="fa-solid fa-chart-line" />
            </div>
        </section>

        <!-- =====================================================
             ACCESOS RÁPIDOS
        ====================================================== -->
        <section class="seccion-principal">
            <div class="titulo-seccion">
                <div>
                    <h2>Accesos rápidos</h2>
                    <p>Ingresa rápidamente a las principales operaciones del sistema.</p>
                </div>
            </div>

            <div class="grid-accesos">
                <div v-for="opcion in accesosRapidos" :key="opcion.titulo" class="acceso-card" @click="handleIrRuta(opcion.ruta)">
                    <div class="acceso-icono">
                        <font-icon :icon="opcion.icono" />
                    </div>

                    <div class="acceso-contenido">
                        <h3>
                            {{ opcion.titulo }}
                        </h3>

                        <p>
                            {{ opcion.descripcion }}
                        </p>
                    </div>

                    <div class="acceso-flecha">
                        <font-icon icon="fa-solid fa-chevron-right" />
                    </div>
                </div>
            </div>
        </section>

        <!-- =====================================================
             MÓDULOS
        ====================================================== -->
        <section class="seccion-principal">
            <div class="titulo-seccion">
                <div>
                    <h2>Módulos del sistema</h2>
                    <p>Herramientas disponibles para la administración de información.</p>
                </div>
            </div>

            <div class="grid-modulos">
                <div class="modulo-card">
                    <div class="modulo-icono">
                        <font-icon icon="fa-solid fa-users" />
                    </div>

                    <div>
                        <h3>Configuración</h3>

                        <p>Administración de usuarios, perfiles y permisos del sistema.</p>
                    </div>
                </div>

                <div class="modulo-card">
                    <div class="modulo-icono">
                        <font-icon icon="fa-solid fa-address-book" />
                    </div>

                    <div>
                        <h3>Catálogos</h3>

                        <p>Consulta y administración de empresas, promotores, clientes e impuestos.</p>
                    </div>
                </div>

                <div class="modulo-card">
                    <div class="modulo-icono">
                        <font-icon icon="fa-solid fa-gears" />
                    </div>

                    <div>
                        <h3>Operaciones</h3>

                        <p>Mesa de control, solicitudes detalladas y solicitudes de pago.</p>
                    </div>
                </div>

                <div class="modulo-card">
                    <div class="modulo-icono">
                        <font-icon icon="fa-solid fa-file-invoice" />
                    </div>

                    <div>
                        <h3>Administrador CFDI</h3>

                        <p>Solicitudes SAT, consultas, CFDI y complementos de pago.</p>
                    </div>
                </div>
            </div>
        </section>
    </div>
</template>

<script>
import perfil from '../../../assets/images/Perfil.jpg';
import proceso from './js/proceso.js';

export default {
    name: 'Principal',

    setup() {
        return {
            ...proceso(),
            perfil
        };
    }
};
</script>

<style scoped>
@import './css/estilo.css';
</style>
