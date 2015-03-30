package routers

import (
	"avatar/controllers"

	"github.com/astaxie/beego"
	//"github.com/dchest/captcha"
)

func init() {
	// 全局入口
	beego.Router("/", &controllers.IndexController{}, "get:Global")
	beego.Router("/*", &controllers.IndexController{}, "get:Global")

	// api
	beego.AddNamespace(beego.NewNamespace("/api",
		// 验证模块
		beego.NSNamespace("/check",
			// 生成state session
			beego.NSRouter("/setState", &controllers.CheckController{}, "post:SetState"),
			// 获取github token
			beego.NSRouter("/getToken", &controllers.CheckController{}, "post:GetToken"),
			// 注册
			beego.NSRouter("/register", &controllers.CheckController{}, "post:Register"),
			// 获取已登陆用户信息
			beego.NSRouter("/currentUser", &controllers.CheckController{}, "post:CurrentUser"),
			// 注销
			beego.NSRouter("/signout", &controllers.CheckController{}, "post:SignOut"),
			// 社交化平台查询是否有账号，若有自动登陆
			beego.NSRouter("/hasOauth", &controllers.CheckController{}, "post:HasOauth"),
			// 第三方平台注册用户
			beego.NSRouter("/oauthRegister", &controllers.CheckController{}, "post:OauthRegister"),
		),
		// 文章模块
		beego.NSNamespace("/article",
			// 新增
			beego.NSRouter("/add", &controllers.ArticleController{}, "post:Add"),
			// 编辑
			beego.NSRouter("/edit", &controllers.ArticleController{}, "post:Edit"),
			// 删除
			beego.NSRouter("/delete", &controllers.ArticleController{}, "post:Delete"),
			// 置顶
			beego.NSRouter("/top", &controllers.ArticleController{}, "post:Top"),
			// 获得文章列表
			beego.NSRouter("/list", &controllers.ArticleController{}, "post:List"),
			// 查询某个文章信息
			beego.NSRouter("/article", &controllers.ArticleController{}, "post:Article"),
			// 发布评论
			beego.NSRouter("/addReply", &controllers.ArticleController{}, "post:AddReply"),
			// 查询评论
			beego.NSRouter("/reply", &controllers.ArticleController{}, "post:Reply"),
			// 改变分类
			beego.NSRouter("/changeCategory", &controllers.ArticleController{}, "post:ChangeCategory"),
		),
		// 用户模块
		beego.NSNamespace("/user",
			// 获取用户信息
			beego.NSRouter("/user", &controllers.UserController{}, "post:User"),
			// 获取用户热评和被忽视的文章
			beego.NSRouter("/getHotCold", &controllers.UserController{}, "post:GetHotCold"),
			// 获取用户文章
			beego.NSRouter("/getArticles", &controllers.UserController{}, "post:GetArticles"),
			// 获取第三方平台绑定状况列表
			beego.NSRouter("/oauthList", &controllers.UserController{}, "post:OauthList"),
			// 第三方平台绑定 新增/更新
			beego.NSRouter("/oauth", &controllers.UserController{}, "post:Oauth"),
		),
		// 七牛图片处理模块
		beego.NSNamespace("/qiniu",
			// 获取首页内容
			beego.NSRouter("/createUpToken", &controllers.QiniuController{}, "post:CreateUpToken"),
		),
		// 标签
		beego.NSNamespace("/tag",
			// 绑定标签
			beego.NSRouter("/bind", &controllers.TagController{}, "post:Bind"),
			// 解绑标签
			beego.NSRouter("/unBind", &controllers.TagController{}, "post:UnBind"),
			// 提示推荐标签
			beego.NSRouter("/searchTag", &controllers.TagController{}, "post:SearchTag"),
			// 获取标签列表
			beego.NSRouter("/getList", &controllers.TagController{}, "post:GetList"),
			// 获取前30个热门标签
			beego.NSRouter("/hot", &controllers.TagController{}, "post:Hot"),
			// 相似标签
			beego.NSRouter("/same", &controllers.TagController{}, "post:Same"),
		),
	))
}
