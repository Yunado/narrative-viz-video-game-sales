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
	pageTitle.textContent = `${decodeURIComponent(region)} Top 10 Games`;
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
			return null;
		}
	}

	// Function to filter data by region and year range and get the rows with highest sales rank
	function getMostSoldGamesByYearRange(region, startYear, endYear, data) {
		const salesColumn = getSalesColumn(region);
		if (!salesColumn) {
			return [];
		}

		const filteredData = data.filter((d) => d.Year >= startYear && d.Year < endYear);

		// Sort the filtered data by sales in descending order
		filteredData.sort((a, b) => b[salesColumn] - a[salesColumn]);

		const topRankedGames = filteredData.slice(0, 10).map((d) => ({
			...d,
			Sales: parseFloat(d[salesColumn]).toFixed(2),
		}));

		return topRankedGames;
	}

	let topRankedGames = getMostSoldGamesByYearRange(region, startYear, endYear, filteredCSVData);

	// Function to filter data by region and year range and get the rows with highest sales rank for publishers
	function getMostSoldPublishersByYearRange(region, startYear, endYear, data) {
		const salesColumn = getSalesColumn(region);
		if (!salesColumn) {
			return [];
		}

		const filteredData = data.filter((d) => d.Year >= startYear && d.Year < endYear);

		// Create an object to store total sales for each publisher
		const publisherSales = {};

		filteredData.forEach((game) => {
			const publisher = game.Publisher;
			const sales = parseFloat(game[salesColumn]);

			if (!publisherSales[publisher]) {
				publisherSales[publisher] = sales;
			} else {
				publisherSales[publisher] += sales;
			}
		});

		const publisherSalesArray = Object.entries(publisherSales).map(([publisher, sales]) => ({
			Name: publisher,
			Sales: sales.toFixed(2),
		}));

		publisherSalesArray.sort((a, b) => b.Sales - a.Sales);

		return publisherSalesArray.slice(0, 10);
	}

	let topRankedPublishers = getMostSoldPublishersByYearRange(region, startYear, endYear, filteredCSVData);
	// =================================================================

	// Tool Tip ================================================================
	let currentDataSet = 'games';
	const Tooltip = d3.select('#BarChart').append('div');

	// Function to show the tooltip
	function showTooltip(event, d) {
		Tooltip.style('opacity', 1);

		const tooltipDiv = d3.select('#my_dataviz');
		tooltipDiv
			.style('opacity', 1)
			.html(
				`Year: ${d.Year}<br>Name: ${d.Name}<br>Genre: ${d.Genre}<br>Platform: ${d.Platform}<br>Publisher: ${d.Publisher}<br>Sales: ${d.Sales}M`
			);

		if (currentDataSet === 'publishers') {
			tooltipDiv.style('opacity', 1).html(`Publisher: ${d.Name}<br>Total Sales: ${d.Sales}M`);
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

	// Bar Graph ==================================================================
	const margin = { top: 50, right: 50, bottom: 100, left: 125 };
	const chartWidth = width - margin.left - margin.right;
	const chartHeight = height - margin.top - margin.bottom;

	// Create the SVG element for the bar chart
	const BarSvg = d3.select('#BarChart').append('svg').attr('width', width).attr('height', height);

	// Create the chart group
	const chart = BarSvg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`);

	let topRankedData = topRankedGames;

	// Function to update the bar chart based on the top ranked games
	function updateBarChart() {
		// Remove the existing x-axis and y-axis groups
		chart.select('.x-axis').remove();
		chart.select('.y-axis').remove();

		// Create scales for the x and y axes
		const xScale = d3
			.scaleBand()
			.domain(topRankedData.map((d) => d.Name))
			.range([0, chartWidth])
			.paddingInner(0.1)
			.paddingOuter(0.2);

		const yScale = d3
			.scaleLinear()
			.domain([0, d3.max(topRankedData, (d) => +d.Sales)])
			.range([chartHeight, 0]);

		// Draw the x-axis
		const xAxis = d3
			.axisBottom(xScale)
			.tickFormat((d) => d)
			.tickSize(0);

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
		const bars = chart.selectAll('.bar').data(topRankedData, (d) => d.Name);

		bars.exit().remove();

		bars.enter()
			.append('rect')
			.attr('class', 'bar')
			.attr('x', (d) => xScale(d.Name))
			.attr('width', xScale.bandwidth())
			.attr('y', chartHeight)
			.attr('height', 0)
			.on('mouseover', showTooltip)
			.on('mouseout', hideTooltip)
			.transition()
			.duration(500)
			.attr('y', (d) => yScale(d.Sales))
			.attr('height', (d) => chartHeight - yScale(d.Sales));

		bars.transition()
			.duration(500)
			.attr('x', (d) => xScale(d.Name))
			.attr('width', xScale.bandwidth())
			.attr('y', (d) => yScale(d.Sales))
			.attr('height', (d) => chartHeight - yScale(d.Sales));
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

	updateYearRange();

	// Function to update the bar chart when the slider handles are dragged
	function updateBarChartOnSliderChange() {
		updateYearRange();
		topRankedGames = getMostSoldGamesByYearRange(region, startYear, endYear, filteredCSVData);
		topRankedPublishers = getMostSoldPublishersByYearRange(region, startYear, endYear, filteredCSVData);
		topRankedData = currentDataSet === 'games' ? topRankedGames : topRankedPublishers;
		updateBarChart();
	}

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
		updateBarChartOnSliderChange();
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
		updateBarChartOnSliderChange();
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

	// Back to line chart button
	const backButton = document.getElementById('backButton');
	backButton.addEventListener('click', function () {
		const queryString = `?region=${encodeURIComponent(region)}&startYear=${startYear}&endYear=${endYear}`;
		window.location.href = `details.html${queryString}`;
	});

	const playButton = document.getElementById('playButton');
	playButton.textContent = 'Top 10 Publishers';

	// Function to switch between data sets
	function switchDataSets() {
		if (currentDataSet === 'games') {
			currentDataSet = 'publishers';
			const pageTitle = document.getElementById('pageTitle');
			pageTitle.textContent = `${decodeURIComponent(region)} Top 10 Publishers`;
			playButton.textContent = 'Top 10 Games';
		} else {
			currentDataSet = 'games';
			const pageTitle = document.getElementById('pageTitle');
			pageTitle.textContent = `${decodeURIComponent(region)} Top 10 Games`;
			playButton.textContent = 'Top 10 Games';
		}
	}

	playButton.addEventListener('click', function () {
		switchDataSets();
		const currentData = currentDataSet === 'games' ? topRankedGames : topRankedPublishers;
		topRankedData = currentData;
		updateBarChart();
	});
	// =================================================================
});
