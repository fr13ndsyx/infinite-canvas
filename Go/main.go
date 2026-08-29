package main

import (
	"log"

	"infinite-canvas/config"
	"infinite-canvas/handler"
	"infinite-canvas/router"
	"infinite-canvas/service"
)

func main() {
	if err := config.Load(); err != nil {
		log.Fatal(err)
	}
	if err := service.EnsureDefaultAdmin(); err != nil {
		log.Fatal(err)
	}
	service.SeedImageAdapterConfigs()
	service.SeedVideoAdapterConfigs()
	service.StartCanvasProjectCleanupScheduler()
	handler.StartVideoTaskPoller()
	log.Fatal(router.New().Run(":" + config.Cfg.Port))
}
