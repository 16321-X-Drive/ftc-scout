import "isomorphic-fetch";
import { FTC_API_KEY } from "../constants";

let lastRequest = 0;

export async function makeRequest(
    url: string,
    params: Record<string, any> = {},
    sinceDate: Date | null
): Promise<any | null> {
    // Rate limit ourselves to 5 requests per second
    const REQUEST_TIME = 300;
    while (true) {
        let now = Date.now();

        if (lastRequest > now - REQUEST_TIME) {
            await new Promise((r) =>
                setTimeout(r, lastRequest + REQUEST_TIME - now)
            );
        } else {
            break;
        }
    }

    lastRequest = Date.now();

    const paramsString = Object.entries(params)
        .map((x) => `${x[0]}=${x[1]}`)
        .join("&");
    let fullUrl = `http://ftc-api.firstinspires.org/v2.0/${url}?${paramsString}`;
    console.log(`Making a request to ${fullUrl}`);
    let response = await fetch(fullUrl, {
        headers: {
            Authorization: `Basic ${FTC_API_KEY}`,
            "FMS-OnlyModifiedSince":
                sinceDate?.toLocaleDateString("en-US") ?? "",
        },
    });

    let text = (await response.text()).trim();
    // Sometimes the api returns the html for a page if it doesn't have data. Fun!
    if (text == "" || text.startsWith("<!DOCTYPE html>")) {
        return null;
    } else {
        try {
            return JSON.parse(text);
        } catch (e) {
            console.log(url, params, sinceDate, text);
            throw e;
        }
    }
}
