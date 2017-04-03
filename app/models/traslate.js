// app/models/nerd.js
// grab the mongoose module
tras = require('node-google-translate-skidz');

module.exports = {
	traslate: function(texto){
		tras({
		  	text: texto,
		  	source: 'es',
		  	target: 'en'
		}, function(result) {
		  	return result;
		});
	}
}
