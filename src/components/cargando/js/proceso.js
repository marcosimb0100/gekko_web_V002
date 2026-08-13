import { computed, ref } from 'vue';
import { useStore } from 'vuex';

const useProceso = () => {
    const store = useStore();
    const visibleCargando = ref(computed( () => store.getters['api/visibleCargandoGetter']))
    return{
        visibleCargando
    }

};

export default useProceso;