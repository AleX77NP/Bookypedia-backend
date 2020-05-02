const router = require('express').Router();
let User = require('../models/user.model');
const {check, validationResult} = require('express-validator');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const auth = require("../middleware/auth");
const nodemailer = require('nodemailer');


router.route('/').get((req, res) => {
    User.find()
    .then(users => res.json(users))
    .catch(err => res.status(400).json('Error:' + err));
});


router.route('/rate/:current').put((req, res) => {
  User.findOne({email:req.params.current}).updateOne({$inc : {rated:1}})
  .then(() => res.json('Book rated!'))
  .catch(err => res.status(400).json('Error:' + err));
});


router.route('/visitedbook/:current').put((req, res) => {
  User.findOne({email:req.params.current}).updateOne({$push : {lastVisited:req.body.isbn}})
  .then(() => res.json('Book added to last visited!'))
  .catch(err => res.status(400).json('Error:' + err));
});

router.route('/markedbook/:current').put((req, res) => {
  User.findOne({email:req.params.current}).updateOne({$push : {markedBooks:req.body.isbn}})
  .then(() => res.json('Book added to bookmarks!'))
  .catch(err => res.status(400).json('Error:' + err));
});

router.route('/removemark/:current').put((req, res) => {
  User.findOne({email:req.params.current}).updateOne({$pull : {markedBooks:req.body.isbn}})
  .then(() => res.json('Bookmark removed!'))
  .catch(err => res.status(400).json('Error:' + err));
});

router.route('/image/:current').put((req, res) => {
  User.findOne({email:req.params.current}).updateOne({$set : {img:req.body.img}})
  .then(() => res.json('Photo added!'))
  .catch(err => res.status(400).json('Error:' + err));
});

router.route('/changepass').put(async(req, res) => {
   let user =  await User.findOne({email: req.body.email});
   let nPassword = Math.random().toString(36).slice(2).slice(0,8);
   try{
     user.update({$set : {password: nPassword}});
     const salt = await bcrypt.genSalt(10);
     user.password =  await bcrypt.hash(nPassword,salt);
     user.save();

     var transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'bookypedia2020@gmail.com',
        pass: 'nativebooky20'
      }
    });
    
    var mailOptions = {
      from: 'bookypedia2020@gmail.com',
      to: user.email,
      subject: 'Password change',
      text: `Thank You for contacting us, ${user.email}. Your new password is ${nPassword}.`+ `\n` + `Greetings, Team Bookypedia.`
    };
    
    transporter.sendMail(mailOptions, function(error, info){
      if (error) {
        console.log(error);
      } else {
        console.log('Email sent: ' + info.response);
      }
    });
    
    res.status(200).json("Password changed successfully!")

   }
   catch(err) {
    console.log(err.message);
    res.status(500).send('Error occured.');
   }

});

router.post('/signup',
[
  check('name', 'Please Enter a Valid First Name').not().isEmpty().
  matches(/^[A-Za-z\s]+$/).withMessage('First name must be alphabetic.'),
  check('surname', 'Please Enter a Valid Last Name').not().isEmpty().
  matches(/^[A-Za-z\s]+$/).withMessage('Surnameame must be alphabetic.'),
  check('email', 'Please Enter a valid email address').isEmail(),
  check('password', 'Please Enter a valid password').isLength({min: 8}).isAlphanumeric()
],

async (req, res) => {
  const errors = validationResult(req);
  if(!errors.isEmpty()) {
    return res.status(400).json({
      errors: errors.array()
    })
  }

   const {
     name,
     surname,
     email,
     password
   } = req.body;
   try {
     let user = await User.findOne({
       email
     });
     if(user) {
       return res.status(400).json({
         msg: 'User already Exists'
       });
     }
     user = new User({
       name,
       surname,
       email,
       password
     });
     const salt = await bcrypt.genSalt(10);
     user.password =  await bcrypt.hash(password,salt);

     await user.save();

     const payload = {
       user: {
         id: user.id
       }
     }
     jwt.sign(
       payload,
       'randomString', {
         expiresIn: '365d'
       },
       (err, token) => {
         if(err) throw err;
         res.status(200).json({
           token,user: {
          name: user.name,
          surname: user.surname,
          email : user.email,
          lastVisited: user.lastVisited,
          bookmarked: user.bookmarked,
          rated: user.rated,
          markedBooks: user.markedBooks,
          img: user.img
          }
         });
       }
     );

     var transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'bookypedia2020@gmail.com',
        pass: 'nativebooky20'
      }
    });
    
    var mailOptions = {
      from: 'bookypedia2020@gmail.com',
      to: email,
      subject: 'Bookypedia registration',
      text: `Thank You for signing up on Bookypedia, ${name} ${surname}. We hope that You will enjoy the app! If You encounter any problems, please contact us on this email address.`+ `\n` + `Greetings, Team Bookypedia.`
    };
    
    transporter.sendMail(mailOptions, function(error, info){
      if (error) {
        console.log(error);
      } else {
        console.log('Email sent: ' + info.response);
      }
    });

   }
    catch(err) {
      console.log(err.message);
      res.status(500).send('Error in Saving.');
    }
  }

);

router.post('/login',
[
check('email', 'Please enter a valid email').isEmail(),
check('password', 'Please enter a valid password').isLength({min: 8}).isAlphanumeric()
],

async(req, res) => {
  const errors = validationResult(req);
  if(!errors.isEmpty()) {
    return res.status(400).json({
      errors: errors.array()
    })
  }
  
  const {email, password} = req.body;
  try {
    let user = await User.findOne({
      email
    });
    if(!user) {
      return res.status(400).json({message: 'User does not exist'});
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if(!isMatch) {
      return res.status(400).json({
        message: 'Incorrect password!'
      });
    }

    const payload = {
      user: {
        id: user.id,
      }
    };

    jwt.sign(
      payload,'secret',
      {
        expiresIn: '365d'
      },
      (err, token) => {
        if(err) throw err;
        res.status(200).json({token,user: {
          name: user.name,
          surname: user.surname,
          email : user.email,
          lastVisited: user.lastVisited,
          bookmarked: user.bookmarked,
          rated: user.rated,
          markedBooks: user.markedBooks,
          img: user.img
        }
        });
      }
    );
   

  }
  catch(e) {
    console.error(e);
      res.status(500).json({
        message: "Server Error"
      });
    }

   }
)


router.get("/me", auth, async (req, res) => {
  try {
    // request.user is getting fetched from Middleware after token authentication
    const user = await User.findById(req.user.id);
    res.json(user);
  } catch (e) {
    res.send({ message: "Error in Fetching user" });
  }
});


module.exports = router;
