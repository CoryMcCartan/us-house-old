import * as d3 from "d3";

const BLUE = "#78f";
const LIGHT_BLUE = "#8af";
const RED = "#f98";
const LIGHT_RED = "#fba";

const currentSeats = 194;

let bigScreen = () => window.innerWidth > 600;

/*
 * Create overview graphic.
 * Semicircular house layout with bands and colors.
 */
function overview(data, el) {
    let svg = d3.select(el).append("svg");
    let g = svg.append("g");

    let aspectRatio = 0.5;
    let margin = 30;

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

    let probText = g.append("text")
        .style("font-weight", "bold")
        .attr("text-anchor", "middle")
        .attr("y", -5)
        .text(Math.round(100*data.prob) + "%");

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
        .attr("width", 3)
        .attr("height", 6)
        .attr("transform", "translate(0,0)")
        .attr("fill", "white");


    function draw() {
        let w = el.clientWidth; 
        let h = Math.min(w * aspectRatio, 350);
        w = h / aspectRatio
        let dim = Math.min(w/2, h);

        svg
            .attr("width", w)
            .attr("height", h);

        g.attr("transform", `translate(${w/2}, ${h})`);

        let iR = bigScreen() ? 100 : 60;
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

        probText.style("font-size", 0.8*iR);
    }

    draw();

    window.addEventListener("resize", draw);
}

export default {
    overview,
};
