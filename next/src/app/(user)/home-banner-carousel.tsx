"use client";

import { memo, useRef, useState, type PointerEvent } from "react";
import { Button, Modal } from "antd";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";

import { cn } from "@/lib/utils";

export type HomeBanner = {
    imageUrl: string;
    videoUrl?: string;
    linkUrl?: string;
    alt: string;
};

const BANNER_WIDTH = "min(calc(100vw - 2rem), clamp(420px, 34vw, 520px))";
const SIDE_BANNER_WIDTH = "min(calc(94vw - 1.88rem), clamp(394.8px, 31.96vw, 488.8px))";

const getBannerAngle = (offset: number) => offset === 0 ? 0 : offset < 0 ? 12 : -12;
const getBannerTransform = (offset: number) => `perspective(900px) rotateY(${getBannerAngle(offset)}deg)`;

const AnimatedBannerImage = memo(function AnimatedBannerImage({ src, alt }: { src: string; alt: string }) {
    return <img src={src} alt={alt} draggable={false} decoding="async" className="block h-full w-full select-none rounded-[inherit] object-cover" />;
});

export const HomeBannerCarousel = memo(function HomeBannerCarousel({ banners }: { banners: HomeBanner[] }) {
    const [activePosition, setActivePosition] = useState(0);
    const activeIndex =
        ((activePosition % banners.length) + banners.length) % banners.length;
    const [activeVideoUrl, setActiveVideoUrl] = useState("");
    const carouselRef = useRef<HTMLDivElement>(null);
    const pointerStartRef = useRef<number | null>(null);
    const draggedRef = useRef(false);
    const visibleBanners = [-1, 0, 1].map((offset) => {
        const position = activePosition + offset;
        const index =
            ((position % banners.length) + banners.length) % banners.length;

        return {
            banner: banners[index],
            index,
            offset,
            position,
        };
    });

    const changeBanner = (step: number) => {
        setActivePosition((current) => current + step);
    };

    const selectBanner = (index: number) => {
        setActivePosition((current) => {
            const currentIndex =
                ((current % banners.length) + banners.length) % banners.length;

            return current + index - currentIndex;
        });
    };

    const setCardTransitionDuration = (duration: string) => {
        carouselRef.current?.querySelectorAll<HTMLElement>("[data-banner-card]").forEach((card) => {
            card.style.transitionDuration = duration;
        });
    };

    const setDragOffset = (distance: number) => {
        carouselRef.current?.style.setProperty("--banner-drag-x", distance + "px");
        const progress = Math.max(-1, Math.min(1, distance / 160));
        carouselRef.current?.querySelectorAll<HTMLElement>("[data-banner-offset]").forEach((card) => {
            const offset = Number(card.dataset.bannerOffset);
            const baseAngle = getBannerAngle(offset);
            card.style.transform = "perspective(900px) rotateY(" + (baseAngle - progress * 12) + "deg)";
        });
    };

    const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
        pointerStartRef.current = event.clientX;
        draggedRef.current = false;
        setCardTransitionDuration("0ms");
        event.currentTarget.setPointerCapture(event.pointerId);
    };

    const handlePointerMove = (event: PointerEvent<HTMLButtonElement>) => {
        const start = pointerStartRef.current;
        if (start === null) return;
        const distance = Math.max(-180, Math.min(180, event.clientX - start));
        draggedRef.current = Math.abs(distance) > 4;
        setDragOffset(distance);
    };

    const finishDrag = (step = 0) => {
        pointerStartRef.current = null;
        setCardTransitionDuration("300ms");
        if (step) changeBanner(step);
        window.requestAnimationFrame(() => setDragOffset(0));
    };

    const handlePointerUp = (event: PointerEvent<HTMLButtonElement>) => {
        const start = pointerStartRef.current;
        if (start === null) return;
        const distance = event.clientX - start;
        draggedRef.current = Math.abs(distance) > 4;
        finishDrag(Math.abs(distance) > 60 ? (distance < 0 ? 1 : -1) : 0);
    };

    const handlePointerCancel = () => {
        draggedRef.current = false;
        finishDrag();
    };

    const openBanner = (
        banner: HomeBanner,
        index: number,
        position: number,
    ) => {
        if (draggedRef.current) {
            draggedRef.current = false;
            return;
        }

        if (index !== activeIndex) {
            setActivePosition(position);
            return;
        }

        if (banner.videoUrl) setActiveVideoUrl(banner.videoUrl);
        else if (banner.linkUrl) {
            window.open(banner.linkUrl, "_blank", "noopener,noreferrer");
        }
    };

    return (
        <>
            <style>{`
                @media (max-width: 639px) {
                    .home-banner-carousel-card {
                        width: ${BANNER_WIDTH} !important;
                        transform: none !important;
                    }

                    .home-banner-carousel-card[data-banner-offset="-1"] {
                        left: calc(-50% + var(--banner-drag-x, 0px)) !important;
                    }

                    .home-banner-carousel-card[data-banner-offset="0"] {
                        left: calc(50% + var(--banner-drag-x, 0px)) !important;
                    }

                    .home-banner-carousel-card[data-banner-offset="1"] {
                        left: calc(150% + var(--banner-drag-x, 0px)) !important;
                    }
                }
            `}</style>
            <div ref={carouselRef} className="relative h-[calc((100vw-2rem)*.5625+56px)] w-screen overflow-hidden sm:h-[350px] sm:overflow-visible">
                {visibleBanners.map(({ banner, index, offset, position }) => {
                    const active = offset === 0;
                    return (
                        <button
                            key={position}
                            type="button"
                            data-banner-card
                            data-banner-offset={offset}
                            className="home-banner-carousel-card absolute top-1/2 aspect-video rounded-2xl outline-none transition-[left,width,transform] duration-300 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-white/35"
                            style={{
                                left: offset === 0 ? "calc(50% + var(--banner-drag-x, 0px))" : offset < 0 ? `calc(50% - ${SIDE_BANNER_WIDTH} + 16px + var(--banner-drag-x, 0px))` : `calc(50% + ${SIDE_BANNER_WIDTH} - 16px + var(--banner-drag-x, 0px))`,
                                width: active ? BANNER_WIDTH : SIDE_BANNER_WIDTH,
                                translate: "-50% -50%",
                                zIndex: active ? 3 : 1,
                                transform: getBannerTransform(offset),
                                transformOrigin: "center center",
                                backfaceVisibility: "hidden",
                                touchAction: "pan-y",
                            }}
                            onPointerDown={handlePointerDown}
                            onPointerMove={handlePointerMove}
                            onPointerUp={handlePointerUp}
                            onPointerCancel={handlePointerCancel}
                            onClick={() => openBanner(banner, index, position)}
                            aria-label={banner.alt}
                        >
                            <span
                                aria-hidden
                                className={cn(
                                    "pointer-events-none absolute inset-0 rounded-2xl",
                                    active ? "shadow-[0_18px_44px_rgba(0,0,0,0.5)]" : "shadow-[0_8px_20px_rgba(0,0,0,0.2)]",
                                )}
                            />
                            <span
                                className="relative isolate block size-full overflow-hidden rounded-2xl bg-stone-100 dark:bg-stone-900"
                            >
                                <AnimatedBannerImage src={banner.imageUrl} alt={banner.alt} />
                                {active && banner.videoUrl ? (
                                    <span className="absolute inset-0 grid place-items-center bg-black/10">
                                        <span className="grid size-12 place-items-center rounded-full bg-black/55 text-white backdrop-blur">
                                            <Play className="ml-0.5 size-5 fill-current" />
                                        </span>
                                    </span>
                                ) : null}
                            </span>
                        </button>
                    );
                })}
                <Button type="text" shape="circle" className="!absolute !top-1/2 !z-10 !hidden !-translate-y-1/2 !bg-black/40 !text-white sm:!inline-flex" style={{ left: "calc(50% - min(742px, calc(50vw - 32px)))" }} icon={<ChevronLeft className="size-5" />} onClick={() => changeBanner(-1)} aria-label="上一张" />
                <Button type="text" shape="circle" className="!absolute !top-1/2 !z-10 !hidden !-translate-y-1/2 !bg-black/40 !text-white sm:!inline-flex" style={{ right: "calc(50% - min(742px, calc(50vw - 32px)))" }} icon={<ChevronRight className="size-5" />} onClick={() => changeBanner(1)} aria-label="下一张" />
            </div>
            <div className="mt-1 flex items-center justify-center gap-2" aria-label="Banner 切换">
                {banners.map((banner, index) => (
                    <button key={banner.imageUrl} type="button" className={cn("h-1.5 rounded-full transition-all", index === activeIndex ? "w-6 bg-stone-700 dark:bg-stone-200" : "w-2 bg-stone-300 dark:bg-stone-700")} onClick={() => selectBanner(index)} aria-label={"切换到第 " + (index + 1) + " 张"} />
                ))}
            </div>
            <Modal open={Boolean(activeVideoUrl)} footer={null} centered width={960} destroyOnHidden onCancel={() => setActiveVideoUrl("")}>
                {activeVideoUrl ? <video key={activeVideoUrl} src={activeVideoUrl} controls autoPlay playsInline className="max-h-[78vh] w-full bg-black object-contain" /> : null}
            </Modal>
        </>
    );
});
