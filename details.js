const width = 800;
const height = 500;

d3.csv(
  "https://raw.githubusercontent.com/Yunado/narrative-viz-video-game-sales/main/vgsales.csv"
).then(function (csvData) {
  // Redirected update =================================================================
  // Title
  // Get the region name from the URL query parameter
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  const region = urlParams.get("region");

  // Update the <h1> element with the region name
  const pageTitle = document.getElementById("pageTitle");
  pageTitle.textContent = `${decodeURIComponent(region)} Video Game Sales`;
  //================================================================

  // GAME DATA ================================================================
  // Filter rows containing "N/A" from CSV data
  const filteredCSVData = csvData.filter(function (d) {
    // Customize this condition to match the columns containing "N/A"
    return !Object.values(d).some((value) => value === "N/A");
  });

  // Extract the years from the filtered CSV data
  const years = filteredCSVData.map((d) => +d.Year);

  // Find the minimum and maximum years
  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);

  // Output the result
  console.log("Min Year:", minYear);
  console.log("Max Year:", maxYear);

  function updateYearRange() {
    console.log("Start Year:", startYear);
    console.log("End Year:", endYear);
    // Query sales data for the range [startYear, endYear)

    document.getElementById(
      "sliderNote"
    ).textContent = `Sales From [${startYear}, ${endYear})`;
  }

  // Function to map the region name to the corresponding sales column
  function getSalesColumn(region) {
    if (region === "North America") {
      return "NA_Sales";
    } else if (region === "Europe") {
      return "EU_Sales";
    } else if (region === "Japan") {
      return "JP_Sales";
    } else if (region === "Rest of the World") {
      return "Other_Sales";
    } else if (region === "Worldwide") {
      return "Global_Sales";
    } else {
      return null; // If the region doesn't match any of the above, return null
    }
  }

  // Create an empty sales data object to store the sales for each year
  const salesDataByYear = {};

  // Loop through the years from 1980 to 2020 and calculate the total sales for each year for the given region
  for (let year = 1980; year <= 2020; year++) {
    // Filter the sales data for the current year
    const salesDataForYear = filteredCSVData.filter((d) => +d.Year === year);
    // Get the corresponding sales column for the region
    const salesColumn = getSalesColumn(region);
    // Calculate the total sales for the current year
    const totalSales = d3.sum(salesDataForYear, (d) => +d[salesColumn]);
    salesDataByYear[year] = parseFloat(totalSales.toFixed(2));
  }

  // Output the sales data object
  console.log(salesDataByYear);
  // =================================================================

  // Scatter Plot ==================================================================
  const margin = { top: 50, right: 50, bottom: 50, left: 50 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;
  // Create the SVG element for the scatter plot
  // Create the SVG element for the line chart
  const lineSvg = d3
    .select("#lineChart")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  // Create the chart group
  const chart = lineSvg
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  // Get the sales data as an array of objects with year and sales properties
  const salesDataArray = Object.entries(salesDataByYear).map(
    ([year, sales]) => ({
      year: +year,
      sales: sales,
    })
  );

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
    .append("path")
    .datum(salesDataArray)
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 2)
    .attr("d", line);

  let startYear = parseInt(urlParams.get("startYear"));
  let endYear = parseInt(urlParams.get("endYear"));
  // Draw the scatter plot points
  const dots = chart
    .selectAll("circle")
    .data(salesDataArray)
    .enter()
    .append("circle")
    .attr("cx", (d) => xScale(d.year))
    .attr("cy", (d) => yScale(d.sales))
    .attr("r", 5)
    .attr("fill", (d) =>
      d.year >= startYear && d.year < endYear ? "lightcoral" : "steelblue"
    );

  function updateDotColors() {
    dots.attr("fill", (d) =>
      d.year >= startYear && d.year < endYear ? "lightcoral" : "steelblue"
    );
  }

  // Draw the x-axis
  const xAxis = d3.axisBottom(xScale);
  chart
    .append("g")
    .attr("transform", `translate(0, ${chartHeight})`)
    .call(xAxis);

  // Draw the y-axis
  const yAxis = d3.axisLeft(yScale);
  chart.append("g").call(yAxis);

  // Add axis labels
  chart
    .append("text")
    .attr("x", chartWidth / 2)
    .attr("y", chartHeight + margin.bottom - 10)
    .attr("text-anchor", "middle")
    .text("Year");

  chart
    .append("text")
    .attr("x", -chartHeight / 2)
    .attr("y", -margin.left + 10)
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .text("Sales (M)");
  // =================================================================

  // Slider =================================================================
  const startYearSlider = document.getElementById("year1Slider");
  const endYearSlider = document.getElementById("year2Slider");

  const defaultStartYear = 1980;
  const defaultEndYear = 2021;

  startYearSlider.value = defaultStartYear;
  endYearSlider.value = defaultEndYear;

  console.log(startYear, endYear);

  updateYearRange();

  // Function for the left slider handle
  startYearSlider.addEventListener("input", function year1() {
    this.value = Math.min(this.value, this.parentNode.childNodes[5].value - 1);
    let value =
      ((this.value - parseInt(this.min)) /
        (parseInt(this.max) - parseInt(this.min))) *
      100;
    var children = this.parentNode.childNodes[1].childNodes;
    children[1].style.width = value + "%";
    children[5].style.left = value + "%";
    children[7].style.left = value + "%";
    children[11].style.left = value + "%";
    children[11].childNodes[1].innerHTML = this.value;
    startYear = parseInt(this.value);
    updateYearRange();
    updateDotColors();
  });

  // Function for the right slider handle
  endYearSlider.addEventListener("input", function year2() {
    this.value = Math.max(this.value, this.parentNode.childNodes[3].value - -1);
    let value =
      ((this.value - parseInt(this.min)) /
        (parseInt(this.max) - parseInt(this.min))) *
      100;
    var children = this.parentNode.childNodes[1].childNodes;
    children[3].style.width = 100 - value + "%";
    children[5].style.right = 100 - value + "%";
    children[9].style.left = value + "%";
    children[13].style.left = value + "%";
    children[13].childNodes[1].innerHTML = this.value;
    endYear = parseInt(this.value);
    updateYearRange();
    updateDotColors();
  });

  // Function to update the slider handles with the query parameter values
  function updateSliderHandles() {
    // Manually trigger the "input" event on both sliders to update their positions
    endYearSlider.value = endYear;
    endYearSlider.dispatchEvent(new Event("input", { bubbles: true }));

    startYearSlider.value = startYear;
    startYearSlider.dispatchEvent(new Event("input", { bubbles: true }));
  }

  // Call the function to update the slider handles when the page loads
  updateSliderHandles();

  // Back to World Map button
  const backButton = document.getElementById("backButton");
  backButton.addEventListener("click", function () {
    window.location.href = `index.html`;
  });

  const playButton = document.getElementById("playButton");

  let isPlaying = false; // Variable to keep track of the play/pause state
  let playInterval; // Variable to store the interval ID for the play loop

  playButton.addEventListener("click", function () {
    if (isPlaying) {
      // If playing, pause the play loop
      isPlaying = false;
      clearInterval(playInterval); // Stop the play loop
      playButton.textContent = "Play"; // Change the button text to "Play"
    } else {
      // If not playing, start the play loop
      isPlaying = true;
      let year = 1980;
      const endYear = 2022;

      function playLoop() {
        if (year >= endYear) {
          // If the current year is greater than or equal to the end year, stop the play loop
          isPlaying = false;
          playButton.textContent = "Play"; // Change the button text to "Play"
          return;
        }
        // Update the left handle and right handle, then trigger the "input" event for both
        endYearSlider.value = year;
        endYearSlider.dispatchEvent(new Event("input", { bubbles: true }));

        startYearSlider.value = year;
        startYearSlider.dispatchEvent(new Event("input", { bubbles: true }));

        year++;
        playInterval = setTimeout(playLoop, 300); // Delay the next iteration by 1 second
      }

      playButton.textContent = "Pause"; // Change the button text to "Pause"
      playLoop();
    }
  });
  // =================================================================
});
