package models

import (
	"bytes"
	"encoding/gob"

	"gopkg.in/mgo.v2/bson"

	"github.com/astaxie/beego"
	"github.com/hoisie/redis"
	"gopkg.in/mgo.v2"
)

var (
	Db    *mgo.Database //数据库
	Redis redis.Client  //redis
)

type Base struct {
	Id bson.ObjectId `json:"_id" form:"_id" bson:"_id" valid:"Required"` //主键
}

func init() {
	//获取数据库连接
	session, err := mgo.Dial(beego.AppConfig.String("MongoDb"))
	if err != nil {
		panic(err)
	}
	session.SetMode(mgo.Monotonic, true)
	Db = session.DB("avatar")
	//初始化redis数据库
	Redis.Addr = "127.0.0.1:6379"
}

func (this *Base) Count() int {
	count, err := Db.C("card").Count()
	if err != nil {
		return 0
	}
	return count
}

/* 结构体编码为字节流 */
func StructEncode(data interface{}) ([]byte, error) {
	buf := bytes.NewBuffer(nil)
	enc := gob.NewEncoder(buf)
	err := enc.Encode(data)
	if err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

/* 字节流解码为结构体 */
func StructDecode(data []byte, to interface{}) error {
	buf := bytes.NewBuffer(data)
	dec := gob.NewDecoder(buf)
	return dec.Decode(to)
}

/* 自动读存缓存 */
func AutoCache(key string, obj interface{}, time int64, callback func()) {
	if cache, err := Redis.Get(key); err == nil {
		StructDecode(cache, obj)
	} else {
		callback()
		if obj == nil {
			return
		}
		cache, _ := StructEncode(obj)
		Redis.Setex(key, time, cache)
	}
}

/* 删除某个缓存 */
func DeleteCache(key string) {
	Redis.Del(key)
}
