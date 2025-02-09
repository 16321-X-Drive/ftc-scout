import { throttled } from "@ftc-scout/common";
import { CACHE_REQ, FTC_API_KEY } from "../constants";
import { FtcApiReq } from "../db/entities/FtcApiReq";

async function makeRequest(url: string): Promise<any | null> {
    console.info(`Making a request to ${url}`);

    const headers = {
        Authorization: `Basic ${FTC_API_KEY}`,
    };
    let response = await fetch(url, { headers });

    try {
        // Sometimes the api returns the html for a page if it doesn't have data. Fun!
        let text = (await response.text()).trim();
        let json = JSON.parse(text);
        return json;
    } catch (e) {
        console.error(`Failure while making a request to ${url}. Received error ${e}.`);
        return null;
    }
}

export const throttledMakeRequest = throttled(makeRequest, 250);

export async function getFromFtcApi(path: string, params: Record<string, any> = {}) {
    let paramsString = Object.entries(params)
        .map((x) => `${x[0]}=${x[1]}`)
        .join("&");
    let url = `https://ftc-api.firstinspires.org/v2.0/${path}?${paramsString}`;

    if (CACHE_REQ) {
        let req = await FtcApiReq.findOneBy({ url });
        if (req) {
            console.info(`Using cached resp for ${url}`);
            return req.resp;
        }
    }

    let resp = await throttledMakeRequest(url);

    if (CACHE_REQ && !!resp) {
        await FtcApiReq.create({ url, resp }).save({ chunk: 100 });
    }

    return resp;
}
