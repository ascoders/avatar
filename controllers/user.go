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
