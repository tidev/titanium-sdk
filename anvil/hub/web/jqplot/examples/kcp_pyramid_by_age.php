<!DOCTYPE html>

<html>
<head>
<?php 
    $title = "Pyramid Chart By Age";
?>
    
    <title><?php print $title ?></title>

    <link class="include" rel="stylesheet" type="text/css" href="../jquery.jqplot.css" />
    <link rel="stylesheet" type="text/css" href="examples.css" />
    <link type="text/css" rel="stylesheet" href="syntaxhighlighter/styles/shCoreDefault.min.css" />
    <link type="text/css" rel="stylesheet" href="syntaxhighlighter/styles/shThemejqPlot.min.css" />
  
  <!--[if lt IE 9]><script language="javascript" type="text/javascript" src="../excanvas.js"></script><![endif]-->
    <script class="include" type="text/javascript" src="../jquery.min.js"></script>
    
     <link class="include" type="text/css" href="jquery-ui/css/smoothness/jquery-ui.min.css" rel="Stylesheet" /> 
    <link href="colorpicker/jquery.colorpicker.css" rel="stylesheet" type="text/css"/>

    <style type="text/css">

        html {
            width: 100%;
            height: 100%;
        }
        
        body {
            width: 98%;
            height: 97%;
            margin: 6px;
        }

        .quintile-outer-container {
            width: 97%;
            height: 97%;
            margin: auto;
        }

        .jqplot-chart {
/*            width: 400px;
            height: 400px;*/
        }

        .quintile-toolbar .ui-icon {
            float: right;
            margin: 3px 5px;
        }

        table.stats-table td, table.highlighted-stats-table td {
            background-color: rgb(230, 230, 230);
            padding: 0.5em;
        }

        col.label {
            width: 14em;
        }

        col.value {
            width: 7em;
        }

        td.quintile-value {
            width: 7em;
            text-align: right;
        }

        table.stats-table td.tooltip-header, table.highlighted-stats-table td.tooltip-header {
            background-color: rgb(200, 200, 200);
        }

        table.stats-table, table.highlighted-stats-table, td.contour-cell {
            font-size: 0.7em;
        }

        td.contour-cell {
            height: 1.5em;
            padding-left: 20px;
            padding-bottom: 1.5em;
        }

        table.highlighted-stats-table {
            margin-top: 15px;
        }

        div.stats-cell div.input {
            font-size: 0.7em;
            margin-top: 1.5em;
        }

        div.content-container {
            padding-left: 230px;   /* LC width */
            padding-right: 300px;  /* RC width */
            height: 100%;
        }

        div.content-container .column {
            position: relative;
            float: left;
        }

        div.controls {
            width: 170px;          /* LC width */
            right: 230px;          /* LC width */
            padding-left: 30px;
            padding-right: 30px;
            margin-left: -100%;
            margin-top: 30px;
        }

        div.chart-cell {
            width: 100%;
            height: 100%;
        }

        div.stats-cell {
            width: 270px;          /* RC width */
            margin-right: -300px;  /* RC width */
            padding-right: 30px;
            margin-top: 30px;
        }

        div.controls, div.controls select {
            font-size: 0.8em;
        }

        div.controls li {
            list-style-type: none;
        }

        div.controls ul {
            margin-top: 0.5em;
            padding-left: 0.2em;
        }

        div.overlay-chart-container {
            display: none;
            z-index: 11;
            position: fixed;
            width: 800px;
            left: 50%;
            margin-left: -400px;
            background-color: white;
        }

        div.overlay-chart-container div.ui-icon {
            float: right;
            margin: 3px 5px;
        }

        div.overlay-shadow {
            display: none;
            z-index: 10;
            background-color: rgba(0, 0, 0, 0.8);
            position: fixed;
            top: 0px;
            left: 0px;
            width: 100%;
            height: 100%;
        }

        div.ui-colorpicker div.ui-dialog-titlebar {
            padding: 0.1em 0.3em;
        }

        input.color {
            display: none;
        }

        div.colorpicker-container span {
            padding: 3px;
        }

        div.quintile-content {
            width: 100%;
            height: 100%;
        }


        @media print {
            div.stats-cell {
                vertical-align: top;
                padding-top: 35px;
            }

            table.stats-table, table.stats-table td {
                 color: #aaaaaa;
                 border: 1px solid #bbbbbb;
                 border-collapse: collapse;
            }

            table.stats-table tr {
                font-family: Verdana,Arial,sans-serif;
                /*font-size: 0.7em;*/
            }
        }

    </style>

   
</head>
<body>

<!-- Example scripts go here -->

 
    <div class="overlay-shadow"></div>

    <div class="overlay-chart-container ui-corner-all">
        <div class="overlay-chart-container-header ui-widget-header ui-corner-top">Right click the image to Copy or Save As...<div class="ui-icon ui-icon-closethick"></div></div>
        <div class="overlay-chart-container-content ui-corner-bottom"></div>
    </div>

    <div class="quintile-outer-container ui-widget ui-corner-all">
        <div class="quintile-toolbar ui-widget-header  ui-corner-top">
            <span class="quintile-title">Income Level:</span>
        </div>
        <div class="quintile-content ui-widget-content ui-corner-bottom">

            <div class="content-container">


            <div class="chart-cell column">
                <div id="agesChart" class="jqplot-chart"></div>
            </div>

            <div class="controls column">
                <table>
                    <tr>
                        <td>
                            Axes:
                        </td>
                        <td>
                            <select name="axisPosition">
                                <option value="both">Left &amp; Right</option>
                                <option value = "left">Left</option>
                                <option value = "right">Right</option>
                                <option value = "mid">Mid</option>
                            </select>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            Colors:
                        </td>
                        <td>
                            <ul>
                                <li><input class="color" type="color" id="colorMale" /> Male</li>
                                <li><input class="color" type="color" id="colorFemale" /> Female</li>
                                <li><input class="color" type="color" id="colorBackground"  /> Background</li>
                                <li><input class="color" type="color" id="colorPlotBands" /> Plot Bands</li>
                            </ul>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            Grids:
                        </td>
                        <td>
                            <ul>
                                <li><input name="gridsVertical" value="vertical" type="checkbox" />Vertical</li>
                                <li><input name="gridsHorizontal" value="horizontal" type="checkbox" />Horizontal</li>
                                <li><input name="showMinorTicks" value="true" type="checkbox" checked />Only major</li>
                                <li><input name="plotBands" value="true" type="checkbox" checked />Plot Bands</li>
                            </ul>
                        </td>
                    </tr>
                    <tr>
                        <td colspan="2">
                            <ul>
                                <li><input name="barPadding" value="2" type="checkbox" checked />Gap between bars</li>
                                <!-- value for showContour is speed at which to fade lines in/out -->
                                <li><input name="showContour" value="500" type="checkbox" />Comparison Line</li>
                            </ul>
                        </td>
                    </tr>
                </table>
            </div>

            <div class="stats-cell column">
                <table class="stats-table">
                <colgroup>
                    <col class="label">
                    <col class="value">
                </colgroup>
                <tbody>
                    <tr>
                        <td class="ui-corner-tl">Mean Age:</td>
                        <td class="quintile-value summary-meanAge ui-corner-tr"></td>
                    </tr>
                    <tr>
                        <td>Sex Ratio:</td>
                        <td class="quintile-value summary-sexRatio"></td>
                    </tr>
                    <tr>
                        <td>Age Dependency Ratio:</td>
                        <td class="quintile-value summary-ageDependencyRatio"></td>
                    </tr>
                    <tr>
                        <td>Population, Total:</td>
                        <td class="quintile-value summary-populationTotal"></td>
                    </tr>
                    <tr>
                        <td>Population, Male:</td>
                        <td class="quintile-value summary-populationMale"></td>
                    </tr>
                    <tr>
                        <td class="ui-corner-bl">Population, Female:</td>
                        <td class="quintile-value summary-populationFemale ui-corner-br"></td>
                    </tr>
                </tbody>
                </table>
                <table class="highlighted-stats-table">
                <colgroup>
                    <col class="label">
                    <col class="value">
                </colgroup>
                <tbody>
                    <tr class="tooltip-header">
                        <td class="tooltip-header ui-corner-top" colspan="2">Highlighted Age: <span class="tooltip-item tooltipAge">&nbsp;</span></td>
                    </tr>
                    <tr>
                        <td>Population, Male: </td>
                        <td class="quintile-value"><span class="tooltip-item tooltipMale">&nbsp;</span></td>
                    </tr>
                    <tr>
                        <td>Population, Female: </td>
                        <td class="quintile-value"><span class="tooltip-item tooltipFemale">&nbsp;</span></td>
                    </tr>
                    <tr>
                        <td class="ui-corner-bl">Sex Ratio: </td>
                        <td class="quintile-value ui-corner-br"><span class="tooltip-item tooltipRatio">&nbsp;</span></td>
                    </tr>
                <tbody>
                </table>
            </div>

            </div>

        </div>
    </div> 
  


    <script class="code" type="text/javascript">
    $(document).ready(function(){

        // if browser supports canvas, show additional toolbar icons
        if (!$.jqplot.use_excanvas) {
            $('div.quintile-toolbar').append('<div class="ui-icon ui-icon-image"></div><div class="ui-icon ui-icon-print"></div>');
        }

        // for this demo, all data is same for each quintile.
        // could do something like this to get the index of the quintile.
        // <!-- var quintileIndex = parseInt(< ? php echo $_GET["qidx"]; ? >); -->

        var male;
        var female;
        var summaryTable;
        var sexRatios;
        jsondata = [];

        $.ajax({
            type: "GET",
            dataType: 'json',
            async: false,
            url: "ages.json",
            contentType: "application/json",
            success: function (retdata) {
                // array of arrays of data for each quintile
                // each quintile array has data for following:
                //  0: summary table
                //  1: male data
                //  2: female data
                //  3: ratios
                jsondata = retdata;
            },
            error: function (xhr) { console.log("ERROR: ", xhr.statusText) }
        });


        // the "x" values from the data will go into the ticks array.  
        // ticks should be strings for this case where we have values like "75+"
        var ticks = jsondata[4];

        $('td.summary-meanAge').each(function(index) {
            $(this).html($.jqplot.sprintf('%5.2f', jsondata[0][3]));
        });

        $('td.summary-sexRatio').each(function(index) {
            $(this).html($.jqplot.sprintf('%5.2f', jsondata[3][0]));
        });

        $('td.summary-ageDependencyRatio').each(function(index) {
            $(this).html($.jqplot.sprintf('%5.2f', jsondata[0][6]));
        });

        $('td.summary-populationTotal').each(function(index) {
            $(this).html($.jqplot.sprintf("%'d", jsondata[0][0]));
        });

        $('td.summary-populationMale').each(function(index) {
            $(this).html($.jqplot.sprintf("%'d", jsondata[0][1]));
        });

        $('td.summary-populationFemale').each(function(index) {
            $(this).html($.jqplot.sprintf("%'d", jsondata[0][2]));
        });
        
        // These two variables should be removed outside of the jqplot.com example environment.
        $.jqplot._noToImageButton = true;
        $.jqplot._noCodeBlock = true;

        // Custom color arrays are set up for each series to get the look that is desired.
        // Two color arrays are created for the default and optional color which the user can pick.
        var greenColors = ["#526D2C", "#77933C", "#C57225", "#C57225"];
        var blueColors = ["#3F7492", "#4F9AB8", "#C57225", "#C57225"];

        // To accomodate changing y axis, need to keep track of plot options.
        // changing axes will require recreating the plot, so need to keep 
        // track of state changes.
        var plotOptions = {
            // We set up a customized title which acts as labels for the left and right sides of the pyramid.
            title: {
                text: '<span style="margin-left:25%;">Male</span><span style="margin-left:33%;">Female</span>',
                textAlign: 'left'
            },
            // by default, the series will use the green color scheme.
            seriesColors: greenColors,

            grid: {
                drawBorder: false,
                shadow: false,
                background: "#ffffff",
                rendererOptions: {
                    // plotBands is an option of the pyramidGridRenderer.
                    // it will put banding at starting at a specified value
                    // along the y axis with an adjustable interval.
                    plotBands: {
                        show: true,
                        interval: 10,
                        color: 'rgb(245, 235, 215)'
                    }
                }
            },

            // This makes the effective starting value of the axes 0 instead of 1.
            // For display, the y axis will use the ticks we supplied.
            defaultAxisStart: 0,
            seriesDefaults: {
                renderer: $.jqplot.PyramidRenderer,
                rendererOptions: {
                    barPadding: 1.5,
                    offsetBars: true
                },
                yaxis: "yaxis",
                shadow: false
            },

            // We have 4 series, the left and right pyramid bars and
            // the left and rigt overlay lines.
            series: [
                // For pyramid plots, the default side is right.
                // We want to override here to put first set of bars
                // on left.
                {
                    rendererOptions:{
                        side: "left",
                        synchronizeHighlight: 1
                    }
                },
                {
                    yaxis: "y2axis",
                    rendererOptions: {
                        synchronizeHighlight: 0
                    }
                },
                {
                    rendererOptions: {
                        fill: false,
                        side: 'left'
                    }
                },
                {
                    yaxis: 'y2axis',
                    rendererOptions: {
                        fill: false
                    }
                }
            ],
            axesDefaults: {
                tickOptions: {
                    showGridline: false
                },
                pad: 0,
                rendererOptions: {
                    baselineWidth: 2
                }
            },

            // Set up all the y axes, since users are allowed to switch between them.
            // The only axis that will show is the one that the series are "attached" to.
            // We need the appropriate options for the others for when the user switches.
            axes: {
                xaxis: {
                    tickOptions: {
                        formatter: $.jqplot.PercentTickFormatter,
                        formatString: '%.1f%%'
                    }
                },
                yaxis: {
                    label: "Age",
                    // Use canvas label renderer to get rotated labels.
                    labelRenderer: $.jqplot.CanvasAxisLabelRenderer,
                    // include empty tick options, they will be used
                    // as users set options with plot controls.
                    tickOptions: {},
                    showMinorTicks: false,
                    tickInterval: 5,
                    ticks: ticks,
                    rendererOptions: {
                        tickSpacingFactor: 15,
                        category: false
                    }
                },
                yMidAxis: {
                    label: "Age",
                    // include empty tick options, they will be used
                    // as users set options with plot controls.
                    tickOptions: {},
                    showMinorTicks: false,
                    tickInterval: 5,
                    ticks: ticks,
                    rendererOptions: {
                        tickSpacingFactor: 15,
                        category: false
                    }
                },
                y2axis: {
                    label: "Age",
                    // Use canvas label renderer to get rotated labels.
                    labelRenderer: $.jqplot.CanvasAxisLabelRenderer,
                    // include empty tick options, they will be used
                    // as users set options with plot controls.
                    tickOptions: {},
                    showMinorTicks: false,
                    tickInterval: 5,
                    ticks: ticks,
                    rendererOptions: {
                        tickSpacingFactor: 15,
                        category: false
                    }
                }
            }
        };

        // resize the chart container to fill the space
        $('#agesChart').height($('div.chart-cell').height()*0.96);
        $('#agesChart').width($('div.chart-cell').width()*0.97);

        // $('#agesChart').jqplot([jsondata[1], jsondata[2]], plotOptions);
        $.jqplot.config.addDomReference = true;
        var plot1 = $.jqplot('agesChart', [jsondata[1], jsondata[2]], plotOptions);

        $(window).resize (function(event, ui) {
            // pass in resetAxes: true option to get rid of old ticks and axis properties
            // which should be recomputed based on new plot size.
            $('#agesChart').height($('div.chart-cell').height()*0.96);
            $('#agesChart').width($('div.chart-cell').width()*0.97);
            plot1.replot( { resetAxes: true } );
        });

        // initialize form elements
        // set these before attaching event handlers.

        $("input[type=checkbox][name=gridsVertical]").attr("checked", false);
        $("input[type=checkbox][name=gridsHorizontal]").attr("checked", false);
        $("input[type=checkbox][name=showMinorTicks]").attr("checked", true);
        $("input[type=checkbox][name=plotBands]").attr("checked", true);
        $("input[type=checkbox][name=showContour]").attr("checked", true);
        $("input[type=checkbox][name=barPadding]").attr("checked", true);
        $("select[name=axisPosition]").val("both");

        //////
        // The followng functions use verbose css selectors to make
        // it clear exactly which elements they are binging to/operating on
        //////

        $("select[name=axisPosition]").change(function(){ 
            // this refers to the html element we are binding to.
            // $(this) is jQuery object on that element.

            var opts = {series:[{}, {}, {}, {}]};

            switch ($(this).val()) {
                case "both":
                    opts.series[0].yaxis = "yaxis";
                    opts.series[1].yaxis = "y2axis";
                    opts.series[2].yaxis = "yaxis";
                    opts.series[3].yaxis = "y2axis";
                    break;
                case "left":
                    opts.series[0].yaxis = "yaxis";
                    opts.series[1].yaxis = "yaxis";
                    opts.series[2].yaxis = "yaxis";
                    opts.series[3].yaxis = "yaxis";
                    break;
                case "right":
                    opts.series[0].yaxis = "y2axis";
                    opts.series[1].yaxis = "y2axis";
                    opts.series[2].yaxis = "y2axis";
                    opts.series[3].yaxis = "y2axis";
                    break;
                case "mid":
                    opts.series[0].yaxis = "yMidAxis";
                    opts.series[1].yaxis = "yMidAxis";
                    opts.series[2].yaxis = "yMidAxis";
                    opts.series[3].yaxis = "yMidAxis";
                    break;
                default:
                    break;
                    
            }

            plot1.replot(opts); 
        });

        // bind to the data highlighting event to make custom tooltip:
        $(".jqplot-target").each(function(index){
            $(this).bind("jqplotDataHighlight", function(evt, seriesIndex, pointIndex, data) {
                // Here, assume first series is male poulation and second series is female population.
                // Adjust series indices as appropriate.
                var plot = $(this).data('jqplot');
                var malePopulation = Math.abs(plot.series[0].data[pointIndex][1]) * jsondata[0][1];
                var femalePopulation = Math.abs(plot.series[1].data[pointIndex][1]) * jsondata[0][2];
                var malePopulation = jsondata[1][pointIndex] * jsondata[0][1];
                var femalePopulation = jsondata[2][pointIndex] * jsondata[0][2];
                // var ratio = femalePopulation / malePopulation * 100;
                var ratio = jsondata[3][pointIndex];

                $('.tooltipMale').stop(true, true).fadeIn(350).html($.jqplot.sprintf("%'d", malePopulation));
                $('.tooltipFemale').stop(true, true).fadeIn(350).html($.jqplot.sprintf("%'d", femalePopulation));
                $('.tooltipRatio').stop(true, true).fadeIn(350).html($.jqplot.sprintf('%5.2f', ratio));

                // Since we don't know which axis is rendererd and acive with out a little extra work,
                // just use the supplied ticks array to get the age label.
                $('.tooltipAge').stop(true, true).fadeIn(350).html(ticks[pointIndex]);
            });
        });

        // bind to the data highlighting event to make custom tooltip:
        $(".jqplot-target").each(function() {
            $(this).bind("jqplotDataUnhighlight", function(evt, seriesIndex, pointIndex, data) {
                // clear out all the tooltips.
                $(".tooltip-item").fadeOut(250);
            });
        });

        $('.ui-icon-print').click(function(){
            $(this).parent().next().print();
        });


        $("input[type=checkbox][name=gridsVertical]").change(function(){
            // this refers to the html element we are binding to.
            // $(this) is jQuery object on that element.
            var opts = {axes: {xaxis: {tickOptions: {showGridline: this.checked}}}};
            plot1.replot(opts);
        });


        $("input[type=checkbox][name=gridsHorizontal]").change(function(){
            // this refers to the html element we are binding to.
            // $(this) is jQuery object on that element.
            var opts = {
                axes: {
                    yaxis: {
                        tickOptions: {showGridline: this.checked}
                    },
                    y2axis: {
                        tickOptions: {showGridline: this.checked}
                    },
                    yMidAxis: {
                        tickOptions: {showGridline: this.checked}
                    }
                }
            };
            plot1.replot(opts);
        });

        $("input[type=checkbox][name=plotBands]").change(function(){
            // this refers to the html element we are binding to.
            // $(this) is jQuery object on that element.
            var opts = {grid:{ rendererOptions: {plotBands: { show: this.checked}}}};
            plot1.replot(opts);
        });

        ////
        // To-Do
        //
        // initialize form elements on reload.
        // figure out what overlay line would be.
        // have to adjust ticks to do show minor.
        // make like kcp_pyramid.php
        ////
        $("input[type=checkbox][name=showMinorTicks]").change(function(){
            // this refers to the html element we are binding to.
            // $(this) is jQuery object on that element.
            var opts = {
                axes: {
                    yaxis: {
                        showMinorTicks: !this.checked
                    },
                    y2axis: {
                        showMinorTicks: !this.checked
                    },
                    yMidAxis: {
                        showMinorTicks: !this.checked
                    }
                }
            };
            plot1.replot(opts);
        });

        $("input[type=checkbox][name=barPadding]").change(function(){
            // this refers to the html element we are binding to.
            // $(this) is jQuery object on that element.
            if (this.checked) {
                var val = parseFloat($(this).val());
                var opts = {
                    seriesDefaults: {
                        rendererOptions: {
                            barPadding: val
                        }
                    }
                };
            }
            else {
                var opts = {
                    seriesDefaults: {
                        rendererOptions: {
                            barPadding: 0
                        }
                    }
                };
            }
            plot1.replot(opts);
        });


        $('.ui-icon-image').each(function() {
            $(this).bind('click', function(evt) {
                var chart = $(this).closest('div.quintile-outer-container').find('div.jqplot-target');
                var imgelem = chart.jqplotToImageElem();
                var div = $('div.overlay-chart-container-content');
                div.empty();
                div.append(imgelem);
                $('div.overlay-shadow').fadeIn(600);
                div.parent().fadeIn(1000);
                div = null;
            });
        });

        $('div.overlay-chart-container-header div.ui-icon-closethick').click(function(){
            var div = $('div.overlay-chart-container-content');
            div.parent().fadeOut(600);
            $('div.overlay-shadow').fadeOut(1000);
        });

        function applyColors () {
            var opts = {series:[{}, {}], grid:{rendererOptions:{plotBands:{}}}};
            opts.series[0].color = $('#colorMale').data('colorpicker').color.toCSS();
            opts.series[1].color = $('#colorFemale').data('colorpicker').color.toCSS();
            opts.grid.background = $('#colorBackground').data('colorpicker').color.toCSS();
            opts.grid.rendererOptions.plotBands.color = $('#colorPlotBands').data('colorpicker').color.toCSS();

            plot1.replot(opts);

        };

        // $('#colorMale').val(plot1.series[0].color);

        $('#colorMale').colorpicker({
            showOn: 'button',
            showHeader: true,
            showSwatches: true,
            buttonColorize: true,
            buttonImageOnly: true,
            parts: 'full',
            color: plot1.series[0].color,
            onClose: applyColors

        });

        $('#colorFemale').colorpicker({
            showOn: 'button',
            showHeader: true,
            showSwatches: true,
            buttonColorize: true,
            buttonImageOnly: true,
            parts: 'full',
            color: plot1.series[1].color,
            onClose: applyColors

        });

        $('#colorBackground').colorpicker({
            showOn: 'button',
            showHeader: true,
            showSwatches: true,
            buttonColorize: true,
            buttonImageOnly: true,
            parts: 'full',
            color: plot1.grid.background,
            onClose: applyColors

        });

        $('#colorPlotBands').colorpicker({
            showOn: 'button',
            showHeader: true,
            showSwatches: true,
            buttonColorize: true,
            buttonImageOnly: true,
            parts: 'full',
            color: plot1.grid.plotBands.color,
            onClose: applyColors

        });

    });
    </script>


    <script class="include" type="text/javascript" src="../jquery.jqplot.js"></script>
    <script type="text/javascript" src="syntaxhighlighter/scripts/shCore.min.js"></script>
    <script type="text/javascript" src="syntaxhighlighter/scripts/shBrushJScript.min.js"></script>
    <script type="text/javascript" src="syntaxhighlighter/scripts/shBrushXml.min.js"></script>


    <script class="include" type="text/javascript" src="../plugins/jqplot.categoryAxisRenderer.js"></script>

    <!-- load the pyramidAxis and Grid renderers in production.  pyramidRenderer will try to load via ajax if not present, but that is not optimal and depends on paths being set. -->
    <script class="include" type="text/javascript" src="../plugins/jqplot.pyramidAxisRenderer.js"></script>
    <script class="include" type="text/javascript" src="../plugins/jqplot.pyramidGridRenderer.js"></script> 

    <script class="include" type="text/javascript" src="../plugins/jqplot.pyramidRenderer.js"></script>
    <script class="include" type="text/javascript" src="../plugins/jqplot.canvasTextRenderer.js"></script>
    <script class="include" type="text/javascript" src="../plugins/jqplot.canvasAxisLabelRenderer.js"></script>
    <script class="include" type="text/javascript" src="../plugins/jqplot.json2.js"></script>
    <script class="include" type="text/javascript" src="jquery-ui/js/jquery-ui.min.js"></script>
    <script class="include" type="text/javascript" src="kcp.print.js"></script>

    <script src="colorpicker/jquery.colorpicker.js"></script>
 
    <script type="text/javascript" src="example.js"></script>

</body>


</html>
