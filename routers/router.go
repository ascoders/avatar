package routers

import (
	"avatar/controllers"

	"github.com/astaxie/beego"
	//"github.com/dchest/captcha"
)

func init() {
	//全局入口
	beego.Router("/", &controllers.IndexController{}, "get:Global")
	beego.Router("/*", &controllers.IndexController{}, "get:Global")

	//api
	beego.AddNamespace(beego.NewNamespace("/api",
		//首页模块
		//beego.NSNamespace("/index"),
		//验证模块
		beego.NSNamespace("/check",
			//生成state session
			beego.NSRouter("/setState", &controllers.CheckController{}, "post:SetState"),
			//获取github token
			beego.NSRouter("/getToken", &controllers.CheckController{}, "post:GetToken"),
			//注册
			beego.NSRouter("/register", &controllers.CheckController{}, "post:Register"),
			//获取已登陆用户信息
			beego.NSRouter("/currentUser", &controllers.CheckController{}, "post:CurrentUser"),
			//注销
			beego.NSRouter("/signout", &controllers.CheckController{}, "post:SignOut"),
		),
		//文章模块
		beego.NSNamespace("/article",
			//新增
			beego.NSRouter("/add", &controllers.ArticleController{}, "post:Add"),
			//获得文章列表
			beego.NSRouter("/list", &controllers.ArticleController{}, "post:List"),
			//查询某个文章信息
			beego.NSRouter("/article", &controllers.ArticleController{}, "post:Article"),
			//发布评论
			beego.NSRouter("/addReply", &controllers.ArticleController{}, "post:AddReply"),
			//查询评论
			beego.NSRouter("/reply", &controllers.ArticleController{}, "post:Reply"),
		),
		//用户模块
		beego.NSNamespace("/user",
			//获取用户信息
			beego.NSRouter("/user", &controllers.UserController{}, "post:User"),
			//获取用户热评和被忽视的文章
			beego.NSRouter("/getHotCold", &controllers.UserController{}, "post:GetHotCold"),
		),
	))
}
