/* ============================================================
   Kimela — pagrindinio puslapio logika
   1) transporto tipo pasirinkimas -> užklausos forma
   2) laiko intervalai pagal darbo laiką
   3) užklausos santrauka
   ============================================================ */
(function () {
  'use strict';

  var EMAIL = 'kimela.plovykla@gmail.com';

  var DIENOS = ['Sekmadienis', 'Pirmadienis', 'Antradienis', 'Trečiadienis',
                'Ketvirtadienis', 'Penktadienis', 'Šeštadienis'];

  /* Registracijos tvarka pagal transporto tipą */
  var TVARKA = {
    'Cisterna':                { tipas: 'registracija', tekstas: 'Cisternoms būtina išankstinė registracija — laiką patvirtinsime telefonu.' },
    'ADR cisterna':            { tipas: 'registracija', tekstas: 'ADR cisternoms būtina išankstinė registracija — laiką patvirtinsime telefonu.' },
    'Tank / silo konteineris': { tipas: 'registracija', tekstas: 'Tank ir silo konteineriams būtina išankstinė registracija — laiką patvirtinsime telefonu.' },
    'Lengvasis automobilis':   { tipas: 'eile',         tekstas: 'Lengviesiems ir mikroautobusams registracijos nereikia — galite atvažiuoti darbo valandomis. Užklausą siųskite, jei norite pasitikslinti.' },
    'Vilkikas':                { tipas: 'telefonu',     tekstas: 'Laiką vilkikui suderinsime telefonu pagal užklausą.' },
    'Puspriekabė / tentas':    { tipas: 'telefonu',     tekstas: 'Laiką puspriekabei suderinsime telefonu pagal užklausą.' }
  };

  /* ---------- 1. Atsiradimas slenkant ---------- */
  var revealItems = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealItems.forEach(function (el) { io.observe(el); });

    /* Atsarginis variantas: jei stebėjimas nesuveikia (greitas slinkimas,
       senesnė naršyklė), turinys vis tiek tampa matomas. */
    var laukia = false;
    var perziura = function () {
      if (laukia) { return; }
      laukia = true;
      window.requestAnimationFrame(function () {
        laukia = false;
        var h = window.innerHeight || document.documentElement.clientHeight;
        revealItems.forEach(function (el) {
          if (el.classList.contains('is-visible')) { return; }
          var r = el.getBoundingClientRect();
          if (r.top < h * 0.98 && r.bottom > 0) { el.classList.add('is-visible'); }
        });
      });
    };
    window.addEventListener('scroll', perziura, { passive: true });
    window.addEventListener('resize', perziura, { passive: true });
  } else {
    revealItems.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- 2. Transporto tipas -> forma ---------- */
  var cards = Array.prototype.slice.call(document.querySelectorAll('.type-card'));
  var selectTipas = document.getElementById('f-tipas');
  var inputData = document.getElementById('f-data');
  var selectLaikas = document.getElementById('f-laikas');
  var dienosInfo = document.getElementById('dienos-info');
  var tipoInfo = document.getElementById('tipo-info');

  function zymetiKorteles(reiksme) {
    cards.forEach(function (card) {
      var radio = card.querySelector('input[type="radio"]');
      var sutampa = !!radio && radio.value === reiksme;
      card.classList.toggle('is-selected', sutampa);
      if (radio) { radio.checked = sutampa; }
    });
  }

  function rodytiTvarka(reiksme) {
    if (!tipoInfo) { return; }
    var t = TVARKA[reiksme];
    tipoInfo.textContent = t ? t.tekstas : '';
    tipoInfo.classList.toggle('is-green', !!t && t.tipas === 'eile');
  }

  cards.forEach(function (card) {
    var radio = card.querySelector('input[type="radio"]');
    if (!radio) { return; }

    radio.addEventListener('change', function () {
      if (!radio.checked) { return; }
      zymetiKorteles(radio.value);
      if (selectTipas) { selectTipas.value = radio.value; }
      rodytiTvarka(radio.value);

      var sekcija = document.getElementById('uzsakymas');
      if (sekcija) {
        sekcija.scrollIntoView({ behavior: 'smooth', block: 'start' });
        window.setTimeout(function () {
          if (inputData && !inputData.value) { inputData.focus({ preventScroll: true }); }
        }, 520);
      }
    });
  });

  if (selectTipas) {
    selectTipas.addEventListener('change', function () {
      zymetiKorteles(selectTipas.value);
      rodytiTvarka(selectTipas.value);
    });
  }

  /* ---------- 3. Data ir laiko intervalai ---------- */
  function dviZenklai(n) { return (n < 10 ? '0' : '') + n; }

  function siandien() {
    var d = new Date();
    return d.getFullYear() + '-' + dviZenklai(d.getMonth() + 1) + '-' + dviZenklai(d.getDate());
  }

  function intervalai(pradzia, pabaiga) {
    var sarasas = [];
    for (var m = pradzia * 60; m <= pabaiga * 60; m += 30) {
      sarasas.push(dviZenklai(Math.floor(m / 60)) + ':' + dviZenklai(m % 60));
    }
    return sarasas;
  }

  function savaitesDiena(reiksme) {
    var dalys = String(reiksme).split('-');
    if (dalys.length !== 3) { return null; }
    var d = new Date(Number(dalys[0]), Number(dalys[1]) - 1, Number(dalys[2]));
    return isNaN(d.getTime()) ? null : d.getDay();
  }

  function uzpildytiLaikus() {
    if (!inputData || !selectLaikas) { return; }
    var diena = savaitesDiena(inputData.value);

    selectLaikas.innerHTML = '';
    if (dienosInfo) { dienosInfo.textContent = ''; }

    if (diena === null) {
      selectLaikas.appendChild(new Option('Pirma pasirinkite datą', '', true, true));
      selectLaikas.options[0].disabled = true;
      return;
    }

    if (diena === 0) {
      var tuscia = new Option('Sekmadieniais nedirbame', '', true, true);
      tuscia.disabled = true;
      selectLaikas.appendChild(tuscia);
      if (dienosInfo) {
        dienosInfo.textContent = 'Sekmadieniais nedirbame — pasirinkite kitą dieną.';
      }
      return;
    }

    var laikai;
    if (diena === 6) {
      laikai = intervalai(9, 15.5);
      if (dienosInfo) { dienosInfo.textContent = 'Šeštadienį dirbame 9.00–16.00.'; }
    } else {
      laikai = intervalai(8, 17.5);
      if (dienosInfo) { dienosInfo.textContent = DIENOS[diena] + ' — dirbame 8.00–18.00.'; }
    }

    selectLaikas.appendChild(new Option('Pasirinkite laiką', '', true, true));
    selectLaikas.options[0].disabled = true;
    laikai.forEach(function (t) { selectLaikas.appendChild(new Option(t, t)); });
  }

  if (inputData) {
    inputData.min = siandien();
    inputData.addEventListener('change', uzpildytiLaikus);
    inputData.addEventListener('input', uzpildytiLaikus);
    uzpildytiLaikus();
  }

  /* ---------- 4. Užklausos santrauka ---------- */
  var forma = document.getElementById('uzsakymo-forma');
  var santrauka = document.getElementById('santrauka');
  var santraukosTurinys = document.getElementById('santraukos-turinys');
  var pastuNuoroda = document.getElementById('siusti-pastu');
  var klaida = document.getElementById('formos-klaida');

  function rodytiKlaida(tekstas, laukas) {
    if (klaida) {
      klaida.textContent = tekstas;
      klaida.hidden = false;
    }
    if (laukas) {
      laukas.classList.add('invalid');
      laukas.focus({ preventScroll: false });
    }
  }

  function valytiKlaidas() {
    if (klaida) { klaida.hidden = true; klaida.textContent = ''; }
    if (!forma) { return; }
    Array.prototype.forEach.call(forma.querySelectorAll('.invalid'), function (el) {
      el.classList.remove('invalid');
    });
  }

  function eiluteSantraukai(pavadinimas, reiksme) {
    var wrap = document.createElement('div');
    var dt = document.createElement('dt');
    var dd = document.createElement('dd');
    dt.textContent = pavadinimas;
    dd.textContent = reiksme;
    wrap.appendChild(dt);
    wrap.appendChild(dd);
    return wrap;
  }

  if (forma) {
    forma.addEventListener('submit', function (e) {
      e.preventDefault();
      valytiKlaidas();

      var tipas = selectTipas ? selectTipas.value : '';
      var data = inputData ? inputData.value : '';
      var laikas = selectLaikas ? selectLaikas.value : '';
      var telefonas = document.getElementById('f-tel');
      var vardas = document.getElementById('f-vardas');
      var pastaba = document.getElementById('f-pastaba');
      var diena = savaitesDiena(data);

      if (!tipas) { return rodytiKlaida('Pasirinkite transporto tipą.', selectTipas); }
      if (!data) { return rodytiKlaida('Nurodykite pageidaujamą datą.', inputData); }
      if (diena === 0) { return rodytiKlaida('Sekmadieniais nedirbame — pasirinkite kitą dieną.', inputData); }
      if (!laikas) { return rodytiKlaida('Pasirinkite laiką.', selectLaikas); }
      if (!telefonas || !telefonas.value.trim() || telefonas.value.replace(/\D/g, '').length < 8) {
        return rodytiKlaida('Įrašykite telefono numerį, kad galėtume patvirtinti laiką.', telefonas);
      }

      var dataTekstas = diena === null ? data : data + ' (' + DIENOS[diena].toLowerCase() + ')';
      var tvarka = TVARKA[tipas];

      if (santraukosTurinys) {
        santraukosTurinys.innerHTML = '';
        santraukosTurinys.appendChild(eiluteSantraukai('Transportas', tipas));
        santraukosTurinys.appendChild(eiluteSantraukai('Data', dataTekstas));
        santraukosTurinys.appendChild(eiluteSantraukai('Laikas', laikas));
        santraukosTurinys.appendChild(eiluteSantraukai('Telefonas', telefonas.value.trim()));
        if (vardas && vardas.value.trim()) {
          santraukosTurinys.appendChild(eiluteSantraukai('Vardas / įmonė', vardas.value.trim()));
        }
        if (pastaba && pastaba.value.trim()) {
          santraukosTurinys.appendChild(eiluteSantraukai('Pastaba', pastaba.value.trim()));
        }
        santraukosTurinys.appendChild(eiluteSantraukai(
          'Tvarka',
          tvarka && tvarka.tipas === 'eile' ? 'Gyva eilė, registracijos nereikia' : 'Laiką patvirtinsime telefonu'
        ));
      }

      if (pastuNuoroda) {
        var eilutes = [
          'Transportas: ' + tipas,
          'Data: ' + dataTekstas,
          'Laikas: ' + laikas,
          'Telefonas: ' + telefonas.value.trim()
        ];
        if (vardas && vardas.value.trim()) { eilutes.push('Vardas / įmonė: ' + vardas.value.trim()); }
        if (pastaba && pastaba.value.trim()) { eilutes.push('Pastaba: ' + pastaba.value.trim()); }

        var tema = 'Užklausa dėl plovimo — ' + tipas + ', ' + data;
        var tekstas = 'Sveiki,\n\nnorėčiau užsakyti plovimo laiką.\n\n' +
                      eilutes.join('\n') + '\n\nAčiū.';
        pastuNuoroda.href = 'mailto:' + EMAIL +
          '?subject=' + encodeURIComponent(tema) +
          '&body=' + encodeURIComponent(tekstas);
      }

      if (santrauka) {
        santrauka.hidden = false;
        santrauka.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });

    forma.addEventListener('input', function (e) {
      if (e.target && e.target.classList) { e.target.classList.remove('invalid'); }
    });
  }
})();
