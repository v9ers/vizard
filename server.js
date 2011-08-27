var server = require('router').create();
var db = require('mongojs').connect('v9ers:qweqwe@staff.mongohq.com:10013/vizard', ['graph', 'series']);
var jsonify = require('jsonify');
var common = require('common');
var nko = require('nko')('2Fv892xsR2NIoRAq');

var analyzor = function() {
	var that = {};

	var add = function(data, serie) {
		if (typeof data === 'number') {
			var line = {x:[],y:[]};

			that.graph = {line:line};
			that.total = 0;

			add = function(data, serie) {
				that.total += data;

				line.x.push(serie.time);
				line.y.push(data);
			};
		}
		if (typeof data === 'boolean') {
			var choice = {yes:0, no:0};

			that.graph = {choice:choice};

			add = function(data, serie) {
				data = data ? 'yes' : 'no';

				choice[data]++;
			};
		}
		if (typeof data === 'string') {
			var bar = {values:{}};

			that.graph = {bar:bar};

			add = function(data, serie) {
				bar.values[data] = (bar.values[data] || 0) + 1;
			};
		}
		if (typeof data === 'object') {
			add = function(data, serie) {
				
			};
		}
		add(data, serie); // bootstrap
	};

	that.push = function(data, serie) {
		if (Array.isArray(data)) {
			data.forEach(function(data) {
				that.push(data, serie);
			});
			return;
		}
		add(data, serie);		
	};

	return that;
};
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
	common.step([
		function(next) {
			db.series.find({id:request.params.id}, {_id:0}, next);
		},
		function(series) {
			if (!series.length) {
				respond(404);
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

					analyse.push(serie[key], serie);					
				});
			});

			respond(result);
		}
	], fork(respond));
}));

server.listen(8008);
