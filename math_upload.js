const admin = require('./node_modules/firebase-admin');
const serviceAccount = require("./node_modules/service-key.json");
const csv=require('csvtojson');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://marwin-linebot.firebaseio.com"
});

let runUpload = async () => {
  let data = await csv().fromFile('testbank_math.csv');
  let db = admin.firestore();
  let batch = db.batch();

  for (let i = 0; i < data.length; i++) {
    let d = data[i];
    let ref = db.collection('sat-math-questions').doc(d['question_id']);
    batch.set(ref, {
      source: d['Source'],
      description: d['Description'],
      question: d['Question'],
      A: d['A'],
      B: d['B'],
      C: d['C'],
      D: d['D'],
      correct_choice: d['Correct Choice'],
      answer: d['Answer'],
    });      
  }

  await batch.commit();
};


runUpload();
