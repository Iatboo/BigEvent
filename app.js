
// 导入 express 模块
const express = require('express');

// 创建 express 的服务器实例
const app = express();

// 导入 cors 中间件
const cors = require('cors');

// 将 cors 注册全局中间件, 解决跨域资源共享
app.use(cors());            // !!! 这里的cors如果没加括号的话会导致服务启用，但发请求无响应

// 托管静态资源文件
app.use('/uploads', express.static('./uploads'));

// 配置解析表单数据的中间件, [注意]该中间件只能解析application/x-www-form-urlencoded格式的表单数据
app.use(express.urlencoded({ extended: false }));

// 封装res.send函数为cc函数，并设置为全局可用，即后面的部分都可调用该函数
app.use((req, res, next) => {
    res.cc = function (err, status = 1) {
        res.send({
            status,
            msg: err instanceof Error ? err.message : err
        });
    }
    next();
});

// 在注册路由前配置jwt解析
// 解析 token 的中间件
const expressJWT = require('express-jwt');
// 导入配置文件
const config = require('./config');
// 使用 .unless({ path: [/^\/api\//] }) 指定哪些接口不需要进行 Token 的身份认证
// 在路由处理之前使用 express-jwt 中间件进行身份验证，主要作用是 验证请求中的 JWT 并提取其中的用户 ID
app.use(expressJWT({ secret: config.jwtSecretKey }).unless({ path: [/^\/api\//] }));

// 导入用户路由模块，并注册全局中间件
const userRouter = require('./router/user');
app.use('/api', userRouter);

// 导入并使用用户信息路由模块
const userinfoRouter = require('./router/userinfo');
// 注意：以 /my 开头的接口，都是有权限的接口，需要进行 Token 身份认证
app.use('/my', userinfoRouter);

// 导入并使用文章分类路由模块
const artCateRouter = require('./router/artcate');
// 为文章分类的路由挂载统一的访问前缀 /my/article
app.use('/my/article', artCateRouter);

// 导入并使用文章路由模块
const articleRouter = require('./router/article');
app.use('/my/article', articleRouter);

// 配置全局错误级别中间件
const joi = require('joi');
app.use((err, req, res, next) => {
    // 数据验证失败
    if (err instanceof joi.ValidationError) {
        // console.log('数据验证失败!');
        return res.cc(err);
    }

    // 捕获身份认证失败的错误, 捕获并处理 Token 认证失败后的错误
    if (err.name === 'UnauthorizedError') {
        return res.cc('身份认证失败！');
    }

    // 未知错误
    console.log('未知错误 - ', err);
    res.cc(err);
})

// 调用 app.listen() 方法，指定端口号并启动web服务器
app.listen(3008, function () {
    console.log('api server running at http://127.0.0.1:3008');
})