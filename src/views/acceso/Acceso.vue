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
                        @submit.prevent="handleLogin"
                    >
                        <div class="field">
                            <label for="correo">
                                Correo electrónico
                            </label>

                            <InputText
                                id="correo"
                                v-model="correo"
                                type="email"
                                class="w-full custom-input"
                                placeholder="correo@empresa.com"
                                autocomplete="username"
                            />
                        </div>

                        <div class="field">
                            <label for="password">
                                Contraseña
                            </label>

                            <Password
                                v-model="password"
                                inputId="password"
                                class="custom-password"
                                inputClass="w-full"
                                :feedback="false"
                                toggleMask
                                placeholder="Ingresa tu contraseña"
                                autocomplete="current-password"
                            />
                        </div>

                        <Button
                            type="submit"
                            label="Ingresar"
                            icon="pi pi-sign-in"
                            class="w-full login-button"
                            :loading="cargando"
                        />
                    </form>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {

}
</script>

<style>
    @import './css/estilo.css';
</style>