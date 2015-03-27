package models

import (
	"time"

	"gopkg.in/mgo.v2"
	"gopkg.in/mgo.v2/bson"
)

type Party struct {
	Id          string        `bson:"_id"` //第三方平台id
	Type        string        `bson:"t"`   //第三方平台类型
	MemberId    bson.ObjectId `bson:"mi"`  //用户id
	AccessToken string        `bson:"at"`  //用户token
	Name        string        `bson:"n"`   //用户昵称
	Image       string        `bson:"i"`   //用户头像地址
	ExpiresTime time.Time     `bson:"e"`   //授权过期时间
}

var (
	partyC *mgo.Collection //数据库连接
)

func init() {
	partyC = Db.C("party")
}

/* 更新第三方平台token和授权时间 */
func (this *Party) RefreshAuthor(id string, _type string, token string, expresin string) {
	//计算过期时间
	expresDuration, _ := time.ParseDuration(expresin + "s")
	this.ExpiresTime = time.Now().Add(expresDuration)
	//保存
	partyC.Update(bson.M{"_id": id, "t": _type}, bson.M{"$set": bson.M{"at": token, "e": this.ExpiresTime}})
}

/* 绑定第三方平台 */
func (this *Party) Insert(id string, _type string, memberid string, accesstoken string, name string, image string, expresin string) {
	this.Id = id
	this.Type = _type
	this.MemberId = bson.ObjectIdHex(memberid)
	this.AccessToken = accesstoken
	this.Name = name
	this.Image = image
	//计算过期时间
	expresDuration, _ := time.ParseDuration(expresin + "s")
	this.ExpiresTime = time.Now().Add(expresDuration)
	//插入
	partyC.Insert(this)
}

/* 根据平台id和类型查询用户id */
func (this *Party) FindMember(id string, _type string) bool {
	err := partyC.Find(bson.M{"_id": id, "t": _type}).One(&this)
	if err != nil { //用户不存在
		return false
	}
	return true
}

/* 查询该id是否存在 */
func (this *Party) IdExist(id string) bool {
	err := partyC.Find(bson.M{"_id": id}).One(&this)
	if err != nil { //不存在
		return false
	}
	return true
}

/* 查询某用户绑定的平台信息 */
func (this *Party) FindBinds(memberId bson.ObjectId) []*Party {
	var result []*Party
	err := partyC.Find(bson.M{"mi": memberId}).All(&result)
	if err != nil {
		return nil
	}
	return result
}
