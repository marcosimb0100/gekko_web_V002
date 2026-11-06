# Timbrado WinForms: archivos completos

Proyecto de referencia: `timbradoContpaq`, .NET Framework 4.7.2, Newtonsoft.Json 13.0.4.

## Instalar

1. Respalda tus archivos actuales.
2. Sustituye `Form1.cs` y `clases/timbrado.cs` por los archivos incluidos.
3. Conserva `Form1.Designer.cs`, `Form1.resx`, `clases/SDK.cs`, `Program.cs` y los recursos existentes. Los nombres de los eventos del diseñador se mantienen.
4. Compila en **x86**, también en Release, porque el SDK instalado utiliza la DLL de CONTPAQi de 32 bits. El proyecto original tiene Release configurado como AnyCPU: cambia esa configuración en Visual Studio.
5. Comprueba la URL en `CrearClienteApi()`. Se conserva la URL del código original.
6. Antes de pasar a producción, prueba con la instalación y empresa de pruebas de CONTPAQi. La compilación local no ejecuta el SDK ni timbra comprobantes.

No se requieren paquetes nuevos. La clase `timbrado` incluida ahora implementa `IDisposable`; es necesario reemplazar ambos archivos juntos. Se conserva el código de concepto `200` del programa original: verifica que corresponda a la configuración de tus empresas.

## Comportamiento

- El botón y el temporizador comparten el mismo bloqueo. También se bloquean otras instancias de esta versión bajo el mismo usuario de Windows usando un archivo abierto de forma exclusiva.
- La sesión del SDK se ejecuta completa en un único hilo STA, sin operaciones HTTP intercaladas dentro de esa sesión.
- Se libera la empresa y el SDK incluso cuando falla la apertura, la licencia o el timbrado.
- Justo antes de llamar a `fTimbraXML`, se escribe un registro persistente. Si no se puede escribir, no se timbra.
- Un resultado incierto NO se vuelve a timbrar automáticamente, incluso si el SDK devolvió un error. No se clasifican códigos del SDK como reintentables sin conocer su significado.
- Si existe un XML timbrado válido en la carpeta del intento, se recupera y se guarda su UUID y contenido antes de enviarlos a la API.
- Si falla la API, el próximo ciclo reenvía exactamente el resultado guardado. No prepara otro XML ni llama al SDK.
- El éxito se cuenta después de comprobar la confirmación de solicitud, UUID y estatus `timbrada`.
- Los errores de preparación y los resultados inciertos quedan en el registro local. Esta versión no llama `guardar_timbrado` con `exitoso=false`, porque el endpoint actual puede sobrescribir un éxito existente y no dispone de un token de propiedad de la solicitud.
- Los estados confirmados se conservan para bloquear reprocesamientos ante listas obsoletas.

## Datos y recuperación

Todo se guarda bajo `%LOCALAPPDATA%\Gekko\Timbrado\`:

- `estados`: registro por solicitud y tipo, con etapa, XML timbrado y UUID cuando están disponibles. No contiene la contraseña del CSD.
- `xml`: una carpeta independiente por intento, con el XML de entrada y los archivos devueltos por el SDK.
- `logs`: registro diario de mensajes.
- `proceso.lock`: bloqueo entre instancias del mismo usuario. La existencia del archivo no significa que siga bloqueado; el bloqueo depende del identificador abierto del archivo.

Etapas: `ResultadoIncierto`, `PendienteApi`, `Confirmado`.

Si un intento queda incierto y no se puede recuperar su XML, concilia primero con CONTPAQi/PAC. Si recuperas el XML, colócalo en la carpeta exacta indicada por `CarpetaIntento`, con un nombre diferente de `entrada.xml`. El siguiente ciclo valida RFC, serie, folio, tipo y timbre, y sincroniza el resultado. Si existe `UuidSdk`, también exige que coincida.

No borres los estados para forzar un reintento. Un error de comunicación o un cierre después del envío puede ocultar un timbrado exitoso. La liberación de una solicitud sin timbre confirmado debe hacerse mediante un procedimiento de conciliación; esta entrega no incorpora una liberación automática ni un botón para ignorar el bloqueo.

Los archivos contienen datos fiscales; conserva y respalda esta carpeta. No cambies de usuario o de equipo ni elimines el diario local para volver a ejecutar una solicitud pendiente sin conciliarla primero. Esta versión no importa automáticamente los XML de `xml_temp` del programa anterior: revisa esos pendientes antes del cambio.

## Alcance de la protección

El bloqueo local no protege otras computadoras, otros usuarios de Windows ni versiones anteriores del programa. Para varios trabajadores se necesita una reclamación atómica por solicitud en la API, con token de intento, comprobación de propiedad y guardado idempotente. La API debe rechazar sobrescrituras de UUID y errores posteriores a un éxito. Estos endpoints nuevos no se inventan ni se invocan en este formulario.

La reserva atómica del folio en la API sigue siendo necesaria. El formulario no calcula ni incrementa folios. Durante el despliegue hay que detener los trabajadores anteriores y revisar solicitudes/XML pendientes.

La validación del XML aquí comprueba estructura e identidad del comprobante; no sustituye la validación criptográfica del sello ni una consulta al PAC/SAT. No se han ejecutado timbrados reales ni pruebas de integración con CONTPAQi o con la API remota.
