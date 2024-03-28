const joi = require("joi");

function validatefeedbacks(obj)
{
    
    const schema = joi.object({
        comment:joi.string().trim(),
        user_id:joi.number(),
        mail:joi.string().trim()
    })

    return schema.validate(obj)
}


module.exports=validatefeedbacks ;
