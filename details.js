const width = 800;
const height = 500;

d3.csv('https://raw.githubusercontent.com/Yunado/narrative-viz-video-game-sales/main/vgsales.csv').then(function (
	csvData
) {
	// Redirected update =================================================================
	// Title
	// Get the region name from the URL query parameter
	const queryString = window.location.search;
	const urlParams = new URLSearchParams(queryString);
	const region = urlParams.get('region');

	// Update the <h1> element with the region name
	const pageTitle = document.getElementById('pageTitle');
	pageTitle.textContent = `${decodeURIComponent(region)} Video Game Sales`;
	//================================================================

	// GAME DATA ================================================================
	// Filter rows containing "N/A" from CSV data
	const filteredCSVData = csvData.filter(function (d) {
		return !Object.values(d).some((value) => value === 'N/A');
	});

	function updateYearRange() {
		document.getElementById('sliderNote').textContent = `Sales From [${startYear},${endYear})`;
	}

	// Function to map the region name to the corresponding sales column
	function getSalesColumn(region) {
		if (region === 'North America') {
			return 'NA_Sales';
		} else if (region === 'Europe') {
			return 'EU_Sales';
		} else if (region === 'Japan') {
			return 'JP_Sales';
		} else if (region === 'Rest of the World') {
			return 'Other_Sales';
		} else if (region === 'Worldwide') {
			return 'Global_Sales';
		} else {
			return null; // If the region doesn't match any of the above, return null
		}
	}

	// Create an empty sales data object to store the sales for each year
	const salesDataByYear = {};

	for (let year = 1980; year <= 2020; year++) {
		const salesDataForYear = filteredCSVData.filter((d) => +d.Year === year);
		const salesColumn = getSalesColumn(region);
		// Calculate the total sales for the current year
		const totalSales = d3.sum(salesDataForYear, (d) => +d[salesColumn]);
		salesDataByYear[year] = parseFloat(totalSales.toFixed(2));
	}

	const firstYearByPlatform = {};

	// Loop through the filtered CSV data to find the first year of platform releases
	filteredCSVData.forEach((game) => {
		const platform = game.Platform;
		const year = +game.Year;

		if (!firstYearByPlatform[platform] || year < firstYearByPlatform[platform]) {
			firstYearByPlatform[platform] = year;
		}
	});

	// Create an empty object to store the result
	const platformsByYear = {};
	const majorConsole = [
		'NES',
		'SNES',
		'PS',
		'XB',
		'PS2',
		'GBA',
		'PSP',
		'DS',
		'X360',
		'Wii',
		'PS3',
		'3DS',
		'PS4',
		'XOne',
	];

	for (const platform in firstYearByPlatform) {
		const year = firstYearByPlatform[platform];

		if (majorConsole.includes(platform)) {
			if (!platformsByYear[year]) {
				platformsByYear[year] = [platform];
			} else {
				platformsByYear[year].push(platform);
			}
		}
	}
	// =================================================================

	// Tool Tip ================================================================
	const Tooltip = d3.select('#lineChart').append('div');

	// Function to show the tooltip
	function showTooltip(event, d) {
		Tooltip.style('opacity', 1);

		const tooltipDiv = d3.select('#my_dataviz');
		tooltipDiv.style('opacity', 1).html(`Year: ${d.year}<br>Sales: ${d.sales}M`);

		const plats = platformsByYear[d.year];
		if (plats) {
			tooltipDiv.html(`Year: ${d.year}<br>Sales: ${d.sales}M<br>Platform released: ${plats}`);
		}

		// Position the tooltip next to the mouse pointer
		tooltipDiv.style('left', event.pageX + 'px').style('top', event.pageY - 10 + 'px');
	}

	// Function to hide the tooltip
	function hideTooltip() {
		const tooltipDiv = d3.select('#my_dataviz');
		tooltipDiv.style('opacity', 0);
	}
	// =================================================================

	// Line Graph ==================================================================
	const margin = { top: 50, right: 50, bottom: 50, left: 50 };
	const chartWidth = width - margin.left - margin.right;
	const chartHeight = height - margin.top - margin.bottom;
	// Create the SVG element for the line chart
	const lineSvg = d3.select('#lineChart').append('svg').attr('width', width).attr('height', height);

	// Create the chart group
	const chart = lineSvg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`);

	// Get the sales data as an array of objects with year and sales properties
	const salesDataArray = Object.entries(salesDataByYear).map(([year, sales]) => ({
		year: +year,
		sales: sales,
	}));

	// Create scales for the x and y axes
	const xScale = d3.scaleLinear().domain([1980, 2020]).range([0, chartWidth]);

	const yScale = d3
		.scaleLinear()
		.domain([0, d3.max(salesDataArray, (d) => d.sales)])
		.range([chartHeight, 0]);

	// Draw the line connecting the data points
	const line = d3
		.line()
		.x((d) => xScale(d.year))
		.y((d) => yScale(d.sales));

	chart
		.append('path')
		.datum(salesDataArray)
		.attr('fill', 'none')
		.attr('stroke', 'steelblue')
		.attr('stroke-width', 2)
		.attr('d', line);

	let startYear = parseInt(urlParams.get('startYear'));
	let endYear = parseInt(urlParams.get('endYear'));

	// Function to redirect to the new HTML page with URL parameters
	function redirectToBarChart(region, startYear, endYear) {
		const queryString = `?region=${encodeURIComponent(region)}&startYear=${startYear}&endYear=${endYear}`;
		window.location.href = `barchart.html${queryString}`;
	}

	// Draw the scatter plot points
	const dots = chart
		.selectAll('circle')
		.data(salesDataArray)
		.enter()
		.append('circle')
		.attr('class', 'circleGroup')
		.attr('cx', (d) => xScale(d.year))
		.attr('cy', (d) => yScale(d.sales))
		.attr('r', 6)
		.attr('fill', (d) => (d.year >= startYear && d.year < endYear ? 'lightcoral' : 'steelblue'))
		.on('mouseover', showTooltip)
		.on('mousemove', showTooltip)
		.on('mouseleave', hideTooltip)
		.on('click', function (event, d) {
			// On dot click, redirect to the new page with region, startYear, and endYear as URL parameters
			redirectToBarChart(region, startYear, endYear);
		});

	function updateDotColors() {
		dots.attr('fill', (d) => (d.year >= startYear && d.year < endYear ? 'lightcoral' : 'steelblue'));
	}

	// Draw the x-axis
	const xAxisFormat = d3.format('.0f');
	const xAxis = d3.axisBottom(xScale).tickFormat(xAxisFormat);
	chart.append('g').attr('transform', `translate(0, ${chartHeight})`).call(xAxis);

	// Draw the y-axis
	const yAxis = d3.axisLeft(yScale);
	chart.append('g').call(yAxis);

	// Add axis labels
	chart
		.append('text')
		.attr('x', chartWidth / 2)
		.attr('y', chartHeight + margin.bottom - 10)
		.attr('text-anchor', 'middle')
		.text('Year');

	chart
		.append('text')
		.attr('x', -chartHeight / 2)
		.attr('y', -margin.left + 10)
		.attr('text-anchor', 'middle')
		.attr('transform', 'rotate(-90)')
		.text('Sales (M)');
	// =================================================================

	// Annotation =================================================================
	let lineX2 = [0, 0, 0, 65, -45, 35, -15, 30, 60];
	let lineY2 = [-100, -125, -150, 20, -55, 55, -80, -25, -55];
	let tagX2 = [-40, -40, -40, 25, -75, -5, -80, 30, 20];
	let tagY2 = [-100, -125, -175, 10, -75, 50, -100, -60, -70];
	if (region === 'Japan') {
		lineX2 = [0, -10, -40, -10, 65, -50, 55, 70, 80];
		lineY2 = [-100, -125, -80, 50, 55, -45, 0, -55, 0];
		tagX2 = [-40, -50, -80, -55, 25, -90, 30, 30, 40];
		tagY2 = [-100, -125, -110, 50, 25, -75, -20, -60, -20];
	}
	// Function to create annotations
	function createAnnotations() {
		const annotations = chart
			.selectAll('.annotation')
			.data(Object.entries(platformsByYear))
			.enter()
			.append('g')
			.attr('class', 'annotation');

		// Add lines pointing to the circles
		annotations
			.append('line')
			.attr('x1', (d) => xScale(d[0]))
			.attr('y1', (d) => yScale(salesDataByYear[d[0]]))
			.attr('x2', (d, i) => xScale(d[0]) + lineX2[i])
			.attr('y2', (d, i) => yScale(salesDataByYear[d[0]]) + lineY2[i])
			.attr('stroke', 'black')
			.attr('stroke-width', 1);

		// Add HTML elements for the annotations
		annotations
			.append('foreignObject')
			.attr('x', (d, i) => xScale(d[0]) + tagX2[i])
			.attr('y', (d, i) => yScale(salesDataByYear[d[0]]) + tagY2[i])
			.attr('width', 80)
			.attr('height', 50)
			.html((d) => `<div class="annotation-text">${d[1].join(',')} Released</div>`);
	}

	// Call the function to create annotations
	createAnnotations();
	// =================================================================

	// Slider =================================================================
	const startYearSlider = document.getElementById('year1Slider');
	const endYearSlider = document.getElementById('year2Slider');

	const defaultStartYear = 1980;
	const defaultEndYear = 2021;

	startYearSlider.value = defaultStartYear;
	endYearSlider.value = defaultEndYear;

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
		updateDotColors();
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
		updateDotColors();
	});

	// Function to update the slider handles with the query parameter values
	function updateSliderHandles() {
		// Manually trigger the "input" event on both sliders to update their positions
		endYearSlider.value = endYear;
		endYearSlider.dispatchEvent(new Event('input', { bubbles: true }));

		startYearSlider.value = startYear;
		startYearSlider.dispatchEvent(new Event('input', { bubbles: true }));
	}

	// Call the function to update the slider handles when the page loads
	updateSliderHandles();

	// Back to World Map button
	const backButton = document.getElementById('backButton');
	backButton.addEventListener('click', function () {
		window.location.href = `index.html`;
	});

	const playButton = document.getElementById('playButton');

	let isPlaying = false;
	let playInterval;
	let year = 1980;

	playButton.addEventListener('click', function () {
		if (isPlaying) {
			// If playing, pause the play loop
			isPlaying = false;
			clearInterval(playInterval);
			playButton.textContent = 'Play';
		} else {
			// If not playing, start the play loop
			isPlaying = true;
			const endYear = 2022;
			if (year == endYear) {
				year = 1980;
			}

			function playLoop() {
				// show each year's tooltip while playing
				const tooltipY = parseInt(startYearSlider.value) + 1;
				if (tooltipY < 2021) {
					const currentData = salesDataByYear[tooltipY];
					const x = xScale(tooltipY);
					const y = yScale(currentData);

					// Update the tooltip's position
					Tooltip.style('opacity', 1);
					const tooltipDiv = d3.select('#my_dataviz');
					tooltipDiv.style('opacity', 1).html(`Year: ${tooltipY}<br>Sales: ${currentData}M`);

					const plats = platformsByYear[tooltipY];
					if (plats) {
						tooltipDiv.html(`Year: ${tooltipY}<br>Sales: ${currentData}M<br>Platform released: ${plats}`);
					}

					// Position the tooltip below the h1 element with id "pageTitle"
					const pageTitleElement = document.getElementById('pageTitle');
					const pageTitleRect = pageTitleElement.getBoundingClientRect();
					const pageX = pageTitleRect.left + 50;
					const pageY = pageTitleRect.bottom + 40;

					tooltipDiv.style('left', `${pageX + x}px`).style('top', `${pageY + y}px`);
				}

				if (year >= endYear) {
					isPlaying = false;
					playButton.textContent = 'Play';
					return;
				}
				// Update the left and right handle
				endYearSlider.value = year;
				endYearSlider.dispatchEvent(new Event('input', { bubbles: true }));

				startYearSlider.value = year;
				startYearSlider.dispatchEvent(new Event('input', { bubbles: true }));

				year++;
				playInterval = setTimeout(playLoop, 500);
			}

			playButton.textContent = 'Pause';
			playLoop();
		}
	});
	// =================================================================
});
