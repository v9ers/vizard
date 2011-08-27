(function(exports) {
		exports.create = function(id, type) {
			var chart;
			var firstData = {
				categories: [],
				values: []
			};
			
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
						text: ''
					},
					xAxis: {
						categories: firstData.categories,
						labels: {
							step: (type === 'line' ? 50 : null)
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
							pointPadding: 0.2,
							borderWidth: 0
						}
					},
					tooltip: {
						formatter: function() {
							return this.x + ' : <b>' + this.y + '</b>';
						}
					},
					series: [{
						data: firstData.values
					}]
				});
			});
			
			return {
				set: function(data) {
					if (!chart) {
						for (var category in data.values) {
							firstData.categories.push(category);
							firstData.values.push(data.values[category]);
						}
						return;
					}

					var mustRedraw = false;
					var series = chart.series[0];
					var categories = chart.xAxis[0].categories;
					var numberOfBars = categories.length;
					var index = 0;
					var modifiedBars = [];

					for (var category in data.values) {
						var value = data.values[category];
						if (index >= numberOfBars) {
							categories.push(category);
							series.addPoint(value, false, false, true);
							mustRedraw = true;
						} else {
							var bar = series.data[index];
							if (categories[index] !== category || bar.y !== value) {

								if (categories[index] !== category && category !== 'Others') {
									bar.graphic.css({ 'fill-opacity': 0.75 });
									modifiedBars.push(bar);
								}

								categories[index] = category;
								bar.update(value, false, true);
								mustRedraw = true;
							}
						}
						index++;
					}
					for (var i = index; i < numberOfBars; i++) {
						series.data[i].remove(false, true);
						mustRedraw = true;
					}

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

				}
			};
		};
})(window.vizard = {});
