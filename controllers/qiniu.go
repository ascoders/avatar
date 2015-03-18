package controllers

import (
	"avatar/models"
	"github.com/astaxie/beego"
	. "github.com/qiniu/api/conf"
	"github.com/qiniu/api/rs"
	"github.com/qiniu/api/rsf"
	"io"
	"time"
)

/* ----------定义七牛API操作---------- */

func init() {
	ACCESS_KEY = beego.AppConfig.String("QINIU_ACCESS_KEY")
	SECRET_KEY = beego.AppConfig.String("QINIU_SECRET_KEY")
}

type QiniuController struct {
	beego.Controller
}

// 生成上传token
func (this *QiniuController) CreateUpToken() {
	ok, data := func() (bool, interface{}) {
		member := &models.Member{}

		var session interface{}
		if session = this.GetSession("ID"); session == nil {
			return false, "未登录"
		}

		if ok, _ := member.FindOne(session.(string)); !ok {
			return false, "用户不存在"
		}

		//判断用户今日上传容量是否达到10M
		if member.UploadSize > 10*1024*1024 {
			return false, "今日上传已达到限额"
		}

		// 生成上传到temp目录的token
		putPolicy := rs.PutPolicy{
			Scope:      "avatar",
			FsizeLimit: 500 * 1024, //最大500kb
			Expires:    uint32(time.Now().Unix()) + 60,
			ReturnBody: `
			{
			    "etag": "$(etag)",
				"ext":  "$(ext)",
				"name": "temp/$(year)/$(mon)/$(day)/$(etag)$(ext)",
				"type": "` + this.GetString("type") + `"
			}`,
			SaveKey: "temp/$(year)/$(mon)/$(day)/$(etag)$(ext)",
			//DetectMime: "image/*",
		}

		return true, putPolicy.Token(nil)
	}()

	this.Data["json"] = map[string]interface{}{
		"ok":   ok,
		"data": data,
	}
	this.ServeJson()
}

// 获得某个图片信息
func (this *QiniuController) GetInfo(bucketSrc string, keySrc string) (bool, rs.Entry) {
	rsCli := rs.New(nil)
	ret, err := rsCli.Stat(nil, bucketSrc, keySrc)

	return err == nil, ret
}

// 批量获取图片信息
func (this *QiniuController) GetInfos(bucketSrc string, keySrc []string) []rs.BatchStatItemRet {
	entryPathes := make([]rs.EntryPath, len(keySrc))

	// 赋值
	for k, _ := range entryPathes {
		entryPathes[k].Bucket = bucketSrc
		entryPathes[k].Key = keySrc[k]
	}

	var batchStatRets []rs.BatchStatItemRet

	rsCli := rs.New(nil)

	batchStatRets, err := rsCli.BatchStat(nil, entryPathes)

	if err != nil {
		return nil
	}

	return batchStatRets
}

// 移动某个文件
func (this *QiniuController) MoveFile(bucketSrc string, keySrc string, bucketDest string, keyDest string) bool {
	rsCli := rs.New(nil)
	err := rsCli.Move(nil, bucketSrc, keySrc, bucketDest, keyDest)

	return err == nil
}

// 批量移动文件
func (this *QiniuController) MoveFiles(bucketSrc string, keySrc []string, bucketDest string, keyDest []string) []rs.BatchItemRet {
	// 每个复制操作都含有源文件和目标文件
	entryPairs := make([]rs.EntryPathPair, len(keySrc))

	for k, _ := range entryPairs {
		entryPairs[k].Src.Bucket = bucketSrc
		entryPairs[k].Src.Key = keySrc[k]
		entryPairs[k].Dest.Bucket = bucketDest
		entryPairs[k].Dest.Key = keyDest[k]
	}

	rsCli := rs.New(nil)

	batchCopyRets, err := rsCli.BatchMove(nil, entryPairs)

	if err != nil {
		return nil
	}

	return batchCopyRets
}

// 删除某个文件
func (this *QiniuController) DeleteFile(bucketSrc string, keySrc string) bool {
	rsCli := rs.New(nil)
	err := rsCli.Delete(nil, bucketSrc, keySrc)

	return err == nil
}

// 批量删除文件
func (this *QiniuController) DeleteFiles(bucketSrc string, keySrc []string) bool {
	entryPathes := make([]rs.EntryPath, len(keySrc))

	// 赋值
	for k, _ := range entryPathes {
		entryPathes[k].Bucket = bucketSrc
		entryPathes[k].Key = keySrc[k]
	}

	rsCli := rs.New(nil)

	_, err := rsCli.BatchDelete(nil, entryPathes)

	return err == nil
}

// 获取指定前缀文件列表
func (this *QiniuController) listAll(bucketName string, prefix string) []rsf.ListItem {
	rsCli := rsf.New(nil)

	var entries []rsf.ListItem
	var marker = ""
	var err error
	var limit = 1000

	for err == nil {
		entries, marker, err = rsCli.ListPrefix(nil, bucketName, prefix, marker, limit)
	}
	if err != io.EOF {
		return nil
	}

	return entries
}

// 删除某个前缀下所有文件
func (this *QiniuController) DeleteAll(bucketName string, prefix string) {
	count := 1 //剩余文件总数

	for count != 0 {
		// 获取该前缀下文件列表
		lists := this.listAll(bucketName, prefix)

		count = len(lists)

		if count == 0 {
			continue
		}

		// 获取[]string列表
		all := make([]string, len(lists))
		for k, _ := range lists {
			all[k] = lists[k].Key
		}

		// 调用批量删除接口
		this.DeleteFiles("avatar", all)
	}

}
