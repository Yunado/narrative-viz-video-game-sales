const width = 800;
const height = 500;

const lingChart = d3.select("#lineChart")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

d3.csv("https://raw.githubusercontent.com/Yunado/narrative-viz-video-game-sales/main/vgsales.csv").then(function (csvData) {
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
        // Customize this condition to match the columns containing "N/A"
        return !Object.values(d).some(value => value === "N/A");
    });

    // Extract the years from the filtered CSV data
    const years = filteredCSVData.map(d => +d.Year);

    // Find the minimum and maximum years
    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);

    // Output the result
    console.log("Min Year:", minYear);
    console.log("Max Year:", maxYear);

    function updateYearRange() {
        console.log('Start Year:', startYear);
        console.log('End Year:', endYear);
        // Query sales data for the range [startYear, endYear)

        document.getElementById('sliderNote').textContent = `Sales From [${startYear}, ${endYear})`;
    }
    // =================================================================

    // Scatter Plot ==================================================================

    // =================================================================

    // Slider =================================================================
    const startYearSlider = document.getElementById('year1Slider');
    const endYearSlider = document.getElementById('year2Slider');

    const defaultStartYear = 1980;
    const defaultEndYear = 2021;

    startYearSlider.value = defaultStartYear;
    endYearSlider.value = defaultEndYear;

    let startYear = parseInt(urlParams.get('startYear'));
    let endYear = parseInt(urlParams.get('endYear'));
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
    });

    // Function for the right slider handle
    endYearSlider.addEventListener('input', function year2() {
        this.value = Math.max(this.value, this.parentNode.childNodes[3].value - (-1));
        let value = ((this.value - parseInt(this.min)) / (parseInt(this.max) - parseInt(this.min))) * 100;
        var children = this.parentNode.childNodes[1].childNodes;
        children[3].style.width = (100 - value) + '%';
        children[5].style.right = (100 - value) + '%';
        children[9].style.left = value + '%';
        children[13].style.left = value + '%';
        children[13].childNodes[1].innerHTML = this.value;
        endYear = parseInt(this.value);
        updateYearRange();
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
});

