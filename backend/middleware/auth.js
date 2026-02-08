import jwt from 'jsonwebtoken';

const secret = process.env.JWT_SECRET;



function authen_middle_ware(req, res, next) {
    const token = req.get('authen_token');

    try {
        const decode = jwt.verify(token, secret);
        if (decode) {
            req.userId = decode.userId;
            next();
        }

    } catch (error) {
        res.json({
            message: "Incorrect credentials, invalid token"
        })
    }

}

export default authen_middle_ware;