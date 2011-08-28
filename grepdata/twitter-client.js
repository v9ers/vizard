var http = require('http');

exports.search = function(query, callback) {
	http.get({
		host: 'search.twitter.com',
		path: '/search.json?q=' + encodeURIComponent(query)
	}, function(response) {
		if (response.statusCode === 200) {
			var json = '';
			response.setEncoding('utf8');
			response.on('data', function(data) {
				json += data;
			});
			response.on('end', function() {
				callback(null, JSON.parse(json));
			});
		} else {
			callback({
				message: 'HTTP ' + response.statusCode
			});
		}
	}).on('error', callback);
};
