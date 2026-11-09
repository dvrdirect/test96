/* Sorpresa Bebé — versión estática para GitHub Pages + backend Vercel
   Si BACKEND_URL no está configurado en config.js, todo funciona en modo
   local (localStorage) y se avisa que los resultados compartidos necesitan
   el backend. La Data API de Atlas está retirada; la página habla con el
   backend en Vercel, que es el que se conecta a Atlas. No hay
   credenciales reales en este archivo. */

(function () {
  "use strict";

  /* Lista de personas que pueden entrar a la página.
     Familia: Daniel - Papá, Yareni - Mamá, Luisa - Abuela, Rosario - Tía.
     Amigos de Yareni (su rol: "en 2027 serás amiga/amigo de mi mami"):
     Nelly, Vale, Mike, Hazael, Daniela, Bruno, Ricardo, Jesús.
     `last` es el apellido: sirve para desambiguar cuando dos personas
     comparten el mismo nombre (se muestran las dos opciones con
     apellido para que el visitante elija quién es). */
  var PEOPLE = [
    { key: "daniel", first: "Daniel", last: "", side: "familia", revealText: "serás mi Papá", shortRole: "Papá" },
    { key: "yareni", first: "Yareni", last: "", side: "familia", revealText: "serás mi Mamá", shortRole: "Mamá" },
    { key: "luisa", first: "Luisa", last: "", side: "familia", revealText: "serás mi Abuela", shortRole: "Abuela" },
    { key: "rosario", first: "Rosario", last: "", side: "familia", revealText: "serás mi Tía", shortRole: "Tía" },
    { key: "nelly", first: "Nelly", last: "", side: "yareni", revealText: "serás amiga de mi mami", shortRole: "amiga" },
    { key: "vale", first: "Vale", last: "", side: "yareni", revealText: "serás amiga de mi mami", shortRole: "amiga" },
    { key: "mike", first: "Mike", last: "", side: "yareni", revealText: "serás amigo de mi mami", shortRole: "amigo" },
    { key: "hazael", first: "Hazael", last: "", side: "yareni", revealText: "serás amigo de mi mami", shortRole: "amigo" },
    { key: "daniela", first: "Daniela", last: "", side: "yareni", revealText: "serás amiga de mi mami", shortRole: "amiga" },
    { key: "bruno", first: "Bruno", last: "", side: "yareni", revealText: "serás amigo de mi mami", shortRole: "amigo" },
    { key: "ricardo", first: "Ricardo", last: "", side: "yareni", revealText: "serás amigo de mi mami", shortRole: "amigo" },
    { key: "jesus", first: "Jesús", last: "Cruz", side: "yareni", revealText: "serás amigo de mi mami", shortRole: "amigo" },
    /* Genesis Ariana, apodo Shmuel: se admite cualquiera de los tres
       (Shmuel, Genesis o Ariana) y es la misma persona. */
    { key: "genesis", first: "Genesis", last: "Ariana", aliases: ["shmuel", "genesis", "ariana", "genesis ariana"], side: "yareni", revealText: "serás amiga de mi mami", shortRole: "amiga" },
    { key: "melissa", first: "Melissa", last: "", side: "yareni", revealText: "serás amiga de mi mami", shortRole: "amiga" },
    { key: "silvia", first: "Silvia", last: "", side: "yareni", revealText: "serás amiga de mi mami", shortRole: "amiga" }
  ];
  function norm(s) { return (s || "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }
  function fullName(p) { return p.last ? p.first + " " + p.last : p.first; }
  var LMP = new Date(2026, 8, 26); // 26 de septiembre de 2026 (mes 8 = septiembre)
  var DUE_TEXT = "3 de julio de 2027";

  var cfg = window.SORPRESA_CONFIG || {};
  // Backend en Vercel (ver ~/workspace/sorpresa-bebe-backend/). Vacío = modo local.
  var backendUrl = (cfg.BACKEND_URL || "").replace(/\/$/, "");
  var apiConfigured = Boolean(backendUrl);

  function $(id) { return document.getElementById(id); }
  function show(el) { if (el) el.classList.remove("hidden"); }
  function hide(el) { if (el) el.classList.add("hidden"); }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function scrollToEl(el) { if (el && el.scrollIntoView) el.scrollIntoView({ behavior: "smooth", block: "center" }); }
  function todayWeek() {
    var now = new Date(); now.setHours(0, 0, 0, 0);
    var days = Math.floor((now - LMP) / 86400000);
    var w = Math.floor(days / 7);
    return Math.max(1, Math.min(40, w));
  }
  var CURRENT_WEEK = todayWeek();

  /* ---------- Backend Vercel (MongoDB Atlas) ---------- */
  function apiFind(collection) {
    if (!apiConfigured) return Promise.reject(new Error("Backend no configurado"));
    return fetch(backendUrl + "/api/" + collection).then(function (res) {
      if (!res.ok) throw new Error("Backend error " + res.status);
      return res.json();
    });
  }
  function apiInsert(collection, doc) {
    if (!apiConfigured) return Promise.reject(new Error("Backend no configurado"));
    return fetch(backendUrl + "/api/" + collection, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(doc)
    }).then(function (res) {
      if (!res.ok) throw new Error("Backend error " + res.status);
      return res.json();
    });
  }

  /* ---------- Almacenamiento local (fallback) ---------- */
  function localGet(key) { try { return JSON.parse(localStorage.getItem(key) || "[]"); } catch (e) { return []; } }
  function localSet(key, arr) { try { localStorage.setItem(key, JSON.stringify(arr)); } catch (e) {} }
  function localPush(key, doc) { var a = localGet(key); a.push(doc); localSet(key, a); return a; }

  /* ---------- 1. Nombre ---------- */
  var currentPerson = null; // { name, displayName, revealText, shortRole }
  var coins = 0;

  function pickPerson(p) {
    currentPerson = {
      name: p.key,
      displayName: fullName(p),
      revealText: p.revealText,
      shortRole: p.shortRole,
      side: p.side
    };
    $("letterAuthor").value = currentPerson.displayName;
    hide($("nameChoices"));
    startReveal();
  }

  $("nameForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var raw = $("nameInput").value.trim();
    hide($("nameError"));
    hide($("nameChoices"));
    if (!raw) return;
    var matches = PEOPLE.filter(function (p) {
      var names = [p.first, p.key, fullName(p)].concat(p.aliases || []);
      return names.some(function (n) { return norm(n) === norm(raw); });
    });
    if (!matches.length) {
      var err = $("nameError");
      err.textContent = "Hmm, ese nombre no está en la lista. Escríbelo tal como está en la lista, por favor 💛";
      show(err);
      return;
    }
    if (matches.length === 1) { pickPerson(matches[0]); return; }
    // Nombre repetido: se muestran las dos (o más) opciones con
    // apellido para que el visitante elija quién es.
    var box = $("nameChoices");
    box.innerHTML = "";
    var prompt = document.createElement("p");
    prompt.className = "note";
    prompt.textContent = "Hay más de una persona con ese nombre. ¿Quién eres?";
    box.appendChild(prompt);
    matches.forEach(function (p) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "btn-secondary";
      b.textContent = fullName(p);
      b.addEventListener("click", function () { pickPerson(p); });
      box.appendChild(b);
    });
    show(box);
  });

  /* ---------- 2. Saludo escalonado ---------- */
  function startReveal() {
    hide($("screen-name"));
    show($("screen-reveal"));
    document.body.classList.add("revealed");
    // Secuencia con pausas para generar suspenso. Sin auto-scroll brusco
    // al inicio; cada paso nuevo baja suavemente solo dentro del reveal.
    sleep(500).then(function () {
      $("revealStep1").textContent = "Hola, " + currentPerson.displayName + ",";
      show($("revealStep1"));
      return sleep(1600);
    }).then(function () {
      show($("revealSorpresa"));
      scrollToEl($("revealSorpresa"));
      return sleep(2200);
    }).then(function () {
      show($("revealStep2"));
      return sleep(1600);
    }).then(function () {
      $("revealRole").textContent = currentPerson.revealText;
      show($("revealRole"));
      scrollToEl($("revealRole"));
      return sleep(2000);
    }).then(function () {
      show($("revealBaby"));
      scrollToEl($("revealBaby"));
      return sleep(2600);
    }).then(function () {
      // El cochinito (primer domingo + CLABE) es solo para Daniel.
      // Para todos los demás — familia de Yareni y sus amistades — no se muestra esa sección.
      if (currentPerson.name !== "daniel") { hide($("revealPiggy")); return sleep(400); }
      show($("revealPiggy"));
      scrollToEl($("revealPiggy"));
      return sleep(1200);
    }).then(function () {
      // El resto aparece sin auto-scroll: el usuario baja cuando quiera.
      show($("screen-survey"));
      show($("screen-baby"));
      show($("screen-letter"));
      show($("screen-footer"));
      renderWeek(CURRENT_WEEK);
      loadResults();
      loadLetters();
    });
  }

  $("restartBtn").addEventListener("click", function () {
    document.body.classList.remove("revealed");
    ["revealStep1", "revealSorpresa", "revealStep2", "revealRole", "revealBaby", "revealPiggy"].forEach(function (id) { hide($(id)); });
    ["screen-reveal", "screen-survey", "screen-baby", "screen-letter", "screen-footer"].forEach(function (id) { hide($(id)); });
    $("piggyThought").textContent = "Clickeame";
    var piggyImgReset = document.querySelector("#piggyWrap .piggy-img");
    if (piggyImgReset) {
      piggyImgReset.setAttribute("src", "assets/cochinito.webp");
      piggyImgReset.setAttribute("alt", "Cochinito en acuarela");
    }
    hide($("piggyText")); hide($("clabeBox")); hide($("coinCounter"));
    coins = 0; $("coinCount").textContent = "0";
    $("nameInput").value = "";
    hide($("nameChoices"));
    show($("screen-name"));
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  /* ---------- 3. Cochinito ---------- */
  function onPiggyClick() {
    if (!currentPerson) return;
    // Al primer clic el cochinito cambia a su versión sonriente
    // (mismo estilo acuarela, solo cambia la expresión) y se queda así.
    var piggyImg = document.querySelector("#piggyWrap .piggy-img");
    if (piggyImg && piggyImg.getAttribute("src") !== "assets/cochinito-sonriente.webp") {
      piggyImg.setAttribute("src", "assets/cochinito-sonriente.webp");
      piggyImg.setAttribute("alt", "Cochinito sonriente en acuarela");
    }
    coins += 1;
    $("coinCount").textContent = String(coins);
    show($("coinCounter"));
    // Interactivo: el cochinito salta/menea y cae una moneda.
    var wrap = $("piggyWrap");
    wrap.classList.remove("piggy-jump");
    void wrap.offsetWidth; // reinicia la animación
    wrap.classList.add("piggy-jump");
    var drop = $("coinDrop");
    if (drop) {
      drop.classList.remove("hidden", "coin-fall");
      void drop.offsetWidth;
      drop.classList.add("coin-fall");
      setTimeout(function () { drop.classList.add("hidden"); drop.classList.remove("coin-fall"); }, 900);
    }
    $("piggyThought").textContent = "¡Gracias! 🪙";
    var t = $("piggyText");
    t.textContent = "¿Me das mi primer domingo, " + currentPerson.shortRole + "?";
    show(t);
    show($("clabeBox"));
    // CLABE visible de inmediato, sin desplazar a mano.
    setTimeout(function () { scrollToEl($("clabeBox")); }, 180);
  }
  $("piggyWrap").addEventListener("click", onPiggyClick);
  $("piggyWrap").addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onPiggyClick(); } });

  /* ---------- 4. Encuesta ---------- */
  var myVote = null;
  try { myVote = JSON.parse(localStorage.getItem("sorpresa_my_vote") || "null"); } catch (e) {}
  var selectedSex = null;

  function markSex(sex) {
    selectedSex = sex;
    $("voteNino").style.outline = sex === "nino" ? "3px solid #7fb3d5" : "";
    $("voteNina").style.outline = sex === "nina" ? "3px solid #e89aa0" : "";
  }
  $("voteNino").addEventListener("click", function () { markSex("nino"); submitVote(); });
  $("voteNina").addEventListener("click", function () { markSex("nina"); submitVote(); });

  function submitVote() {
    hide($("voteError"));
    if (myVote) { showResults(); return; }
    if (!selectedSex) return;
    var name = $("babyNameInput").value.trim();
    if (!name) {
      var err = $("voteError");
      err.textContent = "Escribe primero el nombre que sugieres y luego elige niño o niña 💛";
      show(err);
      return;
    }
    var vote = { name: name, sex: selectedSex, voter: currentPerson ? currentPerson.displayName : "Familia", createdAt: new Date().toISOString() };
    myVote = vote;
    try { localStorage.setItem("sorpresa_my_vote", JSON.stringify(vote)); } catch (e) {}
    if (apiConfigured) {
      apiInsert(cfg.COLLECTIONS.votes, vote).then(loadResults).catch(function () { localPush("sorpresa_votes", vote); loadResults(); });
    } else {
      localPush("sorpresa_votes", vote);
      loadResults();
    }
  }

  function loadResults() {
    showDataNote();
    var p = apiConfigured
      ? apiFind(cfg.COLLECTIONS.votes)
      : Promise.resolve(localGet("sorpresa_votes"));
    p.then(renderResults).catch(function () { renderResults(localGet("sorpresa_votes")); });
    if (myVote) showResults();
  }
  function showResults() { show($("surveyResults")); }
  function showDataNote() {
    var n = $("dataNote");
    if (!apiConfigured) {
      n.textContent = "Modo local: los resultados compartidos necesitan el backend configurado (BACKEND_URL en config.js). Por ahora los votos se guardan solo en este dispositivo.";
      show(n);
    } else { hide(n); }
  }
  function renderResults(votes) {
    showResults();
    votes = votes || [];
    var nino = votes.filter(function (v) { return v.sex === "nino"; }).length;
    var nina = votes.filter(function (v) { return v.sex === "nina"; }).length;
    var total = votes.length || 1;
    var pn = Math.round((nino / total) * 100), pa = 100 - pn;
    if (!votes.length) { pn = 0; pa = 0; }
    $("pctNino").textContent = pn + "%";
    $("pctNina").textContent = pa + "%";
    $("barNino").style.width = pn + "%";
    $("barNina").style.width = pa + "%";
    $("totalVotes").textContent = votes.length ? votes.length + (votes.length === 1 ? " voto en total" : " votos en total") : "Aún no hay votos. ¡Sé la primera persona en votar!";
    var counts = {};
    votes.forEach(function (v) {
      var k = (v.name || "").trim();
      if (k) counts[k] = (counts[k] || 0) + 1;
    });
    var list = $("nameResults");
    list.innerHTML = "";
    var names = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; });
    if (!names.length) { list.innerHTML = "<li>Nombres sugeridos aparecerán aquí después de votar.</li>"; return; }
    names.forEach(function (n) {
      var li = document.createElement("li");
      var s1 = document.createElement("span"); s1.textContent = n;
      var s2 = document.createElement("span"); s2.textContent = counts[n] + (counts[n] === 1 ? " voto" : " votos");
      li.appendChild(s1); li.appendChild(s2); list.appendChild(li);
    });
  }

  /* ---------- 5. Bebé por semana ---------- */
  var WEEK_DATA = {
    1: { size: "Aún no se ve, pero todo está empezando", forming: "El cuerpo de mamá se prepara y comienza una historia nueva.", fact: "Todo empezó con un deseo enorme y mucho amor. ¡Ya viene en camino!" },
    2: { size: "Como una semillita invisible, más pequeña que un punto", forming: "Las primeras células se juntan y empiezan a formar una vida nueva.", fact: "En estos días, mamá y papá todavía no lo saben, pero el milagro ya empezó." },
    3: { size: "Aproximadamente 1-2 mm, como una semillita", forming: "El bebé se acomoda en su lugar y la prueba de embarazo sale positiva.", fact: "¡La prueba salió positiva! Mamá y papá lloraron de alegría al enterarse." },
    4: { size: "Aproximadamente 2 mm, como una semilla de amapola", forming: "Se forma el saco gestacional y empiezan las primeras células del bebé.", fact: "A esta edad, el bebé es más pequeño que un grano de arroz." },
    5: { size: "Aproximadamente 2-3 mm", forming: "Empieza a formarse el tubo neural, que luego será el cerebro y la columna.", fact: "El corazón empieza a formarse, aunque todavía no se puede escuchar." },
    6: { size: "Entre 4 y 6 mm, como una lenteja", forming: "El corazón ya late, se forman los brotes de brazos y piernas, y la cabeza empieza a tomar forma.", fact: "Su corazoncito ya late rapidísimo, más de 100 veces por minuto, y aunque es del tamaño de una lenteja, ya se mueve un poquito." },
    7: { size: "Aproximadamente 1 cm, como un arándano", forming: "El cerebro crece rápido y se forman las manos y los pies.", fact: "El bebé ya se mueve un poquito, aunque todavía no se siente." },
    8: { size: "Aproximadamente 1.5 cm, como una uva", forming: "Se forman los dedos, los ojos y las orejas, y el corazón late más fuerte.", fact: "Ya tiene todos los órganos principales empezando a formarse." },
    9: { size: "Aproximadamente 2.3 cm, como una cereza", forming: "Se forman los codos, las rodillas y los párpados.", fact: "El bebé empieza a tragar y a mover los brazos." },
    10: { size: "Aproximadamente 3 cm, como una fresa", forming: "Los órganos principales ya están formados y empiezan a funcionar juntos.", fact: "Los dedos de las manos y los pies ya se separaron." },
    11: { size: "Aproximadamente 4 cm, como un limón pequeño", forming: "Se forman las uñas, los dientes de leche y el bebé empieza a bostezar.", fact: "El bebé ya puede abrir y cerrar las manos." },
    12: { size: "Aproximadamente 5-6 cm, como un durazno pequeño", forming: "Los reflejos empiezan: el bebé responde al tacto y mueve la boca.", fact: "Termina el primer trimestre, una etapa muy importante." },
    13: { size: "Aproximadamente 7 cm", forming: "Las cuerdas vocales se forman y el bebé traga líquido amniótico.", fact: "El bebé ya tiene huellas dactilares empezando a formarse." },
    14: { size: "Aproximadamente 9 cm", forming: "El bebé hace muecas, frunce el ceño y mueve los brazos.", fact: "Ya se puede saber, con estudios, si será niño o niña." },
    15: { size: "Aproximadamente 10 cm", forming: "La piel es muy fina y se ve el esqueleto empezando a endurecerse.", fact: "El bebé ya siente la luz a través de la pancita." },
    16: { size: "Aproximadamente 12 cm, como un aguacate", forming: "Los ojos se mueven, las orejas ya están en su lugar y el bebé escucha sonidos.", fact: "El bebé ya puede escuchar tu voz." },
    17: { size: "Aproximadamente 13 cm", forming: "El esqueleto se vuelve hueso y el bebé se mueve más.", fact: "El bebé practica succionar con el pulgar." },
    18: { size: "Aproximadamente 14 cm", forming: "Las orejas ya están formadas y el bebé escucha los latidos de mamá.", fact: "Es un buen momento para hablarle y ponerle música." },
    19: { size: "Aproximadamente 15 cm", forming: "Se forma una capa protectora en la piel y el bebé se mueve mucho.", fact: "Mamá puede empezar a sentir los primeros movimientos." },
    20: { size: "Aproximadamente 16-17 cm, como un plátano", forming: "El bebé traga, produce sus primeras deposiciones y mueve las piernas.", fact: "Llegó la mitad del embarazo. ¡Ya falta menos!" },
    21: { size: "Aproximadamente 27 cm de la cabeza a los pies", forming: "El bebé practica tragar y los movimientos son más fuertes.", fact: "El bebé ya tiene horarios de sueño y vigilia." },
    22: { size: "Aproximadamente 28 cm", forming: "Los labios y las cejas se distinguen, y el bebé reacciona a los sonidos.", fact: "El bebé ya distingue sonidos fuertes y suaves." },
    23: { size: "Aproximadamente 29 cm", forming: "Los pulmones empiezan a prepararse para respirar.", fact: "El bebé ya tiene hipo de vez en cuando." },
    24: { size: "Aproximadamente 30 cm", forming: "La piel se vuelve menos transparente y el bebé gana peso.", fact: "El bebé ya puede abrir los ojos." },
    25: { size: "Aproximadamente 35 cm", forming: "El bebé responde a la voz de mamá y papá.", fact: "El bebé ya tiene el cabello empezando a crecer." },
    26: { size: "Aproximadamente 36 cm", forming: "Los pulmones siguen madurando y el cerebro crece rápido.", fact: "El bebé ya parpadea." },
    27: { size: "Aproximadamente 37 cm", forming: "El bebé duerme y despierta en ciclos, como un recién nacido.", fact: "Empieza el tercer trimestre." },
    28: { size: "Aproximadamente 38 cm", forming: "El bebé practica respirar y sus ojos ya detectan la luz.", fact: "El bebé ya sueña durante el sueño." },
    29: { size: "Aproximadamente 39 cm", forming: "Los músculos y los pulmones siguen madurando.", fact: "El bebé ya pesa más de 1 kilo." },
    30: { size: "Aproximadamente 40 cm", forming: "El cerebro desarrolla surcos y el bebé gana grasa.", fact: "El bebé ya se acomoda con la cabeza hacia abajo." },
    31: { size: "Aproximadamente 41 cm", forming: "El bebé puede girar la cabeza y sus movimientos son más suaves.", fact: "El bebé ya reconoce la voz de mamá." },
    32: { size: "Aproximadamente 42 cm", forming: "Los huesos se endurecen, menos los del cráneo.", fact: "El bebé practica respirar con más fuerza." },
    33: { size: "Aproximadamente 44 cm", forming: "El bebé ya distingue la luz y la oscuridad.", fact: "El bebé ya pesa cerca de 2 kilos." },
    34: { size: "Aproximadamente 45 cm", forming: "El sistema nervioso y los pulmones siguen madurando.", fact: "El bebé ya tiene las uñas largas." },
    35: { size: "Aproximadamente 46 cm", forming: "El bebé gana peso rápido y se prepara para nacer.", fact: "El bebé ya ocupa casi todo el espacio." },
    36: { size: "Aproximadamente 47 cm", forming: "El bebé baja hacia la pelvis y se prepara para el nacimiento.", fact: "El bebé ya está casi listo para conocer el mundo." },
    37: { size: "Aproximadamente 48 cm", forming: "El bebé se considera a término y sigue ganando peso.", fact: "El bebé ya practica succionar y tragar." },
    38: { size: "Aproximadamente 49 cm", forming: "El bebé está listo: órganos maduros y peso adecuado.", fact: "El bebé ya tiene el pelo y las uñas completos." },
    39: { size: "Aproximadamente 50 cm", forming: "El bebé espera el momento de nacer.", fact: "El bebé ya reconoce los sonidos familiares." },
    40: { size: "Aproximadamente 51 cm", forming: "El bebé está listo para nacer en cualquier momento.", fact: "¡La fecha esperada es hoy! El bebé llega cuando esté listo." }
  };


  /* Imagen del bebé por semana (acuarelas generadas, en assets/).
     Mapa: 1-3 prueba de embarazo, 4-8 embrión semana 6,
     9-16 feto semana 12, 17-40 feto semana 20. */
  function babyImageForWeek(w) {
    if (w <= 3) return { src: "assets/prueba-semana-3.webp", alt: "Daniel y Yareni sonriendo con la prueba de embarazo positiva frente al Arco de León" };
    if (w <= 8) return { src: "assets/bebe-semana-6.webp", alt: "Embrión en forma de C dentro de una burbuja" };
    if (w <= 16) return { src: "assets/bebe-semana-12.webp", alt: "Feto en una burbuja" };
    return { src: "assets/bebe-semana-20.webp", alt: "Feto en una burbuja" };
  }

  function renderWeek(w) {
    w = Math.max(1, Math.min(CURRENT_WEEK, w));
    var d = WEEK_DATA[w] || WEEK_DATA[6];
    var img = babyImageForWeek(w);
    $("weekBabyArt").innerHTML = '<img src="' + img.src + '" alt="' + img.alt + '" loading="lazy">';
    $("weekTitle").textContent = "Semana " + w;
    $("weekLabel").textContent = "Semana " + w;
    $("weekSize").textContent = d.size;
    $("weekForming").textContent = d.forming;
    $("weekFact").textContent = d.fact;
    $("weekSlider").value = String(w);
    $("weekSlider").max = String(CURRENT_WEEK);
    $("weekNext").disabled = w >= CURRENT_WEEK;
    $("weekPrev").disabled = w <= 1;
    var badge = $("currentWeekBadge");
    badge.textContent = "Semana " + CURRENT_WEEK + " · ¡Estás aquí!";
    if (w === CURRENT_WEEK) hide($("goCurrentWeek")); else show($("goCurrentWeek"));
    renderWeek._current = w;
  }
  renderWeek._current = CURRENT_WEEK;
  $("weekPrev").addEventListener("click", function () { renderWeek((renderWeek._current || CURRENT_WEEK) - 1); });
  $("weekNext").addEventListener("click", function () { renderWeek((renderWeek._current || CURRENT_WEEK) + 1); });
  $("weekSlider").addEventListener("input", function () { renderWeek(parseInt($("weekSlider").value, 10)); });
  $("goCurrentWeek").addEventListener("click", function () { renderWeek(CURRENT_WEEK); });

  /* ---------- 6. Carta al bebé ---------- */
  function loadLetters() {
    var p = apiConfigured ? apiFind(cfg.COLLECTIONS.letters) : Promise.resolve(localGet("sorpresa_letters"));
    p.then(renderLetters).catch(function () { renderLetters(localGet("sorpresa_letters")); });
  }
  function renderLetters(letters) {
    var list = $("letterList");
    list.innerHTML = "";
    (letters || []).slice().reverse().forEach(function (l) {
      var div = document.createElement("div");
      div.className = "letter-item";
      var msg = document.createElement("p"); msg.textContent = l.message || "";
      var au = document.createElement("p"); au.className = "author"; au.textContent = "— " + (l.author || "Familia");
      div.appendChild(msg); div.appendChild(au); list.appendChild(div);
    });
    if (!letters || !letters.length) list.innerHTML = "<p class='note'>Aún no hay cartas. ¡Escribe la primera!</p>";
  }
  $("saveLetterBtn").addEventListener("click", function () {
    hide($("letterError")); hide($("letterSuccess"));
    var msg = $("letterText").value.trim();
    var author = $("letterAuthor").value.trim() || (currentPerson ? currentPerson.displayName : "Familia");
    if (!msg) {
      var err = $("letterError");
      err.textContent = "Escribe primero tu mensaje para el bebé 💛";
      show(err);
      return;
    }
    var letter = { author: author, message: msg, createdAt: new Date().toISOString() };
    var done = function () { show($("letterSuccess")); $("letterText").value = ""; loadLetters(); };
    if (apiConfigured) {
      apiInsert(cfg.COLLECTIONS.letters, letter).then(done).catch(function () { localPush("sorpresa_letters", letter); done(); });
    } else { localPush("sorpresa_letters", letter); done(); }
  });

  /* ---------- 7. Newsletter footer ---------- */
  var channel = "whatsapp";
  function setChannel(c) {
    channel = c;
    var isWa = c === "whatsapp";
    $("channelWhatsapp").classList.toggle("selected", isWa);
    $("channelEmail").classList.toggle("selected", !isWa);
    $("contactLabel").textContent = isWa ? "Tu número de WhatsApp" : "Tu correo electrónico";
    var inp = $("contactInput");
    inp.type = isWa ? "tel" : "email";
    inp.placeholder = isWa ? "Ej. 55 1234 5678" : "Ej. correo@ejemplo.com";
  }
  $("channelWhatsapp").addEventListener("click", function () { setChannel("whatsapp"); });
  $("channelEmail").addEventListener("click", function () { setChannel("email"); });
  setChannel("whatsapp");

  $("subscribeForm").addEventListener("submit", function (e) {
    e.preventDefault();
    hide($("subscribeError")); hide($("subscribeSuccess"));
    var contact = $("contactInput").value.trim();
    var valid = channel === "email"
      ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)
      : contact.replace(/\D/g, "").length >= 10;
    if (!valid) {
      var err = $("subscribeError");
      err.textContent = channel === "email" ? "Revisa tu correo, por favor." : "Revisa tu número de WhatsApp, por favor (mínimo 10 dígitos).";
      show(err);
      return;
    }
    var sub = { channel: channel, contact: contact, createdAt: new Date().toISOString() };
    var done = function () { show($("subscribeSuccess")); $("contactInput").value = ""; };
    if (apiConfigured) {
      apiInsert(cfg.COLLECTIONS.subscriptions, sub).then(done).catch(function () { localPush("sorpresa_subscriptions", sub); done(); });
    } else { localPush("sorpresa_subscriptions", sub); done(); }
  });

  // Semana actual visible desde el inicio si la sección ya está visible.
  renderWeek(CURRENT_WEEK);
})();
