# Jquery Cron Parser
### A jQuery Plugin that parses crontab commands and outputs their scheduled times to a table
Frist, Load the plugin on the page after jQuery
#### Example:
```html
<script src="https://ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js"></script>
<script src="js/jQueryCronParser.js"></script>
```
Then, simply call the jQueryCronParser method on an element, passing in the input element and the output element
#### Example:
```javascript
 $('#button').jQueryCronParser('#input','#output');
```
note: output element should be a table and input should be a textarea


