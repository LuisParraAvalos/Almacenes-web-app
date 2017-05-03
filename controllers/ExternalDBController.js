//Imports
var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

var ExternalDBController = function(name, data) {
    this.name = name;
    this.data = data;

    this.createDB = function(callback)
    {
        //Conect to mongo
        var mongoDB = 'mongodb://127.0.0.1/' + this.name;
        var db = mongoose.createConnection();

        var dataTemp = this.data;
        db.open('localhost', this.name);

        if (typeof mySchema == "undefined") {
            //Create the Scheme
            cad = "mySchema";
            cad += " = new Schema({ ";

            for (i in dataTemp[0])
            {
                cad += i + ": String, ";
            }
            cad += "});";
            eval(cad);
        }

        DataM = db.model('Data', mySchema);
        contador = 0;

        for (i in dataTemp)
        {
            var myDataM = new DataM(dataTemp[i]);

            myDataM.save(function(error) {
                if (error) {
                    console.log(error);
                    return error;
                }

                contador++;

                if (contador == dataTemp.length-1)
                {
                    console.log("Database Creada")
                    db.close();
                    callback();
                }
            });
        }
    }

    this.getData = function(name, jsonData, atributos, fn)
    {
        //Conect to mongo
        var mongoDB = 'mongodb://127.0.0.1/' + name;
        var db = mongoose.createConnection();

        var dataTemp = this.data;
        db.open('localhost', name);
        schemeJson = {};

        for (i = 0; i < atributos.length; i++)
        {
            schemeJson[atributos[i]] = String;
        }

        mySchema = new Schema(schemeJson);

        DataM = db.model('Data', mySchema);

        DataM.find(jsonData, function(error, docs) {
            db.close();
            fn(docs);
        });
    }

};

module.exports = ExternalDBController;