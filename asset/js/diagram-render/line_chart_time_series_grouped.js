/**
 * This diagram type will consume a dataset in the following format:
 * [{label_1: "{YYYY-MM-DDTHH:MM:SS}", label_2: "{label}", value: {int}}]
 * It will also read the sample rate from the dataset data.
 */
Datavis.addDiagramType('line_chart_time_series_grouped', (div, dataset, datasetData, diagramData, blockData) => {

    // Set the dimensions and margins of the chart.
    let width = diagramData.width ? parseInt(diagramData.width) : 700;
    let height = diagramData.height ? parseInt(diagramData.height) : 700;
    const margin = {
        top: diagramData.margin_top ? parseInt(diagramData.margin_top) : 30,
        right: diagramData.margin_right ? parseInt(diagramData.margin_right) : 30,
        bottom: diagramData.margin_bottom ? parseInt(diagramData.margin_bottom) : 100,
        left: diagramData.margin_left ? parseInt(diagramData.margin_left) : 60
    };
    width = width - margin.left - margin.right;
    height = height - margin.top - margin.bottom;

    // Add the svg.
    div.style.maxWidth = `${width + margin.left + margin.right}px`
    const svg = d3.select(div)
        .append('svg')
            .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
            .append('g')
                .attr('transform', `translate(${margin.left},${margin.top})`);

    // Group the dataset by label_2.
    const nestedDataset = d3.nest()
        .key(d => d.label_2)
        .entries(dataset);

    // Set the color palette.
    const keys = nestedDataset.map(d => d.key);
    const color = d3.scaleOrdinal()
        .domain(keys)
        .range(['#e41a1c','#377eb8','#4daf4a','#984ea3','#ff7f00','#ffff33','#a65628','#f781bf','#999999']);

    dataset.map(d => {
        // Set the Date object needed by d3.
        d.datetime = d3.timeParse('%Y-%m-%dT%H:%M:%S')(d.label_1);
        // Format the label according to sample rate.
        let options;
        switch (datasetData.sample_rate) {
            case '10_years':
            case '5_years':
            case '1_year':
                options = {year: 'numeric'};
                break;
            case '6_months':
            case '1_month':
                options = {year: 'numeric', month: 'long'};
                break;
            case '7_days':
            case '1_day':
                options = {year: 'numeric', month: 'long', day: 'numeric'};
                break;
            case '1_hour':
                options = {year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit'};
                break;
            case '1_minute':
                options = {year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'};
                break;
            case '1_second':
            default:
                options = {year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'}
        }
        d.label = new Intl.DateTimeFormat([], options).format(d.datetime)
        return d;
    });

    // Set the x and y scales.
    const x = d3.scaleTime()
        .range([0, width])
        .domain(d3.extent(dataset, d => d.datetime));
    const y = d3.scaleLinear()
        .range([height, 0])
        .domain([0, d3.max(dataset, d => d.value)]);

    // Add the X axis.
    const xGroup = svg.append('g')
        .attr('transform', `translate(0, ${height})`)
        .style('font-size', '14px')
        .call(d3.axisBottom(x));
    // Adjust the label position.
    const labels = xGroup.selectAll('text')
        .data(dataset)
        .attr('transform', 'translate(-10,0)rotate(-45)')
        .style('text-anchor', 'end');

    // Add the Y axis.
    const yGroup = svg.append('g')
        .style('font-size', '14px')
        .call(d3.axisLeft(y));

    // Set the curve type. Note that we limit the curve types to those where
    // the curve intersects all points on the chart.
    // @see https://github.com/d3/d3-shape#curves
    let curveType;
    switch (diagramData.line_type) {
        case 'monotonex':
            curveType = d3.curveMonotoneX;
            break;
        case 'natural':
            curveType = d3.curveNatural;
            break;
        case 'step':
            curveType = d3.curveStep;
            break;
        case 'stepafter':
            curveType = d3.curveStepAfter;
            break;
        case 'stepbefore':
            curveType = d3.curveStepBefore;
            break;
        case 'linear':
        default:
            curveType = d3.curveLinear;
    }

    if ('points' !== diagramData.plot_type) {
        // Add the line.
        svg.selectAll('.line')
            .data(nestedDataset)
            .enter()
            .append('path')
                .attr('fill', 'none')
                .attr('stroke', d => color(d.key))
                .attr('stroke-width', 1.5)
                .attr('d', d => d3.line()
                    .x(d => x(d.datetime))
                    .y(d => y(d.value))
                    .curve(curveType)(d.values)
                );
    }

    if ('line' !== diagramData.plot_type) {
        // Add the dots.
        svg.append('g')
            .selectAll('dot')
            .data(dataset)
            .enter()
            .append('circle')
                .attr('cx', d => x(d.datetime))
                .attr('cy', d => y(d.value))
                .attr('r', 3)
                .attr('fill', d => color(d.label_2));
    }

    // Add the tooltip div.
    const tooltip = d3.select(div)
        .append('div')
        .attr('class', 'tooltip');

    // Add the overlay rectangle that enables mouse position.
    const bisect = d3.bisector(d => d.datetime).left;
    svg.append('rect')
        .attr('width', width)
        .attr('height', height)
        .style('fill', 'none')
        .style('pointer-events', 'all')
        .on('mouseover', () => {
            tooltip.style('display', 'none')
        })
        .on('mousemove', (e) => {
            div.querySelectorAll('g.cursor').forEach(cursor => cursor.remove());

            // Add the cursors that snap to the lines.
            const x0 = x.invert(Math.round(d3.pointer(e)[0]));
            let tooltipLabel;
            let tooltipContent = '';
            nestedDataset.forEach(d => {
                const thisDataset = d.values[bisect(d.values, x0, 0)];
                const cursor = svg.append('g')
                    .attr('class', 'cursor')
                    .append('circle')
                        .attr('stroke', 'black')
                        .attr('r', 8)
                        .style('fill', 'none')
                        .style('display', 'inline-block')
                        .attr('cx', x(thisDataset.datetime))
                        .attr('cy', y(thisDataset.value));
                tooltipLabel = `<div>${thisDataset.label}</div>`;
                tooltipContent += `<div style="color: ${color(d.key)};">${thisDataset.label_2}<br>${Number(thisDataset.value).toLocaleString()}</div>`;
            });
            tooltip.style('display', 'inline-block')
                .style('left', `${e.pageX}px`)
                .style('top', `${e.pageY + 10}px`)
                .html(tooltipLabel + tooltipContent);
        })
        .on('mouseout', () => {
            tooltip.style('display', 'none')
        });
});
