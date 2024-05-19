import jwt from 'jsonwebtoken'

export default (req, res, next) => {
    const token = (req.headers.authorization || '').replace(/Bearer\s?/,'');
    console.log(token);

    if(token) {
        try {
            const decoded = jwt.verify(token, 'secret');
            req.userId = decoded._id;
            next();
        } catch (e) {
            return res.status(400).json({
                message: 'Нет доступа'
            })
        }

    } else {
        return res.status(403).json({
            message: 'Нет доступа'
        })
    }
}