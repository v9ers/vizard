var server = require('router').create();
var db = require('mongojs').connect('v9ers:qweqwe@staff.mongohq.com:10013/vizard', ['graph', 'series']);
var jsonify = require('jsonify');
var common = require('common');
var parseURL = require('url').parse;
var stats = require('./stats');
var nko = require('nko')('2Fv892xsR2NIoRAq');

var analyzor = function() {
	var that = {};

	var addLine = function(line, data, options) {
		var last = line[line.length-1];

		if (!last || last.x + options.period < options.time) {
			line.push({x:options.time, y:data});
		} else {
			last.y += data;
		}
	};
	var add = function(data, options) {
		if (data === null || data === undefined) {
			return;
		}
		if (typeof data === 'number') {
			var line = [];
			var y = [];
			var x = [];

			that.graph = {line:line};
			that.total = 0;

			add = function(data, options) {
				that.total += data;

				y.push(data);
				x.push(options.time);

				addLine(line, data, options);
			};

			var round = function(n) {
				return Math.round(1000*n) / 1000;
			};

			that.toJSON = function() {
				that.trend = round(stats.trend(y,x,options.period));
				that.min = stats.min(y, x);
				that.max = stats.max(y, x);
				that.average = round(stats.average(y));
				that.std = round(stats.std(y));
				that.graph.histogram = stats.histogram(y);

				return that;
			};
		}
		if (typeof data === 'boolean') {
			var choice = {yes:0, no:0};
			var line = [];

			that.graph = {choice:choice, line:line};

			add = function(data, options) {
				addLine(line, data ? 1 : -1, options);

				data = data ? 'yes' : 'no';

				choice[data]++;
			};

			that.toJSON = function() {
				for (var i in line) {
					line[i].y = line[i].y >= 0;
				}
				return that;
			};
		}
		if (typeof data === 'string') {
			var bar = {};
			var all = [];
			var last = 0;

			that.graph = {bar:bar};

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
				var limit = last-options.period;

				for (var i = all.length-1; i >= 0 && all[i][1] >= limit; i--) {
					put(trend, all[i][0]);
				}

				that.graph.bar = digest(bar);
				that.trend = digest(trend);

				return that;
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
		respond({success:true});
	}));
}));

server.get('/r/{id}', jsonify(function(request, respond) {
	db.series.find({id:request.params.id}, {_id:0}, fork(respond));
}));

server.get('/v/{id}/{name}?', jsonify(function(request, respond) {
	var query = parseURL(request.url, true).query;
	var from = parseInt(query.from, 10);
	var window = from || (Date.now() - parseTime(query.window || '1w'));
	var period = parseTime(query.period || '5m');

	common.step([
		function(next) {
			db.series.find({id:request.params.id, time:{$gte:window}}, {_id:0}, next);
		},
		function(series) {
			if (!series.length) {
				respond(404, {});
				return;
			}

			var name = request.params.name;
			var result = {};

			series.forEach(function(serie) {
				var keys = name ? [name] : Object.keys(serie);

				keys.forEach(function(key) {
					if (key === 'time' || key === 'id') {
						return;
					}
					if (!(key in serie)) {
						return;
					}
					var analyse = result[key] = result[key] || analyzor(key, serie[key]);

					analyse.push(serie[key], {time:serie.time, period:period});
				});
			});

			respond(result);
		}
	], fork(respond));
}));

server.listen(8008);
