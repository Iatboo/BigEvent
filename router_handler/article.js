// 导入解析 formdata 格式表单数据的包
const multer = require('multer');
// 导入处理路径的核心模块
const path = require('path');
// 导入数据库操作模块
const db = require('../db/index')

// 创建 multer 的实例对象，通过 dest 属性指定文件的存放路径
const upload = multer({ dest: path.join(__dirname, '../uploads') });

// 发布新文章的处理函数
exports.addArticle = (req, res) => {
    // 手动判断是否上传了封面
    if (!req.file || req.file.filename !== 'cover_img') {
        return res.cc('文章封面是必选参数！');
    }

    const articleInfo = {
        // 标题、内容、状态、所属的分类Id
        ...req.body,
        // 文章封面在服务器端的存放路径
        cover_img: path.join('/uploads', req.file.filename),
        // 文章发布时间
        pub_date: new Date(),
        // 文章作者的Id
        author_id: req.user.id
    }

    const sql = `insert into en_articles set ?`;
    db.query(sql, articleInfo, (err, results) => {
        if (err) {
            return res.cc(err);
        }
        if (results.affectedRows !== 1) {
            return res.cc('发布文章失败!');
        }
        res.cc('发布文章成功！');
    })
}

// 获取文章列表的处理函数
exports.getArticleList = async (req, res) => {
    const sql = `select a.id, a.title, a.pub_date, a.state, b.name as cate_name
                from en_articles as a,en_article_cate as b 
                where a.cate_id = b.id and a.cate_id = ifnull(?, a.cate_id)  and a.state = ifnull(?, a.state) and a.is_delete = 0  limit ?,?`
                // select a.id, a.title, a.pub_date, a.state, b.name as cate_name：选择 en_articles 表中的 id、title、pub_date 和 state 列，以及 en_article_cate 表中的 name 列，并将其重命名为 cate_name。
                // from en_articles as a, en_article_cate as b：从 en_articles 表和 en_article_cate 表中获取数据。
                // where a.cate_id = b.id and a.cate_id = ifnull(?, a.cate_id) and a.state = ifnull(?, a.state) and a.is_delete = 0：对结果进行筛选。首先，使用 a.cate_id = b.id 来匹配 en_articles 表中的 cate_id 和 en_article_cate 表中的 id。然后，使用 ifnull 函数来检查是否存在参数值，如果存在则使用参数，否则使用原始值。这里使用了两个参数，分别用于筛选 cate_id 和 state 列。最后，使用 a.is_delete = 0 来排除已删除的文章。
                // limit ?,?：限制返回的结果集大小。第一个参数是偏移量（即要跳过的行数），第二个参数是要返回的行数。
    
    // let result = [];

    // Todo 需要将这部分改为异步执行，这样才能正确获取到查询数据，因为数据库查询时间较长. 20230512
    // db.query(sql, [req.query.cate_id || null, req.query.state || null, (req.query.pagenum - 1) * req.query.pagesize, req.query.pagesize], (err, results) => {
        
    //     if (err) {
    //         res.cc(err);
    //     }
        
    //     result = results;
    //     console.log('result 0 - ', result);
    // });

    let result = [];

    try {
        const results = await new Promise((resolve, reject) => {
            db.query(sql, [req.query.cate_id || null, req.query.state || null, (req.query.pagenum - 1) * req.query.pagesize, req.query.pagesize], (err, results) => {
                
                if (err) {
                    reject(err);
                }

                resolve(results);
            });
        });
        result = results;
    } catch (err) {
        res.cc(err);
    }

    // console.log('4 - ', result);

    // 用下面这种方法来写的话还是出现了获取不到数据的情况，即还是先执行了同步方法，没有使用await等待Promise对象返回结果。在这种情况下，即使异步操作完成，也无法获得最终结果
    // new Promise((resolve, reject) => {
    //     db.query(sql, [req.query.cate_id || null, req.query.state || null, (req.query.pagenum - 1) * req.query.pagesize, req.query.pagesize], (err, results) => {
            
    //         if (err) {
    //             reject(err);
    //         }
    //         console.log('1 - ', results);
    //         resolve(results)
    //     });
    // }).then((results) => {
    //     console.log('2 - ', results);
    //     result = results;
    //     console.log('3 - ', results);
    // }).catch((err) => {
    //     res.cc(err);
    // })
    // console.log('4 - ', result);

    const countSql = `select count(*) as num from en_articles where is_delete = 0 and state = ifnull(?,state) and cate_id = ifnull(?,cate_id)`;
                        // 找出 en_articles 表中符合特定条件的记录数，并将其作为结果返回。
    
    let total = null;
    try {
        const res = await new Promise((resolve, reject) => {
            db.query(countSql, [req.query.state || null, req.query.cate_id || null], (err, results) => {
                if (err) {
                    res.cc(err);
                }
                resolve(results);
            });
        });
        let [{ num }] = res;
        total = num;
    } catch (err) {

    }
    
    res.send({
        status: 0,
        msg: '获取文章列表成功',
        data: result,
        total
    })
}

// 删除指定文章的处理函数
exports.delArticle = async (req, res) => {
    const sql = `update en_articles set is_delete = 1 where id = ?`;

    try {
        let results = await new Promise((resolve, reject) => {
            db.query(sql, req.params.id, (err, results) => {
                if (err) {
                    reject(err);
                }
                resolve(results)
            });
        });
        if (results.affectedRows !== 1) {
            return res.cc('删除文章失败!');
        }
    } catch (error) {
        res.cc(error);
    }

    res.send({
        status: 0,
        msg: '删除文章成功!'
    })
}

// 编辑指定文章的处理函数
exports.editArticle = async (req, res) => {
    
    // 手动校验上传的文件
    // if (!req.file || req.file.filename !== 'cover_img') {
    //     return res.cc('文章封面必选!');
    // }

    const sql = `update en_articles set ? where id = ?`;

    const articleInfo = {
        ...req.body,
        pub_date: new Date(),
        cover_img: path.join('/uploads', 'req.file.filename')
    }

    try {
        let results = await new Promise((resolve, reject) => {
            db.query(sql, [articleInfo, req.body.id], (err, results) => {
                if (results.affectedRows !== 1) {
                    res.cc('更新文章失败!');
                }

                resolve(results);
            })
        })
    } catch (error) {
        return res.cc(error);
    }

    res.send({
        status: 0,
        msg: '更新文章成功!'
    })
}

// 查询指定文章详细信息的处理函数
exports.queryArticle = async (req, res) => {

    const sql = `select * from en_articles where id = ?`;

    let result = [];

    try {
        result = await new Promise((resolve, reject) => {
            db.query(sql, req.params.id, (err, results) => {
                if (err) {
                    res.cc(err);
                }
                resolve(results);
            })
        })
    } catch (error) {
        res.cc(error);
    }

    res.send({
        status: 0,
        msg: '查询文章详情成功!',
        data: result[0]
    })
}