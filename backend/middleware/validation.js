const Joi = require('joi');

/**
 * * @param {object} schemas - Objek berisi skema Joi
 * @param {Joi.Schema} [schemas.body] - Skema untuk req.body
 * @param {Joi.Schema} [schemas.params] - Skema untuk req.params
 * @param {Joi.Schema} [schemas.query] - Skema untuk req.query
 */
const validate = (schemas) => (req, res, next) => {
    
    const options = { abortEarly: false };
    
    let allErrors = [];

    if (schemas.params) {
        const { error, value } = schemas.params.validate(req.params, options);
        if (error) {
            allErrors.push(...error.details);
        } else {
            req.params = value; 
        }
    }

    if (schemas.body) {
        const { error, value } = schemas.body.validate(req.body, options);
        if (error) {
            allErrors.push(...error.details);
        } else {
            req.body = value; 
        }
    }

    if (schemas.query) {
        const { error, value } = schemas.query.validate(req.query, options);
        if (error) {
            allErrors.push(...error.details);
        } else {
            req.query = value; 
        }
    }

    if (allErrors.length > 0) {
        const errors = allErrors.map(detail => ({
            message: detail.message.replace(/["']/g, ''),
            field: detail.context.key,
            location: detail.path[0] 
        }));
        
        return res.status(400).json({ 
            message: "Data yang dikirim tidak valid.",
            errors 
        });
    }

    next();
};

module.exports = validate;