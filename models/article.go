package models

import (
	"time"

	"gopkg.in/mgo.v2/bson"
)

type Article struct {
	Id       bson.ObjectId `bson:"_id" json:"_id" form:"_id"` // 主键
	Uid      bson.ObjectId `bson:"u" json:"u" form:"u"`       // 所有者id
	Lid      string        `bson:"l" json:"l" form:"l"`       // 最后回复者id
	Uimage   string        `bson:"ui" json:"ui" form:"ui"`    // 【冗余】所有者头像
	Limage   string        `bson:"li" json:"li" form:"li"`    // 【冗余】最后回复者头像
	Category int           `bson:"c" json:"c" form:"c"`       // 所属分类id 0:问答 1:分享
	Title    string        `bson:"t" json:"t" form:"t"`       // 标题
	Content  string        `bson:"co" json:"co" form:"co"`    // 正文内容
	Views    uint32        `bson:"v" json:"v" form:"v"`       // 浏览量
	Reply    uint32        `bson:"r" json:"r" form:"r"`       // 回复量
	Time     time.Time     `bson:"tm" json:"tm" form:"tm"`    // 发布日期
}

/* 插入文章 */
func (this *Article) Insert() (bool, interface{}) {
	this.Id = bson.NewObjectId()
	this.Time = time.Now()

	err := Db.C("article").Insert(this)
	if err != nil {
		return false, err
	}

	return true, this.Id
}

/* 删除文章 */
func (this *Article) Delete() {
	Db.C("article").Remove(bson.M{"_id": this.Id})
}

// 查询区间段最新文章
func (this *Article) Find(category int, from int, number int) []*Article {
	var result []*Article
	//如果category为-1，则查询全部总数
	if category == -1 {
		Db.C("article").Find(nil).Select(bson.M{"co": 0}).Sort("-tm").Skip(from).Limit(number).All(&result)
	} else {
		Db.C("article").Find(bson.M{"c": category}).Select(bson.M{"co": 0}).Sort("-tm").Skip(from).Limit(number).All(&result)
	}

	return result
}

func (this *Article) FindOne(id string) (bool, interface{}) {
	//检查id格式是否正确
	if !bson.IsObjectIdHex(id) {
		return false, "id格式错误"
	}

	//查询用户
	err := Db.C("article").Find(bson.M{"_id": bson.ObjectIdHex(id)}).One(&this)
	if err != nil {
		return false, "文章不存在"
	}
	return true, nil
}

// 查询总数
func (this *Article) Count(category int) int {
	//如果category为-1，则查询全部总数
	if category == -1 {
		count, _ := Db.C("article").Find(nil).Count()
		return count
	} else {
		count, _ := Db.C("article").Find(bson.M{"c": category}).Count()
		return count
	}
}

// 为某个文章增加浏览数
func (this *Article) AddViews() {
	Db.C("article").Update(bson.M{"_id": this.Id}, bson.M{"$inc": bson.M{"v": 1}})
}

// 为某个文章增加评论
func (this *Article) AddReply() {
	Db.C("article").Update(bson.M{"_id": this.Id}, bson.M{"$inc": bson.M{"r": 1}})
}

// 更新某文章最后评论人信息
func (this *Article) UpdateLastReply(id string, image string) {
	Db.C("article").Update(bson.M{"_id": this.Id}, bson.M{"$set": bson.M{"l": id, "li": image}})
}

// 查询某用户热评文章前10个
func (this *Article) FindUserHot(id bson.ObjectId) []*Article {
	var result []*Article
	Db.C("article").Find(bson.M{"u": id, "r": bson.M{"$gt": 0}}).Select(bson.M{"co": 0}).Sort("-r").Limit(10).All(&result)
	return result
}

// 查询某用户冷门文章前10个
func (this *Article) FindUserCold(id bson.ObjectId) []*Article {
	var result []*Article
	Db.C("article").Find(bson.M{"u": id, "r": 0}).Select(bson.M{"co": 0}).Limit(10).All(&result)
	return result
}
