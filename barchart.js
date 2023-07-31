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
	let startYear = parseInt(urlParams.get('startYear'));
	let endYear = parseInt(urlParams.get('endYear'));

	// Update the <h1> element with the region name
	const pageTitle = document.getElementById('pageTitle');
	pageTitle.textContent = `${decodeURIComponent(region)} Bar`;
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

	function updateYearRange() {
		console.log('Start Year:', startYear);
		console.log('End Year:', endYear);
		// Query sales data for the range [startYear, endYear)

		document.getElementById('sliderNote').textContent = `Sales From [${startYear}, ${endYear})`;
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

	// Create an empty object to store the first year of game releases for each platform
	const firstYearByPlatform = {};

	// Loop through the filtered CSV data to find the first year of game releases for each platform
	filteredCSVData.forEach((game) => {
		const platform = game.Platform;
		const year = +game.Year;

		// If the platform is not yet recorded in the firstYearByPlatform object or if the current year is earlier than the recorded year for that platform, update the first year
		if (!firstYearByPlatform[platform] || year < firstYearByPlatform[platform]) {
			firstYearByPlatform[platform] = year;
		}
	});

	// Output the result
	console.log(firstYearByPlatform);

	// Function to filter data by region and year range and get the rows with highest sales rank
	function getMostSoldGamesByYearRange(region, startYear, endYear, data) {
		const salesColumn = getSalesColumn(region);
		if (!salesColumn) {
			// If the region doesn't match any of the predefined regions, return an empty array
			return [];
		}

		// Filter data by region and year range
		const filteredData = data.filter((d) => d.Year >= startYear && d.Year < endYear);

		// Sort the filtered data by sales in descending order
		filteredData.sort((a, b) => b[salesColumn] - a[salesColumn]);

		// Map the sales data to a new property called "sales"
		const topRankedGames = filteredData.slice(0, 10).map((d) => ({
			...d, // Copy all properties from the original object
			Sales: parseFloat(d[salesColumn]), // Map the sales data to the "sales" property
		}));

		return topRankedGames;
	}

	// Get the rows of the most sold games in the start and end years for the specified region
	let topRankedGames = getMostSoldGamesByYearRange(region, startYear, endYear, filteredCSVData);

	// Output the top-ranked games to the console
	console.log('Top Ranked Games:', topRankedGames);
	// =================================================================

	// Tool Tip ================================================================
	const Tooltip = d3.select('#BarChart').append('div');

	// Function to show the tooltip
	function showTooltip(event, d) {
		Tooltip.style('opacity', 1);

		const tooltipDiv = d3.select('#my_dataviz');
		tooltipDiv
			.style('opacity', 1)
			.html(
				`Year: ${d.Year}<br>Name: ${d.Name}<br>Platform: ${d.Platform}<br>Publisher: ${d.Publisher}<br>Sales: ${d.Sales}M`
			);

		// Position the tooltip next to the mouse pointer
		tooltipDiv.style('left', event.pageX + 'px').style('top', event.pageY - 10 + 'px');
	}

	// Function to hide the tooltip
	function hideTooltip() {
		const tooltipDiv = d3.select('#my_dataviz');
		tooltipDiv.style('opacity', 0);
	}
	// =================================================================

	// Bar Graph ==================================================================
	const margin = { top: 50, right: 50, bottom: 100, left: 125 };
	const chartWidth = width - margin.left - margin.right;
	const chartHeight = height - margin.top - margin.bottom;

	// Create the SVG element for the bar chart
	const BarSvg = d3.select('#BarChart').append('svg').attr('width', width).attr('height', height);

	// Create the chart group
	const chart = BarSvg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`);

	// Define a color scale for the platforms
	const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

	// Function to update the bar chart based on the top ranked games
	function updateBarChart() {
		// Remove the existing x-axis and y-axis groups
		chart.select('.x-axis').remove();
		chart.select('.y-axis').remove();

		// Create scales for the x and y axes
		const xScale = d3
			.scaleBand()
			.domain(topRankedGames.map((d) => d.Name))
			.range([0, chartWidth])
			.paddingInner(0.1)
			.paddingOuter(0.2);

		const yScale = d3
			.scaleLinear()
			.domain([0, d3.max(topRankedGames, (d) => +d.Sales)])
			.range([chartHeight, 0]);

		// Draw the x-axis
		const xAxis = d3
			.axisBottom(xScale)
			.tickFormat((d) => d) // Format the tick labels as needed
			.tickSize(0); // Hide the tick lines

		chart
			.append('g')
			.attr('class', 'x-axis')
			.attr('transform', `translate(0, ${chartHeight})`)
			.call(xAxis)
			.selectAll('text')
			.attr('transform', 'rotate(-15)')
			.attr('text-anchor', 'end')
			.attr('dx', '1em')
			.attr('dy', '2em');

		// Draw the y-axis
		const yAxis = d3.axisLeft(yScale);
		chart.append('g').attr('class', 'y-axis').call(yAxis);

		// Add axis labels
		chart
			.append('text')
			.attr('x', chartWidth / 2)
			.attr('y', chartHeight + margin.bottom - 10)
			.attr('text-anchor', 'middle');

		chart
			.append('text')
			.attr('x', -chartHeight / 2)
			.attr('y', -margin.left + 10)
			.attr('text-anchor', 'middle')
			.attr('transform', 'rotate(-90)')
			.text('Sales (M)');

		// Update the bars
		const bars = chart.selectAll('.bar').data(topRankedGames, (d) => d.Name);

		// Exit
		bars.exit().remove();

		// Enter
		bars.enter()
			.append('rect')
			.attr('class', 'bar')
			.attr('x', (d) => xScale(d.Name))
			.attr('width', xScale.bandwidth())
			.attr('y', chartHeight) // Set initial height to 0
			.attr('height', 0) // Set initial height to 0
			.on('mouseover', showTooltip)
			.on('mouseout', hideTooltip)
			.transition()
			.duration(500)
			.attr('y', (d) => yScale(d.Sales))
			.attr('height', (d) => chartHeight - yScale(d.Sales));

		// Update
		bars.transition()
			.duration(500)
			.attr('x', (d) => xScale(d.Name))
			.attr('width', xScale.bandwidth())
			.attr('y', (d) => yScale(d.Sales))
			.attr('height', (d) => chartHeight - yScale(d.Sales))
			.attr('fill', (d) => colorScale(d.Platform));
	}

	// Call the function to initially create the bar chart
	updateBarChart();
	// =================================================================

	// Slider =================================================================
	const startYearSlider = document.getElementById('year1Slider');
	const endYearSlider = document.getElementById('year2Slider');

	const defaultStartYear = 1980;
	const defaultEndYear = 2021;

	startYearSlider.value = defaultStartYear;
	endYearSlider.value = defaultEndYear;

	console.log(startYear, endYear);

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
		topRankedGames = getMostSoldGamesByYearRange(region, startYear, endYear, filteredCSVData);
		updateBarChart();
		// updateDotColors();
		console.log('Top Ranked Games:', topRankedGames);
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
		topRankedGames = getMostSoldGamesByYearRange(region, startYear, endYear, filteredCSVData);
		updateBarChart();
		// updateDotColors();
		console.log('Top Ranked Games:', topRankedGames);
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
		const queryString = `?region=${encodeURIComponent(region)}&startYear=${startYear}&endYear=${endYear}`;
		window.location.href = `details.html${queryString}`;
	});

	const playButton = document.getElementById('playButton');

	let isPlaying = false; // Variable to keep track of the play/pause state
	let playInterval; // Variable to store the interval ID for the play loop
	let year = 1980;

	playButton.addEventListener('click', function () {
		if (isPlaying) {
			// If playing, pause the play loop
			isPlaying = false;
			clearInterval(playInterval); // Stop the play loop
			playButton.textContent = 'Play'; // Change the button text to "Play"
		} else {
			// If not playing, start the play loop
			isPlaying = true;
			const endYear = 2022;
			if (year == endYear) {
				year = 1980;
			}

			function playLoop() {
				// show each year's tooltip while playing
				// const tooltipY = parseInt(startYearSlider.value) + 1;
				// if (tooltipY < 2021) {
				// 	const currentData = salesDataByYear[tooltipY];
				// 	const x = xScale(tooltipY);
				// 	const y = yScale(currentData);

				// 	// Update the tooltip's position
				// 	Tooltip.style('opacity', 1);
				// 	const tooltipDiv = d3.select('#my_dataviz');
				// 	tooltipDiv.style('opacity', 1).html(`Year: ${tooltipY}<br>Sales: ${currentData}M`);

				// 	const plats = platformsByYear[tooltipY];
				// 	if (plats) {
				// 		tooltipDiv.html(`Year: ${tooltipY}<br>Sales: ${currentData}M<br>Platform released: ${plats}`);
				// 	}

				// 	// Position the tooltip below the h1 element with id "pageTitle"
				// 	const pageTitleElement = document.getElementById('pageTitle');
				// 	const pageTitleRect = pageTitleElement.getBoundingClientRect();
				// 	console.log(pageTitleRect.left, pageTitleRect.bottom);
				// 	const pageX = pageTitleRect.left + 50;
				// 	const pageY = pageTitleRect.bottom + 40; // Add some padding between h1 element and tooltip

				// 	tooltipDiv.style('left', `${pageX + x}px`).style('top', `${pageY + y}px`);
				// }

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
				playInterval = setTimeout(playLoop, 500); // Delay the next iteration by 1 second
			}

			playButton.textContent = 'Pause'; // Change the button text to "Pause"
			playLoop();
		}
	});
	// =================================================================
});
