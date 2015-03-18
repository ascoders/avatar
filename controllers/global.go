package controllers

import (
	"bytes"
	"crypto/md5"
	"encoding/gob"
	"encoding/hex"
	"github.com/astaxie/beego"
	"github.com/astaxie/beego/validation"
	"github.com/deckarep/golang-set"
	"html"
	"regexp"
	"strconv"
	"strings"
)

type GlobalController struct {
	beego.Controller
}

func init() {
	//初始化beego验证提示信息
	validation.MessageTmpls = map[string]string{
		"Required":     "不能为空",
		"Min":          "最小值为 %d",
		"Max":          "最大值为 %d",
		"Range":        "范围为 %d ~ %d",
		"MinSize":      "最小长度为 %d",
		"MaxSize":      "最大长度为 %d",
		"Length":       "长度必须为 %d",
		"Alpha":        "必须为alpha字符",
		"Numeric":      "必须为数字",
		"AlphaNumeric": "必须为alpha字符或数字",
		"Match":        "必须匹配 %s",
		"NoMatch":      "必须不匹配 %s",
		"AlphaDash":    "必须为alpha字符或数字或横杠-_",
		"Email":        "必须为有效的邮箱地址",
		"IP":           "必须为有效的IP地址",
		"Base64":       "必须为有效base64编码",
		"Mobile":       "必须为有效手机号",
		"Tel":          "必须为有效固话",
		"Phone":        "必须为有效固话或手机号",
		"ZipCode":      "必须为有效邮政编码",
	}
}

/* ----------工具方法---------- */

/* 将[]string 转化为 []int */
func StringToIntArray(stringArray []string) []int {
	result := make([]int, len(stringArray))
	for k, _ := range stringArray {
		number, err := strconv.Atoi(stringArray[k])
		if err != nil { //转换错误
			return []int{}
		}
		result[k] = number
	}
	return result
}

/* 移除markdown标识 */
func RemoveMarkdown(content string) string {
	//html解码
	content = html.UnescapeString(content)
	//移除所有 * ` [ ] # - >
	content = strings.Replace(content, "*", "", -1)
	content = strings.Replace(content, "`", "", -1)
	content = strings.Replace(content, "[", "", -1)
	content = strings.Replace(content, "]", "", -1)
	content = strings.Replace(content, "#", "", -1)
	content = strings.Replace(content, "-", "", -1)
	content = strings.Replace(content, "> ", "", -1)
	//移除开头空格
	content = strings.Trim(content, "")
	return content
}

/*
 * 将新发布文章图片移动到指定文件夹
 * content *string 文章内容
 * prefix string 移动后前缀 eg: game/blog/123456000/123456000/123456000
 * @return int64 新增图片大小
 * @return string 更新地址后内容
 */
func HandleNewImage(content string, prefix string) (int64, string) {
	//匹配地址正则
	re, _ := regexp.Compile("\\([^()]+?(jpeg|jpg|png|gif|bmp)\\)")
	//正则将原文章内容所有图片地址都匹配出来
	images := re.FindAllString(content, -1)

	//取出路径
	for k, _ := range images {
		images[k] = strings.Replace(images[k], "http://avatar.img.wokugame.com/", "", 1)
		images[k] = strings.TrimLeft(images[k], "(")
		images[k] = strings.TrimRight(images[k], ")")
	}

	// 批量获取图片信息
	qiniu := &QiniuController{}
	infos := qiniu.GetInfos("avatar", images)

	// 计算总大小
	var size int64

	for k, _ := range infos {
		// 跳过未找到文件
		if infos[k].Code != 200 {
			continue
		}

		// 大小累加
		size += infos[k].Data.Fsize
	}

	// 移动后文件路径
	keyDest := make([]string, len(images))

	// 为移动后文件路径赋值,同时替换内容所有图片地址
	for k, _ := range images {
		keyDest[k] = strings.Replace(images[k], "temp/", prefix, 1)

		content = strings.Replace(content, images[k], keyDest[k], 1)
	}

	qiniu.MoveFiles("avatar", images, "avatar", keyDest)

	return size, content
}

/*
 * 删除编辑后删除的图片（必须包含前缀路径保证是此文章的）
 * 移动编辑后新增的图片（并返回更新路径后的内容）
 * content *string 文章内容
 * prefix string 移动后前缀 eg: game/blog/123456000/123456000/123456000
 * @return int64 新增图片大小
 * @return string 更新地址后内容
 */
func HandleUpdateImage(oldContent string, newContent string, prefix string) (int64, string) {
	// 匹配地址正则
	re, _ := regexp.Compile("\\([^()]+?(jpeg|jpg|png|gif|bmp)\\)")
	// 正则将原、新文章内容所有图片地址都匹配出来
	oldImages := re.FindAllString(oldContent, -1)
	newImages := re.FindAllString(newContent, -1)

	// 操作数组
	oldSetType := mapset.NewSet()
	newSetType := mapset.NewSet()

	// 取出路径
	for k, _ := range oldImages {
		oldImages[k] = strings.Replace(oldImages[k], "http://avatar.img.wokugame.com/", "", 1)
		oldImages[k] = strings.TrimLeft(oldImages[k], "(")
		oldImages[k] = strings.TrimRight(oldImages[k], ")")
		oldSetType.Add(oldImages[k])
	}
	for k, _ := range newImages {
		newImages[k] = strings.Replace(newImages[k], "http://avatar.img.wokugame.com/", "", 1)
		newImages[k] = strings.TrimLeft(newImages[k], "(")
		newImages[k] = strings.TrimRight(newImages[k], ")")
		newSetType.Add(newImages[k])
	}

	// 求交集
	intersect := oldSetType.Intersect(newSetType)

	// 求删除的部分（原图片数组与交集求差集）
	deletes := oldSetType.Difference(intersect)
	deletesSlice := deletes.ToSlice()

	// 求新增部分（新图片数组与交集求差集）
	adds := newSetType.Difference(intersect)
	addsSlice := adds.ToSlice()

	// 将被删除和新增部分组成[]string
	deletesArray := make([]string, len(deletesSlice))
	for k, _ := range deletesSlice {
		deletesArray[k] = deletesSlice[k].(string)

		// 如果不包含前缀（说明不是此文章的图片），则不能删除
		if !strings.Contains(deletesArray[k], prefix) {
			deletesArray[k] = ""
		}
	}
	addsArray := make([]string, len(addsSlice))
	for k, _ := range addsSlice {
		addsArray[k] = addsSlice[k].(string)
	}

	// 将删除的图片删除
	qiniu := &QiniuController{}
	qiniu.DeleteFiles("avatar", deletesArray)

	// 获取新增图片信息
	infos := qiniu.GetInfos("avatar", addsArray)

	// 计算总大小
	var size int64

	for k, _ := range infos {
		// 跳过未找到文件
		if infos[k].Code != 200 {
			continue
		}

		// 大小累加
		size += infos[k].Data.Fsize
	}

	// 移动后文件路径
	keyDest := make([]string, len(addsArray))

	// 为移动后文件路径赋值,同时替换内容所有图片地址
	for k, _ := range addsArray {
		keyDest[k] = strings.Replace(addsArray[k], "temp/", prefix, 1)

		newContent = strings.Replace(newContent, addsArray[k], keyDest[k], 1)
	}

	qiniu.MoveFiles("avatar", addsArray, "avatar", keyDest)

	return size, newContent
}

/* 查找markdown语法中的图片
 * @params content 文章内容
 * @params number 查找数量
 */
func FindImages(content string, number int) []string {
	re, _ := regexp.Compile("\\([^()]+?(jpeg|jpg|png|gif|bmp)\\)")
	imageArray := re.FindAllString(content, number)
	//返回结果
	result := make([]string, number)
	for k, _ := range imageArray {
		//替换括号
		imageArray[k] = strings.Replace(imageArray[k], "(", "", 1)
		imageArray[k] = strings.Replace(imageArray[k], ")", "", 1)
		result[k] = imageArray[k]
	}
	return result
}

/* md5简化用法 */
func MD5(text string) string {
	m := md5.New()
	m.Write([]byte(text))
	return hex.EncodeToString(m.Sum(nil))
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

/* 验证是否被恶意代理 */
func IsProxy(domain string) bool {
	if beego.RunMode == "prod" && domain != beego.AppConfig.String("webSite") && domain != beego.AppConfig.String("httpWebSite") {
		return true
	}
	return false
}

/* 判断是否在数组中 */
func inArray(key string, arr []string) bool {
	for k, _ := range arr {
		if arr[k] == key {
			return true
		}
	}
	return false
}
