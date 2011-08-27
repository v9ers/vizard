var sum = function(data) {
	return data.reduce(function(last, val) {
		return last + val;
	});
};

// data = [{value:number,time:unixtime}]
var trend = function(data,time,period) {
	var last = data[data.length - 1];


	// dead trend

	if(time && time[time.length - 1] - time[time.length - 2] >= period) {
		return 0;
	}

	var mean = average(data);
	var deviation = std(data);

	if(mean == last) {
		return 0;
	}

	if(last >= deviation+mean) {
		return 1;
	}
	
	if(last <= mean-deviation ) {
		return -1;
	}
	
	if(last > mean) {
		return Math.abs(last - mean) / deviation;	
	} else {
		return -(Math.abs(last - mean) / deviation);
	}
};
exports.trend = trend;

var average = function(data) {
	return sum(data) / data.length;
};
exports.average = average;

var std = function(data) {
	var mean = average(data);
	
	var nominator = data.reduce(function(a,b) {
		return a + (b - mean) * (b - mean);
	}, 0);

	return Math.sqrt(nominator/data.length);
};
exports.std = std;

var unique = function(data) {
    var a = [];
    var l = data.length;
    for(var i=0; i<l; i++) {
      for(var j=i+1; j<l; j++) {
        // If this[i] is found later in the array
        if (data[i] === data[j])
          j = ++i;
      }
      a.push(data[i]);
    }
    return a;	
};

var counts = function(data) {
	var solo = unique(data.sort());
	var ret = [];
	for(var i =0;i<solo.length;i++) {
		var count = 0;
		for(var j =0;j<data.length;j++) {
			if(solo[i] === data[j]) {
				count++;
			}
		}
		ret.push(count);
	}
	return ret;
}

var binwidth = function(data) {
	// src http://en.wikipedia.org/wiki/Histogram#Number_of_bins_and_width
	// Square-root choice
	return Math.sqrt(data.length);
	// socts-choice 
	//return 3.49 * std(data) * Math.pow(average(data),-1/3);
};

var histogram = function(data) {
	// doing a dummy historgram of bin 1 for now
	return counts(data);
/*
	data.sort();

	var solo = unique(data);
	var bin = binwidth(data);
	var results = [];
	
	var begin = data[0];
	var count = 0;

	console.log(bin,begin);
	
	var begin = solo[0];

	for(var j = 0; j < solo.length; j++) {
		if(solo[j] >= begin + bin) {
			begin = solo[j];
			console.log(begin);
			for(var i = 0; i < data.length; i++) {
				if(data) {
					
				}
			}
			results.push(solo[j]);
		}
	}
	return results;
	*/
};
exports.histogram = histogram;

var min = function(data,time) {
	var index = 0;
	var last = data[0];
	for(var i = 0; i < data.length; i++) {
		if(data[i] < last) {
			index = i;
			last = data[i];
		}
	}
	return {value:data[index],time:time[index]};
};
exports.min = min;

var max = function(data,time) {
	var index = 0;
	var last = data[0];
	for(var i = 0; i < data.length; i++) {
		if(data[i] > last) {
			index = i;
			last = data[i];
		}
	}

	return {value:data[index],time:time[index]};
};
exports.max = max;