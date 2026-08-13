import * as actions from './actions';
import * as getters from './getters';
import * as mutations from './mutations';
import state from './state';

const apiStore = {
    namespaced: true,
    state,
    getters,
    mutations,
    actions
}

export default apiStore;