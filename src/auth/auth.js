const jwt = require('jsonwebtoken')
const Engineer = require('../models/engineer')
const Employee = require('../models/employee') 


/* auth middleware for verifying user */
const auth = async (req,res,next) => {
    try{

        // token string have authorization type (bearer) concatenated...remove it using replace function.
        const token = req.header('Authorization').replace('Bearer ','')

        // return parameter object we used for signing jwt token
        const userDetails = jwt.verify(token,process.env.JWT_SECRET)

        //'tokens.token' is way in mongodb to search element in array when index is not known...
        const engineer = await Engineer.findOne({_id:userDetails._id, 'tokens.token':token}) 
        const employee = await Employee.findOne({_id:userDetails._id, 'tokens.token':token})
        
        let user = engineer

        //check if user is employee
        if(employee){
            user = employee
        }

        // if user is not found then user is not authenticated , throw error 
        if(!user){
            throw new Error('User Not authenticated')
        }

        //add properties to request object....
        req.user = user
        req.token = token
        next()
        
    }
    catch(e){
        res.status(401).send({error:e.message})
    }

}

module.exports = auth