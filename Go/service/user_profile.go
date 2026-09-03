package service

import (
	"context"
	"errors"
	"strings"

	"infinite-canvas/model"
	"infinite-canvas/repository"
	"golang.org/x/crypto/bcrypt"
)

type UserProfilePatch struct {
	DisplayName *string
	AvatarURL   *string
	Email       *string
}

func CurrentUserProfile(ctx context.Context) (model.UserProfile, error) {
	user, ok := UserFromContext(ctx)
	if !ok || user.ID == "" {
		return model.UserProfile{}, errors.New("请先登录")
	}
	saved, found, err := repository.GetUserByID(user.ID)
	if err != nil {
		return model.UserProfile{}, err
	}
	if !found {
		return model.UserProfile{}, errors.New("用户不存在")
	}
	normalizeUserDefaults(&saved)
	return model.Profile(saved), nil
}

func SaveCurrentUserProfile(ctx context.Context, patch UserProfilePatch) (model.UserProfile, error) {
	user, ok := UserFromContext(ctx)
	if !ok || user.ID == "" {
		return model.UserProfile{}, errors.New("请先登录")
	}
	saved, found, err := repository.GetUserByID(user.ID)
	if err != nil {
		return model.UserProfile{}, err
	}
	if !found {
		return model.UserProfile{}, errors.New("用户不存在")
	}
	normalizeUserDefaults(&saved)
	if patch.DisplayName != nil {
		saved.DisplayName = strings.TrimSpace(*patch.DisplayName)
	}
	if patch.AvatarURL != nil {
		saved.AvatarURL = strings.TrimSpace(*patch.AvatarURL)
	}
	if patch.Email != nil {
		saved.Email = strings.TrimSpace(*patch.Email)
	}
	saved.UpdatedAt = now()
	saved, err = repository.SaveUser(saved)
	if err != nil {
		return model.UserProfile{}, err
	}
	return model.Profile(saved), nil
}

func ChangeCurrentUserPassword(ctx context.Context, oldPassword string, newPassword string) error {
	user, ok := UserFromContext(ctx)
	if !ok || user.ID == "" {
		return errors.New("请先登录")
	}
	if oldPassword == "" || newPassword == "" {
		return safeMessageError{message: "旧密码和新密码不能为空"}
	}
	if oldPassword == newPassword {
		return safeMessageError{message: "新密码不能与旧密码相同"}
	}
	saved, found, err := repository.GetUserByID(user.ID)
	if err != nil {
		return err
	}
	if !found || bcrypt.CompareHashAndPassword([]byte(saved.Password), []byte(oldPassword)) != nil {
		return safeMessageError{message: "旧密码不正确"}
	}
	hash, err := hashPassword(newPassword)
	if err != nil {
		return err
	}
	saved.Password = hash
	saved.UpdatedAt = now()
	_, err = repository.SaveUser(saved)
	return err
}

func ListCurrentUserCreditLogs(ctx context.Context, q model.Query) (model.CreditLogList, error) {
	user, ok := UserFromContext(ctx)
	if !ok || user.ID == "" {
		return model.CreditLogList{}, errors.New("请先登录")
	}
	logs, total, err := repository.ListCreditLogsByUser(user.ID, q)
	if err != nil {
		return model.CreditLogList{}, err
	}
	return model.CreditLogList{Items: logs, Total: int(total)}, nil
}
