package models

import (
	"fmt"
	"time"

	"gopkg.in/mgo.v2/bson"
)

type Article struct {
	Id       bson.ObjectId `bson:"_id" json:"_id" form:"_id"` // 主键
	Uid      bson.ObjectId `bson:"u" json:"u" form:"u"`       // 所有者id
	Lid      string        `bson:"l" json:"l" form:"l"`       // 最后回复者id
	Category int           `bson:"c" json:"c" form:"c"`       // 所属分类id 0:问答 1:分享
	Title    string        `bson:"t" json:"t" form:"t"`       // 标题
	Content  string        `bson:"co" json:"co" form:"co"`    // 正文内容
	Views    uint32        `bson:"v" json:"v" form:"v"`       // 浏览量
	Reply    uint32        `bson:"r" json:"r" form:"r"`       // 回复量
	Tag      []string      `bson:"ta" json:"ta" form:"ta"`    // 标签
	Top      int           `bson:"tp" json:"tp" form:"tp"`    // 置顶优先级
	Time     time.Time     `bson:"tm" json:"tm" form:"tm"`    // 发布日期
	TimeLast time.Time     `bson:"tl" json:"tl" form:"tl"`    // 最后挖坟日期
}

/* 获取id */
func (this *Article) GetId() {
	this.Id = bson.NewObjectId()
}

/* 插入文章 */
func (this *Article) Insert() (bool, interface{}) {
	this.Time = time.Now()
	this.TimeLast = this.Time

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
		Db.C("article").Find(bson.M{"tp": 0}).Select(bson.M{"co": 0}).Sort("-tl").Skip(from).Limit(number).All(&result)
	} else {
		Db.C("article").Find(bson.M{"c": category}).Select(bson.M{"co": 0}).Sort("-tl").Skip(from).Limit(number).All(&result)
	}

	// 如果form为0，查询置顶文章
	if from == 0 && category == -1 {
		var top []*Article
		Db.C("article").Find(bson.M{"tp": bson.M{"$gt": 0}}).Select(bson.M{"co": 0}).Sort("-tp").All(&top)

		result = append(top, result...)
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
		count, _ := Db.C("article").Find(bson.M{"c": category, "tp": 0}).Count()
		return count
	}
}

// 为某个文章增加浏览数
func (this *Article) AddViews() {
	Db.C("article").Update(bson.M{"_id": this.Id}, bson.M{"$inc": bson.M{"v": 1}})
}

// 为某个文章增加评论 会同时更新挖坟日期
func (this *Article) AddReply() {
	err := Db.C("article").Update(bson.M{"_id": this.Id}, bson.M{
		"$inc": bson.M{"r": 1},
		"$set": bson.M{"tl": time.Now()},
	})
	fmt.Println(err)
}

// 更新某文章最后评论人信息
func (this *Article) UpdateLastReply(id string, image string) {
	Db.C("article").Update(bson.M{"_id": this.Id}, bson.M{"$set": bson.M{"l": id, "li": image}})
}

// 更新分类
func (this *Article) UpdateCategory(category int) bool {
	err := Db.C("article").Update(bson.M{"_id": this.Id}, bson.M{"$set": bson.M{"c": category}})

	return err == nil
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

// 查询某用文章
func (this *Article) FindUserArticles(id bson.ObjectId, from int, number int) []*Article {
	var result []*Article
	Db.C("article").Find(bson.M{"u": id}).Select(bson.M{"co": 0}).Skip(from).Limit(number).All(&result)
	return result
}

// 查询某用文章数量
func (this *Article) FindUserArticlesCount(id bson.ObjectId) int {
	count, _ := Db.C("article").Find(bson.M{"u": id}).Select(bson.M{"co": 0}).Count()
	return count
}

// 更新内容 会同时更新挖坟日期
func (this *Article) UpdateContent() {
	Db.C("article").Update(bson.M{"_id": this.Id}, bson.M{"$set": bson.M{
		"co": this.Content,
		"tl": time.Now(),
	}})
}

// 设置置顶数
func (this *Article) SetTop() {
	count, _ := Db.C("article").Find(bson.M{"tp": bson.M{"$gt": 0}}).Count()

	this.Top = count + 1
}

// 更新置顶参数
func (this *Article) UpdateTop() {
	Db.C("article").Update(bson.M{"_id": this.Id}, bson.M{"$set": bson.M{"tp": this.Top}})
}

// 新增标签
func (this *Article) AddTag(name string) {
	Db.C("article").Update(bson.M{"_id": this.Id},
		bson.M{"$push": bson.M{
			"ta": name,
		}})
}

// 删除标签
func (this *Article) RemoveTag(name string) {
	Db.C("article").Update(bson.M{"_id": this.Id},
		bson.M{"$pull": bson.M{
			"ta": name,
		}})
}

// 查询拥有相同标签的文章
func (this *Article) Same() []*Article {
	var r []*Article

	Db.C("article").Find(bson.M{"ta": bson.M{"$in": this.Tag}, "_id": bson.M{"$ne": this.Id}}).Limit(10).All(&r)

	return r
}

// 根据标签查询列表
func (this *Article) FindByTag(tag string, from int, number int) []*Article {
	var result []*Article

	//查询指定范围内帖子
	err := Db.C("article").Find(bson.M{"ta": tag}).Sort("-tm").Skip(from).Limit(number).All(&result)

	if err != nil {
		return nil
	}
	return result
}

// 查询指定游戏某标签的话题数
func (this *Article) FindTagCount(tag string) int {
	count, err := Db.C("article").Find(bson.M{"ta": tag}).Count()
	if err == nil {
		return int(count)
	} else {
		return 0
	}
}
