
$(document).ready(function(){
  //var mymap = L.map('mapid').setView([51.505, -0.09], 13);

  var mylat=39.995600
  var mylong=-83.016992
  $.getJSON("http://freegeoip.net/json/",function(result){
    mylat=result.latitude;
    mylong=result.longitude;

    var maxzoom=20;

    var mapboxtoken='pk.eyJ1IjoiYWJyYXhhc3l1IiwiYSI6ImNpd2M2Mm5zaTA2b3UyeHRkYW55OW40MnoifQ.MAQPTFd3xVK7CtE0B4IztA';
    var mapboxattr='Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>';
    var mapboxurl='https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}';

    var layer_streets = L.tileLayer(mapboxurl, {
      attribution: mapboxattr,
      id: 'mapbox.streets',
      accessToken: mapboxtoken,
      maxZoom: maxzoom
    });
    var layer_satellite = L.tileLayer(mapboxurl, {
      attribution: mapboxattr,
      id: 'mapbox.streets-satellite',
      accessToken: mapboxtoken,
      maxZoom: maxzoom
    });
    var layer_weird = L.tileLayer(mapboxurl, {
      attribution: mapboxattr,
      id: 'mapbox.high-contrast',
      accessToken: mapboxtoken,
      maxZoom: maxzoom
    });

    //var mymap = L.map('mapid',{layers:[layer_streets],zoomControl:false,boxZoom:true,markerZoomAnimation:false}).setView([39.995600, -83.016992], 19);

    var mymap = L.map('mapid',{layers:[layer_satellite]}).setView([mylat, mylong], 19);

    function getColor(d) {
    return d > 1000 ? '#800026' :
           d > 500  ? '#BD0026' :
           d > 200  ? '#E31A1C' :
           d > 100  ? '#FC4E2A' :
           d > 50   ? '#FD8D3C' :
           d > 20   ? '#FEB24C' :
           d > 10   ? '#FED976' :
                      '#FFEDA0';
    }
    function style(feature) {
      return {
        fillColor: getColor(feature.properties.density),
        weight: 2,
        opacity: 1,
        color: 'white',
        dashArray: '3',
        fillOpacity: 0.7
      };
    }

    //L.geoJson(statesData, {style: style}).addTo(mymap);

    //creation of layer-group of classic layers
    var baselayers = {
      "streets":layer_streets,
      "satellite":layer_satellite,
      "weird":layer_weird
    };

    var lcontrol=L.control.layers(baselayers).addTo(mymap);//,{position:'topleft'}).addTo(mymap);
  });
});
