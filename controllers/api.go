package controllers

import (
	"crypto/tls"
	"strconv"

	"github.com/astaxie/beego"
	"github.com/astaxie/beego/httplib"
)

/* ----------此控制器定义全部第三方API操作---------- */

type ApiController struct {
	beego.Controller
}

/* ---------------- 百度开放云 ---------------- */

/* 判断token对应的id是否合法 */
func BaiduSocialCheck(token string, id string) bool {
	var r = struct {
		Id uint `json:"social_uid"`
	}{}
	err := httplib.Get("https://openapi.baidu.com/social/api/2.0/user/info").Param("access_token", token).SetTLSClientConfig(&tls.Config{InsecureSkipVerify: true}).ToJson(&r)
	if err != nil { //请求发送失败
		return false
	}
	if strconv.Itoa(int(r.Id)) != id { //id不符
		return false
	}
	return true
}
