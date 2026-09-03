package handler

import (
	"encoding/json"
	"net/http"

	"infinite-canvas/service"
)

func UserProfile(w http.ResponseWriter, r *http.Request) {
	profile, err := service.CurrentUserProfile(r.Context())
	if err != nil {
		FailError(w, err)
		return
	}
	OK(w, profile)
}

func SaveUserProfile(w http.ResponseWriter, r *http.Request) {
	var request struct {
		DisplayName *string `json:"displayName"`
		AvatarURL   *string `json:"avatarUrl"`
		Email       *string `json:"email"`
	}
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		Fail(w, "资料参数无效")
		return
	}
	profile, err := service.SaveCurrentUserProfile(r.Context(), service.UserProfilePatch{
		DisplayName: request.DisplayName,
		AvatarURL: request.AvatarURL,
		Email: request.Email,
	})
	if err != nil {
		FailError(w, err)
		return
	}
	OK(w, profile)
}

func ChangePassword(w http.ResponseWriter, r *http.Request) {
	var request struct {
		OldPassword string `json:"oldPassword"`
		NewPassword string `json:"newPassword"`
	}
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		Fail(w, "密码参数无效")
		return
	}
	if err := service.ChangeCurrentUserPassword(r.Context(), request.OldPassword, request.NewPassword); err != nil {
		FailError(w, err)
		return
	}
	OK(w, true)
}

func UserCreditLogs(w http.ResponseWriter, r *http.Request) {
	logs, err := service.ListCurrentUserCreditLogs(r.Context(), parseQuery(r))
	if err != nil {
		FailError(w, err)
		return
	}
	OK(w, logs)
}
