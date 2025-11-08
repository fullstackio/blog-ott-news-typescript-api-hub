const express = require('express');
const router = express.Router();

const { sendWelcomeMail } = require('../../controllers/mailControllers/welcomeMail.controller');
const { sendThankYouMail } = require('../../controllers/mailControllers/thankyouMail.controller');

router.route('/').get((req:any, res:any)=>{
  res.send('Welcome to Blog & News OTT Service');
})

router.route('/send-welcome-mail').post(sendWelcomeMail);
router.route('/send-thenkyou-mail').post(sendThankYouMail);

export default router;