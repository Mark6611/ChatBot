const functions = require('firebase-functions');
const request = require('request-promise');
const admin = require('firebase-admin');

const LINE_MESSAGING_API = 'https://api.line.me/v2/bot/message';
const LINE_HEADER_MATH = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer juLaPeF10ZMgrOcSFrptXy2knyFl0jl81whHoACYZyKHFqgvpnHix1H0Hhvubr7SABSCkTnL1CVifdtCgo8jC24l17a0nMCkN04alef29b1fr0vuZlx/fThmC9YDjZ0+dbPi1PYlNWZ77nBBpFyg+gdB04t89/1O/w1cDnyilFU=`
};

const LINE_HEADER_ENGLISH = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer 04QgCP6d5alXC9gDTWOB44Z842BQucV9wlt9laWok+iekEQ7974RestGnGvIWQWfqOn4Wf0DruXwVUM5L094FQWzisFPAZ6CC1hfvktqRBY2edKljP0ib0DQUwVj5F+ABKok/V32mrrt0I2J3MrfJQdB04t89/1O/w1cDnyilFU=`
}

admin.initializeApp(functions.config().firebase);
let db = admin.firestore();

exports.MathReplyBot = functions.https.onRequest(async (req, res) => {

  if (req.body.events[0].type == 'follow') {

    let userId = req.body.events[0].source.userId;
    let replyToken = req.body.events[0].replyToken;
    let today = new Date();
    let id = 'm' + today.toISOString().substring(0,10).replace('-', '').replace('-', '');
    let doc = await db.collection('sat-math-questions').doc(id).get();

    mathReplyImage(replyToken, doc.data().question);
    res.status(200).send('ok');
    return;
  }


  if (req.body.events[0].message.type != 'text') {
    res.status(200).send('ok');
    return;
  }

  // Get data from Line input message
  let userId = req.body.events[0].source.userId;
  let replyToken = req.body.events[0].replyToken;

  if (replyToken === '00000000000000000000000000000000') {
    res.status(200).send('ok');
    return;    
  }

  // Retrieve User Profile. Create a user profile if not exists 
  let userProfile = await db.collection('math-users').doc(userId).get();
  if (!userProfile.exists) {
    await db.collection('math-users').doc(userId).set({
      userId: userId
    });

    userProfile = await db.collection('math-users').doc(userId).get()
  } 
  userProfile = userProfile.data(); 

  // Create today's question ID 
  let today = new Date();
  let questionId = 'm' + today.toISOString().substring(0,10).replace('-', '').replace('-', '');

  // User is answering A,B,C,D and user has already answered this question before.
  let text = req.body.events[0].message.text;
  let isUserAnsweringQuestion = text === 'A' || text === 'B' || text === 'C' || text === 'D';
  if (isUserAnsweringQuestion) {
    if (userProfile[questionId] !== undefined) {
      mathReply(replyToken, 'you have already answered today\'s question');
      res.status(200).send('ok');
      return;
    }
  } 

  let todayQuestion = (await db.collection('sat-math-questions').doc(questionId).get()).data();

  // Case 1: User is answering A,B,C,D
  if (isUserAnsweringQuestion) {
    mathReply(replyToken, todayQuestion[text]);
    await db.collection('math-users').doc(userId).update({
      [questionId]: text === todayQuestion.correct_choice
    });
  }
  // Case 2: Explanation
  else if (text === 'Please explain the answer to me! :(') {
    if (userProfile[questionId] !== undefined) {
      mathReplyImage(replyToken, todayQuestion.answer);
    }
    else {
      mathReply(replyToken, 'At least try to answer the question first before asking for explanation :(');
    }
    
  }
  // Case 3: Score
  else if (text === 'Show me my score!') {
    let past_answers = (await db.collection('math-users').doc(userId).get()).data();
    let total = 0; 
    let correct = 0;
    for (prop in past_answers) {
      if (prop !== 'userId') {
        total++;
        if (past_answers[prop]) {
          correct++;
        }
      }
    }
    mathReply(replyToken, 'You score is ' + correct + '/' + total);
  }
  // Other cases
  else {
    mathReply(replyToken, 'Here are the options to answer\n1. Type one of the following: A, B, C, D.\n2.Type Explanation \n3.Type Score')
  }

  res.status(200).send('ok');
});

exports.EnglishReplyBot = functions.https.onRequest(async (req, res) => {

  if (req.body.events[0].type == 'follow') {

    let userId = req.body.events[0].source.userId;
    let replyToken = req.body.events[0].replyToken;
    let today = new Date();
    let id = 'e' + today.toISOString().substring(0,10).replace('-', '').replace('-', '');
    let doc = await db.collection('sat-english-questions').doc(id).get();

    englishReplyImage(replyToken, doc.data().question);
    res.status(200).send('ok');
    return;
  }

  if (req.body.events[0].message.type != 'text') {
    res.status(200).send('ok');
    return;
  }
  console.log(req.body);

  // Get data from Line input message
  let userId = req.body.events[0].source.userId;
  let replyToken = req.body.events[0].replyToken;
  if (replyToken === '00000000000000000000000000000000') {
    res.status(200).send('ok');
    return;    
  }
  // Retrieve User Profile. Create a user profile if not exists 
  let userProfile = await db.collection('english-users').doc(userId).get();
  if (!userProfile.exists) {
    await db.collection('english-users').doc(userId).set({
      userId: userId
    });
    userProfile = await db.collection('english-users').doc(userId).get()
  } 
  userProfile = userProfile.data(); 

  // Create today's question ID 
  let today = new Date();
  let questionId = 'e' + today.toISOString().substring(0,10).replace('-', '').replace('-', '');

  // User is answering A,B,C,D and user has already answered this question before.
  let text = req.body.events[0].message.text;
  let isUserAnsweringQuestion = text === 'A' || text === 'B' || text === 'C' || text === 'D';
  if (isUserAnsweringQuestion) {
    if (userProfile[questionId] !== undefined) {
      englishReply(replyToken, 'You have already answered today\'s question');
      res.status(200).send('ok');
      return;
    }
  } 

  let todayQuestion = (await db.collection('sat-english-questions').doc(questionId).get()).data();

  // Case 1: User is answering A,B,C,D
  if (isUserAnsweringQuestion) {
    englishReply(replyToken, todayQuestion[text]);
    await db.collection('english-users').doc(userId).update({
      [questionId]: text === todayQuestion.correct_choice
    });
  }
  // Case 2: Explanation
  else if (text === 'Please explain the answer to me! :(') {
    if (userProfile[questionId] !== undefined) {
      englishReplyImage(replyToken, todayQuestion.answer);
    }
    else {
      englishReply(replyToken, 'At least try to answer the question first before asking for an explanation :(');
    }
    
  }
  // Case 3: Score
  else if (text === 'Show me my score!') {
    let past_answers = (await db.collection('english-users').doc(userId).get()).data();
    let total = 0; 
    let correct = 0;
    for (prop in past_answers) {
      if (prop !== 'userId') {
        total++;
        if (past_answers[prop]) {
          correct++;
        }
      }
    }
    englishReply(replyToken, 'You score is ' + correct + '/' + total);
  }
  // Other cases
  else {
    englishReply(replyToken, 'Here are the options to answer\n1. Type one of the following: A, B, C, D.\n2.Type Explanation \n3.Type Score')
  }

  res.status(200).send('ok');
});

exports.MathBroadcast = functions.https.onRequest(async (req, res) => {
  let today = new Date();
  let id = 'm' + today.toISOString().substring(0,10).replace('-', '').replace('-', '');
  db.collection('sat-math-questions').doc(id).get()
    .then(doc => {
      mathBroadcast(res, doc.data().question);
    });
});

exports.EnglishBroadcast = functions.https.onRequest(async (req, res) => {
  let today = new Date();
  let id = 'e' + today.toISOString().substring(0,10).replace('-', '').replace('-', '');
  db.collection('sat-english-questions').doc(id).get()
    .then(doc => {
      englishBroadcast(res, doc.data().question);
    });
});


const mathReply = (replyToken, text) => {
  return request({
    method: `POST`,
    uri: `${LINE_MESSAGING_API}/reply`,
    headers: LINE_HEADER_MATH,
    body: JSON.stringify({
      replyToken: replyToken,
      messages: [
        {
          type: `text`,
          text: text
        }
      ]
    })
  });
};

const englishReply = (replyToken, text) => {
  return request({
    method: `POST`,
    uri: `${LINE_MESSAGING_API}/reply`,
    headers: LINE_HEADER_ENGLISH,
    body: JSON.stringify({
      replyToken: replyToken,
      messages: [
        {
          type: `text`,
          text: text
        }
      ]
    })
  });
};

const mathReplyImage = (replyToken, msg) => {
  return request({
    method: `POST`,
    uri: `${LINE_MESSAGING_API}/reply`,
    headers: LINE_HEADER_MATH,
    body: JSON.stringify({
      replyToken: replyToken,
      messages: [
        {
          type: `image`,
          "originalContentUrl": msg,
          "previewImageUrl": msg
        }
    ]
    })
  });
};

const englishReplyImage = (replyToken, msg) => {
  return request({
    method: `POST`,
    uri: `${LINE_MESSAGING_API}/reply`,
    headers: LINE_HEADER_ENGLISH,
    body: JSON.stringify({
      replyToken: replyToken,
      messages: [
        {
          type: `image`,
          "originalContentUrl": msg,
          "previewImageUrl": msg
        }
    ]
    })
  });
}; 

const mathBroadcast = (res, msg) => {
  return request({
    method: `POST`,
    uri: `${LINE_MESSAGING_API}/broadcast`,
    headers: LINE_HEADER_MATH,
    body: JSON.stringify({
      messages: [
        {
          type: "image",
          "originalContentUrl": msg,
          "previewImageUrl": msg
        }
      ]
    })
  }).then(() => {
    const ret = { message: 'Done' };
    return res.status(200).send(ret);
  }).catch((error) => {
    const ret = { message: `Sending error: ${error}` };
    return res.status(500).send(ret);
  });
}

const englishBroadcast = (res, msg) => {
  return request({
    method: `POST`,
    uri: `${LINE_MESSAGING_API}/broadcast`,
    headers: LINE_HEADER_ENGLISH,
    body: JSON.stringify({
      messages: [
        {
          type: "image",
          "originalContentUrl": msg,
          "previewImageUrl": msg
        }
      ]
    })
  }).then(() => {
    const ret = { message: 'Done' };
    return res.status(200).send(ret);
  }).catch((error) => {
    const ret = { message: `Sending error: ${error}` };
    return res.status(500).send(ret);
  });
}
