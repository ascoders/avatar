package controllers

import (
	"avatar/models"
	"fmt"
	"github.com/astaxie/beego"
	"github.com/astaxie/beego/httplib"
)

type UserController struct {
	beego.Controller
}

//获取某个用户信息
func (this *UserController) User() {
	ok, data := func() (bool, interface{}) {
		member := &models.Member{}
		if _ok, _data := member.FindOne(this.GetString("id")); !_ok {
			return false, _data
		}

		return true, map[string]interface{}{
			"_id": member.Id,
			"n":   member.NickName,
			"t":   member.Time,
			"a":   member.ArticleNumber,
			"r":   member.ReplyNumber,
			"i":   member.Image,
			"l":   member.Login,
		}
	}()

	this.Data["json"] = map[string]interface{}{
		"ok":   ok,
		"data": data,
	}
	this.ServeJson()
}

//获取用户热评和被忽视的文章
func (this *UserController) GetHotCold() {
	ok, data := func() (bool, interface{}) {
		member := &models.Member{}
		if _ok, _data := member.FindOne(this.GetString("id")); !_ok {
			return false, _data
		}

		article := &models.Article{}
		//查询热评文章
		hot := article.FindUserHot(member.Id)

		//查询冷门文章
		cold := article.FindUserCold(member.Id)

		return true, map[string]interface{}{
			"hot":  hot,
			"cold": cold,
		}
	}()

	this.Data["json"] = map[string]interface{}{
		"ok":   ok,
		"data": data,
	}
	this.ServeJson()
}

// 获取用户文章
func (this *UserController) GetArticles() {
	ok, data := func() (bool, interface{}) {
		member := &models.Member{}
		if _ok, _data := member.FindOne(this.GetString("id")); !_ok {
			return false, _data
		}

		article := &models.Article{}

		// 查询用户文章
		from, _ := this.GetInt("from")
		number, _ := this.GetInt("number")

		articles := article.FindUserArticles(member.Id, from, number)
		count := article.FindUserArticlesCount(member.Id)

		return true, map[string]interface{}{
			"lists": articles,
			"count": count,
		}
	}()

	this.Data["json"] = map[string]interface{}{
		"ok":   ok,
		"data": data,
	}
	this.ServeJson()
}

//获取github信息
func (this *UserController) GetGithub() {
	ok, data := func() (bool, interface{}) {
		member := &models.Member{}
		if _ok, _data := member.FindOne(this.GetString("id")); !_ok {
			return false, _data
		}

		//获取github上用户信息
		req := httplib.Get("https://api.github.com/user?access_token=" + member.Token)
		result, _ := req.String()

		fmt.Println(result)

		return true, result
	}()

	this.Data["json"] = map[string]interface{}{
		"ok":   ok,
		"data": data,
	}
	this.ServeJson()
}

/* 获取第三方平台绑定状况列表 */
func (this *UserController) OauthList() {
	ok, data := func() (bool, interface{}) {
		member := &models.Member{}

		var session interface{}
		if session = this.GetSession("ID"); session == nil {
			return false, "未登录"
		}

		if _ok, _ := member.FindOne(session.(string)); !_ok {
			return false, "用户不存在"
		}

		//查询该用户绑定的平台
		party := &models.Party{}
		partys := party.FindBinds(member.Id)

		return true, partys
	}()

	this.Data["json"] = map[string]interface{}{
		"ok":   ok,
		"data": data,
	}
	this.ServeJson()
}

/* 第三方平台绑定 */
func (this *UserController) Oauth() {
	ok, data := func() (bool, interface{}) {
		member := &models.Member{}

		var session interface{}
		if session = this.GetSession("ID"); session == nil {
			return false, "未登录"
		}

		if _ok, _ := member.FindOne(session.(string)); !_ok {
			return false, "用户不存在"
		}

		//检测token是否合法
		if ok := BaiduSocialCheck(this.GetString("token"), this.GetString("id")); !ok {
			return false, "token不合法"
		}

		/*
			var plantform string
			switch this.GetString("type") {
			case "baidu":
				plantform = "百度账号"
			case "qqdenglu":
				plantform = "qq账号"
			case "sinaweibo":
				plantform = "新浪微博账号"
			case "renren":
				plantform = "人人网账号"
			case "qqweibo":
				plantform = "腾讯微博"
			case "kaixin":
				plantform = "开心网"
			}
		*/

		party := &models.Party{}
		//查询是否存在
		if ok := party.IdExist(this.GetString("id")); ok { //已存在，是更新授权操作
			party.RefreshAuthor(this.GetString("id"), this.GetString("type"), this.GetString("token"), this.GetString("expire"))
		} else { //不存在，新增第三方关联
			party.Insert(this.GetString("id"), this.GetString("type"), member.Id.Hex(), this.GetString("token"), this.GetString("nickname"), this.GetString("image"), this.GetString("expire"))
		}

		return true, nil
	}()

	this.Data["json"] = map[string]interface{}{
		"ok":   ok,
		"data": data,
	}
	this.ServeJson()
}
