/*
   Licensed to the Apache Software Foundation (ASF) under one or more
   contributor license agreements.  See the NOTICE file distributed with
   this work for additional information regarding copyright ownership.
   The ASF licenses this file to You under the Apache License, Version 2.0
   (the "License"); you may not use this file except in compliance with
   the License.  You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
var showControllersOnly = false;
var seriesFilter = "";
var filtersOnlySampleSeries = true;

/*
 * Add header in statistics table to group metrics by category
 * format
 *
 */
function summaryTableHeader(header) {
    var newRow = header.insertRow(-1);
    newRow.className = "tablesorter-no-sort";
    var cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Requests";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 3;
    cell.innerHTML = "Executions";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 7;
    cell.innerHTML = "Response Times (ms)";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Throughput";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 2;
    cell.innerHTML = "Network (KB/sec)";
    newRow.appendChild(cell);
}

/*
 * Populates the table identified by id parameter with the specified data and
 * format
 *
 */
function createTable(table, info, formatter, defaultSorts, seriesIndex, headerCreator) {
    var tableRef = table[0];

    // Create header and populate it with data.titles array
    var header = tableRef.createTHead();

    // Call callback is available
    if(headerCreator) {
        headerCreator(header);
    }

    var newRow = header.insertRow(-1);
    for (var index = 0; index < info.titles.length; index++) {
        var cell = document.createElement('th');
        cell.innerHTML = info.titles[index];
        newRow.appendChild(cell);
    }

    var tBody;

    // Create overall body if defined
    if(info.overall){
        tBody = document.createElement('tbody');
        tBody.className = "tablesorter-no-sort";
        tableRef.appendChild(tBody);
        var newRow = tBody.insertRow(-1);
        var data = info.overall.data;
        for(var index=0;index < data.length; index++){
            var cell = newRow.insertCell(-1);
            cell.innerHTML = formatter ? formatter(index, data[index]): data[index];
        }
    }

    // Create regular body
    tBody = document.createElement('tbody');
    tableRef.appendChild(tBody);

    var regexp;
    if(seriesFilter) {
        regexp = new RegExp(seriesFilter, 'i');
    }
    // Populate body with data.items array
    for(var index=0; index < info.items.length; index++){
        var item = info.items[index];
        if((!regexp || filtersOnlySampleSeries && !info.supportsControllersDiscrimination || regexp.test(item.data[seriesIndex]))
                &&
                (!showControllersOnly || !info.supportsControllersDiscrimination || item.isController)){
            if(item.data.length > 0) {
                var newRow = tBody.insertRow(-1);
                for(var col=0; col < item.data.length; col++){
                    var cell = newRow.insertCell(-1);
                    cell.innerHTML = formatter ? formatter(col, item.data[col]) : item.data[col];
                }
            }
        }
    }

    // Add support of columns sort
    table.tablesorter({sortList : defaultSorts});
}

$(document).ready(function() {

    // Customize table sorter default options
    $.extend( $.tablesorter.defaults, {
        theme: 'blue',
        cssInfoBlock: "tablesorter-no-sort",
        widthFixed: true,
        widgets: ['zebra']
    });

    var data = {"OkPercent": 100.0, "KoPercent": 0.0};
    var dataset = [
        {
            "label" : "FAIL",
            "data" : data.KoPercent,
            "color" : "#FF6347"
        },
        {
            "label" : "PASS",
            "data" : data.OkPercent,
            "color" : "#9ACD32"
        }];
    $.plot($("#flot-requests-summary"), dataset, {
        series : {
            pie : {
                show : true,
                radius : 1,
                label : {
                    show : true,
                    radius : 3 / 4,
                    formatter : function(label, series) {
                        return '<div style="font-size:8pt;text-align:center;padding:2px;color:white;">'
                            + label
                            + '<br/>'
                            + Math.round10(series.percent, -2)
                            + '%</div>';
                    },
                    background : {
                        opacity : 0.5,
                        color : '#000'
                    }
                }
            }
        },
        legend : {
            show : true
        }
    });

    // Creates APDEX table
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.987, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [1.0, 500, 1500, "01_Home_Page-1"], "isController": false}, {"data": [1.0, 500, 1500, "05_Checkout"], "isController": false}, {"data": [1.0, 500, 1500, "01_Home_Page-0"], "isController": false}, {"data": [1.0, 500, 1500, "02_Login"], "isController": false}, {"data": [0.87, 500, 1500, "01_Home_Page"], "isController": false}, {"data": [1.0, 500, 1500, "06_Signout-0"], "isController": false}, {"data": [1.0, 500, 1500, "04_View_Product"], "isController": false}, {"data": [1.0, 500, 1500, "06_Signout"], "isController": false}, {"data": [1.0, 500, 1500, "03_Login(GET sign - in form)"], "isController": false}, {"data": [1.0, 500, 1500, "06_Signout-1"], "isController": false}]}, function(index, item){
        switch(index){
            case 0:
                item = item.toFixed(3);
                break;
            case 1:
            case 2:
                item = formatDuration(item);
                break;
        }
        return item;
    }, [[0, 0]], 3);

    // Create statistics table
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 1000, 0, 0.0, 151.9330000000001, 1, 592, 126.5, 374.0, 405.6999999999996, 560.8800000000001, 60.69434328720563, 154.86944077749453, 36.823507013990046], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["01_Home_Page-1", 100, 0, 0.0, 90.33000000000006, 3, 183, 93.0, 161.0, 174.0, 182.98, 497.5124378109453, 700.1127176616915, 244.38840951492537], "isController": false}, {"data": ["05_Checkout", 100, 0, 0.0, 203.9000000000001, 112, 280, 195.5, 260.6, 273.79999999999995, 279.99, 285.7142857142857, 1311.6127232142858, 151.25558035714286], "isController": false}, {"data": ["01_Home_Page-0", 100, 0, 0.0, 245.81000000000003, 4, 383, 306.5, 382.0, 383.0, 383.0, 171.52658662092622, 26.46601629502573, 83.93579813464838], "isController": false}, {"data": ["02_Login", 100, 0, 0.0, 108.09999999999997, 27, 173, 108.5, 159.10000000000005, 169.95, 172.96999999999997, 409.8360655737705, 2259.701588114754, 211.029553022541], "isController": false}, {"data": ["01_Home_Page", 100, 0, 0.0, 355.71000000000004, 14, 592, 403.0, 559.8000000000001, 572.9, 591.98, 168.0672268907563, 262.44091386554624, 164.80107668067228], "isController": false}, {"data": ["06_Signout-0", 100, 0, 0.0, 12.789999999999997, 1, 129, 4.0, 34.900000000000006, 60.74999999999994, 128.73999999999987, 335.5704697986577, 51.777474832214764, 166.20241715604027], "isController": false}, {"data": ["04_View_Product", 100, 0, 0.0, 239.3, 166, 297, 233.5, 282.9, 293.0, 297.0, 303.951367781155, 1428.3339665653496, 166.86455167173253], "isController": false}, {"data": ["06_Signout", 100, 0, 0.0, 55.870000000000005, 3, 163, 48.0, 146.0, 154.89999999999998, 162.99, 301.20481927710847, 470.3383847891566, 298.6722279743976], "isController": false}, {"data": ["03_Login(GET sign - in form)", 100, 0, 0.0, 164.6, 80, 239, 175.0, 216.9, 220.89999999999998, 238.82999999999993, 363.6363636363636, 1624.2400568181818, 192.5213068181818], "isController": false}, {"data": ["06_Signout-1", 100, 0, 0.0, 42.91999999999998, 2, 153, 42.0, 112.0, 126.74999999999994, 152.95, 303.951367781155, 427.728438449848, 150.85367591185408], "isController": false}]}, function(index, item){
        switch(index){
            // Errors pct
            case 3:
                item = item.toFixed(2) + '%';
                break;
            // Mean
            case 4:
            // Mean
            case 7:
            // Median
            case 8:
            // Percentile 1
            case 9:
            // Percentile 2
            case 10:
            // Percentile 3
            case 11:
            // Throughput
            case 12:
            // Kbytes/s
            case 13:
            // Sent Kbytes/s
                item = item.toFixed(2);
                break;
        }
        return item;
    }, [[0, 0]], 0, summaryTableHeader);

    // Create error table
    createTable($("#errorsTable"), {"supportsControllersDiscrimination": false, "titles": ["Type of error", "Number of errors", "% in errors", "% in all samples"], "items": []}, function(index, item){
        switch(index){
            case 2:
            case 3:
                item = item.toFixed(2) + '%';
                break;
        }
        return item;
    }, [[1, 1]]);

        // Create top5 errors by sampler
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 1000, 0, "", "", "", "", "", "", "", "", "", ""], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
