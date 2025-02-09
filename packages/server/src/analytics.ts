import { Request, Response } from "express";
import { Analytics } from "./db/entities/Analytics";
import UAParser from "ua-parser-js";
import md5 from "md5";

export function handleAnalytics(req: Request, res: Response) {
    res.end();

    try {
        let parsed = JSON.parse(req.body);

        let url = parsed.url;
        let fromUrl = parsed.from;
        let sessionId = parsed.sessionId;
        let pathChanged = !!parsed.pathChanged;
        let time = +parsed.time;

        if (
            !url ||
            !time ||
            !sessionId ||
            typeof url != "string" ||
            (fromUrl != null && typeof fromUrl != "string") ||
            typeof sessionId != "string" ||
            Number.isNaN(time)
        ) {
            return;
        }

        let uaString = req.get("User-Agent");
        if (!uaString) return;

        let uaData = new UAParser(uaString).getResult();
        let browser = uaData.browser.name;
        let deviceType = uaData.device.type ?? "desktop";

        if (!browser || !deviceType) return;

        let ip = req.get("x-forwarded-for") ?? req.socket.remoteAddress;
        let userId = md5("ftcscout" + uaString + ip);

        Analytics.create({
            url,
            fromUrl,
            pathChanged,
            sessionId,
            userId,
            browser,
            deviceType,
            date: new Date(time),
        }).save({ chunk: 100 });
    } catch (e) {}
}
