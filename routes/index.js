const express = require("express");
const router = express.Router();
const User = require('../shared/models/User');

router.get("/", (req, res) => {
    res.send({ response: "I am alive" }).status(200);
});

//set route for oauth
router.post('/auth/confirmation', (req, res) => {
    console.log(req.body)
    res.send({response: "Thankyou"});

});

//set route for reqistering users
router.post('/register/user', (req, res) => {
    console.log(typeof(req.body.accounts))
    const user = req.body;
    //create user into the db
    if(user){
        User.create(user, function(err, data){
            if(err){
                console.log(err)
                res.send({response: "Error Saving user to the db", status: 500});
            } else {
                res.send({response: data, status: 200});
            }
        });
    } else {
        res.send({response: 'Empty payload received for user object', status: 200})
    }
});

module.exports = router;