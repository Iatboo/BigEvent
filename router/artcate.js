
const express = require('express');

const router = express.Router();

// 导入文章分类的路由处理模块
const artcate_handler = require('../router_handler/artcate');

router.get('/cates', artcate_handler.getArticleCates);

// 导入验证数据的中间件
const expressJoi = require('@escook/express-joi');
// 导入文章分类的验证模块
const { add_cate_schema } = require('../schema/artcate');

// 新增文章分类的路由
router.post('/addcates', expressJoi(add_cate_schema), artcate_handler.addArticleCates);

// 导入删除分类的验证规则对象
const { delete_cate_schema } = require('../schema/artcate');
// 删除文章分类的接口
router.get('/deletecate/:id', expressJoi(delete_cate_schema), artcate_handler.deleteCateById);

// 导入根据 ID 获取文章分类的验证规则对象
const { get_cate_schema } = require('../schema/artcate');
// 根据id获取文章分类的接口
router.get('/cates/:id', expressJoi(get_cate_schema) ,artcate_handler.getArticleById);

// 导入更新文章分类的验证规则对象
const { update_cate_schema } = require('../schema/artcate');
// 更新文章分类的接口
router.post('/updatecate', expressJoi(update_cate_schema), artcate_handler.updateCateById);

// 发布新文章的接口
// router.post('/add', (req, res) => {
//     res.send('ok');
// })

module.exports = router;