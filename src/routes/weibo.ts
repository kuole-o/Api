import type { RouterData } from "../types.js";
import type { RouterType } from "../router.types.js";
import { get } from "../utils/getData.js";
import { getTime } from "../utils/getTime.js";

export const handleRoute = async (_: undefined, noCache: boolean) => {
  const { fromCache, data, updateTime } = await getList(noCache);
  const routeData: RouterData = {
    name: "weibo",
    title: "微博",
    type: "热搜榜",
    description: "实时热点，每分钟更新一次",
    link: "https://s.weibo.com/top/summary/",
    total: data?.length || 0,
    updateTime,
    fromCache,
    data: data.filter((item) =>!item.is_ad),
  };
  return routeData;
};

const getList = async (noCache: boolean) => {
  const url = `https://weibo.com/ajax/side/hotSearch`;
  const result = await get({ url, noCache, ttl: 60 });
  const list = result.data.data.realtime;
  return {
    fromCache: result.fromCache,
    updateTime: result.updateTime,
    data: list.map((v: RouterType["weibo"]) => {
      const key = v.word_scheme ? v.word_scheme : `#${v.word}`;
      console.log(v)
      return {
        id: v.mid,
        title: v.word,
        desc: v.note || key,
        author: v.flag_desc,
        timestamp: getTime(v.onboard_time),
        hot: v.num,
        text: determineHotness(v),
        url: `https://s.weibo.com/weibo?q=${encodeURIComponent(key)}&t=31&band_rank=1&Refer=top`,
        mobileUrl: `https://s.weibo.com/weibo?q=${encodeURIComponent(
          key,
        )}&t=31&band_rank=1&Refer=top`,
      };
    }),
  };
};

// 确定热度属性的逻辑
const determineHotness = (dataItem: RouterType["weibo"]) => {
  if (dataItem.flag_desc === "电影") return "影";
  if (dataItem.flag_desc === "剧集") return "剧";
  if (dataItem.flag_desc === "综艺") return "综";
  if (dataItem.flag_desc === "音乐") return "音";
  if (dataItem.icon_desc === "辟谣") return "谣";
  if (dataItem.is_boom) return "爆";
  if (dataItem.icon_desc) return "热";
  if (dataItem.is_fei) return "沸";
  if (dataItem.icon_desc) return "新";
  if (dataItem.is_warm) return "暖";
  return ""; // 没有特殊属性
};