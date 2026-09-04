package service

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"strings"
	"time"

	"infinite-canvas/config"
	"infinite-canvas/model"
	"infinite-canvas/repository"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type TokenClaims struct {
	UserID   string         `json:"userId"`
	Username string         `json:"username"`
	Role     model.UserRole `json:"role"`
	jwt.RegisteredClaims
}

func EnsureDefaultAdmin() error {
	if strings.TrimSpace(config.Cfg.AdminUsername) == "" || strings.TrimSpace(config.Cfg.AdminPassword) == "" {
		return nil
	}
	WarnDefaultSecurityConfig()
	hasAdmin, err := repository.HasAdmin()
	if err != nil || hasAdmin {
		return err
	}
	hash, err := hashPassword(config.Cfg.AdminPassword)
	if err != nil {
		return err
	}
	_, err = repository.SaveUser(model.User{
		ID:        newID("user"),
		Username:  strings.TrimSpace(config.Cfg.AdminUsername),
		Password:  hash,
		Role:      model.UserRoleAdmin,
		AffCode:   newAffCode(),
		Status:    model.UserStatusActive,
		CreatedAt: now(),
		UpdatedAt: now(),
	})
	return err
}

func Register(username string, password string) (model.AuthSession, error) {
	settings, err := repository.GetSettings()
	if err != nil {
		return model.AuthSession{}, err
	}
	normalizedSettings := normalizeSettings(settings)
	if normalizedSettings.Public.Auth.AllowRegister != nil && !*normalizedSettings.Public.Auth.AllowRegister {
		return model.AuthSession{}, safeMessageError{message: "当前未开放注册"}
	}
	username = strings.TrimSpace(username)
	if strings.ContainsAny(username, " \t\r\n") {
		return model.AuthSession{}, safeMessageError{message: "用户名不能包含空格"}
	}
	if username == "" || password == "" {
		return model.AuthSession{}, safeMessageError{message: "用户名和密码不能为空"}
	}
	if _, ok, err := repository.GetUserByUsername(username); err != nil || ok {
		if err != nil {
			return model.AuthSession{}, err
		}
		return model.AuthSession{}, safeMessageError{message: "用户名已存在"}
	}
	hash, err := hashPassword(password)
	if err != nil {
		return model.AuthSession{}, err
	}
	user, err := repository.SaveUser(model.User{
		ID:        newID("user"),
		Username:  username,
		Password:  hash,
		Role:      model.UserRoleUser,
		AffCode:   newAffCode(),
		Status:    model.UserStatusActive,
		CreatedAt: now(),
		UpdatedAt: now(),
	})
	if err != nil {
		return model.AuthSession{}, err
	}
	return newSession(user)
}

func Login(username string, password string) (model.AuthSession, error) {
	user, ok, err := repository.GetUserByUsername(strings.TrimSpace(username))
	if err != nil {
		return model.AuthSession{}, err
	}
	if !ok || bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password)) != nil {
		return model.AuthSession{}, safeMessageError{message: "用户名或密码错误"}
	}
	if user.Status == model.UserStatusBan {
		return model.AuthSession{}, safeMessageError{message: "账号已被禁用"}
	}
	normalizeUserDefaults(&user)
	user.LastLoginAt = now()
	user.UpdatedAt = now()
	user, err = repository.SaveUser(user)
	if err != nil {
		return model.AuthSession{}, err
	}
	return newSession(user)
}

func ParseToken(tokenText string) (TokenClaims, error) {
	claims := TokenClaims{}
	token, err := jwt.ParseWithClaims(tokenText, &claims, func(token *jwt.Token) (any, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("登录状态无效")
		}
		return []byte(config.Cfg.JWTSecret), nil
	})
	if err != nil || !token.Valid {
		return TokenClaims{}, errors.New("登录状态无效")
	}
	return claims, nil
}

func CurrentAuthUser(tokenText string) (model.AuthUser, bool) {
	claims, err := ParseToken(tokenText)
	if err != nil {
		return model.AuthUser{}, false
	}
	user, ok, err := repository.GetUserByID(claims.UserID)
	if err != nil || !ok {
		return model.AuthUser{}, false
	}
	if user.Status == model.UserStatusBan {
		return model.AuthUser{}, false
	}
	return model.PublicUser(user), true
}

func ListUsers(q model.Query) (model.UserList, error) {
	users, total, err := repository.ListUsers(q)
	if err != nil {
		return model.UserList{}, err
	}
	for i := range users {
		users[i].Password = ""
		normalizeUserDefaults(&users[i])
	}
	return model.UserList{Items: users, Total: int(total)}, nil
}

func SaveUser(user model.User, password string) (model.User, error) {
	user.Username = strings.TrimSpace(user.Username)
	if strings.ContainsAny(user.Username, " \t\r\n") {
		return user, safeMessageError{message: "用户名不能包含空格"}
	}
	if user.Username == "" {
		return user, safeMessageError{message: "用户名不能为空"}
	}
	if user.Role == "" || user.Role == model.UserRoleGuest {
		user.Role = model.UserRoleUser
	}
	if user.Status == "" {
		user.Status = model.UserStatusActive
	}
	if saved, ok, err := repository.GetUserByUsername(user.Username); err != nil {
		return user, err
	} else if ok && saved.ID != user.ID {
		return user, safeMessageError{message: "用户名已存在"}
	}
	isCreate := user.ID == ""
	if isCreate {
		user.ID = newID("user")
		user.AffCode = newAffCode()
		user.CreatedAt = now()
	} else if saved, ok, err := repository.GetUserByID(user.ID); err != nil {
		return user, err
	} else if ok {
		user.CreatedAt = saved.CreatedAt
		user.Password = saved.Password
		user.AvatarURL = saved.AvatarURL
		user.Credits = saved.Credits
		user.Extra = saved.Extra
		if user.AffCode == "" {
			user.AffCode = saved.AffCode
		}
		if user.AffCode == "" {
			user.AffCode = newAffCode()
		}
		user.LastLoginAt = saved.LastLoginAt
	}
	if password != "" {
		hash, err := hashPassword(password)
		if err != nil {
			return user, err
		}
		user.Password = hash
	}
	if isCreate && user.Password == "" {
		return user, safeMessageError{message: "密码不能为空"}
	}
	user.UpdatedAt = now()
	user, err := repository.SaveUser(user)
	user.Password = ""
	return user, err
}

func AdjustUserCredits(id string, credits int) (model.User, error) {
	user, ok, err := repository.GetUserByID(id)
	if err != nil || !ok {
		if err != nil {
			return user, err
		}
		return user, safeMessageError{message: "用户不存在"}
	}
	oldCredits := user.Credits
	user.Credits = credits
	user.UpdatedAt = now()
	user, err = repository.SaveUser(user)
	if err == nil && oldCredits != credits {
		_, err = repository.SaveCreditLog(model.CreditLog{
			ID:        newID("credit"),
			UserID:    user.ID,
			Type:      model.CreditLogTypeAdminAdjust,
			Amount:    credits - oldCredits,
			Balance:   credits,
			RelatedID: newID("credit-adjust"),
			Remark:    "后台手动调整",
			CreatedAt: now(),
		})
	}
	user.Password = ""
	return user, err
}

func ConsumeUserCredits(userID string, modelName string, credits int, path string, relatedID string) error {
	if credits <= 0 {
		return nil
	}
	user, ok, err := repository.ConsumeUserCredits(userID, credits, now())
	if err != nil {
		return err
	}
	if !ok {
		return safeMessageError{message: "算力点不足"}
	}
	extra, _ := json.Marshal(map[string]string{"model": modelName, "path": path})
	_, err = repository.SaveCreditLog(model.CreditLog{
		ID:        newID("credit"),
		UserID:    userID,
		Type:      model.CreditLogTypeAIConsume,
		Amount:    -credits,
		Balance:   user.Credits,
		RelatedID: strings.TrimSpace(relatedID),
		Remark:    "调用模型 " + modelName,
		Extra:     string(extra),
		CreatedAt: now(),
	})
	return err
}

func RefundUserCredits(userID string, modelName string, credits int, path string, relatedID string) error {
	if credits <= 0 {
		return nil
	}
	user, ok, err := repository.RefundUserCredits(userID, credits, now())
	if err != nil {
		return err
	}
	if !ok {
		return safeMessageError{message: "用户不存在"}
	}
	extra, _ := json.Marshal(map[string]string{"model": modelName, "path": path})
	_, err = repository.SaveCreditLog(model.CreditLog{
		ID:        newID("credit"),
		UserID:    userID,
		Type:      model.CreditLogTypeAIRefund,
		Amount:    credits,
		Balance:   user.Credits,
		RelatedID: strings.TrimSpace(relatedID),
		Remark:    "模型调用失败返还 " + modelName,
		Extra:     string(extra),
		CreatedAt: now(),
	})
	return err
}

func ListCreditLogs(q model.Query) (model.CreditLogList, error) {
	logs, total, err := repository.ListCreditLogs(q)
	if err != nil {
		return model.CreditLogList{}, err
	}
	return model.CreditLogList{Items: logs, Total: int(total)}, nil
}

func SaveCreditLog(log model.CreditLog) (model.CreditLog, error) {
	if log.ID == "" {
		log.ID = newID("credit")
		log.CreatedAt = now()
	}
	if log.Type == model.CreditLogTypeAdminAdjust && strings.TrimSpace(log.RelatedID) == "" {
		log.RelatedID = newID("credit-adjust")
	}
	return repository.SaveCreditLog(log)
}

func DeleteCreditLog(id string) error {
	return repository.DeleteCreditLog(id)
}

func DeleteUser(id string) error {
	return repository.DeleteUser(id)
}

func GuestUser() model.AuthUser {
	return model.AuthUser{ID: "", Username: "guest", Role: model.UserRoleGuest}
}

func newSession(user model.User) (model.AuthSession, error) {
	token, err := newToken(user)
	if err != nil {
		return model.AuthSession{}, err
	}
	return model.AuthSession{Token: token, User: model.PublicUser(user)}, nil
}

func newToken(user model.User) (string, error) {
	expireHours := config.Cfg.JWTExpireHours
	if expireHours <= 0 {
		expireHours = 168
	}
	claims := TokenClaims{
		UserID:   user.ID,
		Username: user.Username,
		Role:     user.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Duration(expireHours) * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Subject:   user.ID,
		},
	}
	return jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString([]byte(config.Cfg.JWTSecret))
}

func hashPassword(password string) (string, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(hash), err
}

func now() string {
	return time.Now().Format(time.RFC3339)
}

func newID(prefix string) string {
	return prefix + "-" + uuid.NewString()
}

func NewCreditRelatedID() string {
	return newID("generation")
}

func newAffCode() string {
	return strings.ToUpper(strings.ReplaceAll(uuid.NewString()[:8], "-", ""))
}

func normalizeUserDefaults(user *model.User) {
	if user.Status == "" {
		user.Status = model.UserStatusActive
	}
	if user.AffCode == "" {
		user.AffCode = newAffCode()
	}
}

func RequestOrigin(r *http.Request) string {
	host := strings.TrimSpace(r.Header.Get("X-Forwarded-Host"))
	if host == "" {
		host = r.Host
	}
	proto := strings.TrimSpace(r.Header.Get("X-Forwarded-Proto"))
	if proto == "" {
		proto = "http"
	}
	return proto + "://" + host
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if strings.TrimSpace(value) != "" {
			return value
		}
	}
	return ""
}

func WarnDefaultSecurityConfig() {
	if config.Cfg.AdminUsername == "admin" && config.Cfg.AdminPassword == "infinite-canvas" {
		log.Println("WARNING: using default admin credentials, please set ADMIN_USERNAME and ADMIN_PASSWORD to safer values before deployment")
	}
}
