package controllers

import (
	"avatar/models"

	"github.com/astaxie/beego"
)

type TagController struct {
	beego.Controller
}

// 绑定标签
// article string 所属文章
// name string 标签名
func (this *TagController) Bind() {
	ok, data := func() (bool, interface{}) {
		member := &models.Member{}

		var session interface{}
		if session = this.GetSession("ID"); session == nil {
			return false, "未登录"
		}

		if _ok, _ := member.FindOne(session.(string)); !_ok {
			return false, "用户不存在"
		}

		article := &models.Article{}
		if _ok, _ := article.FindOne(this.GetString("article")); !_ok {
			return false, "文章不存在"
		}

		if member.Id != article.Uid && !member.Admin {
			return false, "没有权限"
		}

		// 标签数量限制、长度限制、同文章不能重复
		if len(article.Tag) >= 5 {
			return false, "最多5个标签"
		}

		if len([]rune(this.GetString("name"))) > 15 || len([]rune(this.GetString("name"))) < 1 {
			return false, "标签最大长度为15"
		}

		tag := &models.Tag{}
		for k, _ := range article.Tag {
			if this.GetString("name") == article.Tag[k] {
				return false, "标签不能重复"
			}
		}

		// tag新增
		tag.Upsert(this.GetString("name"))

		// 文章新增tag
		article.AddTag(this.GetString("name"))

		return true, ""
	}()

	this.Data["json"] = map[string]interface{}{
		"ok":   ok,
		"data": data,
	}
	this.ServeJson()
}

// 解绑标签
// topic string 所属文章
// name string 标签名
func (this *TagController) UnBind() {
	ok, data := func() (bool, interface{}) {
		member := &models.Member{}

		var session interface{}
		if session = this.GetSession("ID"); session == nil {
			return false, "未登录"
		}

		if _ok, _ := member.FindOne(session.(string)); !_ok {
			return false, "用户不存在"
		}

		article := &models.Article{}
		if _ok, _ := article.FindOne(this.GetString("article")); !_ok {
			return false, "文章不存在"
		}

		if member.Id != article.Uid && !member.Admin {
			return false, "没有权限"
		}

		// tag减少
		tag := &models.Tag{}
		tag.CountReduce(this.GetString("name"))

		// 文章删除tag
		article.RemoveTag(this.GetString("name"))

		return true, ""
	}()

	this.Data["json"] = map[string]interface{}{
		"ok":   ok,
		"data": data,
	}
	this.ServeJson()
}

// 搜索标签
func (this *TagController) SearchTag() {
	tag := &models.Tag{}
	results := tag.Like(this.GetString("query"))

	suggestions := make([]string, len(results))

	for k, _ := range results {
		suggestions[k] = results[k].Name
	}

	this.Data["json"] = map[string]interface{}{
		"query":       "Unit",
		"suggestions": suggestions,
	}
	this.ServeJson()
}

// 获取列表
func (this *TagController) GetList() {
	ok, data := func() (bool, interface{}) {
		if len([]rune(this.GetString("name"))) > 15 {
			return false, "标签最大长度为15"
		}

		from, _ := this.GetInt("from")
		number, _ := this.GetInt("number")

		if number > 100 {
			return false, "最多显示100项"
		}

		//查找标签
		article := &models.Article{}
		lists := article.FindByTag(this.GetString("tag"), from, number)

		//查询该分类文章总数
		count := article.FindTagCount(this.GetString("tag"))

		// 查询每个文章作者信息
		member := &models.Member{}
		members := member.FindArticles(lists)

		return true, map[string]interface{}{
			"lists":   lists,
			"count":   count,
			"members": members,
		}
	}()

	this.Data["json"] = map[string]interface{}{
		"ok":   ok,
		"data": data,
	}
	this.ServeJson()
}

// 获得排名前30的标签
func (this *TagController) Hot() {
	ok, data := func() (bool, interface{}) {

		tag := &models.Tag{}
		result := tag.Hot()

		return true, result
	}()

	this.Data["json"] = map[string]interface{}{
		"ok":   ok,
		"data": data,
	}
	this.ServeJson()
}

// 获取具有相同标签的文章
func (this *TagController) Same() {
	ok, data := func() (bool, interface{}) {
		// 查找文章
		article := &models.Article{}
		if _ok, _ := article.FindOne(this.GetString("article")); !_ok {
			return false, "文章不存在"
		}

		result := article.Same()

		return true, result
	}()

	this.Data["json"] = map[string]interface{}{
		"ok":   ok,
		"data": data,
	}
	this.ServeJson()
}
