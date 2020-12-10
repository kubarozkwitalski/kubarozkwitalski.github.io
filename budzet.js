main_json = '';

function pieSlice(id, percent, color) {
    // Create pie chart html elements
    let slice = document.createElement('div');
    slice.setAttribute('id', 'pieSlice' + id);
    slice.className = 'hold';

    pie = document.createElement('div');
    pie.className = 'pie';
    pie.style.backgroundColor = color;
    slice.appendChild(pie);
    breakdown.appendChild(slice);
    pie.style.transform = 'rotate(' + percent * 3.6 + 'deg)';
    return slice;
}

function kwotaIZmiana(json, klucz) {
    let html = json[klucz];
    html += ' <span class="' + json[klucz + '_kierunek'] + '">(';
    if (json[klucz + '_kierunek'] === 'więcej') {
        html += '+';
    } else {
        html += '-';
    }
    html += json[klucz + '_zmiana'] + '% r/r)</span>';
    return html;
}

// Draw a pie chart and insert into parent element
// children is an array of objects with name, v and procent
// link_to_children says if a link to subcategory shall be generated in the legend
function pieChart(parentId, children, link_to_children) {
    document.getElementById(parentId).innerHTML = ''
    console.log(children);
    // Create container
    breakdown = document.createElement('div');
    breakdown.id = parentId + ':breakdown';
    breakdown.className = 'pieContainer child';

    pieBackground = document.createElement('div');
    pieBackground.className = 'pieBackground';
    breakdown.appendChild(pieBackground);
    document.getElementById(parentId).appendChild(breakdown);

    legend = document.createElement('div');
    legend.id = parentId + ':legend'
    legend.className = 'dzial legend';
    document.getElementById(parentId).className = 'chart'
    document.getElementById(parentId).appendChild(legend);

    let colors = ["#1b458b", "#0a0", "#f80", "#08f", "#a04", "#ffd700ee", "#1b458bdd", "#0a0c", "#f80b", "#08fa",
        "#a049", "#ffd70088", "#1b458b77", "#0a06", "#f805", "#08f4"]
    let procent_cum = 0.0;

    for(let i = 0; i < children.length; i++) {
        // Set pie chart sizes
        let procent = parseFloat(children[i].procent);
        let color = colors[i % 16];
        if (procent < 1.0) {
            color = "grey";
            procent = 100 - procent_cum;
        }

        if (procent > 50.0) {
            breakdown.appendChild(pieSlice(-1, 50, color));
            procent_cum += 50;
            procent = procent - 50;
        }
        let slice = pieSlice(i, procent, color);

        slice.style.transform = 'rotate(' + procent_cum * 3.6 + 'deg)';
        breakdown.appendChild(slice);
        procent_cum += procent;

        // We grey out <1% items, so it means it's time to stop rendering
        if (color === 'grey') {
            break;
        }

        // Generate legend table
        var n;
        if (link_to_children) {
            n = document.createElement('a');
            n.href = "#sekcja_dzial_" + i;
            n.onclick = function(e) { zmien_dzial(i); };
        } else {
            n = document.createElement('span');
        }
        n.innerText = children[i].name;
        n.style.color = colors[i];
        v = document.createElement('div');
        v.innerHTML = kwotaIZmiana(children[i], 'v');
        v.style.color = colors[i];
        legend.appendChild(n);
        legend.appendChild(v);
    }
}

function fillProjektyUE(json, suffix = '') {
    let out = '<table class="projekty">'
    Object.keys(json).forEach(function(key) {
        let rows = ''
        let header = ''
        Object.keys(json[key]).forEach(function(dana) {
            let x = '<td>'
            x += json[key][dana]
            x += '</td>'
            rows = x + rows
            if (key === '0') {
                header = '<td>' + dana + '</td>' + header
            }
        })
        if (key === '0') {
            out += '<th>' + header + '</th>'
        }
        out += '<tr><td>' + key + '</td>' + rows + '</tr>'
    })
    document.getElementById('projekty' + suffix).innerHTML = out;
}

function fillTable(json) {
    console.log(json);
    // Główny pie chart
    pieChart('main_display', json.children, true)
    fillProjektyUE(json.projekty_ue);

    // Wypełnienie szczegółów o gminie z JSONa
    Object.keys(json).forEach(function(key) {
        if (key === 'children' || key === 'projekty_ue') {
            // ignore
        } else if (key === 'gospodarka_odpadami_komunalnymi' ||
            key === 'budzet') {
            document.getElementById(key + ':dochody').innerHTML = kwotaIZmiana(json[key], 'dochody');
            document.getElementById(key + ':wydatki').innerHTML = kwotaIZmiana(json[key], 'wydatki');
        } else if (key === 'janosik') {
            document.getElementById(key + ':dochody').innerText = json[key]['dochody'];
            document.getElementById(key + ':wydatki').innerText = json[key]['wydatki'];
            document.getElementById('janosik:otrzymala').hidden = json[key]['dochody'] === '0';
            document.getElementById('janosik:wplacila').hidden = json[key]['wydatki'] === '0';
        } else {
            document.getElementById(key).innerText = json[key];
        }
    })
    main_json = json;
}

function zmien_dzial(dzial) {
    Object.keys(main_json.children[dzial]).forEach(function(key) {
        // ignore children table, handled by pieChart()
        if (key !== 'children') {
            document.getElementById(key).innerText = main_json.children[dzial][key];
        }
    })
    pieChart('rozdzialy', main_json.children[dzial]['children'], false)
    // Dodatkowo zmieniamy kolor w zależności czy mniej czy więcej
    document.getElementById('v_pc_diff_style').className = main_json.children[dzial].v_pc_diff_word;

    document.getElementById('main_section').hidden = true;
    document.getElementById('sekcja_dzial').hidden = false;
    document.getElementById('sekcja_ue').hidden = true;
}

function pokaz_ue() {
    document.getElementById('main_section').hidden = true;
    document.getElementById('sekcja_dzial').hidden = true;
    document.getElementById('sekcja_ue').hidden = false;
}

function wroc() {
    document.getElementById('main_section').hidden = false;
    document.getElementById('sekcja_dzial').hidden = true;
    document.getElementById('sekcja_ue').hidden = true;
    window.location.href = window.location.href.split('#')[0] + '#';
}

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const gmina = urlParams.get('g');
const nazwa = urlParams.get('n');
const ludnosc = urlParams.get('l');

window.addEventListener("hashchange", function(e) {
    if (e.newURL.includes("#sekcja_dzial_")) {
        dzial = e.newURL.split("sekcja_dzial_")[1];
        zmien_dzial(parseInt(dzial));
    } else if (e.newURL.includes("#sekcja_ue")) {
        // do nothing
    } else {
        wroc();
    }
})

fetch("files/" + gmina + ".json")
    .then(response => response.json())
    .then(json => fillTable(json));

fetch("files/" + gmina.substr(0, 4) + "-ue.json")
    .then(response => response.json())
    .then(json => fillProjektyUE(json, '_pow'));

fetch("files/" + gmina.substr(0, 2) + "-ue.json")
    .then(response => response.json())
    .then(json => fillProjektyUE(json, '_woj'));
