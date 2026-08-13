import { useToast } from 'primevue/usetoast';
import { ref } from 'vue';
import { useStore } from 'vuex';

const useProceso = () => {

    const store = useStore();
    const toast = useToast();

    const variable = ref();

    return {
        variable
    }

}

export default useProceso;