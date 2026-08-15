<template>
    <div class="login-wrapper">
        <div class="login-box">
            <div class="login-left">
                <div class="overlay">
                    <img
                        src="@/assets/images/logo_empresa_cliente.png"
                        alt="Logo Sociedad Ballfudr"
                        class="login-logo-top"
                    />

                    <div class="login-content">
                        <h1>Bienvenido</h1>

                        <p>
                            Plataforma para la administración de facturas,
                            complementos de pago y solicitudes.
                        </p>
                        <p>
                            Administración de las cuentas bancarias y
                            conciliacion.
                        </p>
                    </div>

                    <img
                        src="@/assets/images/logo.png"
                        alt="Logo Gekko"
                        class="login-logo-footer"
                    />
                </div>
            </div>

            <div class="login-right">
                <div class="login-form-container">
                    <h2>Iniciar sesión</h2>

                    <p class="login-subtitle">
                        Ingresa tus credenciales para continuar.
                    </p>

                    <form
                        class="login-form"
                        @submit.prevent="handleAcceso"
                    >
                        <div class="field">
                            <label for="correo">
                                Correo electrónico
                            </label>

                            <InputText
                                ref="correoInput"
                                id="correo"
                                v-model="frmAcceso.correo_electronico"
                                type="email"
                                class="w-full custom-input"
                                placeholder="correo@empresa.com"
                                :invalid="!correoElectronicoValido"
                                @update:modelValue="frmAcceso.correo_electronico = $event.toLowerCase()"
                            />
                        </div>

                        <div class="field">
                            <label for="clave">
                                Contraseña
                            </label>

                            <Password
                                id="clave"
                                v-model="frmAcceso.clave"
                                class="custom-password"
                                inputClass="w-full"
                                :invalid="!claveValida"
                                :feedback="false"
                                placeholder="Ingresa tu contraseña"
                            />
                        </div>

                        <Button
                            type="submit"
                            label="Ingresar"
                            icon="pi pi-sign-in"
                            class="w-full login-button"
                            :disabled="botonEntrarDeshabilitado"
                        />
                    </form>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import proceso from './js/proceso.js';
export default {
    name: 'Acceso',
    // components: {AppFooter, cargando},
    setup(){
      return{
        ...proceso()
      }
    }
}
</script>

<style>
    @import './css/estilo.css';
</style>