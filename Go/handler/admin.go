package handler

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/tigerowo/infinite-canvas/model"
	"github.com/tigerowo/infinite-canvas/service"
)

type adminSyncRequest struct {
	Source string `json:"source"`
}

type adminBatchDeleteRequest struct {
	IDs []string `json:"ids"`
}

func AdminPromptSources(w http.ResponseWriter, r *http.Request) {
	OK(w, service.ListPromptSources())
}

func AdminSyncAllPromptSources(w http.ResponseWriter, r *http.Request) {
	service.SyncRemotePromptSources()
	OK(w, service.ListPromptSources())
}

func AdminCreatePromptSource(w http.ResponseWriter, r *http.Request) {
	var item model.PromptSource
	_ = json.NewDecoder(r.Body).Decode(&item)
	result, err := service.CreatePromptSource(item)
	if err != nil {
		FailError(w, err)
		return
	}
	OK(w, result)
}

func AdminUpdatePromptSource(w http.ResponseWriter, r *http.Request, source string) {
	var item model.PromptSource
	_ = json.NewDecoder(r.Body).Decode(&item)
	result, err := service.UpdatePromptSource(source, item)
	if err != nil {
		FailError(w, err)
		return
	}
	OK(w, result)
}

func AdminDeletePromptSource(w http.ResponseWriter, r *http.Request, source string) {
	if err := service.DeletePromptSource(source); err != nil {
		FailError(w, err)
		return
	}
	OK(w, true)
}

func AdminPrompts(w http.ResponseWriter, r *http.Request) {
	result, err := service.ListPrompts(parseQuery(r))
	if err != nil {
		FailError(w, err)
		return
	}
	OK(w, result)
}

func AdminSavePrompt(w http.ResponseWriter, r *http.Request) {
	var item model.Prompt
	_ = json.NewDecoder(r.Body).Decode(&item)
	result, err := service.SavePrompt(item)
	if err != nil {
		FailError(w, err)
		return
	}
	OK(w, result)
}

func AdminDeletePrompt(w http.ResponseWriter, r *http.Request, id string) {
	if err := service.DeletePrompt(id); err != nil {
		FailError(w, err)
		return
	}
	OK(w, true)
}

func AdminDeletePrompts(w http.ResponseWriter, r *http.Request) {
	var request adminBatchDeleteRequest
	_ = json.NewDecoder(r.Body).Decode(&request)
	if err := service.DeletePrompts(request.IDs); err != nil {
		FailError(w, err)
		return
	}
	OK(w, true)
}

func AdminSyncPromptSources(w http.ResponseWriter, r *http.Request) {
	var request adminSyncRequest
	_ = json.NewDecoder(r.Body).Decode(&request)
	log.Printf("sync prompt source start source=%s", request.Source)
	sources, err := service.SyncPromptSource(request.Source)
	if err != nil {
		log.Printf("sync prompt source failed source=%s err=%v", request.Source, err)
		FailError(w, err)
		return
	}
	log.Printf("sync prompt source done source=%s", request.Source)
	OK(w, sources)
}
