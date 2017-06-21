import graphics from "./graphics";

async function main() {
    let resp = await fetch("data/output.json");
    let data = await resp.json();

    fill_summary(data)

    graphics.overview(data, $("#overview"));

    window.data = data;
}

function fill_summary(data) {
   $("#dem-chance").innerText = Math.round(100*data.prob) + "%";
   let seats = Math.round(data.seats)
   $("#dem-seats").innerText = seats
   $("#gop-seats").innerText = 435 - seats
   $("#dem-gain").innerText = Math.round(data.gain)
}

window.$ = s => document.querySelector(s);

main();
