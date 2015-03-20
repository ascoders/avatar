package models

import (
	"gopkg.in/mgo.v2/bson"
	"time"
)

type Reply struct {
	Id      bson.ObjectId `bson:"_id" json:"_id" form:"_id"` // 主键
	Article bson.ObjectId `bson:"a" json:"a" form:"a"`       // 所属文章id
	Uid     bson.ObjectId `bson:"u" json:"u" form:"u"`       // 所有者id
	Content string        `bson:"co" json:"co" form:"co"`    // 内容
	Time    time.Time     `bson:"tm" json:"tm" form:"tm"`    // 发布日期
}

/* 获取id */
func (this *Reply) GetId() {
	this.Id = bson.NewObjectId()
}

/* 插入评论 */
func (this *Reply) Reply() (bool, interface{}) {
	this.Time = time.Now()

	err := Db.C("reply").Insert(this)
	if err != nil {
		return false, err
	}

	return true, this.Id
}

// 查询区间段最新文章
func (this *Reply) Find(article string, from int, number int) []*Reply {
	//检查id格式是否正确
	if !bson.IsObjectIdHex(article) {
		return nil
	}

	var result []*Reply
	Db.C("reply").Find(bson.M{"a": bson.ObjectIdHex(article)}).Sort("tm").Skip(from).Limit(number).All(&result)

	return result
}

// 插入评论
func (this *Reply) Insert() (bool, interface{}) {
	this.Id = bson.NewObjectId()
	this.Time = time.Now()

	err := Db.C("reply").Insert(this)
	if err != nil {
		return false, err
	}

	return true, this.Id
}

/* 删除某个帖子下全部回复和评论 */
func (this *Reply) DeletArticleReply(article bson.ObjectId) {
	_, err := Db.C("reply").RemoveAll(bson.M{"a": article})
	if err != nil {
		return
	}
}
