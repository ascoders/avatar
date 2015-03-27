package models

import (
	"gopkg.in/mgo.v2/bson"
	"time"
)

type Member struct {
	Id            bson.ObjectId `bson:"_id" json:"_id"`         // 主键
	NickName      string        `bson:"n" json:"n" form:"n"`    // 昵称
	Login         string        `bson:"l" json:"l" form:"l"`    // 登陆名
	Image         string        `bson:"i" json:"i" form:"i"`    // 用户头像
	Token         string        `bson:"to" json:"to" form:"to"` // github对应token
	ArticleNumber int           `bson:"a" json:"a" form:"a"`    // 文章发表量
	ReplyNumber   int           `bson:"r" json:"r" form:"r"`    // 评论数量
	UploadSize    int64         `bson:"u" json:"u" form:"u"`    // 上传量
	Time          time.Time     `bson:"t" json:"t" form:"t"`    // 注册时间
	Admin         bool          `bson:"ad" json:"ad" form:"ad"` // 是否为管理员
}

/* 根据ObjectId查询某个用户信息 */
func (this *Member) FindOne(value string) (bool, interface{}) {
	//检查id格式是否正确
	if !bson.IsObjectIdHex(value) {
		return false, "id格式错误"
	}
	//查询用户
	err := Db.C("member").Find(bson.M{"_id": bson.ObjectIdHex(value)}).One(&this)
	if err != nil {
		return false, "用户不存在"
	}
	return true, nil
}

func (this *Member) Insert() (bool, interface{}) {
	this.Id = bson.NewObjectId()
	this.Time = time.Now()
	err := Db.C("member").Insert(this)
	if err != nil {
		return false, err
	}
	return true, nil
}

// 根据code查找用户
func (this *Member) FindToken(token string) (bool, interface{}) {
	//查询用户
	err := Db.C("member").Find(bson.M{"to": token}).One(&this)
	if err != nil {
		return false, "用户不存在"
	}
	return true, nil
}

/* 增加文章发表量 */
func (this *Member) AddArticleNumber() {
	Db.C("member").Update(bson.M{"_id": this.Id}, bson.M{"$inc": bson.M{"a": 1}})
}

/* 增加评论量 */
func (this *Member) AddReplyNumber() {
	Db.C("member").Update(bson.M{"_id": this.Id}, bson.M{"$inc": bson.M{"r": 1}})
}

// 查询评论用户信息
func (this *Member) FindReplys(replys []*Reply) []*Member {
	var results []*Member

	members := make(map[bson.ObjectId]bool)

	for k, _ := range replys {
		if ok := members[replys[k].Uid]; !ok {
			members[replys[k].Uid] = true

			// 查询此用户信息
			member := &Member{}

			AutoCache("member-"+replys[k].Uid.Hex(), &member, 60, func() {
				Db.C("member").Find(bson.M{"_id": replys[k].Uid}).One(&member)
			})

			results = append(results, member)
		}
	}

	return results
}

// 查询文章用户信息
func (this *Member) FindArticles(articles []*Article) []*Member {
	var results []*Member

	members := make(map[bson.ObjectId]bool)

	for k, _ := range articles {
		if ok := members[articles[k].Uid]; !ok {
			members[articles[k].Uid] = true

			// 查询此用户信息
			member := &Member{}

			AutoCache("member-"+articles[k].Uid.Hex(), &member, 60, func() {
				Db.C("member").Find(bson.M{"_id": articles[k].Uid}).One(&member)
			})

			results = append(results, member)
		}

		if !bson.IsObjectIdHex(articles[k].Lid) {
			continue
		}

		if ok := members[bson.ObjectIdHex(articles[k].Lid)]; !ok {
			members[articles[k].Uid] = true

			// 查询此用户信息
			member := &Member{}

			AutoCache("member-"+articles[k].Lid, &member, 60, func() {
				Db.C("member").Find(bson.M{"_id": bson.ObjectIdHex(articles[k].Lid)}).One(&member)
			})

			results = append(results, member)
		}
	}

	return results
}

/* 保存 */
func (this *Member) Save() {
	colQuerier := bson.M{"_id": this.Id}
	err := Db.C("member").Update(colQuerier, this)
	if err != nil {
		//处理错误
	}
}
