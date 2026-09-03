package handler

import (
	"encoding/json"
	"net/http"

	"infinite-canvas/model"
	"infinite-canvas/service"
)

// Skills 公开技能列表，画布节点按类型读取，仅返回已上架技能。
func Skills(w http.ResponseWriter, r *http.Request) {
	result, err := service.ListSkills(r.URL.Query().Get("nodeType"), true)
	if err != nil {
		FailError(w, err)
		return
	}
	OK(w, result)
}

// AdminSkills 管理后台技能列表，包含未上架技能。
func AdminSkills(w http.ResponseWriter, r *http.Request) {
	result, err := service.ListSkills(r.URL.Query().Get("nodeType"), false)
	if err != nil {
		FailError(w, err)
		return
	}
	OK(w, result)
}

func AdminSaveSkill(w http.ResponseWriter, r *http.Request) {
	var item model.Skill
	_ = json.NewDecoder(r.Body).Decode(&item)
	result, err := service.SaveSkill(item)
	if err != nil {
		FailError(w, err)
		return
	}
	OK(w, result)
}

func AdminDeleteSkill(w http.ResponseWriter, r *http.Request, id string) {
	if err := service.DeleteSkill(id); err != nil {
		FailError(w, err)
		return
	}
	OK(w, true)
}
