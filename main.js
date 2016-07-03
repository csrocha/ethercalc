// Generated by LiveScript 1.5.0
(function(){
  var join$ = [].join;
  this.include = function(){
    var J, csvParse, DB, SC, KEY, BASEPATH, EXPIRE, HMAC_CACHE, hmac, ref$, Text, Html, Csv, Json, fs, RealBin, DevMode, dataDir, sendFile, newRoom, IO, api, ExportCSVJSON, ExportCSV, ExportHTML, JTypeMap, ExportJ, ExportExcelXML, requestToCommand, requestToSave, i$, len$, route, ref1$, this$ = this;
    this.use('json', this.app.router, this.express['static'](__dirname));
    this.app.use('/edit', this.express['static'](__dirname));
    this.app.use('/view', this.express['static'](__dirname));
    this.app.use('/app', this.express['static'](__dirname));
    this.include('dotcloud');
    this.include('player-broadcast');
    this.include('player-graph');
    this.include('player');
    J = require('j');
    csvParse = require('csv-parse');
    DB = this.include('db');
    SC = this.include('sc');
    KEY = this.KEY;
    BASEPATH = this.BASEPATH;
    EXPIRE = this.EXPIRE;
    HMAC_CACHE = {};
    hmac = !KEY
      ? function(it){
        return it;
      }
      : function(it){
        var encoder;
        return HMAC_CACHE[it] || (HMAC_CACHE[it] = (encoder = require('crypto').createHmac('sha256', new Buffer(KEY)), encoder.update(it.toString()), encoder.digest('hex')));
      };
    ref$ = ['text/plain', 'text/html', 'text/csv', 'application/json'].map((function(it){
      return it + "; charset=utf-8";
    })), Text = ref$[0], Html = ref$[1], Csv = ref$[2], Json = ref$[3];
    fs = require('fs');
    RealBin = require('path').dirname(fs.realpathSync(__filename));
    DevMode = fs.existsSync(RealBin + "/.git");
    dataDir = process.env.OPENSHIFT_DATA_DIR;
    sendFile = function(file){
      return function(){
        this.response.type(Html);
        return this.response.sendfile(RealBin + "/" + file);
      };
    };
    if (this.CORS) {
      console.log("Cross-Origin Resource Sharing (CORS) enabled.");
      this.all('*', function(req, res, next){
        this.response.header('Access-Control-Allow-Origin', '*');
        this.response.header('Access-Control-Allow-Headers', 'X-Requested-With,Content-Type,If-Modified-Since');
        this.response.header('Access-Control-Allow-Methods', 'GET,POST,PUT');
        if ((req != null ? req.method : void 8) === 'OPTIONS') {
          return res.send(204);
        }
        return next();
      });
    }
    newRoom = function(){
      return require('uuid-pure').newId(12, 36).toLowerCase();
    };
    this.get({
      '/': sendFile('index.html')
    });
    this.get({
      '/favicon.ico': function(){
        return this.response.send(404, '');
      }
    });
    this.get({
      '/manifest.appcache': function(){
        this.response.type('text/cache-manifest');
        if (DevMode) {
          return this.response.send(200, "CACHE MANIFEST\n\n#" + Date() + "\n\nNETWORK:\n*\n");
        } else {
          return this.response.sendfile(RealBin + "/manifest.appcache");
        }
      }
    });
    this.get({
      '/static/socialcalc.js': function(){
        this.response.type('application/javascript');
        return this.response.sendfile(RealBin + "/node_modules/socialcalc/SocialCalc.js");
      }
    });
    this.get({
      '/static/form:part.js': function(){
        var part;
        part = this.params.part;
        this.response.type('application/javascript');
        return this.response.sendfile(RealBin + "/form" + part + ".js");
      }
    });
    this.get({
      '/=_new': function(){
        var room;
        room = newRoom();
        return this.response.redirect(KEY
          ? BASEPATH + "/=" + room + "/edit"
          : BASEPATH + "/=" + room);
      }
    });
    this.get({
      '/_new': function(){
        var room;
        room = newRoom();
        return this.response.redirect(KEY
          ? BASEPATH + "/" + room + "/edit"
          : BASEPATH + "/" + room);
      }
    });
    this.get({
      '/_start': sendFile('start.html')
    });
    IO = this.io;
    api = function(cb, cbMultiple){
      return function(){
        var room, this$ = this;
        room = encodeURIComponent(this.params.room).replace(/%3A/g, ':');
        if (/^%3D/.exec(room) && cbMultiple) {
          room = room.slice(3);
          return SC._get(room, IO, function(arg$){
            var snapshot;
            snapshot = arg$.snapshot;
            if (!snapshot) {
              DB.get("snapshot-" + room + ".1", function(_, defaultSnapshot){
                var ref$, type, content;
                if (!defaultSnapshot) {
                  this$.response.type(Text);
                  this$.response.send(404, '');
                  return;
                }
                ref$ = cbMultiple.call(this$.params, ['Sheet1'], [defaultSnapshot]), type = ref$[0], content = ref$[1];
                this$.response.type(type);
                this$.response.set('Content-Disposition', "attachment; filename=\"" + room + ".xlsx\"");
                this$.response.send(200, content);
              });
            }
            return SC[room].exportCSV(function(csv){
              return csvParse(csv, {
                delimiter: ','
              }, function(_, body){
                var todo, names, i$, len$, idx, ref$, link, title;
                body.shift();
                todo = DB.multi();
                names = [];
                for (i$ = 0, len$ = body.length; i$ < len$; ++i$) {
                  idx = i$;
                  ref$ = body[i$], link = ref$[0], title = ref$[1];
                  if (link && title && /^\//.exec(link)) {
                    names = names.concat(title);
                    todo = todo.get("snapshot-" + link.slice(1));
                  }
                }
                return todo.exec(function(_, saves){
                  var ref$, type, content;
                  ref$ = cbMultiple.call(this$.params, names, saves), type = ref$[0], content = ref$[1];
                  this$.response.type(type);
                  this$.response.set('Content-Disposition', "attachment; filename=\"" + room + ".xlsx\"");
                  return this$.response.send(200, content);
                });
              });
            });
          });
        } else {
          return SC._get(room, IO, function(arg$){
            var snapshot, ref$, type, content;
            snapshot = arg$.snapshot;
            if (snapshot) {
              ref$ = cb.call(this$.params, snapshot), type = ref$[0], content = ref$[1];
              if (type === Csv) {
                this$.response.set('Content-Disposition', "attachment; filename=\"" + this$.params.room + ".csv\"");
              }
              if (content instanceof Function) {
                return content(SC[room], function(rv){
                  this$.response.type(type);
                  return this$.response.send(200, rv);
                });
              } else {
                this$.response.type(type);
                return this$.response.send(200, content);
              }
            } else {
              this$.response.type(Text);
              return this$.response.send(404, '');
            }
          });
        }
      };
    };
    ExportCSVJSON = api(function(){
      return [
        Json, function(sc, cb){
          return sc.exportCSV(function(csv){
            return csvParse(csv, {
              delimiter: ','
            }, function(_, body){
              return cb(body);
            });
          });
        }
      ];
    });
    ExportCSV = api(function(){
      return [
        Csv, function(sc, cb){
          return sc.exportCSV(cb);
        }
      ];
    });
    ExportHTML = api(function(){
      return [
        Html, function(sc, cb){
          return sc.exportHTML(cb);
        }
      ];
    });
    JTypeMap = {
      md: 'text/x-markdown',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ods: 'application/vnd.oasis.opendocument.spreadsheet'
    };
    ExportJ = function(type){
      return api(function(it){
        var rv;
        rv = J.utils["to_" + type](J.read(it));
        if ((rv != null ? rv.Sheet1 : void 8) != null) {
          rv = rv.Sheet1;
        }
        return [JTypeMap[type], rv];
      }, function(names, saves){
        var input, i$, len$, idx, save, ref$, harb, Sheet1, rv;
        input = [
          null, {
            SheetNames: names,
            Sheets: {}
          }
        ];
        for (i$ = 0, len$ = saves.length; i$ < len$; ++i$) {
          idx = i$;
          save = saves[i$];
          ref$ = J.read(save), harb = ref$[0], Sheet1 = ref$[1].Sheets.Sheet1;
          input[0] || (input[0] = harb);
          input[1].Sheets[names[idx]] = Sheet1;
        }
        rv = J.utils["to_" + type](input);
        return [JTypeMap[type], rv];
      });
    };
    this.get({
      '/_timetrigger': function(){
        var this$ = this;
        return DB.hgetall("cron-list", function(arg$, allTimeTriggers){
          var timeNowMins, nextTriggerTime, cellID, timeList, res$, i$, ref$, len$, triggerTimeMins, ref1$, room, cell;
          console.log("allTimeTriggers ", (import$({}, allTimeTriggers)));
          timeNowMins = Math.floor(new Date().getTime() / (1000 * 60));
          nextTriggerTime = 2147483647;
          for (cellID in allTimeTriggers) {
            timeList = allTimeTriggers[cellID];
            res$ = [];
            for (i$ = 0, len$ = (ref$ = timeList.split(',')).length; i$ < len$; ++i$) {
              triggerTimeMins = ref$[i$];
              if (triggerTimeMins <= timeNowMins) {
                ref1$ = cellID.split('!'), room = ref1$[0], cell = ref1$[1];
                console.log("cellID " + cellID + " triggerTimeMins " + triggerTimeMins);
                SC._get(room, IO, fn$);
                continue;
              } else {
                if (nextTriggerTime > triggerTimeMins) {
                  nextTriggerTime = triggerTimeMins;
                }
                res$.push(triggerTimeMins);
              }
            }
            timeList = res$;
            if (timeList.length === 0) {
              DB.hdel("cron-list", cellID);
            } else {
              DB.hset("cron-list", cellID, timeList.toString());
            }
          }
          return DB.multi().set("cron-nextTriggerTime", nextTriggerTime).bgsave().exec(function(){
            fs.writeFileSync(dataDir + "/nextTriggerTime.txt", nextTriggerTime, 'utf8');
            console.log("--- cron email sent ---");
            this$.response.type(Json);
            return this$.response.send(200, allTimeTriggers);
          });
          function fn$(arg$){
            var snapshot;
            snapshot = arg$.snapshot;
            return SC[room].triggerActionCell(cell, function(){});
          }
        });
      }
    });
    ExportExcelXML = api(function(){});
    this.get({
      '/:room.csv': ExportCSV
    });
    this.get({
      '/:room.csv.json': ExportCSVJSON
    });
    this.get({
      '/:room.html': ExportHTML
    });
    this.get({
      '/:room.xlsx': ExportJ('xlsx')
    });
    this.get({
      '/:room.md': ExportJ('md')
    });
    if (this.CORS) {
      this.get({
        '/_rooms': function(){
          this.response.type(Text);
          return this.response.send(403, '_rooms not available with CORS');
        }
      });
    } else {
      this.get({
        '/_rooms': function(){
          var this$ = this;
          return SC._rooms(function(rooms){
            this$.response.type('application/json');
            return this$.response.json(200, rooms);
          });
        }
      });
    }
    this.get({
      '/_from/:template': function(){
        var room, template, this$ = this;
        room = newRoom();
        template = this.params.template;
        delete SC[room];
        return SC._get(template, IO, function(arg$){
          var snapshot;
          snapshot = arg$.snapshot;
          return SC._put(room, snapshot, function(){
            return this$.response.redirect(KEY
              ? BASEPATH + "/" + room + "/edit"
              : BASEPATH + "/" + room);
          });
        });
      }
    });
    this.get({
      '/_exists/:room': function(){
        var this$ = this;
        return SC._exists(this.params.room, function(exists){
          this$.response.type('application/json');
          return this$.response.json(deepEq$(exists, 1, '==='));
        });
      }
    });
    this.get({
      '/:room': function(){
        var uiFile, ref$;
        uiFile = /^=/.exec(this.params.room) ? 'multi/index.html' : 'index.html';
        if (KEY) {
          if ((ref$ = this.query.auth) != null && ref$.length) {
            return sendFile(uiFile).call(this);
          } else {
            return this.response.redirect(BASEPATH + "/" + this.params.room + "?auth=0");
          }
        } else {
          return sendFile(uiFile).call(this);
        }
      }
    });
    this.get({
      '/:template/form': function(){
        var template, room, this$ = this;
        template = this.params.template;
        room = template + '_' + newRoom();
        delete SC[room];
        return SC._get(template, IO, function(arg$){
          var snapshot;
          snapshot = arg$.snapshot;
          return SC._put(room, snapshot, function(){
            return this$.response.redirect(BASEPATH + "/" + room + "/app");
          });
        });
      }
    });
    this.get({
      '/:template/appeditor': sendFile('panels.html')
    });
    this.get({
      '/:room/edit': function(){
        var room;
        room = this.params.room;
        return this.response.redirect(BASEPATH + "/" + room + "?auth=" + hmac(room));
      }
    });
    this.get({
      '/:room/view': function(){
        var room;
        room = this.params.room;
        return this.response.redirect(BASEPATH + "/" + room + "?auth=" + hmac(room) + "&view=1");
      }
    });
    this.get({
      '/:room/app': function(){
        var room;
        room = this.params.room;
        return this.response.redirect(BASEPATH + "/" + room + "?auth=" + hmac(room) + "&app=1");
      }
    });
    this.get({
      '/_/:room/cells/:cell': api(function(){
        var this$ = this;
        return [
          Json, function(sc, cb){
            return sc.exportCell(this$.cell, cb);
          }
        ];
      })
    });
    this.get({
      '/_/:room/cells': api(function(){
        return [
          Json, function(sc, cb){
            return sc.exportCells(cb);
          }
        ];
      })
    });
    this.get({
      '/_/:room/html': ExportHTML
    });
    this.get({
      '/_/:room/csv': ExportCSV
    });
    this.get({
      '/_/:room/csv.json': ExportCSVJSON
    });
    this.get({
      '/_/:room/xlsx': ExportJ('xlsx')
    });
    this.get({
      '/_/:room/md': ExportJ('md')
    });
    this.get({
      '/_/:room': api(function(it){
        return [Text, it];
      })
    });
    requestToCommand = function(request, cb){
      var command, ref$, cs, this$ = this;
      if (request.is('application/json')) {
        command = (ref$ = request.body) != null ? ref$.command : void 8;
        if (command) {
          return cb(command);
        }
      }
      cs = [];
      request.on('data', function(chunk){
        return cs = cs.concat(chunk);
      });
      return request.on('end', function(){
        var buf, k, ref$, save;
        buf = Buffer.concat(cs);
        if (request.is('text/x-socialcalc')) {
          return cb(buf.toString('utf8'));
        }
        if (request.is('text/plain')) {
          return cb(buf.toString('utf8'));
        }
        for (k in ref$ = J.utils.to_socialcalc(J.read(buf)) || {
          '': ''
        }) {
          save = ref$[k];
          save = save.replace(/[\d\D]*?\ncell:/, 'cell:');
          save = save.replace(/\s--SocialCalcSpreadsheetControlSave--[\d\D]*/, '\n');
          if (~save.indexOf("\\")) {
            save = save.replace(/\\/g, "\\b");
          }
          if (~save.indexOf(":")) {
            save = save.replace(/:/g, "\\c");
          }
          if (~save.indexOf("\n")) {
            save = save.replace(/\n/g, "\\n");
          }
          return cb("loadclipboard " + save);
        }
      });
    };
    requestToSave = function(request, cb){
      var snapshot, ref$, cs, this$ = this;
      if (request.is('application/json')) {
        snapshot = (ref$ = request.body) != null ? ref$.snapshot : void 8;
        if (snapshot) {
          return cb(snapshot);
        }
      }
      cs = [];
      request.on('data', function(chunk){
        return cs = cs.concat(chunk);
      });
      return request.on('end', function(){
        var buf, iconv, k, ref$, save;
        buf = Buffer.concat(cs);
        if (request.is('text/x-socialcalc')) {
          return cb(buf.toString('utf8'));
        }
        if (request.is('text/x-ethercalc-csv-double-encoded')) {
          iconv = require('iconv-lite');
          buf = iconv.decode(buf, 'utf8');
          buf = iconv.encode(buf, 'latin1');
          buf = iconv.decode(buf, 'utf8');
        }
        for (k in ref$ = J.utils.to_socialcalc(J.read(buf)) || {
          '': ''
        }) {
          save = ref$[k];
          return cb(save);
        }
      });
    };
    for (i$ = 0, len$ = (ref$ = ['/=:room.xlsx', '/_/=:room/xlsx']).length; i$ < len$; ++i$) {
      route = ref$[i$];
      this.put((ref1$ = {}, ref1$[route + ""] = fn$, ref1$));
    }
    this.put({
      '/_/:room': function(){
        var room, this$ = this;
        this.response.type(Text);
        room = this.params.room;
        return requestToSave(this.request, function(snapshot){
          var ref$;
          if ((ref$ = SC[room]) != null) {
            ref$.terminate();
          }
          delete SC[room];
          return SC._put(room, snapshot, function(){
            return DB.del("log-" + room, function(){
              IO.sockets['in']("log-" + room).emit('data', {
                snapshot: snapshot,
                type: 'snapshot'
              });
              return this$.response.send(201, 'OK');
            });
          });
        });
      }
    });
    this.post({
      '/_/:room': function(){
        var room, this$ = this;
        room = this.params.room;
        return requestToCommand(this.request, function(command){
          if (!command) {
            this$.response.type(Text);
            return this$.response.send(400, 'Please send command');
          }
          return SC._get(room, IO, function(arg$){
            var log, snapshot, row, cmdstr;
            log = arg$.log, snapshot = arg$.snapshot;
            if (/^loadclipboard\s*/.exec(command)) {
              row = 1;
              if (/\nsheet:c:\d+:r:(\d+):/.exec(snapshot)) {
                row += Number(RegExp.$1);
              }
              if (parseInt(this$.query.row)) {
                row = parseInt(this$.query.row);
                command = [command, "insertrow A" + row, "paste A" + row + " all"];
              } else {
                command = [command, "paste A" + row + " all"];
              }
            }
            if (/^set\s+(A\d+):B\d+\s+empty\s+multi-cascade/.exec(command)) {
              DB.multi().get("snapshot-" + room).exec(function(_, arg$){
                var snapshot, sheetId, matches, removeKey, backupKey;
                snapshot = arg$[0];
                if (snapshot) {
                  sheetId = RegExp.$1;
                  matches = snapshot.match(new RegExp("cell:" + sheetId + ":t:/(.+)\n", "i"));
                  if (matches) {
                    removeKey = matches[1];
                    backupKey = matches[1] + ".bak";
                    return DB.multi().del("snapshot-" + backupKey).rename("snapshot-" + removeKey, "snapshot-" + backupKey).del("log-" + backupKey).rename("log-" + removeKey, "log-" + backupKey).del("audit-" + backupKey).rename("audit-" + removeKey, "audit-" + backupKey).bgsave().exec(function(_){});
                  }
                }
              });
            }
            if (!Array.isArray(command)) {
              command = [command];
            }
            cmdstr = join$.call(command, '\n');
            return DB.multi().rpush("log-" + room, cmdstr).rpush("audit-" + room, cmdstr).bgsave().exec(function(){
              var ref$;
              if ((ref$ = SC[room]) != null) {
                ref$.ExecuteCommand(cmdstr);
              }
              IO.sockets['in']("log-" + room).emit('data', {
                cmdstr: cmdstr,
                room: room,
                type: 'execute'
              });
              return this$.response.json(202, {
                command: command
              });
            });
          });
        });
      }
    });
    this.post({
      '/_': function(){
        var this$ = this;
        return requestToSave(this.request, function(snapshot){
          var room, ref$;
          room = ((ref$ = this$.body) != null ? ref$.room : void 8) || newRoom();
          return SC._put(room, snapshot, function(){
            this$.response.type(Text);
            this$.response.location("/_/" + room);
            return this$.response.send(201, "/" + room);
          });
        });
      }
    });
    this['delete']({
      '/_/:room': function(){
        var room, ref$, this$ = this;
        this.response.type(Text);
        room = this.params.room;
        if ((ref$ = SC[room]) != null) {
          ref$.terminate();
        }
        delete SC[room];
        return SC._del(room, function(){
          return this$.response.send(201, 'OK');
        });
      }
    });
    this.on({
      disconnect: function(){
        var id, ref$, key, i$, ref1$, len$, client, room, ref2$, val, isConnected, ref3$;
        console.log("on disconnect");
        id = this.socket.id;
        if (((ref$ = IO.sockets.manager) != null ? ref$.roomClients : void 8) != null) {
          CleanRoomLegacy: for (key in IO.sockets.manager.roomClients[id]) {
            if (/^\/log-/.exec(key)) {
              for (i$ = 0, len$ = (ref1$ = IO.sockets.clients(key.substr(1))).length; i$ < len$; ++i$) {
                client = ref1$[i$];
                if (client.id !== id) {
                  continue CleanRoomLegacy;
                }
              }
              room = key.substr(5);
              if ((ref1$ = SC[room]) != null) {
                ref1$.terminate();
              }
              delete SC[room];
            }
          }
          return;
        }
        CleanRoom: for (key in ref2$ = IO.sockets.adapter.rooms) {
          val = ref2$[key];
          if (/^log-/.exec(key)) {
            for (client in val) {
              isConnected = val[client];
              if (isConnected && client !== id) {
                continue CleanRoom;
              }
            }
            room = key.substr(4);
            if ((ref3$ = SC[room]) != null) {
              ref3$.terminate();
            }
            delete SC[room];
          }
        }
      }
    });
    return this.on({
      data: function(){
        var ref$, room, msg, user, ecell, cmdstr, type, auth, reply, broadcast, this$ = this;
        ref$ = this.data, room = ref$.room, msg = ref$.msg, user = ref$.user, ecell = ref$.ecell, cmdstr = ref$.cmdstr, type = ref$.type, auth = ref$.auth;
        room = (room + "").replace(/^_+/, '');
        if (EXPIRE) {
          DB.expire("snapshot-" + room, EXPIRE);
        }
        reply = function(data){
          return this$.emit({
            data: data
          });
        };
        broadcast = function(data){
          this$.socket.broadcast.to(this$.data.to
            ? "user-" + this$.data.to
            : "log-" + data.room).emit('data', data);
          if ((data.include_self != null) === true) {
            return this$.emit('data', data);
          }
        };
        switch (type) {
        case 'chat':
          DB.rpush("chat-" + room, msg, function(){
            return broadcast(this$.data);
          });
          break;
        case 'ask.ecells':
          DB.hgetall("ecell-" + room, function(_, values){
            return broadcast({
              type: 'ecells',
              ecells: values,
              room: room
            });
          });
          break;
        case 'my.ecell':
          DB.hset("ecell-" + room, user, ecell);
          break;
        case 'execute':
          if (/^set sheet defaulttextvalueformat text-wiki\s*$/.exec(cmdstr)) {
            return;
          }
          DB.multi().rpush("log-" + room, cmdstr).rpush("audit-" + room, cmdstr).bgsave().exec(function(){
            var commandParameters, room_data, ref$, ref1$;
            commandParameters = cmdstr.split("\r");
            if (SC[room] == null) {
              console.log("SC[" + room + "] went away. Reloading...");
              DB.multi().get("snapshot-" + room).lrange("log-" + room, 0, -1).exec(function(_, arg$){
                var snapshot, log;
                snapshot = arg$[0], log = arg$[1];
                return SC[room] = SC._init(snapshot, log, DB, room, this$.io);
              });
            }
            if (commandParameters[0].trim() === 'submitform') {
              room_data = room.indexOf('_') === -1
                ? room + "_formdata"
                : room.replace(/_[.=_a-zA-Z0-9]*$/i, "_formdata");
              console.log("test SC[" + room_data + "] submitform...");
              if (SC[room_data + ""] == null) {
                console.log("Submitform. loading... SC[" + room_data + "]");
                DB.multi().get("snapshot-" + room_data).lrange("log-" + room_data, 0, -1).exec(function(_, arg$){
                  var snapshot, log;
                  snapshot = arg$[0], log = arg$[1];
                  return SC[room_data + ""] = SC._init(snapshot, log, DB, room_data + "", this$.io);
                });
              }
              if ((ref$ = SC[room_data + ""]) != null) {
                ref$.exportAttribs(function(attribs){
                  var formrow, res$, i$, ref$, len$, cmdstrformdata, this$ = this;
                  console.log("sheet attribs:", (import$({}, attribs)));
                  res$ = [];
                  for (i$ = 0, len$ = (ref$ = commandParameters).length; i$ < len$; ++i$) {
                    if (i$ !== 0) {
                      res$.push((fn$.call(this, i$, ref$[i$])));
                    }
                  }
                  formrow = res$;
                  cmdstrformdata = formrow.join("\n");
                  console.log("cmdstrformdata:" + cmdstrformdata);
                  DB.multi().rpush("log-" + room_data, cmdstrformdata).rpush("audit-" + room_data, cmdstrformdata).bgsave().exec(function(){
                    var ref$;
                    if ((ref$ = SC[room_data + ""]) != null) {
                      ref$.ExecuteCommand(cmdstrformdata);
                    }
                    return broadcast({
                      room: room_data + "",
                      user: user,
                      type: type,
                      auth: auth,
                      cmdstr: cmdstrformdata,
                      include_self: true
                    });
                  });
                  function fn$(formDataIndex, datavalue){
                    return "set " + (String.fromCharCode(64 + formDataIndex) + (attribs.lastrow + 1)) + " text t " + datavalue;
                  }
                });
              }
            }
            if ((ref1$ = SC[room]) != null) {
              ref1$.ExecuteCommand(cmdstr);
            }
            return broadcast(this$.data);
          });
          break;
        case 'ask.log':
          if (typeof DB.DB === 'undefined') {
            console.log("ignore connection request, no database yet!");
            reply({
              type: 'ignore'
            });
            return;
          }
          console.log("join [log-" + room + "] [user-" + user + "]");
          this.socket.join("log-" + room);
          this.socket.join("user-" + user);
          DB.multi().get("snapshot-" + room).lrange("log-" + room, 0, -1).lrange("chat-" + room, 0, -1).exec(function(_, arg$){
            var snapshot, log, chat;
            snapshot = arg$[0], log = arg$[1], chat = arg$[2];
            SC[room] = SC._init(snapshot, log, DB, room, this$.io);
            return reply({
              type: 'log',
              room: room,
              log: log,
              chat: chat,
              snapshot: snapshot
            });
          });
          break;
        case 'ask.recalc':
          this.socket.join("recalc." + room);
          if ((ref$ = SC[room]) != null) {
            ref$.terminate();
          }
          delete SC[room];
          SC._get(room, this.io, function(arg$){
            var log, snapshot;
            log = arg$.log, snapshot = arg$.snapshot;
            return reply({
              type: 'recalc',
              room: room,
              log: log,
              snapshot: snapshot
            });
          });
          break;
        case 'stopHuddle':
          if (this.KEY && KEY !== this.KEY) {
            return;
          }
          DB.del(['audit', 'log', 'chat', 'ecell', 'snapshot'].map(function(it){
            return it + "-" + room;
          }), function(){
            var ref$;
            if ((ref$ = SC[room]) != null) {
              ref$.terminate();
            }
            delete SC[room];
            return broadcast(this$.data);
          });
          break;
        case 'ecell':
          if (auth === '0' || KEY && auth !== hmac(room)) {
            return;
          }
          broadcast(this.data);
          break;
        default:
          broadcast(this.data);
        }
      }
    });
    function fn$(){
      var room, cs, this$ = this;
      room = encodeURIComponent(this.params.room).replace(/%3A/g, ':');
      cs = [];
      this.request.on('data', function(chunk){
        return cs = cs.concat(chunk);
      });
      return this.request.on('end', function(){
        var buf, idx, toc, parsed, sheetsToIdx, res, k, Sheet1, todo, save;
        buf = Buffer.concat(cs);
        idx = 0;
        toc = '#url,#title\n';
        parsed = J.utils.to_socialcalc(J.read(buf));
        sheetsToIdx = {};
        res = [];
        for (k in parsed) {
          idx++;
          sheetsToIdx[k] = idx;
          toc += "\"/" + this$.params.room.replace(/"/g, '""') + "." + idx + "\",";
          toc += "\"" + k.replace(/"/g, '""') + "\"\n";
          res.push(k.replace(/'/g, "''").replace(/(\W)/g, '\\$1'));
        }
        Sheet1 = J.utils.to_socialcalc(J.read(toc)).Sheet1;
        todo = DB.multi().set("snapshot-" + room, Sheet1);
        for (k in parsed) {
          save = parsed[k];
          idx = sheetsToIdx[k];
          save = save.replace(RegExp('(\'?)\\b(' + res.join('|') + ')\\1!', 'g'), fn$);
          todo = todo.set("snapshot-" + room + "." + idx, save);
        }
        todo.bgsave().exec();
        return this$.response.send(201, 'OK');
        function fn$(arg$, arg1$, ref){
          return "'" + this$.params.room.replace(/'/g, "''") + "." + sheetsToIdx[ref.replace(/''/g, "'")] + "'!";
        }
      });
    }
  };
  function import$(obj, src){
    var own = {}.hasOwnProperty;
    for (var key in src) if (own.call(src, key)) obj[key] = src[key];
    return obj;
  }
  function deepEq$(x, y, type){
    var toString = {}.toString, hasOwnProperty = {}.hasOwnProperty,
        has = function (obj, key) { return hasOwnProperty.call(obj, key); };
    var first = true;
    return eq(x, y, []);
    function eq(a, b, stack) {
      var className, length, size, result, alength, blength, r, key, ref, sizeB;
      if (a == null || b == null) { return a === b; }
      if (a.__placeholder__ || b.__placeholder__) { return true; }
      if (a === b) { return a !== 0 || 1 / a == 1 / b; }
      className = toString.call(a);
      if (toString.call(b) != className) { return false; }
      switch (className) {
        case '[object String]': return a == String(b);
        case '[object Number]':
          return a != +a ? b != +b : (a == 0 ? 1 / a == 1 / b : a == +b);
        case '[object Date]':
        case '[object Boolean]':
          return +a == +b;
        case '[object RegExp]':
          return a.source == b.source &&
                 a.global == b.global &&
                 a.multiline == b.multiline &&
                 a.ignoreCase == b.ignoreCase;
      }
      if (typeof a != 'object' || typeof b != 'object') { return false; }
      length = stack.length;
      while (length--) { if (stack[length] == a) { return true; } }
      stack.push(a);
      size = 0;
      result = true;
      if (className == '[object Array]') {
        alength = a.length;
        blength = b.length;
        if (first) {
          switch (type) {
          case '===': result = alength === blength; break;
          case '<==': result = alength <= blength; break;
          case '<<=': result = alength < blength; break;
          }
          size = alength;
          first = false;
        } else {
          result = alength === blength;
          size = alength;
        }
        if (result) {
          while (size--) {
            if (!(result = size in a == size in b && eq(a[size], b[size], stack))){ break; }
          }
        }
      } else {
        if ('constructor' in a != 'constructor' in b || a.constructor != b.constructor) {
          return false;
        }
        for (key in a) {
          if (has(a, key)) {
            size++;
            if (!(result = has(b, key) && eq(a[key], b[key], stack))) { break; }
          }
        }
        if (result) {
          sizeB = 0;
          for (key in b) {
            if (has(b, key)) { ++sizeB; }
          }
          if (first) {
            if (type === '<<=') {
              result = size < sizeB;
            } else if (type === '<==') {
              result = size <= sizeB
            } else {
              result = size === sizeB;
            }
          } else {
            first = false;
            result = size === sizeB;
          }
        }
      }
      stack.pop();
      return result;
    }
  }
}).call(this);
