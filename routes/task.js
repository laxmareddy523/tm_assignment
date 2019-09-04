
const express = require('express');
const app = express();

const csv = require('csvtojson');
const mongoClient = require('mongodb').MongoClient,
  assert = require('assert');

const server = app.listen(7600, (err, callback) => {
  if (err) {
    console.log(err);
  } else {
    console.log('Your nodejs server running on port 7600');
  }
});

const url = 'mongodb://localhost:27017/tm_db';



mongoClient.connect(url, (err, db) => {
  assert.equal(null, err);

  console.log("Connected correctly to server");

  insertDocuments(db, function () {
    db.close();
  });
});


const insertDocuments = (db, callback) => {
  let collection = db.collection('task');
  const csvFilePath = '../csv_files/task.csv';
  csv()
    .fromFile(csvFilePath)
    .on('csv', (csvRow) => {
      csvRow.forEach(function (element) {
        collection.insertOne({ task_id: element ,skill:element}, (err, result) => {
          if (err) {
            console.log(err);
          } else {
            callback(result);
          }
        });
      }, this);
    })
    .on('done', (error) => {
      console.log('end')
    });
}