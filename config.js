/* ============================================================================
   SORPRESA BEBÉ — CONFIGURACIÓN DE LA BASE DE DATOS
   ----------------------------------------------------------------------------
   ESTE ES EL ÚNICO ARCHIVO QUE HAY QUE EDITAR PARA CONECTAR LA PÁGINA
   CON MONGODB ATLAS.

   ⚠️  IMPORTANTE — LEE ESTO ANTES DE PUBLICAR:
   - Los valores de abajo son PLACEHOLDERS (vacíos). No hay ninguna
     credencial real en este proyecto.
   - La Data API Key queda VISIBLE en el código de una página pública.
     Úsala SOLO para datos públicos (votos, cartas y registros del
     newsletter). Nunca pongas aquí datos privados, ni la contraseña
     de tu cuenta de Atlas, ni una CLABE real, ni teléfonos/correos
     personales tuyos.
   - Si dejas los valores vacíos, la página SIGUE FUNCIONANDO: los
     votos, cartas y registros se guardan solo en el celular de cada
     persona (localStorage) y se muestra un aviso discreto de que los
     resultados compartidos necesitan la Data API configurada.
   - Para envíos reales de WhatsApp o correo, el registro del footer
     SOLO GUARDA el contacto. Enviar mensajes necesita un servicio
     aparte (por ejemplo Resend/SendGrid para correo, o la API de
     WhatsApp Business / Twilio para WhatsApp). Ver README.md.

   CÓMO CONSEGUIR ESTOS VALORES (paso a paso en README.md):
   1. Crea un clúster gratuito M0 en MongoDB Atlas.
   2. En Atlas: App Services / Data API → habilita la Data API y
      crea una API Key.
   3. Copia la URL base de la Data API (termina en /app/<app-id>/endpoint/data/v1).
   4. Crea la base de datos y las colecciones (o deja que se creen
      solas al primer insert).
   ========================================================================== */

window.SORPRESA_CONFIG = {
  // Ejemplo: "https://data.mongodb-api.com/app/data-xxxxx/endpoint/data/v1"
  DATA_API_URL: "",

  // API Key de la Data API de Atlas (NO la contraseña de tu cuenta).
  API_KEY: "",

  // Nombre del clúster / data source en Atlas, por ejemplo "Cluster0".
  DATA_SOURCE: "",

  // Nombre de la base de datos.
  DATABASE: "sorpresa_bebe",

  // Nombres de las colecciones.
  COLLECTIONS: {
    votes: "votes",                 // { name, sex: "nino" | "nina", createdAt }
    letters: "letters",             // { author, message, createdAt }
    subscriptions: "subscriptions"  // { channel: "whatsapp" | "email", contact, createdAt }
  }
};
