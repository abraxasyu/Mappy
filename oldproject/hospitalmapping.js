$(function(){
  var db;
  var curdb;
  var maxrisk=5;
  var selection=[];
  var type='csv';//dynamodb or csv
  var startdate=new Date("01/01/2017");
  var enddate=new Date("01/31/2017");
  var mapboxtoken='pk.eyJ1IjoiYWJyYXhhc3l1IiwiYSI6ImNpd2M2Mm5zaTA2b3UyeHRkYW55OW40MnoifQ.MAQPTFd3xVK7CtE0B4IztA';
  var mapboxattr='Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>';
  var mapboxurl='https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}';
  var maxzoom=20;
  var lb="<br>";
  var mydatatable;
  var iso;
  var border_small=2;
  var border_large=5;

  function mapinit(msg){
    db = msg;//array
    /*
      RoomID
      PatientID
      EventID
      DateOfEvent
      ClinSig
    */
    //convert datetime string to date objects
    for (var i=0,len=db.length;i<len;i++){
      db[i].DateOfEvent = new Date(db[i].DateOfEvent);
      //console.log(db[i]);
    }

    //initializing daterange element
    $('#daterange').daterangepicker({
      "autoApply": true,
      "startDate": startdate,
      "endDate": enddate
    });

    //when user picks new date range, adjust curdb then update color fill, update popup markers, and update border
    $('#daterange').on('apply.daterangepicker', function(ev, picker) {
      startdate=new Date(picker.startDate.format('MM/DD/YYYY'));
      enddate=new Date(picker.endDate.format('MM/DD/YYYY'));
      curdb=shorttolong(filterbydate(startdate,enddate,db));
      maxrisk=determinemaxrisk();
      D4.setStyle(updatestyle);
      updatemarker(D4);
      D4.setStyle(selectionstyle);
    });

    //reset selection when ESC is pressed by emptying selection
    $(document).keydown(function(e){
      if (e.keyCode == 27) {
        selection=[];
        D4.setStyle(updatestyle);
        selectionupdate();
      }
    });

    //function for converting db to more usable format
    function shorttolong(dbin){
      var dbout={};
      for(var i=0,len=dbin.length;i<len;i++){
        var RoomID=dbin[i].RoomID;
        if(dbout[RoomID]===undefined){dbout[RoomID]={"RoomID":RoomID};dbout[RoomID].count=1;dbout[RoomID].list=[];}
        else{dbout[RoomID].count++;}
        dbout[RoomID].list.push(dbin[i]);
      }
      return(dbout);
    }

    //function for filering db by date range
    function filterbydate(sdatein,edatein,dbin){
      sdatein=new Date(sdatein);
      edatein=new Date(edatein);
      var newdb=[];
      if (dbin===null){console.log('ERROR: null database');}
      else{
        for(var i=0,len=dbin.length;i<len;i++){
          var tempdate=dbin[i].DateOfEvent;
          if(+tempdate>=+sdatein && +tempdate<=+edatein){newdb.push(dbin[i]);}
        }
      }
      return(newdb);
    }

    //initial formatting and filtering
    curdb=shorttolong(filterbydate(startdate,enddate,db));
    maxrisk=determinemaxrisk();

    //function for updating style (red fill color) based on # of events
    var nonred;
    function updatestyle(feature){
      var nonred=200;
      var roomid=feature.properties.ROOM;
      var retcol="#000";
      for(var i=0;i<iso.length;i++){
        //console.log(iso[i]);
        if(iso[i].Room==roomid && (new Date(iso[i].EndDate))>=startdate && (new Date(iso[i].StartDate))<=enddate ){
          retcol="#0000ff";
        }
      }
      if(roomid in curdb){
          nonred=Math.round((1-(curdb[roomid].count/maxrisk))*200);
      }
      return {
        color:retcol,
        fillColor:"rgb(200,"+nonred+","+nonred+")",
        fillOpacity:1,
        weight:border_small
      };
    }

    function determinemaxrisk(){
      var max=0;
      Object.keys(curdb).forEach(function(key,index) {
          if(curdb[key].count>max){max=curdb[key].count;}
      });
      return max;
    }

    //wrapper function for updating popup marker
    function updatemarker(layerin){
      layerin.eachLayer(specificmarkerupdate);
    }
    //function for updating popup marker
    function specificmarkerupdate(layer){
      var roomid=layer.feature.properties.ROOM;
      layer.bindPopup("Room: "+roomid);
      if(curdb[roomid]){
        //layer.bindTooltip("Room: "+roomid+"<br>Events: "+curdb[roomid].count,{direction:'center',permanent:true,opacity:1}).off();
        if(layer.getTooltip()){layer.setTooltipContent(""+curdb[roomid].count);}//if tooltip already exists, then change value
        else{layer.bindTooltip(""+curdb[roomid].count,{direction:'center',permanent:true,opacity:0});}//if not, instantiate new tooltip
      }
      else{
        //layer.bindTooltip("Room: "+roomid,{direction:'center',permanent:true,opacity:1}).off();
        //layer.bindTooltip("0",{direction:'center',permanent:true,opacity:0});
        if(layer.getTooltip()){layer.unbindTooltip();}//if new selection makes count 0, then unbind tooltip
      }
      //accounting time range change while zoomed in
      if (mymap.getZoom()>=20 && layer.getTooltip()){layer.getTooltip().setOpacity(1);}
    }
    //function for updating style based on selection using border line weight
    function selectionstyle(feature){
      if(selection.indexOf(feature.properties.ROOM)>-1){
        return {
          weight:border_large
        };
      }
      else{
        return{
          weight:border_small
        };
      }
    }


    //adding classic layers from mapbox based on id
    //https://www.mapbox.com/api-documentation/#maps
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

    //creation of leaflet map
    var mymap = L.map('mapdiv',{layers:[layer_streets],zoomControl:false,boxZoom:true,markerZoomAnimation:false}).setView([39.995600, -83.016992], 19);
    //creation of layer-group of classic layers
    var baselayers = {
      "streets":layer_streets,
      "satellite":layer_satellite,
      "weird":layer_weird
    };
    //loading hospital layers from static GIS zip
    var D4=new L.shapefile('/static/updatedmaps/Doan_04.zip',{
      style: updatestyle,
      onEachFeature: geojsonbind
    });
    var J10=new L.shapefile('/static/updatedmaps/James_10.zip',{
      style: updatestyle,
      onEachFeature: geojsonbind
    });
    var J11=new L.shapefile('/static/updatedmaps/James_11.zip',{
      style: updatestyle,
      onEachFeature: geojsonbind
    });
    var UHE4=new L.shapefile('/static/updatedmaps/UHE_04.zip',{
      style: updatestyle,
      onEachFeature: geojsonbind
    });

    //
    mymap.on('zoomend',function(e){
      if(e.target.getZoom()>=20){
        //open all tooltips
        D4.eachLayer(function(layer){
          if(layer.getTooltip()){layer.getTooltip().setOpacity(1);}
        });
      }else{
        //close all tooltips
        D4.eachLayer(function(layer){
          if(layer.getTooltip()){layer.getTooltip().setOpacity(0);}
        });
      }
    });

    //function to apply selection to db
    function applyselection(dbin,selectionin){
      var filtereddb=[];
      for(var i=0,len=selectionin.length;i<len;i++){
        var roomid = selectionin[i];
        if(dbin[roomid]){
          filtereddb=filtereddb.concat(dbin[roomid].list);
        }
      }
      return filtereddb;
    }


    function readabledate(listin){
      for(var i=0,len=listin.length;i<len;i++){
        var tdate=listin[i].DateOfEvent;
        //listin[i].readabledate = (tdate.getMonth()+1) +"/"+ tdate.getDate() +"/"+ tdate.getFullYear();//+" "+tdate.getHours()+":"+tdate.getMinutes()+":"+tdate.getSeconds();
        var tyear=tdate.getFullYear();
        var tmonth=(tdate.getMonth()+1);
        if(tmonth<10){tmonth="0"+tmonth;}
        var tday=tdate.getDate();
        if(tday<10){tday="0"+tday;}
        listin[i].readabledate = tyear+"-"+tmonth+"-"+tday;
      }
      return listin;
    }

    //function for updating table based on selection
    function selectionupdate(){
      if(mydatatable){mydatatable.destroy();}
      //filter curdb by selection
      var selectiondb = applyselection(curdb,selection);
      //add readable date to selectiondb
      selectiondb=readabledate(selectiondb);

      console.log(selectiondb);

      //adding datatable
      mydatatable=$('#datatable').DataTable({
        data:selectiondb,
        columns:[
          {title:'RoomID',data:'RoomID' },
          {title:'PatientID',data:'PatientID'},
          {title:'EventID',data:'EventID'},
          {title:'DateOfEvent',data:'readabledate'},
          {title:'ClinSig',data:'ClinSig'},
          {title:'Type',data:'Type'}
        ],
        paging: false,
        scrollY: '50vh',
      });
      //create and populate data for plotting
      var data = [{x:[],y:[],type:'bar'}];
      var freq={};
      for(var i=0;i<selectiondb.length;i++){
        var DoE=selectiondb[i].readabledate;
        if (freq[DoE]){freq[DoE]++;}
        else{freq[DoE]=1;}
      }
      freqkeys=Object.keys(freq);
      if(freqkeys.length>0){
        for(var j=0;j<freqkeys.length;j++){
          data[0].x.push(freqkeys[j]);
          data[0].y.push(freq[freqkeys[j]]);
        }
        var layout={
          margin:{l:15,b:20,r:0,t:0}
        };
        Plotly.newPlot('plot', data,layout);
      }
      else{
        Plotly.purge('plot');
      }

    }

    //defining dom event handling for features in layers
    function geojsonbind(feature,layer){
      //layer.bindPopup("Room "+feature.properties.ROOM);
      specificmarkerupdate(layer);
      //layer.bindPopup(curdb[feature.properties.ROOM]);

      layer.on('mouseover', function (e) {
        layer.openPopup();
      });
      layer.on('mouseout', function (e) {
        layer.closePopup();
      });

      layer.on('click',function(e){
        //updating selection
        var temproomname=feature.properties.ROOM;
        var tempindex=selection.indexOf(temproomname);
        if(tempindex==-1){selection.push(temproomname);}
        else{selection.splice(tempindex,1);}
        //set style
        D4.setStyle(selectionstyle);
        selectionupdate();
      });
    }

    //adding hospital layers to leaflet map
    D4.addTo(mymap);

    //creation of layer-group of hospital layers
    var hospitallayers={
      "Doan 4":D4,
      "James 10":J10,
      "James 11":J11,
      "UHE 4":UHE4,
    };

    //creation of control element for leaflet map
    var lcontrol=L.control.layers(baselayers,hospitallayers,{position:'topleft'}).addTo(mymap);


    //hijacking boxzoom (shift click and drag) feature of leaflet map for selection
    mymap.boxZoom._onMouseUp=function(e){
      if ((e.which !== 1) && (e.button !== 1)) { return; }
  		this._finish();
  		if (!this._moved) { return; }
  		// Postpone to next JS tick so internal click event handling
  		// still see it as "moved".
  		setTimeout(L.Util.bind(this._resetState, this), 0);
  		var bounds = new L.LatLngBounds(
	        this._map.containerPointToLatLng(this._startPoint),
	        this._map.containerPointToLatLng(this._point));
      //bounds._northEast
      //bounds._southWest
      //.lat .lng
      D4layers = D4.getLayers();
      for(var i=0;i<D4layers.length;i++){
        var temproom=D4layers[i].getLatLngs()[0];
          for (var j=0;j<temproom.length;j++){
            if(temproom[j].lat<=bounds._northEast.lat && temproom[j].lat>=bounds._southWest.lat && temproom[j].lng<=bounds._northEast.lng && temproom[j].lng>=bounds._southWest.lng){
              if (selection.indexOf(D4layers[i].feature.properties.ROOM)==-1){selection.push(D4layers[i].feature.properties.ROOM);}
            }
          }
      }
      D4.setStyle(selectionstyle);
      selectionupdate();
      this._map.fire('boxzoomend', {boxZoomBounds: bounds});
    };
    updatemarker(D4);
  }


  //actually start loading data for mapping
  if (type=='dynamodb'){
    socket.on('receivetable',function(msg){
      mapinit(msg.Items);
    });
    socket.emit('requesttable','HospitalMapping');
  }else if (type=='csv'){
    d3.csv("/static/data.csv", function(data) {
      d3.csv("/static/iso.csv",function(isoin){
        iso=isoin;
        mapinit(data);
      });
    });
  }
});
