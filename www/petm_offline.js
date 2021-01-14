'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var LoadSaveMethods = function () {
  function LoadSaveMethods(name) {
    _classCallCheck(this, LoadSaveMethods);

    this.name = name;
    this.store = null;
    this.loadStore();
    this.user = null;
  }

  _createClass(LoadSaveMethods, [{
    key: 'loadStore',
    value: function loadStore() {
      this.store = localforage.createInstance({ name: this.name });
    }
  }, {
    key: 'saveStore',
    value: function saveStore() {
      if (this.user!= null)
        this.store.setItem('user_' + this.user.info.username, this.user);
    }
  }, {
    key: 'deleteStore',
    value: function deleteStore() {
      this.store.dropInstance();
    }
  }, {
    key: 'login',
    value: function login(username, password, _self, callback) {
      var self = this;
      this.store.getItem('user_' + username).then(function (item) {
        if (item != null && item.info.password == password) {
          self.add_autologin(item.info);
          self.store.getItem('user_' + username).then(function (item2) {
            self.user = item2;
            callback.call(_self,item.data);
          });
        } else {
          callback.call(_self,null);
        }
      });
    }
  }, {
    key: 'autologin',
    value: function autologin(callback) {
      var self = this;
      this.store.getItem('autologin').then(function (item) {
        callback(item);
      });
    }
  }, {
    key: 'add_autologin',
    value: function add_autologin(user) {
      this.store.setItem('autologin',user);
    }
  }, {
    key: 'read_past_inspections',
    value: function read_past_inspections(unicode,self) {
      if(unicode==null) {
        var last = this.user.data.lastInspections;
        var result = [];
        for (var i=0; i < last.length; i++) {
          var obj = {};
          for (var key in last[i])
            obj[key] = last[i][key];
          result.push(obj);
        }
        return result;
      } else {
        var lastInspections = this.user.data.lastInspections;
        lastInspections = self.merge(unicode,lastInspections,'UNICODE');
        self.find_and_replace(lastInspections,"FECHA", "NA", "FECHA", "--");
        self.find_and_replace(lastInspections,"TOT_INTRA", "NA", "TOT_INTRA", 0);
        self.find_and_replace(lastInspections,"TOT_PERI", "NA", "TOT_PERI", 0);
        self.find_and_replace(lastInspections,"RASTROS", "NA", "RASTROS", "0");
        return lastInspections;
      }
    }
  }, {
    key: 'save_search_data_mysql',
    value: function save_search_data_mysql(data, dbtable, self) {
      if (shinyShadow.state == "offline") {
        this.user.new_data.push({
          data: data,
          dbtable: dbtable
        });
      }
      var obj = {
        UNICODE: data.UNI_CODE,
        FECHA: data.FECHA, 
        USER_NAME: data.USER_NAME, 
        STATUS_INSPECCION: data.STATUS_INSPECCION, 
        TOT_INTRA: data.TOT_INTRA, 
        TOT_PERI: data.TOT_PERI, 
        RASTROS:  data.RASTROS, 
        PREDICTED_PROBAB: data.PREDICTED_PROBAB, 
        PREDICTED_PROBAB_MEAN: data.PREDICTED_PROBAB_MEAN
      };
      for (var i = 0; i < this.user.data.lastInspections.length; i++) {
        if(this.user.data.lastInspections[i].UNICODE == obj.UNICODE) {
          this.user.data.lastInspections[i] = obj;
          break;
        }
      }
      this.store.setItem("user_"+this.user.info.username, this.user);
      self.updated = true;
    }
  }, {
    key: 'addLoadMsg',
    value: function addLoadMsg(msg) {
      this.user.loadSeq.push(msg);
      this.store.setItem("user_"+this.user.info.username, this.user);
    }
  }, {
    key: 'load_data_mysql',
    value: function load_data_mysql(filterStart, dbname, dbtable) {}
  }, {
    key: 'add_user',
    value: function add_user(user,callback) {
      var self = this;
      this.store.getItem('user_' + user.username).then(function (item) {
        if (item == null) {
          item = {};
          item.info = user;
          self.store.setItem('user_' + user.username, item);
        }
        if (callback != null)
          callback();
      });
    }
  }, {
    key: 'add_user_data',
    value: function add_user_data(user, data, callback) {
      var self = this;
      this.store.getItem('user_' + user.username).then(function (item) {
        if (item != null) {
          item.info = user;
          item.data = data;
          if (item.new_data==null)
            item.new_data = [];
          else
            shinyShadow.server_offline.updated = true;
          item.loadSeq = [];
          self.store.setItem('user_' + user.username, item).then(function(e){
            callback(e);
          });
        } else {
          item = {};
          item.info = user;
          item.data = data;
          item.new_data = [];
          item.loadSeq = [];
          self.store.setItem('user_' + user.username, item).then(function(e){
            callback(e);
          });
        }
      });
    }
  }]);

  return LoadSaveMethods;
}();

var Petm = function () {
  function Petm(shiny) {
    _classCallCheck(this, Petm);

    this.shiny = shiny;
    this.map_loaded = false;
    this.map_manager = new MapManager();
    this.updated = false;
    this.dbname = 'shagas';
    this.lsmethods = new LoadSaveMethods(this.dbname);

    //Variables globales
    this.usernameCheck = 'Failure';

    //this.reconnected = false;
    this.var_sim_searches = null;

    //The authenatication system:
    this.sessionData = {};

    //localidades total
    this.var_locality = null;
    
    this.loggedIn = false;
    
    this.loading_seq = false;
    
    this.date_start = "";
    this.delaunay_vertices = [];
    
    this.lat = -16.39249883;
    this.lng = -71.55001667;
    
    this.k = 10;
    this.depth = 9;
    this.risk_bias = 2;
    
    this.min_route = [];
  }

  _createClass(Petm, [{
    key: 'resolve',
    value: function resolve(msg) {
      if (msg.data['userLogin:shiny.action'] != null) {
        var self = this;
        this.userLogin(function () {
          self.map_manager.loadMap(self.shiny);
          self.map_loaded = true;
        });
      } else if (msg.data['inputSubmit:shiny.action'] != null && this.loggedIn) {
        var self = this;
        this.shiny.dispatchMessage('{"custom":{"action-message":"buscando_true"}}');
        setTimeout(function() {
          self.inputSubmit();
          self.shiny.dispatchMessage('{"custom":{"action-message":"buscando_false"}}');
        }, 0);
      } else if (msg.data['inputClear:shiny.action'] != null && this.loggedIn) {
        this.inputClear();
      } else if (msg.data['enterData:shiny.action'] != null && this.loggedIn) {
        this.enterData();
      } else if (msg.data['.clientdata_output_map_hidden'] != null && !this.map_loaded && this.loggedIn) {
        this.map_manager.loadMap(this.shiny);
        this.map_loaded = true;
      } else if (msg.data['load:shiny.action'] != null && this.loggedIn && !this.loading_seq) {
        var self = this;
        this.shiny.dispatchMessage('{"custom":{"action-message":"buscando_true"}}');
        setTimeout(function() {
          self.load();
          self.shiny.dispatchMessage('{"custom":{"action-message":"buscando_false"}}');
        }, 0);
      } else if (msg.data['map_marker_click'] != null && this.loggedIn) {
        this.map_marker_click();
      } else if (msg.data['gps:shiny.action'] != null && this.loggedIn) {
        this.gps();
      } else if (msg.data['sim_inspect_house_button:shiny.action'] != null && this.loggedIn) {
        this.sim_inspect_house_button();
      } else if (msg.data['reportUser:shiny.action'] != null && this.loggedIn) {
        this.reportUser();
      } else if (msg.data['btn_filter:shiny.action'] != null && this.loggedIn) {
        this.btn_filter();
      } else if (msg.data['logout:shiny.action'] != null && this.loggedIn) {
        this.logout();
      //Agregando Salir
      } else if (msg.data['quit:shiny.action'] != null && this.loggedIn) {
        this.quit();
      } else if (msg.data['pathA:shiny.action'] != null && this.loggedIn) {
        this.pathA();
      } else if (msg.data['hide_pathA:shiny.action'] != null && this.loggedIn) {
        this.hide_pathA();
      } else if (msg.data['pathAB:shiny.action'] != null) {
        this.pathAB();
      } else if (msg.data['hide_pathAB:shiny.action'] != null) {
        this.hide_pathAB();
      }
    }
  }, {
    key: 'userLogin',
    value: function userLogin(callback) {
      var values = this.shiny.$inputValues;
      this.lsmethods.login(values['username'], values['password:shiny.password'], this, function (data) {
        var loginSuccess = ["no_data"];
        if (data!=null)
          loginSuccess = data.loginSuccess;
        var output = {};

        if ("usuario_correcto" == loginSuccess[0]) {
          this.loggedIn = true;
          this.usernameCheck = 'Success';

          //Variable para dar permiso al administrador
          if ("ADMIN" == loginSuccess[1]) {
            var admin_user = 'Success';

            var data_mysql = this.Report();

            output.casa_regular = "Casa regular:" + data_mysql["casa_regular"];
            output.des = "Deshabitadas:" + data_mysql["des"];
            output.lp = "LP:" + data_mysql["lp"];
            output.lv = "LV:" + data_mysql["lv"];
            output.c = "Cerradas:" + data_mysql["c"];
            output.inspeccion = "Inspeccionadas:" + data_mysql["inspeccion"];
            output.r = "Renuentes:" + data_mysql["r"];
            output.v = "V1:" + data_mysql["v"];
            output.num_elements = "No DE REGISTROS:" + data_mysql["num_elements"];

            output.valores = this.renderDataTable(data_mysql["data"], { pageLength: 10 });

            output.adminUser = admin_user;
            this.outputOptions(output, 'adminUser', { suspendWhenHidden: false }); 
          } else {
            var admin_user = "Failure";

            this.sessionData = data.sessionData;
            this.find_and_replace2(this.sessionData.searchdata,"LONGITUDE",function(item) {
              return parseFloat(item);
            });
            this.find_and_replace2(this.sessionData.searchdata,"LATITUDE",function(item) {
              return parseFloat(item);
            });
            this.find_and_replace2(this.sessionData.searchdata,"probability",function(item) {
              return parseFloat(item);
            });
            this.lat = this.mean(this.sessionData.searchdata,"LATITUDE");
            this.lng = this.mean(this.sessionData.searchdata,"LONGITUDE");
            this.sessionData.houseId = '';
            this.sessionData.palForRisk = function (probab) {
              return "#808080";
            };
            this.val_sim_searches = loginSuccess[3];
            this.init_delaunay_vertices();
        
            if (callback != null) {
              callback();
              var self = this;
              this.shiny.dispatchMessage('{"custom":{"action-message":"buscando_true"}}');
              this.map_manager.setView(this.lat,this.lng,16);
              setTimeout(function() {
                self.map_manager.startTilesLoad(self.lat, self.lng, function() {
                  self.shiny.dispatchMessage('{"custom":{"action-message":"buscando_false"}}');
                });
              }, 1000);
            }
          }
        } else if ("clave_incorrecta" == loginSuccess[0]) {
          this.shiny.dispatchMessage('{"custom":{"validation-message":"La CLAVE no es la correcta. Por favor inténtelo nuevamente"}}');
          return;
        } else {
          this.shiny.dispatchMessage('{"custom":{"validation-message":"El USUARIO no existe. Por favor inténtelo nuevamente"}}');
          return;
        }
        output.validUser = this.usernameCheck;
        output.networkCheck = "Success";
        this.outputOptions(output, 'validUser', { suspendWhenHidden: false });

        this.dispatchOutput(output);
      });
    }
  }, {
    key: 'inputSubmit',
    value: function inputSubmit() {
      var values = this.shiny.$inputValues;
      //enviar buscando_true
      this.shiny.dispatchMessage('{"custom":{"action-message":"buscando_true"}}');

      //Llenado campos obligatorios
      if (values["P:shiny.number"] == null || values["D:shiny.number"] == null || values["L"] == '' || values["V"] == '') {
        this.shiny.dispatchMessage('{"custom":{"confirm-message":"El unicode de la vivienda es obligatorio."}}');
        //Campo Obs_text de unicode equivocado  
      } else if (values['observaciones'] == true && values['obs_unicode'] == "5" && values['obs_text1'] == "") {
        this.shiny.dispatchMessage('{"custom":{"validation-message":"Ingrese el codigo correcto en la caja de texto"}}');
        //Campo Obs_text de unicode equivocado
      } else if (values['observaciones'] == true && values['obs_unicode'] == "8" && values['obs_text2'] == "") {
        this.shiny.dispatchMessage('{"custom":{"validation-message":"Ingrese la observación sobre el codigo en la caja de texto"}}');
      } else if (values['caract_predio'] == "LP" && values['tipo_lp'] == "") {
        this.shiny.dispatchMessage('{"custom":{"validation-message":"Ingrese por favor el tipo de local publico"}}');
      } else if (values['status_inspec'] == "V" && values['motivo_volver'] == "") {
        this.shiny.dispatchMessage('{"custom":{"validation-message":"Ingrese por favor el motivo por el cual se tiene que volver"}}');
      } else if (values['status_inspec'] == "R" && values['renuente'] == "R6" && values['renuente_otro'] == "") {
        this.shiny.dispatchMessage('{"custom":{"validation-message":"Explique por favor la causa de renuencia"}}');
      } else if (values['status_inspec'] == "inspeccion" && values['lugar_inspeccion_intra'] == false && values['lugar_inspeccion_peri'] == false) {
        this.shiny.dispatchMessage('{"custom":{"validation-message":"Ingrese por favor el lugar donde se realizo la inspeccion"}}');
      } else if ((values['chiris_intra'] == true || values['rastros_intra'] == true) && values['lugar_inspeccion_intra'] == false) {
        this.shiny.dispatchMessage('{"custom":{"validation-message":"No puede marcar en chiris o rastros sin haber seleccionado el lugar de inspección adecuado "}}');
      } else if ((values['chiris_peri'] == true || values['rastros_peri'] == true) && values['lugar_inspeccion_peri'] == false) {
        this.shiny.dispatchMessage('{"custom":{"validation-message":"No puede marcar en chiris o rastros sin haber seleccionado el lugar de inspección adecuado "}}');
      } else {
        var inputData = this.recordInspectionFields();
        
        inputData.USER_NAME      = values.username;
        inputData.GROUP_NAME     = 'SIN_GRUPO';
        inputData.DATA_ACTION    = 'INSPECTION_NEW';
        
        var patron = /^1.[0-9]+.[0-9]+[A-z]?.[0-9]+[A-z]$/;
        var unicode_aux = '';
        var PREDICTED_PROBAB = 0;
        if (patron.test(inputData.UNI_CODE)) {
          unicode_aux = inputData.UNI_CODE.substr(1, inputData.UNI_CODE.length-1);
          PREDICTED_PROBAB = this.filter_by_column(this.sessionData.searchdata,{UNICODE:unicode_aux}, 'probability');
        } else {
          PREDICTED_PROBAB = this.filter_by_column(this.sessionData.searchdata,{UNICODE:inputData.UNI_CODE}, 'probability');
        }
        
        PREDICTED_PROBAB = PREDICTED_PROBAB[0];
        inputData.PREDICTED_PROBAB = PREDICTED_PROBAB;
        inputData.PREDICTED_PROBAB_MEAN = this.mean(this.sessionData.searchdata,'probability');
        
        inputData.PREDICTED_COLOR       = this.sessionData.palForRisk(PREDICTED_PROBAB);
        
        inputData.HORA_FIN = this.get_date();
        
        this.lsmethods.save_search_data_mysql(inputData,'APP_INSPECTIONS',this);
        
        var houseinLoc = this.getLocalityData();
        
        if (houseinLoc != null && inputData.STATUS_INSPECCION == "inspeccion") {
          var house = this.filter_by_column(houseinLoc,{UNICODE:inputData.UNI_CODE},['LATITUDE','LONGITUDE']);
          if (house.length!=0) {
            this.lsmethods.user.data.sessionData.inspected.push({
              LATITUDE: house[0].LATITUDE,
              LONGITUDE: house[0].LONGITUDE,
              UNICODE: inputData.UNI_CODE,
              inspected: true
            });  
            this.delaunay_vertices.push([house[0].LATITUDE,house[0].LONGITUDE]);
          }
          
          this.lsmethods.saveStore();
          this.inspected_unicode[inputData.UNI_CODE] = true;
          var delaunay = Delaunator.from(this.delaunay_vertices);
          var idxs = delaunay.triangles;
          var triangles = [];
          for (var i = 0; i < idxs.length; i += 3) {
            triangles.push({
              x:[this.delaunay_vertices[idxs[i]][0],this.delaunay_vertices[idxs[i+1]][0],this.delaunay_vertices[idxs[i+2]][0]],
              y:[this.delaunay_vertices[idxs[i]][1],this.delaunay_vertices[idxs[i+1]][1],this.delaunay_vertices[idxs[i+2]][1]]
            });
          }
          this.draw_delaunay(triangles,true);
          this.draw_markers(houseinLoc,true);
        } 
        else {
          this.draw_markers(houseinLoc,false,inputData.UNI_CODE);
        }
        
        if (this.min_route.length > 0)
            this.update_min_route(inputData);

        this.shiny.dispatchMessage('{"custom":{"validation-message":"Los datos fueron GUARDADOS con éxito. Gracias."}}');
        
        this.cleanData();
      }
      this.shiny.dispatchMessage('{"custom":{"action-message":"buscando_false"}}');
    }
  }, {
    key: 'draw_delaunay',
    value: function draw_delaunay(data,clear) {
      if (clear)
        this.map_manager.clearPolygons();
      
      var self = this;
      this.map_manager.add_polygons(data,function(item) {
        var uninspected = 0;
        var data = self.sessionData.searchdata;
        for (var i = 0; i < data.length; i++) {
          var point = {
            x: data[i].LATITUDE,
            y: data[i].LONGITUDE
          };
          if (self.is_uninspected(data[i]) && self.point_in_polygon(point,item))
            uninspected = uninspected + 1;
        }
        
        return {
          lat: item.x,
          lng: item.y,
          fill: true,
          fillColor: "transparent",
          weight: 1,
          highlightOptions: {
            color: "white", 
            weight: 1,
            fill: true, 
            fillColor: "white",
            bringToFront: false, 
            fillOpacity: .4
           },
          label: uninspected,
          labelOptions: {noHide: false, textsize: "15px"}
        };
      });
    }
  }, {
    key: 'draw_markers',
    value: function draw_markers(data,clear,unicode=null) {
      if (clear)
        this.map_manager.clearMarkers();
      if (unicode != null) {
        for (var i = 0; i < data.length; i++) {
          if (data[i].UNICODE == unicode) {
            data = [data[i]];
            break;
          }
        }
      }
      var self  = this;
      this.map_manager.add_circle_markers(data, function(item) {
        return {
          lng : item.LONGITUDE,
          lat : item.LATITUDE,
          radius : 8,
          color : self.sessionData.palForTime(item["time"]),
          stroke : false,
          fillOpacity : 0.3
        };
      });
      
      this.map_manager.add_circle_markers2(data, function(item) {
        return {
          lng : item.LONGITUDE,
          lat : item.LATITUDE,
          fillColor : self.sessionData.palForRisk(item["probability"]),
          radius : 4,
          stroke : true,
          color : "black",
          weight : 0.4,
          fillOpacity : 1,
          layerId : item['UNICODE'],
          popup : "<b>"+item["UNICODE"]+"</b><br>"+"Ult. visita:"+"<b style='color: black;'>"+item["inspectionText"]+"</b>"
        };
      });
    }
  }, {
    key: 'init_delaunay_vertices',
    value: function init_delaunay_vertices() {
      this.delaunay_vertices = [];
      this.inspected_unicode = {};
      this.not_inspected = [];
      var ins_data = this.sessionData.inspected;
      
      var max_lat = -100;
      var max_lng = -100;
      var min_lat = 100;
      var min_lng = 100;
      if(this.sessionData.inspected == null)
        ins_data = [];
      for (var i = 0; i < ins_data.length; i++) {
        this.delaunay_vertices.push([ins_data[i].LATITUDE,ins_data[i].LONGITUDE]);
        if (ins_data[i].LATITUDE > max_lat)
          max_lat = ins_data[i].LATITUDE;
        if (ins_data[i].LONGITUDE > max_lng)
          max_lng = ins_data[i].LONGITUDE;
        if (ins_data[i].LATITUDE < min_lat)
          min_lat = ins_data[i].LATITUDE;
        if (ins_data[i].LONGITUDE < min_lng)
          min_lng = ins_data[i].LONGITUDE;
        this.inspected_unicode[ins_data[i].UNICODE] = true;
      }
      
      for (var i = 0; i < this.sessionData.searchdata.length; i++) {
        if (this.sessionData.searchdata[i].LATITUDE > max_lat)
          max_lat = this.sessionData.searchdata[i].LATITUDE;
        if (this.sessionData.searchdata[i].LONGITUDE > max_lng)
          max_lng = this.sessionData.searchdata[i].LONGITUDE;
        if (this.sessionData.searchdata[i].LATITUDE < min_lat)
          min_lat = this.sessionData.searchdata[i].LATITUDE;
        if (this.sessionData.searchdata[i].LONGITUDE < min_lng)
          min_lng = this.sessionData.searchdata[i].LONGITUDE;
      }
      this.delaunay_vertices.push([min_lat,min_lng]);
      this.delaunay_vertices.push([min_lat,max_lng]);
      this.delaunay_vertices.push([max_lat,min_lng]);
      this.delaunay_vertices.push([max_lat,max_lng]);
    }
  }, {
    key: 'is_uninspected',
    value: function is_uninspected(item) {
      return this.inspected_unicode[item.UNICODE] == null;
    }
  }, {
    key: 'point_in_polygon',
    value: function point_in_polygon(point,triangle) {
      var px = point.x, py = point.y;
      var ax = triangle.x[0],
          bx = triangle.x[1],
          cx = triangle.x[2];
      var ay = triangle.y[0],
          by = triangle.y[1],
          cy = triangle.y[2];
          
      var v0 = [cx-ax,cy-ay];
      var v1 = [bx-ax,by-ay];
      var v2 = [px-ax,py-ay];
      
      var dot00 = (v0[0]*v0[0]) + (v0[1]*v0[1]);
      var dot01 = (v0[0]*v1[0]) + (v0[1]*v1[1]);
      var dot02 = (v0[0]*v2[0]) + (v0[1]*v2[1]);
      var dot11 = (v1[0]*v1[0]) + (v1[1]*v1[1]);
      var dot12 = (v1[0]*v2[0]) + (v1[1]*v2[1]);
      
      var invDenom = 1/ (dot00 * dot11 - dot01 * dot01);
      
      var u = (dot11 * dot02 - dot01 * dot12) * invDenom;
      var v = (dot00 * dot12 - dot01 * dot02) * invDenom;
      
      return ((u >= 0) && (v >= 0) && (u + v < 1));
    }
  }, {
    key: 'inputClear',
    value: function inputClear() {
      this.shiny.dispatchMessage('{"custom":{"action-message":"buscando_true"}}');
      
      this.cleanData();
      
      this.shiny.dispatchMessage('{"custom":{"action-message":"buscando_false"}}');
    }
  }, {
    key: 'enterData',
    value: function enterData() {
      this.shiny.dispatchMessage('{"custom":{"action-message":"buscando_true"}}');
      
      this.date_start = this.get_date();
      
      this.shiny.dispatchMessage('{"custom":{"action-message":"buscando_false"}}');
    }
  }, {
    key: 'load',
    value: function load() {
      this.shiny.dispatchMessage('{"custom":{"action-message":"buscando_true"}}');
      
      var output = {};
      var values = this.shiny.$inputValues;
      
      this.var_locality = values["locality"];
      if (this.var_locality.length == 0) {
        this.var_locality = this.sessionData.localities;
      }
      
      var houseinLoc = this.getLocalityData();
      
      output.houseId = "";
      output.userMessage = "";
      output.houseProbab = "";
      
      this.map_manager.clearAll();
      var lng = this.mean(houseinLoc,"LONGITUDE");
      var lat = this.mean(houseinLoc,"LATITUDE");
      this.map_manager.setView(lat,lng,16);
      
      var delaunay = Delaunator.from(this.delaunay_vertices);
      var idxs = delaunay.triangles;
      var triangles = [];
      for (var i = 0; i < idxs.length; i += 3) {
        triangles.push({
          x:[this.delaunay_vertices[idxs[i]][0],this.delaunay_vertices[idxs[i+1]][0],this.delaunay_vertices[idxs[i+2]][0]],
          y:[this.delaunay_vertices[idxs[i]][1],this.delaunay_vertices[idxs[i+1]][1],this.delaunay_vertices[idxs[i+2]][1]]
        });
      }
      this.draw_delaunay(triangles,true);
      this.draw_markers(houseinLoc,true);
      
      this.map_manager.add_legend({
        position: "bottomleft",
        colors: this.sessionData.riskColors,
        labels: this.sessionData.riskNames,
        opacity: 1,
        title: "Riesgo de Infestacion"
      });
      
      //this.compute_knn_graph();
      this.dispatchOutput(output);
      this.shiny.dispatchMessage('{"custom":{"action-message":"buscando_false"}}');
    }
  }, {
    key: 'map_marker_click',
    value: function map_marker_click() {
      var output = {};
      var values = this.shiny.$inputValues;
      var click = values["map_marker_click"];
      if(click == null) {
        return;
      }
      if (click.id == null)
        this.sessionData.houseId = "";
      else {
        if(click.id.substr(0,1)=="-")
          this.sessionData.houseId = click.id.substr(1,click.id.length-1);
        else
          this.sessionData.houseId = click.id;
        this.add_coord(click);
      }
      output.houseId = this.sessionData.houseId;
      output.inspectionUserMessage = "";
      this.dispatchOutput(output);
      this.houseId();
    }
  }, {
    key: 'houseId',
    value: function houseId() {
      if (this.sessionData.houseId == '') {
        return;
      }
      var output = {};
      this.shiny.dispatchMessage('{"custom":{"action-message":"buscando_true"}}');
      
      var PDLV = this.sessionData.houseId.split('.');
      this.shiny.dispatchMessage('{"inputMessages":[{"id":"P","message":{"value":"' + PDLV[0]+ '"}}]}');
      this.shiny.dispatchMessage('{"inputMessages":[{"id":"D","message":{"value":"' + PDLV[1]+ '"}}]}');
      this.shiny.dispatchMessage('{"inputMessages":[{"id":"L","message":{"value":"' + PDLV[2]+ '"}}]}');
      this.shiny.dispatchMessage('{"inputMessages":[{"id":"V","message":{"value":"' + PDLV[3]+ '"}}]}');
      
      var PREDICTED_PROBAB = this.filter_by_column(this.sessionData.searchdata,{UNICODE:this.sessionData.houseId},'probability');
      PREDICTED_PROBAB = PREDICTED_PROBAB[0];
      
      if(this.var_sim_searches== 0) {
        output.inspectButton = "";
        output.houseProbab = 'probab: ' + PREDICTED_PROBAB.toFixed(2);
      } else {
        output.inspectButton = '<button id="sim_inspect_house_button"></button>';
        output.houseProbab = "";
      }
      
      this.dispatchOutput(output);
      this.shiny.dispatchMessage('{"custom":{"action-message":"buscando_false"}}');
    }
  }, {
    key: 'gps',
    value: function gps() {
      this.shiny.dispatchMessage('{"custom":{"action-message":"buscando_true"}}');
      var values = this.shiny.$inputValues;
      if (values["lat"] != null) {
        output.userMessage = "";
        this.map_manager.add_circles({
          color: "blue",
          radius: 5,
          lng: input["lng"],
          lat: input["lat"]
        });
        this.map_manager.setView(values['lng'],
                      values['lat'],
                      20);
      } else {
        output.houseId = "";
        output.userMessage = "Location data unavailable";
      }
      this.dispatchOutput(output);
      this.shiny.dispatchMessage('{"custom":{"action-message":"buscando_false"}}');
    }
  }, {
    key: 'sim_inspect_house_button',
    value: function sim_inspect_house_button() {
      this.shiny.dispatchMessage('{"custom":{"action-message":"buscando_true"}}');
      
      var output = {};
      var values = this.shiny.$inputValues;
      if(this.sessionData.houseId == "") {
        this.shiny.dispatchMessage('{"custom":{"action-message":"buscando_false"}}');
        return;
      }
      var inputData = {
        'USER_NAME'      : values['username'],
        'GROUP_NAME'     : 'SIN_GRUPO',
        'DATA_ACTION'    : 'INSPECTION_CLICK',
        "UNI_CODE"       : this.sessionData.houseId,
        "FECHA"          : values['fecha'],
        "INSPECTION_FLAG": "inspected",
        "TEST_DATA"      : values['testData']? 1: 0
      }
      
      var PREDICTED_PROBAB = this.filter_by_column(this.sessionData.searchdata,{UNICODE: inputData.UNI_CODE}, 'probability');
      PREDICTED_PROBAB = PREDICTED_PROBAB[0];
      inputData.PREDICTED_PROBAB = PREDICTED_PROBAB;
      inputData.PREDICTED_PROBAB_MEAN = this.mean(this.sessionData.searchdata, 'probability');
      
      this.lsmethods.save_search_data_mysql(inputData, 'SIM_SEARCHES',this);
      
      var riskLevel = this.which(this.sessionData.riskColors, this.sessionData.palForRisk(PREDICTED_PROBAB));
      
      output.houseProbab = '<div>Riesgo: <font>'+this.sessionData.riskNames[riskLevel]+'</font></div>';
      this.dispatchOutput(output);
      this.shiny.dispatchMessage('{"custom":{"action-message":"buscando_false"}}');
    }
  }, {
    key: 'reportUser',
    value: function reportUser() {
      this.shiny.dispatchMessage('{"custom":{"action-message":"buscando_true"}}');
      
      var output = {};
      var values = this.shiny.$inputValues;
      var viv_ingresadas = HouseRegisterDay(this.get_date(),values['username']);
      if (viv_ingresadas.length==0) {
        viv_ingresadas = "Aun no se ingresaron viviendas el dia de hoy";
      }
      output.viv_ingresadas = this.renderDataTable(viv_ingresadas);
      var viv_volver = HouseGoBack(this.get_date(-1),values['username']);
      var aux  = null;
      
      if (viv_volver.length == 0) {
        viv_volver = "No hay viviendas pendientes para volver el dia de hoy";
      } else {
        aux = viv_ingresadas;
        viv_volver.VIV_VOLVER = 1;
        aux.VIV_INGRESADAS = 1;
        //viv_volver = this.merge(viv_volver, aux);
        viv_volver.VOLVER = "pendiente";
        viv_volver.VOLVER[(1==viv_volver$VIV_VOLVER & 1==viv_volver$VIV_INGRESADAS)] = "VISITADA";
        viv_volver = viv_volver[c("UNI_CODE", "USER_NAME", "VOLVER")];
      }
      output.viv_volver = this.renderTable(viv_volver);
      this.dispatchOutput(output);
      this.shiny.dispatchMessage('{"custom":{"action-message":"buscando_false"}}');
    }
  }, {
    key: 'getLocalityData',
    value: function getLocalityData(unicode=null) {
      var houseinLoc = [];
      var self = this;
      if (unicode!=null)
        houseinLoc = this.filter_by_column(this.sessionData.searchdata, {"UNICODE": unicode});
      else
        houseinLoc = this.filter_by_column2(this.sessionData.searchdata, {"filter": function(item) {
          var result = false;
          if (typeof self.var_locality == "string")
            return item.codeLoc == self.var_locality;
            
          for (var i = 0; i < self.var_locality.length; i++) {
            if (item.codeLoc == self.var_locality[i]) {
              result = true;
              break;
            }
          }
          return result;
        } });
        
      var domain = this.filter_by_column2(this.sessionData.searchdata, {"filter": function(item) {
          var result = false;
          if (typeof self.var_locality == "string")
            return item.codeLoc == self.var_locality;
            
          for (var i = 0; i < self.var_locality.length; i++) {
            if (item.codeLoc == self.var_locality[i]) {
              result = true;
              break;
            }
          }
          return result;
        } });
      
      this.sessionData.palForTime = function(n) {
        var colorFactor = ["#FFFFFF","#E5E5E5","#CCCCCC","#BFBFBF","#B3B3B3","#A6A6A6","#999999","#8C8C8C","#666666", "#4D4D4D", "#333333"];
        if (n > 10)
          return colorFactor[10];
        return colorFactor[n];
      }
      
      this.sessionData.riskNames  = ["Mas Bajo", "Bajo", "Medio", "Alto", "Mas Alto"];
      this.sessionData.riskColors = ["#FFFFB2", "#FECC5C", "#FD8D3C", "#F03B20", "#BD0026"];
      
      this.sessionData.palForRisk = (function(palette,domain,n) {
        var prob_domain = [];
        var step = Math.round(domain.length / n); 
        var pos = 0;
        for(var i = 0; i < n; i++) {
          prob_domain.push(domain[pos]);
          pos = pos + step;
        }
        return function(prob) {
          var color = "#808080";
          for (var i = 0; i < n; i++) {
            if (prob > prob_domain[i])
              break;
            else
              color = palette[n-1-i];
          }
          return color;
        };
      })(this.sessionData.riskColors,this.filter_by_column(domain,{},'probability'),5);
      
      //var lastInspections = this.lsmethods.read_past_inspections(this.filter_by_column(houseinLoc,{},['UNICODE']),this);
      var lastInspections = this.lsmethods.read_past_inspections();
      this.add_column(lastInspections, 'positive', function(item) {
        return (item.TOT_INTRA>0)||(item.TOT_PERI>0)||(item.RASTROS!='0');
      });
      
      this.find_and_replace(lastInspections,"STATUS_INSPECCION", "inspeccion", "STATUS_INSPECCION", "inspección");
      this.find_and_replace(lastInspections,"STATUS_INSPECCION", "C", "STATUS_INSPECCION", "cerrada");
      this.find_and_replace(lastInspections,"STATUS_INSPECCION", "R", "STATUS_INSPECCION", "renuente");
      this.find_and_replace(lastInspections,"STATUS_INSPECCION", "V", "STATUS_INSPECCION", "volver");
      
      this.add_column(lastInspections, 'inspectionText', function(item) {
        if (item.STATUS_INSPECCION != null)
          return item.FECHA + ': ' + item.STATUS_INSPECCION;
        else
          return item.FECHA + ': ' + "NA";
      });
      
      this.find_and_replace(lastInspections,'positive', true, 'inspectionText', function(item) {
        return "<font  color='black'>"+item+"</font>";
      });
      
      this.find_and_replace(lastInspections, 'positive', false, 'inspectionText', function(item) {
        return '<font>'+item+'</font>';
      });
      houseinLoc = this.merge(houseinLoc, this.filter_by_column(lastInspections,{},['UNICODE','inspectionText']), 'UNICODE');
      
      this.find_and_replace(houseinLoc,"inspectionText", "na", "inspectionText", "--");
      return houseinLoc;
    }
  }, {
    key: 'recordInspectionFields',
    value: function recordInspectionFields() {
      var input = this.shiny.$inputValues;
      var inputData = {
        //Almacenando campos
        "UNI_CODE" : input["P:shiny.number"]+'.'+input['D:shiny.number']+'.'+input["L"].toUpperCase()+'.'+input["V"].toUpperCase(),
        "CODE_LOCALITY" : input["P:shiny.number"]+'.'+input['D:shiny.number']+'.'+input["L"].toUpperCase(),
        "OBS_UNICODE" : input["observaciones"] ? input["obs_unicode"]: 'NA',
        "OBS_TEXT" : 'NA',
        "FECHA" : input["fecha:shiny.date"],
        "CARACT_PREDIO" : input["caract_predio"],
        "TIPO_LP" : 'NA',
        "STATUS_INSPECCION" : 'NA',
        "ENTREVISTA" : 'NA',
        "MOTIVO_VOLVER" : 'NA',
        "RENUENTE" : 'NA',
        "INTRA_INSPECCION" : 'NA',
        "INTRA_CHIRIS" : 'NA',
        "INTRA_RASTROS" : 'NA',
        "PERI_INSPECCION" : 'NA',
        "PERI_CHIRIS" : 'NA',
        "PERI_RASTROS" : 'NA',
        //eliminar luego de la base de datos, por que ya no se esta usando
        "LUGAR_INSPECCION" : 'NA',
        //-------------------------
        //eliminar luego
        "TOT_INTRA" : 'NA',
        "TOT_PERI" : 'NA',
        "RASTROS" : 'NA',
        //--------------
        "PERSONAS_PREDIO" : 'NA',
        
        "CANT_PERROS" : 'NA',
        "CANT_GATOS" : 'NA',
        "CANT_AVES_CORRAL" : 'NA',
        "CANT_CUYES" : 'NA',
        "CANT_CONEJOS" : 'NA',
        "TEXT_OTROS" : 'NA',
        "CANT_OTROS" : 'NA',
        "TEST_DATA"      : input["testData"]? 1: 0,
        "HORA_INICIO" : this.date_start
      };
      
      //Almacenar obs_text
      if (input["observaciones"] == true) { 
        if (input["obs_unicode"]==5) {
          inputData["OBS_TEXT"] = input["obs_text1"];
        }else if (input["obs_unicode"]==8) {
          inputData["OBS_TEXT"] = input["obs_text2"];
        }
      }
      
      if(input["caract_predio"] == 'casa_regular' || input["caract_predio"] == 'LP' || input["caract_predio"] == 'DES'){
        inputData["STATUS_INSPECCION"] = input["status_inspec"];
        
        //Si es local publico se pone que tipo es
        if (input["caract_predio"] == 'LP') {
          inputData["TIPO_LP"] = input["tipo_lp"];
        }
        
        //Campo ENTREVISTA
        if(input["status_inspec"] =='entrevista'){
          inputData["ENTREVISTA"] = input["entrevista"];
        }
        
        //Campo MOTIVOS_VOLVER
        if (input["status_inspec"] == 'V') {
          inputData["MOTIVO_VOLVER"] = input["motivo_volver"];
        }
        
        //Campo RENUENTE
        if (input["status_inspec"] == "R") { 
          if (input["renuente"]=="R6") {
            inputData["RENUENTE"] = input["renuente_otro"];
          }else {
            inputData["RENUENTE"] = input["renuente"];
          }
        }
        
        if(input["status_inspec"] == 'inspeccion') {
          //Lugar de inspeccion
          inputData["INTRA_INSPECCION"] = input["lugar_inspeccion_intra"] ? 1 : 0;
          inputData["PERI_INSPECCION"] = input["lugar_inspeccion_peri"] ? 1 : 0;
          
          //Chiris en intra o peri
          inputData["INTRA_CHIRIS"] = input["chiris_intra"] ? 1 : 0;
          inputData["PERI_CHIRIS"] = input["chiris_peri"] ? 1 : 0;
          
          //Rastros en intra o peri
          inputData["INTRA_RASTROS"] = input["rastros_intra"] ? 1 : 0;
          inputData["PERI_RASTROS"] = input["rastros_peri"] ? 1 : 0;
          
          //Personas predio
          inputData["PERSONAS_PREDIO"] = input["personas_predio:shiny.number"];
          
          inputData["CANT_PERROS"] = 0;
          inputData["CANT_GATOS"] = 0;
          inputData["CANT_AVES_CORRAL"] = 0;
          inputData["CANT_CUYES"] = 0;
          inputData["CANT_CONEJOS"] = 0;
          inputData["TEXT_OTROS"] = 0;
          inputData["CANT_OTROS"] = 0;
          
          if (input["perros"]) {
            inputData["CANT_PERROS"] = input["cant_perros:shiny.number"];
          }
          if (input["gatos"]) {
            inputData["CANT_GATOS"] = input["cant_gatos:shiny.number"];
          }
          if (input["aves_corral"]) {
            inputData["CANT_AVES_CORRAL"] = input["cant_aves_corral:shiny.number"];
          }
          if (input["cuyes"]) {
            inputData["CANT_CUYES"] = input["cant_cuyes:shiny.number"];
          }
          if (input["conejos"]) {
            inputData["CANT_CONEJOS"] = input["cant_conejos:shiny.number"];
          }
          if (input["otros"]) {
            inputData["TEXT_OTROS"] = input["text_otros"];
            inputData["CANT_OTROS"] = input["cant_otros:shiny.number"];
          }
        }
      }
      return inputData;
    }
  }, {
    key: 'cleanData',
    value: function cleanData() {
      var input = this.shiny.$inputValues;
      this.date_start = this.get_date();
      
      this.shiny.dispatchMessage('{"inputMessages":[{"id":"P","message":{"value":"1"}}]}');
      this.shiny.dispatchMessage('{"inputMessages":[{"id":"D","message":{"value":""}}]}');
      this.shiny.dispatchMessage('{"inputMessages":[{"id":"L","message":{"value":""}}]}');
      this.shiny.dispatchMessage('{"inputMessages":[{"id":"V","message":{"value":""}}]}');
      this.shiny.dispatchMessage('{"inputMessages":[{"id":"observaciones","message":{"value":false}}]}');
      this.shiny.dispatchMessage('{"inputMessages":[{"id":"obs_unicode","message":{"value":"1"}}]}');
      this.shiny.dispatchMessage('{"inputMessages":[{"id":"obs_text1","message":{"value":""}}]}');
      this.shiny.dispatchMessage('{"inputMessages":[{"id":"obs_text2","message":{"value":""}}]}');
      this.shiny.dispatchMessage('{"inputMessages":[{"id":"fecha","message":{"value":"'+input["fecha:shiny.date"]+'"}}]}');
      this.shiny.dispatchMessage('{"inputMessages":[{"id":"caract_predio","message":{"value":"casa_regular"}}]}');
      this.shiny.dispatchMessage('{"inputMessages":[{"id":"tipo_lp","message":{"value":""}}]}');
      this.shiny.dispatchMessage('{"inputMessages":[{"id":"status_inspec","message":{"value":"C"}}]}');
      this.shiny.dispatchMessage('{"inputMessages":[{"id":"entrevista","message":{"value":"cree_no_tiene"}}]}');
      this.shiny.dispatchMessage('{"inputMessages":[{"id":"motivo_volver","message":{"value":""}}]}');
      this.shiny.dispatchMessage('{"inputMessages":[{"id":"renuente_otro","message":{"value":""}}]}');
      this.shiny.dispatchMessage('{"inputMessages":[{"id":"lugar_inspeccion_intra","message":{"value":false}}]}');
      this.shiny.dispatchMessage('{"inputMessages":[{"id":"lugar_inspeccion_peri","message":{"value":false}}]}');
      this.shiny.dispatchMessage('{"inputMessages":[{"id":"chiris_intra","message":{"value":false}}]}');
      this.shiny.dispatchMessage('{"inputMessages":[{"id":"chiris_peri","message":{"value":false}}]}');
      this.shiny.dispatchMessage('{"inputMessages":[{"id":"rastros_intra","message":{"value":false}}]}');
      this.shiny.dispatchMessage('{"inputMessages":[{"id":"rastros_peri","message":{"value":false}}]}');
      this.shiny.dispatchMessage('{"inputMessages":[{"id":"personas_predio","message":{"value":1}}]}');
      this.shiny.dispatchMessage('{"inputMessages":[{"id":"perros","message":{"value":false}}]}');
      this.shiny.dispatchMessage('{"inputMessages":[{"id":"gatos","message":{"value":false}}]}');
      this.shiny.dispatchMessage('{"inputMessages":[{"id":"aves_corral","message":{"value":false}}]}');
      this.shiny.dispatchMessage('{"inputMessages":[{"id":"cuyes","message":{"value":false}}]}');
      this.shiny.dispatchMessage('{"inputMessages":[{"id":"conejos","message":{"value":false}}]}');
      this.shiny.dispatchMessage('{"inputMessages":[{"id":"otros","message":{"value":false}}]}');
      
      //Esto es para que el ingreso de datos sea mas rapido.
      this.shiny.dispatchMessage('{"inputMessages":[{"id":"cant_perros","message":{"value":1}}]}')
      this.shiny.dispatchMessage('{"inputMessages":[{"id":"cant_gatos","message":{"value":1}}]}');
      this.shiny.dispatchMessage('{"inputMessages":[{"id":"cant_aves_corral","message":{"value":1}}]}');
      this.shiny.dispatchMessage('{"inputMessages":[{"id":"cant_cuyes","message":{"value":1}}]}');
      this.shiny.dispatchMessage('{"inputMessages":[{"id":"cant_conejos","message":{"value":1}}]}');
      this.shiny.dispatchMessage('{"inputMessages":[{"id":"text_otros","message":{"value":""}}]}');
      this.shiny.dispatchMessage('{"inputMessages":[{"id":"cant_otros","message":{"value":1}}]}');
    }
  }, {
    key: 'Report',
    value: function Report(date) {}
  }, {
    key: 'btn_filter',
    value: function btn_filter() {}
  }, {
    key: 'logout',
    value: function logout() {
      this.shiny.dispatchMessage('{"inputMessages":[{"id":"username","message":{"value":""}}]}');
      this.shiny.dispatchMessage('{"inputMessages":[{"id":"password","message":{"value":""}}]}');
      
      this.cleanData();
      
      this.map_manager.clearAll();
      /*this.map_loaded = false;
      this.map_manager.loaded = false;*/
      
      var output = {};
      output.houseId = "";
      output.userMessage = "";
      output.validUser = "";
      output.networkCheck = "";
      
      this.dispatchOutput(output);
    }
  }, {
    key: 'pathAB',
    value: function pathAB() {
      this.map_manager.add_route();
    }
  }, {
    key: 'hide_pathAB',
    value: function hide_pathAB() {
      this.map_manager.remove_route_control();
    }
  }, {
    key: 'pathA',
    value: function pathA(options = null) {
      var depth = this.depth;
      var remove_origin = false;
      var route = [];
      var min_route = [];
      var min_cost = 1000000000;
      var all_routes = [];
      var unicode = this.sessionData.houseId;
      if (options != null) {
        unicode = options.origin;
        depth = options.depth;
        remove_origin = options.remove_origin;
      }
      var houses = this.not_inspected;
      var pos = this.which2(houses,'id',unicode);
      if (unicode == null || unicode == "" || pos == -1)
        return;
      
      var origin = houses[pos];
      origin.cost = 0;
      origin.unvisited = this.obj_to_array(origin.neighbours);
      route.push(origin);
      var cost = 0;
      while (true) {
        if (route.length == 0)
          break;
        var i = route.length - 1;
        var current = route[i];
        if (i < depth) {
          if (current.unvisited.length == 0 || current.cost > min_cost) {
            var item = route.pop();
            item.cost = 0;
            item.unvisited = [];
            continue;
          }
          var next = current.unvisited.pop();
          if (this.route_contains(route,next)) {
            continue;
          } else {
            next.cost = current.cost + current.neighbours[next.id].distance;
            next.unvisited = this.obj_to_array(next.neighbours);
            route.push(next);
          }
        } else {
          if (current.cost < min_cost) {
            min_cost = current.cost;
            min_route = this.clone_route(route);
          }
          var item = route.pop();
          item.cost = 0;
          item.unvisited = [];
        }
      }
      if (remove_origin)
        min_route.shift();
      this.min_route = min_route;
      this.map_manager.coords = [];
      for (var i = 0; i < min_route.length; i++)
        this.map_manager.add_coord(min_route[i]);
      this.map_manager.add_route();
      this.map_manager.add_polyline(min_route);
    }
  }, {
    key: 'hide_pathA',
    value: function hide_pathA() {
      this.map_manager.remove_polyline();
      this.map_manager.remove_route_control();
      this.min_route = [];
    }
  }, {
    key: 'update_min_route',
    value: function update_min_route(inputData) {
      this.min_route.shift();
      if (inputData.STATUS_INSPECCION != "inspeccion") {
        var options = {};
        options.origin = inputData.UNI_CODE;
        options.depth  = this.min_route.length + 1;
        options.remove_origin = true;
        this.hide_pathA();
        this.pathA(options);
      }
      var pos = this.which2(this.not_inspected,"id",inputData.UNI_CODE);
      this.not_inspected.splice(pos,1);
      this.compute_knn_graph(true);
    }
  }, {
    key: 'add_coord',
    value: function add_coord(click) {
      this.map_manager.add_coord(click);
    }
  }, {
    key:  'compute_knn_graph',
    value: function compute_knn_graph(update=false) {
      if (!update) {
        for (var i = 0; i < this.sessionData.searchdata.length; i++) {
          if (this.inspected_unicode[this.sessionData.searchdata[i].UNICODE] == null) {
            this.not_inspected.push({
              id: this.sessionData.searchdata[i].UNICODE,
              lat: this.sessionData.searchdata[i].LATITUDE,
              lng: this.sessionData.searchdata[i].LONGITUDE,
              cost: 0,
              risk: this.sessionData.searchdata[i].probability,
              unvisited: [],
              neighbours: {}
            });
          }
        }
      }
      var lookup = sphereKnn(this.not_inspected);
      var k = this.k;
      for (var i = 0; i < this.not_inspected.length; i++) {
        var knn = lookup(this.not_inspected[i].lat,this.not_inspected[i].lng,k);
        for (var j = 0; j < knn.length; j++) {
          if (knn[j].id != this.not_inspected[i].id) {
            this.not_inspected[i].neighbours[knn[j].id] = {
              house: knn[j],
              distance: this.coords_distance2(this.not_inspected[i],knn[j])
            };
          }
        }
      }
    }
  }, {
    key: 'coords_distance2',
    value: function coords_distance2(item0,item1) {
      var dist = this.coords_distance(item0,item1);
      var riskLevel = this.which(this.sessionData.riskColors, this.sessionData.palForRisk(item1.risk));
      dist = dist + this.risk_bias*(1/(riskLevel+1));
      return dist;
    }
  }, {
    key: 'coords_distance',
    value: function coords_distance(item0, item1) {
      var lat1 = item0.lat;
      var lon1 = item0.lng;
      var lat2 = item1.lat;
      var lon2 = item1.lng;
      var unit = 'K';
      if ((lat1 == lat2) && (lon1 == lon2)) {
    		return 0;
    	}
    	else {
    		var radlat1 = Math.PI * lat1/180;
    		var radlat2 = Math.PI * lat2/180;
    		var theta = lon1-lon2;
    		var radtheta = Math.PI * theta/180;
    		var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
    		if (dist > 1) {
    			dist = 1;
    		}
    		dist = Math.acos(dist);
    		dist = dist * 180/Math.PI;
    		dist = dist * 60 * 1.1515;
    		if (unit=="K") { dist = dist * 1.609344 }
    		if (unit=="N") { dist = dist * 0.8684 }
    		return dist;
    	}
    }
  }, {
    key: 'route_contains',
    value: function route_contains(route, item) {
      var contains = false;
      for (var i = 0; i < route.length; i++) {
        if (route[i].id == item.id) {
          contains = true;
          break;
        }
      }
      return contains;
    }
  }, {
    key: 'obj_to_array',
    value: function obj_to_array(obj) {
      var result = [];
      for (var key in obj)
        result.push(obj[key].house);
      return result;
    }
  }, {
    key: 'clone_route',
    value: function clone_route(route) {
      var result = [];
      for (var i = 0; i < route.length; i++)
        result.push(route[i]);
      return result;
    }
  }, {
    key: 'removeLast',
    value: function removeLast() {
      var items = this.getUpdates();
      var item = items.pop();
      this.lsmethods.saveStore();
      return item;
    }
  }, {
    key: 'renderDataTable',
    value: function renderDataTable(data, options) {}
  }, {
    key: 'outputOptions',
    value: function outputOptions() {}
  }, {
    key: 'dispatchOutput',
    value: function dispatchOutput(_output) {
      var output = {};
      output.values = _output;
      this.shiny.dispatchMessage(JSON.stringify(output));
    }
  }, {
    key: 'hasUpdates',
    value: function hasUpdates() {
      return this.updated;
    }
  }, {
    key: 'addLoadMsg',
    value: function addLoadMsg(msg) {
      this.lsmethods.addLoadMsg(msg);
    }
  }, {
    key: 'autologinUser',
    value: function autologinUser(callback) {
      this.lsmethods.autologin(callback);
    }
  }, {
    key: 'fillDatabase',
    value: function fillDatabase(user, data,callback) {
      this.lsmethods.add_user_data(user, data, callback);
      this.lsmethods.add_autologin(user);
    }
  }, {
    key: 'emptyDatabase',
    value: function emptyDatabase() {
      this.lsmethods.deleteStore();
      this.updated = false;
    }
  }, {
    key: 'getUpdates',
    value: function getUpdates() {
      var result = this.lsmethods.user.new_data;
      return result;
    }
  }, {
    key: 'dropUpdates',
    value: function dropUpdates() {
      this.updated = false;
      var result = this.getUpdates();
      this.lsmethods.user.new_data = [];
      this.lsmethods.user.past_new_data = result;
      this.lsmethods.saveStore();
    }
  }, {
    key: 'mean',
    value: function mean(data,select) {
      var n = data.length;
      var total = 0;
      for (var i=0; i < data.length; i++) {
        if (isNaN(data[i][select]))
          n = n - 1;
        else
          total = total + data[i][select];
      }
      return total/n;
    }
  }, {
    key: 'which',
    value: function which(data,filter) {
      var result = 0;
      for (var i = 0; i < data.length; i++) {
        if(filter == data[i]) {
          result = i;
          break;
        }
      }
      return result;
    }
  }, {
    key: 'which2',
    value: function which2(data,key,filter) {
      var result = -1;
      for (var i = 0; i < data.length; i++) {
        if(filter == data[i][key]) {
          result = i;
          break;
        }
      }
      return result;
    }
  }, {
    key: 'get_date',
    value: function get_date() {
      var today = new Date()
      var date = today.toLocaleDateString("es-ES").split('/');
      var time = today.toLocaleTimeString("es-ES").substr(0,8)
      return date[2]+"-"+date[1]+"-"+date[0]+" "+time;
    }
  }, {
    key: 'add_column',
    value: function add_column(data, name, fun) {
      for (var i = 0; i < data.length; i++) {
        data[i][name] = fun(data[i]);
      }
    }
  }, {
    key: 'find_and_replace',
    value: function find_and_replace(data, field, value, field2, replace) {
      for (var i = 0; i < data.length; i++) {
        if (data[i][field] == value) {
          if (typeof replace == "function")
            data[i][field2] = replace(data[i][field2]);
          else
            data[i][field2] = replace;
        }
      }
    }
  }, {
    key: 'find_and_replace2',
    value: function find_and_replace2(data, field, replace) {
      for (var i = 0; i < data.length; i++) {
        if (typeof replace == "function")
          data[i][field] = replace(data[i][field]);
        else
          data[i][field] = replace;
      }
    }
  }, {
    key: 'merge',
    value: function merge(data0, data1, field) {
      var result = [];
      for (var i = 0; i < data0.length; i++) {
        for (var j = 0; j < data1.length; j++) {
          if (data0[i][field] == data1[j][field]) {
            var obj = {};
            for (var key in data0[i])
              obj[key] = data0[i][key];
            for (var key in data1[j]) {
              if (key != field)
                obj[key] = data1[j][key];
            }
            result.push(obj);
            break;
          }
        }
      }
      return result;
    }
  }, {
    key: 'filter_by_column',
    value: function filter_by_column(data,filter={},select=null) {
      var result = [];
      for (var i = 0; i < data.length; i++) {
        var to_add = true;
        for (var key in filter) {
          if(data[i][key] == null || data[i][key] != filter[key])
            to_add = false;
        }
        if(to_add) {
          if(select==null) {
            select = [];
            for (var key2 in data[0])
              select.push(key2);
          }
          if (typeof select == "string") {
            result.push(data[i][select]);
          } else {
            var obj = {};
            for (var j = 0; j < select.length; j++) {
              obj[select[j]] = data[i][select[j]];
            }
            result.push(obj);
          }
        }
      }
      return result;
    }
  }, {
    key: 'filter_by_column2',
    value: function filter_by_column2(data,filter={},select=null) {
      var result = [];
      for (var i = 0; i < data.length; i++) {
        var to_add = true;
        if (!filter.filter(data[i]))
          to_add = false;
        if(to_add) {
          if(select==null) {
            select = [];
            for (var key2 in data[0])
              select.push(key2);
          }
          if (typeof select == "string") {
            result.push(data[i][select]);
          } else {
            var obj = {};
            for (var j = 0; j < select.length; j++) {
              obj[select[j]] = data[i][select[j]];
            }
            result.push(obj);
          }
        }
      }
      return result;
    }
  }, {
    //Agregando "Salir"
    key: 'quit',
    value: function quit() {
      var self = this;
      this.shiny.dispatchMessage('{"custom":{"action-message":"buscando_true"}}');
      shinyShadow.onSync(function (closing) {
        if (closing)
          self.logout();
        self.shiny.dispatchMessage('{"custom":{"action-message":"buscando_false"}}');
      });
      //this.shiny.dispatchMessage('{"custom":{"validation-message":"Hola que mas da."}}');
    }
  }, {
    key: 'post_mordeduras',
    value: function post_mordeduras() {
      var self = this;
      localforage.getItem("mordedura_x_posta").then(function(item) {
        if (item == null)
          return;
        localforage.getItem("postas").then(function(item2) {
          if (item2 == null)
            return;
          self.postas = item2;
          var min = 100000;
          var idx = 0;
          var min_idx = -1;
          var results = {postaCercana:[],postaCercanaDist:[]};
          for (var i = 0; i < item.length; i++) {
            for (var j = 0; j < item[i].length; j++) {
              for (var k = 0; k < item[i][j].distances[0].length-1; k++) {
                if (item[i][j].distances[0][k] != null && item[i][j].distances[0][k] < min) {
                  min = item[i][j].distances[0][k];
                  min_idx = idx;
                }
                idx++;
              }
            }
            if (min_idx == -1) {
              results.postaCercana.push("NA");
              results.postaCercanaDist.push(0);
            } else {
              results.postaCercana.push(self.postas[min_idx].ident);
              results.postaCercanaDist.push(min);
            }
            idx = 0;
            min_idx  = -1;
            min = 100000;
          }
          shinyShadow.post("mordedura",results,function(resp){
            console.log(resp);
          });
        });
      });
      
    }
  }, {
    //Agregando mordedura x posta temporalmente
    key: 'mordedura_x_posta',
    value: function mordedura_x_posta(wait_time) {
      var self = this;
      this.mapboxClient = mapboxSdk({ accessToken: "pk.eyJ1IjoiZGVuZWRpIiwiYSI6ImNqb2s5ZXFtMjBkNDkza252N2VvbDNtOHUifQ.Z81jNHBxcdnhhA35RxbxvA" });
      
      shinyShadow.get('mordedura', "data", function(response) {
          if (response.status == "success") {
            var mordeduras = response.mordeduras;
            var postas = response.postas;
            self.mordeduras = mordeduras;
            self.postas = postas;
            localforage.setItem("mordeduras",mordeduras);
            localforage.setItem("postas",postas);
            
            var j = -1;
            var p_points = [];
            for (var i = 0; i < postas.length; i++) {
              if (i%20 == 0) {
                j++;
                p_points.push([]);
              }
              p_points[j].push({coordinates:[postas[i].long,postas[i].lat]});
            }
            
            var results = [];
            self.wait = false;
            var get_matrix = function(i,j) {
              p_points[j].push({coordinates:[mordeduras[i].LONGITUDE,mordeduras[i].LATITUDE]});
              self.mapboxClient.matrix.getMatrix({
                points: p_points[j],
                annotations: ['duration','distance'],
                profile: 'walking',
                sources: [p_points[j].length-1],
                destinations: 'all'
              }).send().then(function(resp) {
                if (resp.body.code == "Ok") {
                  results[i][j] = resp.body;
                } else {
                  self.wait = true;
                  console.log(i+" "+j);
                  console.log(resp);
                }
              });
              p_points[j].pop();
            };
            
            var fun = function(i,j) {
              var time = wait_time;
              if (self.wait) {
                self.wait = false;
                time = 60000;
              }
              setTimeout(function() {
                bar(i,j);
              }, time);
            };
            
            var bar = function(i,j) {
              if (i < mordeduras.length) {
                if (j < p_points.length) {
                  results[i].push([]);
                  get_matrix(i,j);
                  fun(i,j+1);
                } else {
                  results.push([]);
                  console.log(i);
                  fun(i+1,0);
                }
              } else {
                results.pop();
                localforage.setItem("mordedura_x_posta",results);
                console.log("end");
              }
            };
            
            results.push([]);
            bar(0,0);
          }
        });
    }
  }, {
    //Agregando mordedura x posta temporalmente
    key: 'mordedura_x_posta2',
    value: function mordedura_x_posta2() {
      var self = this;
      
      shinyShadow.get('mordedura', "data", function(response) {
          if (response.status == "success") {
            var mordeduras = response.mordeduras;
            var postas = response.postas;
            
            var j = -1;
            var p_points = [];
            for (var i = 0; i < postas.length; i++) {
              p_points.push({lat:postas[i].lat,lng:postas[i].long,id:postas[i].ident});
            }
            var lookup = sphereKnn(p_points);
            var results = {postaCercana:[],postaCercanaDist:[]};
            for (var i = 0; i < mordeduras.length; i++) {
              var knn = lookup(mordeduras[i].LATITUDE,mordeduras[i].LONGITUDE,2);
              results.postaCercana.push(knn[0].id);
              results.postaCercanaDist.push(1000*self.coords_distance(
                {lat:mordeduras[i].LATITUDE,lng:mordeduras[i].LONGITUDE},
                {lat:knn[0].lat,lng:knn[0].lng}
              ));
            }
            shinyShadow.post("mordedura",results,function(resp){
              console.log(resp);
            });
          }
        });
    }
  }]);

  return Petm;
}();

var MapManager = function () {
  function MapManager() {
    _classCallCheck(this, MapManager);

    this.loaded = false;
    this.allow_tiles_load = false;
    this.tiles_saved = false;
    this.has_offline_layer = false;
    this.myRenderer = null;
    this.polyline = null;
    this.polyline_marker = null;
    
    this.end_callback = null;
    this.route_control = null;
    this.route_callback = null;
    this.coords = [];
    var self2 = this;
    this.tilesDb = {
      getItem: function getItem(key) {
        return localforage.getItem(key);
      },

      saveTiles: function saveTiles(tileUrls) {
        var self = this;
        var promises = [];
        console.log(tileUrls.length);
        for (var i = 0; i < tileUrls.length; i++) {
          var tileUrl = tileUrls[i];
          (function (i, tileUrl, last) {
            promises[i] = new Promise(function (resolve, reject) {
              var request = new XMLHttpRequest();
              request.open('GET', tileUrl.url, true);
              request.responseType = 'blob';
              request.onreadystatechange = function () {
                if (request.readyState === XMLHttpRequest.DONE) {
                  if (last)
                    self2.endTilesLoad();
                  if (request.status === 200) {
                    resolve(self._saveTile(tileUrl.key, request.response));
                  } else {
                    reject({
                      status: request.status,
                      statusText: request.statusText
                    });
                  }
                }
              };
              request.send();
            });
          })(i, tileUrl,i==tileUrls.length-1);
        }

        return Promise.all(promises);
      },

      clear: function clear() {
        return localforage.clear();
      },

      _saveTile: function _saveTile(key, value) {
        return this._removeItem(key).then(function () {
          return localforage.setItem(key, value);
        });
      },

      _removeItem: function _removeItem(key) {
        return localforage.removeItem(key);
      }
    };
  }

  _createClass(MapManager, [{
    key: 'loadMap',
    value: function loadMap(shiny) {
      if (this.loaded) {
        if (shinyShadow.state == 'offline' && !this.has_offline_layer) {
          this.addLeafletOffline(themap);
          this.has_offline_layer = true;
        }
        return;
      }
        
      this.shiny = shiny;
      var el = document.getElementById("map");
      themap = $(el).data("leaflet-map");
      /*if (themap != null) {
        themap.remove();
        themap = null;
      }*/
      if (themap == null) {
        shinyShadow.shiny.dispatchMessage('{"errors":[],"values":{"map":{"x":{"options":{"maxZoom":19,"preferCanvas":true,"customMap":true,"crs":{"crsClass":"L.CRS.EPSG3857","code":null,"proj4def":null,"projectedBounds":null,"options":{}}},"calls":[{"method":"addTiles","args":["//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",null,null,{"minZoom":0,"maxZoom":19,"tileSize":256,"subdomains":"abc","crossOrigin":true,"errorTileUrl":"","tms":false,"noWrap":false,"zoomOffset":0,"zoomReverse":false,"opacity":1,"zIndex":1,"detectRetina":false,"attribution":"&copy; OpenStreetMap contributors, CC-BY-SA"}]}],"setView":[[-16.39249883,-71.55001667],16,[]]},"evals":[],"jsHooks":[],"deps":[]},"inspectButton":null},"inputMessages":[]}');
        themap = $(el).data("leaflet-map");
      } else {
        /*shinyShadow.shiny.dispatchMessage('{"custom":{"leaflet-calls":{"id":"map","calls":[{"dependencies":[],"method":"addTiles","args":["//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",null,null,{"minZoom":0,"maxZoom":19,"tileSize":256,"subdomains":"abc","crossOrigin":true,"errorTileUrl":"","tms":false,"noWrap":false,"zoomOffset":0,"zoomReverse":false,"opacity":1,"zIndex":1,"detectRetina":false,"attribution":"&copy; <a href=\'http://openstreetmap.org\'>OpenStreetMap<\/a> contributors, <a href=\'http://creativecommons.org/licenses/by-sa/2.0/\'>CC-BY-SA<\/a>"}]}]}}}');*/
      }
      this.loaded = true;
      var self = this;
      themap.setMaxZoom(19);
      if (shinyShadow.state == 'offline' && !this.has_offline_layer) {
        setTimeout(function() {
          self.addLeafletOffline(themap);
          self.has_offline_layer = true;
          themap.setView([shinyShadow.server_offline.lat,shinyShadow.server_offline.lng],16);
          
        }, 100);
      } else {
        this.setView(shinyShadow.server_offline.lat,shinyShadow.server_offline.lng,16);
      }
    }
  }, {
    key: 'add_legend',
    value: function add_legend(data) {
      this.shiny.dispatchMessage('{"custom":{"leaflet-calls":{"id":"map","calls":[{"dependencies":[],"method":"addLegend","args":[{"colors":["#FFFFB2","#FECC5C","#FD8D3C","#F03B20","#BD0026"],"labels":["Mas Bajo","Bajo","Medio","Alto","Mas Alto"],"na_color":null,"na_label":"NA","opacity":1,"position":"bottomleft","type":"unknown","title":"Riesgo de Infestacion","extra":null,"layerId":null,"className":"info legend","group":null}]}]}}}');
    }
  }, {
    key: 'clearMarkers',
    value: function clearMarkers() {
      this.shiny.dispatchMessage('{"custom":{"leaflet-calls":{"id":"map","calls":[{"dependencies":[],"method":"clearMarkers","args":[]}]}}}');
    }
  }, {
    key: 'clearPolygons',
    value: function clearPolygons() {
      this.shiny.dispatchMessage('{"custom":{"leaflet-calls":{"id":"map","calls":[{"dependencies":[],"method":"clearShapes","args":[]}]}}}');
    }
  }, {
    key: 'clearAll',
    value: function clearAll() {
      this.shiny.dispatchMessage('{"custom":{"leaflet-calls":{"id":"map","calls":[{"dependencies":[],"method":"clearShapes","args":[]}]}}}');
      this.shiny.dispatchMessage('{"custom":{"leaflet-calls":{"id":"map","calls":[{"dependencies":[],"method":"clearMarkers","args":[]}]}}}');
      this.shiny.dispatchMessage('{"custom":{"leaflet-calls":{"id":"map","calls":[{"dependencies":[],"method":"clearControls","args":[]}]}}}');
    }
  }, {
    key: 'setView',
    value: function setView(lat,lng,zoom) {
      this.shiny.dispatchMessage('{"custom":{"leaflet-calls":{"id":"map","calls":[{"dependencies":[],"method":"setView","args":[['+lat+','+lng+'],'+zoom+',[]]}]}}}');
    }
  }, {
    key: 'add_polygons',
    value: function add_polygons(data,options) {
      var data2 = [];
      for (var i = 0; i < data.length; i++)
        data2.push(options(data[i]));
      for (var i = 0; i < data2.length; i++) {
        var item = data2[i];
        var msg = '{"custom":{"leaflet-calls":{"id":"map","calls":[{"dependencies":[],"method":"addPolygons","args":[[[[{"lng":['+item.lng+'],"lat":['+item.lat+']}]]],null,null,{"interactive":true,"className":"","stroke":true,"color":"#03F","weight":'+item.weight+',"opacity":0.5,"fill":'+item.fill+',"fillColor":"'+item.fillColor+'","fillOpacity":0.2,"smoothFactor":1,"noClip":false},null,null,"'+item.label+'",{"interactive":false,"permanent":false,"direction":"auto","opacity":1,"offset":[0,0],"textsize":"'+item.labelOptions.textsize+'","textOnly":false,"className":"","sticky":true},{"color":"'+item.highlightOptions.color+'","weight":'+item.highlightOptions.weight+',"fill":'+item.highlightOptions.fill+',"fillColor":"'+item.highlightOptions.fillColor+'","fillOpacity":'+item.highlightOptions.fillOpacity+',"bringToFront":'+item.highlightOptions.bringToFront+'}]}]}}}';
        this.shiny.dispatchMessage(msg);
      }
    }
  }, {
    key: 'add_circle_markers',
    value: function add_circle_markers(data,options) {
      var item = {};
      if (data.length > 0) {
        item = options(data[0]);
        item.color = "\"" + item.color + "\"";
      }
      for (var i = 1; i < data.length; i++) {
        var item2 =  options(data[i]);
        item.lat = item.lat + ',' + item2.lat;
        item.lng = item.lng + ',' + item2.lng;
        item.color = item.color + ',' + "\"" + item2.color + "\"";
      }
      var msg = "{\"custom\":{\"leaflet-calls\":{\"id\":\"map\",\"calls\":[{\"dependencies\":[],\"method\":\"addCircleMarkers\",\"args\":[["+item.lat+"],["+item.lng+"],"+item.radius+",null,null,{\"interactive\":true,\"className\":\"\",\"stroke\":"+item.stroke+",\"color\":["+item.color+"],\"weight\":5,\"opacity\":0.5,\"fill\":true,\"fillColor\":["+item.color+"],\"fillOpacity\":"+item.fillOpacity+"},null,null,null,null,null,{\"interactive\":false,\"permanent\":false,\"direction\":\"auto\",\"opacity\":1,\"offset\":[0,0],\"textsize\":\"10px\",\"textOnly\":false,\"className\":\"\",\"sticky\":true},null]}]}}}";
      this.shiny.dispatchMessage(msg);
    }
  }, {
    key: 'add_circle_markers2',
    value: function add_circle_markers2(data,options) {
      var item = {};
      if (data.length > 0) {
        item = options(data[0]);
        item.fillColor = "\"" + item.fillColor + "\"";
        item.layerId = "\"" + item.layerId + "\"";
        item.popup = "\"" + item.popup + "\"";
      }
      for (var i = 1; i < data.length; i++) {
        var item2 =  options(data[i]);
        item.lat = item.lat + ',' + item2.lat;
        item.lng = item.lng + ',' + item2.lng;
        item.fillColor = item.fillColor + ',' + "\"" + item2.fillColor + "\"";
        item.layerId = item.layerId + ',' + "\"" + item2.layerId + "\"";
        item.popup = item.popup + ',' + "\"" + item2.popup + "\"";
      }
      var msg = "{\"custom\":{\"leaflet-calls\":{\"id\":\"map\",\"calls\":[{\"dependencies\":[],\"method\":\"addCircleMarkers\",\"args\":[["+item.lat+"],["+item.lng+"],"+item.radius+",["+item.layerId+"],null,{\"interactive\":true,\"className\":\"\",\"stroke\":"+item.stroke+",\"color\":\""+item.color+"\",\"weight\":"+item.weight+",\"opacity\":0.5,\"fill\":true,\"fillColor\":["+item.fillColor+"],\"fillOpacity\":"+item.fillOpacity+"},null,null,["+item.popup+"],null,null,{\"interactive\":false,\"permanent\":false,\"direction\":\"auto\",\"opacity\":1,\"offset\":[0,0],\"textsize\":\"10px\",\"textOnly\":false,\"className\":\"\",\"sticky\":true},null]}]}}}";
      this.shiny.dispatchMessage(msg);
    }
  }, {
    key: 'add_polyline',
    value: function add_polyline(points) {
      if (points.length == 1) {
        this.polyline_marker = L.marker(this.coords[0].pos, {
					    draggable: false
            }).addTo(themap).bindPopup(this.coords[0].id).openPopup();
        return;
      }
      this.polyline = new L.Polyline(points, {
        color: 'blue',
        weight: 3,
        opacity: 0.5,
        smoothFactor: 1
      });
      this.polyline.addTo(themap);
    }
  }, {
    key: 'remove_polyline',
    value: function remove_polyline() {
      if (this.polyline_marker != null) {
        this.polyline_marker.remove();
        this.polyline_marker = null;
      }
      this.polyline.remove();
      this.polyline = null;
    }
  }, {
    key: 'startTilesLoad',
    value: function startTilesLoad(lat, lng, callback) {
      var self = this;
      localforage.getItem("tiles_core").then(function(item) {
        if (item != null) {
          var dist = shinyShadow.server_offline.coords_distance(item,{lat:lat,lng:lng});
          if (dist > 0.01) {
            if (self.has_offline_layer && !self.tiles_saved && navigator.onLine) {
              self.end_callback = callback;
              self.setView(lat, lng, 16);
              self.allow_tiles_load = true;
              $(".save-tiles-button")[0].click();
            } else {
              callback();
            }
          } else {
            callback();
          }
        } else {
          if (self.has_offline_layer && !self.tiles_saved && navigator.onLine) {
            self.end_callback = callback;
            self.setView(lat, lng, 16);
            self.allow_tiles_load = true;
            $(".save-tiles-button")[0].click();
          } else {
            callback();
          }
        }
      });
    }
  }, {
    key: 'endTilesLoad',
    value: function endTilesLoad() {
      this.tiles_saved = true;
      localforage.setItem("tiles_core",{
        lat: shinyShadow.server_offline.lat,
        lng: shinyShadow.server_offline.lng
      });
      if (this.end_callback != null)
        this.end_callback();
    }
  }, {
    key: 'add_route_control',
    value: function add_route_control() {
      if (themap != null) {
        var self = this;
        this.route_control = L.Routing.control({
          autoRoute: false,
          routeWhileDragging: false,
          router: L.Routing.mapbox('pk.eyJ1IjoiZGVuZWRpIiwiYSI6ImNqb2s5ZXFtMjBkNDkza252N2VvbDNtOHUifQ.Z81jNHBxcdnhhA35RxbxvA' , {}),
          createMarker: function(i, dStart, n){
            if (i>0 && i<n-1)
              return null;
            return L.marker(dStart.latLng, {
					    draggable: false
            }).bindPopup(self.coords[i].id).openPopup();
	        }
        }).on('routesfound', function(e) {
          setTimeout(function() {
            if (self.route_callback != null)
              self.route_callback();
          }, 0);
        });
        self.route_control.addTo(themap);
        
      }
    }
  }, {
    key: 'add_route',
    value: function add_route(points=null) {
      if (this.route_control == null)
        this.add_route_control();
      Shiny.shinyapp.dispatchMessage('{"custom":{"action-message":"buscando_true"}}');
      this.route_callback = function() {
        this.coords = [];
        Shiny.shinyapp.dispatchMessage('{"custom":{"action-message":"buscando_false"}}');
      }
      var way_points = [];
      if (this.coords.length >= 2) { 
        for (var i = 0; i < this.coords.length; i++)
          way_points.push(this.coords[i].pos);
      } else {
        this.route_callback();
        return;
      }
      this.route_control.setWaypoints(way_points);
      this.route_control.getRouter().options.profile = "mapbox/walking";
      this.route_control.route();
      $(".leaflet-routing-container").hide();
    }
  }, {
    key: 'remove_route_control',
    value: function remove_route_control() {
      if (this.route_control == null || themap  == null)
        return;
      this.coords = [];
      this.route_control.remove();
      this.route_control = null;
    }
  }, {
    key: 'add_coord',
    value: function add_coord(click) {
      var obj = {
        pos: L.latLng(click.lat,click.lng),
        id: click.id
      };
      this.coords.push(obj);
    }
  }, {
    key: 'addLeafletOffline',
    value: function addLeafletOffline(map) {
      var offlineLayer = L.tileLayer.offline('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', this.tilesDb, {
        attribution: '&copy; OpenStreetMap',
        subdomains: 'abc',
        minZoom: 13,
        maxZoom: 19,
        crossOrigin: true
      });
      
      var self = this;
      var offlineControl = L.control.offline(offlineLayer, this.tilesDb, {
        saveButtonHtml: '<i class="fa fa-download" aria-hidden="true"></i>',
        removeButtonHtml: '<i class="fa fa-trash" aria-hidden="true"></i>',
        confirmSavingCallback: function confirmSavingCallback(nTilesToSave, continueSaveTiles) {
          if (self.allow_tiles_load) {
            continueSaveTiles();
            self.allow_tiles_load = false;
          }
          else {
            self.shiny.dispatchMessage('{"custom":{"action-message":"buscando_true"}}');
            shinyShadow.onSync(function(closing) {
              self.shiny.dispatchMessage('{"custom":{"action-message":"buscando_false"}}');
            });
          }
        },
        confirmRemovalCallback: function confirmRemovalCallback(continueRemoveTiles) {
          if (window.confirm('Eliminar las inspecciones del cache?')) {
            shinyShadow.server_offline.dropUpdates();
            alert("Las inspecciones han sido eliminadas de cache");
            //continueRemoveTiles();
          }
        },
        minZoom: 13,
        maxZoom: 19
      });
      offlineLayer.addTo(map);
      offlineControl.addTo(map);
      $(".leaflet-control-offline").hide();
    }
  }]);

  return MapManager;
}();
