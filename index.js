var URLS = {
  "neighborhood": "https://data.cityofnewyork.us/api/views/xyye-rtrs/rows.json",
  "districts": "https://services5.arcgis.com/GfwWNkhOj9bNBqoJ/arcgis/rest/services/nycd/FeatureServer/0/query?where=1=1&outFields=*&outSR=4326&f=geojson",
  "crimes": "https://data.cityofnewyork.us/api/views/e7s6-zf5b/rows.json?accessType=DOWNLOAD",
  "housing": "https://data.cityofnewyork.us/api/views/hg8x-zxpr/rows.json"
};

var data;

function DataManager() {
  let r = {};
  for (let key in URLS) {
    $.get(URLS[key], function(data) {})
      .done(function(data) {
        switch (key) {
          case Object.keys(URLS)[0]:
            r[key] = data.data;
            break;
          case Object.keys(URLS)[1]:
            r[key] = JSON.parse(data).features;
            break;
          case Object.keys(URLS)[2]:
            r[key] = data;
            break;
          case Object.keys(URLS)[3]:
            r[key] = data.data;
            break;
          default:
            break;
        }
      })
      .fail(function(error) {
        console.log(error);
      });
  }
  this.result = r;
  this.keys = Object.keys(URLS);
}

DataManager.prototype.getDataFromURLS = function() {
  return this.result;
}

DataManager.prototype.getKeysURLS = function() {
  return this.keys;
}

function getData() {
  dataManager = new DataManager();
  idsDataBases = dataManager.getKeysURLS();
  data = dataManager.getDataFromURLS();
}

function updateTable(){
  tableReference = $("#mainTableBody")[0];
  if(tableReference.rows.length > 0) exportTableToCSV('file.csv');
}

function downloadCSV(csv, filename) {
    var csvFile;
    var downloadLink;
    // CSV file
    csvFile = new Blob([csv], {type: "text/csv"});
    // Download link
    downloadLink = document.createElement("a");
    // File name
    downloadLink.download = filename;
    // Create a link to the file
    downloadLink.href = window.URL.createObjectURL(csvFile);
    // Hide download link
    downloadLink.style.display = "none";
    // Add the link to DOM
    document.body.appendChild(downloadLink);
    // Click download link
    downloadLink.click();
}

function exportTableToCSV(filename) {
    var csv = [];
    var rows = document.querySelectorAll("#mainTableBody tr");
    console.log(rows.length);
    for (var i = 0; i < rows.length; i++) {
      var row = [], cols = rows[i].querySelectorAll("td");
      for (var j = 0; j < cols.length; j++)
          row.push(cols[j].innerText);
      csv.push(row.join(";"));
    }
    // Download CSV file
    downloadCSV(csv.join("\n"), filename);
}

//------------------------------------------ Google Maps ---------------------------------------------

var map, markersCenter = [], uni, dist = [], house = [], heatmap, bo = 0;

function onGoogleMapResponse(){
	map = new google.maps.Map(document.getElementById('googleMapContainer'), {
	zoom: 10,
	mapTypeId: 'hybrid'
});

	var country = "New York";
	var geocoder = new google.maps.Geocoder();
	geocoder.geocode( { 'address' : country}, function(results, status){
		if(status == google.maps.GeocoderStatus.OK){
			map.setCenter(results[0].geometry.location);
		};
	});

  uni = new google.maps.LatLng(40.7291,-73.9965);

  var marker = new google.maps.Marker({
    position: uni,
    title:"NYU Stern School of Business"
  });

  marker.setMap(map);

	map.data.loadGeoJson(URLS['districts']);

	map.data.setStyle({
		fillColor: 'red',
		fillOpacity: 0,
		strokeColor: 'red',
		strokeWeight: 1,
		visible : true
	})

	map.data.addListener('mouseover', function(event) {
    map.data.revertStyle();
    map.data.overrideStyle(event.feature, {
      fillColor: 'black',
  		fillOpacity: 0.3,
      strokeColor: 'black',
      strokeWeight: 3
    });
    var x = Math.trunc(event.feature.getProperty('BoroCD')/100);
    var y = event.feature.getProperty('BoroCD') - x*100;
    switch (x) {
      case 1:
        $("#dropdownMenuButton").html("Manhattan" + ' <span class="caret"></span>');
        lista(12);
        break;
      case 2:
        $("#dropdownMenuButton").html("The Bronx" + ' <span class="caret"></span>');
        lista(12);
        break;
      case 3:
        $("#dropdownMenuButton").html("Brooklyn" + ' <span class="caret"></span>');
        lista(18);
        break;
      case 4:
        $("#dropdownMenuButton").html("Queens" + ' <span class="caret"></span>');
        lista(14);
        break;
      case 5:
        $("#dropdownMenuButton").html("Staten Island" + ' <span class="caret"></span>');
        lista(3);
        break;
    }
  	$("#dropdownMenuButton1").html(y + ' <span class="caret"></span>');
  });

  map.data.addListener('mouseout', function(event) {
    map.data.revertStyle();
    $('#dropdown1 button').remove();
    $("#dropdownMenuButton").html("Borough"+' <span class="caret"></span>');
  	$("#dropdownMenuButton1").html("District Number"+' <span class="caret"></span>');
  });
}

function districts(boro){
	map.data.setStyle(function(feature){
		// console.log(feature.getProperty("BoroCD"));
		let boroCD = feature.getProperty("BoroCD");
		// console.log(boroCD);
		let vi = true;
		if(boroCD != boro){
      vi = false;
    }else{
      if(bo != boroCD) districts_cen(boroCD);
      bo = boroCD
    }
		return ({
			fillColor: 'red',
			fillOpacity: 0.1,
			strokeColor: 'red',
			strokeWeight: 3,
			visible : vi
		});
	});
  //console.log(data['districts'][0]['properties']['BoroCD']);
  //console.log(data['districts'][59]['geometry']['coordinates']);
}

function districts_cen(boro) {
  for (var j = 0; j < data['districts'].length; j++) {
    bor = data['districts'][j]['properties']['BoroCD'];
  //   console.log(bor);
    if( boro == bor ){
      var bounds = new google.maps.LatLngBounds();
      var coord = {};
      if (data['districts'][j]['geometry']['coordinates'].length < 2){
        for (var i = 0; i < data['districts'][j]['geometry']['coordinates'][0].length; i++) {
          coord = {
            lat: parseFloat(data['districts'][j]['geometry']['coordinates'][0][i][1]),
            lng: parseFloat(data['districts'][j]['geometry']['coordinates'][0][i][0])
          };
          bounds.extend(coord);
        }
      }else{
        var w = 0, z = 0;
        for (var k = 0; k < data['districts'][j]['geometry']['coordinates'].length; k++) {
          if(data['districts'][j]['geometry']['coordinates'][k][0].length > w){
            w = data['districts'][j]['geometry']['coordinates'][k][0].length;
            z = k;
          }
        }
        for (var i = 0; i < data['districts'][j]['geometry']['coordinates'][z][0].length; i++) {
          coord = {
            lat: parseFloat(data['districts'][j]['geometry']['coordinates'][z][0][i][1]),
            lng: parseFloat(data['districts'][j]['geometry']['coordinates'][z][0][i][0])
          };
          bounds.extend(coord);
        }
      }
    }
  }
  map.setCenter(bounds.getCenter());
  map.setZoom(12);
}

function distance() {
  if(heatmap != null) heatmap.set('map', null);
  deleteMarkers();
  centers();
  hou();
  house.sort(comparar_hou);
  var k = 0, w, m = 0;
  for (i = 0; i < 10 + m; i++) {
    w = k;
    for (var j = 0; j < house.length; j++) {
      if(typeof house[j] !== 'undefined') {
        if(dist[i].bor == house[j][0]) {
          k++;
          dist[i].mar.setVisible(true);
          dist[i].mar.setLabel(k.toString());
        }
      }
    }
    if(w == k) m++;
  }
  tableReference = $("#mainTableBody")[0];
  while(tableReference.rows.length > 0) {
    tableReference.deleteRow(0);
  }
	var newRow, name, borough, num;

  newRow = tableReference.insertRow(tableReference.rows.length);
  num = newRow.insertCell(0);
  borough = newRow.insertCell(1);
  distance = newRow.insertCell(2);
  num.innerHTML = "#";
  borough.innerHTML = "District";
  distance.innerHTML = "Distance (m)";
  var k = 0;
	for( var i = 0; i < 11; i++ ){
    if( i != 2 ){
  		newRow = tableReference.insertRow(tableReference.rows.length);
  		num = newRow.insertCell(0);
  		borough = newRow.insertCell(1);
  		distance = newRow.insertCell(2);
  		num.innerHTML = i + 1 - k;
  		borough.innerHTML = dist[i].bor;
  		distance.innerHTML = Math.trunc(dist[i].dis);
    }else{
      k++;
    }
	}
}

function centers() {
  dist = [];
  for (var j = 0; j < data['districts'].length; j++) {
    bor = data['districts'][j]['properties']['BoroCD'];
  //   console.log(bor);
    if( ((((bor < 113 || (200 <= bor && bor < 213)) || (300 <= bor && bor < 319)) || (400 <= bor && bor < 415)) || (500 <= bor && bor < 504)) ){
      var bounds = new google.maps.LatLngBounds();
      var coord = {};
      if (data['districts'][j]['geometry']['coordinates'].length < 2){
        for (var i = 0; i < data['districts'][j]['geometry']['coordinates'][0].length; i++) {
          coord = {
            lat: parseFloat(data['districts'][j]['geometry']['coordinates'][0][i][1]),
            lng: parseFloat(data['districts'][j]['geometry']['coordinates'][0][i][0])
          };
          bounds.extend(coord);
        }
      }else{
        var w = 0, z = 0;
        for (var k = 0; k < data['districts'][j]['geometry']['coordinates'].length; k++) {
          if(data['districts'][j]['geometry']['coordinates'][k][0].length > w){
            w = data['districts'][j]['geometry']['coordinates'][k][0].length;
            z = k;
          }
        }
        for (var i = 0; i < data['districts'][j]['geometry']['coordinates'][z][0].length; i++) {
          coord = {
            lat: parseFloat(data['districts'][j]['geometry']['coordinates'][z][0][i][1]),
            lng: parseFloat(data['districts'][j]['geometry']['coordinates'][z][0][i][0])
          };
          bounds.extend(coord);
        }
      }

      //addMarkerWithTimeout(bounds.getCenter(), 200);
      var marker = new google.maps.Marker({
        position: bounds.getCenter(),
        visible: false
      });

      marker.setMap(map);

      markersCenter.push(marker);
      var dis = google.maps.geometry.spherical.computeDistanceBetween(bounds.getCenter(), uni);
      dist.push({mar : marker, dis: dis, bor: bor});
    }
  }
  dist.sort(comparar_dis);
}

function centers_hou(boro, num) {
  for (var j = 0; j < data['districts'].length; j++) {
    bor = data['districts'][j]['properties']['BoroCD'];
  //   console.log(bor);
    if( boro == bor ){
      var bounds = new google.maps.LatLngBounds();
      var coord = {};
      if (data['districts'][j]['geometry']['coordinates'].length < 2){
        for (var i = 0; i < data['districts'][j]['geometry']['coordinates'][0].length; i++) {
          coord = {
            lat: parseFloat(data['districts'][j]['geometry']['coordinates'][0][i][1]),
            lng: parseFloat(data['districts'][j]['geometry']['coordinates'][0][i][0])
          };
          bounds.extend(coord);
        }
      }else{
        var w = 0, z = 0;
        for (var k = 0; k < data['districts'][j]['geometry']['coordinates'].length; k++) {
          if(data['districts'][j]['geometry']['coordinates'][k][0].length > w){
            w = data['districts'][j]['geometry']['coordinates'][k][0].length;
            z = k;
          }
        }
        for (var i = 0; i < data['districts'][j]['geometry']['coordinates'][z][0].length; i++) {
          coord = {
            lat: parseFloat(data['districts'][j]['geometry']['coordinates'][z][0][i][1]),
            lng: parseFloat(data['districts'][j]['geometry']['coordinates'][z][0][i][0])
          };
          bounds.extend(coord);
        }
      }

      //addMarkerWithTimeout(bounds.getCenter(), 200);

      //var image = 'http://icons.iconarchive.com/icons/paomedia/small-n-flat/32/house-icon.png';
      var marker = new google.maps.Marker({
        position: bounds.getCenter(),
        visible: true,
        label: (num + 1).toString(),
        //icon: image
      });

      marker.setMap(map);

      markersCenter.push(marker);
    }
  }
}

function comparar_dis(a, b) {
  return a.dis - b.dis;
}

function housing() {
  if(heatmap != null) heatmap.set('map', null);
  deleteMarkers();
  hou();
  house.sort(comparar_hou);
  for (var i = 0; i < 10; i++) {
    centers_hou(house[i][0], i);
  }

  tableReference = $("#mainTableBody")[0];
  while(tableReference.rows.length > 0) {
    tableReference.deleteRow(0);
  }
	var newRow, name, borough, num;

  newRow = tableReference.insertRow(tableReference.rows.length);
  num = newRow.insertCell(0);
  borough = newRow.insertCell(1);
  low = newRow.insertCell(2);
  num.innerHTML = "#";
  borough.innerHTML = "District";
  low.innerHTML = "Low Income";

	for( var i = 0; i < 10; i++ ){
		newRow = tableReference.insertRow(tableReference.rows.length);
		num = newRow.insertCell(0);
		borough = newRow.insertCell(1);
    low = newRow.insertCell(2);
		num.innerHTML = i + 1;
		borough.innerHTML = house[i][0];
    low.innerHTML = Math.trunc(house[i][1]);
	}
}

function hou() {
  var j = 0;
  var MN = [], BX = [], BK = [], QN = [], SI = [];
  for (var i = 0; i < data['housing'].length; i++) {
    if (data['housing'][i][11] != null && data['housing'][i][23] != null) {
      //console.log(data['housing'][i][11]);
      //console.log(data['housing'][i][19]);
      //console.log(data['housing'][i][23]);
      var info = data['housing'][i][19].split('-');
      //console.log(data['housing'][i][31]);
      switch (info[0]) {
        case 'MN':
          if (typeof MN[parseInt(info[1])] === 'undefined') {
            MN[parseInt(info[1])] = [parseInt(data['housing'][i][31]), 1, 100 + parseInt(info[1])];
          }else{
            MN[parseInt(info[1])] = [MN[parseInt(info[1])][0] + parseInt(data['housing'][i][31]), MN[parseInt(info[1])][1] + 1, MN[parseInt(info[1])][2]];
          }
          break;
        case 'BX':
          if (typeof BX[parseInt(info[1])] === 'undefined') {
            BX[parseInt(info[1])] = [parseInt(data['housing'][i][31]), 1, 200 + parseInt(info[1])];
          }else{
            BX[parseInt(info[1])] = [BX[parseInt(info[1])][0] + parseInt(data['housing'][i][31]), BX[parseInt(info[1])][1] + 1, BX[parseInt(info[1])][2]];
          }
          break;
        case 'BK':
          if (typeof BK[parseInt(info[1])] === 'undefined') {
            BK[parseInt(info[1])] = [parseInt(data['housing'][i][31]), 1, 300 + parseInt(info[1])];
          }else{
            BK[parseInt(info[1])] = [BK[parseInt(info[1])][0] + parseInt(data['housing'][i][31]), BK[parseInt(info[1])][1] + 1, BK[parseInt(info[1])][2]];
          }
          break;
        case 'QN':
          if (typeof QN[parseInt(info[1])] === 'undefined') {
            QN[parseInt(info[1])] = [parseInt(data['housing'][i][31]), 1, 400 + parseInt(info[1])];
          }else{
            QN[parseInt(info[1])] = [QN[parseInt(info[1])][0] + parseInt(data['housing'][i][31]), QN[parseInt(info[1])][1] + 1, QN[parseInt(info[1])][2]];
          }
          break;
        case 'SI':
          if (typeof SI[parseInt(info[1])] === 'undefined') {
            SI[parseInt(info[1])] = [parseInt(data['housing'][i][31]), 1, 500 + parseInt(info[1])];
          }else{
            SI[parseInt(info[1])] = [SI[parseInt(info[1])][0] + parseInt(data['housing'][i][31]), SI[parseInt(info[1])][1] + 1, SI[parseInt(info[1])][2]];
          }
          break;
      }
    }
  }
  house = [];
  for (var j = 1; j < 19; j++) {
    if(j < 13 && typeof MN[j] !== 'undefined') {if(MN[j][1] > 0) house[j] = [MN[j][2], MN[j][0]/MN[j][1]];}
    if(j < 13 && typeof BX[j] !== 'undefined') {if(BX[j][1] > 0) house[j+20] = [BX[j][2], BX[j][0]/BX[j][1]];}
    if(j < 19 && typeof BK[j] !== 'undefined') {if(BK[j][1] > 0) house[j+40] = [BK[j][2], BK[j][0]/BK[j][1]];}
    if(j < 15 && typeof QN[j] !== 'undefined') {if(QN[j][1] > 0) house[j+60] = [QN[j][2], QN[j][0]/QN[j][1]];}
    if(j < 4 && typeof SI[j] !== 'undefined') {if(SI[j][1] > 0) house[j+80] = [SI[j][2], SI[j][0]/SI[j][1]];}
  }
}

function comparar_hou(a, b) {
  return b[1] - a[1];
}

function crime() {
  deleteMarkers();
  tableReference = $("#mainTableBody")[0];
  while(tableReference.rows.length > 0) {
    tableReference.deleteRow(0);
  }
  var heatmapData = [];
  for (var i = 0; i < data['crimes'].data.length; i++) {
    if (data['crimes'].data[i][29] != null && data['crimes'].data[i][30] != null) {
      var cri = new google.maps.LatLng(data['crimes'].data[i][29], data['crimes'].data[i][30]);
      heatmapData.push(cri);
    }
  }
  if(heatmap != null){
    if(heatmap.get('map') == null)  heatmap.set('map', map);
  }else{
    heatmap = new google.maps.visualization.HeatmapLayer({
      data: heatmapData,
      dissipating: true,
      maxIntensity: 5,
      opacity: 0.3,
      map: map
    });
  }
}

function reset(){
  if(heatmap != null) if(heatmap.get('map') != null) heatmap.set('map', null);
  deleteMarkers();
  $("#dropdownMenuButton").html("Borough"+' <span class="caret"></span>');
  $("#dropdownMenuButton1").html("District Number"+' <span class="caret"></span>');
  map.data.setStyle({
		fillColor: 'red',
		fillOpacity: 0,
		strokeColor: 'red',
		strokeWeight: 1,
		visible : true
	})
  map.setZoom(10);
  map.setCenter(uni);
  tableReference = $("#mainTableBody")[0];
  while(tableReference.rows.length > 0) {
    tableReference.deleteRow(0);
  }
}

function deleteMarkers() {
  setMapOnAll(null);
  markersCenter = [];
}

function setMapOnAll(map) {
  for (var i = 0; i < markersCenter.length; i++) {
    markersCenter[i].setMap(map);
  }
}

$(document).ready( function(){
	getData();
	$("#distance").on("click", distance);
	$("#housing").on("click", housing);
  $("#crime").on("click", crime);
	$("#download").on("click", updateTable);
	$("#reset").on("click", reset);
})

//------------------------------------------ dropdown ---------------------------------------------

function lista(tipo) {
	$('#dropdown1 button').remove();
	var j = parseInt(tipo)*100;
	switch (tipo) {
		case "1":
			tipo = 12;
			break;
		case "2":
			tipo = 12;
			break;
		case "3":
			tipo = 18;
			break;
		case "4":
			tipo = 14;
			break;
		case "5":
			tipo = 3;
			break;
	}
	for (var i = 0; i < tipo; i++) {
		j++;
		$('#dropdown1').append('<button class="dropdown-item" value="' + j + '" id="dropdown-item2" href="#">' + (i + 1) + '</button>');
	}
}

$('.dropdown-menu button').click( function(e){
	var name = e.currentTarget;
	if (name.getAttribute("id") == "dropdown-item1"){
		//console.log(name.getAttribute("value"));
		lista(name.getAttribute("value"));
		$('.dropdown-menu button').click( function(e){
			var num = e.currentTarget;
			if (num.getAttribute("id") == "dropdown-item2"){
		    //console.log(num.getAttribute("value"));
				districts(num.getAttribute("value"));
			}
		});
		$(".dropchange1 button").click(function(){
		  $("#dropdownMenuButton1").html($(this).text()+' <span class="caret"></span>');
		});
	}
});

$(".dropchange button").click(function(){
  $("#dropdownMenuButton").html($(this).text()+' <span class="caret"></span>');
	$("#dropdownMenuButton1").html("District Number"+' <span class="caret"></span>');
});
