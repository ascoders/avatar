package controllers

import (
	"avatar/models"
	"github.com/astaxie/beego"
	"github.com/astaxie/beego/httplib"
	"math/rand"
)

type CheckController struct {
	beego.Controller
}

// 设置一个session
func (this *CheckController) SetState() {
	state := rand.Int31()
	this.SetSession("state", state)

	this.Data["json"] = map[string]interface{}{
		"ok":   true,
		"data": state,
	}
	this.ServeJson()
}

// 获取github token
func (this *CheckController) GetToken() {
	ok, data := func() (bool, interface{}) {
		//获取并注销session
		if this.GetSession("state") == nil {
			return false, "请求已失效"
		}

		state := this.GetSession("state").(int32)
		this.DelSession("state")

		//验证state是否正确
		postState, _ := this.GetInt32("state")
		if postState != state {
			return false, "state错误"
		}

		req := httplib.Post("https://github.com/login/oauth/access_token")
		req.Param("client_id", beego.AppConfig.String("ClientId"))
		req.Param("client_secret", beego.AppConfig.String("ClientSecret"))
		req.Param("code", this.GetString("code"))
		result, _ := req.String()

		return true, result
	}()

	this.Data["json"] = map[string]interface{}{
		"ok":   ok,
		"data": data,
	}
	this.ServeJson()
}

// 注册用户
func (this *CheckController) Register() {
	ok, data := func() (bool, interface{}) {
		//验证请求是否合法
		req := httplib.Get("https://api.github.com/user?access_token=" + this.GetString("token"))
		result, _ := req.Response()
		if result.StatusCode != 200 {
			return false, "非法请求"
		}

		//检查该token用户是否存在
		member := &models.Member{}
		if _ok, _ := member.FindToken(this.GetString("token")); _ok { //查到了
			//生成session
			this.SetSession("ID", member.Id.Hex())

			//返回用户信息
			return true, member
		}

		member.NickName = this.GetString("nickname")
		member.Login = this.GetString("login")
		member.Image = this.GetString("image")
		member.Token = this.GetString("token")

		//用户名为空，采用login代替
		if member.NickName == "" {
			member.NickName = member.Login
		}

		if _ok, _data := member.Insert(); !_ok {
			return false, _data
		}

		//生成session
		this.SetSession("ID", member.Id.Hex())

		//返回用户信息
		return true, member
	}()

	this.Data["json"] = map[string]interface{}{
		"ok":   ok,
		"data": data,
	}
	this.ServeJson()
}

// 获取登陆用户信息
func (this *CheckController) CurrentUser() {
	ok, data := func() (bool, interface{}) {
		//这个条件仅供测试用
		//this.SetSession("ID", "54dc26103680350d9c000002")

		//是否存在session
		if this.GetSession("ID") == nil || this.GetSession("ID").(string) == "" {
			return false, "未登录"
		}

		//查找用户
		member := models.Member{}
		if _ok, err := member.FindOne(this.GetSession("ID").(string)); !_ok {
			return false, err
		}

		//获取用户信息
		return true, member
	}()

	this.Data["json"] = map[string]interface{}{
		"ok":   ok,
		"data": data,
	}
	this.ServeJson()
}

// 注销用户
func (this *CheckController) SignOut() {
	this.DelSession("ID")

	this.Data["json"] = map[string]interface{}{
		"ok":   true,
		"data": nil,
	}
	this.ServeJson()
}
