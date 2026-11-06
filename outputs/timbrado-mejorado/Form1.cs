using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Windows.Forms;
using System.Xml;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using timbradoContpaq.clases;

namespace timbradoContpaq
{
    public partial class Form1 : Form
    {
        private static readonly HttpClient ClienteApi = CrearClienteApi();
        private readonly SemaphoreSlim bloqueoProceso = new SemaphoreSlim(1, 1);
        private readonly string carpetaDatos = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Gekko", "Timbrado");
        private TreeNode nodoFacturas;
        private TreeNode nodoComplementos;
        private int contadorSegundos;
        private bool ejecutando;
        private bool preguntandoMinimizar;
        private int correctos;
        private int errores;
        private int pendientes;

        public Form1() { InitializeComponent(); }

        public class SolicitudTimbrado
        {
            public string _id { get; set; }
            public string company_id { get; set; }
            public string clave_csd { get; set; }
            public string compania { get; set; }
            public string rfc { get; set; }
            public string ruta_contpaq { get; set; }
            public string factura_serie { get; set; }
            public string factura_folio { get; set; }
            public string xml { get; set; }
            public string metodo_pago { get; set; }
            public string forma_pago { get; set; }
            public string uso_cfdi { get; set; }
            public decimal total { get; set; }
        }

        public class DatosTimbreCFDI
        {
            public string UUID { get; set; }
            public string FechaTimbrado { get; set; }
            public string SelloCFD { get; set; }
            public string NoCertificadoSAT { get; set; }
            public string SelloSAT { get; set; }
        }

        public class ResultadoApi
        {
            public string solicitud_id { get; set; }
            public string rfc { get; set; }
            public string compania { get; set; }
            public bool exitoso { get; set; }
            public string uuid { get; set; }
            public int error { get; set; }
            public string mensaje { get; set; }
            public string fecha_timbrado { get; set; }
            public string no_certificado_sat { get; set; }
            public string sello_cfd { get; set; }
            public string sello_sat { get; set; }
            public string cfdi { get; set; }
        }

        public class EstadoLocal
        {
            public string SolicitudId { get; set; }
            public bool Complemento { get; set; }
            public string Rfc { get; set; }
            public string Compania { get; set; }
            public string Serie { get; set; }
            public string Folio { get; set; }
            public string CarpetaIntento { get; set; }
            public string UuidSdk { get; set; }
            public string Etapa { get; set; }
            public string Detalle { get; set; }
            public DateTime ActualizadoUtc { get; set; }
            public ResultadoApi Resultado { get; set; }
            // Nunca almacenar clave_csd en este archivo.
        }

        private static HttpClient CrearClienteApi()
        {
            return new HttpClient {
                BaseAddress = new Uri("https://gekkoapi.dev-jskarma.net/api/"),
                Timeout = TimeSpan.FromSeconds(60)
            };
        }

        private static string Endpoint(bool complemento, string accion)
        {
            return "solicitud_detallada/" + (complemento ? "complementos_pago/" : "") + accion;
        }

        private async Task<JObject> ConsultarApi(string endpoint, object cuerpo = null)
        {
            using (var request = new HttpRequestMessage(cuerpo == null ? HttpMethod.Get : HttpMethod.Post, endpoint))
            {
                if (cuerpo != null)
                    request.Content = new StringContent(JsonConvert.SerializeObject(cuerpo), Encoding.UTF8, "application/json");
                using (var response = await ClienteApi.SendAsync(request))
                {
                    string texto = await response.Content.ReadAsStringAsync();
                    if (!response.IsSuccessStatusCode)
                        throw new InvalidOperationException("API " + (int)response.StatusCode + ": " + texto);
                    JObject json;
                    try { json = JObject.Parse(texto); }
                    catch (JsonException ex) { throw new InvalidOperationException("La API no devolvió JSON válido.", ex); }
                    int status;
                    if (int.TryParse((string)json["status"], out status) && status >= 400)
                        throw new InvalidOperationException((string)json["mensaje"] ?? "La API reportó un error.");
                    return json;
                }
            }
        }

        private static JObject Contenido(JObject json)
        {
            // Los routers actuales devuelven {mensaje, datos}; admitir también {status, data}.
            return json["data"] as JObject ?? json;
        }

        private async Task<List<SolicitudTimbrado>> ObtenerPendientesLista(bool complemento)
        {
            var json = Contenido(await ConsultarApi(Endpoint(complemento, "pendientes_timbrado")));
            var lista = json["datos"]?["solicitudes"] as JArray;
            if (lista == null) throw new InvalidOperationException("La API no devolvió datos.solicitudes.");
            return lista.ToObject<List<SolicitudTimbrado>>() ?? new List<SolicitudTimbrado>();
        }

        private string RutaEstado(string id, bool complemento)
        {
            if (string.IsNullOrWhiteSpace(id) || id.Any(c => !char.IsLetterOrDigit(c)))
                throw new InvalidOperationException("Identificador de solicitud inválido.");
            return Path.Combine(carpetaDatos, "estados", (complemento ? "P_" : "F_") + id + ".json");
        }

        private void GuardarEstado(EstadoLocal estado)
        {
            estado.ActualizadoUtc = DateTime.UtcNow;
            string destino = RutaEstado(estado.SolicitudId, estado.Complemento);
            Directory.CreateDirectory(Path.GetDirectoryName(destino));
            string temporal = destino + "." + Guid.NewGuid().ToString("N") + ".tmp";
            try
            {
                byte[] bytes = new UTF8Encoding(false).GetBytes(JsonConvert.SerializeObject(estado, Newtonsoft.Json.Formatting.Indented));
                using (var stream = new FileStream(temporal, FileMode.CreateNew, FileAccess.Write, FileShare.None))
                {
                    stream.Write(bytes, 0, bytes.Length);
                    stream.Flush(true);
                }
                if (File.Exists(destino)) File.Replace(temporal, destino, null);
                else File.Move(temporal, destino);
            }
            finally { if (File.Exists(temporal)) File.Delete(temporal); }
        }

        private static EstadoLocal LeerEstado(string ruta)
        {
            var estado = JsonConvert.DeserializeObject<EstadoLocal>(File.ReadAllText(ruta, Encoding.UTF8));
            if (estado == null || string.IsNullOrWhiteSpace(estado.SolicitudId))
                throw new InvalidDataException("Estado local inválido: " + ruta);
            return estado;
        }

        private static XmlDocument CargarXml(string texto)
        {
            var settings = new XmlReaderSettings { DtdProcessing = DtdProcessing.Prohibit, XmlResolver = null };
            var xml = new XmlDocument { XmlResolver = null, PreserveWhitespace = true };
            using (var reader = XmlReader.Create(new StringReader(texto), settings)) xml.Load(reader);
            if (xml.DocumentElement == null || xml.DocumentElement.LocalName != "Comprobante"
                || xml.DocumentElement.NamespaceURI != "http://www.sat.gob.mx/cfd/4")
                throw new InvalidDataException("El XML no es un CFDI 4.0.");
            return xml;
        }

        public DatosTimbreCFDI LeerDatosTimbre(string cfdiXml)
        {
            var xml = CargarXml(cfdiXml);
            var ns = new XmlNamespaceManager(xml.NameTable);
            ns.AddNamespace("c", "http://www.sat.gob.mx/cfd/4");
            ns.AddNamespace("t", "http://www.sat.gob.mx/TimbreFiscalDigital");
            var nodos = xml.SelectNodes("/c:Comprobante/c:Complemento/t:TimbreFiscalDigital", ns);
            if (nodos == null || nodos.Count != 1) throw new InvalidDataException("Se esperaba un solo TimbreFiscalDigital.");
            var timbre = (XmlElement)nodos[0];
            Guid uuid;
            if (!Guid.TryParse(timbre.GetAttribute("UUID"), out uuid))
                throw new InvalidDataException("El UUID del timbre no es válido.");
            var resultado = new DatosTimbreCFDI {
                UUID = uuid.ToString().ToUpperInvariant(), FechaTimbrado = timbre.GetAttribute("FechaTimbrado"),
                SelloCFD = timbre.GetAttribute("SelloCFD"), NoCertificadoSAT = timbre.GetAttribute("NoCertificadoSAT"),
                SelloSAT = timbre.GetAttribute("SelloSAT")
            };
            if (string.IsNullOrWhiteSpace(resultado.FechaTimbrado) || string.IsNullOrWhiteSpace(resultado.SelloCFD)
                || string.IsNullOrWhiteSpace(resultado.NoCertificadoSAT) || string.IsNullOrWhiteSpace(resultado.SelloSAT))
                throw new InvalidDataException("El timbre está incompleto.");
            return resultado;
        }

        private void ValidarIdentidad(string texto, EstadoLocal estado, bool timbrado)
        {
            var xml = CargarXml(texto);
            var root = xml.DocumentElement;
            var ns = new XmlNamespaceManager(xml.NameTable);
            ns.AddNamespace("c", "http://www.sat.gob.mx/cfd/4");
            var emisor = xml.SelectSingleNode("/c:Comprobante/c:Emisor", ns) as XmlElement;
            if (emisor == null || !string.Equals(emisor.GetAttribute("Rfc"), estado.Rfc, StringComparison.OrdinalIgnoreCase)
                || !string.Equals(root.GetAttribute("Serie"), estado.Serie, StringComparison.Ordinal)
                || root.GetAttribute("Folio") != estado.Folio
                || root.GetAttribute("TipoDeComprobante") != (estado.Complemento ? "P" : "I"))
                throw new InvalidDataException("El XML no corresponde al RFC, serie, folio o tipo esperado.");
            bool tieneTimbre = xml.GetElementsByTagName("TimbreFiscalDigital", "http://www.sat.gob.mx/TimbreFiscalDigital").Count > 0;
            if (tieneTimbre != timbrado) throw new InvalidDataException("Estado de timbrado inesperado en el XML.");
        }

        private async Task ProcesarSolicitud(SolicitudTimbrado solicitud, bool complemento)
        {
            if (solicitud == null) throw new InvalidDataException("La lista contiene una solicitud vacía.");
            string ruta = RutaEstado(solicitud._id, complemento);
            if (File.Exists(ruta))
            {
                // También conservar Confirmado: una consulta obsoleta no debe volver a timbrar.
                await RecuperarEstado(LeerEstado(ruta));
                return;
            }
            if (string.IsNullOrWhiteSpace(solicitud.ruta_contpaq) || !Path.IsPathRooted(solicitud.ruta_contpaq)
                || !Directory.Exists(solicitud.ruta_contpaq))
                throw new InvalidOperationException("La empresa no tiene una ruta CONTPAQi válida y accesible.");
            if (string.IsNullOrWhiteSpace(solicitud.clave_csd))
                throw new InvalidOperationException("La empresa no tiene clave CSD.");
            if (string.IsNullOrWhiteSpace(solicitud.rfc)) throw new InvalidDataException("Falta el RFC de la empresa.");

            CambiarEstado("Preparando " + solicitud._id + "...");
            var respuesta = Contenido(await ConsultarApi(Endpoint(complemento, "preparar_timbrado"), new { solicitud_id = solicitud._id }));
            var datos = respuesta["datos"] as JObject;
            string texto = (string)datos?["xml"];
            if (datos == null || (string)datos["solicitud_id"] != solicitud._id || string.IsNullOrWhiteSpace(texto))
                throw new InvalidDataException("La preparación no devolvió el XML de la solicitud esperada.");
            var estado = new EstadoLocal {
                SolicitudId = solicitud._id, Complemento = complemento, Rfc = solicitud.rfc.Trim().ToUpperInvariant(),
                Compania = solicitud.compania, Serie = (string)datos["serie"] ?? "", Folio = (string)datos["folio"],
                CarpetaIntento = Path.Combine(carpetaDatos, "xml", (complemento ? "P_" : "F_") + solicitud._id, Guid.NewGuid().ToString("N"))
            };
            ValidarIdentidad(texto, estado, false);
            Directory.CreateDirectory(estado.CarpetaIntento);
            string rutaXml = Path.Combine(estado.CarpetaIntento, "entrada.xml");
            File.WriteAllText(rutaXml, texto, new UTF8Encoding(false));

            CambiarEstado("Timbrando " + estado.Serie + "-" + estado.Folio + "...");
            // Toda la sesión nativa permanece en un único hilo STA sin await.
            await EjecutarEnSta(() => {
                using (var sdk = new timbrado())
                {
                    ExigirSdk(sdk.iniciarSDK());
                    ExigirSdk(sdk.iniciarEmpresa(solicitud.ruta_contpaq));
                    ExigirSdk(sdk.fInicializaLicenseInfo());
                    // Debe persistir ANTES de entrar a fTimbraXML. Si esto falla, no se timbra.
                    estado.Etapa = "ResultadoIncierto";
                    estado.Detalle = "Se inició un intento; recuperar o conciliar antes de volver a timbrar.";
                    GuardarEstado(estado);
                    var resultado = sdk.timbrarFactura(rutaXml, "200", estado.CarpetaIntento + Path.DirectorySeparatorChar, solicitud.clave_csd);
                    estado.UuidSdk = resultado.UUID;
                    estado.Detalle = "SDK " + resultado.error + ": " + resultado.mensaje;
                    GuardarEstado(estado);
                    // Incluso ante error SDK, buscar el XML: la respuesta puede ser ambigua.
                }
            });
            await RecuperarEstado(estado);
        }

        private static void ExigirSdk(timbrado.resultadoSDK resultado)
        {
            if (resultado == null || resultado.error != 0)
                throw new InvalidOperationException(resultado == null ? "El SDK no devolvió respuesta." : resultado.mensaje);
        }

        private static Task EjecutarEnSta(Action accion)
        {
            var completion = new TaskCompletionSource<bool>(TaskCreationOptions.RunContinuationsAsynchronously);
            var thread = new Thread(() => {
                try { accion(); completion.TrySetResult(true); }
                catch (Exception ex) { completion.TrySetException(ex); }
            });
            thread.IsBackground = false;
            thread.SetApartmentState(ApartmentState.STA);
            thread.Start();
            return completion.Task;
        }

        private ResultadoApi RecuperarXml(EstadoLocal estado)
        {
            if (!Directory.Exists(estado.CarpetaIntento)) return null;
            var candidatos = new List<ResultadoApi>();
            foreach (string ruta in Directory.GetFiles(estado.CarpetaIntento, "*.xml"))
            {
                if (string.Equals(Path.GetFileName(ruta), "entrada.xml", StringComparison.OrdinalIgnoreCase)) continue;
                try
                {
                    string texto = File.ReadAllText(ruta, Encoding.UTF8);
                    ValidarIdentidad(texto, estado, true);
                    var timbre = LeerDatosTimbre(texto);
                    if (!string.IsNullOrWhiteSpace(estado.UuidSdk)
                        && !string.Equals(timbre.UUID, estado.UuidSdk, StringComparison.OrdinalIgnoreCase)) continue;
                    candidatos.Add(new ResultadoApi {
                        solicitud_id = estado.SolicitudId, rfc = estado.Rfc, compania = estado.Compania,
                        exitoso = true, uuid = timbre.UUID, error = 0, mensaje = "Timbrado correcto",
                        fecha_timbrado = timbre.FechaTimbrado, no_certificado_sat = timbre.NoCertificadoSAT,
                        sello_cfd = timbre.SelloCFD, sello_sat = timbre.SelloSAT, cfdi = texto
                    });
                }
                catch (XmlException ex) { Trace.WriteLine(ex); }
                catch (InvalidDataException ex) { Trace.WriteLine(ex); }
            }
            var uuids = candidatos.Select(x => x.uuid).Distinct(StringComparer.OrdinalIgnoreCase).ToList();
            if (uuids.Count > 1) throw new InvalidDataException("Hay varios UUID para este intento; requiere conciliación manual.");
            return candidatos.FirstOrDefault();
        }

        private async Task RecuperarEstado(EstadoLocal estado)
        {
            if (estado.Etapa == "Confirmado") return;
            if (estado.Resultado == null)
            {
                estado.Resultado = RecuperarXml(estado);
                if (estado.Resultado == null)
                {
                    pendientes++;
                    AgregarLogTree(estado.Complemento, false, estado.Rfc,
                        estado.SolicitudId + " requiere conciliación; no se volverá a timbrar. " + estado.Detalle);
                    return;
                }
                estado.Etapa = "PendienteApi";
                GuardarEstado(estado);
            }
            // Reenviar exclusivamente el mismo XML y UUID, nunca preparar ni llamar al SDK aquí.
            try
            {
                var respuesta = Contenido(await ConsultarApi(Endpoint(estado.Complemento, "guardar_timbrado"), estado.Resultado));
                var datos = respuesta["datos"] as JObject;
                if (datos == null || (string)datos["solicitud_id"] != estado.SolicitudId
                    || !string.Equals((string)datos["uuid"], estado.Resultado.uuid, StringComparison.OrdinalIgnoreCase)
                    || (string)datos["estatus"] != "timbrada")
                    throw new InvalidDataException("La API no confirmó solicitud, UUID y estatus timbrada.");
                estado.Etapa = "Confirmado";
                estado.Detalle = "Resultado confirmado por la API.";
                GuardarEstado(estado);
                correctos++;
                AgregarLogTree(estado.Complemento, true, estado.Rfc,
                    estado.Serie + "-" + estado.Folio + " guardado. UUID: " + estado.Resultado.uuid);
            }
            catch (Exception ex)
            {
                pendientes++;
                AgregarLogTree(estado.Complemento, false, estado.Rfc,
                    estado.SolicitudId + " TIMBRADO; pendiente de confirmar en API: " + ex.Message);
            }
        }

        private async Task<HashSet<string>> RecuperarPendientesLocales()
        {
            var revisados = new HashSet<string>(StringComparer.Ordinal);
            string directorio = Path.Combine(carpetaDatos, "estados");
            Directory.CreateDirectory(directorio);
            foreach (string ruta in Directory.GetFiles(directorio, "*.json"))
            {
                // Un archivo corrupto detiene el ciclo: ignorarlo podría permitir otro timbrado.
                var estado = LeerEstado(ruta);
                revisados.Add((estado.Complemento ? "P_" : "F_") + estado.SolicitudId);
                await RecuperarEstado(estado);
            }
            return revisados;
        }

        private async Task ProcesarTipo(bool complemento, HashSet<string> revisados)
        {
            List<SolicitudTimbrado> solicitudes;
            try { solicitudes = await ObtenerPendientesLista(complemento); }
            catch (Exception ex)
            {
                errores++;
                AgregarLogTree(complemento, false, "API", "Consultar pendientes: " + ex.Message);
                return;
            }
            foreach (var solicitud in solicitudes)
            {
                string id = solicitud == null ? "" : solicitud._id;
                string clave = (complemento ? "P_" : "F_") + id;
                if (!revisados.Add(clave)) continue;
                try { await ProcesarSolicitud(solicitud, complemento); }
                catch (Exception ex)
                {
                    bool tieneEstado = false;
                    try { tieneEstado = File.Exists(RutaEstado(id, complemento)); }
                    catch (InvalidOperationException) { }
                    if (tieneEstado) pendientes++; else errores++;
                    AgregarLogTree(complemento, false, solicitud == null ? "" : solicitud.rfc,
                        id + (tieneEstado ? " pendiente de recuperación: " : " no se completó: ") + ex.Message);
                    // No enviar exitoso=false tras una respuesta incierta, un 409 o una excepción.
                    // guardar_timbrado actual no protege contra sobrescribir un éxito existente.
                }
            }
        }

        private async Task EjecutarProceso(bool manual)
        {
            if (!await bloqueoProceso.WaitAsync(0)) return;
            ejecutando = true;
            btnTimbrar.Enabled = false;
            try
            {
                Directory.CreateDirectory(carpetaDatos);
                FileStream bloqueoArchivo;
                try
                {
                    // Protege otras instancias bajo el mismo usuario de Windows.
                    bloqueoArchivo = new FileStream(Path.Combine(carpetaDatos, "proceso.lock"),
                        FileMode.OpenOrCreate, FileAccess.ReadWrite, FileShare.None);
                }
                catch (IOException)
                {
                    CambiarEstado("Otra instancia está procesando. Se omite este ciclo.");
                    return;
                }
                using (bloqueoArchivo)
                {
                    correctos = errores = pendientes = 0;
                    CambiarEstado("Recuperando resultados pendientes...");
                    var revisados = await RecuperarPendientesLocales();
                    await ProcesarTipo(false, revisados);
                    await ProcesarTipo(true, revisados);
                    CambiarEstado("Terminado. Confirmados: " + correctos + " | Errores: " + errores + " | Pendientes: " + pendientes);
                }
            }
            catch (Exception ex)
            {
                CambiarEstado("Proceso detenido: " + ex.Message);
                AgregarLogTree(false, false, "GENERAL", ex.Message);
                if (manual) MessageBox.Show(this, ex.Message, "Timbrado", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
            finally
            {
                ejecutando = false;
                btnTimbrar.Enabled = true;
                contadorSegundos = 0;
                bloqueoProceso.Release();
            }
        }

        private async void btnTimbrar_Click(object sender, EventArgs e) { await EjecutarProceso(true); }

        private async void timer1_Tick(object sender, EventArgs e)
        {
            if (ejecutando) return;
            if (++contadorSegundos < 60) return;
            contadorSegundos = 0;
            await EjecutarProceso(false);
        }

        private void InicializarLog()
        {
            treeView1.Nodes.Clear();
            nodoFacturas = treeView1.Nodes.Add("Facturas");
            nodoComplementos = treeView1.Nodes.Add("Complementos");
        }

        private void AgregarLogTree(bool complemento, bool correcto, string rfc, string mensaje)
        {
            if (IsDisposed || Disposing) return;
            if (InvokeRequired)
            {
                BeginInvoke(new Action(() => AgregarLogTree(complemento, correcto, rfc, mensaje)));
                return;
            }
            string linea = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss") + " " + (correcto ? "OK" : "REVISAR")
                + " " + rfc + " - " + mensaje;
            var padre = complemento ? nodoComplementos : nodoFacturas;
            if (padre != null)
            {
                var nodo = padre.Nodes.Add(linea);
                while (padre.Nodes.Count > 500) padre.Nodes.RemoveAt(0);
                padre.Expand();
                treeView1.SelectedNode = nodo;
                nodo.EnsureVisible();
            }
            try
            {
                string carpeta = Path.Combine(carpetaDatos, "logs");
                Directory.CreateDirectory(carpeta);
                File.AppendAllText(Path.Combine(carpeta, DateTime.Now.ToString("yyyy-MM-dd") + ".log"),
                    linea + Environment.NewLine, Encoding.UTF8);
            }
            catch (Exception ex) { Trace.WriteLine("No se pudo escribir el log: " + ex); }
        }

        private void CambiarEstado(string texto)
        {
            if (IsDisposed || Disposing) return;
            if (InvokeRequired) { BeginInvoke(new Action(() => CambiarEstado(texto))); return; }
            lblEstado.Text = texto;
        }

        private void Form1_Load(object sender, EventArgs e)
        {
            InicializarLog();
            timer1.Interval = 1000;
            timer1.Start();
            CambiarEstado("Listo. Ciclo automático cada 60 segundos.");
        }

        protected override void OnFormClosing(FormClosingEventArgs e)
        {
            if (ejecutando && e.CloseReason == CloseReason.UserClosing)
            {
                e.Cancel = true;
                MessageBox.Show(this, "Hay un proceso en ejecución. Espera a que termine; puedes minimizar la ventana.", "Timbrado");
            }
            base.OnFormClosing(e);
        }

        private void Form1_Resize(object sender, EventArgs e)
        {
            if (WindowState != FormWindowState.Minimized || preguntandoMinimizar) return;
            preguntandoMinimizar = true;
            try
            {
                var respuesta = MessageBox.Show(this,
                    "¿Deseas ocultar la aplicación junto al reloj?\n\nSí = Ocultar\nNo = Minimizar\nCancelar = Regresar",
                    "Minimizar Timbrado", MessageBoxButtons.YesNoCancel, MessageBoxIcon.Question);
                if (respuesta == DialogResult.Yes)
                {
                    Hide(); ShowInTaskbar = false; notifyIcon1.Visible = true;
                    notifyIcon1.ShowBalloonTip(2000, "Timbrado", "La aplicación continúa en segundo plano.", ToolTipIcon.Info);
                }
                else if (respuesta == DialogResult.Cancel) { WindowState = FormWindowState.Normal; Activate(); }
            }
            finally { preguntandoMinimizar = false; }
        }

        private void notifyIcon1_MouseDoubleClick(object sender, MouseEventArgs e) { MostrarAplicacion(); }
        private void notifyIcon1_DoubleClick(object sender, EventArgs e) { MostrarAplicacion(); }

        private void MostrarAplicacion()
        {
            Show(); ShowInTaskbar = true; WindowState = FormWindowState.Normal;
            notifyIcon1.Visible = false; Activate(); BringToFront();
        }
    }
}
