import { useToast } from 'primevue/usetoast';
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue';
import { useStore } from 'vuex';
import { useSyncInstaller } from '../../../../helpers/syncInstaller';
import { consultaCarpeta } from '../../../../helpers/archivosPortal';
import { apiGet_token } from '../../../../helpers/funcionesApi';

const useProceso = (opciones = {}) => {
    const store = useStore();
    const toast = useToast();
    const destinoInicial = opciones.ubicacionInicial || {};
    let ubicacionPendiente = !!(destinoInicial.espacio || destinoInicial.carpeta);
    const enlaceCarpetaVisible = ref(false);
    const enlaceCarpeta = ref('');
    const instaladorWindows = useSyncInstaller(store, toast);

    const espacios = ref([]);
    const espacioId = ref('');
    const registros = ref([]);
    const accionesCarpeta = ref([]);
    const ruta = ref([]);
    const cargando = ref(false);
    const mensajeError = ref('');
    const visorVisible = ref(false);
    const visorCargando = ref(false);
    const visorError = ref('');
    const visorNombre = ref('');
    const visorUrl = ref('');
    const visorTipo = ref('');
    const visorOffice = ref(false);
    const visorLibro = ref(null);
    const visorDocumento = ref(null);
    const permisosDescargaVisible = ref(false);
    const archivoPermisosDescarga = ref(null);
    const autorizadosDescarga = ref([]);
    const revisionDescargas = ref(0);
    const usuariosDescarga = ref([]);
    const buscarUsuarioDescarga = ref('');
    const usuarioDescarga = ref(null);
    const offsetUsuariosDescarga = ref(0);
    const hayMasUsuariosDescarga = ref(false);
    const vistaPreviaActiva = ref(true);
    const visorAmpliado = ref(false);
    const archivoActivo = ref(null);
    const busqueda = ref('');
    const vistaArchivos = ref('detalle');
    const visorVertical = ref(false);
    const registrosVisibles = computed(() => {
        const texto = busqueda.value.trim().toLocaleLowerCase('es-MX');
        return texto ? registros.value.filter(registro => registro.nombre.toLocaleLowerCase('es-MX').includes(texto)) : registros.value;
    });
    const handleCerrarVistaPrevia = () => {
        visorVisible.value = false;
        visorAmpliado.value = false;
        visorNombre.value = '';
        visorError.value = '';
        archivoActivo.value = null;
        handleLimpiarVisor();
    };
    const handleSeleccionarArchivo = registro => {
        if (cargando.value) return;
        if (archivoActivo.value?._id === registro._id && visorVisible.value) return;
        handleCerrarVistaPrevia();
        archivoActivo.value = registro;
        if (vistaPreviaActiva.value && !papelera.value && registro.tipo === 'archivo' && handleTienePermiso('visualizar', registro)) handleVisualizar(registro);
    };
    watch(vistaPreviaActiva, activa => {
        if (!activa) handleCerrarVistaPrevia();
    });
    watch(registros, handleCerrarVistaPrevia, { flush: 'sync' });
    let solicitudVisor = 0;
    const tiposVistaPrevia = {
        pdf: 'application/pdf', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
        gif: 'image/gif', webp: 'image/webp', bmp: 'image/bmp', avif: 'image/avif'
    };
    const extensionesOffice = ['doc', 'docx', 'odt', 'ppt', 'pptx', 'odp'];
    const extensionesHojaCalculo = ['xls', 'xlsx', 'ods'];
    const handleExtensionVistaPrevia = registro => registro?.nombre?.split('.').pop().toLowerCase() || '';
    const handleTipoVistaPrevia = registro => {
        const extension = handleExtensionVistaPrevia(registro);
        if (extensionesHojaCalculo.includes(extension)) return 'spreadsheet';
        return tiposVistaPrevia[extension] || (extensionesOffice.includes(extension) ? 'application/pdf' : '');
    };
    const handleLimpiarVisor = () => {
        solicitudVisor += 1;
        if (visorUrl.value) URL.revokeObjectURL(visorUrl.value);
        visorUrl.value = '';
        visorLibro.value = null;
        visorDocumento.value = null;
        visorCargando.value = false;
    };
    watch(visorVisible, visible => { if (!visible) handleLimpiarVisor(); });
    onBeforeUnmount(handleLimpiarVisor);
    const handleErrorVisor = () => {
        visorError.value = 'No se pudo mostrar el archivo. Puedes intentar descargarlo para abrirlo en tu equipo.';
    };
    const handleVisualizar = async registro => {
        if (papelera.value || registro.tipo !== 'archivo' || !handleTienePermiso('visualizar', registro)) return;
        vistaPreviaActiva.value = true;
        archivoActivo.value = registro;
        handleLimpiarVisor();
        const solicitud = solicitudVisor;
        visorNombre.value = registro.nombre;
        visorTipo.value = handleTipoVistaPrevia(registro);
        visorOffice.value = extensionesOffice.includes(handleExtensionVistaPrevia(registro));
        visorError.value = '';
        visorVisible.value = true;
        if (!visorTipo.value) {
            visorError.value = 'Este formato no admite vista previa. Puedes descargarlo para abrirlo en tu equipo.';
            return;
        }
        visorCargando.value = true;
        try {
            const parametros = new URLSearchParams({ revision: registro.revision });
            if (visorTipo.value === 'spreadsheet') {
                visorLibro.value = { id: registro._id, revision: registro.revision };
                return;
            }
            let direccion = `/sync/archivos/${registro._id}/visualizacion/imagen?${parametros}`;
            if (visorOffice.value) {
                direccion = `/sync/archivos/${registro._id}/vista-previa?${new URLSearchParams({ revision: registro.revision })}`;
                const inicio = Date.now();
                while (true) {
                    const estado = handleValidarRespuesta(await store.dispatch('api/apiPostTokenSinCargando', {
                        direccion, datosJson: {}
                    }));
                    if (solicitud !== solicitudVisor || !visorVisible.value) return;
                    if (estado.datos?.estado === 'lista') break;
                    if (estado.datos?.estado !== 'procesando') throw new Error('El servidor devolvió un estado de vista previa no válido.');
                    if (Date.now() - inicio > 420000) throw new Error('La vista previa está tardando demasiado. Intenta abrirla de nuevo más tarde.');
                    await new Promise(resolve => setTimeout(resolve, 1500));
                    if (solicitud !== solicitudVisor || !visorVisible.value) return;
                }
            }
            if (visorTipo.value === 'application/pdf') {
                const info = handleValidarRespuesta(await store.dispatch('api/apiGetTokenSinCargando', {
                    direccion: `/sync/archivos/${registro._id}/visualizacion?${parametros}`
                }));
                if (solicitud !== solicitudVisor || !visorVisible.value) return;
                visorDocumento.value = { id: registro._id, revision: registro.revision, paginas: info.datos.paginas };
                return;
            }
            const res = handleValidarRespuesta(await store.dispatch('api/apiGetblobSinCargando', {
                direccion
            }));
            if (solicitud !== solicitudVisor || !visorVisible.value) return;
            if (!(res.data instanceof Blob) || !res.data.size) throw new Error('El archivo está vacío o no está disponible.');
            // The download endpoint may return application/octet-stream; use the supported file type for display.
            visorUrl.value = URL.createObjectURL(new Blob([res.data], { type: 'image/png' }));
        } catch (error) {
            if (solicitud === solicitudVisor && visorVisible.value) visorError.value = error?.message || 'No fue posible cargar la vista previa.';
        } finally {
            if (solicitud === solicitudVisor) visorCargando.value = false;
        }
    };
    const papelera = ref(false);
    const administrador = ref(false);
    const compartirVisible = ref(false);
    const archivoCompartido = ref(null);
    const usarVigencia = ref(true);
    const usarLimite = ref(true);
    const fechaEnlace = ref(null);
    const limiteEnlace = ref(5);
    const enlaceGenerado = ref('');
    const enlaces = ref([]);
    const offsetEnlaces = ref(0);
    const archivadosVisible = ref(false);
    const archivados = ref([]);
    const offsetArchivados = ref(0);
    const offset = ref(0);
    const offsetEspacios = ref(0);
    const hayMasEspacios = ref(false);
    const limite = 50;
    const formularioVisible = ref(false);
    const movimiento = ref('');
    const nombre = ref('');
    const historialVisible = ref(false);
    const seleccionado = ref(null);
    const versiones = ref([]);
    const offsetVersiones = ref(0);
    const confirmacionVisible = ref(false);
    const pendiente = ref(null);
    const cargaVisible = ref(false);
    const destinoCarga = ref(null);
    const controlCarga = ref(null);
    const espacioActual = computed(() => espacios.value.find((item) => item._id === espacioId.value));
    const carpetaActual = computed(() => ruta.value.at(-1)?._id || null);
    watch([espacioId, carpetaActual, papelera, offset], () => { busqueda.value = ''; });
    const rutaInicio = computed(() => ({ label: espacioActual.value?.nombre || 'Inicio', indice: -1 }));
    const rutaItems = computed(() => ruta.value.map((item, indice) => ({ label: item.nombre, indice })));

    const handleTienePermiso = (accion, registro = null) => (registro?.acciones || accionesCarpeta.value).includes(accion);
    const handleFecha = (valor) => (valor ? new Date(valor).toLocaleString('es-MX') : '—');
    const handleTamano = (valor) => `${new Intl.NumberFormat('es-MX', { maximumFractionDigits: 1 }).format(valor / 1024)} KB`;
    const handleValidarRespuesta = (respuesta) => {
        if (respuesta.estatus < 200 || respuesta.estatus >= 300) {
            throw new Error(respuesta.mensaje || 'No fue posible realizar la operación.');
        }
        return respuesta;
    };
    const handleEjecutar = async (tarea) => {
        if (cargando.value) return;
        cargando.value = true;
        mensajeError.value = '';
        try {
            await tarea();
        } catch (error) {
            mensajeError.value = error?.message || 'No fue posible realizar la operación.';
            toast.add({ severity: 'error', summary: 'Gekko Sync', detail: mensajeError.value, life: 6000 });
        } finally {
            cargando.value = false;
        }
    };
    const handleCargarEspacios = async (agregar = false) => {
        const inicio = agregar ? offsetEspacios.value : 0;
        const res = handleValidarRespuesta(
            await store.dispatch('api/apiGetToken', {
                direccion: `/sync/espacios?limite=${limite}&offset=${inicio}`
            })
        );
        const lote = res.datos.espacios;
        espacios.value = agregar ? [...espacios.value, ...lote] : lote;
        offsetEspacios.value = espacios.value.length;
        hayMasEspacios.value = lote.length === limite;
        administrador.value = res.datos.administrador;
        if (espacioId.value && !espacios.value.some(item => item._id === espacioId.value)) {
            // A direct-link repository may be beyond the first page of repositories.
            const parametros = new URLSearchParams({ espacio: espacioId.value });
            if (carpetaActual.value) parametros.set('carpeta', carpetaActual.value);
            const ubicacion = await apiGet_token(`/sync/ubicacion?${parametros}`);
            if (ubicacion.estatus === 200) espacios.value.push(ubicacion.datos.espacio);
            else if ([403, 404].includes(ubicacion.estatus)) { espacioId.value = ''; ruta.value = []; papelera.value = false; }
            else handleValidarRespuesta(ubicacion);
        }
        if (!espacioId.value && espacios.value.length) espacioId.value = espacios.value[0]._id;
    };
    const handleCargarContenido = async () => {
        registros.value = [];
        accionesCarpeta.value = [];
        if (!espacioId.value) return;
        const parametros = new URLSearchParams({ espacio: espacioId.value, limite, offset: offset.value });
        if (!papelera.value && carpetaActual.value) parametros.set('padre', carpetaActual.value);
        const res = handleValidarRespuesta(
            await store.dispatch('api/apiGetToken', {
                direccion: `/sync/${papelera.value ? 'papelera' : 'contenido'}?${parametros}`
            })
        );
        registros.value = res.datos.elementos;
        accionesCarpeta.value = res.datos.acciones || [];
    };
    const handleActualizar = () =>
        handleEjecutar(async () => {
            await handleCargarEspacios();
            if (ubicacionPendiente) {
                registros.value = []; accionesCarpeta.value = [];
                const consulta = consultaCarpeta(destinoInicial);
                if (!consulta.espacio || (destinoInicial.carpeta && !consulta.carpeta)) throw new Error('El enlace de carpeta no es válido.');
                const ubicacion = handleValidarRespuesta(await apiGet_token(`/sync/ubicacion?${new URLSearchParams(consulta)}`));
                const destino = ubicacion.datos;
                if (!espacios.value.some(espacio => espacio._id === destino.espacio._id)) espacios.value.push(destino.espacio);
                espacioId.value = destino.espacio._id;
                ruta.value = destino.ruta;
                papelera.value = false; offset.value = 0;
                ubicacionPendiente = false;
            }
            await handleCargarContenido();
        });
    const handleMasEspacios = () => handleEjecutar(() => handleCargarEspacios(true));
    const handleCambiarEspacio = () =>
        handleEjecutar(async () => {
            ubicacionPendiente = false;
            ruta.value = [];
            offset.value = 0;
            papelera.value = false;
            await handleCargarContenido();
        });
    const handleCambiarPapelera = () =>
        handleEjecutar(async () => {
            papelera.value = !papelera.value;
            offset.value = 0;
            await handleCargarContenido();
        });
    const handleAbrirCarpeta = (registro) =>
        handleEjecutar(async () => {
            ruta.value.push(registro);
            offset.value = 0;
            await handleCargarContenido();
        });
    const handleNavegar = (indice) =>
        handleEjecutar(async () => {
            ruta.value = ruta.value.slice(0, indice + 1);
            offset.value = 0;
            await handleCargarContenido();
        });
    const handlePaginar = (direccion) =>
        handleEjecutar(async () => {
            offset.value = Math.max(0, offset.value + direccion * limite);
            await handleCargarContenido();
        });
    const handleMostrarFormulario = (tipo) => {
        movimiento.value = tipo;
        nombre.value = '';
        mensajeError.value = '';
        formularioVisible.value = true;
    };
    const handleGuardar = () =>
        handleEjecutar(async () => {
            const esEspacio = movimiento.value === 'espacio';
            const esRenombrar = movimiento.value === 'renombrar';
            const res = handleValidarRespuesta(
                await store.dispatch(esRenombrar ? 'api/apiPutToken' : 'api/apiPostToken', {
                    direccion: esRenombrar ? `/sync/entradas/${seleccionado.value._id}/nombre` : esEspacio ? '/sync/espacios' : '/sync/carpetas',
                    datosJson: esRenombrar ? { nombre: nombre.value, revision: seleccionado.value.revision } : esEspacio ? { nombre: nombre.value } : { nombre: nombre.value, espacio: espacioId.value, padre: carpetaActual.value }
                })
            );
            if (esEspacio) {
                await handleCargarEspacios();
                const creado = res.datos;
                if (!espacios.value.some((item) => item._id === creado._id)) {
                    espacios.value.push({ _id: creado._id, nombre: creado.nombre, acciones: ['listar', 'leer', 'cargar', 'crear_carpeta', 'escribir', 'eliminar', 'restaurar', 'historial'] });
                }
                espacioId.value = creado._id;
                ruta.value = [];
                papelera.value = false;
            }
            formularioVisible.value = false;
            offset.value = 0;
            await handleCargarContenido();
            toast.add({ severity: 'success', summary: 'Gekko Sync', detail: 'Registro creado.', life: 3000 });
        });
    const handleMostrarCarga = (registro = null) => {
        destinoCarga.value = registro;
        mensajeError.value = '';
        cargaVisible.value = true;
    };
    const handleSubirArchivo = (evento) =>
        handleEjecutar(async () => {
            const archivos = Array.from(evento.files || []);
            if (!archivos.length) return;
            const destino = destinoCarga.value;
            if (destino && archivos.length !== 1) throw new Error('Una nueva versión requiere un solo archivo.');
            let completados = 0;
            let fallo = null;
            for (const archivo of archivos) {
                const formData = new FormData();
                formData.append('archivo', archivo);
                if (destino) formData.append('revision', destino.revision);
                else {
                    formData.append('espacio', espacioId.value);
                    if (carpetaActual.value) formData.append('padre', carpetaActual.value);
                }
                try {
                    handleValidarRespuesta(await store.dispatch('api/apiPostTokenFormData', {
                        direccion: destino ? `/sync/archivos/${destino._id}/versiones` : '/sync/archivos', formData
                    }));
                    completados += 1;
                    // Remove only confirmed uploads; failed and pending files stay queued.
                    controlCarga.value?.remove(0);
                } catch (error) {
                    fallo = new Error(`${completados} de ${archivos.length} archivos guardados. ${archivo.name}: ${error.message}. Los pendientes permanecen en la lista.`);
                    break;
                }
            }
            if (completados) {
                try { await handleCargarContenido(); }
                catch (error) { if (!fallo) fallo = error; }
            }
            if (fallo) throw fallo;
            cargaVisible.value = false;
            controlCarga.value?.clear();
            toast.add({ severity: 'success', summary: 'Gekko Sync', detail: `${completados} archivo(s) guardado(s).`, life: 3500 });
        });
    const handleDescargar = (registro) =>
        handleEjecutar(async () => {
            if (!handleTienePermiso('descargar', registro)) throw new Error('No tienes autorización para descargar este archivo.');
            const res = handleValidarRespuesta(
                await store.dispatch('api/apiGetblob', {
                    direccion: `/sync/archivos/${registro._id}/contenido`
                })
            );
            const url = URL.createObjectURL(res.data);
            const enlace = document.createElement('a');
            enlace.href = url;
            enlace.download = registro.nombre;
            document.body.appendChild(enlace);
            enlace.click();
            enlace.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        });
    const handleCargarHistorial = async (registro) => {
        const res = handleValidarRespuesta(
            await store.dispatch('api/apiGetToken', {
                direccion: `/sync/archivos/${registro._id}/versiones?limite=${limite}&offset=${offsetVersiones.value}`
            })
        );
        versiones.value = res.datos.versiones;
        seleccionado.value = { ...registro, revision: res.datos.revision };
        historialVisible.value = true;
    };
    const handleHistorial = (registro) =>
        handleEjecutar(async () => {
            offsetVersiones.value = 0;
            await handleCargarHistorial(registro);
        });
    const handlePaginarHistorial = (direccion) =>
        handleEjecutar(async () => {
            offsetVersiones.value = Math.max(0, offsetVersiones.value + direccion * limite);
            await handleCargarHistorial(seleccionado.value);
        });
    const handleMostrarConfirmacion = (tipo, registro, version = null) => {
        pendiente.value = { tipo, registro, version };
        mensajeError.value = '';
        confirmacionVisible.value = true;
    };
    const handleConfirmar = () =>
        handleEjecutar(async () => {
            const { tipo, registro, version } = pendiente.value;
            const datosJson = { revision: registro.revision ?? 0 };
            if (tipo === 'archivar' || tipo === 'restaurar_espacio') {
                handleValidarRespuesta(await store.dispatch('api/apiPostToken', {
                    direccion: `/sync/espacios/${registro._id}/${tipo === 'archivar' ? 'archivar' : 'restaurar'}`, datosJson
                }));
                espacioId.value = ''; ruta.value = []; papelera.value = false; offset.value = 0;
                await handleCargarEspacios();
                if (archivadosVisible.value) await handleCargarArchivados();
            } else if (tipo === 'eliminar') {
                handleValidarRespuesta(
                    await store.dispatch('api/apiDeleteToken', {
                        direccion: `/sync/entradas/${registro._id}`,
                        datosJson
                    })
                );
            } else {
                if (version) datosJson.version = version.id;
                handleValidarRespuesta(
                    await store.dispatch('api/apiPostToken', {
                        direccion: version ? `/sync/archivos/${registro._id}/restaurar-version` : `/sync/entradas/${registro._id}/restaurar`,
                        datosJson
                    })
                );
            }
            confirmacionVisible.value = false;
            historialVisible.value = false;
            await handleCargarContenido();
            toast.add({ severity: 'success', summary: 'Gekko Sync', detail: 'Operación completada.', life: 3000 });
        });
    const handleCargarArchivados = async () => {
        const res = handleValidarRespuesta(await store.dispatch('api/apiGetToken', {
            direccion: `/sync/espacios/archivados?limite=${limite}&offset=${offsetArchivados.value}`
        }));
        archivados.value = res.datos.espacios;
    };
    const handleMostrarArchivados = () => handleEjecutar(async () => {
        offsetArchivados.value = 0;
        await handleCargarArchivados();
        archivadosVisible.value = true;
    });
    const handlePaginarArchivados = paso => handleEjecutar(async () => {
        offsetArchivados.value = Math.max(0, offsetArchivados.value + paso * limite);
        await handleCargarArchivados();
    });
    const handleRenombrar = registro => {
        seleccionado.value = registro;
        movimiento.value = 'renombrar';
        nombre.value = registro.nombre;
        mensajeError.value = '';
        formularioVisible.value = true;
    };
    const handleCargarEnlaces = async () => {
        const res = handleValidarRespuesta(await store.dispatch('api/apiGetToken', {
            direccion: `/sync/archivos/${archivoCompartido.value._id}/enlaces?limite=${limite}&offset=${offsetEnlaces.value}`
        }));
        enlaces.value = res.datos.enlaces;
    };
    const handleCompartir = registro => handleEjecutar(async () => {
        archivoCompartido.value = registro;
        usarVigencia.value = true; usarLimite.value = true; limiteEnlace.value = 5;
        fechaEnlace.value = new Date(Date.now() + 7 * 86400000);
        enlaceGenerado.value = ''; offsetEnlaces.value = 0;
        await handleCargarEnlaces();
        compartirVisible.value = true;
    });
    const handleGenerarEnlace = () => handleEjecutar(async () => {
        if (!usarVigencia.value && !usarLimite.value) throw new Error('Activa vigencia, límite de descargas o ambos.');
        if (usarVigencia.value && (!(fechaEnlace.value instanceof Date) || fechaEnlace.value <= new Date())) throw new Error('Selecciona una fecha futura.');
        if (usarLimite.value && (!Number.isInteger(limiteEnlace.value) || limiteEnlace.value < 1)) throw new Error('Indica un número de descargas válido.');
        const res = handleValidarRespuesta(await store.dispatch('api/apiPostToken', {
            direccion: `/sync/archivos/${archivoCompartido.value._id}/enlaces`,
            datosJson: { vence: usarVigencia.value ? fechaEnlace.value.toISOString() : null, limite_descargas: usarLimite.value ? limiteEnlace.value : null }
        }));
        const token = res.datos.ruta.split('/').pop();
        const base = new URL(import.meta.env.BASE_URL, window.location.origin).href;
        enlaceGenerado.value = new URL(`compartido/${encodeURIComponent(token)}`, base).href;
        offsetEnlaces.value = 0;
        await handleCargarEnlaces();
    });
    const handleCopiarEnlace = async () => {
        try {
            await navigator.clipboard.writeText(enlaceGenerado.value);
            toast.add({ severity: 'success', summary: 'Compartir', detail: 'Enlace copiado.', life: 2500 });
        } catch {
            toast.add({ severity: 'info', summary: 'Compartir', detail: 'Selecciona y copia manualmente el enlace.', life: 4000 });
        }
    };
    const handleRevocarEnlace = enlace => handleEjecutar(async () => {
        handleValidarRespuesta(await store.dispatch('api/apiPostToken', { direccion: `/sync/enlaces/${enlace.id}/revocar`, datosJson: {} }));
        enlaceGenerado.value = '';
        await handleCargarEnlaces();
    });
    const handlePaginarEnlaces = paso => handleEjecutar(async () => {
        offsetEnlaces.value = Math.max(0, offsetEnlaces.value + paso * limite);
        await handleCargarEnlaces();
    });
    const handleEstadoEnlace = enlace => enlace.revocado ? 'Revocado' : enlace.vence && new Date(enlace.vence) <= new Date() ? 'Vencido' : enlace.limite_descargas !== null && enlace.descargas >= enlace.limite_descargas ? 'Agotado' : 'Activo';
    const handleIconoArchivo = nombre => {
        const extension = nombre.split('.').pop().toLowerCase();
        if (['doc', 'docx', 'odt'].includes(extension)) return 'fa-solid fa-file-word';
        if (['xls', 'xlsx', 'csv', 'ods'].includes(extension)) return 'fa-solid fa-file-excel';
        if (['ppt', 'pptx', 'odp'].includes(extension)) return 'fa-solid fa-file-powerpoint';
        if (extension === 'pdf') return 'fa-solid fa-file-pdf';
        if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(extension)) return 'fa-solid fa-file-image';
        if (['zip', 'rar', '7z', 'gz'].includes(extension)) return 'fa-solid fa-file-zipper';
        return 'fa-solid fa-file';
    };
    const handleAccionesRegistro = registro => {
        const permiso = accion => handleTienePermiso(accion, registro);
        const archivo = registro.tipo === 'archivo';
        return [
            { label: 'Restaurar', icon: 'pi pi-replay', visible: papelera.value && permiso('restaurar'), ejecutar: () => handleMostrarConfirmacion('restaurar', registro) },
            { label: 'Renombrar', icon: 'pi pi-pencil', visible: !papelera.value && permiso('escribir'), ejecutar: () => handleRenombrar(registro) },
            { label: 'Enlace de carpeta', icon: 'pi pi-link', visible: !papelera.value && !archivo && permiso('listar'), ejecutar: () => handleEnlaceCarpeta(registro) },
            { label: 'Visualizar', icon: 'pi pi-eye', visible: !papelera.value && archivo && permiso('visualizar') && handleTipoVistaPrevia(registro), ejecutar: () => handleVisualizar(registro) },
            { label: 'Compartir', icon: 'pi pi-share-alt', visible: !papelera.value && archivo && permiso('compartir') && permiso('descargar'), ejecutar: () => handleCompartir(registro) },
            { label: 'Descargar', icon: 'pi pi-download', visible: !papelera.value && archivo && permiso('descargar'), ejecutar: () => handleDescargar(registro) },
            { label: 'Permisos de descarga', icon: 'pi pi-lock', visible: !papelera.value && archivo && permiso('administrar_descargas'), ejecutar: () => handlePermisosDescarga(registro) },
            { label: 'Versiones', icon: 'pi pi-history', visible: !papelera.value && archivo && permiso('historial'), ejecutar: () => handleHistorial(registro) },
            { label: 'Nueva versión', icon: 'pi pi-upload', visible: !papelera.value && archivo && permiso('cargar'), ejecutar: () => handleMostrarCarga(registro) },
            { label: 'A papelera', icon: 'pi pi-trash', severity: 'danger', visible: !papelera.value && permiso('eliminar'), ejecutar: () => handleMostrarConfirmacion('eliminar', registro) }
        ].filter(accion => accion.visible);
    };
    const handleEnlaceCarpeta = (registro = null) => {
        if (!espacioId.value || papelera.value || !opciones.resolverEnlace) return;
        const consulta = { espacio: espacioId.value };
        const carpeta = registro?._id || carpetaActual.value;
        if (carpeta) consulta.carpeta = carpeta;
        enlaceCarpeta.value = opciones.resolverEnlace(consultaCarpeta(consulta));
        enlaceCarpetaVisible.value = true;
    };
    const handleCopiarEnlaceCarpeta = async () => {
        try {
            await navigator.clipboard.writeText(enlaceCarpeta.value);
            toast.add({ severity: 'success', summary: 'Carpeta', detail: 'Enlace copiado.', life: 2500 });
        } catch {
            toast.add({ severity: 'info', summary: 'Carpeta', detail: 'Selecciona el enlace y cópialo manualmente.', life: 4000 });
        }
    };
    const handleCargarPermisosDescarga = async () => {
        const respuesta = handleValidarRespuesta(await store.dispatch('api/apiGetTokenSinCargando', {
            direccion: `/sync/archivos/${archivoPermisosDescarga.value._id}/permisos-descarga`
        }));
        autorizadosDescarga.value = respuesta.datos.autorizados;
        revisionDescargas.value = respuesta.datos.revision_descargas;
    };
    const handleCargarUsuariosDescarga = async (agregar = false) => {
        const offset = agregar ? offsetUsuariosDescarga.value : 0;
        const parametros = new URLSearchParams({ buscar: buscarUsuarioDescarga.value, offset, limite: 50 });
        const respuesta = handleValidarRespuesta(await store.dispatch('api/apiGetTokenSinCargando', {
            direccion: `/sync/archivos/${archivoPermisosDescarga.value._id}/usuarios-descarga?${parametros}`
        }));
        const usuarios = respuesta.datos.usuarios;
        usuariosDescarga.value = agregar ? [...usuariosDescarga.value, ...usuarios] : usuarios;
        offsetUsuariosDescarga.value = offset + usuarios.length;
        hayMasUsuariosDescarga.value = usuarios.length === 50;
    };
    const handlePermisosDescarga = registro => handleEjecutar(async () => {
        archivoPermisosDescarga.value = registro;
        buscarUsuarioDescarga.value = ''; usuarioDescarga.value = null;
        autorizadosDescarga.value = []; usuariosDescarga.value = [];
        permisosDescargaVisible.value = true;
        await handleCargarPermisosDescarga();
        await handleCargarUsuariosDescarga();
    });
    const handleBuscarUsuariosDescarga = () => handleEjecutar(async () => {
        usuarioDescarga.value = null;
        await handleCargarUsuariosDescarga();
    });
    const handleMasUsuariosDescarga = () => handleEjecutar(() => handleCargarUsuariosDescarga(true));
    const handleAutorizarDescarga = (usuario, permitir) => handleEjecutar(async () => {
        try {
            handleValidarRespuesta(await store.dispatch('api/apiPutToken', {
                direccion: `/sync/archivos/${archivoPermisosDescarga.value._id}/permisos-descarga`,
                datosJson: { usuario, permitir, revision_descargas: revisionDescargas.value }
            }));
        } catch (e) { await handleCargarPermisosDescarga(); throw e; }
        await handleCargarPermisosDescarga();
        usuarioDescarga.value = null;
        toast.add({ severity: 'success', summary: 'Permisos de descarga', detail: permitir ? 'Descarga autorizada.' : 'Autorización retirada.', life: 3000 });
    });
    let pantallaVisor;
    const handlePantallaVisor = () => { visorVertical.value = pantallaVisor.matches; };
    onMounted(() => {
        pantallaVisor = window.matchMedia('(max-width: 900px)');
        handlePantallaVisor();
        pantallaVisor.addEventListener('change', handlePantallaVisor);
    });
    onBeforeUnmount(() => pantallaVisor?.removeEventListener('change', handlePantallaVisor));
    onMounted(handleActualizar);
    return {
        enlaceCarpetaVisible, enlaceCarpeta, handleEnlaceCarpeta, handleCopiarEnlaceCarpeta,
        permisosDescargaVisible, archivoPermisosDescarga, autorizadosDescarga, usuariosDescarga, buscarUsuarioDescarga,
        usuarioDescarga, hayMasUsuariosDescarga, handleBuscarUsuariosDescarga, handleMasUsuariosDescarga, handleAutorizarDescarga,
        vistaPreviaActiva, visorAmpliado, archivoActivo, busqueda, registrosVisibles, vistaArchivos, visorVertical,
        handleSeleccionarArchivo, handleAccionesRegistro,
        visorVisible, visorCargando, visorError, visorNombre, visorUrl, visorTipo, visorOffice, visorLibro, visorDocumento,
        handleVisualizar, handleTipoVistaPrevia, handleErrorVisor,
        compartirVisible, archivoCompartido, usarVigencia, usarLimite, fechaEnlace, limiteEnlace, enlaceGenerado, enlaces, offsetEnlaces,
        handleCompartir, handleGenerarEnlace, handleCopiarEnlace, handleRevocarEnlace, handlePaginarEnlaces, handleEstadoEnlace,
        archivadosVisible, archivados, offsetArchivados, handleMostrarArchivados, handlePaginarArchivados,
        ...instaladorWindows,
        handleRenombrar,
        espacios,
        espacioId,
        registros,
        ruta,
        cargando,
        mensajeError,
        papelera,
        administrador,
        offset,
        hayMasEspacios,
        limite,
        formularioVisible,
        movimiento,
        nombre,
        historialVisible,
        seleccionado,
        versiones,
        offsetVersiones,
        confirmacionVisible,
        pendiente,
        cargaVisible,
        destinoCarga,
        controlCarga,
        espacioActual,
        rutaInicio,
        rutaItems,
        handleTienePermiso,
        handleFecha,
        handleTamano, handleIconoArchivo,
        handleActualizar,
        handleMasEspacios,
        handleCambiarEspacio,
        handleCambiarPapelera,
        handleAbrirCarpeta,
        handleNavegar,
        handlePaginar,
        handleMostrarFormulario,
        handleGuardar,
        handleMostrarCarga,
        handleSubirArchivo,
        handleDescargar,
        handleHistorial,
        handlePaginarHistorial,
        handleMostrarConfirmacion,
        handleConfirmar
    };
};

export default useProceso;
