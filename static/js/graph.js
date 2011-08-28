var gensym = (function() {
	var i=0;
	
	return function() {
		return 's'+i++;
	};
})();

var graphs = {};

var updateChart = function(data, name, type, id) {
	if (type in {'line':1,'histogram':1}) {
		data.sort(lineSort);
		/*data[set].line.forEach(function(item) {
			item.x = new Date(item.x).toUTCString();
		});*/
	}
	if (type in {'pie': 1, 'bar':1, 'trend':1, 'choice':1}) {
		if (typeof data !== 'object') {
			return;
		}
		var realData = [];
		
		for (var i in data) {
			realData.push({x:i, y:data[i]});
		}
		
		data = realData.sort(columnSort);
	}
	
	graphs[name] = graphs[name] || {};
	
	if (graphs[name][type]) {
		graphs[name][type].set(data);
	} else {
		graphs[name][type] = create(data, name, type, id);
	}
};

var create = function(data, name, type, id) {
	var title = (type === 'trend' ? 'Trend' : ''); //name;
	var subtitle = ''; // type;
	
	if (type in {'bar':1, 'trend':1, 'histogram':1}) {
		type = 'column';
	}
	if (type in {'choice':1}) {
		type = 'pie';
	}

	var graph = vizard.create(id, title, subtitle, type);

	graph.set(data);
	
	return graph;
};
var lineSort = function(a,b) {
	return a.x - b.x;
};
var columnSort = function(a,b) {
	var sorting = {
		Others: 1
	};
	var cmp = (sorting[a.x] || 0) - (sorting[b.x] || 0);

	if (cmp !== 0) {
		return cmp;
	}

	cmp = b.y - a.y;

	if (cmp !== 0) {
		return cmp;
	}

	return a.x.toUpperCase().localeCompare(b.x.toUpperCase());
};