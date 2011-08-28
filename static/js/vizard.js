(function(exports) {
		exports.create = function(id, title, subtitle, type) {
			console.log(id);
			var chart;
			var firstData = [];
			
			$(function() {
				chart = new Highcharts.Chart({
					chart: {
						renderTo: id,
						defaultSeriesType: type
					},
					credits: {
						enabled: false
					},
					legend: {
						enabled: false
					},
					title: {
						text: title
					},
					subtitle: {
						text: subtitle
					},
					xAxis: {
						categories: firstData.map(function(d) { return d.x; }),
						labels: {
							enabled: (subtitle !== 'histogram'),
							step: (type === 'line' ? 4 : null)
						}
					},
					yAxis: {
						min: 0,
						title: {
							text: ''
						}
					},
					plotOptions: {
						column: {
							pointPadding: (subtitle === 'histogram' ? 0.04 : 0.2),
							groupPadding: 0,
							borderWidth: 0,
							shadow: (subtitle !== 'histogram')
						}
					},
					tooltip: {
						formatter: function() {
							var name = this.x || (this.point && this.point.name);
							return (name ? name + ' : ' : '') + '<b>' + this.y + '</b>';
						}
					},
					series: [{
						data: firstData.map(function(d) { return d.y; })
					}]
				});
			});

			var renderLine = function(data) {
				var mustRedraw = false;
				var firstPoint = 0;
				var lastEntry = chart.series[0].data[chart.series[0].data.length-1];

				for (var i=0; i<data.length; i++) {
					if (lastEntry && lastEntry.name === data[i].x) {
						if (lastEntry.y === data[i].y) {
							firstPoint = i+1;
							break;
						} else {
							lastEntry.update(data[i].y);
							firstPoint = data.length;
						}
					}
				}

				for (var i=firstPoint; i<data.length; i++) {
					var shiftOffOldPoints = (chart.xAxis[0].categories.length > data.length);
					chart.series[0].addPoint({name:data[i].x, y:data[i].y}, false, shiftOffOldPoints, true);
					chart.xAxis[0].categories.push(data[i].x);
					mustRedraw = true;
				}

				if (mustRedraw) {
					chart.xAxis[0].options.labels.step = (data.length / 2) | 0;
					chart.redraw();
				}
			};
			
			var renderColumn = function(data) {
				var mustRedraw = false;
				var series = chart.series[0];
				var xs = chart.xAxis[0].categories;
				var numberOfBars = xs.length;
				var modifiedBars = [];

				for (var i=0; i<data.length; i++) {
					var x = data[i].x;
					var y = data[i].y;

					if (i >= numberOfBars) {
						xs[i] = x;
						series.addPoint({x:i, y:y}, false, false, true);
						mustRedraw = true;
					} else {
						var bar = series.data[i];
						if (xs[i] !== x || bar.y !== y) {

							if (xs[i] !== x && x !== 'Others') {
								bar.graphic.css({ 'fill-opacity': 0.75 });
								modifiedBars.push(bar);
							}

							xs[i] = x;
							bar.update(y, false, true);
							mustRedraw = true;
						}
					}
				}

				for (var i=numberOfBars-1; i>=data.length; i--) {
					series.data[i].remove(false, true);
					mustRedraw = true;
				}
		
				xs.length = data.length;

				if (mustRedraw) {
					chart.redraw();

					(function(modifiedBars) {
						setTimeout(function() {
							modifiedBars.forEach(function(bar) {
								bar.graphic.css({'fill-opacity': 1});
							});
						}, 750);
					}(modifiedBars));
				}
			};
			
			return {
				set: function(data) {
					if (!chart) {
						console.error('Please do not set data before the chart is initialized!');
						return;
					}

					if (type in {'line':1, 'pie':1}) {
						renderLine(data);
					}

					if (type === 'column') {
						renderColumn(data);
					}
				}
			};
		};
})(window.vizard = {});
