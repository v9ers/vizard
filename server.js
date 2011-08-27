var server = require('router').create();
var db = require('mongojs').connect('v9ers:qweqwe@staff.mongohq.com:10013/vizard', ['graph', 'series']);
var jsonify = require('jsonify');
var common = require('common');
var parseURL = require('url').parse;
var nko = require('nko')('2Fv892xsR2NIoRAq');

var analyzor = function() {
	var that = {};

	var add = function(data, options) {
		if (typeof data === 'number') {
			var line = {x:[],y:[]};

			that.graph = {line:line};
			that.total = 0;

			add = function(data, options) {
				that.total += data;

				var last = line.x.length-1;
				var x = line.x[last];

				if (!x || x + options.period < options.time) {
					line.x.push(options.time);
					line.y.push(data);
				} else {
					line.y[last] += data;
				}
			};
		}
		if (typeof data === 'boolean') {
			var choice = {yes:0, no:0};

			that.graph = {choice:choice};

			add = function(data, options) {
				data = data ? 'yes' : 'no';

				choice[data]++;
			};
		}
		if (typeof data === 'string') {
			var bar = {values:{}};

			that.graph = {bar:bar};

			add = function(data, options) {
				bar.values[data] = (bar.values[data] || 0) + 1;
			};

			that.toJSON = function() {
				var top = Object.keys(bar.values);
				var other = 0;	
				var result = {};

				top.sort(function(a,b) {
					return bar.values[b] - bar.values[a];
				});
				top.slice(0, 5).forEach(function(t) {
					result[t] = bar.values[t];
				});
					
				for (var i in bar.values) {
					if (result[i]) {
						continue;
					}
					other += bar.values[i];
				}
				if (other) {
					result.Others = other;
				}

				bar.values = result;

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
	var window = Date.now() - parseTime(query.window || '1w');

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
			var period = query.period ? parseTime(query.period) : 1;

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
