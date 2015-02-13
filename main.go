package main

import (
	_ "avatar/routers"

	"github.com/astaxie/beego"
	_ "github.com/astaxie/beego/session/redis"
)

func main() {
	//运行
	beego.Run()
}
