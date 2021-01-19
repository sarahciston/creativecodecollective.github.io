const express = require("express");
const app = express();
const pug = require('pug');
const fs = require('fs');
const PouchDB = require('pouchdb');
PouchDB.plugin(require('pouchdb-find'));

app.set('view engine', 'pug');
app.use(express.static("public"));

app.get("/", function (req, res) {
  res.render('index', { title: 'Creative Code Collective' });
})

const TempPouchDB = PouchDB.defaults();
app.use('/db', require('express-pouchdb')(TempPouchDB));
const db = new PouchDB("database");

let tags = {think: new Set(), use: new Set(), make: new Set()};

// make all the files in 'public' available
// https://expressjs.com/en/starter/static-files.html

function getResources(query) {
  // filter out empty key-value pairs
  let selector = {};
  for (let key in query) {
    if (query[key] !== '') { // if not empty
      selector[key] = { "$elemMatch": query[key] };
    }
  }
  
  if (Object.keys(selector).length === 0 && selector.constructor === Object) {
    // empty query -> get all docs
    return db.allDocs({
      include_docs: true
    }).then(result => {
      return result.rows.map(result => result.doc);
    }).catch(err => {
      return Promise.reject(new Error(err));
    });
  } else {
    // non-empty query -> get specified docs
    return db.createIndex({
      index: { fields: Object.keys(selector) }
    }).then(result => {
      return db.find({
        selector: selector
      });
    }).then(result => {
      return result.docs;
    }).catch(err => {
      return Promise.reject(new Error(err));
    });
  }
}

app.get('/resources', function (req, res) {
  // no keys in query: not a search
  if (Object.keys(req.query).length === 0 && req.query.constructor === Object) {
    getResources({think: "", use: "", make: ""})
      .then(result => {
        // add all document tags to set of tags
        for (let doc of result) {
          for (let field of ["think", "use", "make"]) {
            doc[field].forEach(item => tags[field].add(item));
          }
        }
        console.log(tags);
      }).catch(err => console.log(err));
    res.render('resources', {
      title: 'Resources',
      results: null,
      tags: tags
    });
  } else {
    getResources(req.query)
      .then(result => {
        res.render('resources', {
          title: 'Resources',
          results: result,
          tags: tags
        });
        console.log(req.query);
      })
      .catch(err => {
        res.render('resources', {
          title: 'Resources',
          results: null,
          tags: tags
        });
        console.log(err);
      });
  }
});

//get info about the database, number of documents, etc
app.get('/db_info', function(req, res){
  db.info()
    .then(function(r) {
      console.log(r);
      res.send(r);
    }).catch(function(err){
      console.error(err)
    });
})

//find all database documents
app.get('/db_all', function(req, res){
  var docs = []
  var ids = []
  db.allDocs({ include_docs: true }) //{attachments:true})
    .then(function(result) {
      // result = result.rows.map(result => result.id)
      docs.push(result.rows)
      return docs
    })
    .then(function(all){
      console.log(all);
      res.send(all)
    })
    .catch(function(err) {
      console.log("err: " + err);
    });
});

//delete IDs
app.get('/delete_all', function(req, res){
  var docs = []
  var ids = []
  db.allDocs() //db.allDocs({attachments:true})
    .then(function(result) {
      ids = result.rows.map(result => result.id)
      console.log(ids);
      return ids;
    })
    .then(function(ids){
      for (var i = 0; i < ids.length; i++ ){
        db.get(ids[i]).then(function(doc){
          console.log(ids[i], 'done');
          return db.remove(doc);
    }).catch(function(err){console.log(err)});  
  }});
});

//bulkAdd
app.get('/bulk_add', function(req, res) {
  let cleanData = fs.readFileSync("resources/bulkAdd.json"); 
  cleanData = JSON.parse(cleanData);
  for (let doc of cleanData) {
    doc._id = doc.title.toLowerCase().split(" ").join("-");
  }
  // console.log(cleanData);
  
  db.bulkDocs(cleanData)
    .then(function(r){
      console.log(r)
      res.send(r)
  }).catch(err=>{console.log(err)}) 
})

// listen for requests :)
const listener = app.listen(process.env.PORT, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
