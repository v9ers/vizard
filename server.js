var server = require('router').create();
var jsonify = require('jsonify');

var map = {}; // yes should be a DB!

var smartify = function(key, data) {
	var that = {};

	if (typeof data === 'number') {
		that.graph = 'line';
		that.x = [];
		that.y = [];
		
		that.push = function(data) {
			that.x.push(Date.now());
			that.y.push(data);
		};

		return that;
	}
	if (typeof data === 'boolean') {
		that.graph = 'boolean';
		that.t = 0;
		that.f = 0;

		that.push = function(data) {
			if (data) {
				that.t++;
			} else {
				that.f++;
			}
		};
		return that;
	}
	if (typeof data === 'string') {
		that.graph = 'pie';
		that.values = {};

		that.push = function(data) {
			that.values[data] = (that.values[data] || 0) + 1;
		};
		return that;
	}
};

server.post('/r/{id}', jsonify(function(request, data, respond) {
	var m = map[request.params.id];

	if (!m) {
		m = map[request.params.id] = {};

		for (var i in data) {
			m[i] = smartify(i, data[i], data);
		}
	}

	for (var i in m) {
		m[i].push(data[i], data);
	}

	respond({ok:true});
}));

server.get('/r/{id}', jsonify(function(request, respond) {
	respond('not supported :(');
}));

server.get('/v/{id}/{name}?', jsonify(function(request, respond) {
	var data = map[request.params.id] || {};

	if (request.params.name) {
		respond(data[request.params.name]);
		return;
	}
	respond(data);
}));

server.get('/', jsonify(function(request, respond) {
	respond(data);
}));
server.post('/', jsonify(function(request, body, respond) {
	data.push(body);
	respond({success:true});
}));

server.listen(8008);