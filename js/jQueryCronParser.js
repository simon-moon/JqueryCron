(function($){

  $.fn.jQueryCronParser = function(inputContainer, outputContainer) {
    var 
      monthMap = [
          'null','January','February','March','April','May','June','July','August','September','October','November','December'
      ],
      weekMap = [
          'null','Mondays','Tuesdays','Wednesdays','Thursdays','Fridays','Saturdays','Sundays'
      ],
      weekLookup = [
          'null','mon','tue','wed','thu','fri','sat','sun'
      ],
      monthLookup = [
          'null','jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'
      ];

    var textReader = function () {
      function clean(text) {
        var lines = text.split('\n'),
            result = '';
        for (var i in lines) {
            var line = $.trim(lines[i]).replace(/\t/g," ").replace(/\s+/g," ");
            if (line.substr(0,1) !== '#') {
                result += line + '\n';
            }
        }
        return result;
      }
      return {
        clean : clean
      }
    }();

    var cronParser = function () {
      var separator = ', ';
      function getCollection(value) {
        try {
            var collection = value.split(',');
            return collection;
        } catch (e) {
            return null;
        }
      }

      function getRange(value, min, max) {
        if (value == '*') {
            return [min, max];
        }
        var range = value.split('-');
        return range;
      }

      function getStep(value) {
        var step = value.split('/');
        return step;
      }

      function parseMin(min) {
        if (min === '*') {
            return 'every minute';
        }
        var result = '';
        result += parseDo(min, 0, 59);
        return result;
      }

      function lookupValue(value, lookup) {
        if (value == parseInt(value) || !lookup ) {
            return value;
        }
        return lookup.indexOf(value);
      }

      function parseDo(value, min, max, map, lookup) {
        var stepCollection = getCollection(value);
        if (stepCollection === null) {
            return null;
        }
        var collection = [];
        for (var i in stepCollection) {
            var step = getStep(stepCollection[i]),
                stepSize = parseInt(step[1]);
            if (!stepSize || stepSize <= 0) {
                stepSize = 1;
            }
            var range = getRange(step[0], min, max);
            if (range.length > 1) {
                var start = parseInt(lookupValue(range[0], lookup)),
                    end = parseInt(lookupValue(range[1], lookup));
                for (var r = start; r <= end && r <= max; r+=stepSize) {
                    collection.push(r);
                }
            } else {
                collection.push(lookupValue(range[0], lookup));
            }
        }
        collection.sort(function (a, b) {return b-a; });
        collection = $.unique(collection);
        var result = '';
        for (var i in collection) {
            if (map) {
                result += map[collection[i]];
            } else {
                result += collection[i];
            }
            result += separator;
        }
        return result.substring(0, result.length-separator.length);
      }

      function parseHour(hour) {
        if (hour === '*') {
            return 'every hour';
        }
        return parseDo(hour, 0, 23);;
      }

      function parseDayOfMonth(dayOfMonth) {
        if (dayOfMonth === '*') {
            return '*';
        }
        return parseDo(dayOfMonth, 1, 31);;
      }

      function parseMonth(month) {
        if (month === '*') {
            return '*';
        }
        return parseDo(month, 1, 12, monthMap, monthLookup);
      }

      function parseDayOfWeek(dayOfWeek) {
        if (dayOfWeek === '*') {
            return '*';
        }
        return parseDo(dayOfWeek, 1, 7, weekMap, weekLookup);
      }

      function padTime(number) {
        var str = '' + number;
        while (str.length < 2) {
            str = '0' + str;
        }
        return str;
      }

      function unpadTime(paddedString) {
        return parseInt(paddedString, 10);
      }

      function process(line) {
        var data = line.split(' '),
            minute = data[0],
            hour = data[1],
            day_of_month = data[2],
            month = data [3],
            day_of_week = data[4],
            command = '',
            next_run = new Date();
        for (var i = 5; i < data.length; i++) {
            command += data[i] + ' ';
        }
        command = command.substring(0, command.length - 1);
        var stringMinute = parseMin(minute),
            stringHour = parseHour(hour),
            stringDayOfMonth = parseDayOfMonth(day_of_month),
            stringMonth = parseMonth(month),
            stringDay = parseDayOfWeek(day_of_week),
            errorColumns = '';
        if (!stringMinute || stringMinute == "undefined") errorColumns += 'minute entry' + separator;
        if (!stringHour || stringHour == "undefined") errorColumns += 'hour entry' + separator;
        if (!stringDayOfMonth || stringDayOfMonth == "undefined") errorColumns += 'day of month entry' + separator;
        if (!stringMonth || stringMonth == "undefined") errorColumns += 'month entry' + separator;
        if (!stringDay || stringDay == "undefined") errorColumns += 'day entry' + separator;

        if (errorColumns.length > 0) {
            errorColumns = errorColumns.substring(0, errorColumns.length-separator.length);
            return {
                msg: 'There is an error in line "'+line+'"<br/>near ' + errorColumns,
                error: true
            }
        }
        var result = '';
        if (stringMonth != '*') {
            result += 'in ' + stringMonth;
            result += ', on ';
        }
        if (stringMonth == '*' && stringDayOfMonth != '*') {
            result += 'every month on ';
        }
        if (stringDayOfMonth == '*') {
            if (stringDay == '*') {
                result += 'every day ';
            }
        } else {
            var days = stringDayOfMonth.split(separator);
            result += 'the ';
            for (var i in days) {
                var val = days[i];
                if (val == 1) {
                    result += val + 'st' + separator;
                } else if (val == 2) {
                    result += val + 'nd' + separator;
                } else if (val == 3) {
                    result += val + 'rd' + separator;
                } else {
                    result += val + 'th' + separator;
                }
            }
            result = result.substring(0, result.length - separator.length) + ' ';
        }
        if (stringDay != '*') {
            if (stringDayOfMonth != '*') {
                result += 'and on ';
            }
            result += stringDay + ' ';
        }
        var hourCollection = stringHour.split(','),
            minCollection = stringMinute.split(',');
        if (hourCollection.length > 1 || parseInt(hourCollection[0]) == hourCollection[0]) {
            if (minCollection.length > 1 || parseInt(minCollection[0]) == minCollection[0]) {
                result += 'at ';
                for (var h in hourCollection) {
                    for (var m in minCollection) {
                        result += padTime($.trim(hourCollection[h]))
                            + ':' + padTime($.trim(minCollection[m])) + separator;
                    }
                }
                result = result.substring(0, result.length-separator.length) + ' ';
            } else {
                result += 'on ' + stringMinute + ' when hour is (';
                for (var h in hourCollection) {
                    result += padTime($.trim(hourCollection[h])) + separator;
                }
                result = result.substring(0, result.length - separator.length);
                result += ') ';
            }
        } else {
            if (minCollection.length > 1) {
                result += 'on ' + stringHour + ' when minute equals one of (';
                for (var m in minCollection) {
                    result += padTime($.trim(minCollection[m])) + separator;
                }
                result = result.substring(0, result.length - separator.length);
                result += ') ';
            } else {
                if (parseInt(unpadTime(stringHour)) == stringHour && parseInt(stringMinute) == stringMinute) {
                    result += 'on ' + stringHour + ':' +  padTime(stringMinute);
                } else if (parseInt(stringMinute) == stringMinute){
                    result += 'on ' + stringHour + ' when minute equals ' + padTime(stringMinute);
                } else {
                    result += 'on ' + stringHour + ' on ' + stringMinute;
                }
            }
        }
      return  {
          time : result,
          command: command
        };
      }
      return {
        process: process
      }
    }();

    var lineValidator = function(line) {
      return (
          line.toUpperCase().indexOf('MAILTO') !== 0
          && line.toUpperCase().indexOf('PATH') !== 0
          && line.toUpperCase().indexOf('SHELL') !== 0
          && line.toUpperCase().indexOf('HOME') !== 0
          && line.toUpperCase().indexOf('LOGNAME') !== 0
          && line.length > 0
      );
    }

    var parseCron = function(inputContainer, outputContainer) {
      var text = textReader.clean($(inputContainer).val()),
          lines = text.split('\n'),
          result = '';
      for (var i in lines) {
        var line = $.trim(lines[i]);
        if (lineValidator(line)) {
            var lineInfo = cronParser.process(line);
            if (lineInfo.error) {
                result += '<div class="error">' + lineInfo.msg + '</div>';
            } else {
                result += '<tr><td>"<strong>' + lineInfo.command + '</strong>"</td>\n';
                result += '<td>' + lineInfo.time + '</td></tr>\n';
                
            }
        }
      }
      $(outputContainer).append(result);
    }

    var setListeners = function(button, inputContainer, ouputContainer) {
      $(button).bind('click', function() {
        parseCron(inputContainer, outputContainer);
      });
    }

    return this.each(function() {
      setListeners(this, inputContainer, outputContainer);
    });
  };

})(jQuery);