import { createStore } from 'vuex';
import apiStore from './api';

export default createStore({
    
    modules:{
        api: apiStore
    }

});