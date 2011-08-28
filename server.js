var server = require('router').create();
var db = require('mongojs').connect('v9ers:qweqwe@staff.mongohq.com:10013/vizard', ['graph', 'series']);
var jsonify = require('jsonify');
var common = require('common');
var parseURL = require('url').parse;
var stats = require('./stats');
var nko = require('nko')('2Fv892xsR2NIoRAq');
var fs = require('fs');

var notify = common.createEmitter();

var analyzor = function(key, view) {
	var that = {};

	var addLine = function(line, data, options) {
		var last = line[line.length-1];

		if (!last || last.x + options.period < options.time) {
			line.push({x:options.time, y:data});
		} else {
			last.y += data;
		}
	};
	var viewer = function(that) {
		if (!view.length) {
			return that;
		}
		['histogram', 'line', 'choice', 'trend', 'bar'].forEach(function(name) {
			if (view.indexOf(name) === -1) {
				delete that[name];
			}			
		});
		return that;
	};
	var add = function(data, options) {
		if (data === null || data === undefined) {
			return;
		}
		if (typeof data === 'number') {
			var line = [];
			var last;
			var y = [];
			var x = [];

			that.total = 0;

			add = function(data, options) {
				that.total += data;

				y.push(data);
				x.push(options.time);

				last = options.time;

				addLine(line, data, options);
			};

			var round = function(n) {
				return Math.round(1000*n) / 1000;
			};

			that.toJSON = function() {
				var limit = last-options.trend;
				var i = x.length-1;
				
				for (; i > 0 && x[i] >= limit; i--);

				x = x.slice(i);
				y = y.slice(i);

				that.line = line;
				that.trend = round(stats.trend(y,x));

				y = line.map(function(entry) {
					return entry.y;
				});
				x = line.map(function(entry) {
					return entry.x;
				});

				that.histogram = stats.histogram(y);
				that.min = stats.min(y, x);
				that.max = stats.max(y, x);
				that.average = round(stats.average(y));
				that.std = round(stats.std(y));
				that.name = key;
				that.type = typeof data;

				return viewer(that);
			};
		}
		if (typeof data === 'boolean') {
			var choice = {yes:0, no:0};
			var line = [];

			add = function(data, options) {
				addLine(line, data ? 1 : -1, options);

				data = data ? 'yes' : 'no';

				choice[data]++;
			};

			that.toJSON = function() {
				that.choice = choice;
				that.line = line;
				that.name = key;
				that.type = typeof data;

				for (var i in line) {
					line[i].y = line[i].y >= 0;
				}
				return viewer(that);
			};
		}
		if (typeof data === 'string') {
			var bar = {};
			var all = [];
			var last = 0;

			var digest = function(values) {
				var top = Object.keys(values);
				var other = 0;	
				var result = {};

				top.sort(function(a,b) {
					return values[b] - values[a];
				});
				top.slice(0, 5).forEach(function(t) {
					result[t] = values[t];
				});
					
				for (var i in values) {
					if (result[i]) {
						continue;
					}
					other += values[i];
				}
				if (other) {
					result.Others = other;
				}

				return result;
			};
			var put = function(values, data) {
				values[data] = (values[data] || 0) + 1;				
			};

			add = function(data, options) {
				last = options.time;
				all.push([data, options.time]);
				put(bar, data);
			};

			that.toJSON = function() {
				var trend = {};
				var limit = last-options.trend;

				for (var i = all.length-1; i >= 0 && all[i][1] >= limit; i--) {
					put(trend, all[i][0]);
				}

				that.bar = digest(bar);
				that.trend = digest(trend);
				that.name = key;
				that.type = typeof data;
				
				return viewer(that);
			};
		}
		if (typeof data === 'object') {
			add = function(data, options) {

			};
		}

		add(data, options); // bootstrap
	};

	that.push = function(data, options) {
		if (Array.isArray(data)) {
			data.forEach(function(data) {
				that.push(data, options);
			});
			return;
		}
		add(data, options);		
	};

	return that;
};

var parseTime = function() {
	var times = {secs:1, mins:60, hours:3600, days:24*3600, weeks:7*24*3600, months:30*24*3600};
	var alias = {s:'secs', m:'mins', h:'hours', d:'days', w:'weeks'};
	
	return function(data) {
		if (!data) {
			return 0;
		}
		data = data.match(/(\d+)\s*(\w)/i);

		if (!data) {
			return 0;
		}
		return parseInt(data[1], 10) * 1000 * (times[alias[data[2]] || alias[data[2] + 's'] || data[2]] || 1);
	};
}();

var fork = function(respond, fn) {
	if (!fn) {
		fn = respond;
	}

	return function(err, value) {
		if (err) {
			respond(500, {error:err.message});
			return;
		}
		fn(value);
	};
};

server.post('/r/{id}', jsonify(function(request, data, respond) {
	data.id = request.params.id;
	data.time = data.time || Date.now();

	db.series.save(data, fork(respond, function() {
		notify.emit(data.id);
		respond({success:true});
	}));
}));

server.get('/n/{id}/{*}?', jsonify(function(request, respond) {
	notify.once(request.params.id, function() {
		respond({success:true});	
	});
}));

server.get('/r/{id}', jsonify(function(request, respond) {
	var query = parseURL(request.url, true).query;
	var from = query.from && parseInt(query.from, 10);
	var window = from || (Date.now() - parseTime(query.window || '1w'));
	
	db.series.find({id:request.params.id, time:{$gte:window}}, {_id:0}, fork(respond));
}));

server.get('/v/{id}/{*}?', jsonify(function(request, respond) {
	var query = parseURL(request.url, true).query;
	var from = query.from && parseInt(query.from, 10);
	var window = from || (Date.now() - parseTime(query.window || '1w'));
	var period = parseTime(query.period || '5m');
	var trend = parseTime(query.trend || query.period);

	common.step([
		function(next) {
			db.series.find({id:request.params.id, time:{$gte:window}}, {_id:0}).sort({time:1}, next);
		},
		function(series) {
			if (!series.length) {
				respond({});
				return;
			}

			var views = {};

			var w = request.params['*'];
			var name = w && w.split(',');	
			var result = {};

			name = name.map(function(n) {
				n = n.split(':');

				if (n[1]) {
					views[n[0]] = views[n[0]] || [];
					views[n[0]].push(n[1]);
				}

				return n[0];
			});

			var flatten = function(map) {
				var result = {};

				if (typeof map !== 'object') {
					return map;
				}
				for (var i in map) {
					if (Array.isArray(map[i])) {
						map[i].forEach(function(el) {
							el = flatten(el);

							if (typeof el === 'object') {
								for (var j in el) {
									result[i+'.'+j] = result[i+'.'+j] || [];
									result[i+'.'+j].push(el[j]);
								}
							} else {
								result[i] = result[i] || [];
								result[i].push(el);
							}
						});
					} else if (typeof map[i] === 'object') {
						var sub = flatten(map[i]);

						for (var j in sub) {
							result[i+'.'+j] = sub[j];
						}
					} else {
						result[i] = map[i];
					}
				}
				return result;
			};

			series.forEach(function(serie) {
				serie = flatten(serie);

				var keys = name ? [].concat(name) : Object.keys(serie);

				keys.forEach(function(key) {
					if (key === 'time' || key === 'id') {
						return;
					}
					if (!(key in serie)) {
						return;
					}
					var s = serie[key];
					var analyse = result[key] = result[key] || analyzor(key, views[key] || []);

					analyse.push(s, {time:serie.time, period:period, trend:trend});
				});
			});

			respond(result);
		}
	], fork(respond));
}));

server.get('/s/*', function(request, response) {
	// security blah blah - use lib
	fs.readFile('./static/'+request.params.wildcard, function(err, res) {
		response.writeHead(err ? 404 : 200);
		response.end(res);
	});
});
server.get('/g/*', function(request, response) {
	var onerror = function() {
		response.writeHead(500);
		response.end('oh no');
	};

	db.series.findOne({id:request.params.wildcard.split('/')[0]}, function(err, exists) {
		fs.readFile(exists ? './static/graphs.html' : './static/add.html', common.fork(onerror, function(buf) {
			response.writeHead(200);
			response.end(buf);
		}));
	});
});
server.get('/*', '/g/{*}', server.route);

server.listen(80);
