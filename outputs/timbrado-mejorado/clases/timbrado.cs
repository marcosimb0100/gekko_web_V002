using Microsoft.Win32;
using System;
using System.Diagnostics;
using System.IO;
using System.Text;
using timbradoContpaq.sdk;

namespace timbradoContpaq.clases
{
    // Crear, usar y liberar esta instancia en un mismo hilo.
    public sealed class timbrado : IDisposable
    {
        public class resultadoSDK
        {
            public int error { get; set; }
            public string mensaje { get; set; }
        }

        public class resultadoSDKTimbrado : resultadoSDK
        {
            public string UUID { get; set; }
        }

        public const string NombreLlaveRegistroAdminpaq = @"SOFTWARE\Computación en Acción, SA CV\CONTPAQ I Facturacion";
        public const string NombrePaqAdminpaq = "CONTPAQ I Facturacion";
        private bool sdkIntentado;
        private bool empresaIntentada;
        private bool disposed;
        private string directorioAnterior;

        private static string Mensaje(int error, string etapa)
        {
            if (error == 0) return "";
            try
            {
                var buffer = new StringBuilder(1024);
                SDK.fError(error, buffer, buffer.Capacity);
                if (buffer.Length > 0) return etapa + ": " + buffer;
            }
            catch (Exception ex) { Trace.WriteLine(ex); }
            return etapa + ". Código SDK: " + error;
        }

        public resultadoSDK iniciarSDK()
        {
            try
            {
                using (var key = Registry.LocalMachine.OpenSubKey(NombreLlaveRegistroAdminpaq))
                {
                    var directorio = key == null ? null : key.GetValue("DirectorioBase") as string;
                    if (string.IsNullOrWhiteSpace(directorio) || !Directory.Exists(directorio))
                        throw new DirectoryNotFoundException("No se encontró DirectorioBase de CONTPAQi.");
                    directorioAnterior = Directory.GetCurrentDirectory();
                    Directory.SetCurrentDirectory(directorio);
                }
                sdkIntentado = true;
                int error = SDK.fSetNombrePAQ(NombrePaqAdminpaq);
                return new resultadoSDK { error = error, mensaje = Mensaje(error, "Inicializar SDK") };
            }
            catch (Exception ex) { return new resultadoSDK { error = -1, mensaje = ex.Message }; }
        }

        public resultadoSDK iniciarEmpresa(string rutaEmpresa)
        {
            try
            {
                empresaIntentada = true;
                int error = SDK.fAbreEmpresa(rutaEmpresa);
                return new resultadoSDK { error = error, mensaje = Mensaje(error, "Abrir empresa") };
            }
            catch (Exception ex) { return new resultadoSDK { error = -1, mensaje = ex.Message }; }
        }

        public resultadoSDK fInicializaLicenseInfo()
        {
            try
            {
                int error = SDK.fInicializaLicenseInfo(0);
                return new resultadoSDK { error = error, mensaje = Mensaje(error, "Inicializar licencia") };
            }
            catch (Exception ex) { return new resultadoSDK { error = -1, mensaje = ex.Message }; }
        }

        public resultadoSDKTimbrado timbrarFactura(string rutaXml, string concepto, string rutaSalida, string password)
        {
            // Sin reintentos automáticos: un error de comunicación puede ocultar un timbrado exitoso.
            var uuid = new StringBuilder(300);
            try
            {
                int error = SDK.fTimbraXML(rutaXml, concepto, uuid, "", rutaSalida, password, "");
                return new resultadoSDKTimbrado {
                    error = error, mensaje = Mensaje(error, "Timbrar XML"), UUID = uuid.ToString().Trim()
                };
            }
            catch (Exception ex)
            {
                return new resultadoSDKTimbrado { error = -1, mensaje = ex.Message, UUID = uuid.ToString().Trim() };
            }
        }

        public void Dispose()
        {
            if (disposed) return;
            disposed = true;
            // La liberación no debe transformar un timbrado exitoso en un error.
            try { if (empresaIntentada) SDK.fCierraEmpresa(); }
            catch (Exception ex) { Trace.WriteLine("Cerrar empresa: " + ex); }
            try { if (sdkIntentado) SDK.fTerminaSDK(); }
            catch (Exception ex) { Trace.WriteLine("Terminar SDK: " + ex); }
            try { if (directorioAnterior != null) Directory.SetCurrentDirectory(directorioAnterior); }
            catch (Exception ex) { Trace.WriteLine(ex); }
        }
    }
}
