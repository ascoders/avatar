package controllers

import (
	"avatar/models"
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

		if len([]rune(this.GetString("title"))) > 20 {
			return false, "标题最长20"
		}

		if len([]rune(this.GetString("content"))) < 3 || len([]rune(this.GetString("content"))) > 10000 {
			return false, "内容长度3-10000"
		}

		article := &models.Article{}
		article.Uid = bson.ObjectIdHex(this.GetSession("ID").(string))
		article.Uimage = member.Image
		article.Category = category
		article.Title = this.GetString("title")
		article.Content = this.GetString("content")

		//如果标题为空，截取内容前15个字符
		if article.Title == "" {
			article.Title = beego.Substr(article.Content, 0, 15)
		}

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

		if len([]rune(this.GetString("content"))) < 3 || len([]rune(this.GetString("content"))) > 1000 {
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
		reply.Content = this.GetString("content")
		if _ok, _data := reply.Insert(); !_ok {
			return false, _data
		}

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
