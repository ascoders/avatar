package controllers

import (
	"avatar/models"
	"fmt"
	"github.com/astaxie/beego"
	"gopkg.in/mgo.v2/bson"
)

type ArticleController struct {
	beego.Controller
}

//新增文章
func (this *ArticleController) Add() {
	ok, data := func() (bool, interface{}) {
		if this.GetSession("ID") == nil {
			return false, "未登录"
		}

		//查询用户
		member := &models.Member{}
		if _ok, _data := member.FindOne(this.GetSession("ID").(string)); !_ok {
			return false, _data
		}

		category, _ := this.GetInt("category")
		if category != 0 && category != 1 {
			return false, "分类错误"
		}

		if len([]rune(this.GetString("title"))) > 25 {
			return false, "标题最长25"
		}

		if len([]rune(this.GetString("content"))) < 3 || len([]rune(this.GetString("content"))) > 20000 {
			return false, "内容长度3-20000"
		}

		// 判断标签是否合法
		tags := this.GetStrings("tag")

		// 标签数量限制、长度限制、同文章不能重复
		if len(tags) >= 5 {
			return false, "最多5个标签"
		}

		for k, _ := range tags {
			if len([]rune(tags[k])) > 15 || len([]rune(tags[k])) < 1 {
				return false, "标签最大长度为15"
			}
		}

		copyTags := tags

		for k, _ := range tags {
			count := 0
			for _k, _ := range copyTags {
				if copyTags[_k] == tags[k] {
					count++

					if count >= 2 {
						return false, "标签不能重复"
					}
				}
			}
		}

		tag := &models.Tag{}
		// tag新增
		for k, _ := range tags {
			tag.Upsert(tags[k])
		}

		article := &models.Article{}
		article.Uid = bson.ObjectIdHex(this.GetSession("ID").(string))
		article.Uimage = member.Image
		article.Category = category
		article.Title = this.GetString("title")
		article.Content = this.GetString("content")
		article.Tag = tags
		article.GetId()

		fmt.Println(article.Id)

		//如果标题为空，截取内容前15个字符
		if article.Title == "" {
			article.Title = beego.Substr(article.Content, 0, 15)
		}

		// 查找内容中所有图片信息，并移动到正确位置，同时替换图片路径
		var uploadSize int64
		uploadSize, article.Content = HandleNewImage(article.Content, "article/"+article.Id.Hex()+"/")

		// 记录用户上传量
		member.UploadSize += uploadSize
		member.Save()

		//用户发表量+1
		member.AddArticleNumber()

		//插入文章
		return article.Insert()
	}()

	this.Data["json"] = map[string]interface{}{
		"ok":   ok,
		"data": data,
	}
	this.ServeJson()
}

//编辑文章
func (this *ArticleController) Edit() {
	ok, data := func() (bool, interface{}) {
		if this.GetSession("ID") == nil {
			return false, "未登录"
		}

		//查询用户
		member := &models.Member{}
		if _ok, _data := member.FindOne(this.GetSession("ID").(string)); !_ok {
			return false, _data
		}

		if len([]rune(this.GetString("content"))) < 3 || len([]rune(this.GetString("content"))) > 20000 {
			return false, "内容长度3-20000"
		}

		// 查询文章
		article := &models.Article{}
		if _ok, _data := article.FindOne(this.GetString("id")); !_ok {
			return false, _data
		}

		if member.Id != article.Uid && !member.Admin {
			return false, "没有权限"
		}

		// 删除编辑后删除的图片（必须包含前缀路径保证是此文章的）
		// 移动编辑后新增的图片（并返回更新路径后的内容）
		var uploadSize int64
		uploadSize, article.Content = HandleUpdateImage(article.Content, this.GetString("content"), "article/"+article.Id.Hex()+"/")

		// 记录用户上传量
		member.UploadSize += uploadSize
		member.Save()

		// 更新文章内容
		article.UpdateContent()

		return true, nil
	}()

	this.Data["json"] = map[string]interface{}{
		"ok":   ok,
		"data": data,
	}
	this.ServeJson()
}

// 删除文章
func (this *ArticleController) Delete() {
	ok, data := func() (bool, interface{}) {
		if this.GetSession("ID") == nil {
			return false, "未登录"
		}

		//查询用户
		member := &models.Member{}
		if _ok, _data := member.FindOne(this.GetSession("ID").(string)); !_ok {
			return false, _data
		}

		// 查询文章
		article := &models.Article{}
		if _ok, _data := article.FindOne(this.GetString("id")); !_ok {
			return false, _data
		}

		if member.Id != article.Uid && !member.Admin {
			return false, "没有权限"
		}

		//删除帖子下全部评论和嵌套评论
		reply := &models.Reply{}
		reply.DeletArticleReply(article.Id)

		//删除图片
		qiniu := &QiniuController{}
		go qiniu.DeleteAll("avatar", "article/"+article.Id.Hex()+"/")

		//删除帖子中的tag
		tag := &models.Tag{}
		for k, _ := range article.Tag {
			tag.CountReduce(article.Tag[k])
		}

		// 删除文章
		article.Delete()

		return true, nil
	}()

	this.Data["json"] = map[string]interface{}{
		"ok":   ok,
		"data": data,
	}
	this.ServeJson()
}

// 置顶文章
func (this *ArticleController) Top() {
	ok, data := func() (bool, interface{}) {
		if this.GetSession("ID") == nil {
			return false, "未登录"
		}

		//查询用户
		member := &models.Member{}
		if _ok, _data := member.FindOne(this.GetSession("ID").(string)); !_ok {
			return false, _data
		}

		// 查询文章
		article := &models.Article{}
		if _ok, _data := article.FindOne(this.GetString("id")); !_ok {
			return false, _data
		}

		if !member.Admin {
			return false, "没有权限"
		}

		top, _ := this.GetBool("top")

		if !top {
			article.Top = 0
		} else {
			article.SetTop()
		}

		// 更新置顶
		article.UpdateTop()

		return true, nil
	}()

	this.Data["json"] = map[string]interface{}{
		"ok":   ok,
		"data": data,
	}
	this.ServeJson()
}

//查询文章
func (this *ArticleController) List() {
	from, _ := this.GetInt("from")
	number, _ := this.GetInt("number")
	category, _ := this.GetInt("category")

	ok, data := func() (bool, interface{}) {
		if number > 100 {
			return false, "最多显示100条"
		}

		article := &models.Article{}
		result := article.Find(category, from, number)
		count := article.Count(category)

		return true, map[string]interface{}{
			"lists": result,
			"count": count,
		}
	}()

	this.Data["json"] = map[string]interface{}{
		"ok":   ok,
		"data": data,
	}
	this.ServeJson()
}

//获取某个文章内容
func (this *ArticleController) Article() {
	ok, data := func() (bool, interface{}) {
		article := &models.Article{}
		if _ok, _data := article.FindOne(this.GetString("id")); !_ok {
			return false, _data
		}

		//该文章浏览数+1
		article.AddViews()

		return true, article
	}()

	this.Data["json"] = map[string]interface{}{
		"ok":   ok,
		"data": data,
	}
	this.ServeJson()
}

//评论某个文章
func (this *ArticleController) AddReply() {
	ok, data := func() (bool, interface{}) {
		if this.GetSession("ID") == nil {
			return false, "未登录"
		}

		if len([]rune(this.GetString("content"))) < 3 || len([]rune(this.GetString("content"))) > 10000 {
			return false, "评论长度3-10000"
		}

		//查询用户
		member := &models.Member{}
		if _ok, _data := member.FindOne(this.GetSession("ID").(string)); !_ok {
			return false, _data
		}

		//查询文章
		article := &models.Article{}
		if _ok, _data := article.FindOne(this.GetString("article")); !_ok {
			return false, _data
		}

		//插入评论
		reply := &models.Reply{}
		reply.Article = article.Id
		reply.Uid = member.Id
		reply.Uimage = member.Image
		reply.Uname = member.NickName
		reply.Content = this.GetString("content")
		reply.GetId()

		// 查找内容中所有图片信息，并移动到正确位置，同时替换图片路径
		var uploadSize int64
		uploadSize, reply.Content = HandleNewImage(reply.Content, "article/"+article.Id.Hex()+"/"+reply.Id.Hex()+"/")

		if _ok, _data := reply.Insert(); !_ok {
			return false, _data
		}

		// 记录用户上传量
		member.UploadSize += uploadSize
		member.Save()

		//用户评论自增
		member.AddReplyNumber()

		//文章评论数量自增
		article.AddReply()

		//更新文章最后评论id和图片
		article.UpdateLastReply(member.Id.Hex(), member.Image)

		return true, nil
	}()

	this.Data["json"] = map[string]interface{}{
		"ok":   ok,
		"data": data,
	}
	this.ServeJson()
}

// 查询评论
func (this *ArticleController) Reply() {
	from, _ := this.GetInt("from")
	number, _ := this.GetInt("number")

	ok, data := func() (bool, interface{}) {
		if number > 100 {
			return false, "最多显示100条"
		}

		reply := &models.Reply{}
		result := reply.Find(this.GetString("article"), from, number)

		return true, result
	}()

	this.Data["json"] = map[string]interface{}{
		"ok":   ok,
		"data": data,
	}
	this.ServeJson()
}
