// 导入定义验证规则的模块
const joi = require('joi');

// 定义 标题、分类Id、内容、发布状态 的验证规则
const title = joi.string().required();
const cate_id = joi.number().integer().min(1).required();
const content = joi.string().required().allow('');
const state = joi.string().valid('已发布', '草稿').required();

const pagenum = joi.number().integer().min(0).required()
const pagesize = joi.number().integer().min(1).required()
const cate_id_optional = joi.number().integer().min(1).optional()
const state_optional = joi.string().valid('草稿', '已发布').optional()

const id = joi.number().integer().min(1).required();

// 验证规则对象 - 发布文章
exports.add_article_schema = {
    body: {
        title,
        cate_id,
        content,
        state,
    }
}

// 验证规则对象 - 列出文章
exports.list_article_schema = {
    query: {
        pagenum,
        pagesize,
        cate_id: cate_id_optional,
        state: state_optional
    }
}

// 验证规则对象 - 删除指定文章
exports.del_article_schema = {
    params: {
        id
    }
}

// 验证规则对象 - 编辑指定文章
exports.edit_article_schema = {
    body: {
        id,
        title,
        cate_id,
        content,
        state
    }
}