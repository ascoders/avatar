package models

import (
	"gopkg.in/mgo.v2/bson"
)

type Tag struct {
	Id     bson.ObjectId `bson:"_id" form:"_id" json:"_id"` // 主键
	Author bson.ObjectId `bson:"a" form:"a" json:"a"`       // 作者id
	Name   string        `bson:"n" form:"n" json:"n"`       // 名称
	Count  int           `bson:"c" form:"c" json:"c"`       // 文章总数
}

// 插入
func (this *Tag) Insert() (bool, interface{}) {
	err := Db.C("tag").Insert(this)

	return err == nil, err
}

// 不存在则创建，存在累加文章总数
func (this *Tag) Upsert(name string) bool {
	_, err := Db.C("tag").Upsert(bson.M{"n": name}, bson.M{"$inc": bson.M{"c": 1}})
	return err == nil
}

// 文章数减少1
func (this *Tag) CountReduce(name string) {
	// 查询tag信息
	err := Db.C("tag").Find(bson.M{"n": name}).One(&this)

	if err != nil {
		return
	}

	if this.Count <= 1 { // 直接删除
		Db.C("tag").Remove(bson.M{"n": name})
	} else {
		Db.C("tag").Update(bson.M{"n": name}, bson.M{"$inc": bson.M{"c": -1}})
	}
}

// 模糊查询
func (this *Tag) Like(key string) []*Tag {
	var r []*Tag

	Db.C("tag").Find(bson.M{"n": bson.M{"$regex": key}}).Limit(10).All(&r)

	return r
}

// 查询文章总数最多的前30个标签
func (this *Tag) Hot() []*Tag {
	var r []*Tag

	Db.C("tag").Find(nil).Sort("-c").Limit(30).All(&r)

	return r
}
