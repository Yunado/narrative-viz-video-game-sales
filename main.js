const width = 800;
const height = 500;

const svg = d3.select('#worldmap').append('svg').attr('width', width).attr('height', height);

const projection = d3
	.geoNaturalEarth1()
	.scale(150)
	.translate([width / 2, height / 2]);

const path = d3.geoPath().projection(projection);

// Load world atlas TopoJSON data
Promise.all([
	d3.json('https://raw.githubusercontent.com/Yunado/narrative-viz-video-game-sales/main/110m_modified.json'),
	d3.tsv('https://unpkg.com/world-atlas@1.1.4/world/110m.tsv'),
	d3.csv('https://raw.githubusercontent.com/Yunado/narrative-viz-video-game-sales/main/vgsales.csv'),
]).then(function ([world, tsvData, csvData]) {
	// MAP =================================================================
	// Create a lookup object for ISO_N3 codes from TSV data
	const isoN3Lookup = {};
	const naCountries = {};
	const euCountries = {};
	const japanCountries = {};

	// Filter ISO_N3 codes for each continent
	tsvData.forEach((d) => {
		if (d.iso_n3 != -99) {
			isoN3Lookup[d.iso_n3] = d;
			if (d.continent === 'North America') {
				naCountries[d.iso_n3] = true;
			} else if (d.continent === 'Europe') {
				euCountries[d.iso_n3] = true;
			} else if (d.name === 'Japan') {
				japanCountries[d.iso_n3] = true;
			}
		}
	});
	// console.log(isoN3Lookup);
	// console.log(euCountries);
	// console.log(naCountries);
	// console.log(japanCountries);

	// Append map background with different colors for continent and country
	svg.append('g')
		.selectAll('path')
		.data(topojson.feature(world, world.objects.countries).features)
		.enter()
		.append('path')
		.attr('d', path)
		.attr('fill', function (d) {
			console.log(d.id);
			const isoN3 = d.id; // ISO_N3 code is used as the id in world-110m.json
			if (naCountries[isoN3]) {
				return 'mediumseagreen'; // Fill color for North America (NA)
			} else if (euCountries[isoN3]) {
				return 'LightSkyBlue'; // Fill color for Europe (EU)
			} else if (japanCountries[isoN3]) {
				return 'orangered'; // Fill color for Japan (JP)
			} else {
				return 'Wheat'; // Default fill color for other countries
			}
		})
		.attr('stroke', '#fff')
		.attr('stroke-width', 1);
	//================================================================

	// GAME DATA ================================================================
	// Filter rows containing "N/A" from CSV data
	const filteredCSVData = csvData.filter(function (d) {
		// Customize this condition to match the columns containing "N/A"
		return !Object.values(d).some((value) => value === 'N/A');
	});

	// Extract the years from the filtered CSV data
	const years = filteredCSVData.map((d) => +d.Year);

	// Find the minimum and maximum years
	const minYear = Math.min(...years);
	const maxYear = Math.max(...years);

	// Output the result
	console.log('Min Year:', minYear);
	console.log('Max Year:', maxYear);

	// Create data for circles:
	const markers = [
		{ long: -97.5, lat: 55, name: 'North America', sales: 0 },
		{ long: 13, lat: 50, name: 'Europe', sales: 0 },
		{ long: 140, lat: 36, name: 'Japan', sales: 0 },
		{ long: 0, lat: 0, name: 'Rest of the World', sales: 0 },
		{ long: -130, lat: -40, name: 'Worldwide', sales: 0 },
	];

	function updateYearRange() {
		console.log('Start Year:', startYear);
		console.log('End Year:', endYear);
		// Query sales data for the range [startYear, endYear)
		const salesData = filteredCSVData.filter((d) => d.Year >= startYear && d.Year < endYear);

		// Calculate the total sales for each region
		const totalNAsales = d3.sum(salesData, (d) => +d.NA_Sales).toFixed(2);
		const totalEUsales = d3.sum(salesData, (d) => +d.EU_Sales).toFixed(2);
		const totalJPsales = d3.sum(salesData, (d) => +d.JP_Sales).toFixed(2);
		const totalOtherSales = d3.sum(salesData, (d) => +d.Other_Sales).toFixed(2);
		const totalGlobalSales = d3.sum(salesData, (d) => +d.Global_Sales).toFixed(2);

		// Update the markers data with the calculated sales values
		markers[0].sales = totalNAsales;
		markers[1].sales = totalEUsales;
		markers[2].sales = totalJPsales;
		markers[3].sales = totalOtherSales;
		markers[4].sales = totalGlobalSales;
		console.log(markers);

		document.getElementById('sliderNote').textContent = `Sales From [${startYear}, ${endYear})`;
	}
	// =================================================================

	// Slider =================================================================
	const startYearSlider = document.getElementById('year1Slider');
	const endYearSlider = document.getElementById('year2Slider');

	const defaultStartYear = 1980;
	const defaultEndYear = 2021;

	startYearSlider.value = defaultStartYear;
	endYearSlider.value = defaultEndYear;

	let startYear = defaultStartYear;
	let endYear = defaultEndYear;
	updateYearRange();

	// Function for the left slider handle
	startYearSlider.addEventListener('input', function year1() {
		this.value = Math.min(this.value, this.parentNode.childNodes[5].value - 1);
		let value = ((this.value - parseInt(this.min)) / (parseInt(this.max) - parseInt(this.min))) * 100;
		var children = this.parentNode.childNodes[1].childNodes;
		children[1].style.width = value + '%';
		children[5].style.left = value + '%';
		children[7].style.left = value + '%';
		children[11].style.left = value + '%';
		children[11].childNodes[1].innerHTML = this.value;
		startYear = parseInt(this.value);
		updateYearRange();
		updateSalesText();
		updateCircleRadius();
	});

	// Function for the right slider handle
	endYearSlider.addEventListener('input', function year2() {
		this.value = Math.max(this.value, this.parentNode.childNodes[3].value - -1);
		let value = ((this.value - parseInt(this.min)) / (parseInt(this.max) - parseInt(this.min))) * 100;
		var children = this.parentNode.childNodes[1].childNodes;
		children[3].style.width = 100 - value + '%';
		children[5].style.right = 100 - value + '%';
		children[9].style.left = value + '%';
		children[13].style.left = value + '%';
		children[13].childNodes[1].innerHTML = this.value;
		endYear = parseInt(this.value);
		updateYearRange();
		updateSalesText();
		updateCircleRadius();
	});

	const playButton = document.getElementById('playButton');

	let isPlaying = false; // Variable to keep track of the play/pause state
	let playInterval; // Variable to store the interval ID for the play loop

	playButton.addEventListener('click', function () {
		if (isPlaying) {
			// If playing, pause the play loop
			isPlaying = false;
			clearInterval(playInterval); // Stop the play loop
			playButton.textContent = 'Play'; // Change the button text to "Play"
		} else {
			// If not playing, start the play loop
			isPlaying = true;
			let year = 1980;
			const endYear = 2022;

			function playLoop() {
				if (year >= endYear) {
					// If the current year is greater than or equal to the end year, stop the play loop
					isPlaying = false;
					playButton.textContent = 'Play'; // Change the button text to "Play"
					return;
				}
				// Update the left handle and right handle, then trigger the "input" event for both
				endYearSlider.value = year;
				endYearSlider.dispatchEvent(new Event('input', { bubbles: true }));

				startYearSlider.value = year;
				startYearSlider.dispatchEvent(new Event('input', { bubbles: true }));

				year++;
				playInterval = setTimeout(playLoop, 300); // Delay the next iteration by 1 second
			}

			playButton.textContent = 'Pause'; // Change the button text to "Pause"
			playLoop();
		}
	});
	// =================================================================

	// Tool Tip ================================================================
	const Tooltip = d3.select('#my_dataviz').append('div');

	// Three function that change the tooltip when user hover / move / leave a cell
	const mouseover = function (event, d) {
		Tooltip.style('opacity', 1);
	};

	function mousemove(event, d) {
		const tooltipDiv = d3.select('#my_dataviz');
		tooltipDiv
			.style('opacity', 1)
			.html(d.name + '<br>' + 'Game Sold: ' + d.sales + 'M')
			.style('left', event.pageX + 'px')
			.style('top', event.pageY + 'px'); // Show the tooltip at the location of the mouse pointer
	}

	function mouseleave(event, d) {
		const tooltipDiv = d3.select('#my_dataviz');
		tooltipDiv.style('opacity', 0);
	}

	// Add circles:
	// Define the radius scale
	const radiusScale = d3
		.scaleSqrt()
		.domain([0, d3.max(markers, (d) => +d.sales)])
		.range([25, 100]);

	// Add circles and text elements:
	const circles = svg
		.selectAll('circle')
		.data(markers)
		.join('g')
		.on('mouseover', mouseover)
		.on('mousemove', mousemove)
		.on('mouseleave', mouseleave)
		.on('click', function (event, d) {
			navigateToDetailsPage(d.name);
		});

	circles
		.append('circle')
		.attr('cx', (d) => projection([d.long, d.lat])[0])
		.attr('cy', (d) => projection([d.long, d.lat])[1])
		.attr('r', (d) => radiusScale(+d.sales)) // Use the scale to set the initial circle radius based on sales
		.attr('class', 'circle')
		.style('fill', '#fff')
		.attr('stroke', '#69b3a2')
		.attr('stroke-width', 5)
		.attr('fill-opacity', 0.4)
		.on('mouseover', mouseover)
		.on('mousemove', mousemove)
		.on('mouseleave', mouseleave);

	circles
		.append('text')
		.attr('x', (d) => projection([d.long, d.lat])[0])
		.attr('y', (d) => projection([d.long, d.lat])[1] + 4) // Adjust the y-offset to center the text inside the circle
		.attr('text-anchor', 'middle')
		.style('cursor', 'pointer')
		.style('font-size', '15px')
		.style('font-weight', 'bold')
		.style('user-select', 'none') // Add this line to prevent text selection
		.text((d) => d.sales + 'M'); // Initial text content

	// Function to smoothly update the sales text in the circles
	function updateSalesText() {
		circles.select('text').text((d) => d.sales + 'M'); // Update the text content with the updated sales data
	}

	// Function to smoothly update the circle radius based on sales
	function updateCircleRadius() {
		circles
			.select('circle')
			.transition() // Add a transition for smooth interpolation
			.duration(500) // Set the transition duration (in milliseconds)
			.attr('r', (d) => radiusScale(+d.sales)); // Update the circle radius based on sales
	}

	//================================================================

	//Redirect to other scene =================================================================
	svg.selectAll('circle').on('click', function (event, d) {
		navigateToDetailsPage(d.name);
	});

	function navigateToDetailsPage(region) {
		// Navigate to the details page with the region name and slider values as query parameters
		window.location.href = `details.html?region=${encodeURIComponent(
			region
		)}&startYear=${startYear}&endYear=${endYear}`;
	}
	//=================================================================
});
