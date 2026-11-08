import useAvisosNavegador from '../../../helpers/avisosNavegador';

export default function useAvisosChat({ puedeUsarChat, handleAbrir }) {
    const avisos = useAvisosNavegador({
        permitido: puedeUsarChat, handleAbrir, origen: 'chat',
        titulo: 'Gekko \u00b7 Nuevo mensaje',
        mensaje: 'Tienes mensajes nuevos. Haz clic para abrir el chat.',
        textoActivacion: 'Recibir\u00e1s avisos de mensajes nuevos cuando Gekko no est\u00e9 en primer plano.',
        validarId: id => typeof id === 'string' && /^[a-f0-9]{24}$/.test(id)
    });
    return { ...avisos, handleAvisarMensaje: avisos.handleAvisar };
}
