import { useCallback, useEffect, useState } from "react";
import { App } from "antd";
import { APP_VERSION } from "@/constant/env";
import type { ReleaseInfo } from "@/lib/release";

const APP_VERSION_URL = "/api/app-version";
const POLL_INTERVAL = 10 * 60 * 1000;
const DISMISS_KEY = "infinite-canvas:dismissed-version";

function readDismissedVersion() {
    try {
        return sessionStorage.getItem(DISMISS_KEY) || "";
    } catch {
        return "";
    }
}

function writeDismissedVersion(version: string) {
    try {
        sessionStorage.setItem(DISMISS_KEY, version);
    } catch {
        // 忽略：sessionStorage 不可用（如隐私模式）时仅在当前状态内生效
    }
}

function toVersionParts(version: string) {
    const match = version.trim().match(/^v?(\d+)\.(\d+)\.(\d+)\.?(\d+)?/);
    return match ? match.slice(1).filter(Boolean).map(Number) : null;
}

function isNewerVersion(latestVersion: string, currentVersion: string) {
    const latest = toVersionParts(latestVersion);
    const current = toVersionParts(currentVersion);
    if (!latest || !current) return false;
    return latest.some((value, index) => value > current[index] && latest.slice(0, index).every((part, prevIndex) => part === current[prevIndex]));
}

export function useVersionCheck() {
    const currentVersion = APP_VERSION;
    const { message } = App.useApp();
    const [latestVersion, setLatestVersion] = useState(currentVersion);
    const [releases, setReleases] = useState<ReleaseInfo[]>([]);
    const [dismissedVersion, setDismissedVersion] = useState("");
    const [checking, setChecking] = useState(false);
    const [open, setOpen] = useState(false);
    const hasNewVersion = isNewerVersion(latestVersion, currentVersion);
    const latestRelease = releases.find((release) => release.version === latestVersion) || releases[0];
    const updateVisible = hasNewVersion && dismissedVersion !== latestVersion;

    const checkLatestRelease = useCallback(
        async (showMessage = false) => {
            setChecking(true);
            try {
                const response = await fetch(`${APP_VERSION_URL}?t=${Date.now()}`);
                if (!response.ok) throw new Error("版本读取失败");
                const data = await response.json();
                setLatestVersion(data.version || currentVersion);
                if (Array.isArray(data.releases)) setReleases(data.releases);
                if (showMessage) message.success("已获取最新版本信息");
                return true;
            } catch {
                if (showMessage) message.error("获取最新版本信息失败");
                return false;
            } finally {
                setChecking(false);
            }
        },
        [currentVersion, message],
    );

    useEffect(() => {
        setDismissedVersion(readDismissedVersion());
    }, []);

    useEffect(() => {
        void checkLatestRelease();
        const timer = window.setInterval(() => void checkLatestRelease(), POLL_INTERVAL);
        const handleVisibility = () => {
            if (document.visibilityState === "visible") void checkLatestRelease();
        };
        document.addEventListener("visibilitychange", handleVisibility);
        return () => {
            window.clearInterval(timer);
            document.removeEventListener("visibilitychange", handleVisibility);
        };
    }, [checkLatestRelease]);

    const openReleaseModal = useCallback(() => {
        setOpen(true);
        void checkLatestRelease();
    }, [checkLatestRelease]);

    const applyUpdate = useCallback(() => {
        window.location.reload();
    }, []);

    const dismissUpdate = useCallback(() => {
        setDismissedVersion(latestVersion);
        writeDismissedVersion(latestVersion);
    }, [latestVersion]);

    return {
        open,
        setOpen,
        openReleaseModal,
        latestVersion,
        latestRelease,
        releases,
        checking,
        hasNewVersion,
        updateVisible,
        checkLatestRelease,
        applyUpdate,
        dismissUpdate,
    };
}
