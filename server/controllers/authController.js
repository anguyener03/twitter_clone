const User = require('../models/user');
// create a user
exports.register = async (req,res) =>{
    try{
        const user = new User({
            username: req.body.username,
            password: req.body.password
        });
        await user.save();
        res.status(201).json({
            status: 'successs'
        })
    }
    catch (error){
        res.status(400).json({
            status: 'fail',
            message: error.message
        });
    }
};