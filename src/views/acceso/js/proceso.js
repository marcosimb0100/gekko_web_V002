import { useToast } from 'primevue/usetoast';
import { computed, nextTick, reactive, ref } from 'vue';
import { useStore } from 'vuex';

const frmAccesoInit = () => ( {
    
    correo_electronico: '', 
    clave: ''

});

const useProceso = () => {

    const store = useStore();
    const toast = useToast();

    const frmAcceso = reactive(frmAccesoInit());

    const correoInput = ref(null);


    const handleAcceso = async() => {
        

        console.log( JSON.stringify( frmAcceso ) );
        
        const res = await store.dispatch('api/apiPostAcceso', {
            direccion: `usuarios/acceso`,
            datosJson: frmAcceso
        });

        if (res.estatus !== 200) {
            toast.add({ severity: 'error', summary: 'Notificacion', detail: res.mensaje, life: 3000 });
            limpiarFormulario();
        }
               

    };

    
    const limpiarFormulario = async () => {

        Object.assign(frmAcceso, frmAccesoInit());

        await nextTick();

        const elemento = correoInput.value?.$el ?? correoInput.value;

        elemento?.focus?.();
    };


    const correoElectronicoValido = computed(() => {

        const regexCorreo = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;

        if (!frmAcceso.correo_electronico) {
            return true;
        }

        return regexCorreo.test(
            frmAcceso.correo_electronico.trim()
        );
    });


    const claveValida = computed(() => {

        const regexClave = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/;

        if (!frmAcceso.clave) {
            return true;
        }

        return regexClave.test(frmAcceso.clave);
    });


    const botonEntrarDeshabilitado = computed(() => {

        if (
            !frmAcceso.correo_electronico ||
            !frmAcceso.clave
        ) {
            return true;
        }

        return !correoElectronicoValido.value || !claveValida.value;
    });


    return {

        frmAcceso,

        handleAcceso,

        correoElectronicoValido,
        claveValida,
        botonEntrarDeshabilitado,
        correoInput

    }

}

export default useProceso;