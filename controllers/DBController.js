//Imports
var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

//Conect to mongo
var mongoDB = 'mongodb://127.0.0.1/dwh';
mongoose.connect(mongoDB);

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

//Create the Scheme
var tempSchema = new Schema({
    nombre: String,
    atributos: Object
});

//Create the model
/*var TempM = mongoose.model('Temp', tempSchema);*/

/*var mytemp = new TempM({rute: "una pinche ruta"});*/

/*mytemp.save(function(error) {
    if (error) return handleError(err);
})*/

/*TempM.find(function (err, objects){
    console.log(objects);
});
*/
module.exports = tempSchema;