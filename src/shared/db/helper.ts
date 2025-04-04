import { manageLocalStoreSpace } from "../../background/services/data";

export const handleClearTimeLineData = async (days: number) => {
  return await manageLocalStoreSpace(days)
};