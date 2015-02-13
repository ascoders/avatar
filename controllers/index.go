package controllers

import (
	//"avatar/models"

	"github.com/astaxie/beego"
)

type IndexController struct {
	beego.Controller
}

func (this *IndexController) Global() {
	this.TplNames = "html/public/global.html"
	this.Render()
}
