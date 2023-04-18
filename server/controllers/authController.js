const User = require('../models/user');
const bcrypt = require('bcrypt');
// create a user
exports.register = async (req,res) =>{
    // hash the password
    const password =  await bcrypt.hash(req.body.password, 5);
    try{
        const user = new User({
            username: req.body.username,
            password: password
        });
        await user.save();
        res.status(201).json({
            duplicate: false
        })
    }
    catch (error){
        if (error.name === 'MongoServerError' && error.code === 11000){
            res.status(201);
            res.send({duplicate : true})
        }
        else
            {
            console.log(error);
            res.status(400).json({
                status: 'fail',
                message: error.message
            });}
    }
};
// logging in
exports.login = async (req,res) =>{
    const {username, password} = req.body;
    try{
        const user = await User.findOne({username});
        if(!user){
            return res.status(401).json({error:"Invalid Username or Passowrd "})
        }
        const isMatch = await user.comparePassword(password);
        if(!isMatch){
            return res.status(401).json({error:"Invalid Username or Passowrd "})

        }
        // implement  coookie
        res.status(200).json({cookie});
    }
    catch(error){
        console.log(error);
        res.status(500).json({error : 'Server Error'});
    }

};