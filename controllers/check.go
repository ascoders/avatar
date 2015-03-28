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

		// 是否已登陆
		var login bool

		member := &models.Member{}

		var session interface{}
		if session = this.GetSession("ID"); session != nil {
			if _ok, _ := member.FindOne(session.(string)); _ok {
				login = true
			}
		}

		if !login { // 未登录
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
		} else { // 已登录
			//检查该token用户是否存在
			member := &models.Member{}
			if _ok, _ := member.FindToken(this.GetString("token")); _ok { //查到了
				return true, "exist"
			} else { // 不存在，绑定github
				member.Login = this.GetString("login")
				member.Token = this.GetString("token")
				member.Save()
				return true, "bind"
			}
		}
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
		if beego.RunMode == "dev" {
			this.SetSession("ID", "54dc26103680350d9c000002")
		}

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

// 社交化平台查询是否有账号，若有自动登陆
func (this *CheckController) HasOauth() {
	ok, data := func() (bool, interface{}) {
		if !BaiduSocialCheck(this.GetString("token"), this.GetString("id")) { //通过不验证
			return false, "验证失败"
		}

		party := &models.Party{}
		// 查询第三方账号是否存在
		ok := party.FindMember(this.GetString("id"), this.GetString("type"))
		if !ok || this.GetSession("ID") != nil { // 用户不存在（或者当前用户已登陆），直接注册
			return true, -1
		}

		// 刷新验证权限
		party.RefreshAuthor(this.GetString("id"), this.GetString("type"), this.GetString("token"), this.GetString("expire"))

		// 实例化用户
		member := &models.Member{}

		if _ok, _ := member.FindOne(party.MemberId.Hex()); !_ok { // 查询用户
			return false, "用户不存在"
		}

		//生成session
		this.SetSession("ID", member.Id.Hex())

		// 返回用户信息
		return true, member
	}()

	this.Data["json"] = map[string]interface{}{
		"ok":   ok,
		"data": data,
	}

	this.ServeJson()
}

/* 第三方平台注册用户 */
func (this *CheckController) OauthRegister() {
	ok, data := func() (bool, interface{}) {
		// 是否已登陆
		var login bool

		member := &models.Member{}

		var session interface{}
		if session = this.GetSession("ID"); session != nil {
			if _ok, _ := member.FindOne(session.(string)); _ok {
				login = true
			}
		}

		party := &models.Party{}

		if !login { // 未登录，注册第三方账号并登录
			if this.GetString("nickname") == "" {
				return false, "昵称不能为空"
			}

			//查找是否有重复第三方id
			if ok := party.IdExist(this.GetString("id")); ok { //已存在
				return false, "该平台已经注册了账号"
			}

			//检测token是否合法
			if ok := BaiduSocialCheck(this.GetString("token"), this.GetString("id")); !ok {
				return false, "参数非法"
			}

			//插入用户
			member.NickName = this.GetString("nickname")
			member.Image = this.GetString("image")

			if _ok, _ := member.Insert(); !_ok {
				return false, "新增用户失败"
			}

			//插入第三方关联
			party.Insert(this.GetString("id"), this.GetString("type"), member.Id.Hex(), this.GetString("token"), this.GetString("nickname"), this.GetString("image"), this.GetString("expire"))

			//生成session
			this.SetSession("ID", member.Id.Hex())

			//查询用户信息
			return true, member
		} else { // 已登陆，绑定已有账号
			// 此时用户已登陆，判断新绑定的第三方账号是否已存在
			// 第三方账号是否存在
			if ok := party.IdExist(this.GetString("id")); ok { //已存在
				if party.MemberId == member.Id { // 更新授权
					party.RefreshAuthor(this.GetString("id"), this.GetString("type"), this.GetString("token"), this.GetString("expire"))
				} else { // 已存在第三方账号对应用户，与已登录用户不一致
					return true, "thridExist"
				}
			} else { //不存在，新增第三方关联
				party.Insert(this.GetString("id"), this.GetString("type"), member.Id.Hex(), this.GetString("token"), this.GetString("nickname"), this.GetString("image"), this.GetString("expire"))
			}

			return true, "thrid"
		}
	}()

	this.Data["json"] = map[string]interface{}{
		"ok":   ok,
		"data": data,
	}

	this.ServeJson()
}
