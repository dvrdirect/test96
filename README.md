# ¡Vamos a ser papás! — Versión para GitHub Pages + MongoDB Atlas

Página estática (HTML + CSS + JS, sin build) que replica la sorpresa
para la familia: nombre secreto, saludo escalonado con “¡Sorpresa!”,
bebé animado, cochinito con CLABE de ejemplo, encuesta de nombre /
niño o niña, sección del bebé por semana, carta al bebé y newsletter.

**La página funciona sin base de datos**: si la Data API no está
configurada, los votos, cartas y registros se guardan solo en el
celular de cada persona (localStorage) y se muestra un aviso.
Para resultados compartidos entre todos, hay que conectar MongoDB
Atlas con su Data API (opción 1, la más directa para GitHub Pages).

> ⚠️ GitHub Pages solo sirve archivos estáticos. No se puede conectar
> MongoDB *directamente* desde el navegador de forma segura, porque
> la contraseña quedaría visible. La conexión es **indirecta, vía la
> Data API de Atlas**: la página le habla a la API por HTTPS y la API
> habla con MongoDB. La API Key queda visible en el código público:
> úsala solo para datos públicos (votos, cartas, registros) y con
> reglas/permisos limitados en Atlas. Nunca pongas aquí contraseñas,
> una CLABE real, ni teléfonos/correos personales.

> 📬 El registro del newsletter **solo guarda el contacto**. Enviar
> mensajes reales por WhatsApp o correo necesita un servicio aparte:
> correo con Resend/SendGrid (gratis en su plan inicial) y WhatsApp
> con la API de WhatsApp Business o Twilio (con plantilla aprobada
> y costo por mensaje). Sin ese servicio, los avisos se mandan a mano
> desde la lista guardada en la base de datos.

---

## Archivos

| Archivo | Qué es |
|---|---|
| `index.html` | Toda la página: saludo, bebé, cochinito, encuesta, sección del bebé, carta y footer. |
| `styles.css` | Paleta cálida (crema, durazno, rosa empolvado, dorado), Fredoka + Quicksand, mobile-first. |
| `script.js` | Flujo, encuesta, semanas, cartas, newsletter y cliente de la Data API + fallback local. |
| `config.js` | **Único archivo a editar**: URL de la Data API, API Key, data source, base de datos y colecciones. Todo con placeholders. |
| `.gitignore` | Evita subir `config.js` si lo prefieres (ver nota abajo). |

Familia permitida (solo estas): Daniel - Papá, Yareni - Mamá,
Luisa - Abuela, Rosario - Tía. Semana actual calculada desde la
última regla: **26 de septiembre de 2026** (semana 6 el 7 nov 2026).
Fecha esperada de nacimiento: **3 de julio de 2027 (estimada)**.

---

## Paso 1 — MongoDB Atlas (gratis, plan M0)

1. Crea una cuenta en https://www.mongodb.com/cloud/atlas
   (si ya tienes, entra).
2. Crea un **clúster gratuito M0** (Shared, Free). Elige la región
   más cercana (por ejemplo `us-east-1`).
3. En **Database Access**, crea un usuario de base de datos con
   contraseña segura. Anótala aparte, no la pegues en la página.
4. En **Network Access**, agrega `0.0.0.0/0` (permitir acceso desde
   cualquier lugar) — necesario para la Data API. Para producción
   real, luego se puede restringir.
5. Crea la base de datos `sorpresa_bebe` con las colecciones:
   `votes`, `letters`, `subscriptions`. (También se crean solas
   con el primer insert, pero crearlas a mano evita sorpresas.)
   - `votes`: `{ name, sex: "nino" | "nina", voter, createdAt }`
   - `letters`: `{ author, message, createdAt }`
   - `subscriptions`: `{ channel: "whatsapp" | "email", contact, createdAt }`

## Paso 2 — Habilitar la Data API en Atlas

1. En Atlas, ve a **App Services** (o **Data API** en el menú de
   tu clúster, según la versión) → **Data API** → **Enable**.
2. Copia la **URL base de la Data API**. Se ve así:
   `https://data.mongodb-api.com/app/data-xxxxx/endpoint/data/v1`
3. Crea una **API Key**: Data API → **API Keys** → **Create API Key**.
   Copia la llave. **Esta llave va a quedar visible en el código
   público**, así que en Atlas dale solo los permisos mínimos
   necesarios para estas colecciones.
4. En **Data API → Data Sources**, verifica que tu clúster esté
   conectado y anota su nombre (por ejemplo `Cluster0`).

## Paso 3 — Configurar `config.js`

Edita `config.js` y llena solo estos campos (nada más):

```js
window.SORPRESA_CONFIG = {
  DATA_API_URL: "https://data.mongodb-api.com/app/data-xxxxx/endpoint/data/v1",
  API_KEY: "tu-api-key-de-la-data-api",
  DATA_SOURCE: "Cluster0",
  DATABASE: "sorpresa_bebe",
  COLLECTIONS: { votes: "votes", letters: "letters", subscriptions: "subscriptions" }
};
```

> Nota de `.gitignore`: este proyecto trae un `.gitignore` que
> ignora `config.js` por precaución, para no subir la API Key a
> GitHub por accidente. **Pero GitHub Pages necesita ese archivo
> para funcionar.** Tienes dos opciones:
> - **Opción recomendada para este caso:** quita `config.js` del
>   `.gitignore` (borra esa línea) y súbelo, sabiendo que la llave
>   es pública y solo para datos públicos; o
> - Súbelo solo en la rama de despliegue y mantenlo fuera de la
>   rama principal.
> Si no subes `config.js`, la página carga en modo local y los
> resultados no se comparten.

## Paso 4 — GitHub y GitHub Pages

1. Crea un repositorio en GitHub, por ejemplo `sorpresa-bebe`.
   Puede ser público (necesario para Pages gratis) o privado
   con Pages en plan Pro.
2. Sube todos los archivos de esta carpeta a la rama principal
   (`main`), en la raíz del repo.
   ```bash
   git init
   git add .
   git commit -m "Sorpresa bebé para la familia"
   git branch -M main
   git remote add origin https://github.com/TU-USUARIO/sorpresa-bebe.git
   git push -u origin main
   ```
   Reemplaza `TU-USUARIO` por tu usuario de GitHub.
3. En GitHub: **Settings → Pages → Build and deployment →
   Source: Deploy from a branch → Branch: `main` / `/ (root)` →
   Save.**
4. Espera 1-2 minutos. Tu página quedará en:
   `https://TU-USUARIO.github.io/sorpresa-bebe/`

## Paso 5 — Probar

1. Abre el link en el celular.
2. Escribe `Luisa` → debe aparecer: “Hola, Luisa,” → “¡Sorpresa!”
   → “en 2027” → “Abuela” → bebé → “Nos vemos en julio
   de 2027” → cochinito.
3. Toca el cochinito → debe aparecer “¿Me regalas una monedita,
   Abuela?” y la CLABE de ejemplo **visible de inmediato**.
4. Vota un nombre y niño/niña → deben aparecer los resultados.
   Abre el link en otro celular/navegador y vota de nuevo:
   los resultados deben sumarse (eso confirma que Atlas está
   conectado). Si no se suman, revisa `config.js` y la consola
   del navegador (F12 → Console).
5. Prueba la sección del bebé (solo deja ver hasta la semana
   actual), la carta y el footer (WhatsApp verde #25D366).
6. En Atlas: **Browse Collections → sorpresa_bebe** y verifica
   que aparezcan documentos en `votes`, `letters` y
   `subscriptions`.

---

## Cambiar la CLABE de ejemplo por la real

En `index.html`, busca `CLABE (de ejemplo)` y cambia
`0000 0000 0000 0000 00` por la CLABE real, y quita la nota
de “de ejemplo”. Hazlo solo cuando Daniel lo pida y solo en
la versión que se va a compartir con la familia.

## Costos

- GitHub Pages: gratis (repo público).
- MongoDB Atlas M0: gratis (512 MB, suficiente para votos,
  cartas y registros de una familia).
- Data API: incluida en Atlas, sin costo extra en M0 para este uso.

## Qué falta (lo que necesita Daniel)

- [ ] Cuenta / usuario de GitHub y nombre del repositorio.
- [ ] Cuenta de MongoDB Atlas (o crearla) y los valores de `config.js`.
- [ ] Decidir si `config.js` se sube a GitHub (ver nota arriba).
- [ ] CLABE real, solo cuando él la pase.
- [ ] Foto real del ultrasonido, si quiere reemplazar el bebé animado.
- [ ] Servicio de envío para las notificaciones (correo con
      Resend/SendGrid; WhatsApp con API Business/Twilio o envío manual).
