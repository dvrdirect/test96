/* Sorpresa Bebé — versión estática para GitHub Pages + MongoDB Atlas Data API
   Si la Data API no está configurada en config.js, todo funciona en modo
   local (localStorage) y se avisa que los resultados compartidos necesitan
   la Data API. No hay credenciales reales en este archivo. */

(function () {
  "use strict";

  var FAMILY = {
    daniel: "Papá",
    yareni: "Mamá",
    luisa: "Abuela",
    rosario: "Tía"
  };
  var LMP = new Date(2026, 8, 26); // 26 de septiembre de 2026 (mes 8 = septiembre)
  var DUE_TEXT = "3 de julio de 2027";

  var cfg = window.SORPRESA_CONFIG || {};
  var apiConfigured = Boolean(cfg.DATA_API_URL && cfg.API_KEY && cfg.DATA_SOURCE && cfg.DATABASE);

  function $(id) { return document.getElementById(id); }
  function show(el) { if (el) el.classList.remove("hidden"); }
  function hide(el) { if (el) el.classList.add("hidden"); }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function scrollToEl(el) { if (el && el.scrollIntoView) el.scrollIntoView({ behavior: "smooth", block: "center" }); }
  function todayWeek() {
    var now = new Date(); now.setHours(0, 0, 0, 0);
    var days = Math.floor((now - LMP) / 86400000);
    var w = Math.floor(days / 7);
    return Math.max(4, Math.min(40, w));
  }
  var CURRENT_WEEK = todayWeek();

  /* ---------- MongoDB Atlas Data API ---------- */
  function dataApi(action, body) {
    if (!apiConfigured) return Promise.reject(new Error("Data API no configurada"));
    return fetch(cfg.DATA_API_URL + "/action/" + action, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": cfg.API_KEY,
        "Access-Control-Request-Headers": "*"
      },
      body: JSON.stringify(Object.assign({
        dataSource: cfg.DATA_SOURCE,
        database: cfg.DATABASE
      }, body))
    }).then(function (res) {
      if (!res.ok) throw new Error("Data API error " + res.status);
      return res.json();
    });
  }
  function apiFind(collection) {
    return dataApi("find", { collection: collection, filter: {}, limit: 500 })
      .then(function (r) { return r.documents || []; });
  }
  function apiInsert(collection, doc) {
    return dataApi("insertOne", { collection: collection, document: doc });
  }

  /* ---------- Almacenamiento local (fallback) ---------- */
  function localGet(key) { try { return JSON.parse(localStorage.getItem(key) || "[]"); } catch (e) { return []; } }
  function localSet(key, arr) { try { localStorage.setItem(key, JSON.stringify(arr)); } catch (e) {} }
  function localPush(key, doc) { var a = localGet(key); a.push(doc); localSet(key, a); return a; }

  /* ---------- 1. Nombre ---------- */
  var currentPerson = null; // { name, displayName, role }
  var coins = 0;

  $("nameForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var raw = $("nameInput").value.trim();
    var key = raw.toLowerCase();
    hide($("nameError"));
    if (!raw) return;
    if (!FAMILY[key]) {
      var err = $("nameError");
      err.textContent = "Hmm, ese nombre no está en la lista. Escríbelo tal como está en la lista de la familia, por favor 💛";
      show(err);
      return;
    }
    currentPerson = {
      name: key,
      displayName: raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase(),
      role: FAMILY[key]
    };
    $("letterAuthor").value = currentPerson.displayName;
    startReveal();
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
      $("revealRole").textContent = currentPerson.role;
      show($("revealRole"));
      scrollToEl($("revealRole"));
      return sleep(2000);
    }).then(function () {
      show($("revealBaby"));
      scrollToEl($("revealBaby"));
      return sleep(2600);
    }).then(function () {
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
    hide($("piggyText")); hide($("clabeBox")); hide($("coinCounter"));
    coins = 0; $("coinCount").textContent = "0";
    $("nameInput").value = "";
    show($("screen-name"));
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  /* ---------- 3. Cochinito ---------- */
  function onPiggyClick() {
    if (!currentPerson) return;
    coins += 1;
    $("coinCount").textContent = String(coins);
    show($("coinCounter"));
    $("piggyThought").textContent = "¡Gracias! 🪙";
    var t = $("piggyText");
    t.textContent = "¿Me regalas una monedita, " + currentPerson.role + "?";
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
      n.textContent = "Modo local: los resultados compartidos necesitan la Data API configurada en config.js. Por ahora los votos se guardan solo en este dispositivo.";
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
    4: { size: "Aproximadamente 2 mm, como una semilla de amapola", forming: "Se forma el saco gestacional y empiezan las primeras células del bebé.", fact: "A esta edad, el bebé es más pequeño que un grano de arroz." },
    5: { size: "Aproximadamente 2-3 mm", forming: "Empieza a formarse el tubo neural, que luego será el cerebro y la columna.", fact: "El corazón empieza a formarse, aunque todavía no se puede escuchar." },
    6: { size: "Entre 4 y 6 mm, como una lenteja", forming: "El corazón ya late, se forman los brotes de brazos y piernas, y la cabeza empieza a tomar forma.", fact: "El embrión tiene forma de C, como en las imágenes de la app Embarazo+." },
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


  /* Ilustración animada del bebé por etapa (SVG inline, estilo acuarela cálida).
     Sin emojis: la figura cambia visiblemente con la semana. */
  function babyStage(w) {
    if (w <= 5) return 1;
    if (w <= 8) return 2;
    if (w <= 12) return 3;
    if (w <= 20) return 4;
    return 5;
  }
  function babySvgForWeek(w) {
    var s = babyStage(w);
    var glow = '<circle class="glow" cx="150" cy="150" r="118" fill="url(#bgGlow)"/>';
    var defs = '<defs>'
      + '<radialGradient id="bgGlow" cx="50%" cy="45%" r="60%"><stop offset="0%" stop-color="#ffe9c9"/><stop offset="60%" stop-color="#ffd9b8"/><stop offset="100%" stop-color="#f6c6c6" stop-opacity="0.25"/></radialGradient>'
      + '<linearGradient id="skin" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#fbd7b3"/><stop offset="55%" stop-color="#f3b98d"/><stop offset="100%" stop-color="#e89a72"/></linearGradient>'
      + '<linearGradient id="skin2" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#fde3c2"/><stop offset="100%" stop-color="#f0b184"/></linearGradient>'
      + '</defs>';
    var open = '<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' + defs + glow;
    var close = '</svg>';
    if (s === 1) {
      // Semanas 4-5: embrión diminuto, forma curva en C, sin extremidades.
      return open
        + '<g class="breathe"><path d="M150 96 C 118 96 102 124 112 156 C 120 182 142 200 168 196 C 192 192 202 168 194 146 C 188 128 176 96 150 96 Z" fill="url(#skin)" stroke="#d98a6a" stroke-width="3" stroke-linejoin="round"/>'
        + '<circle cx="138" cy="128" r="5" fill="#4f3423" opacity="0.75"/>'
        + '<path d="M112 156 C 104 176 118 192 138 194" fill="none" stroke="#d98a6a" stroke-width="3" stroke-linecap="round"/>'
        + '<circle cx="196" cy="222" r="4" fill="#e89aa0" opacity="0.8"/><circle cx="176" cy="238" r="3" fill="#e89aa0" opacity="0.6"/><circle cx="214" cy="204" r="3" fill="#f2c96b" opacity="0.8"/></g>' + close;
    }
    if (s === 2) {
      // Semanas 6-8: embrión en C, cabeza grande, ojo, colita, cordón.
      return open
        + '<g class="breathe"><path d="M196 108 C 172 74 122 72 100 102 C 82 128 88 168 116 188 C 138 202 168 202 184 184 C 196 170 192 148 176 138 C 188 132 198 122 196 108 Z" fill="url(#skin)" stroke="#d98a6a" stroke-width="3" stroke-linejoin="round"/>'
        + '<circle cx="128" cy="118" r="7" fill="#4f3423"/><circle cx="130" cy="116" r="2.5" fill="#fff"/>'
        + '<path d="M100 102 C 92 118 96 136 110 146" fill="none" stroke="#d98a6a" stroke-width="3" stroke-linecap="round"/>'
        + '<path d="M184 184 C 196 200 190 222 168 230" fill="none" stroke="#d98a6a" stroke-width="3" stroke-linecap="round"/>'
        + '<path class="bob" d="M168 230 C 150 244 128 246 112 236" fill="none" stroke="#e89aa0" stroke-width="4" stroke-linecap="round"/>'
        + '<circle cx="216" cy="228" r="4" fill="#e89aa0" opacity="0.8"/><circle cx="196" cy="246" r="3" fill="#f2c96b" opacity="0.8"/></g>' + close;
    }
    if (s === 3) {
      // Semanas 9-12: bebito pequeño, brotes de brazos y piernas.
      return open
        + '<g class="breathe"><ellipse cx="150" cy="118" rx="52" ry="48" fill="url(#skin)" stroke="#d98a6a" stroke-width="3"/>'
        + '<circle cx="132" cy="112" r="6" fill="#4f3423"/><circle cx="168" cy="112" r="6" fill="#4f3423"/>'
        + '<path d="M138 138 Q150 146 162 138" fill="none" stroke="#b26a4a" stroke-width="3" stroke-linecap="round"/>'
        + '<path d="M150 166 C 128 166 116 186 120 208 C 124 228 140 238 158 236 C 178 234 188 216 184 196 C 181 178 170 166 150 166 Z" fill="url(#skin2)" stroke="#d98a6a" stroke-width="3" stroke-linejoin="round"/>'
        + '<path d="M122 188 C 108 196 104 210 112 220" fill="none" stroke="#d98a6a" stroke-width="5" stroke-linecap="round"/>'
        + '<path d="M180 190 C 192 198 194 212 186 222" fill="none" stroke="#d98a6a" stroke-width="5" stroke-linecap="round"/>'
        + '<path d="M138 236 C 134 248 138 256 148 258" fill="none" stroke="#d98a6a" stroke-width="5" stroke-linecap="round"/>'
        + '<path d="M164 236 C 168 248 164 256 154 258" fill="none" stroke="#d98a6a" stroke-width="5" stroke-linecap="round"/></g>' + close;
    }
    if (s === 4) {
      // Semanas 13-20: más parecido a un bebé, brazos y piernas con manitas y pies.
      return open
        + '<g class="breathe"><ellipse cx="150" cy="106" rx="56" ry="52" fill="url(#skin)" stroke="#d98a6a" stroke-width="3"/>'
        + '<circle cx="130" cy="100" r="6" fill="#4f3423"/><circle cx="170" cy="100" r="6" fill="#4f3423"/>'
        + '<path d="M142 124 Q150 130 158 124" fill="none" stroke="#b26a4a" stroke-width="3" stroke-linecap="round"/>'
        + '<path d="M112 78 Q126 62 142 66" fill="none" stroke="#d98a6a" stroke-width="3" stroke-linecap="round"/>'
        + '<path d="M150 158 C 122 158 106 182 112 210 C 117 234 136 248 158 246 C 182 244 194 222 188 198 C 183 176 172 158 150 158 Z" fill="url(#skin2)" stroke="#d98a6a" stroke-width="3" stroke-linejoin="round"/>'
        + '<path class="bob" d="M114 182 C 96 192 90 210 100 224" fill="none" stroke="#d98a6a" stroke-width="6" stroke-linecap="round"/>'
        + '<circle cx="100" cy="226" r="7" fill="url(#skin)" stroke="#d98a6a" stroke-width="2.5"/>'
        + '<path d="M186 184 C 202 194 206 210 198 224" fill="none" stroke="#d98a6a" stroke-width="6" stroke-linecap="round"/>'
        + '<circle cx="198" cy="226" r="7" fill="url(#skin)" stroke="#d98a6a" stroke-width="2.5"/>'
        + '<path d="M134 246 C 128 262 132 272 144 276" fill="none" stroke="#d98a6a" stroke-width="6" stroke-linecap="round"/>'
        + '<path d="M166 246 C 172 262 168 272 156 276" fill="none" stroke="#d98a6a" stroke-width="6" stroke-linecap="round"/></g>' + close;
    }
    // Semanas 21-40: bebé más grande, acurrucado, con manitas cerca de la cara y pies.
    return open
      + '<g class="breathe"><ellipse cx="150" cy="112" rx="64" ry="58" fill="url(#skin)" stroke="#d98a6a" stroke-width="3"/>'
      + '<circle cx="126" cy="106" r="7" fill="#4f3423"/><circle cx="128" cy="104" r="2.5" fill="#fff"/>'
      + '<circle cx="174" cy="106" r="7" fill="#4f3423"/><circle cx="176" cy="104" r="2.5" fill="#fff"/>'
      + '<path d="M140 132 Q150 140 160 132" fill="none" stroke="#b26a4a" stroke-width="3" stroke-linecap="round"/>'
      + '<path d="M106 82 Q122 62 144 66" fill="none" stroke="#d98a6a" stroke-width="3" stroke-linecap="round"/>'
      + '<path d="M150 168 C 116 168 96 196 104 228 C 111 256 134 272 160 270 C 188 268 204 242 196 212 C 189 186 174 168 150 168 Z" fill="url(#skin2)" stroke="#d98a6a" stroke-width="3" stroke-linejoin="round"/>'
      + '<path class="bob" d="M110 198 C 92 210 88 230 100 244" fill="none" stroke="#d98a6a" stroke-width="7" stroke-linecap="round"/>'
      + '<circle cx="102" cy="246" r="9" fill="url(#skin)" stroke="#d98a6a" stroke-width="2.5"/>'
      + '<path d="M190 200 C 206 212 210 230 200 244" fill="none" stroke="#d98a6a" stroke-width="7" stroke-linecap="round"/>'
      + '<circle cx="200" cy="246" r="9" fill="url(#skin)" stroke="#d98a6a" stroke-width="2.5"/>'
      + '<path d="M132 268 C 124 282 130 290 144 292" fill="none" stroke="#d98a6a" stroke-width="7" stroke-linecap="round"/>'
      + '<path d="M168 268 C 176 282 170 290 156 292" fill="none" stroke="#d98a6a" stroke-width="7" stroke-linecap="round"/>'
      + '<circle cx="232" cy="240" r="4" fill="#e89aa0" opacity="0.8"/><circle cx="216" cy="258" r="3" fill="#f2c96b" opacity="0.8"/></g>' + close;
  }

  function renderWeek(w) {
    w = Math.max(4, Math.min(CURRENT_WEEK, w));
    var d = WEEK_DATA[w] || WEEK_DATA[6];
    $("weekBabyArt").innerHTML = babySvgForWeek(w);
    $("weekTitle").textContent = "Semana " + w;
    $("weekLabel").textContent = "Semana " + w;
    $("weekSize").textContent = d.size;
    $("weekForming").textContent = d.forming;
    $("weekFact").textContent = d.fact;
    $("weekSlider").value = String(w);
    $("weekSlider").max = String(CURRENT_WEEK);
    $("weekNext").disabled = w >= CURRENT_WEEK;
    $("weekPrev").disabled = w <= 4;
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
