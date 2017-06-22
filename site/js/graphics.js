import * as d3 from "d3";

window.d3 = d3;

const BLUE = "#67f";
const LIGHT_BLUE = "#79f";
const RED = "#f76";
const LIGHT_RED = "#f99";

const currentSeats = 194;
const electionDay = new Date("11/6/2018");

let bigScreen = () => window.innerWidth > 600;

/*
 * Create overview graphic.
 * Semicircular house layout with bands and colors.
 */
function overview(data, el) {
    let svg = d3.select(el).html(null).append("svg");
    let g = svg.append("g");

    const aspectRatio = 0.5;
    const margin = 30;
    const maxHeight = 350;

    let currentAngle = currentSeats / 435 * Math.PI;
    let demAngle = data.seats / 435 * Math.PI;
    let gopAngle = Math.PI - demAngle;
    let errAngle = 2 * data.seats_std / 435 * Math.PI;

    let left = -Math.PI / 2
    let right = Math.PI / 2

    let dem = g.append("path")
        .datum({ startAngle: left, endAngle: left + demAngle })
        .style("fill", BLUE);
    let dem_error = g.append("path")
        .datum({ startAngle: left + demAngle - errAngle, 
                 endAngle: left + demAngle })
        .style("fill", LIGHT_BLUE);
    let dem_gain = g.append("path")
        .datum({ startAngle: left + currentAngle, endAngle: left + demAngle })
        .style("fill", "url(#crosshatch)")
        .style("opacity", 0.25);

    let gop = g.append("path")
        .datum({ startAngle: right - gopAngle, endAngle: right })
        .style("fill", RED);
    let gop_error = g.append("path")
        .datum({ startAngle: right - gopAngle,
                 endAngle: right - gopAngle + errAngle })
        .style("fill", LIGHT_RED);

    let centerLine = g.append("line")
        .attr("x1", 0)
        .attr("x2", 0)
        .attr("stroke-dasharray", "7,5")
        .attr("stroke-width", 2)
        .attr("stroke", "white");

    let currentLabel = g.append("text")
        .style("font-size", "9pt")
        .style("font-weight", "bold")
        .attr("text-anchor", "middle")
        .attr("fill", "#777")
        .text("CURRENT");

    let currentArrow = g.append("line")
        .attr("stroke-width", 1.5)
        .attr("stroke", "black")
        .attr("opacity", 0.5)
        .attr("marker-end", "url(#arrow)");


    let seatsText = g.append("text")
        .style("fill", "white")
        .style("font-weight", "bold")
        .attr("text-anchor", "end")
        .attr("dx", -5)
        .text(Math.round(data.seats));
    let gained = Math.round(data.gain);
    let gainText = g.append("text")
        .style("fill", "white")
        .style("font-size", "20px")
        .attr("text-anchor", "end")
        .attr("dx", -5)
        .text((gained > 0 ? "+" : "") + gained);

    let demProbText = g.append("text")
        .attr("class", "prob")
        .attr("y", -10)
        .text(Math.round(100*data.prob) + "%");
    let gopProbText = g.append("text")
        .attr("class", "prob")
        .attr("y", -10)
        .text(Math.round(100 - 100*data.prob) + "%");

    let getCoords = function(angle, radius) {
        let arc = d3.arc()
            .innerRadius(radius)
            .outerRadius(radius)
            .startAngle(angle)
            .endAngle(angle);
        return arc.centroid();
    };

    let defs = svg.append("defs");
    defs.append("marker")
        .attr("id", "arrow")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 5)
        .attr("refY", 0)
        .attr("markerWidth", 4)
        .attr("markerHeight", 4)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr("class","arrowHead");
    defs.append("pattern")
        .attr("id", "crosshatch")
        .attr("width", 6)
        .attr("height", 6)
        .attr("patternUnits", "userSpaceOnUse")
        .attr("patternTransform", "rotate(30)")
        .append("rect")
        .attr("width", 4)
        .attr("height", 6)
        .attr("transform", "translate(0,0)")
        .attr("fill", "white");


    function draw() {
        let w = el.clientWidth; 
        let h = Math.min(w * aspectRatio, maxHeight);
        w = h / aspectRatio
        let dim = Math.min(w/2, h);

        svg
            .attr("width", w)
            .attr("height", h);
        el.height = null;

        g.attr("transform", `translate(${w/2}, ${h})`);

        let iR = bigScreen() ? 100 : 40;
        let oR = dim - margin;
        let arc = d3.arc()
            .innerRadius(iR)
            .outerRadius(oR);

        dem.attr("d", arc);
        dem_error.attr("d", arc);
        dem_gain.attr("d", arc);
        gop.attr("d", arc);
        gop_error.attr("d", arc);

        centerLine
            .attr("y1", -iR)
            .attr("y2", -oR);

        let [x, y] = getCoords(left + currentAngle, oR + 15);
        currentLabel
            .attr("x", x)
            .attr("y", y)
            .attr("transform", `rotate(${(left+currentAngle) * 180/Math.PI} ${x} ${y})`);

        let [x1, y1] = getCoords(left + currentAngle, oR + 14);
        let [x2, y2] = getCoords(left + currentAngle, oR + 3);
        currentArrow
            .attr("x1", x1)
            .attr("y1", y1)
            .attr("x2", x2)
            .attr("y2", y2);

        let placement = bigScreen() ? (0.5*oR + 0.5*iR) : (0.3*oR + 0.7*iR);
        [x, y] = getCoords(left + demAngle, placement);
        seatsText
            .attr("x", x)
            .attr("y", y)
            .style("font-size", bigScreen() ? 36 : 0.15*h);
        gainText
            .attr("x", x)
            .attr("y", y + 22)
            .style("opacity", bigScreen() ? 1 : 0); // hide on small screens

        [x, ] = getCoords(left, 0.5*oR + 0.5*iR);
        demProbText
            .attr("x", x)
            .style("font-size", 0.3*(oR-iR));
        gopProbText
            .attr("x", -x)
            .style("font-size", 0.3*(oR-iR));
    }

    draw();
    window.addEventListener("resize", draw);
}

/*
 * Create history graphic.
 * Line plot of odds ratio over time.
 */
function history(data, el) {
    data = data.map(d => ({ 
        date: new Date(d.time),
        odds: Math.log2(d.prob / (1 - d.prob)),
    }));
    window.mhistory = data;
    let svg = d3.select(el).append("svg");

    const margin = { L: 40, R: 50, T: 20, B: 10 };
    let w = el.clientWidth;
    let h = 320;
    w -= margin.L + margin.R;
    h -= margin.T + margin.B;

    let g = svg.append("g")
        .attr("transform", `translate(${margin.L},${margin.T})`);

    let last = data.length - 1;
    let startDate = data[0].date;
    let endDate = data[last].date;
    let x = d3.scaleTime();
    let bisector = d3.bisector(d => d.date).left;

    let maxOdds = 1.05 * d3.max(data, d => Math.abs(d.odds));
    let oddsExtent = Math.max(maxOdds, 4);
    let y = d3.scaleLinear()
        .domain([-oddsExtent, oddsExtent])
        .nice();

    g.append("g")
        .attr("class", "x axis");
    let y_el = g.append("g")
        .attr("class", "y axis");
    
    let half = h / 2;
    y_el.append("text")
        .attr("class", "label for")
        .attr("y", half)
        .attr("transform", `rotate(-90 0 ${half})`)
        .attr("dy", -25)
        .attr("dx", 10)
        .style("text-anchor", "start")
        .text("FOR →");
    y_el.append("text")
        .attr("class", "label against")
        .attr("y", half)
        .attr("transform", `rotate(-90 0 ${half})`)
        .attr("dy", -25)
        .attr("dx", -10)
        .style("text-anchor", "end")
        .text("← AGAINST");

    g.append("path")
        .datum(data)
        .attr("class", "dem line")
        .attr("stroke", BLUE);
    g.append("path")
        .datum(data)
        .attr("class", "gop line")
        .attr("stroke", RED);

    // tooltip box
    let box = g.append("g");
    let shade = box.append("rect")
        .attr("height", h+1)
        .attr("width", margin.R)
        .style("fill", "white")
        .style("fill-opacity", 0.8);
    let dateLine = box.append("line")
        .attr("y1", 0)
        .attr("y2", h+1)
        .attr("stroke", "black")
        .attr("stroke-width", 1)
        .attr("marker-start", "url(#triangle)");
    let dateText = box.append("text")
        .attr("dy", -6)
        .style("font-size", "9pt")
        .style("font-weight", "bold")
        .style("text-anchor", "middle");
    let dateFormat = d3.timeFormat("%B %-d");

    const textMargin = 10;
    let topOdds = box.append("text")
        .attr("y", half - textMargin)
        .attr("x", margin.R / 2)
        .attr("class", "odds");
    let botOdds = box.append("text")
        .attr("y", half + textMargin)
        .attr("x", margin.R / 2)
        .style("alignment-baseline", "hanging")
        .attr("class", "odds");
    let oddsDivider = box.append("line")
        .attr("x1", 10)
        .attr("x2", margin.R - 10)
        .attr("y1", half)
        .attr("y2", half)
        .style("stroke", "#777")
        .style("stroke-width", 3);

    let topPct = box.append("text")
        .attr("y", 10)
        .attr("x", 10)
        .style("alignment-baseline", "hanging")
        .attr("class", "tip-prob");
    let botPct = box.append("text")
        .attr("y", h - 10)
        .attr("x", 10)
        .attr("class", "tip-prob");
    let probFormat = d3.format(".0%");

    let defs = svg.append("defs");
    defs.append("marker")
        .attr("id", "triangle")
        .attr("viewBox", "0 -5 10 10")
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr("class","arrowHead");

    function draw(max = endDate) {
        w = el.clientWidth; 
        h = 320;
        
        svg
            .attr("width", w)
            .attr("height", h);

        w -= margin.L + margin.R;
        h -= margin.T + margin.B;

        let nTicks = [2, 4, 6, 8, 10, 10];
        nTicks = nTicks[~~(w / 160)];

        x.domain([startDate, max])
            .rangeRound([0, w]);
        y.rangeRound([h, 0]);

        let xAxis = d3.axisBottom(x)
            .tickSizeOuter(0)
            .ticks(nTicks);
        let yAxis = d3.axisLeft(y)
            .tickSizeInner(-w)
            .tickFormat(o => {
                if (o == 0) {
                    return "EVEN";
                } else {
                    let value = 2**Math.abs(o); 
                    return d3.format(".1f")(value);
                }
            });

        d3.select(".x.axis")
            .attr("transform", `translate(0, ${y(0)})`)
            .call(xAxis);

        d3.select(".y.axis")
            .call(yAxis);

        let line = d3.line()
            .x(d => x(d.date))
            .y(d => y(d.odds));

        d3.select(".dem.line").attr("d", line);

        line.y(d => y(-d.odds))
        d3.select(".gop.line").attr("d", line);

        resetTooltip();
    }

    function resetTooltip(max = endDate) {
        box.attr("transform", `translate(${w}, 0)`)
        shade.attr("width", margin.R);
        dateText.text(dateFormat(max));
        fillOdds(2**data[last].odds);
    }

    function fillOdds(odds) {
        let prob = odds / (1 + odds);

        let X, Y;
        let flip = false;
        if (odds > 1) {
            [X, Y] = getOddsFraction(odds);
        } else {
            [X, Y] = getOddsFraction(1 / odds);
            flip = true;
            prob = 1 - prob
        }

        topOdds
            .text(X)
            .attr("fill", flip ? RED : BLUE);
        botOdds
            .text(Y)
            .attr("fill", flip ? BLUE : RED);

        topPct
            .text(probFormat(prob))
            .attr("fill", flip ? RED : BLUE);
        botPct
            .text(probFormat(1 - prob))
            .attr("fill", flip ? BLUE : RED);
    }

    draw();
    window.addEventListener("resize", () => draw());

    svg.on("mousemove", function() {
        let [mx, my] = d3.mouse(g.node());

        if (mx > w) mx = w;
        if (mx < 0) mx = 0;

        let xval = x.invert(mx);
        let idx = bisector(data, xval);
        let closest = data[Math.min(last, idx)];

        box.attr("transform", `translate(${mx}, 0)`)
        shade.attr("width", w - mx + margin.R);
        dateText.text(dateFormat(xval));
        fillOdds(2 ** closest.odds);
    });
    svg.on("mouseout", resetTooltip);
}

/*
 * Create a table of likely outcomes.
 * Includes a vertical histogram.
 */
function outcomes(data, el) {
    let table = d3.select(el).append("tbody");

    let hist = new Array(436);
    hist[0] = {prob: data.seats_dist[0], cuml: data.seats_dist[0]};
    for (let i = 1; i <= 435; i++) {
        hist[i] = {
            prob: data.seats_dist[i],
            cuml: data.seats_dist[i] + hist[i-1].cuml,
        };
    }

    let mean = Math.round(data.seats);
    let sds = bigScreen() ? 1.25 : 1;
    let margin = Math.round(sds * data.seats_std);
    hist = hist.slice(mean - margin, mean + margin);

    let rows = table.selectAll("tr")
        .data(hist)
        .enter().append("tr")
        .attr("class", (d, i) => i - margin == 0 ? "expected" : "");

    let maxProb = d3.max(data.seats_dist);
    let pctFormat = d3.format(".0%");
    let gainFormat = d3.format("+");
    let cells = rows.selectAll("td")
        .data((d, i) => {
            let s = mean - margin + i; 
            return [s, 435-s, s-218, s-currentSeats, 1-d.cuml, [d.prob/maxProb, s], s];
        })
        .enter().append("td")
        .html((d, i) => [
            d,
            d,
            `<span style="color: ${d>0 ? BLUE : RED}">
                + ${Math.abs(d)} ${d>0 ? "Dem" : "Rep"}.
            </span>`,
            gainFormat(d),
            pctFormat(d),
            `<div class="hist-bar" style="width: ${pctFormat(d[0])}; 
                background-color: ${d[1] >= 218 ? BLUE:RED}"></div>`,
            d == currentSeats ? "◀ Current" : 
            d == mean ? "◀ Expected" : "",
        ][i])
        .attr("class", (d, i) => [,,"maj",,,"hist","label"][i]);
        
}

export default {
    overview,
    history,
    outcomes,
};
