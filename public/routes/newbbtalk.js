import { get, post } from "../utils/getData.js";
import { HttpError } from "../utils/errors.js";
const noCache = false;
// 处理 /newbbtalk 路由
export const handleRoute = async (c, noCache) => {
    let from;
    let content;
    const appId = c.req.header("X-LC-Id");
    const appKey = c.req.header("X-LC-Key");
    if (!appId || !appKey) {
        throw new HttpError(401, '访问未经授权');
    }
    if (c.req.method == "POST") {
        const body = await c.req.parseBody();
        if (typeof body.from === 'string' && typeof body.content === 'string') {
            from = body.from;
            content = body.content;
        }
        else {
            throw new HttpError(500, 'POST 调用参数不合法');
        }
    }
    else {
        throw new HttpError(405, 'Method Not Allowed');
    }
    const body = JSON.stringify({ from, content });
    const { fromCache, data, updateTime } = await getList({ body, appId, appKey });
    const response = {
        code: data.status,
        message: "哔哔成功",
        objectId: data.objectId,
        createdAt: data.createdAt,
    };
    return response;
};
const getList = async ({ body, appId, appKey }) => {
    try {
        // 调用 LeanCloud API 提交新数据
        const url = 'https://leancloud.guole.fun/1.1/classes/content';
        const result = await post({
            url,
            headers: {
                'X-LC-Id': appId,
                'X-LC-Key': appKey,
                'Content-Type': 'application/json'
            },
            body: body,
            noCache,
        });
        await notifyCosFileUpdate();
        return result;
    }
    catch (error) {
        throw error;
    }
};
const notifyCosFileUpdate = async () => {
    try {
        const url = process.env.BBtalk_Upload_Url;
        const upload_response = await get({
            url,
            noCache,
            headers: {
                "token": process.env.token,
            },
        });
        return upload_response;
    }
    catch (error) {
        throw new HttpError(500, '通知 cos 更新 json 失败');
    }
};
