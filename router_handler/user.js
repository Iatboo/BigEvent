/**
 * 在这里定义和用户相关的路由处理函数，供 /router/user.js 模块进行调用
 */

// 导入数据库模块
const db = require('../db/index');

// 导入密码加密模块
const bcrypt = require('bcryptjs');

// 注册新用户的处理函数
exports.regUser = (req, res) => {

    // 接收表单数据
    const userInfo = req.body;

    // 判断数据是否合法
    if (!userInfo.username || !userInfo.password) {
        return res.send({
            status: 1,
            message: '用户名或密码不能为空！'
        })
    }

    // 定义sql语句
    const sql = 'select * from en_users where username=?';

    // 执行sql语句并根据结果判断用户名是否被占用
    db.query(sql, [userInfo.username], (err, results) => {
        // 执行语句失败
        if (err) {
            return res.send({
                status: 1,
                message: err.message
            });
        }

        // 用户名被占用
        if (results.length > 0) {
            return res.send({
                status: 1,
                message: '用户名被占用，请更换其它用户名！'
            });
        }

        // 用户名可用
        // 对用户的密码,进行 bcrypt 加密，返回值是加密之后的密码字符串
        userInfo.password = bcrypt.hashSync(userInfo.password, 10);

        // 定义插入新用户的sql语句
        const sqlStr = 'insert into en_users set ?';
        
        db.query(sqlStr, { username: userInfo.username, password: userInfo.password }, (err, results) => {
            // 执行 sql 语句失败
            if (err) {
                /* return res.send({
                    status: 1,
                    message: err.message
                }) */
                return res.cc(err);
            }
            // sql语句执行成功，但影响行数不为1
            if (results.affectedRows !== 1) {
                /* return res.send({
                    status: 1,
                    message: '注册用户失败，请稍后再试！'
                }); */
                return res.cc('注册用户失败，请稍后再试！');
            }
            // 注册成功
            /* res.send({
                status: 1,
                message: '注册成功！'
            }) */
            res.cc('注册成功！', 0);
        })
    })

}

// 登录的处理函数
exports.login = (req, res) => {

    const userinfo = req.body;

    console.log('userinfo - ', userinfo);

    const sqlStr = 'select * from en_users where username = ?';

    db.query(sqlStr, userinfo.username, (err, results) => {
        // 执行 SQL 语句失败
        if (err) {
            return res.cc(err);
        }

        // 执行 SQL 语句成功，但是查询到数据条数不等于 1
        if (results.length !== 1) {
            return res.cc('登录失败！')
        }

        // 拿着用户输入的密码,和数据库中存储的密码进行对比
        const compareResult = bcrypt.compareSync(userinfo.password, results[0].password);

        // 如果对比的结果等于 false, 则证明用户输入的密码错误
        if (!compareResult) {
            return res.cc('登录失败！')
        }

        // 在生成 Token 字符串的时候，一定要剔除 密码 和 头像 的值
        // 剔除完毕之后，user 中只保留了用户的 id, username, nickname, email 这四个属性的值
        const user = { ...results[0], password: '', user_pic: '' };

        // 用这个包来生成 Token 字符串
        const jwt = require('jsonwebtoken');

        // 导入配置文件
        const config = require('../config');

        // 生成Token字符串
        const tokenStr = jwt.sign(user, config.jwtSecretKey, { expiresIn: config.expiresIn});

        // 将生成的 Token 字符串响应给客户端
        res.send({
            status: 0,
            message: '登陆成功！',
            // 为了方便客户端使用 Token，在服务器端直接拼接上 Bearer 的前缀
            token: 'Bearer ' + tokenStr
        })
    })
}