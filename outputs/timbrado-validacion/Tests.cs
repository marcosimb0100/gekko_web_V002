using System;
using System.IO;
using System.Reflection;
using System.Runtime.Serialization;
using System.Threading;
using System.Threading.Tasks;
using timbradoContpaq;

internal static class Tests
{
    private static int count;
    private static readonly string uuid = "7613A6F9-3361-45B8-8347-52B945FAD87B";
    private static string Xml(bool timbre)
    {
        return "<cfdi:Comprobante xmlns:cfdi='http://www.sat.gob.mx/cfd/4' xmlns:tfd='http://www.sat.gob.mx/TimbreFiscalDigital' Serie='MD' Folio='6689' TipoDeComprobante='I'>"
            + "<cfdi:Emisor Rfc='AAA010101AAA'/>"
            + (timbre ? "<cfdi:Complemento><tfd:TimbreFiscalDigital UUID='" + uuid + "' FechaTimbrado='2026-11-05T12:00:00' SelloCFD='cfd' NoCertificadoSAT='sat' SelloSAT='seal'/></cfdi:Complemento>" : "")
            + "</cfdi:Comprobante>";
    }
    private static void Check(bool ok, string name)
    {
        if (!ok) throw new Exception(name);
        count++; Console.WriteLine("OK " + name);
    }
    private static object Invoke(Form1 form, string name, params object[] args)
    {
        try { return typeof(Form1).GetMethod(name, BindingFlags.NonPublic | BindingFlags.Instance).Invoke(form, args); }
        catch (TargetInvocationException ex) { throw ex.InnerException; }
    }
    private static void Reject(Action action, string name)
    {
        try { action(); }
        catch { Check(true, name); return; }
        throw new Exception("No se rechazó: " + name);
    }
    private static Form1.EstadoLocal State(string directory)
    {
        return new Form1.EstadoLocal {
            SolicitudId = "012345678901234567890123", Rfc = "AAA010101AAA", Serie = "MD", Folio = "6689",
            CarpetaIntento = directory, Etapa = "ResultadoIncierto"
        };
    }
    public static int Main()
    {
        string directory = Path.Combine(Path.GetTempPath(), "gekko-tests-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(directory);
        try
        {
            // No construir controles ni cargar DLL nativas; solo ejercitar validación/diario.
            var form = (Form1)FormatterServices.GetUninitializedObject(typeof(Form1));
            typeof(Form1).GetField("carpetaDatos", BindingFlags.NonPublic | BindingFlags.Instance).SetValue(form, directory);
            Check(form.LeerDatosTimbre(Xml(true)).UUID == uuid, "Leer UUID válido");
            Reject(() => form.LeerDatosTimbre(Xml(false)), "Rechazar XML sin timbre");
            Reject(() => form.LeerDatosTimbre(Xml(true).Replace(uuid, "no-es-uuid")), "Rechazar UUID inválido");
            Reject(() => form.LeerDatosTimbre("<!DOCTYPE x [<!ENTITY e SYSTEM 'file:///does-not-exist'>]>" + Xml(true)), "Rechazar DTD");
            var state = State(directory);
            Invoke(form, "ValidarIdentidad", Xml(true), state, true);
            Check(true, "Identidad válida");
            Reject(() => Invoke(form, "ValidarIdentidad", Xml(true).Replace("AAA010101AAA", "BBB010101BBB"), state, true), "Rechazar RFC distinto");
            Reject(() => Invoke(form, "ValidarIdentidad", Xml(true).Replace("6689", "6690"), state, true), "Rechazar folio distinto");
            Reject(() => Invoke(form, "ValidarIdentidad", Xml(true), state, false), "No volver a enviar XML ya timbrado");
            Invoke(form, "GuardarEstado", state);
            state.Etapa = "PendienteApi";
            Invoke(form, "GuardarEstado", state);
            string path = (string)Invoke(form, "RutaEstado", state.SolicitudId, false);
            Check(File.ReadAllText(path).Contains("PendienteApi"), "Actualizar diario de forma persistente");
            Reject(() => Invoke(form, "RutaEstado", "../escape", false), "Rechazar escape de ruta");
            File.WriteAllText(Path.Combine(directory, "entrada.xml"), Xml(false));
            Check(Invoke(form, "RecuperarXml", state) == null, "Entrada sin timbre no recuperable");
            File.WriteAllText(Path.Combine(directory, uuid + ".xml"), Xml(true));
            var result = (Form1.ResultadoApi)Invoke(form, "RecuperarXml", state);
            Check(result.uuid == uuid && result.cfdi == Xml(true), "Recuperar exactamente XML y UUID originales");
            state.UuidSdk = Guid.NewGuid().ToString();
            Check(Invoke(form, "RecuperarXml", state) == null, "Rechazar UUID diferente al SDK");
            state.Etapa = "Confirmado";
            ((Task)Invoke(form, "RecuperarEstado", state)).GetAwaiter().GetResult();
            Check(true, "Confirmado no llama API ni SDK");
            var gate = new SemaphoreSlim(0, 1);
            typeof(Form1).GetField("bloqueoProceso", BindingFlags.NonPublic | BindingFlags.Instance).SetValue(form, gate);
            ((Task)Invoke(form, "EjecutarProceso", true)).GetAwaiter().GetResult();
            Check(gate.CurrentCount == 0, "Botón/temporizador omiten ejecución si existe proceso activo");
            Console.WriteLine(count + " verificaciones correctas; sin llamadas HTTP ni SDK.");
            return 0;
        }
        catch (Exception ex) { Console.Error.WriteLine(ex); return 1; }
        finally
        {
            string full = Path.GetFullPath(directory);
            string root = Path.GetFullPath(Path.GetTempPath()).TrimEnd(Path.DirectorySeparatorChar) + Path.DirectorySeparatorChar;
            if (!full.StartsWith(root, StringComparison.OrdinalIgnoreCase)
                || !Path.GetFileName(full).StartsWith("gekko-tests-", StringComparison.Ordinal))
                throw new InvalidOperationException("Ruta temporal inesperada.");
            Directory.Delete(full, true);
        }
    }
}
