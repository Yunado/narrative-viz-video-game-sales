const width = 800;
const height = 500;

const svg = d3.select("#worldmap")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

const projection = d3.geoNaturalEarth1()
    .scale(150)
    .translate([width / 2, height / 2]);

const path = d3.geoPath().projection(projection);

d3.tsv("https://unpkg.com/world-atlas@1.1.4/world/110m.tsv").then(data => console.log(data))

// Load world atlas TopoJSON data
Promise.all([
    d3.json("110m_modified.json"),
    d3.tsv("https://unpkg.com/world-atlas@1.1.4/world/110m.tsv"),
]).then(function ([world, tsvData]) {
    // Create a lookup object for ISO_N3 codes from TSV data
    const isoN3Lookup = {};
    const naCountries = {};
    const euCountries = {};
    const japanCountries = {};

    // Filter ISO_N3 codes for each continent
    tsvData.forEach((d) => {
        if (d.iso_n3 != -99) {
            isoN3Lookup[d.iso_n3] = d;
            if (d.continent === "North America") {
                naCountries[d.iso_n3] = true;
            } else if (d.continent === "Europe") {
                euCountries[d.iso_n3] = true;
            } else if (d.name === "Japan") {
                japanCountries[d.iso_n3] = true;
            }
        }
    });
    console.log(isoN3Lookup);
    console.log(euCountries);
    console.log(naCountries);
    console.log(japanCountries);

    // Append map paths and apply hover effect
    svg.append("g")
        .selectAll("path")
        .data(topojson.feature(world, world.objects.countries).features)
        .enter().append("path")
        .attr("d", path)
        .attr("fill", function (d) {
            console.log(d.id)
            const isoN3 = d.id; // ISO_N3 code is used as the id in world-110m.json
            if (naCountries[isoN3]) {
                return "mediumseagreen"; // Fill color for North America (NA)
            } else if (euCountries[isoN3]) {
                return "lightblue"; // Fill color for Europe (EU)
            } else if (japanCountries[isoN3]) {
                return "orangered"; // Fill color for Japan (JP)
            } else {
                return "beige"; // Default fill color for other countries
            }
        })
        .attr("stroke", "#fff")
        .attr("stroke-width", 0.5)
        .on("mouseover", function (d) {
            const isoN3 = d.target.__data__.id; // ISO_N3 code is used as the id in world-110m.json
            console.log(isoN3);
            const continent = isoN3Lookup[isoN3].continent;
            const country = isoN3Lookup[isoN3].name;
            console.log(continent)
            console.log(country)
            if (continent === "North America" || continent === "Europe" || country === "Japan") {
                d3.select(this).attr("fill", "orange"); // Change the fill color on mouseover for NA, Europe, or Japan
            } else {
                d3.select(this).attr("fill", "lightblue"); // Change the fill color on mouseover for other countries
            }
        })
        .on("mouseout", function () {
            d3.select(this).attr("fill", "#ccc"); // Revert the fill color on mouseout
        });
});
