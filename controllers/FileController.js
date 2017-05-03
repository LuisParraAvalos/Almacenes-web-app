//Imports
var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

//Conect to mongo
var mongoDB = 'mongodb://127.0.0.1/dwh';
mongoose.connect(mongoDB);

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

//Create the Scheme
var fileSchema = new Schema({
    ruta: String,
    nombre: String,
    procesado: Boolean
});

//Create the model
/*var FileM = mongoose.model('File', fileSchema);*/

/*var myfile = new FileM({rute: "una pinche ruta"});*/

/*myfile.save(function(error) {
    if (error) return handleError(err);
})*/

/*FileM.find(function (err, objects){
    console.log(objects);
});
*/
module.exports = fileSchema;