/**
 * Module dependencies.
 */

var express    = require('express');
var multer     = require('multer');
var router     = express.Router();
var file       = require('./controllers/FileController');
var temp       = require('./controllers/TempController');
var dbTemp     = require('./controllers/DBController');
var extern     = require('./controllers/ExternalDBController');
var http       = require('http');
var formidable = require('formidable');
var fs         = require('fs');
var path       = require('path');
var url        = require('url');
const csv      = require('csvtojson');
var xml2js     = require('xml2js');
var xlsxj      = require("xlsx-to-json");
var xml2json   = require('xml2json');
var mongoose   = require('mongoose');
var Schema     = mongoose.Schema;
var bodyParser = require('body-parser')
var jsonfile   = require('jsonfile')
var DatabaseCleaner = require('database-cleaner'); 
var databaseCleaner = new DatabaseCleaner('mongodb');

var app = module.exports = express();
app.engine('.html', require('ejs').__express);
app.set('views', __dirname + '/views');
app.set('view engine', 'html');

app.use(express.static('public'))

app.use( bodyParser.json() );       
app.use(bodyParser.urlencoded({     
  extended: true
})); 

//Ubicaciones del Servidor
app.get('/archivos', function(req, res){
    //Load the files from Mongo
    FileM = mongoose.model('File', file);
    TempM = mongoose.model('Temp', temp);

    /*FileM.remove({}, function(error){

    })

    TempM.remove({}, function(error){
        
    })*/

    FileM.find(function (err, objects){
        //console.log(objects);
        //Put the render file
        var query = url.parse(req.url,true).query;
        res.render('archivos', {
            archivos: objects,
            correcto: query.correcto,
            title: "Subir archivos a la DWH",
            header: "Archivos"
        });
    });
});

//Pagina para procesar
app.post("/procesarArchivos", function(req, res){
	FileM = mongoose.model('File', file);
    TempM = mongoose.model('temp', temp);

    FileM.findOne({"_id": req.body.radio}, function (err, object) {
        TempM = mongoose.model('Temp', temp);
        TempM.find({"file": object._id}, function(err, objects){
            res.render('procesarArchivo', {
                fileid: req.body.radio,
                data: JSON.stringify(objects),
                title: "Subir archivos a la DWH",
                header: "Archivos"
            });
        })
	});
});

app.post("/limpiarDB", function(req, res){
    data = req.body.data;
    
    //Use the Squeme and add data
    DBM = mongoose.model('DB', dbTemp);
    FileM = mongoose.model('File', file);
    var myDB = new DBM({"nombre": req.body.idFile});

    myDB.save(function(error) {
        if (error) {
            return handleError(err);
        }
        else
        {
            FileM.findOneAndUpdate({_id: req.body.idFile}, {$set:{procesado:true}}, {new: false}, function(err) {

                cont = new extern(req.body.idFile, data);
                cont.createDB(function() {

                    /*var connect = require('mongodb').connect;

                    connect('mongodb://localhost/' + req.body.idFile, function(err, db) {
                        databaseCleaner.clean(db, function() {
                            console.log('done');
                            db.close();

                            res.send("Terminado");
                        });
                    });*/

                    res.send("OK");
                });
            });
        }
    });
});

app.get("/dbLimpia", function(req, res){
    var query = url.parse(req.url,true).query;

    dbPos = query.db;
    atrib = query.attr.split(",");

    DBM = mongoose.model('DB', dbTemp);
    DBM.findOneAndUpdate({nombre: dbPos}, {$set:{atributos:atrib}}, {new: false}, function(err){
        cont = new extern();
        cont.getData(dbPos, {}, atrib, function(docs){
            res.render('dbLimpia', {
                data: JSON.stringify(docs),
                title: "Base Limpia",
                header: "Archivos"
            });
        });
    })
})

//Metodo para subir archivos
app.post('/upload', function(req, res) {
    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, files) {

        var date = Date.now();
        var old_path  = files.file.path;;
        var file_size = files.file.size;
        var file_ext  = files.file.name.split('.').pop();
        var new_path  = path.join(process.env.PWD, '/uploads/', date + '.' + file_ext);

        fs.readFile(old_path, function(err, data) {
            fs.writeFile(new_path, data, function(err) {
                fs.unlink(old_path, function(err) {
                    if (err) {
                        res.redirect('/archivos?correcto=false');
                    } else {
                        res.redirect('/parseFile?file=' + date+"&ext="+file_ext+"&type=" + files.file.type);
                    }
                });
            });
        });
    });
});

//Transformar el archivo subido en json
app.get('/parseFile', function(req, res) {
    var query = url.parse(req.url,true).query;

    if (query.type == undefined)
    {
        res.redirect('/archivos?correcto=tipo');
    }
    else if (query.type == "application/json")
    {
        FileM = mongoose.model('File', file);
        var myfile = new FileM({"nombre": query.file, "procesado": false});

        myfile.save(function(error) {
            if (error) {
                return handleError(err);
            }
            else {
                filex  = 'uploads/' + query.file + "." + query.ext;   

                jsonfile.readFile(filex, function(error, result){
                    
                    FileM.findOne({"nombre": query.file}, function (err, object) {
                        if (!err)
                        {
                            for (var i in result)
                            {
                                TempM = mongoose.model('Temp', temp);
                                var mytemp = new TempM({"file": object._id, "object": result[i]});

                                mytemp.save(function(error) {
                                    if (error) {
                                        return handleError(err);
                                    }
                                });
                            }

                            res.redirect('/archivos?correcto=true');
                        }
                    });
                });
            }
        });

        //res.redirect('/saveFile?file=' + query.file);
    }
    else if (query.type == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    {
        FileM = mongoose.model('File', file);
        var myfile = new FileM({"nombre": query.file, "procesado": false});

        myfile.save(function(error) {
            if (error) {
                return handleError(err);
            }
            else {
                filex  = 'uploads/' + query.file + "." + query.ext;   

                xlsxj({
                    input: filex, 
                    output: 'uploads/'+query.file+".json"
                }, function(err, result) {
                    if(err) {
                      res.redirect('/archivos?correcto=false');
                    } 
                    else {

                        FileM.findOne({"nombre": query.file}, function (err, object) {
                            if (!err)
                            {
                                for (var i in result)
                                {
                                    TempM = mongoose.model('Temp', temp);
                                    var mytemp = new TempM({"file": object._id, "object": result[i]});

                                    mytemp.save(function(error) {
                                        if (error) {
                                            return handleError(err);
                                        }
                                    });
                                }

                                res.redirect('/archivos?correcto=true');
                            }
                        });
                    }
                });    
            }
        })    
    }
    else if (query.type == "text/xml")
    {
        FileM = mongoose.model('File', file);
        var myfile = new FileM({"nombre": query.file, "procesado": false});

        myfile.save(function(error) {
            if (error) {
                return handleError(err);
            }
            else {
                filex  = 'uploads/' + query.file + "." + query.ext;   

                fs.readFile(filex, function(err, data) {
                    result = JSON.parse(xml2json.toJson(data));

                    FileM.findOne({"nombre": query.file}, function (err, object) {
                        if (!err)
                        {
                            for (var i in result)
                            {
                                if (typeof result == "array" || typeof result == "object")
                                {
                                    for (var j in result[i])
                                    {
                                        if (typeof result == "array" || typeof result == "object")
                                        {
                                            for (var k in result[i][j])
                                            {
                                                TempM = mongoose.model('Temp', temp);
                                                var mytemp = new TempM({"file": object._id, "object": result[i][j][k]});

                                                mytemp.save(function(error) {
                                                    if (error) {
                                                        return handleError(err);
                                                    }
                                                });
                                            }
                                        }
                                        else
                                        {
                                            TempM = mongoose.model('Temp', temp);
                                            var mytemp = new TempM({"file": object._id, "object": result[i][j]});

                                            //console.log(result[i][j]);

                                            mytemp.save(function(error) {
                                                if (error) {
                                                    return handleError(err);
                                                }
                                            });
                                        }
                                    }
                                }
                                else
                                {
                                    TempM = mongoose.model('Temp', temp);
                                    var mytemp = new TempM({"file": object._id, "object": result[i]});

                                    mytemp.save(function(error) {
                                        if (error) {
                                            return handleError(err);
                                        }
                                    });
                                }
                            }

                            res.redirect('/archivos?correcto=true');
                        }
                    });            
                });
            }
        });
    }
    else if (query.type == "text/csv")
    {
        FileM = mongoose.model('File', file);
        var myfile = new FileM({"nombre": query.file, "procesado": false});

        myfile.save(function(error) {
            if (error) {
                return handleError(err);
            }
            else {
                filex  = 'uploads/' + query.file + "." + query.ext;   

                csv().fromFile(filex)
                .on('json',(result) => {
                    FileM.findOne({"nombre": query.file}, function (err, object) {
                        if (!err)
                        {
                            TempM = mongoose.model('Temp', temp);
                            var mytemp = new TempM({"file": object._id, "object": result});

                            mytemp.save(function(error) {
                                if (error) {
                                    return handleError(err);
                                }
                            });
                        }
                    });
                })
                .on('done',(error) => {
                    res.redirect('/archivos?correcto=true');
                });
            }
        });
    }
    else
    {
        fs.unlink(query.file, function(err) {
            res.redirect('/archivos?correcto=tipo');
        });
    }
});

//Guardar la ubicacion de ese JSON en Mongo
app.get('/saveFile', function(req, res){
    var query = url.parse(req.url,true).query;

    if (query.file == undefined)
    {
        res.redirect('/archivos?correcto=false');
    }
    else
    {
        //Save the file in mongo
        FileM = mongoose.model('File', file);
        var myfile = new FileM({"ruta": "uploads/" + query.file + ".json", "nombre": query.file, "procesado": false});

        myfile.save(function(error) {
            if (error) {
                return handleError(err);
            }
            else {
                res.redirect('/archivos?correcto=true');
            }
        })
    }
});

//Empezar el servicio de Express
if (!module.parent) {
  app.listen(3000);
  console.log('Express started on port 3000');
}
